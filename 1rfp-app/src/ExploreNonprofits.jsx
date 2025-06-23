// src/ExploreNonprofits.jsx
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient.js';
import { Search, Users, Info, ChevronDown, Heart, Loader, XCircle } from './components/Icons.jsx';
import FilterBar from './components/FilterBar.jsx';
import Pagination from './components/Pagination.jsx';
import NonprofitCard from './components/NonprofitCard.jsx';
import { CATEGORIES, COMMON_LOCATIONS } from './constants.js';
import usePaginatedFilteredData from './hooks/usePaginatedFilteredData.js';
import { filterNonprofits } from './filtering.js';
import { sortNonprofits } from './sorting.js';
import { SearchResultsSkeleton } from './components/SkeletonLoader.jsx';

const ExploreNonprofits = () => {
  const [nonprofits, setNonprofits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobileFiltersVisible, setIsMobileFiltersVisible] = useState(false);
  
  // --- UPDATED: State now uses arrays for multi-select filters ---
  const [filterConfig, setFilterConfig] = useState({
    searchTerm: '',
    locationFilter: [],
    focusAreaFilter: [],
    minBudget: '',
    maxBudget: '',
    minStaff: '',
    maxStaff: '',
    sortCriteria: 'name_asc'
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [nonprofitsPerPage, setNonprofitsPerPage] = useState(12);

  useEffect(() => {
    const fetchNonprofits = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('nonprofits')
          .select('*, nonprofit_categories(categories(name))');

        if (error) throw error;

        if (data) {
          const formattedData = data.map(np => ({
            ...np,
            focusAreas: np.nonprofit_categories.map(npc => npc.categories.name),
            staffCount: np.staff_count,
            yearFounded: np.year_founded,
            impactMetric: np.impact_metric,
            imageUrl: np.image_url,
          }));
          setNonprofits(formattedData);
        }
      } catch (error) {
        console.error('Error fetching nonprofits:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchNonprofits();
  }, []);

  const { paginatedItems: currentNonprofits, totalPages, totalFilteredItems } = usePaginatedFilteredData(
    nonprofits,
    filterConfig,
    filterNonprofits,
    filterConfig.sortCriteria,
    sortNonprofits,
    currentPage,
    nonprofitsPerPage
  );

  const handleFilterChange = useCallback((key, value) => {
    setFilterConfig(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }, []);

  const paginate = useCallback((pageNumber) => {
    if (pageNumber < 1 || (totalPages > 0 && pageNumber > totalPages)) return;
    setCurrentPage(pageNumber);
    const nonprofitsSection = document.getElementById('nonprofits-list');
    if (nonprofitsSection) {
      const offset = 80;
      const position = nonprofitsSection.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: position, behavior: 'smooth' });
    }
  }, [totalPages]);

  const handleClearFilters = useCallback(() => {
    setFilterConfig({
      searchTerm: '',
      locationFilter: [],
      focusAreaFilter: [],
      minBudget: '',
      maxBudget: '',
      minStaff: '',
      maxStaff: '',
      sortCriteria: 'name_asc'
    });
    setCurrentPage(1);
  }, []);

  const handleRemoveNonprofitFilter = useCallback((keyToRemove, valueToRemove = null) => {
    if (Array.isArray(filterConfig[keyToRemove]) && valueToRemove) {
        const newValues = filterConfig[keyToRemove].filter(item => item !== valueToRemove);
        handleFilterChange(keyToRemove, newValues);
    } else {
        handleFilterChange(keyToRemove, Array.isArray(filterConfig[keyToRemove]) ? [] : '');
    }
  }, [filterConfig, handleFilterChange]);


  useEffect(() => {
    document.title = '1RFP - Explore Nonprofits';
  }, []);

  const activeNonprofitFilters = useMemo(() => {
    const filters = [];
    if (filterConfig.searchTerm) filters.push({ key: 'searchTerm', label: `Search: "${filterConfig.searchTerm}"` });
    
    // Updated to handle arrays for active pills
    if (Array.isArray(filterConfig.locationFilter)) {
      filterConfig.locationFilter.forEach(loc => filters.push({ key: 'locationFilter', value: loc, label: `Location: ${loc}` }));
    }
    if (Array.isArray(filterConfig.focusAreaFilter)) {
      filterConfig.focusAreaFilter.forEach(area => filters.push({ key: 'focusAreaFilter', value: area, label: `Focus: ${area}` }));
    }
    
    if (filterConfig.minBudget && filterConfig.maxBudget) {
        const budgetRanges = { '0-250000': 'Under $250K', '250000-500000': '$250K - $500K', '500000-1000000': '$500K - $1M', '1000000-2500000': '$1M - $2.5M', '2500000-5000000': '$2.5M - $5M', '5000000-999999999': '$5M+' };
        const budgetKey = `${filterConfig.minBudget}-${filterConfig.maxBudget}`;
        if(budgetRanges[budgetKey]) {
            filters.push({ key: 'minBudget', label: `Budget: ${budgetRanges[budgetKey]}` });
        }
    }

    if (filterConfig.minStaff) filters.push({ key: 'minStaff', label: `Min Staff: ${filterConfig.minStaff}` });
    if (filterConfig.maxStaff) filters.push({ key: 'maxStaff', label: `Max Staff: ${filterConfig.maxStaff}` });
    return filters;
  }, [filterConfig]);
  
  const uniqueFocusAreas = useMemo(() => Array.from(new Set(nonprofits.flatMap(f => f.focusAreas || []))).sort(), [nonprofits]);
  const uniqueLocations = useMemo(() => Array.from(new Set(nonprofits.map(f => f.location).filter(Boolean))).sort(), [nonprofits]);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <section id="nonprofit-intro" className="text-center pt-8 pb-12 md:pt-12 md:pb-16 mb-10 md:mb-12 scroll-mt-20 bg-white p-6 sm:p-8 md:p-10 rounded-xl shadow-lg border border-slate-200">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">
          Explore Bay Area Nonprofits
        </h2>
        <p className="text-md md:text-lg text-slate-600 mb-6 max-w-2xl mx-auto">
          Discover impactful nonprofit organizations making a difference in our local communities.
        </p>

        <div className="mt-8 md:hidden">
            <button
                onClick={() => setIsMobileFiltersVisible(!isMobileFiltersVisible)}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
            >
                {isMobileFiltersVisible ? 'Hide Filters' : 'Show Filters'}
                {activeNonprofitFilters.length > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-purple-600 rounded-full">
                        {activeNonprofitFilters.length}
                    </span>
                )}
            </button>
        </div>

        <FilterBar
          isMobileVisible={isMobileFiltersVisible}
          searchTerm={filterConfig.searchTerm}
          setSearchTerm={(value) => handleFilterChange('searchTerm', value)}
          locationFilter={filterConfig.locationFilter}
          setLocationFilter={(value) => handleFilterChange('locationFilter', value)}
          focusAreaFilter={filterConfig.focusAreaFilter}
          setFocusAreaFilter={(value) => handleFilterChange('focusAreaFilter', value)}
          minBudget={filterConfig.minBudget}
          setMinBudget={(value) => handleFilterChange('minBudget', value)}
          maxBudget={filterConfig.maxBudget}
          setMaxBudget={(value) => handleFilterChange('maxBudget', value)}
          minStaff={filterConfig.minStaff}
          setMinStaff={(value) => handleFilterChange('minStaff', value)}
          maxStaff={filterConfig.maxStaff}
          setMaxStaff={(value) => handleFilterChange('maxStaff', value)}
          sortCriteria={filterConfig.sortCriteria}
          setSortCriteria={(value) => handleFilterChange('sortCriteria', value)}
          uniqueLocations={uniqueLocations}
          uniqueFocusAreas={uniqueFocusAreas}
          pageType="nonprofits"
          onClearFilters={handleClearFilters}
          activeFilters={activeNonprofitFilters}
          onRemoveFilter={handleRemoveNonprofitFilter}
        />
      </section>

      <section id="nonprofits-list" className="mb-12 scroll-mt-20">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h2 className="text-2xl font-semibold text-slate-800 text-center md:text-left">
            Nonprofit Organizations <span className="text-purple-600">({totalFilteredItems})</span>
          </h2>
          <div className="flex flex-col sm:flex-row gap-3 items-center w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <label htmlFor="nonprofits-per-page" className="sr-only">Nonprofits per page</label>
              <Users size={16} className="text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
              <select
                id="nonprofits-per-page"
                value={nonprofitsPerPage}
                onChange={(e) => {
                  setNonprofitsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-8 py-2.5 border border-slate-300 rounded-md bg-white text-xs focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none appearance-none shadow-sm"
              >
                {[6, 9, 12, 15, 21, 24].map((option) => (
                  <option key={option} value={option}>
                    Show {option}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" size={16} />
            </div>
          </div>
        </div>

        {loading ? (
            <SearchResultsSkeleton count={nonprofitsPerPage} type="nonprofit" />
          ) : currentNonprofits.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentNonprofits.map((nonprofit) => (
              <NonprofitCard 
                key={nonprofit.id} 
                nonprofit={nonprofit} 
                handleFilterChange={handleFilterChange} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center text-slate-500 py-12 bg-white rounded-lg shadow-sm border border-slate-200">
            <Heart size={40} className="mx-auto text-slate-400 mb-3" />
            <p className="text-lg font-medium">No nonprofits found.</p>
            <p className="text-sm mb-4">Try adjusting your search or filter criteria.</p>
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
            >
              <XCircle size={16} className="mr-2" />
              Clear All Filters
            </button>
          </div>
        )}

        {totalPages > 0 && currentNonprofits.length > 0 && !loading && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={paginate}
            activeColorClass="bg-purple-600 text-white border-purple-600"
            inactiveColorClass="bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
            disabledColorClass="disabled:opacity-50"
          />
        )}
      </section>
    </div>
  );
};

export default ExploreNonprofits;