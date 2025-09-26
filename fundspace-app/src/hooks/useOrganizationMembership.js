// hooks/useOrganizationMembership.js - OPTIMIZED with API Request Optimizer
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import apiRequestOptimizer from '../utils/apiRequestOptimizer';

// Request deduplication to prevent duplicate queries
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

// Circuit breaker to prevent cascade failures
let cacheFailureCount = 0;
const MAX_CACHE_FAILURES = 3;
const CACHE_COOLDOWN = 60000; // 1 minute
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

        // Try the stored procedure first (most reliable)
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
                cacheFailureCount = 0; // Reset on success
              }
              return;
            }
          } catch (rpcError) {
            console.warn('RPC function failed:', rpcError.message);
          }
        }

        // OPTIMIZED: Use API optimizer instead of direct Supabase calls
        const optimizedResult = await apiRequestOptimizer.optimizeSupabaseQuery(
          null,
          'org_membership_single',
          { userId: profileId }
        );

        if (optimizedResult?.data?.length > 0) {
          const membershipRecord = optimizedResult.data[0];
          
          if (isMountedRef.current) {
            setMembership(membershipRecord);
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
        
        // Increment cache failure count for circuit breaker
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

// OPTIMIZED: Use API optimizer for direct queries
export async function getOrganizationMembership(profileId) {
  if (!profileId) return null;

  const queryKey = `direct-membership-${profileId}`;
  
  if (pendingRequests.has(queryKey)) {
    return pendingRequests.get(queryKey);
  }

  const promise = (async () => {
    try {
      // Try stored procedure first
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

      // OPTIMIZED: Use API optimizer instead of individual queries
      const optimizedResult = await apiRequestOptimizer.optimizeSupabaseQuery(
        null,
        'org_membership_single',
        { userId: profileId }
      );

      if (optimizedResult?.data?.length > 0) {
        return optimizedResult.data[0];
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

// OPTIMIZED: Use global data manager for bulk memberships
export async function getBulkOrganizationMemberships(profileIds) {
  if (!profileIds || profileIds.length === 0) return {};

  const queryKey = `bulk-memberships-${profileIds.sort().join(',')}`;
  
  if (pendingRequests.has(queryKey)) {
    return pendingRequests.get(queryKey);
  }

  const promise = (async () => {
    try {
      // OPTIMIZED: Use global data manager's batch system
      const { globalDataManager } = await import('../utils/globalDataManager');
      const membershipMap = await globalDataManager.getOrganizationMemberships(profileIds);
      
      return membershipMap;
    } catch (err) {
      console.error('Error getting bulk memberships:', err);
      return {};
    } finally {
      pendingRequests.delete(queryKey);
    }
  })();

  pendingRequests.set(queryKey, promise);
  return promise;
}