import { supabase } from '../supabaseClient';
import { getOrganizationData, getUserOrganizationMembership } from './rpcClientFunctions';

class OrganizationAPI {
  static async getOrganization(orgId) {
    if (!orgId) return { data: null, error: new Error('Organization ID required') };
    
    try {
      const orgData = await getOrganizationData(orgId);
      return { data: orgData, error: null };
    } catch (error) {
      console.warn('Organization RPC fetch failed, falling back to direct query:', error);
      
      const { data, error: directError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();
      
      return { data, error: directError };
    }
  }
  
  static async searchOrganizations(query, filters = {}) {
    if (!query || query.length < 2) {
      return { data: [], error: null };
    }
    
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
    
    queryBuilder = queryBuilder.limit(filters.limit || 20);
    
    const { data, error } = await queryBuilder;
    return { data: data || [], error };
  }
  
  static async createOrganization(orgData) {
    const result = await supabase
      .from('organizations')
      .insert(orgData)
      .select()
      .single();
    
    return result;
  }
  
  static async updateOrganization(orgId, updates) {
    const result = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', orgId)
      .select()
      .single();
    
    return result;
  }
  
  static async getOrganizationsByType(type, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('type', type)
        .limit(limit);
      
      return { data: data || [], error };
    } catch (error) {
      return { data: [], error };
    }
  }
  
  static async getOrganizationsByTaxonomy(taxonomyPattern, limit = 10) {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .ilike('taxonomy_code', taxonomyPattern)
      .limit(limit);
    
    return { data: data || [], error };
  }
  
  static async getOrganizationsByCapability(capability, limit = 10) {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .contains('capabilities', [capability])
      .limit(limit);
    
    return { data: data || [], error };
  }
  
  static async getOrganizations(orgIds) {
    if (!orgIds || orgIds.length === 0) {
      return { data: [], error: null };
    }
    
    try {
      const orgsData = await Promise.all(
        orgIds.map(id => getOrganizationData(id))
      );
      
      return { data: orgsData.filter(Boolean), error: null };
    } catch (error) {
      const { data, error: directError } = await supabase
        .from('organizations')
        .select('*')
        .in('id', orgIds);
      
      return { data: data || [], error: directError };
    }
  }
  
  static async getOrganizationBySlug(slug) {
    if (!slug) return { data: null, error: new Error('Organization slug required') };
    
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('slug', slug)
      .single();
    
    return { data, error };
  }
}

export default OrganizationAPI;