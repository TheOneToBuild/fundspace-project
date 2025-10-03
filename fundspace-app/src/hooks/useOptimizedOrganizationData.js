// src/hooks/useOptimizedOrganizationData.js - Fixed version for multiple memberships
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  getPostsBatch, 
  getOrganizationsBatch,
  getOrganizationDetailsBatch
} from '../utils/rpcClientFunctions';

// Batch manager for organization data
class OrganizationDataManager {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.CACHE_TTL = 30000; // 30 seconds
  }

  // Get all user's organization memberships (not just one)
  async getUserMemberships(profileId) {
    const cacheKey = `user-memberships-${profileId}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    const promise = this._fetchUserMemberships(profileId);
    this.pendingRequests.set(cacheKey, promise);

    try {
      const data = await promise;
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  async _fetchUserMemberships(profileId) {
    try {
      const { data: memberships, error } = await supabase
        .from('organization_memberships')
        .select('organization_id, role, membership_type, organization_type, joined_at')
        .eq('profile_id', profileId)
        .order('joined_at', { ascending: false });

      if (error) throw error;
      return memberships || [];
    } catch (error) {
      console.error('Error fetching user memberships:', error);
      return [];
    }
  }

  // Get organization details
  async getOrganizationDetails(organizationId) {
    const cacheKey = `org-details-${organizationId}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    const promise = this._fetchOrganizationDetails(organizationId);
    this.pendingRequests.set(cacheKey, promise);

    try {
      const data = await promise;
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  async _fetchOrganizationDetails(organizationId) {
    try {
      const orgsData = await getOrganizationsBatch([organizationId]);
      const organization = orgsData?.[organizationId];
      return organization || null;
    } catch (error) {
      console.error('Error fetching organization details:', error);
      return null;
    }
  }

  // Get organization members
  async getOrganizationMembers(organizationId) {
    const cacheKey = `org-members-${organizationId}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    const promise = this._fetchOrganizationMembers(organizationId);
    this.pendingRequests.set(cacheKey, promise);

    try {
      const data = await promise;
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  async _fetchOrganizationMembers(organizationId) {
    try {
      const { data: members, error } = await supabase
        .from('organization_memberships')
        .select(`
          id,
          profile_id,
          role,
          membership_type,
          joined_at,
          profiles (
            id,
            full_name,
            avatar_url,
            title,
            organizational_role
          )
        `)
        .eq('organization_id', organizationId)
        .order('role', { ascending: false })
        .order('joined_at', { ascending: true });

      if (error) throw error;
      return members?.filter(member => member.profiles) || [];
    } catch (error) {
      console.error('Error fetching organization members:', error);
      return [];
    }
  }

  // Get organization posts with enhanced data
  async getOrganizationPosts(organizationId) {
    const cacheKey = `org-posts-${organizationId}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    const promise = this._fetchOrganizationPosts(organizationId);
    this.pendingRequests.set(cacheKey, promise);

    try {
      const data = await promise;
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }
  
  async _fetchOrganizationPosts(organizationId) {
    try {
      // Use the new RPC function to fetch posts for the organization
      // This assumes getPostsBatch can be called with organizationId
      // and it returns an array of post objects, already enriched.
      const posts = await getPostsBatch({ organizationId: organizationId });
      
      // The RPC function is expected to return an array of posts.
      // The previous implementation returned an array, so we ensure this one does too.
      return posts || [];
    } catch (error) {
      console.error('Error fetching organization posts:', error);
      return [];
    }
  }

  // Get organization details (photos, programs, north stars)
  async getOrganizationDetailsBatch(organizationId, userId) {
    const cacheKey = `org-details-batch-${organizationId}-${userId}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    try {
      const details = await getOrganizationDetailsBatch(organizationId, userId);
      this.cache.set(cacheKey, { data: details, timestamp: Date.now() });
      return details;
    } catch (error) {
      console.error('Error fetching org details batch:', error);
      return { photos: [], programs: [], north_stars: [] };
    }
  }
}

// Create singleton instance
const organizationDataManager = new OrganizationDataManager();

export default function useOptimizedOrganizationData(profile, session) {
  const [state, setState] = useState({
    organization: null,
    members: [],
    userMembership: null,
    organizationPosts: [],
    organizationPhotos: [],
    organizationPrograms: [],
    organizationNorthStars: [],
    allMemberships: [], // NEW: Store all user memberships
    selectedOrganization: null, // NEW: Track which org is selected
    loading: false,
    error: null
  });

  const setError = useCallback((error) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  // Get user's primary organization (first one or specified one)
  const selectOrganization = useCallback(async (organizationId = null) => {
    if (!profile?.id) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Get all user memberships
      const memberships = await organizationDataManager.getUserMemberships(profile.id);
      
      if (!memberships || memberships.length === 0) {
        setState(prev => ({
          ...prev,
          loading: false,
          organization: null,
          userMembership: null,
          members: [],
          allMemberships: [],
          selectedOrganization: null
        }));
        return;
      }

      // Select organization (specified one or first one)
      const selectedMembership = organizationId 
        ? memberships.find(m => m.organization_id === organizationId)
        : memberships[0];

      if (!selectedMembership) {
        setState(prev => ({
          ...prev,
          loading: false,
          allMemberships: memberships,
          organization: null,
          userMembership: null,
          selectedOrganization: null
        }));
        return;
      }

      const selectedOrgId = selectedMembership.organization_id;

      // Load all data for the selected organization in parallel
      const [
        organization,
        members,
        posts, 
        details
      ] = await Promise.all([
        organizationDataManager.getOrganizationDetails(selectedOrgId),
        organizationDataManager.getOrganizationMembers(selectedOrgId),
        organizationDataManager.getOrganizationPosts(selectedOrgId),
        organizationDataManager.getOrganizationDetailsBatch(selectedOrgId, session?.user?.id)
      ]);

      setState(prev => ({
        ...prev,
        loading: false,
        organization: { ...organization, ...details.organization_details },
        userMembership: selectedMembership,
        members,
        organizationPosts: posts,
        organizationPhotos: details.photos || [],
        organizationPrograms: details.programs || [],
        organizationNorthStars: details.north_stars || [],
        allMemberships: memberships,
        selectedOrganization: selectedOrgId
      }));

    } catch (error) {
      console.error('Error loading organization data:', error);
      setError(error.message);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [profile?.id]);

  // Load data when profile changes
  useEffect(() => {
    if (profile?.id) {
      selectOrganization();
    }
  }, [profile?.id, selectOrganization]);

  // Return hook interface
  return {
    ...state,
    selectOrganization,
    refresh: () => selectOrganization(state.selectedOrganization),
    hasMultipleOrganizations: state.allMemberships.length > 1
  };
}