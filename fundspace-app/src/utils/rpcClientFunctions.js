// src/utils/rpcClientFunctions.js
// Client-side functions to call the optimized RPC functions

import { supabase } from '../supabaseClient';

// Cache for frequently requested data
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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

// Dashboard data - replaces 15+ individual API calls
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

// User profile complete - replaces 8+ individual API calls
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

// Organization data - replaces 5+ individual API calls
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

// Grants with details - replaces 10+ individual API calls
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

  // Only cache if no user-specific filters for saved grants
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

// Batch connection status - replaces N individual connection queries
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

// Helper function to invalidate cache for specific keys
export const invalidateCache = (pattern) => {
  const keys = Array.from(cache.keys());
  keys.forEach(key => {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  });
};

// Helper function to clear all cache
export const clearCache = () => {
  cache.clear();
};

// Analytics helper to track RPC usage
export const trackRPCUsage = (functionName, success = true) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'rpc_function_call', {
      function_name: functionName,
      success: success
    });
  }
};