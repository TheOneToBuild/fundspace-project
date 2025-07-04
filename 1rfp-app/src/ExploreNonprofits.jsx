// src/ExploreNonprofits.jsx
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient.js';
import { Search, Users, Info, ChevronDown, Heart, Loader, XCircle, MapPin, DollarSign, LayoutGrid, List, SlidersHorizontal } from './components/Icons.jsx';
import FilterBar from './components/FilterBar.jsx';
import Pagination from './components/Pagination.jsx';
import NonprofitCard from './components/NonprofitCard.jsx';
import usePaginatedFilteredData from './hooks/usePaginatedFilteredData.js';
import { filterNonprofits } from './filtering.js';
import { sortNonprofits } from './sorting.js';
import { SearchResultsSkeleton } from './components/SkeletonLoader.jsx';

// NEW: A compact list item component for the list view
const NonprofitListItem = ({ nonprofit }) => (
    <Link to={`/nonprofits/${nonprofit.slug}`} className="bg-white p-4 rounded-xl border border-slate-200 hover:border-purple-500 hover:shadow-md transition-all flex items-center gap-4 cursor-pointer">
        <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center">
            {nonprofit.imageUrl ? <img src={nonprofit.imageUrl} alt={nonprofit.name} className="h-full w-full object-cover rounded-lg" /> : <Users size={24} className="text-slate-400" />}
        </div>
        <div className="flex-grow min-w-0">
            <h4 className="font-semibold text-slate-800 truncate">{nonprofit.name}</h4>
            <div className="flex items-center gap-4 text-xs text-slate-600 mt-1">
                {nonprofit.location && <span className="flex items-center gap-1.5"><MapPin size={12} /> {nonprofit.location}</span>}
                {nonprofit.budget && <span className="flex items-center gap-1.5"><DollarSign size={12} /> {nonprofit.budget}</span>}
            </div>
        </div>
        <div className="flex-shrink-0">
             <div className="hidden sm:flex flex-wrap gap-1.5 justify-end max-w-xs">
                {(nonprofit.focusAreas || []).slice(0, 2).map(area => (
                    <span key={area} className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-800">{area}</span>
                ))}
            </div>
        </div>
    </Link>
);


const ExploreNonprofits = ({ isProfileView = false }) => {
  const [nonprofits, setNonprofits] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filterConfig, setFilterConfig] = useState({
    searchTerm: '', locationFilter: [], focusAreaFilter: [],
    minBudget: '', maxBudget: '', minStaff: '', maxStaff: '',
    sortCriteria: 'name_asc'
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [nonprofitsPerPage, setNonprofitsPerPage] = useState(12);

  // --- NEW: State for the compact view ---
  const [viewMode, setViewMode] = useState('grid');
  const [filtersVisible, setFiltersVisible] = useState(!isProfileView);

  const location = useLocation();

  const handleFilterChange = useCallback((keyOrSuggestion, value) => {
    setCurrentPage(1);
    if (typeof keyOrSuggestion === 'string') {
      setFilterConfig(prev => ({ ...prev, [keyOrSuggestion]: value }));
      return;
    }
    if (typeof keyOrSuggestion === 'object' && keyOrSuggestion !== null) {
      const suggestion = keyOrSuggestion;
      switch (suggestion.type) {
        case 'text': setFilterConfig(prev => ({ ...prev, searchTerm: suggestion.text || '' })); break;
        case 'focus_area': setFilterConfig(prev => ({ ...prev, searchTerm: '', focusAreaFilter: [...new Set([...prev.focusAreaFilter, suggestion.text])] })); break;
        case 'location': setFilterConfig(prev => ({ ...prev, searchTerm: '', locationFilter: [...new Set([...prev.locationFilter, suggestion.text])] })); break;
        default: setFilterConfig(prev => ({ ...prev, searchTerm: suggestion.text || '' })); break;
      }
    }
  }, []);

  useEffect(() => {
    if (location.state?.prefilledFilter) {
      const { key, value } = location.state.prefilledFilter;
      handleFilterChange(key, [value]);
    }
  }, [location.state, handleFilterChange]);

  useEffect(() => {
    const fetchNonprofits = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('nonprofits').select('*, nonprofit_categories(categories(name))');
        if (error) throw error;
        if (data) {
          const formattedData = data.map(np => ({
            ...np,
            focusAreas: np.nonprofit_categories.map(npc => npc.categories.name),
            staffCount: np.staff_count, yearFounded: np.year_founded,
            impactMetric: np.impact_metric, imageUrl: np.image_url,
          }));
          setNonprofits(formattedData);
        }
      } catch (error) { console.error('Error fetching nonprofits:', error); } 
      finally { setLoading(false); }
    };
    fetchNonprofits();
  }, []);

  const { paginatedItems: currentNonprofits, totalPages, totalFilteredItems } = usePaginatedFilteredData(nonprofits, filterConfig, filterNonprofits, filterConfig.sortCriteria, sortNonprofits, currentPage, nonprofitsPerPage);

  const paginate = useCallback((pageNumber) => {
    if (pageNumber < 1 || (totalPages > 0 && pageNumber > totalPages)) return;
    setCurrentPage(pageNumber);
    document.getElementById('nonprofits-list')?.scrollIntoView({ behavior: 'smooth' });
  }, [totalPages]);

  const handleClearFilters = useCallback(() => { setFilterConfig({ searchTerm: '', locationFilter: [], focusAreaFilter: [], minBudget: '', maxBudget: '', minStaff: '', maxStaff: '', sortCriteria: 'name_asc' }); setCurrentPage(1); }, []);
  const handleRemoveNonprofitFilter = useCallback((keyToRemove, valueToRemove = null) => { if (Array.isArray(filterConfig[keyToRemove]) && valueToRemove) { handleFilterChange(keyToRemove, filterConfig[keyToRemove].filter(item => item !== valueToRemove)); } else { handleFilterChange(keyToRemove, ''); } }, [filterConfig, handleFilterChange]);

  const activeNonprofitFilters = useMemo(() => {
    const filters = [];
    if (filterConfig.searchTerm) filters.push({ key: 'searchTerm', label: `Search: "${filterConfig.searchTerm}"` });
    if (filterConfig.locationFilter) filterConfig.locationFilter.forEach(loc => filters.push({ key: 'locationFilter', value: loc, label: `Location: ${loc}` }));
    if (filterConfig.focusAreaFilter) filterConfig.focusAreaFilter.forEach(area => filters.push({ key: 'focusAreaFilter', value: area, label: `Focus: ${area}` }));
    return filters;
  }, [filterConfig]);
  
  const uniqueFocusAreas = useMemo(() => Array.from(new Set(nonprofits.flatMap(f => f.focusAreas || []))).sort(), [nonprofits]);
  const uniqueLocations = useMemo(() => Array.from(new Set(nonprofits.map(f => f.location).filter(Boolean))).sort(), [nonprofits]);

  const filterBarProps = {
      isMobileVisible: true, searchTerm: filterConfig.searchTerm, onSuggestionSelect: handleFilterChange,
      locationFilter: filterConfig.locationFilter, setLocationFilter: (value) => handleFilterChange('locationFilter', value),
      focusAreaFilter: filterConfig.focusAreaFilter, setFocusAreaFilter: (value) => handleFilterChange('focusAreaFilter', value),
      minBudget: filterConfig.minBudget, setMinBudget: (value) => handleFilterChange('minBudget', value),
      maxBudget: filterConfig.maxBudget, setMaxBudget: (value) => handleFilterChange('maxBudget', value),
      sortCriteria: filterConfig.sortCriteria, setSortCriteria: (value) => handleFilterChange('sortCriteria', value),
      uniqueLocations, uniqueFocusAreas, pageType: "nonprofits", onClearFilters: handleClearFilters,
      activeFilters: activeNonprofitFilters, onRemoveFilter: handleRemoveNonprofitFilter
  };

  return (
    <div className={isProfileView ? "" : "container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12"}>
      {!isProfileView && (
        <section id="nonprofit-intro" className="text-center pt-8 pb-12 md:pt-12 md:pb-16 mb-10 md:mb-12 scroll-mt-20 bg-white p-6 rounded-xl shadow-lg border">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">Explore Bay Area Nonprofits</h2>
          <p className="text-md md:text-lg text-slate-600 mb-6 max-w-2xl mx-auto">Discover impactful nonprofit organizations making a difference in our local communities.</p>
          <FilterBar {...filterBarProps} />
        </section>
      )}

      <section id="nonprofits-list" className="scroll-mt-20">
        {isProfileView && (
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
            <button onClick={() => setFiltersVisible(!filtersVisible)} className="flex justify-between items-center w-full p-2 rounded-lg hover:bg-slate-50">
              <span className="font-semibold text-slate-700">Filter & Sort Nonprofits</span>
              <SlidersHorizontal size={20} className={`text-slate-500 transition-transform ${filtersVisible ? 'rotate-90' : ''}`} />
            </button>
            {filtersVisible && ( <div className="mt-4 pt-4 border-t"> <FilterBar {...filterBarProps} /> </div> )}
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h2 className="text-2xl font-semibold text-slate-800 text-center md:text-left">
            Nonprofit Organizations <span className="text-purple-600">({totalFilteredItems})</span>
          </h2>
          <div className="flex items-center gap-2">
            <select id="nonprofits-per-page" value={nonprofitsPerPage} onChange={(e) => { setNonprofitsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="pl-3 pr-8 py-2 border border-slate-300 rounded-md bg-white text-xs focus:ring-1 focus:ring-purple-500 outline-none appearance-none">
              {[6, 12, 18, 24].map((option) => (<option key={option} value={option}>Show {option}</option>))}
            </select>
            {isProfileView && (
              <div className="flex items-center rounded-md border border-slate-300 p-1 bg-white shadow-sm">
                  <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}><List size={16}/></button>
                  <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}><LayoutGrid size={16}/></button>
              </div>
            )}
          </div>
        </div>

        {loading ? ( <SearchResultsSkeleton count={nonprofitsPerPage} /> ) : 
         currentNonprofits.length > 0 ? (
            viewMode === 'grid' ? (
                <div className={`grid grid-cols-1 md:grid-cols-2 ${isProfileView ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-6`}>
                    {currentNonprofits.map((nonprofit) => <NonprofitCard key={nonprofit.id} nonprofit={nonprofit} handleFilterChange={handleFilterChange} />)}
                </div>
            ) : (
                <div className="space-y-4">
                    {currentNonprofits.map((nonprofit) => <NonprofitListItem key={nonprofit.id} nonprofit={nonprofit} />)}
                </div>
            )
        ) : (
          <div className="text-center text-slate-500 py-12 bg-white rounded-lg shadow-sm border">
            <Heart size={40} className="mx-auto text-slate-400 mb-3" />
            <p className="text-lg font-medium">No nonprofits found.</p>
            <p className="text-sm mb-4">Try adjusting your search or filter criteria.</p>
            <button onClick={handleClearFilters} className="inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium"><XCircle size={16} className="mr-2" />Clear All Filters</button>
          </div>
        )}
        
        {totalPages > 1 && !loading && ( <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={paginate} activeColorClass="bg-purple-600 text-white border-purple-600"/> )}
      </section>
    </div>
  );
};

export default ExploreNonprofits;