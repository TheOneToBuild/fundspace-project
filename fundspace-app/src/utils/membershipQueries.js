import { supabase } from '../supabaseClient.js';

const membershipRequestCache = new Map();
const CACHE_TTL = 30000;

function deduplicateMembershipRequest(key, requestFunction) {
  const now = Date.now();
  const cached = membershipRequestCache.get(key);
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return Promise.resolve(cached.data);
  }
  if (cached && cached.promise) {
    return cached.promise;
  }
  const promise = requestFunction()
    .then(result => {
      membershipRequestCache.set(key, {
        data: result,
        timestamp: now,
        promise: null
      });
      return result;
    })
    .catch(error => {
      membershipRequestCache.delete(key);
      throw error;
    });
  membershipRequestCache.set(key, {
    data: null,
    timestamp: now,
    promise
  });
  return promise;
}

let cacheFailureCount = 0;
const MAX_CACHE_FAILURES = 3;
const CACHE_COOLDOWN = 60000;
let lastCacheFailure = 0;

export async function getOrganizationInfoForDashboard(profileId) {
  if (!profileId) return null;
  return deduplicateMembershipRequest(`dashboard-${profileId}`, async () => {
    try {
      const now = Date.now();
      const shouldSkipCache = cacheFailureCount >= MAX_CACHE_FAILURES && 
                             (now - lastCacheFailure) < CACHE_COOLDOWN;

      if (!shouldSkipCache) {
        try {
          const { data: cacheData, error } = await supabase
            .from('organization_membership_cache')
            .select('*')
            .eq('profile_id', profileId)
            .order('joined_at', { ascending: false })
            .limit(1);

          if (!error && cacheData && cacheData.length > 0) {
            const cache = cacheData[0];
            cacheFailureCount = 0;
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

          if (error) {
            cacheFailureCount++;
            lastCacheFailure = now;
            console.warn(`Cache failure ${cacheFailureCount}/${MAX_CACHE_FAILURES}:`, error.message);
          }
        } catch (cacheError) {
          cacheFailureCount++;
          lastCacheFailure = now;
          console.warn(`Cache exception:`, cacheError.message);
        }
      }

      try {
        const { data: funcData, error: funcError } = await supabase
          .rpc('get_user_organization_membership', { 
            user_id: profileId 
          });

        if (!funcError && funcData && funcData.length > 0) {
          const membershipData = funcData[0];
          return {
            id: membershipData.organization_id,
            name: membershipData.organization_name,
            type: membershipData.organization_type,
            tagline: membershipData.organization_tagline,
            image_url: membershipData.organization_image_url,
            slug: membershipData.organization_slug,
            membership: {
              role: membershipData.role,
              id: membershipData.id
            }
          };
        }
      } catch (rpcError) {
        console.warn('RPC function failed:', rpcError.message);
      }

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
      return null;
    } catch (error) {
      console.warn('Organization query completely failed:', error.message);
      return null;
    }
  });
}

export async function getOrganizationForProfileNav(profileId) {
  if (!profileId) return [];
  return deduplicateMembershipRequest(`nav-${profileId}`, async () => {
    try {
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

      const { data: membership, error: membershipError } = await supabase
        .from('organization_memberships')
        .select('organization_id')
        .eq('profile_id', profileId)
        .limit(1);

      if (!membershipError && membership && membership.length > 0) {
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

export async function getBulkOrganizationMemberships(profileIds) {
  if (!profileIds || profileIds.length === 0) return {};
  const cacheKey = `bulk-${profileIds.sort().join(',')}`;
  return deduplicateMembershipRequest(cacheKey, async () => {
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

      const { data: memberships, error: directError } = await supabase
        .from('organization_memberships')
        .select('profile_id, organization_id, organization_type, role')
        .in('profile_id', profileIds)
        .eq('is_public', true);

      if (!directError && memberships) {
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

export async function checkOrganizationAccess(organizationId, userId) {
  if (!organizationId || !userId) return false;
  return deduplicateMembershipRequest(`access-${organizationId}-${userId}`, async () => {
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

      const { data: directData, error: directError } = await supabase
        .from('organization_memberships')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('profile_id', userId)
        .limit(1);

      if (!directError && directData && directData.length > 0) {
        return ['admin', 'super_admin'].includes(directData[0].role);
      }
      return false;
    } catch (error) {
      console.warn('Error checking organization access:', error.message);
      return false;
    }
  });
}

export async function getOrganizationInfoForCommunity(profileId) {
  return getOrganizationInfoForDashboard(profileId);
}

export async function getUserOrganizationMembership(profileId) {
  if (!profileId) return null;
  return deduplicateMembershipRequest(`membership-${profileId}`, async () => {
    try {
      const { data: funcData, error: funcError } = await supabase
        .rpc('get_user_organization_membership', { 
          user_id: profileId 
        });

      if (!funcError && funcData && funcData.length > 0) {
        const membership = funcData[0];
        return {
          id: membership.id,
          profile_id: membership.profile_id,
          organization_id: membership.organization_id,
          organization_type: membership.organization_type,
          role: membership.role,
          joined_at: membership.joined_at,
          functional_role: membership.functional_role,
          membership_type: membership.membership_type,
          is_public: membership.is_public,
          organization: {
            id: membership.organization_id,
            name: membership.organization_name,
            tagline: membership.organization_tagline,
            image_url: membership.organization_image_url
          }
        };
      }

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

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of membershipRequestCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      membershipRequestCache.delete(key);
    }
  }
}, CACHE_TTL);

export default {
  getOrganizationInfoForDashboard,
  getOrganizationInfoForCommunity,
  getOrganizationForProfileNav,
  getBulkOrganizationMemberships,
  checkOrganizationAccess,
  getUserOrganizationMembership
};