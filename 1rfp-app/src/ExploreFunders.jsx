// src/ExploreFunders.jsx
import { Link, useLocation } from 'react-router-dom';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient.js';
import { Search, MapPin, DollarSign, Users, LayoutGrid, List, SlidersHorizontal, Award, MessageSquare, ExternalLink, XCircle, IconBriefcase, ChevronDown } from './components/Icons.jsx';
import FilterBar from './components/FilterBar.jsx';
import Pagination from './components/Pagination.jsx';
import { SearchResultsSkeleton } from './components/SkeletonLoader.jsx';
import { getPillClasses, getGrantTypePillClasses, getFunderTypePillClasses } from './utils.js';
import usePaginatedFilteredData from './hooks/usePaginatedFilteredData.js';
import { filterFundersArray } from './filtering.js';
import { sortFunders } from './sorting.js';
import FunderCard from './components/FunderCard.jsx';

// NEW: A compact list item component for the list view
const FunderListItem = ({ funder }) => (
    <Link to={`/funders/${funder.slug}`} className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all flex items-center gap-4 cursor-pointer">
        <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
            {funder.name?.split(' ').map(n => n[0]).slice(0,2).join('')}
        </div>
        <div className="flex-grow min-w-0">
            <h4 className="font-semibold text-slate-800 truncate">{funder.name}</h4>
            <div className="flex items-center gap-4 text-xs text-slate-600 mt-1">
                {funder.location && <span className="flex items-center gap-1.5"><MapPin size={12} /> {funder.location}</span>}
                {funder.total_funding_annually && <span className="flex items-center gap-1.5"><DollarSign size={12} /> {funder.total_funding_annually}</span>}
            </div>
        </div>
        <div className="flex-shrink-0">
             <div className="hidden sm:flex flex-wrap gap-1.5 justify-end max-w-xs">
                {funder.focus_areas?.slice(0, 2).map(area => (
                    <span key={area} className={`text-xs font-semibold px-2 py-0.5 rounded ${getPillClasses(area)}`}>{area}</span>
                ))}
            </div>
        </div>
    </Link>
);


const ExploreFunders = ({ isProfileView = false }) => {
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

  // --- NEW: State for the compact view ---
  const [viewMode, setViewMode] = useState('grid');
  const [filtersVisible, setFiltersVisible] = useState(!isProfileView);
  
  const location = useLocation();

  useEffect(() => {
    // If navigating from a similar funder link, pre-fill the filter
    if (location.state?.prefilledFilter) {
      const { key, value } = location.state.prefilledFilter;
      handleFilterChange(key, [value]);
    }
  }, [location.state]);

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

  const { paginatedItems: currentFunders, totalPages, totalFilteredItems } = usePaginatedFilteredData(funders, filterConfig, filterFundersArray, filterConfig.sortCriteria, sortFunders, currentPage, fundersPerPage);

  const handleFilterChange = useCallback((key, value) => {
    setFilterConfig(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }, []);

  const handleSearchAction = useCallback((suggestion) => {
    setFilterConfig(prevConfig => {
        const newConfig = { ...prevConfig, searchTerm: suggestion.text };
        if (suggestion.type === 'focus_area') {
            newConfig.focusAreaFilter = [suggestion.text];
        } else if (suggestion.type === 'location') {
            newConfig.locationFilter = [suggestion.text];
        }
        return newConfig;
    });
    setCurrentPage(1);
  }, []);

  const paginate = useCallback((pageNumber) => {
    if (pageNumber < 1 || (totalPages > 0 && pageNumber > totalPages)) return;
    setCurrentPage(pageNumber);
    const element = document.getElementById('funders-list');
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
    filterConfig.geographicScopeFilter.forEach(scope => filters.push({ key: 'geographicScopeFilter', value: scope, label: `Scope: ${scope}` }));
    if (filterConfig.annualGivingFilter) {
      const ranges = { '0-500000': 'Under $500K', /* ... other ranges */ '100000000-999999999': '$100M+' };
      filters.push({ key: 'annualGivingFilter', label: `Giving: ${ranges[filterConfig.annualGivingFilter] || ''}` });
    }
    return filters;
  }, [filterConfig]);

  const uniqueFocusAreas = useMemo(() => Array.from(new Set(funders.flatMap(f => f.focus_areas || []))).sort(), [funders]);
  const uniqueFunderTypes = useMemo(() => Array.from(new Set(funders.map(f => f.funder_type?.name).filter(Boolean))).sort(), [funders]);
  const uniqueGeographicScopes = useMemo(() => Array.from(new Set(funders.flatMap(f => f.funding_locations || []))).sort(), [funders]);

  const filterBarProps = {
      searchTerm: filterConfig.searchTerm, onSuggestionSelect: handleSearchAction,
      setSearchTerm: (value) => handleFilterChange('searchTerm', value),
      focusAreaFilter: filterConfig.focusAreaFilter, setFocusAreaFilter: (value) => handleFilterChange('focusAreaFilter', value),
      funderTypeFilter: filterConfig.funderTypeFilter, setFunderTypeFilter: (value) => handleFilterChange('funderTypeFilter', value),
      geographicScopeFilter: filterConfig.geographicScopeFilter, setGeographicScopeFilter: (value) => handleFilterChange('geographicScopeFilter', value),
      annualGivingFilter: filterConfig.annualGivingFilter, setAnnualGivingFilter: (value) => handleFilterChange('annualGivingFilter', value),
      sortCriteria: filterConfig.sortCriteria, setSortCriteria: (value) => handleFilterChange('sortCriteria', value),
      uniqueFocusAreas, uniqueFunderTypes, uniqueGeographicScopes, funders, pageType: "funders",
      onClearFilters: handleClearFilters, activeFilters: activeFunderFilters, onRemoveFilter: handleRemoveFunderFilter,
  };

  return (
    <div className={isProfileView ? "" : "container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12"}>
      {!isProfileView && (
        <section id="funder-intro" className="text-center pt-8 pb-12 md:pt-12 md:pb-16 mb-10 md:mb-12 bg-white p-6 rounded-xl shadow-lg border">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">Explore Funding Organizations</h2>
          <p className="text-md md:text-lg text-slate-600 mb-6 max-w-2xl mx-auto">Discover foundations and organizations that fund initiatives in the San Francisco Bay Area.</p>
          <FilterBar {...filterBarProps} isMobileVisible={true} />
        </section>
      )}

      <section id="funders-list" className="scroll-mt-20">
        {isProfileView && (
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
            <button onClick={() => setFiltersVisible(!filtersVisible)} className="flex justify-between items-center w-full p-2 rounded-lg hover:bg-slate-50">
              <span className="font-semibold text-slate-700">Filter & Sort Funders</span>
              <SlidersHorizontal size={20} className={`text-slate-500 transition-transform ${filtersVisible ? 'rotate-90' : ''}`} />
            </button>
            {filtersVisible && ( <div className="mt-4 pt-4 border-t"> <FilterBar {...filterBarProps} isMobileVisible={true} /> </div> )}
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-2xl font-semibold text-slate-800 text-center md:text-left">
            Foundations & Grantmakers <span className="text-green-600">({totalFilteredItems})</span>
          </h2>
          <div className="flex items-center gap-2">
            <select id="funders-per-page" value={fundersPerPage} onChange={(e) => setFundersPerPage(Number(e.target.value))} className="pl-3 pr-8 py-2 border border-slate-300 rounded-md bg-white text-xs focus:ring-1 focus:ring-green-500 outline-none appearance-none">
              {[6, 12, 18, 24].map((n) => (<option key={n} value={n}>Show {n}</option>))}
            </select>
            {isProfileView && (
              <div className="flex items-center rounded-md border border-slate-300 p-1 bg-white shadow-sm">
                  <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}><List size={16}/></button>
                  <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}><LayoutGrid size={16}/></button>
              </div>
            )}
          </div>
        </div>

        {loading ? ( <SearchResultsSkeleton count={fundersPerPage} /> ) : 
         currentFunders.length > 0 ? (
          viewMode === 'grid' ? (
            <div className={`grid grid-cols-1 md:grid-cols-2 ${isProfileView ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-6`}>
              {currentFunders.map((funder) => <FunderCard key={funder.id} funder={funder} handleFilterChange={handleFilterChange} />)}
            </div>
          ) : (
            <div className="space-y-4">
              {currentFunders.map((funder) => <FunderListItem key={funder.id} funder={funder} />)}
            </div>
          )
        ) : (
          <div className="text-center text-slate-500 py-12 bg-white rounded-lg shadow-sm border">
            <Search size={40} className="mx-auto text-slate-400 mb-3" />
            <p className="text-lg font-medium">No funders found.</p>
            <p className="text-sm mb-4">Try adjusting your search or filter criteria.</p>
            <button onClick={handleClearFilters} className="inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-100"><XCircle size={16} className="mr-2" />Clear All Filters</button>
          </div>
        )}
        
        {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={paginate} activeColorClass="bg-green-600 text-white border-green-600" />}
      </section>
    </div>
  );
};

export default ExploreFunders;