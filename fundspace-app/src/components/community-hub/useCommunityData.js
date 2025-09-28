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
      let postsData;
      
      if (channelConfig.id === 'hello-world') {
        if (pageNum === 0) {
          const dashboardData = await getDashboardData(profile?.id);
          postsData = dashboardData?.posts?.filter(post => post.channel === 'hello-world') || [];
        } else {
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

        if (pageNum === 0) {
          const dashboardData = await getDashboardData(profile?.id);
          postsData = dashboardData?.posts?.filter(post => post.channel === channelConfig.dbChannel) || [];
        } else {
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
        const postIds = postsData.map(post => post.id);
        
        let reactionsData = {};
        if (pageNum === 0) {
          const dashboardData = await getDashboardData(profile?.id);
          if (dashboardData?.post_likes) {
            dashboardData.post_likes.forEach(like => {
              if (postIds.includes(like.post_id)) {
                if (!reactionsData[like.post_id]) {
                  reactionsData[like.post_id] = { reaction_summary: [] };
                }
                reactionsData[like.post_id].reaction_summary.push(like);
              }
            });
          }
        } else {
          const { data: reactions } = await supabase
            .from('post_reactions')
            .select('post_id, reaction_type, user_id')
            .in('post_id', postIds);
          
          if (reactions) {
            reactions.forEach(reaction => {
              if (!reactionsData[reaction.post_id]) {
                reactionsData[reaction.post_id] = { reaction_summary: [] };
              }
              reactionsData[reaction.post_id].reaction_summary.push(reaction);
            });
          }
        }

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