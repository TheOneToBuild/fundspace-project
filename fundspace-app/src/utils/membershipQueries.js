// utils/membershipQueries.js - FIXED VERSION with circuit breaker pattern
import { supabase } from '../supabaseClient.js';

// ✅ Circuit breaker to prevent cascade failures
let cacheFailureCount = 0;
const MAX_CACHE_FAILURES = 3;
const CACHE_COOLDOWN = 60000; // 1 minute
let lastCacheFailure = 0;

// ✅ Request deduplication for membership queries
const pendingQueries = new Map();

function deduplicate(key, queryFn) {
  if (pendingQueries.has(key)) {
    return pendingQueries.get(key);
  }
  
  const promise = queryFn().finally(() => {
    pendingQueries.delete(key);
  });
  
  pendingQueries.set(key, promise);
  return promise;
}

/**
 * Get current user's primary organization info
 * Uses the simple cache table directly with circuit breaker
 */
export async function getOrganizationInfoForDashboard(profileId) {
  if (!profileId) return null;
  
  return deduplicate(`org-info-${profileId}`, async () => {
    try {
      const now = Date.now();
      const shouldSkipCache = cacheFailureCount >= MAX_CACHE_FAILURES && 
                             (now - lastCacheFailure) < CACHE_COOLDOWN;

      if (!shouldSkipCache) {
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
            cacheFailureCount = 0; // Reset failure count on success
            
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

          // If cache query failed, increment failure count
          if (error) {
            cacheFailureCount++;
            lastCacheFailure = now;
            console.warn(`Cache failure ${cacheFailureCount}/${MAX_CACHE_FAILURES}:`, error.message);
          }
        } catch (cacheError) {
          cacheFailureCount++;
          lastCacheFailure = now;
          console.warn(`Cache exception ${cacheFailureCount}/${MAX_CACHE_FAILURES}:`, cacheError.message);
        }
      } else {
        console.warn('Skipping cache due to repeated failures, using fallback');
      }

      // Fallback: Try original table with separate queries to avoid RLS recursion
      try {
        const { data: membership, error: membershipError } = await supabase
          .from('organization_memberships')
          .select('*')
          .eq('profile_id', profileId)
          .order('joined_at', { ascending: false })
          .limit(1);

        if (!membershipError && membership && membership.length > 0) {
          const membershipData = membership[0];
          
          // Separate query for organization details to avoid RLS issues
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
          } else {
            console.warn('Organization details fetch failed:', orgError?.message);
          }
        } else {
          console.warn('Membership fetch failed:', membershipError?.message);
        }
      } catch (fallbackError) {
        console.warn('Fallback query failed:', fallbackError.message);
      }

      return null;
    } catch (error) {
      console.warn('Organization query completely failed:', error.message);
      return null;
    }
  });
}

/**
 * Get organization info for profile navigation
 */
export async function getOrganizationForProfileNav(profileId) {
  if (!profileId) return [];
  
  return deduplicate(`org-nav-${profileId}`, async () => {
    try {
      // Skip cache if it's been failing repeatedly
      const now = Date.now();
      const shouldSkipCache = cacheFailureCount >= MAX_CACHE_FAILURES && 
                             (now - lastCacheFailure) < CACHE_COOLDOWN;

      if (!shouldSkipCache) {
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
        } catch (cacheError) {
          console.warn('Navigation cache error:', cacheError.message);
        }
      }

      // Fallback logic - use direct queries
      const { data: membership, error } = await supabase
        .from('organization_memberships')
        .select('organization_id')
        .eq('profile_id', profileId)
        .limit(1);

      if (!error && membership && membership.length > 0) {
        const { data: org } = await supabase
          .from('organizations')
          .select('name, slug')
          .eq('id', membership[0].organization_id)
          .single();

        if (org) {
          return [{
            organizations: {
              name: org.name,
              slug: org.slug
            }
          }];
        }
      }

      return [];
    } catch (error) {
      console.warn('Error fetching organization for nav:', error.message);
      return [];
    }
  });
}

/**
 * Get organization memberships for multiple users (bulk query)
 */
export async function getBulkOrganizationMemberships(profileIds) {
  if (!profileIds || profileIds.length === 0) return {};
  
  const cacheKey = `bulk-memberships-${profileIds.sort().join(',')}`;
  
  return deduplicate(cacheKey, async () => {
    try {
      // Skip cache if failing repeatedly
      const now = Date.now();
      const shouldSkipCache = cacheFailureCount >= MAX_CACHE_FAILURES && 
                             (now - lastCacheFailure) < CACHE_COOLDOWN;

      if (!shouldSkipCache) {
        try {
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
        } catch (cacheError) {
          console.warn('Bulk cache error:', cacheError.message);
        }
      }

      // Fallback to direct query
      const { data: memberships, error } = await supabase
        .from('organization_memberships')
        .select('profile_id, organization_id, organization_type, role')
        .in('profile_id', profileIds)
        .eq('is_public', true);

      if (!error && memberships) {
        const membershipMap = {};
        memberships.forEach(membership => {
          if (!membershipMap[membership.profile_id]) {
            membershipMap[membership.profile_id] = {
              organization_type: membership.organization_type,
              role: membership.role
            };
          }
        });
        return membershipMap;
      }

      return {};
    } catch (error) {
      console.warn('Error fetching bulk memberships:', error.message);
      return {};
    }
  });
}

/**
 * Check if user has access to organization management
 */
export async function checkOrganizationAccess(organizationId, userId) {
  if (!organizationId || !userId) return false;
  
  return deduplicate(`org-access-${organizationId}-${userId}`, async () => {
    try {
      // Skip cache if failing repeatedly
      const now = Date.now();
      const shouldSkipCache = cacheFailureCount >= MAX_CACHE_FAILURES && 
                             (now - lastCacheFailure) < CACHE_COOLDOWN;

      if (!shouldSkipCache) {
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
        } catch (cacheError) {
          console.warn('Access cache error:', cacheError.message);
        }
      }

      // Fallback query
      const { data, error } = await supabase
        .from('organization_memberships')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('profile_id', userId)
        .limit(1);

      if (!error && data && data.length > 0) {
        return ['admin', 'super_admin'].includes(data[0].role);
      }

      return false;
    } catch (error) {
      console.warn('Error checking organization access:', error.message);
      return false;
    }
  });
}

/**
 * Get user's organization membership with error handling
 */
export async function getUserOrganizationMembership(profileId) {
  if (!profileId) return null;
  
  return deduplicate(`user-membership-${profileId}`, async () => {
    try {
      // Try stored procedure first if available
      const { data: funcData, error: funcError } = await supabase
        .rpc('get_user_organization_membership', { 
          user_id: profileId 
        });

      if (!funcError && funcData && funcData.length > 0) {
        const membershipData = funcData[0];
        return {
          id: membershipData.id,
          profile_id: membershipData.profile_id,
          organization_id: membershipData.organization_id,
          organization_type: membershipData.organization_type,
          role: membershipData.role,
          joined_at: membershipData.joined_at,
          functional_role: membershipData.functional_role,
          membership_type: membershipData.membership_type,
          is_public: membershipData.is_public,
          organization: {
            id: membershipData.organization_id,
            name: membershipData.organization_name,
            tagline: membershipData.organization_tagline,
            image_url: membershipData.organization_image_url
          }
        };
      }

      // Fallback to split queries
      const { data: memberships, error } = await supabase
        .from('organization_memberships')
        .select('*')
        .eq('profile_id', profileId)
        .order('joined_at', { ascending: false })
        .limit(1);

      if (error || !memberships || memberships.length === 0) {
        return null;
      }

      const membership = memberships[0];
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id, name, tagline, type, image_url')
        .eq('id', membership.organization_id)
        .single();

      return {
        ...membership,
        organization: orgData || {
          id: membership.organization_id,
          name: 'Unknown Organization',
          tagline: null,
          image_url: null
        }
      };

    } catch (err) {
      console.warn('Error getting organization membership:', err.message);
      return null;
    }
  });
}