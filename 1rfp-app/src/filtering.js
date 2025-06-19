// src/filtering.js - FIXED VERSION
import { parseMinFundingAmount, parseMaxFundingAmount, parseNonprofitBudgetRange } from './utils.js';

export const filterGrants = (grant, filters) => {
  const { searchTerm, locationFilter, categoryFilter, grantTypeFilter, grantStatusFilter, minFunding, maxFunding } = filters;

  // FIX: Added checks `(grant.field || '')` to prevent errors on null values
  const term = (searchTerm || '').toLowerCase();
  const matchesSearch =
    (grant.title || '').toLowerCase().includes(term) ||
    (grant.description || '').toLowerCase().includes(term) ||
    (grant.foundationName || '').toLowerCase().includes(term) ||
    (grant.keywords && grant.keywords.some((k) => (k || '').toLowerCase().includes(term)));

  const locFilter = (locationFilter || '').toLowerCase();
  const grantLocs = (grant.location || '').toLowerCase();
  const matchesLocation =
    !locFilter ||
    locFilter === 'all bay area counties' ||
    grantLocs.includes('all bay area counties') ||
    grantLocs.split(',').map((l) => l.trim()).includes(locFilter);

  const matchesCategory = !categoryFilter || grant.category === categoryFilter;

  // Funding amount checks are safe because parse functions handle nulls
  const grantMinAmount = parseMinFundingAmount(grant.fundingAmount);
  const grantMaxAmount = parseMaxFundingAmount(grant.fundingAmount);
  const matchesMinFunding = !minFunding || grantMaxAmount >= parseFloat(minFunding);
  const matchesMaxFunding = !maxFunding || grantMinAmount <= parseFloat(maxFunding);

  const matchesGrantType = !grantTypeFilter || grant.grantType === grantTypeFilter;

  // --- THIS IS THE UPDATED DYNAMIC STATUS LOGIC ---
  let matchesGrantStatus = true; // Default to true, only filter if a status is selected

  if (grantStatusFilter) {
      const today = new Date();
      // Set time to 0 to compare dates only, avoiding timezone issues
      today.setHours(0, 0, 0, 0); 
      
      const grantDueDateString = grant.dueDate; // e.g., "2025-06-14" or null

      if (grantStatusFilter === 'Open') {
          // "Open" is true if there's no due date (continuous) OR the due date is today or in the future.
          matchesGrantStatus = !grantDueDateString || new Date(grantDueDateString) >= today;
      } else if (grantStatusFilter === 'Rolling') {
          // "Rolling" is true ONLY if there is no due date.
          matchesGrantStatus = !grantDueDateString;
      } else if (grantStatusFilter === 'Closed') {
          // "Closed" is true ONLY if a due date exists AND it's in the past.
          matchesGrantStatus = grantDueDateString && new Date(grantDueDateString) < today;
      }
  }

  return matchesSearch && matchesLocation && matchesCategory && matchesMinFunding && matchesMaxFunding && matchesGrantType && matchesGrantStatus;
};

// FIXED: Updated to use correct field names and exact matching for filters
export const filterFunders = (funder, filters) => {
  const { searchTerm, locationFilter, focusAreaFilter, grantTypeFilter, annualGivingFilter, minFunding, maxFunding } = filters;

  console.log('Filtering funder:', funder.name, 'with filters:', filters);

  // Search term filter - using correct field names
  const term = (searchTerm || '').toLowerCase();
  const matchesSearch = !term || 
    (funder.name || '').toLowerCase().includes(term) ||
    (funder.description || '').toLowerCase().includes(term) ||
    (funder.focus_areas && funder.focus_areas.some(area => (area || '').toLowerCase().includes(term))) ||
    (funder.grant_types && funder.grant_types.some(type => (type || '').toLowerCase().includes(term)));

  // Location filter
  const locFilter = (locationFilter || '').toLowerCase();
  const matchesLocation = !locFilter || 
    (funder.location || '').toLowerCase().includes('all bay area counties') || 
    (funder.location || '').toLowerCase().includes(locFilter);

  // Focus area filter - FIXED: use exact matching and correct field name
  const matchesFocusArea = !focusAreaFilter || 
    (funder.focus_areas && Array.isArray(funder.focus_areas) && 
     funder.focus_areas.some(area => area === focusAreaFilter));

  // Grant type filter - FIXED: use exact matching and correct field name  
  const matchesGrantType = !grantTypeFilter || 
    (funder.grant_types && Array.isArray(funder.grant_types) && 
     funder.grant_types.some(type => type === grantTypeFilter));

  // NEW: Annual giving filter
  let matchesAnnualGiving = true;
  if (annualGivingFilter) {
    const [minRange, maxRange] = annualGivingFilter.split('-').map(Number);
    const funderAmount = parseMinFundingAmount(funder.total_funding_annually) || 0;
    
    if (minRange && maxRange) {
      matchesAnnualGiving = funderAmount >= minRange && funderAmount <= maxRange;
    } else if (minRange) {
      // For ranges like "100000000-999999999" (100M+)
      matchesAnnualGiving = funderAmount >= minRange;
    }
  }

  // Funding amount filters (existing)
  const funderMinAmount = parseMinFundingAmount(funder.total_funding_annually);
  const funderMaxAmount = parseMaxFundingAmount(funder.total_funding_annually);
  const minF = parseFloat(minFunding);
  const maxF = parseFloat(maxFunding);
  const matchesMinFunding = isNaN(minF) || funderMaxAmount >= minF;
  const matchesMaxFunding = isNaN(maxF) || funderMinAmount <= maxF;

  const result = matchesSearch && matchesLocation && matchesFocusArea && matchesGrantType && matchesAnnualGiving && matchesMinFunding && matchesMaxFunding;
  
  console.log(`Funder ${funder.name}:`, {
    matchesSearch,
    matchesLocation, 
    matchesFocusArea,
    matchesGrantType,
    matchesAnnualGiving,
    matchesMinFunding,
    matchesMaxFunding,
    result,
    focus_areas: funder.focus_areas,
    grant_types: funder.grant_types,
    total_funding_annually: funder.total_funding_annually
  });

  return result;
};

// Array version of filterFunders for usePaginatedFilteredData compatibility
export const filterFundersArray = (funders, filterConfig) => {
  if (!Array.isArray(funders)) {
    console.warn('filterFundersArray: funders is not an array:', funders);
    return [];
  }

  console.log('Filtering funders array with config:', filterConfig);
  console.log('Input funders count:', funders.length);

  const filtered = funders.filter(funder => filterFunders(funder, filterConfig));
  
  console.log('Filtered funders count:', filtered.length);
  return filtered;
};

export const filterNonprofits = (nonprofit, filters) => {
  const { searchTerm, locationFilter, focusAreaFilter, minBudget, maxBudget, minStaff, maxStaff } = filters;

  // FIX: Added checks `(nonprofit.field || '')` to prevent errors on null values
  const term = (searchTerm || '').toLowerCase();
  const matchesSearch =
    (nonprofit.name || '').toLowerCase().includes(term) ||
    (nonprofit.description || '').toLowerCase().includes(term) ||
    (nonprofit.tagline || '').toLowerCase().includes(term) ||
    (nonprofit.focusAreas && nonprofit.focusAreas.some(area => (area || '').toLowerCase().includes(term)));

  const locFilter = (locationFilter || '').toLowerCase();
  const matchesLocation = !locFilter || (nonprofit.location || '').toLowerCase().includes(locFilter);

  const matchesFocusArea = !focusAreaFilter || (nonprofit.focusAreas && nonprofit.focusAreas.includes(focusAreaFilter));

  const nonprofitBudget = parseNonprofitBudgetRange(nonprofit.budget);
  const minB = parseFloat(minBudget);
  const maxB = parseFloat(maxBudget);
  const matchesMinBudget = isNaN(minB) || nonprofitBudget.max >= minB;
  const matchesMaxBudget = isNaN(maxB) || nonprofitBudget.min <= maxB;

  const minS = parseFloat(minStaff);
  const maxS = parseFloat(maxStaff);
  const matchesMinStaff = isNaN(minS) || nonprofit.staffCount >= minS;
  const matchesMaxStaff = isNaN(maxS) || nonprofit.staffCount <= maxS;

  return matchesSearch && matchesLocation && matchesFocusArea && matchesMinBudget && matchesMaxBudget && matchesMinStaff && matchesMaxStaff;
};