// src/constants.js
import { supabase } from './supabaseClient.js';

export const CATEGORIES = [
  'Arts & Culture',
  'Community Development',
  'Education',
  'Environment',
  'Health',
  'Housing',
  'Social Services',
  'Technology',
  'Economic Development',
  'Civic Engagement',
  'Animal Welfare',
  'Youth Development'
];

export const COMMON_LOCATIONS = [
  'Alameda',
  'All Bay Area Counties',
  'Berkeley',
  'Contra Costa',
  'East Palo Alto',
  'Marin',
  'Napa',
  'Oakland',
  'Richmond',
  'San Francisco',
  'San Jose',
  'San Mateo',
  'Santa Clara',
  'Santa Cruz',
  'Sonoma'
];

export const GRANT_TYPES = [
  'Capacity Building',
  'Emergency Grant',
  'General Operating',
  'Program Support',
  'Project Grant',
  'Research Grants',
  'Seed Funding',
  'Technology Adoption',
  'Operating Support (Arts)',
  'Artist Fellowships',
  'Conservation Projects',
  'Educational Programs'
];

export const GRANT_STATUSES = [
  'Open',
  'Rolling',
  'Closed'
];

export const NONPROFIT_BUDGET_RANGES = [
  '$0 - $100K',
  '$100K - $500K',
  '$500K - $1M',
  '$1M - $5M',
  '$5M+'
];

// ADD new dynamic category function:
export const getAvailableCategories = async () => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select(`
        id,
        name,
        grant_categories!inner (
          grant_id
        )
      `)
      .order('name');

    if (error) throw error;

    return data
      .map(category => ({
        id: category.id,
        name: category.name,
        grant_count: category.grant_categories.length
      }))
      .filter(category => category.grant_count > 0)
      .sort((a, b) => b.grant_count - a.grant_count || a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Error fetching categories:', error);
    // Fallback to static list
    return CATEGORIES.map((name, index) => ({ id: index, name, grant_count: 0 }));
  }
};