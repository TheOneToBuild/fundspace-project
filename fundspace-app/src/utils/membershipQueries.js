// utils/membershipQueries.js - SIMPLE CACHE VERSION
// Uses direct table queries - no complex functions to avoid warnings

import { supabase } from '../supabaseClient.js';

/**
 * Get current user's primary organization info
 * Uses the simple cache table directly
 */
export async function getOrganizationInfoForDashboard(profileId) {
  try {
    // Direct query to cache table (safe and fast)
    const { data: cacheData, error } = await supabase
      .from('organization_membership_cache')
      .select('*')
      .eq('profile_id', profileId)
      .order('joined_at', { ascending: false })
      .limit(1)
      .single();

    if (!error && cacheData) {
      return {
        id: cacheData.organization_id,
        name: cacheData.organization_name,
        type: cacheData.organization_type,
        tagline: cacheData.organization_tagline,
        image_url: cacheData.organization_image_url,
        slug: cacheData.organization_slug,
        membership: {
          role: cacheData.role,
          id: cacheData.id
        }
      };
    }

    // Fallback: Try original table (with safe RLS policies)
    try {
      const { data: membership } = await supabase
        .from('organization_memberships')
        .select('*')
        .eq('profile_id', profileId)
        .order('joined_at', { ascending: false })
        .limit(1)
        .single();

      if (membership) {
        const { data: org } = await supabase
          .from('organizations')
          .select('id, name, type, tagline, image_url, slug')
          .eq('id', membership.organization_id)
          .single();

        if (org) {
          return {
            ...org,
            membership: {
              role: membership.role,
              id: membership.id
            }
          };
        }
      }
    } catch (fallbackError) {
      console.warn('Fallback query failed (this is expected if RLS is working):', fallbackError);
    }

    return null;
  } catch (error) {
    console.error('Error fetching organization info:', error);
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
 * Get organization info for profile navigation
 */
export async function getOrganizationForProfileNav(profileId) {
  try {
    const { data: cacheData } = await supabase
      .from('organization_membership_cache')
      .select('organization_name, organization_slug')
      .eq('profile_id', profileId)
      .order('joined_at', { ascending: false })
      .limit(1);

    if (cacheData && cacheData.length > 0) {
      return [{
        organizations: {
          name: cacheData[0].organization_name,
          slug: cacheData[0].organization_slug
        }
      }];
    }

    return [];
  } catch (error) {
    console.error('Error fetching organization for nav:', error);
    return [];
  }
}

/**
 * Get organization memberships for multiple users (bulk query)
 */
export async function getBulkOrganizationMemberships(profileIds) {
  try {
    if (!profileIds || profileIds.length === 0) return {};

    // Direct cache table query
    const { data: cacheData } = await supabase
      .from('organization_membership_cache')
      .select('profile_id, organization_name, organization_type, role')
      .in('profile_id', profileIds)
      .eq('is_public', true);

    if (cacheData) {
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
    console.error('Error fetching bulk memberships:', error);
    return {};
  }
}

/**
 * Check if user has access to organization management
 */
export async function checkOrganizationAccess(organizationId, userId) {
  try {
    const { data } = await supabase
      .from('organization_membership_cache')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('profile_id', userId)
      .single();

    return data && ['admin', 'super_admin'].includes(data.role);
  } catch {
    return false;
  }
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

/**
 * Get a user's organization membership safely
 */
export async function getUserMembershipSafe(profileId) {
  try {
    const { data } = await supabase
      .from('organization_membership_cache')
      .select('*')
      .eq('profile_id', profileId)
      .order('joined_at', { ascending: false })
      .limit(1)
      .single();

    return data || null;
  } catch {
    return null;
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