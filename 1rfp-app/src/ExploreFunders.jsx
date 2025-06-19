// src/ExploreFunders.jsx - FIXED VERSION
import { Link } from 'react-router-dom';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient.js';
import { Search, MapPin, DollarSign, IconBriefcase, MessageSquare, ExternalLink, ChevronDown, Info, ClipboardList, Loader, XCircle, Calendar, ArrowRight, Award, ClipboardCheck } from './components/Icons.jsx';
import FilterBar from './components/FilterBar.jsx';
import Pagination from './components/Pagination.jsx';
import EnhancedSearchInput from './components/EnhancedSearchInput.jsx';
import { FunderCardSkeleton, SearchResultsSkeleton } from './components/SkeletonLoader.jsx';
import { formatDate, getPillClasses, getGrantTypePillClasses } from './utils.js';
import { COMMON_LOCATIONS, GRANT_TYPES } from './constants.js';
import usePaginatedFilteredData from './hooks/usePaginatedFilteredData.js';
import { filterFundersArray } from './filtering.js'; // FIXED: Use the array version
import { sortFunders } from './sorting.js';
import { useDebounce } from './hooks/useDebounce.js';

// Updated FunderCard component
const FunderCard = ({ funder, handleFilterChange }) => {
    // Helper to get initials from name for fallback logo
    const getInitials = (name) => {
        if (!name) return '?';
        const words = name.split(' ');
        if (words.length > 1) {
            return (words[0][0] + words[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-xl transition-all duration-300 ease-in-out flex flex-col justify-between transform hover:-translate-y-1 h-full">
            <div>
                {/* Header with Logo */}
                <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0">
                        {funder.logo_url ? (
                            <img 
                                src={funder.logo_url} 
                                alt={`${funder.name} logo`} 
                                className="h-16 w-16 rounded-full object-contain border border-slate-200 p-1"
                                loading="lazy"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                }}
                            />
                        ) : null}
                        <div className={`h-16 w-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl border-2 border-blue-200 ${funder.logo_url ? 'hidden' : ''}`}>
                            {getInitials(funder.name)}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 line-clamp-2">{funder.name}</h3>
                        {funder.funder_type && (
                            <span className="text-xs font-semibold bg-slate-200 text-slate-600 px-2.5 py-1 rounded-full mt-1 inline-block">
                                {funder.funder_type}
                            </span>
                        )}
                    </div>
                </div>

                {/* Funding Philosophy */}
                <p className="text-sm text-slate-600 mb-4 line-clamp-3 leading-relaxed">
                    <span className="font-semibold text-slate-700">Funding Philosophy: </span>
                    {funder.description}
                </p>

                {/* Key Info List */}
                <div className="space-y-3 text-sm mb-5">
                    <div className="flex items-start text-slate-700">
                        <MapPin size={16} className="mr-2.5 mt-0.5 text-blue-500 flex-shrink-0" />
                        <div><span className="font-medium text-slate-600">Geographic Scope:</span> {funder.location}</div>
                    </div>
                    <div className="flex items-start text-slate-700">
                        <DollarSign size={16} className="mr-2.5 mt-0.5 text-green-500 flex-shrink-0" />
                        <div><span className="font-medium text-slate-600">Annual Giving:</span> {funder.total_funding_annually || 'Not specified'}</div>
                    </div>
                    {funder.notable_grant && (
                        <div className="flex items-start text-slate-700">
                            <Award size={16} className="mr-2.5 mt-0.5 text-amber-500 flex-shrink-0" />
                            <div><span className="font-medium text-slate-600">Notable Grant:</span> {funder.notable_grant}</div>
                        </div>
                    )}
                    <div className="flex items-start text-slate-700">
                        <MessageSquare size={16} className="mr-2.5 mt-0.5 text-orange-500 flex-shrink-0" />
                        <div><span className="font-medium text-slate-600">Avg. Grant Size:</span> {funder.average_grant_size || 'Not specified'}</div>
                    </div>
                </div>

                {/* Grant Types with dynamic colors */}
                {funder.grant_types && funder.grant_types.length > 0 && (
                    <div className="pt-4 border-t border-slate-100">
                        <h4 className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Grant Types Offered</h4>
                        <div className="flex flex-wrap gap-2">
                            {funder.grant_types.map(type => (
                                <span key={type} className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getGrantTypePillClasses(type)}`}>
                                    {type}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Interactive Focus Area Pills */}
                {funder.focus_areas && funder.focus_areas.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <h4 className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Key Focus Areas</h4>
                        <div className="flex flex-wrap gap-2">
                            {funder.focus_areas.map(area => (
                                <button 
                                    key={area} 
                                    onClick={() => handleFilterChange('focusAreaFilter', area)}
                                    className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-transform transform hover:scale-105 active:scale-95 ${getPillClasses(area)}`}
                                    title={`Filter by: ${area}`}
                                >
                                    {area}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Button */}
            <div className="mt-6">
                <Link
                    to={`/funders/${funder.slug}`}
                    className="inline-flex items-center justify-center w-full px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                    View Their Grants <ExternalLink size={16} className="ml-2" />
                </Link>
            </div>
        </div>
    );
};

const ExploreFunders = () => {
  const [funders, setFunders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [filterConfig, setFilterConfig] = useState({ 
    searchTerm: '', 
    locationFilter: '', 
    focusAreaFilter: '', 
    grantTypeFilter: '', 
    annualGivingFilter: '', // New filter
    sortCriteria: 'name_asc' 
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [fundersPerPage, setFundersPerPage] = useState(12);
  const [isMobileFiltersVisible, setIsMobileFiltersVisible] = useState(false);

  // Debounce search term to reduce filter recalculation
  const debouncedSearchTerm = useDebounce(filterConfig.searchTerm, 300);
  const debouncedFilterConfig = useMemo(() => ({
    ...filterConfig,
    searchTerm: debouncedSearchTerm
  }), [filterConfig, debouncedSearchTerm]);

  useEffect(() => {
    const fetchFunders = async () => {
        setLoading(true);
        setInitialLoading(true);
        try {
            const { data, error } = await supabase.from('funders').select('*');
            if (error) throw error;
            if (data) {
                console.log('Fetched funders:', data.length);
                console.log('Sample funder:', data[0]);
                setFunders(data);
            }
        } catch (error) {
            console.error('Error fetching funders:', error);
        } finally {
            setLoading(false);
            setInitialLoading(false);
        }
    };
    fetchFunders();
  }, []);

  const uniqueFocusAreas = useMemo(() => {
    if (!funders) return [];
    const allAreas = funders.flatMap(f => f.focus_areas || []);
    const unique = Array.from(new Set(allAreas)).sort();
    console.log('Unique focus areas:', unique);
    return unique;
  }, [funders]);

  const uniqueLocations = useMemo(() => {
    if (!funders) return COMMON_LOCATIONS;
    const allLocations = funders.map(f => f.location).filter(Boolean);
    const unique = Array.from(new Set([...COMMON_LOCATIONS, ...allLocations])).sort();
    console.log('Unique locations:', unique);
    return unique;
  }, [funders]);

  const { paginatedItems: currentFunders, totalPages, totalFilteredItems } = usePaginatedFilteredData(
    funders,                  
    debouncedFilterConfig,            
    filterFundersArray,       // FIXED: Use the array version
    debouncedFilterConfig.sortCriteria,
    sortFunders,              
    currentPage,              
    fundersPerPage
  );

  const handleFilterChange = useCallback((key, value) => {
    console.log('Filter change:', key, '=', value);
    setFilterConfig(prev => {
      const newConfig = { ...prev, [key]: value };
      console.log('New filter config:', newConfig);
      return newConfig;
    });
    setCurrentPage(1);
  }, []);

  const handleSearchChange = useCallback((searchTerm) => {
    handleFilterChange('searchTerm', searchTerm);
  }, [handleFilterChange]);

  const handleSuggestionSelect = useCallback((suggestion) => {
    // Handle different types of suggestions
    switch (suggestion.type) {
      case 'funder':
        // Could navigate directly to funder page
        break;
      case 'focus_area':
        handleFilterChange('focusAreaFilter', suggestion.text);
        break;
      case 'location':
        handleFilterChange('locationFilter', suggestion.text);
        break;
      case 'grant_type':
        handleFilterChange('grantTypeFilter', suggestion.text);
        break;
      default:
        // Just use as search term
        break;
    }
  }, [handleFilterChange]);

  const paginate = useCallback((pageNumber) => {
    if (pageNumber < 1 || (totalPages > 0 && pageNumber > totalPages)) return;
    setCurrentPage(pageNumber);
    document.getElementById('funders-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [totalPages]);

  const handleClearFilters = useCallback(() => {
    console.log('Clearing all filters');
    // Clear both filter config and the enhanced search input
    const clearedConfig = { searchTerm: '', locationFilter: '', focusAreaFilter: '', grantTypeFilter: '', annualGivingFilter: '', sortCriteria: 'name_asc' };
    console.log('Setting cleared config:', clearedConfig);
    setFilterConfig(clearedConfig);
    setCurrentPage(1);
  }, []);

  const handleRemoveFunderFilter = useCallback((keyToRemove) => {
    console.log('Removing filter:', keyToRemove);
    handleFilterChange(keyToRemove, '');
  }, [handleFilterChange]);

  useEffect(() => { 
    document.title = '1RFP - Explore Funders'; 
  }, []);

  const activeFunderFilters = useMemo(() => {
    const filters = [];
    if (filterConfig.searchTerm) filters.push({ key: 'searchTerm', label: `Search: "${filterConfig.searchTerm}"` });
    if (filterConfig.locationFilter) filters.push({ key: 'locationFilter', label: `Location: ${filterConfig.locationFilter}` });
    if (filterConfig.focusAreaFilter) filters.push({ key: 'focusAreaFilter', label: `Focus: ${filterConfig.focusAreaFilter}` });
    if (filterConfig.grantTypeFilter) filters.push({ key: 'grantTypeFilter', label: `Type: ${filterConfig.grantTypeFilter}` });
    if (filterConfig.annualGivingFilter) {
      // Format the annual giving filter label
      const ranges = {
        '0-500000': 'Under $500K',
        '500000-1000000': '$500K - $1M',
        '1000000-5000000': '$1M - $5M',
        '5000000-10000000': '$5M - $10M',
        '10000000-25000000': '$10M - $25M',
        '25000000-50000000': '$25M - $50M',
        '50000000-100000000': '$50M - $100M',
        '100000000-999999999': '$100M+'
      };
      filters.push({ key: 'annualGivingFilter', label: `Giving: ${ranges[filterConfig.annualGivingFilter] || filterConfig.annualGivingFilter}` });
    }
    return filters;
  }, [filterConfig]);

  // Show skeleton loading during initial load
  if (initialLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <section className="text-center pt-8 pb-12 md:pt-12 md:pb-16 mb-10 md:mb-12 bg-white p-6 rounded-xl shadow-lg border">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-3/4 mx-auto mb-4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto mb-6"></div>
            <div className="h-12 bg-slate-200 rounded w-full max-w-md mx-auto"></div>
          </div>
        </section>
        <SearchResultsSkeleton count={12} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <section id="funder-intro" className="text-center pt-8 pb-12 md:pt-12 md:pb-16 mb-10 md:mb-12 bg-white p-6 rounded-xl shadow-lg border">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">Explore Funding Organizations</h2>
        <p className="text-md md:text-lg text-slate-600 mb-6 max-w-2xl mx-auto">Discover foundations and organizations that fund initiatives in the San Francisco Bay Area.</p>
        


        <div className="mt-8 md:hidden">
            <button 
              onClick={() => setIsMobileFiltersVisible(!isMobileFiltersVisible)} 
              className="w-full inline-flex items-center justify-center px-4 py-2 border rounded-md text-sm font-medium"
            >
                {isMobileFiltersVisible ? 'Hide Filters' : 'Show Filters'}
                {activeFunderFilters.length > 0 && ( 
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-green-600 rounded-full">
                    {activeFunderFilters.length}
                  </span> 
                )}
            </button>
        </div>

        <FilterBar
          isMobileVisible={isMobileFiltersVisible}
          searchTerm={filterConfig.searchTerm}
          setSearchTerm={handleSearchChange}
          locationFilter={filterConfig.locationFilter}
          setLocationFilter={(value) => handleFilterChange('locationFilter', value)}
          focusAreaFilter={filterConfig.focusAreaFilter}
          setFocusAreaFilter={(value) => handleFilterChange('focusAreaFilter', value)}
          grantTypeFilter={filterConfig.grantTypeFilter}
          setGrantTypeFilter={(value) => handleFilterChange('grantTypeFilter', value)}
          annualGivingFilter={filterConfig.annualGivingFilter}
          setAnnualGivingFilter={(value) => handleFilterChange('annualGivingFilter', value)}
          sortCriteria={filterConfig.sortCriteria}
          setSortCriteria={(value) => handleFilterChange('sortCriteria', value)}
          uniqueFocusAreas={uniqueFocusAreas}
          uniqueGrantTypes={GRANT_TYPES}
          uniqueLocations={uniqueLocations}
          pageType="funders"
          onClearFilters={handleClearFilters}
          activeFilters={activeFunderFilters}
          onRemoveFilter={handleRemoveFunderFilter}
          hideSearchInput={false}
          funders={funders}
          onSuggestionSelect={handleSuggestionSelect}
        />
      </section>

      <section id="funders-list" className="mb-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-semibold text-slate-800">
            Foundations & Grantmakers 
            <span className="text-green-600">({totalFilteredItems})</span>
          </h2>
          <select 
            value={fundersPerPage} 
            onChange={(e) => setFundersPerPage(Number(e.target.value))} 
            className="border-gray-300 rounded-md"
          >
            {[6, 9, 12, 15, 21, 24].map(n => <option key={n} value={n}>Show {n}</option>)}
          </select>
        </div>

        {/* Search is still happening (debounced) */}
        {filterConfig.searchTerm !== debouncedSearchTerm && (
          <div className="text-center py-4">
            <div className="inline-flex items-center text-slate-500">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-300 border-t-slate-600 mr-2"></div>
              Searching...
            </div>
          </div>
        )}

        {loading ? ( 
          <SearchResultsSkeleton count={fundersPerPage} />
        ) : currentFunders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentFunders.map((funder) => ( 
              <FunderCard 
                key={funder.id} 
                funder={funder} 
                handleFilterChange={handleFilterChange} 
              /> 
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Search size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">No funders found</h3>
            <p className="text-slate-600 mb-4">
              {activeFunderFilters.length > 0 
                ? "Try adjusting your filters or search terms" 
                : "No funders match your current criteria"}
            </p>
            {activeFunderFilters.length > 0 && (
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}

        {totalPages > 0 && (
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={paginate} 
            activeColorClass="bg-green-600 text-white" 
          />
        )}
      </section>
    </div>
  );
};

export default ExploreFunders;