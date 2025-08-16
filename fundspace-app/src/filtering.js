// src/filtering.js
import { parseMinFundingAmount, parseMaxFundingAmount, parseNonprofitBudgetRange, parseFundingAmount } from './utils.js';

export const filterGrants = (grant, filters) => {
  const { searchTerm, locationFilter, categoryFilter, grantTypeFilter, grantStatusFilter, minFunding, maxFunding } = filters;

  const term = (searchTerm || '').toLowerCase();
  const matchesSearch =
    !term ||
    (grant.title || '').toLowerCase().includes(term) ||
    (grant.description || '').toLowerCase().includes(term) ||
    (grant.foundationName || '').toLowerCase().includes(term) ||
    (grant.keywords && grant.keywords.some((k) => (k || '').toLowerCase().includes(term)));

  // FIXED: Correctly checks the 'locations' array of objects
  const locFilterArray = Array.isArray(locationFilter) ? locationFilter.map(l => l.toLowerCase()) : [];
  const grantLocs = Array.isArray(grant.locations) ? grant.locations.map(l => (l.name || '').toLowerCase()) : [];
  const matchesLocation =
    locFilterArray.length === 0 ||
    locFilterArray.some(filterLoc => grantLocs.includes(filterLoc));

  // FIXED: Correctly checks the 'categories' array of objects
  const categoryFilterArray = Array.isArray(categoryFilter) ? categoryFilter.map(c => c.toLowerCase()) : [];
  const grantCats = Array.isArray(grant.categories) ? grant.categories.map(c => (c.name || '').toLowerCase()) : [];
  const matchesCategory = 
    categoryFilterArray.length === 0 || 
    categoryFilterArray.some(filterCat => grantCats.includes(filterCat));

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

// NEW: Enhanced grant filtering with taxonomy support
export const filterGrantsWithTaxonomy = (grant, filters) => {
  const { 
    searchTerm, 
    locationFilter, 
    categoryFilter, // Legacy category support
    taxonomyFilter = [], // New taxonomy filter
    grantTypeFilter, 
    grantStatusFilter,
    minFunding,
    maxFunding,
    eligibleOrganizationTypes = [] // Filter by what org types are eligible
  } = filters;

  const term = (searchTerm || '').toLowerCase();
  const matchesSearch =
    !term ||
    (grant.title || '').toLowerCase().includes(term) ||
    (grant.description || '').toLowerCase().includes(term) ||
    (grant.foundationName || '').toLowerCase().includes(term);

  // Location filtering (unchanged)
  const locFilterArray = Array.isArray(locationFilter) ? locationFilter.map(l => l.toLowerCase()) : [];
  const grantLocs = Array.isArray(grant.locations) ? grant.locations.map(l => (l.name || '').toLowerCase()) : [];
  const matchesLocation =
    locFilterArray.length === 0 ||
    locFilterArray.some(filterLoc => grantLocs.includes(filterLoc));

  // Legacy category filtering (keep for backward compatibility)
  const categoryFilterArray = Array.isArray(categoryFilter) ? categoryFilter.map(c => c.toLowerCase()) : [];
  const grantCats = Array.isArray(grant.categories) ? grant.categories.map(c => (c.name || '').toLowerCase()) : [];
  const matchesCategory = 
    categoryFilterArray.length === 0 || 
    categoryFilterArray.some(filterCat => grantCats.includes(filterCat));

  // NEW: Taxonomy-based organization type filtering
  const matchesTaxonomy = taxonomyFilter.length === 0 || 
    (grant.eligible_organization_types && 
     taxonomyFilter.some(taxonomyCode => 
       grant.eligible_organization_types.includes(taxonomyCode) ||
       // Also match parent taxonomy codes (e.g., "nonprofit" matches "nonprofit.501c3")
       grant.eligible_organization_types.some(eligible => eligible.startsWith(taxonomyCode + '.'))
     ));

  // Organization type eligibility (if grant specifies eligible types)
  const matchesEligibleOrgTypes = eligibleOrganizationTypes.length === 0 ||
    !grant.eligible_organization_types ||
    grant.eligible_organization_types.some(type => 
      eligibleOrganizationTypes.some(userType => 
        type === userType || type.startsWith(userType + '.') || userType.startsWith(type + '.')
      )
    );

  // Funding amount filtering
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

  return matchesSearch && 
         matchesLocation && 
         matchesCategory && 
         matchesTaxonomy && 
         matchesEligibleOrgTypes && 
         matchesMinFunding && 
         matchesMaxFunding && 
         matchesGrantType && 
         matchesGrantStatus;
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

export const filterNonprofits = (nonprofit, filters) => {
  const { searchTerm, locationFilter, focusAreaFilter, minBudget, maxBudget, minStaff, maxStaff } = filters;
  const term = (searchTerm || '').toLowerCase();
  
  const matchesSearch = !term ||
    (nonprofit.name || '').toLowerCase().includes(term) ||
    (nonprofit.description || '').toLowerCase().includes(term) ||
    (nonprofit.tagline || '').toLowerCase().includes(term) ||
    (nonprofit.focusAreas && nonprofit.focusAreas.some(area => (area || '').toLowerCase().includes(term)));

  const locFilterArray = Array.isArray(locationFilter) ? locationFilter.map(l => l.toLowerCase()) : [];
  const matchesLocation = locFilterArray.length === 0 || !locFilterArray[0] || locFilterArray.some(l => (nonprofit.location || '').toLowerCase().includes(l));

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

// Helper function to parse budget strings like "$1M - $5M" or "Up to $30M"
const parseBudgetString = (budgetStr) => {
  if (!budgetStr) return 0;
  
  // Remove currency symbols and convert to lowercase
  const cleaned = budgetStr.toLowerCase().replace(/[$,\s]/g, '');
  
  // Extract the first number and multiplier
  const match = cleaned.match(/(\d+(?:\.\d+)?)(k|m|b)?/);
  if (!match) return 0;
  
  const num = parseFloat(match[1]);
  const multiplier = match[2];
  
  switch (multiplier) {
    case 'k': return num * 1000;
    case 'm': return num * 1000000;
    case 'b': return num * 1000000000;
    default: return num;
  }
};

// Organization filtering function
export const filterOrganizations = (organizations, filterConfig) => {
  return organizations.filter(org => {
    // Search term filter
    if (filterConfig.searchTerm) {
      const searchLower = filterConfig.searchTerm.toLowerCase();
      const matchesSearch = 
        org.name?.toLowerCase().includes(searchLower) ||
        org.description?.toLowerCase().includes(searchLower) ||
        org.focus_areas?.some(area => area.toLowerCase().includes(searchLower));
      
      if (!matchesSearch) return false;
    }

    // Location filter
    if (filterConfig.locationFilter && filterConfig.locationFilter.length > 0) {
      if (!org.location || !filterConfig.locationFilter.some(loc => 
        org.location.toLowerCase().includes(loc.toLowerCase())
      )) {
        return false;
      }
    }

    // Focus area filter
    if (filterConfig.focusAreaFilter && filterConfig.focusAreaFilter.length > 0) {
      if (!org.focus_areas || !filterConfig.focusAreaFilter.some(area =>
        org.focus_areas.includes(area)
      )) {
        return false;
      }
    }

    // Organization type filter
    if (filterConfig.typeFilter && filterConfig.typeFilter.length > 0) {
      if (!filterConfig.typeFilter.includes(org.type)) {
        return false;
      }
    }

    // Taxonomy filter (if you want to filter by specific taxonomies)
    if (filterConfig.taxonomyFilter && filterConfig.taxonomyFilter.length > 0) {
      if (!filterConfig.taxonomyFilter.includes(org.taxonomy_code)) {
        return false;
      }
    }

    // Budget filter for nonprofits
    if (filterConfig.minBudget || filterConfig.maxBudget) {
      if (org.type === 'nonprofit' && org.budget) {
        const budgetValue = parseBudgetString(org.budget);
        if (filterConfig.minBudget && budgetValue < parseFloat(filterConfig.minBudget)) {
          return false;
        }
        if (filterConfig.maxBudget && budgetValue > parseFloat(filterConfig.maxBudget)) {
          return false;
        }
      }
    }

    // Annual giving filter for foundations
    if (filterConfig.annualGivingFilter) {
      if (org.type === 'foundation' && org.total_funding_annually) {
        const givingValue = parseBudgetString(org.total_funding_annually);
        const ranges = {
          '0-500000': [0, 500000],
          '500000-1000000': [500000, 1000000],
          '1000000-5000000': [1000000, 5000000],
          '5000000-10000000': [5000000, 10000000],
          '10000000-50000000': [10000000, 50000000],
          '50000000-100000000': [50000000, 100000000],
          '100000000-999999999': [100000000, 999999999]
        };
        
        const range = ranges[filterConfig.annualGivingFilter];
        if (range && (givingValue < range[0] || givingValue > range[1])) {
          return false;
        }
      }
    }

    return true;
  });
};

// Helper function to check if a grant is eligible for a specific organization taxonomy
export const isGrantEligibleForOrganization = (grant, organizationTaxonomyCode) => {
  if (!grant.eligible_organization_types || grant.eligible_organization_types.length === 0) {
    return true; // If no restrictions specified, assume eligible for all
  }
  
  return grant.eligible_organization_types.some(eligible => 
    eligible === organizationTaxonomyCode || 
    eligible.startsWith(organizationTaxonomyCode + '.') ||
    organizationTaxonomyCode.startsWith(eligible + '.')
  );
};

// Helper function to get grants specifically for an organization type
export const getGrantsForOrganizationType = (grants, organizationTaxonomyCode) => {
  return grants.filter(grant => isGrantEligibleForOrganization(grant, organizationTaxonomyCode));
};