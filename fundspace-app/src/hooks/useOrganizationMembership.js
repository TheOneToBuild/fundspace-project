// hooks/useOrganizationMembership.js - FIXED VERSION
// Safe hook for querying organization memberships without RLS recursion

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';

// ✅ Request deduplication to prevent duplicate queries
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

// ✅ Circuit breaker to prevent cascade failures
let cacheFailureCount = 0;
const MAX_CACHE_FAILURES = 3;
const CACHE_COOLDOWN = 60000; // 1 minute
let lastCacheFailure = 0;

export function useOrganizationMembership(profileId) {
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // ✅ Add request deduplication
  const deduplicate = useRequestDeduplication();
  
  // ✅ Track component mounting to prevent stale updates
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

        // Fallback to direct queries (split to avoid RLS recursion)
        const { data: memberships, error } = await supabase
          .from('organization_memberships')
          .select('*')
          .eq('profile_id', profileId)
          .order('joined_at', { ascending: false })
          .limit(1);

        if (error) {
          throw error;
        }

        if (memberships && memberships.length > 0) {
          const membershipRecord = memberships[0];

          // Separate query for organization details to avoid RLS issues
          const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select('id, name, tagline, type, image_url')
            .eq('id', membershipRecord.organization_id)
            .single();

          if (orgError) {
            console.warn('Could not fetch organization details:', orgError.message);
          }

          const result = {
            ...membershipRecord,
            organization: orgData || {
              id: membershipRecord.organization_id,
              name: 'Unknown Organization',
              tagline: null,
              image_url: null
            }
          };

          if (isMountedRef.current) {
            setMembership(result);
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

// ✅ Alternative direct query function for components that need immediate results
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
      console.error('Error getting organization membership:', err);
      return null;
    } finally {
      pendingRequests.delete(queryKey);
    }
  })();

  pendingRequests.set(queryKey, promise);
  return promise;
}

// ✅ For components that need to check multiple users' memberships
export async function getBulkOrganizationMemberships(profileIds) {
  if (!profileIds || profileIds.length === 0) return {};

  const queryKey = `bulk-memberships-${profileIds.sort().join(',')}`;
  
  if (pendingRequests.has(queryKey)) {
    return pendingRequests.get(queryKey);
  }

  const promise = (async () => {
    try {
      const { data: memberships, error } = await supabase
        .from('organization_memberships')
        .select('profile_id, organization_id, organization_type, role, is_public')
        .in('profile_id', profileIds)
        .eq('is_public', true); // Only public memberships to avoid RLS issues

      if (error) {
        console.error('Error fetching bulk memberships:', error);
        return {};
      }

      // Group by profile_id
      const membershipMap = {};
      memberships?.forEach(membership => {
        if (!membershipMap[membership.profile_id]) {
          membershipMap[membership.profile_id] = membership;
        }
      });

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