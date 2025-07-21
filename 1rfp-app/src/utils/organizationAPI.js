// src/utils/organizationAPI.js - Clean Single Table API
import { supabase } from '../supabaseClient';

class OrganizationAPI {
  // Get organization by ID
  static async getOrganization(orgId) {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single();
    
    return { data, error };
  }
  
  // Search organizations
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
  
  // Create organization
  static async createOrganization(orgData) {
    return supabase
      .from('organizations')
      .insert(orgData)
      .select()
      .single();
  }
  
  // Update organization
  static async updateOrganization(orgId, updates) {
    return supabase
      .from('organizations')
      .update(updates)
      .eq('id', orgId)
      .select()
      .single();
  }
  
  // Get organizations by type
  static async getOrganizationsByType(type, limit = 10) {
    return supabase
      .from('organizations')
      .select('*')
      .eq('type', type)
      .limit(limit);
  }
  
  // Get organizations by taxonomy
  static async getOrganizationsByTaxonomy(taxonomyPattern, limit = 10) {
    return supabase
      .from('organizations')
      .select('*')
      .ilike('taxonomy_code', taxonomyPattern)
      .limit(limit);
  }
  
  // Get organizations with specific capabilities
  static async getOrganizationsByCapability(capability, limit = 10) {
    return supabase
      .from('organizations')
      .select('*')
      .contains('capabilities', [capability])
      .limit(limit);
  }
}

export default OrganizationAPI;