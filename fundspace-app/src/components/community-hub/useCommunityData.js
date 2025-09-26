// src/components/community-hub/useCommunityData.js - OPTIMIZED: Use globalDataManager
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { addOrganizationEventListener } from '../../utils/organizationEvents';
import { getOrganizationInfoForCommunity } from '../../utils/membershipQueries.js';
import { POSTS_PER_PAGE, getOrgBaseType } from './constants';
import globalDataManager from '../../utils/globalDataManager.js'; // ✅ ADD THIS IMPORT

export const useCommunityData = (profile) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [organizationInfo, setOrganizationInfo] = useState(null);

  // Set up organization listener
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

  // Fetch organization info
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

  // ✅ OPTIMIZED: Fetch posts function using globalDataManager
  const fetchPosts = async (pageNum, channelConfig) => {
    if (!channelConfig || channelConfig.disabled) {
      setLoading(false);
      return;
    }

    try {
      let postsData;
      
      if (channelConfig.id === 'hello-world') {
        // ✅ BEFORE (Direct query causing individual posts API calls):
        // const { data, error } = await supabase
        //   .from('posts')
        //   .select(`*, profiles:profile_id(...)`)
        //   .eq('channel', 'hello-world')

        // ✅ AFTER (Use globalDataManager for batched loading):
        if (pageNum === 0) {
          // First page - use globalDataManager
          postsData = await globalDataManager.getPostsByChannel('hello-world', POSTS_PER_PAGE);
        } else {
          // Subsequent pages - fallback to direct query with range
          const { data, error } = await supabase
            .from('posts')
            .select(`*, profiles:profile_id(id, full_name, avatar_url, title, organization_name, role, organization_type)`)
            .eq('channel', 'hello-world')
            .order('created_at', { ascending: false })
            .range(pageNum * POSTS_PER_PAGE, (pageNum + 1) * POSTS_PER_PAGE - 1);
          
          if (error) throw error;
          postsData = data;
        }
        
      } else if (channelConfig.id === 'hello-community') {
        const userOrgType = getOrgBaseType(organizationInfo?.type);
        if (!userOrgType) {
          setLoading(false);
          return;
        }

        // ✅ OPTIMIZED: Use globalDataManager for community posts
        if (pageNum === 0) {
          // First page - use globalDataManager
          postsData = await globalDataManager.getPostsByChannel(channelConfig.dbChannel, POSTS_PER_PAGE);
        } else {
          // Subsequent pages - fallback to direct query
          const { data, error } = await supabase
            .from('posts')
            .select(`*, profiles:profile_id(id, full_name, avatar_url, title, organization_name, role, organization_type)`)
            .eq('channel', channelConfig.dbChannel)
            .order('created_at', { ascending: false })
            .range(pageNum * POSTS_PER_PAGE, (pageNum + 1) * POSTS_PER_PAGE - 1);
          
          if (error) throw error;
          postsData = data;
        }
      } else {
        postsData = [];
      }

      if (postsData && postsData.length > 0) {
        // ✅ OPTIMIZED: Batch load reactions instead of individual queries
        const postIds = postsData.map(post => post.id);
        
        // Use globalDataManager for batched reactions loading
        const reactionsData = await globalDataManager.getPostLikes(postIds);

        const enrichedPosts = postsData.map(post => {
          const postReactions = reactionsData[post.id];
          return {
            ...post,
            reactions: {
              summary: postReactions?.reaction_summary || [],
              sample: []
            }
          };
        });

        setPosts(prev => pageNum === 0 ? enrichedPosts : [...prev, ...enrichedPosts]);
        if (enrichedPosts.length < POSTS_PER_PAGE) setHasMore(false);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle new post
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

  // Handle delete post
  const handleDeletePost = useCallback((deletedPostId) => {
    setPosts(prev => prev.filter(p => p.id !== deletedPostId));
  }, []);

  // Reset posts when channel changes
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