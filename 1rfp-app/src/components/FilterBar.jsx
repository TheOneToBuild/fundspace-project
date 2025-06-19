// src/components/FilterBar.jsx - ENHANCED VERSION
import React, { useMemo } from 'react';
import Select from 'react-select';
import { Search, MapPin, DollarSign, Filter, IconBriefcase, Info, ChevronDown, ListFilter, XCircle, Heart, Users as UsersIcon, Tag, TrendingUp } from '../components/Icons.jsx';
import FilterPills from './FilterPills.jsx';
import EnhancedSearchInput from './EnhancedSearchInput.jsx';

// Annual Giving Range Options
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

const FilterBar = ({
  isMobileVisible,
  searchTerm, setSearchTerm,
  locationFilter, setLocationFilter,
  categoryFilter, setCategoryFilter,
  grantTypeFilter, setGrantTypeFilter,
  grantStatusFilter, setGrantStatusFilter,
  focusAreaFilter, setFocusAreaFilter,
  annualGivingFilter, setAnnualGivingFilter,
  sortCriteria, setSortCriteria,
  uniqueCategories = [],
  uniqueLocations = [],
  uniqueGrantTypes = [],
  uniqueGrantStatuses = [],
  uniqueFocusAreas = [],
  pageType,
  onClearFilters,
  activeFilters,
  onRemoveFilter,
  hideSearchInput = false,
  // New props for enhanced search
  funders = [],
  onSuggestionSelect
}) => {
  const isGrantsPage = pageType === 'grants';
  const isFundersPage = pageType === 'funders';
  
  let accentColorClass = 'focus:ring-blue-500';
  let searchPlaceholder = 'Search by keyword, foundation, or focus area...';
  let searchIcon = <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />;
  let sortOptions = (
    <>
      <option value="dueDate_asc">Due Date (Soonest)</option>
      <option value="dueDate_desc">Due Date (Latest)</option>
      <option value="funding_desc">Funding (Highest)</option>
      <option value="funding_asc">Funding (Lowest)</option>
      <option value="title_asc">Title (A-Z)</option>
      <option value="title_desc">Title (Z-A)</option>
    </>
  );

  if (isFundersPage) {
    accentColorClass = 'focus:ring-green-500';
    searchPlaceholder = 'Search by name, focus area...';
    sortOptions = (
        <>
          <option value="name_asc">Name (A-Z)</option>
          <option value="name_desc">Name (Z-A)</option>
          <option value="funding_desc">Annual Giving (Highest)</option>
          <option value="funding_asc">Annual Giving (Lowest)</option>
        </>
    );
  }

  // Custom styles for react-select
  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      borderColor: state.isFocused ? (isFundersPage ? '#059669' : '#3b82f6') : '#cbd5e1',
      boxShadow: state.isFocused ? `0 0 0 1px ${isFundersPage ? '#059669' : '#3b82f6'}` : 'none',
      minHeight: '46px',
      borderRadius: '8px',
      '&:hover': { 
        borderColor: state.isFocused ? (isFundersPage ? '#059669' : '#3b82f6') : '#94a3b8' 
      },
      transition: 'all 0.2s ease'
    }),
    placeholder: (base) => ({
      ...base,
      color: '#94a3b8',
      fontSize: '14px'
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: isFundersPage ? '#dcfce7' : '#dbeafe',
      borderRadius: '6px'
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: isFundersPage ? '#166534' : '#1e40af',
      fontSize: '12px',
      fontWeight: '500'
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: isFundersPage ? '#166534' : '#1e40af',
      '&:hover': {
        backgroundColor: isFundersPage ? '#bbf7d0' : '#bfdbfe',
        color: isFundersPage ? '#166534' : '#1e40af'
      }
    })
  };

  const locationOptions = useMemo(() => uniqueLocations.map(loc => ({ value: loc, label: loc })), [uniqueLocations]);
  const categoryOptions = useMemo(() => uniqueCategories.map(cat => ({ value: cat, label: cat })), [uniqueCategories]);
  const focusAreaOptions = useMemo(() => uniqueFocusAreas.map(area => ({ value: area, label: area })), [uniqueFocusAreas]);

  const handleLocationChange = (selectedOptions) => {
    const values = selectedOptions ? selectedOptions.map(opt => opt.value) : [];
    if (Array.isArray(locationFilter)) {
      setLocationFilter(values);
    } else {
      setLocationFilter(values.length > 0 ? values[0] : '');
    }
  };
  
  const handleCategoryChange = (selectedOptions) => {
    const values = selectedOptions ? selectedOptions.map(opt => opt.value) : [];
    if (Array.isArray(categoryFilter)) {
      setCategoryFilter(values);
    } else {
      setCategoryFilter(values.length > 0 ? values[0] : '');
    }
  };

  const handleFocusAreaChange = (selectedOptions) => {
    const values = selectedOptions ? selectedOptions.map(opt => opt.value) : [];
    if (Array.isArray(focusAreaFilter)) {
      setFocusAreaFilter(values);
    } else {
      setFocusAreaFilter(values.length > 0 ? values[0] : '');
    }
  };

  // Handle both array and string values for filters
  const getSelectedValues = (filter, options) => {
    if (Array.isArray(filter)) {
      return options.filter(opt => filter.includes(opt.value));
    } else {
      return filter ? options.filter(opt => opt.value === filter) : [];
    }
  };

  const selectedLocationValues = useMemo(() => getSelectedValues(locationFilter, locationOptions), [locationFilter, locationOptions]);
  const selectedCategoryValues = useMemo(() => getSelectedValues(categoryFilter, categoryOptions), [categoryFilter, categoryOptions]);
  const selectedFocusAreaValues = useMemo(() => getSelectedValues(focusAreaFilter, focusAreaOptions), [focusAreaFilter, focusAreaOptions]);

  const containerClasses = `mt-8 max-w-6xl mx-auto bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-lg ${isMobileVisible ? 'block' : 'hidden'} md:block`;

  return (
    <div className={containerClasses}>
      {/* Header with Search */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Filter size={20} className={`mr-3 ${isFundersPage ? 'text-green-600' : 'text-blue-600'}`} />
            <h3 className="text-lg font-semibold text-slate-800">Refine Your Search</h3>
          </div>
          {activeFilters && activeFilters.length > 0 && (
            <button 
              onClick={onClearFilters} 
              className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                isFundersPage 
                  ? 'text-green-700 bg-green-100 hover:bg-green-200' 
                  : 'text-blue-700 bg-blue-100 hover:bg-blue-200'
              }`}
            >
              <XCircle size={14} className="mr-1" />
              Clear All
            </button>
          )}
        </div>

        {/* Search Bar and Sort - Inside the Filter Box */}
        {!hideSearchInput && (
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label htmlFor="enhanced-search" className="block text-sm font-medium text-slate-700 mb-2">
                Search Funders
              </label>
              <EnhancedSearchInput
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onSuggestionSelect={onSuggestionSelect}
                funders={funders}
                placeholder="Search funders, focus areas, locations..."
                className=""
              />
            </div>
            <div className="w-64">
              <label htmlFor="sort-criteria" className="block text-sm font-medium text-slate-700 mb-2">
                Sort By
              </label>
              <div className="relative">
                <ListFilter size={16} className="text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                <select 
                  id="sort-criteria" 
                  value={sortCriteria} 
                  onChange={(e) => setSortCriteria(e.target.value)} 
                  className={`w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg bg-white text-sm focus:ring-1 ${accentColorClass} transition-colors hover:border-slate-400 appearance-none`}
                >
                  {sortOptions}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Filters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">        
        {isGrantsPage && (
          <>
            <div className="relative">
              <label htmlFor="category-filter" className="block text-sm font-medium text-slate-700 mb-2">
                Categories
              </label>
              <Select 
                id="category-filter" 
                isMulti 
                options={categoryOptions} 
                value={selectedCategoryValues} 
                onChange={handleCategoryChange} 
                placeholder="Select categories..." 
                className="text-sm" 
                styles={customSelectStyles}
                isClearable
              />
            </div>
            
            <div className="relative">
              <label htmlFor="location-filter" className="block text-sm font-medium text-slate-700 mb-2">
                <MapPin size={16} className="inline mr-1" />
                Locations
              </label>
              <Select 
                id="location-filter" 
                isMulti 
                options={locationOptions} 
                value={selectedLocationValues} 
                onChange={handleLocationChange} 
                placeholder="Select locations..." 
                className="text-sm" 
                styles={customSelectStyles}
                isClearable
              />
            </div>

            <div className="relative">
              <label htmlFor="grant-type-filter" className="block text-sm font-medium text-slate-700 mb-2">
                Grant Types
              </label>
              <select 
                id="grant-type-filter" 
                className={`w-full pl-3 pr-8 py-3 border border-slate-300 rounded-lg focus:ring-2 ${accentColorClass} bg-white text-sm transition-colors hover:border-slate-400`} 
                value={grantTypeFilter || ''} 
                onChange={(e) => setGrantTypeFilter(e.target.value)}
              >
                <option value="">All Grant Types</option>
                {uniqueGrantTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <label htmlFor="grant-status-filter" className="block text-sm font-medium text-slate-700 mb-2">
                Status
              </label>
              <select 
                id="grant-status-filter" 
                className={`w-full pl-3 pr-8 py-3 border border-slate-300 rounded-lg focus:ring-2 ${accentColorClass} bg-white text-sm transition-colors hover:border-slate-400`} 
                value={grantStatusFilter || ''} 
                onChange={(e) => setGrantStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                {uniqueGrantStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {isFundersPage && (
          <>
            <div className="relative">
              <label htmlFor="location-filter-funders" className="block text-sm font-medium text-slate-700 mb-2">
                <MapPin size={16} className="inline mr-1" />
                Geographic Scope
              </label>
              <select 
                id="location-filter-funders" 
                className={`w-full pl-3 pr-8 py-3 border border-slate-300 rounded-lg focus:ring-2 ${accentColorClass} bg-white text-sm transition-colors hover:border-slate-400`} 
                value={Array.isArray(locationFilter) ? locationFilter[0] || '' : locationFilter || ''} 
                onChange={(e) => setLocationFilter(e.target.value)}
              >
                <option value="">All Locations</option>
                {uniqueLocations.map((location) => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <label htmlFor="focus-area-filter" className="block text-sm font-medium text-slate-700 mb-2">
                <Tag size={16} className="inline mr-1" />
                Focus Areas
              </label>
              <select 
                id="focus-area-filter" 
                className={`w-full pl-3 pr-8 py-3 border border-slate-300 rounded-lg focus:ring-2 ${accentColorClass} bg-white text-sm transition-colors hover:border-slate-400`} 
                value={Array.isArray(focusAreaFilter) ? focusAreaFilter[0] || '' : focusAreaFilter || ''} 
                onChange={(e) => setFocusAreaFilter(e.target.value)}
              >
                <option value="">All Focus Areas</option>
                {uniqueFocusAreas.map((area) => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <label htmlFor="grant-type-filter-funders" className="block text-sm font-medium text-slate-700 mb-2">
                Grant Types
              </label>
              <select 
                id="grant-type-filter-funders" 
                className={`w-full pl-3 pr-8 py-3 border border-slate-300 rounded-lg focus:ring-2 ${accentColorClass} bg-white text-sm transition-colors hover:border-slate-400`} 
                value={grantTypeFilter || ''} 
                onChange={(e) => setGrantTypeFilter(e.target.value)}
              >
                <option value="">All Grant Types</option>
                {uniqueGrantTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Annual Giving Filter */}
            <div className="relative">
              <label htmlFor="annual-giving-filter" className="block text-sm font-medium text-slate-700 mb-2">
                <DollarSign size={16} className="inline mr-1" />
                Annual Giving
              </label>
              <select 
                id="annual-giving-filter" 
                className={`w-full pl-3 pr-8 py-3 border border-slate-300 rounded-lg focus:ring-2 ${accentColorClass} bg-white text-sm transition-colors hover:border-slate-400`} 
                value={annualGivingFilter || ''} 
                onChange={(e) => setAnnualGivingFilter && setAnnualGivingFilter(e.target.value)}
              >
                {ANNUAL_GIVING_RANGES.map((range) => (
                  <option key={range.value} value={range.value}>{range.label}</option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      {/* Active Filters */}
      {activeFilters && activeFilters.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-200">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-slate-700">Active Filters:</span>
            <FilterPills activeFilters={activeFilters} onRemoveFilter={onRemoveFilter} />
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;