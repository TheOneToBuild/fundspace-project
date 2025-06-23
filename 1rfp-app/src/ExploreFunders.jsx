// src/ExploreFunders.jsx
import { Link } from 'react-router-dom';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient.js';
import { Search, MapPin, DollarSign, IconBriefcase, MessageSquare, ExternalLink, ChevronDown, Info, ClipboardList, Loader, XCircle, Calendar, ArrowRight, Award, ClipboardCheck, Users } from './components/Icons.jsx';
import FilterBar from './components/FilterBar.jsx';
import Pagination from './components/Pagination.jsx';
import { FunderCardSkeleton, SearchResultsSkeleton } from './components/SkeletonLoader.jsx';
import { getPillClasses, getGrantTypePillClasses, getFunderTypePillClasses } from './utils.js';
import { COMMON_LOCATIONS, GRANT_TYPES } from './constants.js';
import usePaginatedFilteredData from './hooks/usePaginatedFilteredData.js';
import { filterFundersArray } from './filtering.js';
import { sortFunders } from './sorting.js';

const FunderCard = ({ funder, handleFilterChange }) => {
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
                        <div className={`h-16 w-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl border-2 border-blue-200 ${funder.logo_url ? 'hidden' : 'flex'}`}>
                            {getInitials(funder.name)}
                        </div>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-800 line-clamp-2">{funder.name}</h3>
                        
                        {funder.funder_type?.name && (
                            <button 
                                onClick={() => handleFilterChange('funderTypeFilter', funder.funder_type.name)}
                                className={`text-xs font-semibold px-2.5 py-1 rounded-full mt-2 inline-block transition-transform transform hover:scale-105 active:scale-95 ${getFunderTypePillClasses(funder.funder_type.name)}`}
                                title={`Filter by type: ${funder.funder_type.name}`}
                            >
                                {funder.funder_type.name}
                            </button>
                        )}
                    </div>
                </div>
                <p className="text-sm text-slate-600 mb-4 line-clamp-3 leading-relaxed">
                    <span className="font-semibold text-slate-700">Funding Philosophy: </span>
                    {funder.description}
                </p>
                <div className="space-y-3 text-sm mb-5">
                    <div className="flex items-start text-slate-700">
                        <MapPin size={16} className="mr-2.5 mt-0.5 text-blue-500 flex-shrink-0" />
                        <div><span className="font-medium text-slate-600">Headquarters:</span> {funder.location || 'Not specified'}</div>
                    </div>

                    {funder.funding_locations && funder.funding_locations.length > 0 && (
                        <div className="flex items-start text-slate-700">
                            <IconBriefcase size={16} className="mr-2.5 mt-0.5 text-purple-500 flex-shrink-0" />
                            <div>
                                <span className="font-medium text-slate-600">Geographic Scope:</span>
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                    {funder.funding_locations.map(location => (
                                        <button 
                                            key={location} 
                                            onClick={() => handleFilterChange('geographicScopeFilter', [location])}
                                            // --- THIS CLASSNAME IS UPDATED TO USE GETPILLCLASSES ---
                                            className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-all transform hover:scale-105 active:scale-95 ${getPillClasses(location)}`}
                                            title={`Filter by scope: ${location}`}
                                        >
                                            {location}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    
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
                {funder.focus_areas && funder.focus_areas.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <h4 className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Key Focus Areas</h4>
                        <div className="flex flex-wrap gap-2">
                            {funder.focus_areas.map(area => (
                                <button 
                                    key={area} 
                                    onClick={() => handleFilterChange('focusAreaFilter', [area])}
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
  const [filterConfig, setFilterConfig] = useState({ 
    searchTerm: '', 
    locationFilter: [],
    focusAreaFilter: [], 
    grantTypeFilter: '',
    funderTypeFilter: '',
    geographicScopeFilter: [],
    annualGivingFilter: '', 
    sortCriteria: 'name_asc' 
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [fundersPerPage, setFundersPerPage] = useState(12);
  const [isMobileFiltersVisible, setIsMobileFiltersVisible] = useState(false);

  useEffect(() => {
    const fetchFunders = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('funders')
                .select('*, funder_categories(categories(name)), funder_type:funder_type_id(name), funder_funding_locations(locations(id, name))');

            if (error) throw error;

            if (data) {
                const formattedData = data.map(funder => ({
                    ...funder,
                    focus_areas: funder.funder_categories.map(fc => fc.categories.name),
                    funding_locations: funder.funder_funding_locations.map(ffl => ffl.locations.name)
                }));
                setFunders(formattedData);
            }
        } catch (error) {
            console.error('Error fetching funders:', error);
        } finally {
            setLoading(false);
        }
    };
    fetchFunders();
  }, []);

  const { paginatedItems: currentFunders, totalPages, totalFilteredItems } = usePaginatedFilteredData(
    funders,                  
    filterConfig,            
    filterFundersArray,
    filterConfig.sortCriteria,
    sortFunders,              
    currentPage,              
    fundersPerPage
  );

  const handleFilterChange = useCallback((key, value) => {
    setFilterConfig(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }, []);

  const handleSearchAction = useCallback((suggestion) => {
    setFilterConfig(prevConfig => {
        const newConfig = { ...prevConfig, searchTerm: suggestion.text };
        switch (suggestion.type) {
            case 'focus_area':
                newConfig.focusAreaFilter = [suggestion.text];
                break;
            case 'location':
                newConfig.locationFilter = [suggestion.text];
                break;
            case 'grant_type':
                newConfig.grantTypeFilter = suggestion.text;
                break;
            case 'geographic_scope':
                newConfig.geographicScopeFilter = [suggestion.text];
                break;
            default:
                break;
        }
        return newConfig;
    });
    setCurrentPage(1);
  }, []);

  const paginate = useCallback((pageNumber) => {
    if (pageNumber < 1 || (totalPages > 0 && pageNumber > totalPages)) return;
    setCurrentPage(pageNumber);
    document.getElementById('funders-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [totalPages]);

  const handleClearFilters = useCallback(() => {
    setFilterConfig({ 
        searchTerm: '', 
        locationFilter: [], 
        focusAreaFilter: [], 
        grantTypeFilter: '', 
        funderTypeFilter: '', 
        geographicScopeFilter: [],
        annualGivingFilter: '', 
        sortCriteria: 'name_asc' 
    });
    setCurrentPage(1);
  }, []);

  const handleRemoveFunderFilter = useCallback((keyToRemove, valueToRemove = null) => {
    if (Array.isArray(filterConfig[keyToRemove]) && valueToRemove) {
        const newValues = filterConfig[keyToRemove].filter(item => item !== valueToRemove);
        handleFilterChange(keyToRemove, newValues);
    } else {
        handleFilterChange(keyToRemove, Array.isArray(filterConfig[keyToRemove]) ? [] : '');
    }
  }, [filterConfig, handleFilterChange]);

  useEffect(() => { 
    document.title = '1RFP - Explore Funders'; 
  }, []);

  const activeFunderFilters = useMemo(() => {
    const filters = [];
    if (filterConfig.searchTerm) filters.push({ key: 'searchTerm', label: `Search: "${filterConfig.searchTerm}"` });
    
    filterConfig.locationFilter.forEach(loc => filters.push({ key: 'locationFilter', value: loc, label: `Location: ${loc}` }));
    filterConfig.focusAreaFilter.forEach(area => filters.push({ key: 'focusAreaFilter', value: area, label: `Focus: ${area}` }));
    
    if (filterConfig.funderTypeFilter) filters.push({ key: 'funderTypeFilter', label: `Type: ${filterConfig.funderTypeFilter}` });
    
    filterConfig.geographicScopeFilter.forEach(scope => {
        filters.push({ key: 'geographicScopeFilter', value: scope, label: `Scope: ${scope}` });
    });

    if (filterConfig.annualGivingFilter) {
      const ranges = { '0-500000': 'Under $500K', '500000-1000000': '$500K - $1M', '1000000-5000000': '$1M - $5M', '5000000-10000000': '$5M - $10M', '10000000-25000000': '$10M - $25M', '25000000-50000000': '$25M - $50M', '50000000-100000000': '$50M - $100M', '100000000-999999999': '$100M+' };
      filters.push({ key: 'annualGivingFilter', label: `Giving: ${ranges[filterConfig.annualGivingFilter] || filterConfig.annualGivingFilter}` });
    }
    return filters;
  }, [filterConfig]);

  const uniqueFocusAreas = useMemo(() => Array.from(new Set(funders.flatMap(f => f.focus_areas || []))).sort(), [funders]);
  const uniqueGrantTypes = useMemo(() => Array.from(new Set(funders.flatMap(f => f.grant_types || []))).sort(), [funders]);
  const uniqueLocations = useMemo(() => Array.from(new Set(funders.map(f => f.location).filter(Boolean))).sort(), [funders]);
  const uniqueFunderTypes = useMemo(() => Array.from(new Set(funders.map(f => f.funder_type?.name).filter(Boolean))).sort(), [funders]);
  const uniqueGeographicScopes = useMemo(() => Array.from(new Set(funders.flatMap(f => f.funding_locations || []))).sort(), [funders]);

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
          setSearchTerm={(value) => handleFilterChange('searchTerm', value)}
          onSuggestionSelect={handleSearchAction}
          locationFilter={filterConfig.locationFilter}
          setLocationFilter={(value) => handleFilterChange('locationFilter', value)}
          geographicScopeFilter={filterConfig.geographicScopeFilter}
          setGeographicScopeFilter={(value) => handleFilterChange('geographicScopeFilter', value)}
          focusAreaFilter={filterConfig.focusAreaFilter}
          setFocusAreaFilter={(value) => handleFilterChange('focusAreaFilter', value)}
          grantTypeFilter={filterConfig.grantTypeFilter}
          setGrantTypeFilter={(value) => handleFilterChange('grantTypeFilter', value)}
          funderTypeFilter={filterConfig.funderTypeFilter}
          setFunderTypeFilter={(value) => handleFilterChange('funderTypeFilter', value)}
          annualGivingFilter={filterConfig.annualGivingFilter}
          setAnnualGivingFilter={(value) => handleFilterChange('annualGivingFilter', value)}
          sortCriteria={filterConfig.sortCriteria}
          setSortCriteria={(value) => handleFilterChange('sortCriteria', value)}
          uniqueFocusAreas={uniqueFocusAreas}
          uniqueGrantTypes={uniqueGrantTypes}
          uniqueLocations={uniqueLocations}
          uniqueFunderTypes={uniqueFunderTypes}
          uniqueGeographicScopes={uniqueGeographicScopes}
          pageType="funders"
          onClearFilters={handleClearFilters}
          activeFilters={activeFunderFilters}
          onRemoveFilter={handleRemoveFunderFilter}
          funders={funders}
        />
      </section>

      <section id="funders-list" className="mb-12">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h2 className="text-2xl font-semibold text-slate-800 text-center md:text-left">
            Foundations & Grantmakers 
            <span className="text-green-600">({totalFilteredItems})</span>
          </h2>
          <div className="relative w-full sm:w-auto">
            <label htmlFor="funders-per-page" className="sr-only">Funders per page</label>
            <Users size={16} className="text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
            <select
              id="funders-per-page"
              value={fundersPerPage}
              onChange={(e) => setFundersPerPage(Number(e.target.value))}
              className="w-full pl-10 pr-8 py-2.5 border border-slate-300 rounded-md bg-white text-xs focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none appearance-none shadow-sm"
            >
              {[6, 9, 12, 15, 21, 24].map((n) => (
                <option key={n} value={n}>Show {n}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" size={16} />
          </div>
        </div>
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
            <p className="text-slate-600 mb-4">Try adjusting your filters or search terms.</p>
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