// src/utils/OrganizationAPI.js - OPTIMIZED VERSION with globalDataManager integration
import { supabase } from '../supabaseClient';
import { optimizedSupabaseQuery } from './apiRequestOptimizer';
import globalDataManager from './globalDataManager';

// ✅ GLOBAL REQUEST DEDUPLICATION for organization queries
const orgRequestCache = new Map();
const CACHE_TTL = 30000; // 30 seconds

function deduplicateOrgRequest(key, requestFunction) {
  const now = Date.now();
  
  // Check if we have a recent cached result
  const cached = orgRequestCache.get(key);
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return Promise.resolve(cached.data);
  }
  
  // Check if request is already in progress
  if (cached && cached.promise) {
    return cached.promise;
  }
  
  // Make new request
  const promise = requestFunction()
    .then(result => {
      orgRequestCache.set(key, {
        data: result,
        timestamp: now,
        promise: null
      });
      return result;
    })
    .catch(error => {
      orgRequestCache.delete(key);
      throw error;
    });
  
  // Store the promise while request is in progress
  orgRequestCache.set(key, {
    data: null,
    timestamp: now,
    promise
  });
  
  return promise;
}

class OrganizationAPI {
  /**
   * ✅ OPTIMIZED: Get single organization with deduplication and batch loading
   */
  static async getOrganization(orgId) {
    if (!orgId) return { data: null, error: new Error('Organization ID required') };
    
    return deduplicateOrgRequest(`single-${orgId}`, async () => {
      try {
        // Use globalDataManager for batch optimization
        const orgsData = await globalDataManager.getOrganizations([orgId]);
        const orgData = orgsData[orgId];
        
        if (orgData) {
          return { data: orgData, error: null };
        } else {
          return { data: null, error: new Error('Organization not found') };
        }
      } catch (error) {
        console.warn('Organization batch fetch failed, falling back to direct query:', error);
        
        // Fallback to direct query
        const { data, error: directError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', orgId)
          .single();
        
        return { data, error: directError };
      }
    });
  }
  
  /**
   * ✅ OPTIMIZED: Search organizations with deduplication
   */
  static async searchOrganizations(query, filters = {}) {
    if (!query || query.length < 2) {
      return { data: [], error: null };
    }
    
    const filterKey = JSON.stringify(filters);
    const cacheKey = `search-${query}-${filterKey}`;
    
    return deduplicateOrgRequest(cacheKey, async () => {
      let queryBuilder = supabase
        .from('organizations')
        .select('*')
        .ilike('name', `%${query}%`);
      
      if (filters.type) {
        queryBuilder = queryBuilder.eq('type', filters.type);
      }
      
      if (filters.taxonomy_pattern) {
        queryBuilder = queryBuilder.ilike('taxonomy_code', filters.taxonomy_pattern);
      }
      
      if (filters.location) {
        queryBuilder = queryBuilder.ilike('location', `%${filters.location}%`);
      }
      
      if (filters.capabilities) {
        queryBuilder = queryBuilder.contains('capabilities', filters.capabilities);
      }
      
      // Add limit to prevent excessive results
      queryBuilder = queryBuilder.limit(filters.limit || 20);
      
      const { data, error } = await queryBuilder;
      return { data: data || [], error };
    });
  }
  
  /**
   * Create organization (no optimization needed - write operation)
   */
  static async createOrganization(orgData) {
    const result = await supabase
      .from('organizations')
      .insert(orgData)
      .select()
      .single();
    
    // Clear cache after creation to ensure fresh data
    orgRequestCache.clear();
    
    return result;
  }
  
  /**
   * Update organization (no optimization needed - write operation)
   */
  static async updateOrganization(orgId, updates) {
    const result = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', orgId)
      .select()
      .single();
    
    // Clear specific cache entries after update
    for (const [key] of orgRequestCache.entries()) {
      if (key.includes(`-${orgId}`)) {
        orgRequestCache.delete(key);
      }
    }
    
    return result;
  }
  
  /**
   * ✅ OPTIMIZED: Get organizations by type with batch loading
   */
  static async getOrganizationsByType(type, limit = 10) {
    return deduplicateOrgRequest(`type-${type}-${limit}`, async () => {
      try {
        // Use optimized query wrapper
        const queryBuilder = supabase
          .from('organizations')
          .select('*')
          .eq('type', type)
          .limit(limit);
        
        const optimizedResult = await optimizedSupabaseQuery(
          queryBuilder,
          'organizations_single',
          { orgType: type, limit }
        );
        
        return optimizedResult;
      } catch (error) {
        console.warn('Optimized org type query failed, using fallback:', error);
        
        // Fallback to direct query
        const { data, error: directError } = await supabase
          .from('organizations')
          .select('*')
          .eq('type', type)
          .limit(limit);
        
        return { data: data || [], error: directError };
      }
    });
  }
  
  /**
   * ✅ OPTIMIZED: Get organizations by taxonomy with deduplication
   */
  static async getOrganizationsByTaxonomy(taxonomyPattern, limit = 10) {
    return deduplicateOrgRequest(`taxonomy-${taxonomyPattern}-${limit}`, async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .ilike('taxonomy_code', taxonomyPattern)
        .limit(limit);
      
      return { data: data || [], error };
    });
  }
  
  /**
   * ✅ OPTIMIZED: Get organizations by capability with deduplication
   */
  static async getOrganizationsByCapability(capability, limit = 10) {
    return deduplicateOrgRequest(`capability-${capability}-${limit}`, async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .contains('capabilities', [capability])
        .limit(limit);
      
      return { data: data || [], error };
    });
  }
  
  /**
   * ✅ NEW: Batch get multiple organizations (most efficient)
   */
  static async getOrganizations(orgIds) {
    if (!orgIds || orgIds.length === 0) {
      return { data: [], error: null };
    }
    
    const cacheKey = `batch-${orgIds.sort().join(',')}`;
    
    return deduplicateOrgRequest(cacheKey, async () => {
      try {
        // Use globalDataManager for optimal batching
        const orgsData = await globalDataManager.getOrganizations(orgIds);
        const dataArray = orgIds.map(id => orgsData[id]).filter(Boolean);
        
        return { data: dataArray, error: null };
      } catch (error) {
        console.warn('Batch org fetch failed, using fallback:', error);
        
        // Fallback to direct query
        const { data, error: directError } = await supabase
          .from('organizations')
          .select('*')
          .in('id', orgIds);
        
        return { data: data || [], error: directError };
      }
    });
  }
  
  /**
   * ✅ NEW: Get organization by slug with optimization
   */
  static async getOrganizationBySlug(slug) {
    if (!slug) return { data: null, error: new Error('Organization slug required') };
    
    return deduplicateOrgRequest(`slug-${slug}`, async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', slug)
        .single();
      
      return { data, error };
    });
  }
  
  /**
   * ✅ NEW: Clear cache utility (for testing/debugging)
   */
  static clearCache() {
    orgRequestCache.clear();
    console.log('OrganizationAPI cache cleared');
  }
  
  /**
   * ✅ NEW: Get cache stats (for monitoring)
   */
  static getCacheStats() {
    return {
      size: orgRequestCache.size,
      entries: Array.from(orgRequestCache.keys())
    };
  }
}

// Clean up old cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of orgRequestCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      orgRequestCache.delete(key);
    }
  }
}, CACHE_TTL);

export default OrganizationAPI;