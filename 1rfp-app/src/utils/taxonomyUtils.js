// src/utils/taxonomyUtils.js
import { supabase } from '../supabaseClient';

/**
 * Get all taxonomies for a given organization type
 */
export const getTaxonomiesByType = async (organizationType) => {
  const { data, error } = await supabase
    .from('organization_taxonomies')
    .select('*')
    .eq('organization_type', organizationType)
    .eq('is_active', true)
    .order('level, sort_order');
    
  if (error) throw error;
  return data;
};

/**
 * Get taxonomy hierarchy as nested tree
 */
export const buildTaxonomyTree = (taxonomies) => {
  const taxonomyMap = {};
  const roots = [];
  
  // First pass: create lookup map
  taxonomies.forEach(taxonomy => {
    taxonomyMap[taxonomy.code] = { ...taxonomy, children: [] };
  });
  
  // Second pass: build tree structure
  taxonomies.forEach(taxonomy => {
    if (taxonomy.parent_code && taxonomyMap[taxonomy.parent_code]) {
      taxonomyMap[taxonomy.parent_code].children.push(taxonomyMap[taxonomy.code]);
    } else {
      roots.push(taxonomyMap[taxonomy.code]);
    }
  });
  
  return roots;
};

/**
 * Get default capabilities for a taxonomy code
 */
export const getDefaultCapabilities = async (taxonomyCode) => {
  const { data, error } = await supabase
    .from('organization_taxonomies')
    .select('default_capabilities')
    .eq('code', taxonomyCode)
    .single();
    
  if (error) throw error;
  return data?.default_capabilities || [];
};

/**
 * Get all capability domains with capabilities
 */
export const getCapabilityDomains = async () => {
  const { data, error } = await supabase
    .from('capability_domains')
    .select(`
      *,
      capabilities (*)
    `)
    .order('sort_order');
    
  if (error) throw error;
  return data;
};