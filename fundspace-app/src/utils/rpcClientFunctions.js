import { supabase } from '../supabaseClient';

const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000;

const getCacheKey = (functionName, params) => {
  return `${functionName}_${JSON.stringify(params)}`;
};

const getCachedData = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

const setCachedData = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
};

export const getDashboardData = async (userId = null) => {
  const cacheKey = getCacheKey('dashboard', { userId });
  const cached = getCachedData(cacheKey);
  if (cached) return cached;
  try {
    const { data, error } = await supabase.rpc('get_dashboard_data', {
      p_user_id: userId
    });
    if (error) throw error;
    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
};

/**
 * Get all comments for a post with reactions in one call
 * Replaces CommentSection.jsx individual fetches
 */
export const getPostCommentsWithReactions = async (postId, userId, isOrgPost = false) => {
  const cacheKey = getCacheKey('comments_with_reactions', { postId, userId, isOrgPost });
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const { data, error } = await supabase.rpc('get_post_comments_with_reactions', {
      p_post_id: postId,
      p_user_id: userId,
      p_is_org_post: isOrgPost
    });

    if (error) throw error;
    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching comments with reactions:', error);
    throw error;
  }
};

/**
 * Get organizations with all their categories in one call
 * Replaces ExploreOrganizations.jsx N+1 queries
 */
export const getOrganizationsWithCategories = async (orgIds = null) => {
  const cacheKey = getCacheKey('orgs_with_categories', { orgIds });
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const { data, error } = await supabase.rpc('get_organizations_with_categories', {
      p_org_ids: orgIds
    });

    if (error) throw error;
    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching organizations with categories:', error);
    throw error;
  }
};

/**
 * Get complete member profile with all stats in one call
 * Replaces MemberProfileHeader.jsx multiple fetches
 */
export const getMemberProfileComplete = async (profileId, currentUserId = null) => {
  const cacheKey = getCacheKey('member_complete', { profileId, currentUserId });
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const { data, error } = await supabase.rpc('get_member_profile_complete', {
      p_profile_id: profileId,
      p_current_user_id: currentUserId
    });

    if (error) throw error;
    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching member profile complete:', error);
    throw error;
  }
};

/**
 * Get organization posts with all metadata in one call
 * Replaces OrganizationPostsManager.jsx fetches
 */
export const getOrganizationPostsComplete = async (
  orgId,
  orgType,
  userId = null,
  limit = 20,
  offset = 0
) => {
  const cacheKey = getCacheKey('org_posts_complete', { orgId, orgType, userId, limit, offset });
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const { data, error } = await supabase.rpc('get_organization_posts_complete', {
      p_org_id: orgId,
      p_org_type: orgType,
      p_user_id: userId,
      p_limit: limit,
      p_offset: offset
    });

    if (error) throw error;
    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching organization posts complete:', error);
    throw error;
  }
};

export const getUserProfileComplete = async (profileId, viewerId = null) => {
  const cacheKey = getCacheKey('profile', { profileId, viewerId });
  const cached = getCachedData(cacheKey);
  if (cached) return cached;
  try {
    const { data, error } = await supabase.rpc('get_user_profile_complete', {
      p_profile_id: profileId,
      p_viewer_id: viewerId
    });
    if (error) throw error;
    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

export const getOrganizationData = async (organizationId, viewerId = null) => {
  const cacheKey = getCacheKey('organization', { organizationId, viewerId });
  const cached = getCachedData(cacheKey);
  if (cached) return cached;
  try {
    const { data, error } = await supabase.rpc('get_organization_data', {
      p_organization_id: organizationId,
      p_viewer_id: viewerId
    });
    if (error) throw error;
    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching organization data:', error);
    throw error;
  }
};

export const getOrganizationBySlug = async (slug) => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .single();
    
    if (error) throw error;
    return data?.id;
  } catch (error) {
    console.error('Error fetching organization by slug:', error);
    throw error;
  }
};

export const getGrantsWithDetails = async (options = {}) => {
  const {
    userId = null,
    limit = 20,
    offset = 0,
    searchTerm = null,
    organizationTypes = null,
    minAmount = null,
    maxAmount = null,
    deadlineAfter = null,
    grantType = null,
    savedOnly = false
  } = options;
  const shouldCache = !savedOnly && !userId;
  const cacheKey = getCacheKey('grants', { 
    limit, offset, searchTerm, organizationTypes, minAmount, maxAmount, deadlineAfter, grantType 
  });
  if (shouldCache) {
    const cached = getCachedData(cacheKey);
    if (cached) return cached;
  }
  try {
    const { data, error } = await supabase.rpc('get_grants_with_details', {
      p_user_id: userId,
      p_limit: limit,
      p_offset: offset,
      p_search_term: searchTerm,
      p_organization_types: organizationTypes,
      p_min_amount: minAmount,
      p_max_amount: maxAmount,
      p_deadline_after: deadlineAfter,
      p_grant_type: grantType,
      p_saved_only: savedOnly
    });
    if (error) throw error;
    if (shouldCache) {
      setCachedData(cacheKey, data);
    }
    return data;
  } catch (error) {
    console.error('Error fetching grants:', error);
    throw error;
  }
};

/**
 * Get reactions for multiple posts in one call
 * For feed pages with multiple posts
 */
export const getPostsWithReactionsBatch = async (postIds, userId, isOrgPost = false) => {
  if (!postIds || postIds.length === 0) return {};

  const cacheKey = getCacheKey('posts_reactions_batch', { postIds, userId, isOrgPost });
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const { data, error } = await supabase.rpc('get_posts_with_reactions_batch', {
      p_post_ids: postIds,
      p_user_id: userId,
      p_is_org_post: isOrgPost
    });

    if (error) throw error;
    const result = data || {};
    setCachedData(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error fetching posts reactions batch:', error);
    return {};
  }
};

/**
 * Get multiple user profiles with org info in one call
 */
export const getProfilesWithOrgsBatch = async (profileIds) => {
  if (!profileIds || profileIds.length === 0) return {};

  const cacheKey = getCacheKey('profiles_orgs_batch', { profileIds });
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const { data, error } = await supabase.rpc('get_profiles_with_orgs_batch', {
      p_profile_ids: profileIds
    });

    if (error) throw error;
    const result = data || {};
    setCachedData(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error fetching profiles with orgs batch:', error);
    return {};
  }
};

/**
 * Get multiple grants with save status in one call
 */
export const getGrantsBatch = async (grantIds, userId = null) => {
  if (!grantIds || grantIds.length === 0) return {};

  const cacheKey = getCacheKey('grants_batch', { grantIds, userId });
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const { data, error } = await supabase.rpc('get_grants_batch', {
      p_grant_ids: grantIds,
      p_user_id: userId
    });

    if (error) throw error;
    const result = data || {};
    setCachedData(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error fetching grants batch:', error);
    return {};
  }
};

// ====================================
// ORGANIZATION MEMBERSHIPS OPTIMIZATION
// ====================================

/**
 * Get memberships for multiple profiles in one call
 * Replaces individual organization_memberships queries
 */
export const getMembershipsBatch = async (profileIds) => {
  if (!profileIds || profileIds.length === 0) return {};

  const cacheKey = getCacheKey('memberships_batch', { profileIds });
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const { data, error } = await supabase.rpc('get_memberships_batch', {
      p_profile_ids: profileIds
    });

    if (error) throw error;
    const result = data || {};
    setCachedData(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error fetching memberships batch:', error);
    return {};
  }
};

/**
 * Get all memberships for a single user (users can have multiple orgs)
 * Replaces getUserOrganizationMembership
 */
export const getUserAllMemberships = async (profileId) => {
  if (!profileId) return { memberships: [] };

  const cacheKey = getCacheKey('user_all_memberships', { profileId });
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const { data, error } = await supabase.rpc('get_user_all_memberships', {
      p_profile_id: profileId
    });

    if (error) throw error;
    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching user memberships:', error);
    return { memberships: [] };
  }
};

/**
 * Check organization access for multiple users at once
 */
export const checkOrgAccessBatch = async (organizationId, profileIds) => {
  if (!organizationId || !profileIds || profileIds.length === 0) return {};

  const cacheKey = getCacheKey('org_access_batch', { organizationId, profileIds });
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const { data, error } = await supabase.rpc('check_org_access_batch', {
      p_organization_id: organizationId,
      p_profile_ids: profileIds
    });

    if (error) throw error;
    const result = data || {};
    setCachedData(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error checking org access batch:', error);
    return {};
  }
};

/**
 * Get organization members with full profile info
 * Replaces the multiple queries in member list pages
 */
export const getOrganizationMembersComplete = async (organizationId, organizationType = null) => {
  if (!organizationId) return { members: [] };

  const cacheKey = getCacheKey('org_members_complete', { organizationId, organizationType });
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const { data, error } = await supabase.rpc('get_organization_members_complete', {
      p_organization_id: organizationId,
      p_organization_type: organizationType
    });

    if (error) throw error;
    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching organization members:', error);
    return { members: [] };
  }
};

export const getBatchConnectionStatus = async (viewerId, profileIds) => {
  if (!viewerId || !profileIds || profileIds.length === 0) {
    return { connections: {} };
  }
  try {
    const { data, error } = await supabase.rpc('get_batch_connection_status', {
      p_viewer_id: viewerId,
      p_profile_ids: profileIds
    });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching batch connection status:', error);
    throw error;
  }
};

export const getCommentReactionsBatch = async (commentIds, userId = null) => {
  if (!commentIds || commentIds.length === 0) return {};
  
  const cacheKey = getCacheKey('comment_reactions', { commentIds, userId });
  const cached = getCachedData(cacheKey);
  if (cached) return cached;
  
  try {
    const { data, error } = await supabase.rpc('get_comment_reactions_batch', {
      p_comment_ids: commentIds,
      p_user_id: userId
    });
    
    if (error) throw error;
    setCachedData(cacheKey, data);
    return data || {};
  } catch (error) {
    console.error('Error fetching comment reactions:', error);
    return {};
  }
};

export const getGlobalSearchResults = async (searchTerm, limit = 20) => {
  const cacheKey = getCacheKey('search', { searchTerm, limit });
  const cached = getCachedData(cacheKey);
  if (cached) return cached;
  try {
    const { data, error } = await supabase.rpc('get_global_search_results', {
      p_search_term: searchTerm,
      p_limit: limit
    });
    if (error) throw error;
    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching search results:', error);
    throw error;
  }
};

export const getAdminDashboardStats = async () => {
  const cacheKey = getCacheKey('admin_stats', {});
  const cached = getCachedData(cacheKey);
  if (cached) return cached;
  try {
    const { data, error } = await supabase.rpc('get_admin_dashboard_stats');
    if (error) throw error;
    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    throw error;
  }
};

export const getCommunityPosts = async (channel, limit = 10, userId = null) => {
  const cacheKey = getCacheKey('community_posts', { channel, limit, userId });
  const cached = getCachedData(cacheKey);
  if (cached) return cached;
  try {
    const { data, error } = await supabase.rpc('get_community_posts', {
      p_channel: channel,
      p_limit: limit,
      p_user_id: userId
    });
    if (error) throw error;
    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching community posts:', error);
    throw error;
  }
};

export const getUserSocialConnections = async (userId, type = 'both') => {
  const cacheKey = getCacheKey('social_connections', { userId, type });
  const cached = getCachedData(cacheKey);
  if (cached) return cached;
  try {
    const { data, error } = await supabase.rpc('get_user_social_connections', {
      p_user_id: userId,
      p_type: type
    });
    if (error) throw error;
    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching social connections:', error);
    throw error;
  }
};

export const getUserOrganizationMembership = async (userId) => {
  const cacheKey = getCacheKey('user_org_membership', { userId });
  const cached = getCachedData(cacheKey);
  if (cached) return cached;
  try {
    const { data, error } = await supabase.rpc('get_user_organization_membership', {
      user_id: userId
    });
    if (error) throw error;
    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching organization membership:', error);
    throw error;
  }
};

export const getGrantById = async (grantId, userId = null) => {
  const cacheKey = getCacheKey('grant', { grantId, userId });
  const cached = getCachedData(cacheKey);
  if (cached) return cached;
  
  try {
    const { data, error } = await supabase.rpc('get_grant_by_id', {
      p_grant_id: grantId,
      p_user_id: userId
    });
    
    if (error) throw error;
    
    setCachedData(cacheKey, data);
    trackRPCUsage('get_grant_by_id', true);
    return data;
  } catch (error) {
    console.error('Error fetching grant by ID:', error);
    trackRPCUsage('get_grant_by_id', false);
    throw error;
  }
};

export const getLocationData = async (location, locationQuery, limits = {}) => {
  const {
    orgLimit = 12,
    grantLimit = 12,
    postLimit = 12
  } = limits;
  
  const cacheKey = getCacheKey('location_data', { location, locationQuery, orgLimit, grantLimit, postLimit });
  const cached = getCachedData(cacheKey);
  if (cached) return cached;
  
  try {
    const { data, error } = await supabase.rpc('get_location_data', {
      p_location: location,
      p_location_query: locationQuery,
      p_org_limit: orgLimit,
      p_grant_limit: grantLimit,
      p_post_limit: postLimit
    });
    
    if (error) throw error;
    
    setCachedData(cacheKey, data);
    trackRPCUsage('get_location_data', true);
    return data;
  } catch (error) {
    console.error('Error fetching location data:', error);
    trackRPCUsage('get_location_data', false);
    throw error;
  }
};

export const getUserTrackedGrants = async (userId, organizationId = null) => {
  const cacheKey = getCacheKey('tracked_grants', { userId, organizationId });
  const cached = getCachedData(cacheKey);
  if (cached) return cached;
  
  try {
    const { data, error } = await supabase.rpc('get_user_tracked_grants', {
      p_user_id: userId,
      p_organization_id: organizationId
    });
    
    if (error) throw error;
    
    setCachedData(cacheKey, data);
    trackRPCUsage('get_user_tracked_grants', true);
    return data;
  } catch (error) {
    console.error('Error fetching tracked grants:', error);
    trackRPCUsage('get_user_tracked_grants', false);
    throw error;
  }
};

export const invalidateCache = (pattern) => {
  if (pattern) {
    const keys = Array.from(cache.keys());
    keys.forEach(key => {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    });
  } else {
    clearCache();
  }
};

export const clearCache = () => {
  cache.clear();
};

export const trackRPCUsage = (functionName, success = true) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'rpc_function_call', {
      function_name: functionName,
      success: success
    });
  }
};