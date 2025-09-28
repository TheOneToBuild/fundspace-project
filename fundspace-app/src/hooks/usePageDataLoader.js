import { useState, useEffect, useCallback } from 'react';
import { getDashboardData, getUserProfileComplete, getBatchConnectionStatus } from '../utils/rpcClientFunctions';

export function usePageDataLoader() {
  const [pageData, setPageData] = useState({});
  const [loading, setLoading] = useState(false);

  const loadPostsPageData = useCallback(async (posts) => {
    if (!posts || posts.length === 0) return {};

    setLoading(true);
    
    try {
      const uniqueAuthorIds = [...new Set(posts.map(p => p.profile_id || p.user_id).filter(Boolean))];

      if (uniqueAuthorIds.length > 0) {
        const profilesData = await Promise.all(
          uniqueAuthorIds.map(id => getUserProfileComplete(id))
        );

        const combinedData = {
          profiles: {},
          postLikes: {},
          orgMemberships: {}
        };

        profilesData.forEach((data, index) => {
          if (data) {
            const userId = uniqueAuthorIds[index];
            combinedData.profiles[userId] = data.profile;
            combinedData.orgMemberships[userId] = data.organization_membership;
            
            if (data.posts) {
              data.posts.forEach(post => {
                if (post.likes_data) {
                  combinedData.postLikes[post.id] = post.likes_data;
                }
              });
            }
          }
        });

        setPageData(combinedData);
        return combinedData;
      }

      return {};
    } catch (error) {
      console.error('Error loading posts page data:', error);
      return {};
    } finally {
      setLoading(false);
    }
  }, []);

  const loadConnectionsPageData = useCallback(async (connections, pendingRequests, currentUserId) => {
    setLoading(true);
    
    try {
      const allUserIds = [
        ...connections.map(c => c.user?.id).filter(Boolean),
        ...pendingRequests.map(r => r.user_profile?.id).filter(Boolean)
      ];
      const uniqueUserIds = [...new Set(allUserIds)];

      const [profilesData, connectionStatusData] = await Promise.all([
        Promise.all(uniqueUserIds.map(id => getUserProfileComplete(id))),
        currentUserId && uniqueUserIds.length > 0 ? getBatchConnectionStatus(currentUserId, uniqueUserIds) : Promise.resolve({})
      ]);

      const combinedData = {
        profiles: {},
        orgMemberships: {},
        connectionStatuses: connectionStatusData?.connections || {}
      };

      profilesData.forEach((data, index) => {
        if (data) {
          const userId = uniqueUserIds[index];
          combinedData.profiles[userId] = data.profile;
          combinedData.orgMemberships[userId] = data.organization_membership;
        }
      });

      setPageData(combinedData);
      return combinedData;
    } catch (error) {
      console.error('Error loading connections page data:', error);
      return {};
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProfilePageData = useCallback(async (profileId, posts) => {
    setLoading(true);
    
    try {
      const profileData = await getUserProfileComplete(profileId);
      
      if (!profileData) {
        return {};
      }

      const combinedData = {
        profiles: { [profileId]: profileData.profile },
        orgMemberships: { [profileId]: profileData.organization_membership },
        postLikes: {},
        posts: profileData.posts || []
      };

      if (profileData.posts) {
        profileData.posts.forEach(post => {
          if (post.likes_data) {
            combinedData.postLikes[post.id] = post.likes_data;
          }
        });
      }

      setPageData(combinedData);
      return combinedData;
    } catch (error) {
      console.error('Error loading profile page data:', error);
      return {};
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDashboardPageData = useCallback(async (userId) => {
    setLoading(true);
    
    try {
      const dashboardData = await getDashboardData(userId);
      
      if (!dashboardData) {
        return {};
      }

      const combinedData = {
        posts: dashboardData.posts || [],
        grants: dashboardData.recent_grants || [],
        organizations: dashboardData.trending_organizations || [],
        profiles: {},
        postLikes: {}
      };

      if (dashboardData.posts) {
        dashboardData.posts.forEach(post => {
          if (post.profile) {
            combinedData.profiles[post.profile.id] = post.profile;
          }
          if (post.likes_data) {
            combinedData.postLikes[post.id] = post.likes_data;
          }
        });
      }

      setPageData(combinedData);
      return combinedData;
    } catch (error) {
      console.error('Error loading dashboard page data:', error);
      return {};
    } finally {
      setLoading(false);
    }
  }, []);

  const clearPageData = useCallback(() => {
    setPageData({});
  }, []);

  return {
    pageData,
    loading,
    loadPostsPageData,
    loadConnectionsPageData,
    loadProfilePageData,
    loadDashboardPageData,
    clearPageData
  };
}

export function useEnhancedPostCard(post, pageData) {
  const [enhancedPost, setEnhancedPost] = useState(post);

  useEffect(() => {
    if (!post || !pageData) {
      setEnhancedPost(post);
      return;
    }

    const postLikes = pageData.postLikes?.[post.id] || {
      likes_count: post.likes_count || 0,
      reaction_summary: post.reactions?.summary || [],
      reactors: []
    };

    const authorProfile = pageData.profiles?.[post.profile_id || post.user_id];
    const authorOrgMembership = pageData.orgMemberships?.[post.profile_id || post.user_id];

    const enhanced = {
      ...post,
      likes_count: postLikes.likes_count,
      reactions: {
        summary: postLikes.reaction_summary,
        sample: postLikes.reactors.slice(0, 3)
      },
      profiles: authorProfile ? {
        ...post.profiles,
        ...authorProfile,
        organization_name: authorOrgMembership?.organization?.name || authorProfile.organization_name,
        organization_type: authorOrgMembership?.organization?.type || authorProfile.organization_type,
        role: authorOrgMembership?.role || authorProfile.role
      } : post.profiles,
      _reactors: postLikes.reactors
    };

    setEnhancedPost(enhanced);
  }, [post, pageData]);

  return enhancedPost;
}