// src/hooks/useOptimizedOrganizationData.js - Optimized organization data hook with batching
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import globalDataManager from '../utils/globalDataManager';

// Organization data manager for batching all organization-related queries
class OrganizationDataManager {
  constructor() {
    this.cache = new Map();
    this.CACHE_TTL = 30000; // 30 seconds
  }

  getCacheKey(type, params) {
    return `org-${type}-${JSON.stringify(params)}`;
  }

  isValidCache(cacheItem) {
    return cacheItem && (Date.now() - cacheItem.timestamp) < this.CACHE_TTL;
  }

  setCache(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  getCache(key) {
    const item = this.cache.get(key);
    return this.isValidCache(item) ? item.data : null;
  }

  // Batch load all organization data
  async loadAllOrganizationData(organizationId, userId) {
    const cacheKey = this.getCacheKey('all-data', { organizationId, userId });
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      // Execute all organization queries in parallel
      const [
        organizationResult,
        membersResult,
        userMembershipResult,
        organizationPostsResult,
        organizationPhotosResult,
        organizationProgramsResult,
        organizationNorthStarsResult
      ] = await Promise.all([
        // Get organization details
        supabase
          .from('organizations')
          .select('*')
          .eq('id', organizationId)
          .single(),
        
        // Get organization members
        supabase
          .from('organization_memberships')
          .select(`
            id, profile_id, role, joined_at, functional_role, membership_type, is_public,
            profiles!organization_memberships_profile_id_fkey(
              id, full_name, avatar_url, title, email
            )
          `)
          .eq('organization_id', organizationId)
          .eq('is_public', true),
        
        // Get user's membership
        supabase
          .from('organization_memberships')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('profile_id', userId)
          .maybeSingle(),
        
        // Get organization posts
        supabase
          .from('organization_posts')
          .select(`
            id, content, created_at, image_urls, likes_count, comments_count,
            profiles!organization_posts_profile_id_fkey(
              id, full_name, avatar_url, title
            )
          `)
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false })
          .limit(20),
        
        // Get organization photos
        supabase
          .from('organization_photos')
          .select('id, image_url, caption, created_at, likes_count, comments_count')
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false })
          .limit(20),
        
        // Get organization programs
        supabase
          .from('organization_programs')
          .select('*')
          .eq('organization_id', organizationId)
          .limit(10),
        
        // Get organization north stars
        supabase
          .from('organization_north_stars')
          .select('*')
          .eq('organization_id', organizationId)
      ]);

      // Process organization posts with batched likes data
      let processedPosts = [];
      if (organizationPostsResult.data?.length > 0) {
        const postIds = organizationPostsResult.data.map(p => p.id);
        
        // Use global data manager for organization post likes
        const { data: postLikesData } = await supabase
          .from('organization_post_likes')
          .select('organization_post_id, user_id, reaction_type')
          .in('organization_post_id', postIds);

        // Group likes by post
        const likesByPost = {};
        postLikesData?.forEach(like => {
          if (!likesByPost[like.organization_post_id]) {
            likesByPost[like.organization_post_id] = [];
          }
          likesByPost[like.organization_post_id].push(like);
        });

        // Process posts with like data
        processedPosts = organizationPostsResult.data.map(post => {
          const postLikes = likesByPost[post.id] || [];
          const reactionCounts = {};
          postLikes.forEach(like => {
            const type = like.reaction_type || 'like';
            reactionCounts[type] = (reactionCounts[type] || 0) + 1;
          });

          return {
            ...post,
            likes_count: postLikes.length,
            reactions: {
              summary: Object.entries(reactionCounts).map(([type, count]) => ({ type, count })),
              sample: postLikes.slice(0, 3)
            }
          };
        });
      }

      // Collect member user IDs for batch profile enhancement
      const memberUserIds = membersResult.data?.map(m => m.profile_id) || [];
      
      // Batch load organization memberships for enhanced member data
      const orgMembershipsData = memberUserIds.length > 0 
        ? await globalDataManager.getOrganizationMemberships(memberUserIds)
        : {};

      // Enhanced members with organization data
      const enhancedMembers = membersResult.data?.map(member => {
        const orgMembership = orgMembershipsData[member.profile_id];
        return {
          ...member,
          profiles: {
            ...member.profiles,
            organization_name: orgMembership?.organization?.name || member.profiles?.organization_name,
            organization_type: orgMembership?.organization?.type || member.profiles?.organization_type,
            enhanced_role: orgMembership?.role || member.role
          }
        };
      }) || [];

      const result = {
        organization: organizationResult.data,
        members: enhancedMembers,
        userMembership: userMembershipResult.data,
        organizationPosts: processedPosts,
        organizationPhotos: organizationPhotosResult.data || [],
        organizationPrograms: organizationProgramsResult.data || [],
        organizationNorthStars: organizationNorthStarsResult.data || []
      };

      this.setCache(cacheKey, result);
      return result;

    } catch (error) {
      console.error('Error loading organization data:', error);
      return {
        organization: null,
        members: [],
        userMembership: null,
        organizationPosts: [],
        organizationPhotos: [],
        organizationPrograms: [],
        organizationNorthStars: []
      };
    }
  }

  clearCache() {
    this.cache.clear();
  }
}

const organizationDataManager = new OrganizationDataManager();

export function useOptimizedOrganizationData(profile, session) {
  const [state, setState] = useState({
    organization: null,
    members: [],
    userMembership: null,
    organizationPosts: [],
    organizationPhotos: [],
    organizationPrograms: [],
    organizationNorthStars: [],
    loading: false,
    error: null
  });

  const setError = useCallback((error) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  // Check user membership and get organization ID
  const checkMembership = useCallback(async () => {
    if (!profile?.id) return null;

    try {
      const { data, error } = await supabase
        .from('organization_memberships')
        .select('organization_id, role')
        .eq('profile_id', profile.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking membership:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in checkMembership:', error);
      return null;
    }
  }, [profile?.id]);

  // Fetch all organization data with batching
  const fetchOrganizationData = useCallback(async () => {
    if (!profile?.id) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // First check membership to get organization ID
      const membership = await checkMembership();
      
      if (!membership?.organization_id) {
        setState(prev => ({
          ...prev,
          loading: false,
          organization: null,
          userMembership: null,
          members: []
        }));
        return;
      }

      // Load all organization data in batches
      const data = await organizationDataManager.loadAllOrganizationData(
        membership.organization_id,
        profile.id
      );

      setState(prev => ({
        ...prev,
        loading: false,
        organization: data.organization,
        members: data.members,
        userMembership: data.userMembership,
        organizationPosts: data.organizationPosts,
        organizationPhotos: data.organizationPhotos,
        organizationPrograms: data.organizationPrograms,
        organizationNorthStars: data.organizationNorthStars
      }));

    } catch (error) {
      console.error('Error fetching organization data:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load organization data'
      }));
    }
  }, [profile?.id, checkMembership]);

  // Update organization
  const updateOrganization = useCallback(async (updates) => {
    if (!state.organization?.id) return;

    try {
      const { data, error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', state.organization.id)
        .select()
        .single();

      if (error) throw error;

      setState(prev => ({
        ...prev,
        organization: data
      }));

      // Clear cache to reflect updates
      organizationDataManager.clearCache();
      
    } catch (error) {
      console.error('Error updating organization:', error);
      setError('Failed to update organization');
    }
  }, [state.organization?.id, setError]);

  // Execute leave organization
  const executeLeave = useCallback(async () => {
    if (!state.userMembership?.id) return;

    try {
      const { error } = await supabase
        .from('organization_memberships')
        .delete()
        .eq('id', state.userMembership.id);

      if (error) throw error;

      // Clear cache and reset state
      organizationDataManager.clearCache();
      setState(prev => ({
        ...prev,
        organization: null,
        userMembership: null,
        members: []
      }));

    } catch (error) {
      console.error('Error leaving organization:', error);
      setError('Failed to leave organization');
    }
  }, [state.userMembership?.id, setError]);

  // Execute delete organization
  const executeDeleteOrganization = useCallback(async () => {
    if (!state.organization?.id) return;

    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', state.organization.id);

      if (error) throw error;

      // Clear cache and reset state
      organizationDataManager.clearCache();
      setState(prev => ({
        ...prev,
        organization: null,
        userMembership: null,
        members: []
      }));

    } catch (error) {
      console.error('Error deleting organization:', error);
      setError('Failed to delete organization');
    }
  }, [state.organization?.id, setError]);

  // Initial data load
  useEffect(() => {
    fetchOrganizationData();
  }, [fetchOrganizationData]);

  return {
    ...state,
    setError,
    checkMembership,
    fetchOrganizationData,
    updateOrganization,
    executeLeave,
    executeDeleteOrganization
  };
}