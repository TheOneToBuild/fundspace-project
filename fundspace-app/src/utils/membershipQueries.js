// utils/membershipQueries.js - IMPROVED VERSION
// Better error handling for cache queries

import { supabase } from '../supabaseClient.js';

/**
 * Get current user's primary organization info
 * Uses the simple cache table directly
 */
export async function getOrganizationInfoForDashboard(profileId) {
  try {
    // Try cache table first, but handle multiple/no rows gracefully
    const { data: cacheData, error } = await supabase
      .from('organization_membership_cache')
      .select('*')
      .eq('profile_id', profileId)
      .order('joined_at', { ascending: false })
      .limit(1);

    // If successful and has data, use it
    if (!error && cacheData && cacheData.length > 0) {
      const cache = cacheData[0];
      return {
        id: cache.organization_id,
        name: cache.organization_name,
        type: cache.organization_type,
        tagline: cache.organization_tagline,
        image_url: cache.organization_image_url,
        slug: cache.organization_slug,
        membership: {
          role: cache.role,
          id: cache.id
        }
      };
    }

    // Log the cache issue but continue with fallback
    if (error) {
      console.warn('Cache query failed, using fallback:', error.message);
    }

    // Fallback: Try original table
    try {
      const { data: membership, error: membershipError } = await supabase
        .from('organization_memberships')
        .select('*')
        .eq('profile_id', profileId)
        .order('joined_at', { ascending: false })
        .limit(1);

      if (!membershipError && membership && membership.length > 0) {
        const membershipData = membership[0];
        
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('id, name, type, tagline, image_url, slug')
          .eq('id', membershipData.organization_id)
          .single();

        if (!orgError && org) {
          return {
            ...org,
            membership: {
              role: membershipData.role,
              id: membershipData.id
            }
          };
        }
      }
    } catch (fallbackError) {
      console.warn('Fallback query failed:', fallbackError);
    }

    return null;
  } catch (error) {
    console.warn('Organization cache unavailable:', error.message);
    return null;
  }
}

/**
 * Get organization info for profile navigation
 */
export async function getOrganizationForProfileNav(profileId) {
  try {
    // Use array query instead of single to avoid multiple/no rows error
    const { data: cacheData, error } = await supabase
      .from('organization_membership_cache')
      .select('organization_name, organization_slug')
      .eq('profile_id', profileId)
      .order('joined_at', { ascending: false })
      .limit(1);

    if (!error && cacheData && cacheData.length > 0) {
      return [{
        organizations: {
          name: cacheData[0].organization_name,
          slug: cacheData[0].organization_slug
        }
      }];
    }

    return [];
  } catch (error) {
    console.warn('Error fetching organization for nav:', error);
    return [];
  }
}

/**
 * Get organization memberships for multiple users (bulk query)
 */
export async function getBulkOrganizationMemberships(profileIds) {
  try {
    if (!profileIds || profileIds.length === 0) return {};

    const { data: cacheData, error } = await supabase
      .from('organization_membership_cache')
      .select('profile_id, organization_name, organization_type, role')
      .in('profile_id', profileIds)
      .eq('is_public', true);

    if (!error && cacheData) {
      const membershipMap = {};
      cacheData.forEach(item => {
        if (!membershipMap[item.profile_id]) {
          membershipMap[item.profile_id] = {
            organization_name: item.organization_name,
            organization_type: item.organization_type,
            role: item.role
          };
        }
      });
      return membershipMap;
    }

    return {};
  } catch (error) {
    console.warn('Error fetching bulk memberships:', error);
    return {};
  }
}

/**
 * Check if user has access to organization management
 */
export async function checkOrganizationAccess(organizationId, userId) {
  try {
    const { data, error } = await supabase
      .from('organization_membership_cache')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('profile_id', userId)
      .limit(1);

    if (!error && data && data.length > 0) {
      return ['admin', 'super_admin'].includes(data[0].role);
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Get a user's organization membership safely
 */
export async function getUserMembershipSafe(profileId) {
  try {
    const { data, error } = await supabase
      .from('organization_membership_cache')
      .select('*')
      .eq('profile_id', profileId)
      .order('joined_at', { ascending: false })
      .limit(1);

    if (!error && data && data.length > 0) {
      return data[0];
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get organization info for community/channel displays
 */
export async function getOrganizationInfoForCommunity(profileId) {
  return await getOrganizationInfoForDashboard(profileId);
}

/**
 * Refresh the cache manually (if data seems stale)
 */
export async function refreshMembershipCache() {
  try {
    const { data, error } = await supabase.rpc('refresh_org_cache');
    
    if (error) {
      console.error('Error refreshing cache:', error);
      return false;
    }

    console.log('Cache refresh result:', data);
    return true;
  } catch (error) {
    console.error('Error refreshing cache:', error);
    return false;
  }
}

/**
 * Test if the cache is working
 */
export async function testCacheWorking() {
  try {
    const { data, error, count } = await supabase
      .from('organization_membership_cache')
      .select('*', { count: 'exact', head: true });

    return {
      accessible: !error,
      record_count: count || 0,
      status: !error ? 'WORKING' : 'ERROR',
      error: error?.message || null
    };
  } catch (error) {
    return {
      accessible: false,
      status: 'FAILED',
      error: error.message
    };
  }
}

// Export all functions
export default {
  getOrganizationInfoForDashboard,
  getOrganizationInfoForCommunity,
  getOrganizationForProfileNav,
  getBulkOrganizationMemberships,
  checkOrganizationAccess,
  refreshMembershipCache,
  testCacheWorking,
  getUserMembershipSafe
};