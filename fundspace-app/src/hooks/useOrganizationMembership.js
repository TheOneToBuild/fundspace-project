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

        const { data: membershipData, error: membershipError } = await supabase
          .from('organization_memberships')
          .select('*')
          .eq('user_id', profileId)
          .limit(1);

        if (membershipError) throw membershipError;

        if (membershipData && membershipData.length > 0) {
          const membership = membershipData[0];
          
          const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select('id, name, tagline, image_url')
            .eq('id', membership.organization_id)
            .single();

          if (!orgError && orgData) {
            const result = {
              ...membership,
              organization: orgData
            };
            
            if (isMountedRef.current) {
              setMembership(result);
            }
          } else {
            if (isMountedRef.current) {
              setMembership(membership);
            }
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

      const { data: membershipData, error: membershipError } = await supabase
        .from('organization_memberships')
        .select('*')
        .eq('user_id', profileId)
        .limit(1);

      if (membershipError) throw membershipError;

      if (membershipData && membershipData.length > 0) {
        const membership = membershipData[0];
        
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('id, name, tagline, image_url')
          .eq('id', membership.organization_id)
          .single();

        if (!orgError && orgData) {
          return {
            ...membership,
            organization: orgData
          };
        }
        
        return membership;
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
  if (!profileIds || profileIds.length === 0) return {};

  const queryKey = `bulk-memberships-${profileIds.sort().join(',')}`;
  
  if (pendingRequests.has(queryKey)) {
    return pendingRequests.get(queryKey);
  }

  const promise = (async () => {
    try {
      const { data: membershipData, error: membershipError } = await supabase
        .from('organization_memberships')
        .select('user_id, role, organization_id')
        .in('user_id', profileIds);

      if (membershipError) throw membershipError;

      if (membershipData && membershipData.length > 0) {
        const orgIds = [...new Set(membershipData.map(m => m.organization_id))];
        
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('id, name, type')
          .in('id', orgIds);

        if (!orgError && orgData) {
          const membershipMap = {};
          membershipData.forEach(membership => {
            const org = orgData.find(o => o.id === membership.organization_id);
            membershipMap[membership.user_id] = {
              ...membership,
              organizations: org
            };
          });
          return membershipMap;
        }
      }
      
      return {};
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