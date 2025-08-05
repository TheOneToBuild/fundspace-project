import { supabase } from '../supabaseClient';

class OrganizationAPI {
  static async getOrganization(orgId) {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single();
    
    return { data, error };
  }
  
  static async searchOrganizations(query, filters = {}) {
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
    
    return queryBuilder;
  }
  
  static async createOrganization(orgData) {
    return supabase
      .from('organizations')
      .insert(orgData)
      .select()
      .single();
  }
  
  static async updateOrganization(orgId, updates) {
    return supabase
      .from('organizations')
      .update(updates)
      .eq('id', orgId)
      .select()
      .single();
  }
  
  static async getOrganizationsByType(type, limit = 10) {
    return supabase
      .from('organizations')
      .select('*')
      .eq('type', type)
      .limit(limit);
  }
  
  static async getOrganizationsByTaxonomy(taxonomyPattern, limit = 10) {
    return supabase
      .from('organizations')
      .select('*')
      .ilike('taxonomy_code', taxonomyPattern)
      .limit(limit);
  }
  
  static async getOrganizationsByCapability(capability, limit = 10) {
    return supabase
      .from('organizations')
      .select('*')
      .contains('capabilities', [capability])
      .limit(limit);
  }
}

export default OrganizationAPI;
