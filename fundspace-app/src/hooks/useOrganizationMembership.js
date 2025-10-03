import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';

const pendingRequests = new Map();

function useRequestDeduplication() {
  const deduplicate = useCallback((key, requestFunction) => {
    if (pendingRequests.has(key)) {
      return pendingRequests.get(key);
    }

    const promise = requestFunction()
      .finally(() => {
        pendingRequests.delete(key);
      });

    pendingRequests.set(key, promise);
    return promise;
  }, []);

  return deduplicate;
}

let cacheFailureCount = 0;
const MAX_CACHE_FAILURES = 3;
const CACHE_COOLDOWN = 60000;
let lastCacheFailure = 0;

export function useOrganizationMembership(profileId) {
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const deduplicate = useRequestDeduplication();
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchMembership = useCallback(async () => {
    if (!profileId) {
      if (isMountedRef.current) {
        setMembership(null);
        setLoading(false);
      }
      return;
    }

    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
    }

    return deduplicate(`membership-${profileId}`, async () => {
      try {
        const now = Date.now();
        const shouldSkipCache = cacheFailureCount >= MAX_CACHE_FAILURES && 
                               (now - lastCacheFailure) < CACHE_COOLDOWN;

        if (!shouldSkipCache) {
          try {
            const { data: funcData, error: funcError } = await supabase
              .rpc('get_user_organization_membership', { 
                user_id: profileId 
              });

            if (!funcError && funcData && funcData.length > 0) {
              const membershipData = funcData[0];
              const result = {
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
              
              if (isMountedRef.current) {
                setMembership(result);
                setLoading(false);
                cacheFailureCount = 0;
              }
              return;
            }
          } catch (rpcError) {
            console.warn('RPC function failed:', rpcError.message);
          }
        }

        // Use the new RPC function from membershipQueries
        const { getUserAllMemberships } = await import('../utils/membershipQueries.js');
        const result = await getUserAllMemberships(profileId);

        if (result.memberships && result.memberships.length > 0) {
          const membership = result.memberships[0];
          
          if (isMountedRef.current) {
            setMembership({
              ...membership,
              organization: membership.organization
            });
          }
        } else {
          if (isMountedRef.current) {
            setMembership(null);
          }
        }
      } catch (err) {
        console.error('Error fetching membership:', err);
        
        if (isMountedRef.current) {
          setError(err);
          setMembership(null);
        }
        
        cacheFailureCount++;
        lastCacheFailure = Date.now();
      }

      if (isMountedRef.current) {
        setLoading(false);
      }
    });
  }, [profileId, deduplicate]);

  useEffect(() => {
    fetchMembership();
  }, [fetchMembership]);

  return {
    membership,
    loading,
    error,
    refetch: fetchMembership
  };
}

export async function getOrganizationMembership(profileId) {
  if (!profileId) return null;

  const queryKey = `direct-membership-${profileId}`;
  
  if (pendingRequests.has(queryKey)) {
    return pendingRequests.get(queryKey);
  }

  const promise = (async () => {
    try {      
      // Use the optimized function from membershipQueries
      const { getUserAllMemberships } = await import('../utils/membershipQueries.js');
      const result = await getUserAllMemberships(profileId);

      if (result.memberships && result.memberships.length > 0) {
        return result.memberships[0];
      }
      return null;
    } catch (err) {
      console.error('Error getting organization membership:', err);
      return null;
    } finally {
      pendingRequests.delete(queryKey);
    }
  })();

  pendingRequests.set(queryKey, promise);
  return promise;
}

export async function getBulkOrganizationMemberships(profileIds) {
  // Delegate to the optimized version in membershipQueries
  const { getBulkOrganizationMemberships: optimizedFn } = await import('../utils/membershipQueries.js');
  return optimizedFn(profileIds);
}