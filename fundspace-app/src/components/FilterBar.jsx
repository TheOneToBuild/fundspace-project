// src/components/FilterBar.jsx
import React, { useMemo } from 'react';
import Select from 'react-select';
import { Search, MapPin, DollarSign, Filter, IconBriefcase, Info, ChevronDown, ListFilter, XCircle, Heart, Users as UsersIcon, Tag, TrendingUp, Building } from './Icons.jsx';
import FilterPills from './FilterPills.jsx';
import EnhancedSearchInput from './EnhancedSearchInput.jsx';

// --- DEFINED RANGES ---
const ANNUAL_GIVING_RANGES = [
  { value: '', label: 'All Funding Levels' },
  { value: '0-500000', label: 'Under $500K' },
  { value: '500000-1000000', label: '$500K - $1M' },
  { value: '1000000-5000000', label: '$1M - $5M' },
  { value: '5000000-10000000', label: '$5M - $10M' },
  { value: '10000000-25000000', label: '$10M - $25M' },
  { value: '25000000-50000000', label: '$25M - $50M' },
  { value: '50000000-100000000', label: '$50M - $100M' },
  { value: '100000000-999999999', label: '$100M+' }
];

const NONPROFIT_BUDGET_RANGES = [
  { value: '', label: 'All Budget Sizes' },
  { value: '0-250000', label: 'Under $250K' },
  { value: '250000-500000', label: '$250K - $500K' },
  { value: '500000-1000000', label: '$500K - $1M' },
  { value: '1000000-2500000', label: '$1M - $2.5M' },
  { value: '2500000-5000000', label: '$2.5M - $5M' },
  { value: '5000000-999999999', label: '$5M+' }
];

const FilterBar = ({
  isMobileVisible,
  searchTerm, setSearchTerm,
  // keep for other pages, but will not render for grants
  // Grant Filters
  locationFilter, setLocationFilter,
  categoryFilter, setCategoryFilter,
  grantTypeFilter, setGrantTypeFilter,
  grantStatusFilter, setGrantStatusFilter,
  // Funder Filters
  geographicScopeFilter, setGeographicScopeFilter,
  focusAreaFilter, setFocusAreaFilter,
  annualGivingFilter, setAnnualGivingFilter,
  funderTypeFilter, setFunderTypeFilter,
  // Nonprofit Filters
  minBudget, setMinBudget,
  maxBudget, setMaxBudget,
  minStaff, setMinStaff,
  maxStaff, setMaxStaff,
  // Organization Filters (NEW)
  typeFilter, setTypeFilter,
  availableTypes, orgTypeConfig,
  // Common Props
  sortCriteria, setSortCriteria,
  uniqueCategories = [],
  uniqueLocations = [],
  uniqueGeographicScopes = [],
  uniqueGrantTypes = [],
  uniqueGrantStatuses = [],
  uniqueFocusAreas = [],
  uniqueFunderTypes = [],
  pageType,
  onClearFilters,
  activeFilters,
  onRemoveFilter,
  hideSearchInput = false,
  funders = [],
  nonprofits = [],
  organizations = [],
  onSuggestionSelect
}) => {
  const isGrantsPage = pageType === 'grants';
  const isFundersPage = pageType === 'funders';
  const isNonprofitsPage = pageType === 'nonprofits';
  const isOrganizationsPage = pageType === 'organizations'; // NEW

  // --- DYNAMIC LABELS AND SORT OPTIONS ---
  let searchLabel = 'Search';
  let searchPlaceholder = 'Search by keyword...';
  let accentColorClass = 'focus:ring-slate-500';
  let sortOptions;

  if (isGrantsPage) {
    searchLabel = 'Search Grants';
    searchPlaceholder = "Search by keyword, foundation, category...";
    accentColorClass = 'focus:ring-blue-500';
    sortOptions = (
      <>
        <option value="dueDate_asc">Due Date (Soonest)</option>
        <option value="dueDate_desc">Due Date (Latest)</option>
        <option value="funding_desc">Funding (Highest)</option>
        <option value="funding_asc">Funding (Lowest)</option>
        <option value="title_asc">Title (A-Z)</option>
        <option value="title_desc">Title (Z-A)</option>
      </>
    );
  } else if (isFundersPage) {
    searchLabel = 'Search Funders';
    searchPlaceholder = "Search by name, focus area...";
    accentColorClass = 'focus:ring-green-500';
    sortOptions = (
      <>
        <option value="name_asc">Name (A-Z)</option>
        <option value="name_desc">Name (Z-A)</option>
        <option value="funding_desc">Annual Giving (Highest)</option>
        <option value="funding_asc">Annual Giving (Lowest)</option>
      </>
    );
  } else if (isNonprofitsPage) {
    searchLabel = 'Search Nonprofits';
    searchPlaceholder = "Search by name, focus area...";
    accentColorClass = 'focus:ring-purple-500';
    sortOptions = (
        <>
            <option value="name_asc">Name (A-Z)</option>
            <option value="name_desc">Name (Z-A)</option>
            <option value="staffCount_desc">Staff Count (Highest)</option>
            <option value="staffCount_asc">Staff Count (Lowest)</option>
            <option value="yearFounded_desc">Year Founded (Newest)</option>
            <option value="yearFounded_asc">Year Founded (Oldest)</option>
        </>
    );
  } else if (isOrganizationsPage) { // NEW
    searchLabel = 'Search Organizations';
    searchPlaceholder = "Search by name, type, focus area...";
    accentColorClass = 'focus:ring-blue-500';
    sortOptions = (
        <>
            <option value="name_asc">Name (A-Z)</option>
            <option value="name_desc">Name (Z-A)</option>
            <option value="type_asc">Type (A-Z)</option>
            <option value="type_desc">Type (Z-A)</option>
            <option value="location_asc">Location (A-Z)</option>
            <option value="location_desc">Location (Z-A)</option>
            <option value="funding_desc">Funding (High to Low)</option>
            <option value="funding_asc">Funding (Low to High)</option>
            <option value="created_desc">Newest First</option>
            <option value="created_asc">Oldest First</option>
        </>
    );
  }

  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      borderColor: state.isFocused ? (isFundersPage ? '#059669' : isNonprofitsPage ? '#7e22ce' : '#3b82f6') : '#cbd5e1',
      boxShadow: state.isFocused ? `0 0 0 1px ${isFundersPage ? '#059669' : isNonprofitsPage ? '#7e22ce' : '#3b82f6'}` : 'none',
      minHeight: '46px',
      borderRadius: '8px',
      '&:hover': { borderColor: state.isFocused ? (isFundersPage ? '#059669' : isNonprofitsPage ? '#7e22ce' : '#3b82f6') : '#94a3b8' },
      transition: 'all 0.2s ease'
    }),
    placeholder: (base) => ({ ...base, color: '#94a3b8', fontSize: '14px' }),
    multiValue: (base) => ({ ...base, backgroundColor: isFundersPage ? '#dcfce7' : isNonprofitsPage ? '#f3e8ff' : '#dbeafe', borderRadius: '6px' }),
    multiValueLabel: (base) => ({ ...base, color: isFundersPage ? '#166534' : isNonprofitsPage ? '#581c87' : '#1e40af', fontSize: '12px', fontWeight: '500' }),
    multiValueRemove: (base) => ({ ...base, color: isFundersPage ? '#166534' : isNonprofitsPage ? '#581c87' : '#1e40af', '&:hover': { backgroundColor: isFundersPage ? '#bbf7d0' : isNonprofitsPage ? '#e9d5ff' : '#bfdbfe', color: isFundersPage ? '#166534' : isNonprofitsPage ? '#581c87' : '#1e40af' } })
  };

  const locationOptions = useMemo(() => uniqueLocations.map(loc => ({ value: loc, label: loc })), [uniqueLocations]);
  const categoryOptions = useMemo(() => uniqueCategories.map(cat => ({ value: cat, label: cat })), [uniqueCategories]);
  const focusAreaOptions = useMemo(() => uniqueFocusAreas.map(area => ({ value: area, label: area })), [uniqueFocusAreas]);
  const geographicScopeOptions = useMemo(() => uniqueGeographicScopes.map(scope => ({ value: scope, label: scope })), [uniqueGeographicScopes]);

  const handleMultiSelectChange = (setter) => (selectedOptions) => {
    const values = selectedOptions ? selectedOptions.map(opt => opt.value) : [];
    setter(values);
  };
  
  const handleBudgetChange = (e) => {
    const value = e.target.value;
    if (value) {
        const [min, max] = value.split('-');
        setMinBudget(min);
        setMaxBudget(max);
    } else {
        setMinBudget('');
        setMaxBudget('');
    }
  };

  const getSelectedValues = (filter, options) => {
    if (!filter) return [];
    if (Array.isArray(filter)) {
      return options.filter(opt => filter.includes(opt.value));
    }
    return options.find(opt => opt.value === filter) || [];
  };

  const selectedLocationValues = useMemo(() => getSelectedValues(locationFilter, locationOptions), [locationFilter, locationOptions]);
  const selectedCategoryValues = useMemo(() => getSelectedValues(categoryFilter, categoryOptions), [categoryFilter, categoryOptions]);
  const selectedFocusAreaValues = useMemo(() => getSelectedValues(focusAreaFilter, focusAreaOptions), [focusAreaFilter, focusAreaOptions]);
  const selectedScopeValues = useMemo(() => getSelectedValues(geographicScopeFilter, geographicScopeOptions), [geographicScopeFilter, geographicScopeOptions]);

  // --- INTEGRATED FILTER BAR ---
  const integratedBarClasses = `w-full flex flex-wrap gap-3 items-center px-0 py-0 mt-6 ${isMobileVisible ? '' : 'hidden md:flex'} transition-all`;

  return (
    <div className={integratedBarClasses}>
      {/* Search Input removed for organizations page as well */}
      {(!hideSearchInput && !isGrantsPage && !isOrganizationsPage) && (
        <div className="flex items-center flex-1 min-w-[200px] max-w-[320px]">
          <Search size={20} className="text-slate-400 mr-2" />
          <EnhancedSearchInput
            searchTerm={searchTerm} onSearchChange={setSearchTerm} onSuggestionSelect={onSuggestionSelect}
            funders={funders} nonprofits={nonprofits} organizations={organizations} placeholder={searchPlaceholder} className="w-full border-none shadow-none px-0 py-0 bg-transparent focus:ring-0 text-base"
          />
        </div>
      )}

      {/* Divider */}
      <div className="h-8 w-px bg-slate-100 mx-2 hidden sm:block" />

      {/* Grant Filters (as selects) */}
      {isGrantsPage && (
        <>
          <div className="flex gap-3">
            <div className="flex gap-3">
              <div className="min-w-[140px]">
                <Select
                  id="category-filter"
                  isMulti
                  options={categoryOptions}
                  value={[]}
                  onChange={handleMultiSelectChange(setCategoryFilter)}
                  placeholder="Categories"
                  classNamePrefix="filter-pill"
                  styles={{
                    ...customSelectStyles,
                    control: (base, state) => ({
                      ...base,
                      borderRadius: '9999px',
                      minHeight: '44px',
                      maxHeight: '44px',
                      paddingLeft: '20px',
                      paddingRight: '20px',
                      fontWeight: 500,
                      fontSize: '15px',
                      boxShadow: 'none',
                      borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb',
                      background: '#fff',
                      cursor: 'pointer',
                    }),
                    placeholder: (base) => ({ ...base, color: '#64748b', fontWeight: 500 }),
                  }}
                  isClearable
                  menuIsOpen={undefined}
                />
              </div>
              <div className="min-w-[140px]">
                <Select
                  id="location-filter"
                  isMulti
                  options={locationOptions}
                  value={[]}
                  onChange={handleMultiSelectChange(setLocationFilter)}
                  placeholder="Locations"
                  classNamePrefix="filter-pill"
                  styles={{
                    ...customSelectStyles,
                    control: (base, state) => ({
                      ...base,
                      borderRadius: '9999px',
                      minHeight: '44px',
                      maxHeight: '44px',
                      paddingLeft: '20px',
                      paddingRight: '20px',
                      fontWeight: 500,
                      fontSize: '15px',
                      boxShadow: 'none',
                      borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb',
                      background: '#fff',
                      cursor: 'pointer',
                    }),
                    placeholder: (base) => ({ ...base, color: '#64748b', fontWeight: 500 }),
                  }}
                  isClearable
                  menuIsOpen={undefined}
                />
              </div>
              <div className="min-w-[140px]">
                <select id="grant-type-filter" value={grantTypeFilter || ''} onChange={(e) => setGrantTypeFilter(e.target.value)}
                  className="w-full px-5 py-2 rounded-full border border-slate-300 bg-white text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer min-h-[44px] max-h-[44px]"
                  style={{ fontWeight: 500, fontSize: '15px' }}
                >
                  <option value="">All Types</option>
                  {uniqueGrantTypes.map((type) => (<option key={type} value={type}>{type}</option>))}
                </select>
              </div>
              <div className="min-w-[140px]">
                <select id="grant-status-filter" value={grantStatusFilter || ''} onChange={(e) => setGrantStatusFilter(e.target.value)}
                  className="w-full px-5 py-2 rounded-full border border-slate-300 bg-white text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer min-h-[44px] max-h-[44px]"
                  style={{ fontWeight: 500, fontSize: '15px' }}
                >
                  <option value="">All Statuses</option>
                  {uniqueGrantStatuses.map(status => (<option key={status} value={status}>{status}</option>))}
                </select>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Organization Filters (as selects, for organizations page) */}
      {isOrganizationsPage && (
        <>
          <div className="flex gap-3">
            <div className="min-w-[140px]">
              <Select
                id="org-type-filter"
                isMulti={false}
                options={[{ value: '', label: 'All Types' }, ...(availableTypes?.map(type => {
                  const config = orgTypeConfig?.[type];
                  return { value: type, label: config?.label || type };
                }) || [])]}
                value={(() => {
                  const val = typeFilter?.[0] || '';
                  return [{ value: val, label: (orgTypeConfig?.[val]?.label || val) || 'All Types' }];
                })()}
                onChange={opt => setTypeFilter(opt && opt.value ? [opt.value] : [])}
                placeholder="Organization Type"
                classNamePrefix="filter-pill"
                styles={{
                  ...customSelectStyles,
                  control: (base, state) => ({
                    ...base,
                    borderRadius: '9999px',
                    minHeight: '44px',
                    maxHeight: '44px',
                    paddingLeft: '20px',
                    paddingRight: '20px',
                    fontWeight: 500,
                    fontSize: '15px',
                    boxShadow: 'none',
                    borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb',
                    background: '#fff',
                    cursor: 'pointer',
                  }),
                  placeholder: (base) => ({ ...base, color: '#64748b', fontWeight: 500 }),
                }}
                isClearable
                menuIsOpen={undefined}
              />
            </div>
            <div className="min-w-[140px]">
              <Select
                id="org-focus-area-filter"
                isMulti
                options={focusAreaOptions}
                value={getSelectedValues(focusAreaFilter, focusAreaOptions)}
                onChange={handleMultiSelectChange(setFocusAreaFilter)}
                placeholder="Focus Areas"
                classNamePrefix="filter-pill"
                styles={{
                  ...customSelectStyles,
                  control: (base, state) => ({
                    ...base,
                    borderRadius: '9999px',
                    minHeight: '44px',
                    maxHeight: '44px',
                    paddingLeft: '20px',
                    paddingRight: '20px',
                    fontWeight: 500,
                    fontSize: '15px',
                    boxShadow: 'none',
                    borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb',
                    background: '#fff',
                    cursor: 'pointer',
                  }),
                  placeholder: (base) => ({ ...base, color: '#64748b', fontWeight: 500 }),
                }}
                isClearable
                menuIsOpen={undefined}
              />
            </div>
            <div className="min-w-[140px]">
              <Select
                id="org-location-filter"
                isMulti
                options={locationOptions}
                value={getSelectedValues(locationFilter, locationOptions)}
                onChange={handleMultiSelectChange(setLocationFilter)}
                placeholder="Locations"
                classNamePrefix="filter-pill"
                styles={{
                  ...customSelectStyles,
                  control: (base, state) => ({
                    ...base,
                    borderRadius: '9999px',
                    minHeight: '44px',
                    maxHeight: '44px',
                    paddingLeft: '20px',
                    paddingRight: '20px',
                    fontWeight: 500,
                    fontSize: '15px',
                    boxShadow: 'none',
                    borderColor: state.isFocused ? '#3b82f6' : '#e5e7eb',
                    background: '#fff',
                    cursor: 'pointer',
                  }),
                  placeholder: (base) => ({ ...base, color: '#64748b', fontWeight: 500 }),
                }}
                isClearable
                menuIsOpen={undefined}
              />
            </div>
          </div>
        </>
      )}

      {/* Divider */}
      <div className="h-8 w-px bg-slate-100 mx-2 hidden sm:block" />

      {/* Sort By */}
      <div className="min-w-[140px]">
        <div className="relative">
          <ListFilter size={16} className="text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
          <select
            id="sort-criteria"
            value={sortCriteria}
            onChange={(e) => setSortCriteria(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 border border-slate-300 rounded-full bg-white text-sm font-medium focus:ring-2 ${accentColorClass} focus:border-blue-500 outline-none appearance-none shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer min-h-[44px] max-h-[44px]`}
            style={{ fontWeight: 500, fontSize: '15px' }}
          >
            {sortOptions}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
        </div>
      </div>

      {/* Clear All Button */}
      {activeFilters && activeFilters.length > 0 && (
        <button
          onClick={onClearFilters}
          className={`ml-2 inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap ${
            isFundersPage ? 'text-green-700 bg-green-100 hover:bg-green-200' :
            isNonprofitsPage ? 'text-purple-700 bg-purple-100 hover:bg-purple-200' :
            'text-blue-700 bg-blue-100 hover:bg-blue-200'
          }`}
        >
          <XCircle size={14} className="mr-1" />
          Clear All
        </button>
      )}

      {/* Active Filter Pills */}
      {activeFilters && activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 ml-2">
          <FilterPills 
            activeFilters={activeFilters} 
            onRemoveFilter={onRemoveFilter}
            pillClassName="rounded-full px-5 py-2 text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors min-h-[44px] max-h-[44px] shadow-sm"
            pillRemoveClassName="ml-2 text-blue-500 hover:text-blue-700"
          />
        </div>
      )}
    </div>
  );

        {/* --- FUNDERS FILTERS --- */}
        {isFundersPage && (
          <>
            <div className="relative">
              <label htmlFor="funder-type-filter" className="block text-sm font-medium text-slate-700 mb-2"><IconBriefcase size={16} className="inline mr-1" />Funder Type</label>
              <select id="funder-type-filter" value={funderTypeFilter || ''} onChange={(e) => setFunderTypeFilter(e.target.value)}
                className={`w-full pl-3 pr-8 py-3 border border-slate-300 rounded-lg focus:ring-2 ${accentColorClass} bg-white text-sm transition-colors hover:border-slate-400 appearance-none`}
              >
                <option value="">All Types</option>
                {uniqueFunderTypes.map((type) => (<option key={type} value={type}>{type}</option>))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            </div>
            <div className="relative">
              <label htmlFor="geographic-scope-filter" className="block text-sm font-medium text-slate-700 mb-2"><MapPin size={16} className="inline mr-1" />Geographic Scope</label>
              <Select id="geographic-scope-filter" isMulti options={geographicScopeOptions} value={selectedScopeValues}
                onChange={handleMultiSelectChange(setGeographicScopeFilter)} placeholder="Select scopes..." className="text-sm" styles={customSelectStyles} isClearable
              />
            </div>
            <div className="relative">
              <label htmlFor="focus-area-filter" className="block text-sm font-medium text-slate-700 mb-2"><Tag size={16} className="inline mr-1" />Focus Areas</label>
              <Select id="focus-area-filter" isMulti options={focusAreaOptions} value={getSelectedValues(focusAreaFilter, focusAreaOptions)} 
                onChange={handleMultiSelectChange(setFocusAreaFilter)} placeholder="Select focus areas..." className="text-sm" styles={customSelectStyles} isClearable
              />
            </div>
            <div className="relative">
              <label htmlFor="annual-giving-filter" className="block text-sm font-medium text-slate-700 mb-2"><DollarSign size={16} className="inline mr-1" />Annual Giving</label>
              <select id="annual-giving-filter" value={annualGivingFilter || ''} onChange={(e) => setAnnualGivingFilter && setAnnualGivingFilter(e.target.value)}
                className={`w-full pl-3 pr-8 py-3 border border-slate-300 rounded-lg focus:ring-2 ${accentColorClass} bg-white text-sm transition-colors hover:border-slate-400 appearance-none`}
              >
                {ANNUAL_GIVING_RANGES.map((range) => (<option key={range.value} value={range.value}>{range.label}</option>))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            </div>
          </>
        )}

        {/* --- NONPROFITS FILTERS --- */}
        {isNonprofitsPage && (
            <>
                <div className="relative">
                  <label htmlFor="np-focus-area-filter" className="block text-sm font-medium text-slate-700 mb-2"><Tag size={16} className="inline mr-1" />Focus Areas</label>
                  <Select id="np-focus-area-filter" isMulti options={focusAreaOptions} value={getSelectedValues(focusAreaFilter, focusAreaOptions)} 
                    onChange={handleMultiSelectChange(setFocusAreaFilter)} placeholder="Select focus areas..." className="text-sm" styles={customSelectStyles} isClearable
                  />
                </div>
                <div className="relative">
                  <label htmlFor="np-location-filter" className="block text-sm font-medium text-slate-700 mb-2"><MapPin size={16} className="inline mr-1" />Location</label>
                  <Select id="np-location-filter" isMulti options={locationOptions} value={getSelectedValues(locationFilter, locationOptions)} 
                    onChange={handleMultiSelectChange(setLocationFilter)} placeholder="Select locations..." className="text-sm" styles={customSelectStyles} isClearable
                  />
                </div>
                <div className="relative">
                  <label htmlFor="np-budget-filter" className="block text-sm font-medium text-slate-700 mb-2"><DollarSign size={16} className="inline mr-1" />Annual Budget</label>
                  <select id="np-budget-filter" value={`${minBudget || ''}-${maxBudget || ''}`} onChange={handleBudgetChange}
                    className={`w-full pl-3 pr-8 py-3 border border-slate-300 rounded-lg focus:ring-2 ${accentColorClass} bg-white text-sm transition-colors hover:border-slate-400 appearance-none`}
                  >
                    {NONPROFIT_BUDGET_RANGES.map((range) => (<option key={range.value} value={range.value}>{range.label}</option>))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>
            </>
        )}

  {/* --- ORGANIZATIONS FILTERS (NEW) --- */}
  {/* (Moved to integrated filter bar above) */}
  // End of integrated bar JSX
}
export default FilterBar;