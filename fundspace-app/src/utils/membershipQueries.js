// src/utils/membershipQueries.js - UPDATED to use RPC batch functions
import { supabase } from '../supabaseClient';
import { 
  getUserAllMemberships, 
  getMembershipsBatch,
  checkOrgAccessBatch 
} from './rpcClientFunctions';

const CACHE_TTL = 30000; // 30 seconds
const membershipRequestCache = new Map();

function deduplicateMembershipRequest(key, fn) {
  if (membershipRequestCache.has(key)) {
    const cached = membershipRequestCache.get(key);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.promise;
    }
    membershipRequestCache.delete(key);
  }

  const promise = fn();
  membershipRequestCache.set(key, { promise, timestamp: Date.now() });
  return promise;
}

// ✅ OPTIMIZED: Use RPC batch function
export async function getUserOrganizationMembership(profileId) {
  if (!profileId) return null;
  
  return deduplicateMembershipRequest(`membership-${profileId}`, async () => {
    try {
      const result = await getUserAllMemberships(profileId);
      
      if (result.memberships && result.memberships.length > 0) {
        // Return the first (most recent) membership
        return result.memberships[0];
      }
      
      return null;
    } catch (err) {
      console.warn('Error getting organization membership:', err.message);
      return null;
    }
  });
}

// ✅ OPTIMIZED: Use RPC batch function
export async function getOrganizationInfoForDashboard(profileId) {
  if (!profileId) return null;
  
  return deduplicateMembershipRequest(`org-info-${profileId}`, async () => {
    try {
      const result = await getUserAllMemberships(profileId);
      
      if (result.memberships && result.memberships.length > 0) {
        const membership = result.memberships[0];
        return {
          ...membership.organization,
          membership: {
            role: membership.role,
            id: membership.id
          }
        };
      }
      
      return null;
    } catch (error) {
      console.warn('Error getting organization info:', error.message);
      return null;
    }
  });
}

// Alias for community context
export function getOrganizationInfoForCommunity(profileId) {
  return getOrganizationInfoForDashboard(profileId);
}

// Alias for profile nav
export function getOrganizationForProfileNav(profileId) {
  return getOrganizationInfoForDashboard(profileId);
}

// ✅ OPTIMIZED: Use RPC batch function
export async function getBulkOrganizationMemberships(profileIds) {
  if (!profileIds || profileIds.length === 0) return {};
  
  return deduplicateMembershipRequest(`bulk-memberships-${profileIds.sort().join(',')}`, async () => {
    try {
      const result = await getMembershipsBatch(profileIds);
      
      // Transform to expected format
      const membershipMap = {};
      Object.entries(result).forEach(([profileId, membership]) => {
        membershipMap[profileId] = {
          organization_type: membership.organization_type,
          role: membership.role
        };
      });
      
      return membershipMap;
    } catch (error) {
      console.warn('Error fetching bulk memberships:', error.message);
      return {};
    }
  });
}

// ✅ OPTIMIZED: Use RPC batch function
export async function checkOrganizationAccess(organizationId, userId) {
  if (!organizationId || !userId) return false;
  
  return deduplicateMembershipRequest(`access-${organizationId}-${userId}`, async () => {
    try {
      const result = await checkOrgAccessBatch(organizationId, [userId]);
      return result[userId]?.has_access || false;
    } catch (error) {
      console.warn('Error checking organization access:', error.message);
      return false;
    }
  });
}

// Clean up old cache entries periodically
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