import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { addOrganizationEventListener } from '../../utils/organizationEvents';
import { getOrganizationInfoForCommunity } from '../../utils/membershipQueries.js';
import { POSTS_PER_PAGE, getOrgBaseType } from './constants';
import { getDashboardData } from '../../utils/rpcClientFunctions';

export const useCommunityData = (profile) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [organizationInfo, setOrganizationInfo] = useState(null);

  useEffect(() => {
    if (!profile?.id) return;
    
    const cleanup = addOrganizationEventListener('organizationChanged', (event) => {
      const { profileId, organization } = event.detail;
      if (profileId === profile.id) {
        setOrganizationInfo(organization ? {
          id: organization.id,
          name: organization.name,
          type: organization.type,
          tagline: organization.tagline,
          image_url: organization.image_url,
          role: 'member'
        } : null);
      }
    });

    return cleanup;
  }, [profile?.id]);

  useEffect(() => {
    const fetchOrganizationInfo = async () => {
      if (!profile?.id) return;
      
      try {
        const orgData = await getOrganizationInfoForCommunity(profile.id);
        setOrganizationInfo(orgData);
      } catch (err) {
        console.error('Error fetching organization info:', err);
        setOrganizationInfo(null);
      }
    };
    
    fetchOrganizationInfo();
  }, [profile?.id]);

  const fetchPosts = async (pageNum, channelConfig) => {
    if (!channelConfig || channelConfig.disabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Always use RPC - get from dashboard data
      const dashboardData = await getDashboardData(profile?.id);
      const allPosts = dashboardData?.posts || [];
      
      // Filter by channel
      const channelPosts = allPosts.filter(post => post.channel === channelConfig.dbChannel);
      
      if (pageNum === 0) {
        setPosts(channelPosts);
      } else {
        // For pagination, append
        const start = pageNum * POSTS_PER_PAGE;
        const pagePosts = channelPosts.slice(start, start + POSTS_PER_PAGE);
        setPosts(prevPosts => [...prevPosts, ...pagePosts]);
      }
      
      if (channelPosts.length < (pageNum + 1) * POSTS_PER_PAGE) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const handleNewPost = useCallback((newPostData) => {
    const postWithOrgInfo = {
      ...newPostData,
      profiles: {
        ...profile,
        organization_name: organizationInfo?.name || profile?.organization_name,
        organization_type: organizationInfo?.type || profile?.organization_type,
      },
      reactions: { summary: [], sample: [] },
      likes_count: 0,
      comments_count: 0
    };
    setPosts(prev => [postWithOrgInfo, ...prev]);
  }, [profile, organizationInfo]);

  const handleDeletePost = useCallback((deletedPostId) => {
    setPosts(prev => prev.filter(p => p.id !== deletedPostId));
  }, []);

  const resetPosts = () => {
    setPosts([]);
    setPage(0);
    setHasMore(true);
    setLoading(true);
  };

  return {
    posts,
    loading,
    page,
    hasMore,
    organizationInfo,
    fetchPosts,
    handleNewPost,
    handleDeletePost,
    resetPosts,
    setPage,
    setLoading
  };
};