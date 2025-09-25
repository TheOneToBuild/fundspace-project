// src/hooks/usePageDataLoader.js - Coordinates all page-level data loading
import { useState, useEffect, useCallback } from 'react';
import globalDataManager from '../utils/globalDataManager';

export function usePageDataLoader() {
  const [pageData, setPageData] = useState({});
  const [loading, setLoading] = useState(false);

  // Load data for posts page (community hub, profile feed, etc)
  const loadPostsPageData = useCallback(async (posts) => {
    if (!posts || posts.length === 0) return {};

    setLoading(true);
    
    try {
      // Extract all the data we need to fetch
      const postIds = posts.map(p => p.id);
      const authorIds = posts.map(p => p.profile_id || p.user_id).filter(Boolean);
      const uniqueAuthorIds = [...new Set(authorIds)];

      // Batch load all data simultaneously
      const [postLikesData, profilesData, orgMembershipsData, commentsData] = await Promise.all([
        globalDataManager.getPostLikes(postIds),
        globalDataManager.getProfiles(uniqueAuthorIds),
        globalDataManager.getOrganizationMemberships(uniqueAuthorIds),
        globalDataManager.getPostComments(postIds)
      ]);

      const combinedData = {
        postLikes: postLikesData,
        profiles: profilesData,
        orgMemberships: orgMembershipsData,
        comments: commentsData
      };

      setPageData(combinedData);
      return combinedData;

    } catch (error) {
      console.error('Error loading posts page data:', error);
      return {};
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data for connections page
  const loadConnectionsPageData = useCallback(async (connections, pendingRequests) => {
    setLoading(true);
    
    try {
      const allUserIds = [
        ...connections.map(c => c.user?.id).filter(Boolean),
        ...pendingRequests.map(r => r.user_profile?.id).filter(Boolean)
      ];
      const uniqueUserIds = [...new Set(allUserIds)];

      const [profilesData, orgMembershipsData] = await Promise.all([
        globalDataManager.getProfiles(uniqueUserIds),
        globalDataManager.getOrganizationMemberships(uniqueUserIds)
      ]);

      const combinedData = {
        profiles: profilesData,
        orgMemberships: orgMembershipsData
      };

      setPageData(combinedData);
      return combinedData;

    } catch (error) {
      console.error('Error loading connections page data:', error);
      return {};
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data for profile page
  const loadProfilePageData = useCallback(async (profileId, posts) => {
    setLoading(true);
    
    try {
      const postIds = posts?.map(p => p.id) || [];
      const authorIds = posts?.map(p => p.profile_id || p.user_id).filter(Boolean) || [];
      const allUserIds = [...new Set([profileId, ...authorIds])];

      const [postLikesData, profilesData, orgMembershipsData] = await Promise.all([
        postIds.length > 0 ? globalDataManager.getPostLikes(postIds) : Promise.resolve({}),
        globalDataManager.getProfiles(allUserIds),
        globalDataManager.getOrganizationMemberships([profileId])
      ]);

      const combinedData = {
        postLikes: postLikesData,
        profiles: profilesData,
        orgMemberships: orgMembershipsData
      };

      setPageData(combinedData);
      return combinedData;

    } catch (error) {
      console.error('Error loading profile page data:', error);
      return {};
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear page data when navigating away
  const clearPageData = useCallback(() => {
    setPageData({});
    globalDataManager.clearCache(); // Clear global cache
  }, []);

  return {
    pageData,
    loading,
    loadPostsPageData,
    loadConnectionsPageData,
    loadProfilePageData,
    clearPageData
  };
}

// Enhanced PostCard hook that uses page data
export function useEnhancedPostCard(post, pageData) {
  const [enhancedPost, setEnhancedPost] = useState(post);

  useEffect(() => {
    if (!post || !pageData) {
      setEnhancedPost(post);
      return;
    }

    // Enhance post with batched data
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
      // Enhanced author info
      profiles: authorProfile ? {
        ...post.profiles,
        ...authorProfile,
        organization_name: authorOrgMembership?.organization?.name || authorProfile.organization_name,
        organization_type: authorOrgMembership?.organization?.type || authorProfile.organization_type,
        role: authorOrgMembership?.role || authorProfile.role
      } : post.profiles,
      // Preload reactors to avoid separate API calls
      _reactors: postLikes.reactors
    };

    setEnhancedPost(enhanced);
  }, [post, pageData]);

  return enhancedPost;
}