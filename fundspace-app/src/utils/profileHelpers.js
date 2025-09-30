// fundspace-app/src/utils/profileHelpers.js
import { supabase } from '../supabaseClient';

/**
 * Search profiles using RPC function
 * @param {string} query - Search query
 * @param {number} limit - Max results (default 5)
 * @returns {Promise<Array>} Array of profile objects
 */
export const searchProfiles = async (query, limit = 5) => {
  if (!query || query.length < 2) {
    return [];
  }

  const { data, error } = await supabase.rpc('get_profiles_list', {
    p_search: query.trim(),
    p_limit: limit
  });
  
  if (error) {
    console.error('Error searching profiles:', error);
    return [];
  }
  
  return data || [];
};

/**
 * Get single profile by ID using RPC function
 * @param {string} profileId - UUID of profile
 * @returns {Promise<Object|null>} Profile object or null
 */
export const getProfileById = async (profileId) => {
  if (!profileId) {
    return null;
  }

  const { data, error } = await supabase.rpc('get_profile_by_id', {
    p_profile_id: profileId
  });
  
  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  
  return data;
};

/**
 * Get multiple profiles by ID
 * @param {Array<string>} userIds - Array of UUIDs of profiles
 * @returns {Promise<Object>} Object map of profile objects with profile ID as key
 */
export const getProfilesBatch = async (userIds) => {
  if (!userIds || userIds.length === 0) {
    return {};
  }

  const { data, error } = await supabase.rpc('get_profiles_batch', {
    p_profile_ids: userIds
  });
  
  if (error) {
    console.error('Error fetching batch profiles:', error);
    return {};
  }
  
  return data || {};
};