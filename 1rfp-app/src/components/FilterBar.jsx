// src/components/FilterBar.jsx
import React, { useMemo } from 'react';
import { Search, MapPin, DollarSign, Filter, IconBriefcase, Info, ChevronDown, ListFilter, XCircle, Heart, Users as UsersIcon, Tag } from '../components/Icons.jsx';
import FilterPills from './FilterPills.jsx';

const FilterBar = ({
  isMobileVisible, // <-- NEW PROP
  searchTerm, setSearchTerm,
  locationFilter, setLocationFilter,
  categoryFilter, setCategoryFilter,
  grantTypeFilter, setGrantTypeFilter,
  grantStatusFilter, setGrantStatusFilter,
  focusAreaFilter, setFocusAreaFilter,
  minBudget, setMinBudget,
  maxBudget, setMaxBudget,
  minStaff, setMinStaff,
  maxStaff, setMaxStaff,
  minYearFounded, maxYearFounded,
  sortCriteria, setSortCriteria,
  uniqueCategories,
  uniqueLocations,
  uniqueGrantTypes,
  uniqueGrantStatuses,
  uniqueFocusAreas,
  pageType,
  onClearFilters,
  activeFilters,
  onRemoveFilter
}) => {
  const isGrantsPage = pageType === 'grants';
  const isFundersPage = pageType === 'funders';
  const isNonprofitsPage = pageType === 'nonprofits';

  let accentColorClass;
  let searchPlaceholder;
  let sortOptions;
  let searchIcon;

  if (isGrantsPage) {
    accentColorClass = 'focus:ring-blue-500 focus:border-blue-500';
    searchPlaceholder = 'Search by keyword, foundation, or focus area...';
    searchIcon = <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />;
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
    accentColorClass = 'focus:ring-green-500 focus:border-green-500';
    searchPlaceholder = 'Search by name, focus area...';
    searchIcon = <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />;
    sortOptions = (
      <>
        <option value="name_asc">Name (A-Z)</option>
        <option value="name_desc">Name (Z-A)</option>
        <option value="grantsOffered_desc">Grants Offered (Highest)</option>
        <option value="grantsOffered_asc">Grants Offered (Lowest)</option>
      </>
    );
  } else if (isNonprofitsPage) {
    accentColorClass = 'focus:ring-purple-500 focus:border-purple-500';
    searchPlaceholder = 'Search by name, focus area...';
    searchIcon = <Heart className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />;
    sortOptions = (
      <>
        <option value="name_asc">Name (A-Z)</option>
        <option value="name_desc">Name (Z-A)</option>
        <option value="staffCount_desc">Staff Count (Highest)</option>
        <option value="staffCount_asc">Staff Count (Lowest)</option>
      </>
    );
  }

  const hasActiveFilters = useMemo(() => {
    return activeFilters && activeFilters.length > 0;
  }, [activeFilters]);

  // FIX: Conditional classes to show/hide on mobile
  const containerClasses = `
    mt-8 max-w-5xl mx-auto bg-slate-50 p-5 sm:p-6 rounded-lg border border-slate-200
    ${isMobileVisible ? 'block' : 'hidden'} md:block
  `;

  return (
    <div className={containerClasses}>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 items-end">
        {/* Search Input */}
        <div className={`relative ${isGrantsPage ? 'md:col-span-5' : 'md:col-span-2'}`}>
          <label htmlFor={`${pageType}-search-term`} className="sr-only">Search by {searchPlaceholder.toLowerCase().replace('search by ', '').replace('...', '')}</label>
          {searchIcon}
          <input
            id={`${pageType}-search-term`}
            type="text"
            placeholder={searchPlaceholder}
            className={`w-full pl-10 pr-4 py-3 border border-slate-300 rounded-md focus:ring-2 ${accentColorClass} outline-none transition-shadow text-sm shadow-sm`}
            value={searchTerm || ''}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filters for Grants Page */}
        {isGrantsPage && (
          <>
            {/* Category Filter */}
            <div className="relative md:col-span-1">
              <label htmlFor="category-filter" className="sr-only">Filter by category</label>
              <Filter className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
              <select
                id="category-filter"
                className={`w-full pl-10 pr-8 py-3 border border-slate-300 rounded-md focus:ring-2 ${accentColorClass} outline-none appearance-none bg-white text-sm shadow-sm`}
                value={categoryFilter || ''}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {uniqueCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            </div>

            {/* Location Filter */}
            <div className="relative md:col-span-1">
              <label htmlFor={`${pageType}-location-filter`} className="sr-only">Filter by location</label>
              <MapPin className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
              <select
                id={`${pageType}-location-filter`}
                className={`w-full pl-10 pr-8 py-3 border border-slate-300 rounded-md focus:ring-2 ${accentColorClass} outline-none appearance-none bg-white text-sm shadow-sm`}
                value={locationFilter || ''}
                onChange={(e) => setLocationFilter(e.target.value)}
              >
                <option value="">All Locations</option>
                {uniqueLocations.map((loc) => (
                  <option key={loc} value={loc.toLowerCase()}>
                    {loc}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            </div>

            {/* Grant Type Filter */}
            <div className="relative md:col-span-1">
              <label htmlFor="grant-type-filter" className="sr-only">Filter by grant type</label>
              <IconBriefcase className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
              <select
                id="grant-type-filter"
                className={`w-full pl-10 pr-8 py-3 border border-slate-300 rounded-md focus:ring-2 ${accentColorClass} outline-none appearance-none bg-white text-sm shadow-sm`}
                value={grantTypeFilter || ''}
                onChange={(e) => setGrantTypeFilter(e.target.value)}
              >
                <option value="">All Grant Types</option>
                {uniqueGrantTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            </div>

            {/* Grant Status Filter */}
            <div className="relative md:col-span-1">
              <label htmlFor="grant-status-filter" className="sr-only">Filter by grant status</label>
              <Info className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
              <select
                id="grant-status-filter"
                className={`w-full pl-10 pr-8 py-3 border border-slate-300 rounded-md focus:ring-2 ${accentColorClass} outline-none appearance-none bg-white text-sm shadow-sm`}
                value={grantStatusFilter || ''}
                onChange={(e) => setGrantStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                {uniqueGrantStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            </div>
          </>
        )}

        {/* Filters for Funders and Nonprofits Pages */}
        {(isFundersPage || isNonprofitsPage) && (
          <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Focus Area Filter */}
            <div className="relative">
              <label htmlFor="focus-area-filter" className="sr-only">Filter by Focus Area</label>
              <Tag className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
              <select
                id="focus-area-filter"
                className={`w-full pl-10 pr-8 py-3 border border-slate-300 rounded-md focus:ring-2 ${accentColorClass} outline-none appearance-none bg-white text-sm shadow-sm`}
                value={focusAreaFilter || ''}
                onChange={(e) => setFocusAreaFilter(e.target.value)}
              >
                <option value="">All Focus Areas</option>
                {uniqueFocusAreas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            </div>

            {/* Location Filter */}
            <div className="relative">
              <label htmlFor={`${pageType}-location-filter`} className="sr-only">Filter by location</label>
              <MapPin className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
              <select
                id={`${pageType}-location-filter`}
                className={`w-full pl-10 pr-8 py-3 border border-slate-300 rounded-md focus:ring-2 ${accentColorClass} outline-none appearance-none bg-white text-sm shadow-sm`}
                value={locationFilter || ''}
                onChange={(e) => setLocationFilter(e.target.value)}
              >
                <option value="">All Locations</option>
                {uniqueLocations.map((loc) => (
                  <option key={loc} value={loc.toLowerCase()}>
                    {loc}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            </div>

            {/* Grant Type Filter (Funders Only) */}
            {isFundersPage && (
              <div className="relative">
                <label htmlFor="grant-type-filter" className="sr-only">Filter by grant type</label>
                <IconBriefcase className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                <select
                  id="grant-type-filter"
                  className={`w-full pl-10 pr-8 py-3 border border-slate-300 rounded-md focus:ring-2 ${accentColorClass} outline-none appearance-none bg-white text-sm shadow-sm`}
                  value={grantTypeFilter || ''}
                  onChange={(e) => setGrantTypeFilter(e.target.value)}
                >
                  <option value="">All Grant Types</option>
                  {uniqueGrantTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Budget and Staff Size Filters (Nonprofits Only) */}
      {isNonprofitsPage && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div className="relative">
            <label htmlFor="min-budget" className="sr-only">Minimum Annual Budget</label>
            <DollarSign className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            <input
              id="min-budget"
              type="number"
              placeholder="Min Budget"
              className={`w-full pl-10 pr-4 py-3 border border-slate-300 rounded-md focus:ring-2 ${accentColorClass} outline-none transition-shadow text-sm shadow-sm`}
              value={minBudget || ''}
              onChange={(e) => setMinBudget(e.target.value)}
              min="0"
            />
          </div>
          <div className="relative">
            <label htmlFor="max-budget" className="sr-only">Maximum Annual Budget</label>
            <DollarSign className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            <input
              id="max-budget"
              type="number"
              placeholder="Max Budget"
              className={`w-full pl-10 pr-4 py-3 border border-slate-300 rounded-md focus:ring-2 ${accentColorClass} outline-none transition-shadow text-sm shadow-sm`}
              value={maxBudget || ''}
              onChange={(e) => setMaxBudget(e.target.value)}
              min="0"
            />
          </div>
          <div className="relative">
            <label htmlFor="min-staff" className="sr-only">Minimum Staff Size</label>
            <UsersIcon className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            <input
              id="min-staff"
              type="number"
              placeholder="Min Staff"
              className={`w-full pl-10 pr-4 py-3 border border-slate-300 rounded-md focus:ring-2 ${accentColorClass} outline-none transition-shadow text-sm shadow-sm`}
              value={minStaff || ''}
              onChange={(e) => setMinStaff(e.target.value)}
              min="0"
            />
          </div>
          <div className="relative">
            <label htmlFor="max-staff" className="sr-only">Maximum Staff Size</label>
            <UsersIcon className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            <input
              id="max-staff"
              type="number"
              placeholder="Max Staff"
              className={`w-full pl-10 pr-4 py-3 border border-slate-300 rounded-md focus:ring-2 ${accentColorClass} outline-none transition-shadow text-sm shadow-sm`}
              value={maxStaff || ''}
              onChange={(e) => setMaxStaff(e.target.value)}
              min="0"
            />
          </div>
        </div>
      )}

      {/* Sort Dropdown */}
      <div className="relative w-full mt-4">
        <label htmlFor={`${pageType}-sort-criteria`} className="sr-only">Sort {pageType} by</label>
        <ListFilter size={16} className="text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
        <select
          id={`${pageType}-sort-criteria`}
          value={sortCriteria}
          onChange={(e) => setSortCriteria(e.target.value)}
          className={`w-full pl-10 pr-8 py-2.5 border border-slate-300 rounded-md bg-white text-xs focus:ring-1 ${accentColorClass} outline-none appearance-none shadow-sm`}
        >
          {sortOptions}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
      </div>

      {hasActiveFilters && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          <FilterPills
            activeFilters={activeFilters}
            onRemoveFilter={onRemoveFilter}
            accentColorClass={
              isGrantsPage ? 'text-blue-600' :
              isFundersPage ? 'text-green-600' :
              isNonprofitsPage ? 'text-purple-600' : 'text-slate-600'
            }
          />

          {onClearFilters && (
            <button
              onClick={onClearFilters}
              className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <XCircle size={16} className="mr-2" />
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterBar;