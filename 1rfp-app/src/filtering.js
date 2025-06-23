// src/filtering.js
import { parseMinFundingAmount, parseMaxFundingAmount, parseNonprofitBudgetRange, parseFundingAmount } from './utils.js';

export const filterGrants = (grant, filters) => {
  const { searchTerm, locationFilter, categoryFilter, grantTypeFilter, grantStatusFilter, minFunding, maxFunding } = filters;

  const term = (searchTerm || '').toLowerCase();
  const matchesSearch =
    (grant.title || '').toLowerCase().includes(term) ||
    (grant.description || '').toLowerCase().includes(term) ||
    (grant.foundationName || '').toLowerCase().includes(term) ||
    (grant.keywords && grant.keywords.some((k) => (k || '').toLowerCase().includes(term)));

  const locFilterArray = Array.isArray(locationFilter) ? locationFilter.map(l => l.toLowerCase()) : [];
  const grantLocs = (grant.location || '').toLowerCase().split(',').map(l => l.trim());
  const matchesLocation =
    locFilterArray.length === 0 ||
    locFilterArray.some(l => l === 'all bay area counties') ||
    grantLocs.includes('all bay area counties') ||
    locFilterArray.some(l => grantLocs.includes(l));

  const categoryFilterArray = Array.isArray(categoryFilter) ? categoryFilter : [];
  const matchesCategory = categoryFilterArray.length === 0 || !categoryFilterArray[0] || categoryFilterArray.includes(grant.category);

  const grantMinAmount = parseMinFundingAmount(grant.fundingAmount);
  const grantMaxAmount = parseMaxFundingAmount(grant.fundingAmount);
  const matchesMinFunding = !minFunding || grantMaxAmount >= parseFloat(minFunding);
  const matchesMaxFunding = !maxFunding || grantMinAmount <= parseFloat(maxFunding);

  const matchesGrantType = !grantTypeFilter || grant.grantType === grantTypeFilter;

  let matchesGrantStatus = true;
  if (grantStatusFilter) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); 
      
      const grantDueDateString = grant.dueDate;

      if (grantStatusFilter === 'Open') {
          matchesGrantStatus = !grantDueDateString || new Date(grantDueDateString) >= today;
      } else if (grantStatusFilter === 'Rolling') {
          matchesGrantStatus = !grantDueDateString;
      } else if (grantStatusFilter === 'Closed') {
          matchesGrantStatus = grantDueDateString && new Date(grantDueDateString) < today;
      }
  }

  return matchesSearch && matchesLocation && matchesCategory && matchesMinFunding && matchesMaxFunding && matchesGrantType && matchesGrantStatus;
};

export const filterFunders = (funder, filters) => {
  const { searchTerm, locationFilter, focusAreaFilter, grantTypeFilter, funderTypeFilter, geographicScopeFilter, annualGivingFilter, minFunding, maxFunding } = filters;

  const term = (searchTerm || '').toLowerCase();
  const matchesSearch = !term || 
    (funder.name || '').toLowerCase().includes(term) ||
    (funder.description || '').toLowerCase().includes(term) ||
    (funder.focus_areas && funder.focus_areas.some(area => (area || '').toLowerCase().includes(term))) ||
    (funder.grant_types && funder.grant_types.some(type => (type || '').toLowerCase().includes(term)));
  
  const locFilterArray = Array.isArray(locationFilter) ? locationFilter.map(l => l.toLowerCase()) : [];
  const matchesLocation = locFilterArray.length === 0 || !locFilterArray[0] || locFilterArray.some(l => (funder.location || '').toLowerCase().includes(l));
    
  const focusAreaFilterArray = Array.isArray(focusAreaFilter) ? focusAreaFilter : [];
  const matchesFocusArea = focusAreaFilterArray.length === 0 || !focusAreaFilterArray[0] || 
    (funder.focus_areas && Array.isArray(funder.focus_areas) &&
     focusAreaFilterArray.some(area => funder.focus_areas.includes(area)));

  const matchesGrantType = !grantTypeFilter || 
    (funder.grant_types && Array.isArray(funder.grant_types) && 
     funder.grant_types.some(type => type === grantTypeFilter));

  const matchesFunderType = !funderTypeFilter || 
    (funder.funder_type?.name === funderTypeFilter);
    
  const geographicScopeFilterArray = Array.isArray(geographicScopeFilter) ? geographicScopeFilter : [];
  const matchesGeographicScope = geographicScopeFilterArray.length === 0 || !geographicScopeFilterArray[0] ||
    (funder.funding_locations && Array.isArray(funder.funding_locations) &&
     geographicScopeFilterArray.some(scope => funder.funding_locations.includes(scope)));

  let matchesAnnualGiving = true;
  if (annualGivingFilter) {
    const [minRange, maxRange] = annualGivingFilter.split('-').map(Number);
    const funderAmount = parseFundingAmount(funder.total_funding_annually) || 0;
    
    if (funderAmount === 0 && funder.total_funding_annually?.toLowerCase() !== 'varies') {
        matchesAnnualGiving = false;
    } else if (funderAmount !== 0) {
        if (minRange && maxRange) {
            matchesAnnualGiving = funderAmount >= minRange && funderAmount <= maxRange;
        } else if (minRange) {
            matchesAnnualGiving = funderAmount >= minRange;
        }
    }
  }

  const funderMinAmount = parseMinFundingAmount(funder.total_funding_annually);
  const funderMaxAmount = parseMaxFundingAmount(funder.total_funding_annually);
  const minF = parseFloat(minFunding);
  const maxF = parseFloat(maxFunding);
  const matchesMinFunding = isNaN(minF) || funderMaxAmount >= minF;
  const matchesMaxFunding = isNaN(maxF) || funderMinAmount <= maxF;

  return matchesSearch && matchesLocation && matchesFocusArea && matchesGrantType && matchesFunderType && matchesGeographicScope && matchesAnnualGiving && matchesMinFunding && matchesMaxFunding;
};

export const filterFundersArray = (funders, filterConfig) => {
  if (!Array.isArray(funders)) {
    return [];
  }
  const filtered = funders.filter(funder => filterFunders(funder, filterConfig));
  return filtered;
};


// --- THIS FUNCTION HAS BEEN UPDATED ---
export const filterNonprofits = (nonprofit, filters) => {
  const { searchTerm, locationFilter, focusAreaFilter, minBudget, maxBudget, minStaff, maxStaff } = filters;
  const term = (searchTerm || '').toLowerCase();
  
  const matchesSearch = !term ||
    (nonprofit.name || '').toLowerCase().includes(term) ||
    (nonprofit.description || '').toLowerCase().includes(term) ||
    (nonprofit.tagline || '').toLowerCase().includes(term) ||
    (nonprofit.focusAreas && nonprofit.focusAreas.some(area => (area || '').toLowerCase().includes(term)));

  // Updated logic for location array
  const locFilterArray = Array.isArray(locationFilter) ? locationFilter.map(l => l.toLowerCase()) : [];
  const matchesLocation = locFilterArray.length === 0 || !locFilterArray[0] || locFilterArray.some(l => (nonprofit.location || '').toLowerCase().includes(l));

  // Updated logic for focus area array
  const focusAreaFilterArray = Array.isArray(focusAreaFilter) ? focusAreaFilter : [];
  const matchesFocusArea = focusAreaFilterArray.length === 0 || !focusAreaFilterArray[0] || (nonprofit.focusAreas && focusAreaFilterArray.some(fa => nonprofit.focusAreas.includes(fa)));

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