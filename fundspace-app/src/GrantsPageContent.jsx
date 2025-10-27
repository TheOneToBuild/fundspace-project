import React, { useState, useEffect, useMemo, useCallback, useContext, useRef } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient.js';
import { refreshGrantBookmarkCounts } from './utils/grantUtils';
import { Search, Users, Calendar, DollarSign, ChevronDown, XCircle, LayoutGrid, List, SlidersHorizontal, Bookmark, Sparkles, TrendingUp as TrendingUpIcon } from './components/Icons.jsx';
import GrantCard from './components/GrantCard.jsx';
import GrantDetailModal from './GrantDetailModal.jsx';
import EnhancedSearchInput from './components/EnhancedSearchInput.jsx';
import FilterBar from './components/FilterBar.jsx';
import Pagination from './components/Pagination.jsx';
import AnimatedCounter from './components/AnimatedCounter.jsx';
import { parseMaxFundingAmount } from './utils.js';
import usePaginatedFilteredData from './hooks/usePaginatedFilteredData.js';
import { filterGrantsWithTaxonomy } from './filtering.js';
import { GRANT_STATUSES } from './constants.js';
import { getGrantsWithCategories, getAvailableGrantCategories } from './utils/rpcClientFunctions.js';

const filterGrantsByStatus = (grants, status) => {
  // Default to 'active' if no status is selected (i.e., "All Statuses")
  const effectiveStatus = status || 'active';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const closingSoonDate = new Date(today);
  closingSoonDate.setDate(today.getDate() + 14); // 2 weeks from now

  return grants.filter(grant => {
    // For rolling deadlines, only show if 'active' or 'all' (which defaults to active) is chosen.
    if (!grant.dueDate) return effectiveStatus === 'active';

    const dueDate = new Date(grant.dueDate);

    switch (effectiveStatus) {
      case 'active':
        return dueDate >= today;
      case 'closing_soon':
        return dueDate >= today && dueDate <= closingSoonDate;
      case 'closed':
        // Only show closed if explicitly selected
        return dueDate < today;
      default:
        return true;
    }
  });
};

import { SearchResultsSkeleton } from './components/SkeletonLoader.jsx';
import { LayoutContext } from './App.jsx';

// Taxonomy display names
const TAXONOMY_DISPLAY_NAMES = {
  'nonprofit.501c3': '501(c)(3)',
  'nonprofit.501c4': '501(c)(4)',
  'nonprofit.501c6': 'Business Leagues',
  'education.university': 'Universities',
  'education.k12': 'K-12 Schools',
  'education.research': 'Research Institutions',
  'healthcare.hospital': 'Hospitals',
  'healthcare.clinic': 'Clinics',
  'government.federal': 'Federal Agencies',
  'government.state': 'State Agencies',
  'government.local': 'Local Government',
  'foundation.family': 'Family Foundations',
  'foundation.community': 'Community Foundations',
  'foundation.corporate': 'Corporate Foundations',
  'forprofit.startup': 'Startups',
  'forprofit.socialenterprise': 'Social Enterprises',
  'forprofit.socialenterprise.bcorp': 'B-Corps',
  'religious.church': 'Religious Orgs'
};

const formatCurrency = (amount) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M+`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K+`;
    return `$${amount.toLocaleString()}`;
};

const isGrantActive = (grant) => {
    if (!grant.dueDate) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(grant.dueDate) >= today;
};

const sortGrants = (grants, sort) => [...grants].sort((a,b)=>{
  const aAct = isGrantActive(a), bAct = isGrantActive(b);
  if (aAct!==bAct) return aAct? -1:1;
  const dateOrMax = (g)=> g.dueDate? new Date(g.dueDate): new Date('9999-12-31');
  switch (sort){
    case 'dueDate_asc': return dateOrMax(a)-dateOrMax(b);
    case 'dueDate_desc': 
      return dateOrMax(b)-dateOrMax(a);
    case 'amount_desc': {
      const valA = a.max_funding_amount ? a.max_funding_amount : parseMaxFundingAmount(a.funding_amount_text || '0');
      const valB = b.max_funding_amount ? b.max_funding_amount : parseMaxFundingAmount(b.funding_amount_text || '0');
      return valB - valA;
    }
    case 'amount_asc': {
      const valA = a.max_funding_amount ? a.max_funding_amount : parseMaxFundingAmount(a.funding_amount_text || '0');
      const valB = b.max_funding_amount ? b.max_funding_amount : parseMaxFundingAmount(b.funding_amount_text || '0');
      return valA - valB;
    }
    default: 
      // Default sort by due date if no criteria is matched
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate) - new Date(b.dueDate);
      } else if (a.dueDate) {
        return -1;
      }
      return 0;
  }
});

const GrantsPageContent = ({ 
  isProfileView = false, 
  isExploreTab = false, 
  hideFilterBar = false,
  externalFilterConfig,
  onFilterChange,
  viewMode: externalViewMode,
  availableCategories: externalAvailableCategories,
  uniqueGrantLocations: externalGrantLocations,
  uniqueGrantTypes: externalGrantTypes,
  allGrants: externalAllGrants,
}) => {
  const { setPageBgColor } = useContext(LayoutContext);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    // Only set the page background if this component is the main page view
    if (!isProfileView && !isExploreTab) { 
      setPageBgColor('bg-[#faf7f5]');
    }
    return () => {
      if (!isProfileView && !isExploreTab) { 
        setPageBgColor('bg-white');
      }
    };
  }, [isProfileView, isExploreTab, setPageBgColor]);

  // Use external grants if provided, otherwise use internal state
  const [grants, setGrants] = useState(externalAllGrants || []);
  const [loading, setLoading] = useState(true);
  const [filterConfig, setFilterConfig] = useState(
    externalFilterConfig || {
      searchTerm: '',
      locationFilter: [],
      categoryFilter: [],
      taxonomyFilter: initialFilters.taxonomyFilter || [], // ADD THIS LINE
      grantStatusFilter: initialFilters.grantStatusFilter || 'active', // Default to active
      grantTypeFilter: initialFilters.grantTypeFilter || '',
      sortCriteria: initialFilters.sortCriteria || 'dueDate_asc',
    }
  );

  useEffect(() => {
    if (externalFilterConfig) {
      setFilterConfig(externalFilterConfig);
    }
  }, [externalFilterConfig]);

  useEffect(() => {
    if (externalAllGrants) {
      setGrants(externalAllGrants);
      // If grants are provided externally, we can assume loading is complete
      setLoading(false);
    }
  }, [externalAllGrants]);

  // Trending/recent search feature removed
  const [currentPage, setCurrentPage] = useState(1);
  const [grantsPerPage, setGrantsPerPage] = useState(12);
  const [isDetailModalOpen, setIsDetailModal] = useState(false);
  const [availableCategories, setAvailableCategories] = useState(externalAvailableCategories || []);
  const [selectedGrant, setSelectedGrant] = useState(null);
  const [viewMode, setViewMode] = useState(externalViewMode || 'grid');
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [session, setSession] = useState(null);
  const [savedGrantIds, setSavedGrantIds] = useState(new Set());

  useEffect(() => {
    if (externalViewMode) {
      setViewMode(externalViewMode);
    }
  }, [externalViewMode]);

  useEffect(() => {
    // Only fetch data if it's not provided externally (i.e., not in explore tab)
    if (!isExploreTab) {
      const fetchInitialData = async () => {
      setLoading(true);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);

        // NEW: Use the RPC function instead of direct query
        const grantsResult = await getGrantsWithCategories();
        const grantsData = grantsResult.grants || [];

        // Update bookmark counts
        const grantIds = grantsData.map(grant => grant.id);
        const bookmarkCounts = await refreshGrantBookmarkCounts(grantIds);

        grantsData.forEach(grant => {
          grant.save_count = bookmarkCounts[grant.id] || 0;
        });

        setGrants(grantsData);

        // NEW: Fetch available categories dynamically
        const categories = await getAvailableGrantCategories();
        setAvailableCategories(categories);

        if (session) {
          const { data: savedData, error: savedError } = await supabase
            .from('saved_grants')
            .select('grant_id')
            .eq('user_id', session.user.id);
          
          if (savedError) {
            console.error('Error fetching saved grants:', savedError);
          } else {
            setSavedGrantIds(new Set(savedData.map(g => g.grant_id)));
          }
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        setLoading(false);
      }
    };
      fetchInitialData();
    }

    // Auth listener should run regardless
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => { 
      setSession(session);
      if (session) {
        supabase
          .from('saved_grants')
          .select('grant_id')
          .eq('user_id', session.user.id)
          .then(({ data, error }) => { 
            if (!error) setSavedGrantIds(new Set(data.map(g => g.grant_id)));
          });
      } else { 
        setSavedGrantIds(new Set()); 
      }
    });
    
    return () => { authListener.subscription.unsubscribe(); };
  }, [isExploreTab]); // Re-run if the context changes
  
  const openDetail = useCallback((grant) => { 
    setSelectedGrant(grant); 
    setIsDetailModal(true); 
  }, []);

  const location = useLocation();
  useEffect(() => {
    // Close modal on route change
    closeDetail();
  }, [location.pathname]);

  const closeDetail = useCallback(() => { 
    setSelectedGrant(null); 
    setIsDetailModal(false); 
    searchParams.delete('open_grant');
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (grants.length === 0 || isDetailModalOpen) return;

    const grantId = searchParams.get('open_grant');
    const grantSlug = searchParams.get('open_grant_slug');

    let grantToOpen = null;
    if (grantId) {
      grantToOpen = grants.find(g => g.id.toString() === grantId);
    } else if (grantSlug) {
      grantToOpen = grants.find(g => g.slug === grantSlug);
    }

    if (grantToOpen) {
      openDetail(grantToOpen);
    }
  }, [searchParams, grants, openDetail, isDetailModalOpen]);

  const handleSaveGrant = async (grantId) => {
    if (!session) return;
    
    // Optimistically update UI
    setSavedGrantIds(prev => new Set(prev).add(grantId));
    setGrants(prevGrants => prevGrants.map(g => 
      g.id === grantId ? { ...g, save_count: (g.save_count || 0) + 1 } : g
    ));
    
    try {
      const { error } = await supabase
        .from('saved_grants')
        .insert({ user_id: session.user.id, grant_id: grantId });
        
      if (error) {
        console.error("Error saving grant:", error);
        // Revert optimistic updates
        setSavedGrantIds(prev => { 
          const newSet = new Set(prev); 
          newSet.delete(grantId); 
          return newSet; 
        });
        setGrants(prevGrants => prevGrants.map(g => 
          g.id === grantId ? { ...g, save_count: Math.max(0, (g.save_count || 1) - 1) } : g
        ));
      } else {
        const bookmarkCounts = await refreshGrantBookmarkCounts([grantId]);
        setGrants(prevGrants => prevGrants.map(g => 
          g.id === grantId ? { ...g, save_count: bookmarkCounts[grantId] || 0 } : g
        ));
      }
    } catch (error) {
      console.error("Error saving grant:", error);
      // Revert optimistic updates
      setSavedGrantIds(prev => { 
        const newSet = new Set(prev); 
        newSet.delete(grantId); 
        return newSet; 
      });
      setGrants(prevGrants => prevGrants.map(g => 
        g.id === grantId ? { ...g, save_count: Math.max(0, (g.save_count || 1) - 1) } : g
      ));
    }
  };

  const handleSaveToggle = (grantId) => {
    if (!session) return;
    savedGrantIds.has(grantId) ? handleUnsaveGrant(grantId) : handleSaveGrant(grantId);
  };

  const handleUnsaveGrant = async (grantId) => {
    if (!session) return;
    
    // Optimistically update UI
    setSavedGrantIds(prev => { 
      const newSet = new Set(prev); 
      newSet.delete(grantId); 
      return newSet;
    });
    setGrants(prevGrants => prevGrants.map(g => 
      g.id === grantId ? { ...g, save_count: Math.max(0, (g.save_count || 1) - 1) } : g
    ));
    
    try {
      const { error } = await supabase
        .from('saved_grants')
        .delete()
        .match({ user_id: session.user.id, grant_id: grantId });
        
      if (error) {
        console.error("Error unsaving grant:", error);
        // Revert optimistic updates
        setSavedGrantIds(prev => new Set(prev).add(grantId));
        setGrants(prevGrants => prevGrants.map(g => 
          g.id === grantId ? { ...g, save_count: (g.save_count || 0) + 1 } : g
        ));
      } else {
        const bookmarkCounts = await refreshGrantBookmarkCounts([grantId]);
        setGrants(prevGrants => prevGrants.map(g => 
          g.id === grantId ? { ...g, save_count: bookmarkCounts[grantId] || 0 } : g
        ));
      }
    } catch (error) {
      console.error("Error unsaving grant:", error);
      // Revert optimistic updates
      setSavedGrantIds(prev => new Set(prev).add(grantId));
      setGrants(prevGrants => prevGrants.map(g => 
        g.id === grantId ? { ...g, save_count: (g.save_count || 0) + 1 } : g
      ));
    }
  };

  const uniqueCategories = useMemo(() => {
    const source = externalAvailableCategories || availableCategories;
    if (!source || !Array.isArray(source)) return [];

    return source.map(category => ({
      name: category.name,
      count: category.count || 0,
      displayName: `${category.name} (${category.count || 0})`
    }));
  }, [availableCategories, externalAvailableCategories]);

  const uniqueGrantTypes = useMemo(() => {
    return externalGrantTypes || Array.from(new Set(grants.map(g => g.grantType).filter(Boolean))).sort();
  }, [externalGrantTypes, grants]);

  const uniqueLocations = useMemo(() => {
    return externalGrantLocations || Array.from(new Set(grants.flatMap(g => g.locations?.map(l => l.name) || []).filter(Boolean))).sort();
  }, [externalGrantLocations, grants]);
  
  const grantsFilteredByStatus = useMemo(() => filterGrantsByStatus(grants, filterConfig.grantStatusFilter), [grants, filterConfig.grantStatusFilter]);

  const { paginatedItems: currentList = [], totalPages, totalFilteredItems, filteredAndSortedItems } = usePaginatedFilteredData(
    grantsFilteredByStatus,
    filterConfig, 
    filterGrantsWithTaxonomy,
    filterConfig.sortCriteria,
    sortGrants,
    currentPage, 
    grantsPerPage,
  );
  
  const totalFilteredFunding = useMemo(() => {
    if (!filteredAndSortedItems) return 0;
    return filteredAndSortedItems.filter(isGrantActive).reduce((sum, grant) => { 
      const amount = grant.max_funding_amount || '0'; 
      return sum + parseMaxFundingAmount(amount.toString()); 
    }, 0);
  }, [filteredAndSortedItems]);

  const handleFilterChange = useCallback((key, value) => { 
    setFilterConfig(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
    
    // If there's an external filter change handler, call it
    if (onFilterChange) {
      onFilterChange(key, value);
    }
  }, [onFilterChange]);

  const handleTaxonomyChange = useCallback((selectedTaxonomies) => {
    handleFilterChange('taxonomyFilter', selectedTaxonomies);
  }, [handleFilterChange]);

  const handleSearchAction = useCallback((suggestion) => {
    const newConfig = { ...filterConfig, searchTerm: suggestion.text };
    if (suggestion.type === 'category' && !filterConfig.categoryFilter.includes(suggestion.text)) {
      newConfig.categoryFilter = [...filterConfig.categoryFilter, suggestion.text];
    }
    setFilterConfig(newConfig);
    setCurrentPage(1);
  }, [filterConfig]);

  const handleFilterByCategory = useCallback((categoryName) => {
    const categoryExists = filterConfig.categoryFilter.includes(categoryName);
    const newCategoryFilter = categoryExists ? 
      filterConfig.categoryFilter.filter(cat => cat !== categoryName) : 
      [...filterConfig.categoryFilter, categoryName];
    handleFilterChange('categoryFilter', newCategoryFilter);
  }, [filterConfig.categoryFilter, handleFilterChange]);

  const paginate = useCallback((page) => { 
    if (page < 1 || (totalPages > 0 && page > totalPages)) return; 
    setCurrentPage(page); 
    document.getElementById('grants')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); 
  }, [totalPages]);

  const handlePerPageChange = useCallback((e) => { 
    setGrantsPerPage(Number(e.target.value)); 
    setCurrentPage(1); 
  }, []);

  const handleClearFilters = useCallback(() => { 
    setFilterConfig({ 
      searchTerm: '', 
      locationFilter: [], 
      categoryFilter: [], 
      grantTypeFilter: '', 
      grantStatusFilter: '', 
      sortCriteria: 'dueDate_asc',
      taxonomyFilter: [],
    }); 
    setCurrentPage(1); 
  }, []);

  const handleRemoveGrantFilter = useCallback((keyToRemove, valueToRemove) => {
    if (keyToRemove === 'categoryFilter' || keyToRemove === 'locationFilter' || keyToRemove === 'taxonomyFilter') { 
      handleFilterChange(keyToRemove, filterConfig[keyToRemove].filter(item => item !== valueToRemove)); 
    } else { 
      handleFilterChange(keyToRemove, ''); 
    }
  }, [filterConfig, handleFilterChange]);

  useEffect(() => { 
    document.title = 'Fundspace - Find Your Next Funding Opportunity'; 
  }, []);

  const activeGrantFilters = useMemo(() => {
    let filters = [];
    if (filterConfig.searchTerm) filters.push({ key: 'searchTerm', label: `Search: "${filterConfig.searchTerm}"` });
    if (filterConfig.locationFilter && filterConfig.locationFilter.length > 0) {
      filters = filters.concat(filterConfig.locationFilter.map(loc => ({ key: 'locationFilter', label: `Location: ${loc}`, value: loc })));
    }
    if (filterConfig.categoryFilter && filterConfig.categoryFilter.length > 0) {
      filters = filters.concat(filterConfig.categoryFilter.map(cat => ({ key: 'categoryFilter', label: `Category: ${cat}`, value: cat })));
    }
    if (filterConfig.taxonomyFilter && filterConfig.taxonomyFilter.length > 0) {
      filters = filters.concat(filterConfig.taxonomyFilter.map(tax => ({ key: 'taxonomyFilter', label: `Org Type: ${tax}`, value: tax })));
    }
    if (filterConfig.grantTypeFilter) filters.push({ key: 'grantTypeFilter', label: `Type: ${filterConfig.grantTypeFilter}` });
    if (filterConfig.grantStatusFilter) {
      const statusLabel = GRANT_STATUSES.find(s => s.value === filterConfig.grantStatusFilter)?.label || filterConfig.grantStatusFilter;
      filters.push({ key: 'grantStatusFilter', label: `Status: ${statusLabel}` });
    }
    return filters;
  }, [filterConfig]);

  const filterBarProps = {
            isMobileVisible: filtersVisible,
            searchTerm: filterConfig.searchTerm,
            onSearchChange: (val) => {
              const searchValue = typeof val === 'string' ? val : val.text;
              setFilterConfig(cfg => ({ ...cfg, searchTerm: searchValue }));
              if (searchValue === '') setCurrentPage(1);
            },
            locationFilter: filterConfig.locationFilter,
            setLocationFilter: (value) => handleFilterChange('locationFilter', value),
            categoryFilter: filterConfig.categoryFilter,
            setCategoryFilter: (value) => handleFilterChange('categoryFilter', value),
            grantStatusFilter: filterConfig.grantStatusFilter,
            setGrantStatusFilter: (value) => handleFilterChange('grantStatusFilter', value),
            grantTypeFilter: filterConfig.grantTypeFilter,
            setGrantTypeFilter: (value) => handleFilterChange('grantTypeFilter', value),
            sortCriteria: filterConfig.sortCriteria,
            setSortCriteria: (value) => handleFilterChange('sortCriteria', value),
            taxonomyFilter: filterConfig.taxonomyFilter,
            setTaxonomyFilter: handleTaxonomyChange,            
            availableCategories: availableCategories, // Pass the fetched categories
            uniqueLocations: uniqueLocations,
            uniqueGrantTypes: uniqueGrantTypes,
            uniqueGrantStatuses: GRANT_STATUSES,
            pageType: "grants",
            onClearFilters: handleClearFilters,
            activeFilters: activeGrantFilters,
            onRemoveFilter: handleRemoveGrantFilter,
  };


  return (
    <>
      <div className={isProfileView ? "" : "container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 bg-[#faf7f5]"}>
        {/* Reserve space for filter dropdown to prevent layout shift */}
        {!isProfileView && !hideFilterBar && <div className="h-[110px] md:h-[110px] lg:h-[110px] w-full" style={{pointerEvents:'none',marginBottom:'-110px'}}></div>}
        {/* Redesigned full-width search bar with integrated filters, inspired by kit.com */}
        {!isProfileView && !hideFilterBar && ( <section className="mb-12 flex flex-col items-center w-full pt-14 sm:pt-20"> <div className="w-full flex flex-col items-center"> <div className="w-full flex items-center bg-white border border-slate-100 rounded-2xl shadow-xl px-4 py-2 focus-within:ring-2 focus-within:ring-blue-400 transition-all duration-200 ring-1 ring-slate-100 hover:ring-blue-200 hover:shadow-2xl relative" style={{ minHeight: 48, marginLeft: 0, marginRight: 0 }}> <EnhancedSearchInput searchTerm={filterConfig.searchTerm} onSearchChange={val => { const searchValue = typeof val === 'string' ? val : val.text; handleFilterChange('searchTerm', searchValue); }} onSuggestionSelect={val => { const searchValue = typeof val === 'string' ? val : val.text; setFilterConfig(cfg => ({ ...cfg, searchTerm: searchValue })); setCurrentPage(1); }} placeholder="Search for grants..." className="flex-1 bg-transparent outline-none text-base text-slate-800 placeholder-slate-400 font-semibold tracking-wide" showRecentSearches={false} /> <div className="h-8 w-px bg-slate-100 mx-4 hidden md:block" /> <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-2xl shadow-md hover:from-blue-700 hover:to-purple-700 hover:scale-[1.04] focus:ring-2 focus:ring-blue-400 transition-all duration-200 text-base tracking-wide ml-2" onClick={() => setFiltersVisible(v => !v)} aria-expanded={filtersVisible} style={{ minHeight: '48px' }} > <SlidersHorizontal size={22} /> <span className="hidden sm:inline">{filtersVisible ? 'Hide Filters' : 'Show Filters'}</span> {activeGrantFilters.length > 0 && ( <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-blue-600 bg-white rounded-full border border-blue-100 shadow-sm"> {activeGrantFilters.length} </span> )} </button> <div className="h-6 w-px bg-slate-200 mx-2" /> <button onClick={handleClearFilters} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors duration-200" > <XCircle className="w-4 h-4" /> Clear All </button> </div> <div className={`w-full max-w-6xl -mt-2 pt-0 pb-0 px-0 flex flex-col items-center transition-all duration-500 ease-in-out ${filtersVisible ? 'opacity-100 translate-y-0 max-h-[500px]' : 'opacity-0 -translate-y-4 pointer-events-none max-h-0'}`} style={{ willChange: 'opacity, transform, maxHeight', zIndex: 50, borderTopLeftRadius: 0, borderTopRightRadius: 0 }} > <FilterBar {...filterBarProps} isMobileVisible={true} /> </div> </div> </section> )}

        <section id="grants" className="scroll-mt-20">
          {isProfileView && !hideFilterBar && (
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/60 mb-8">
              <button 
                onClick={() => setFiltersVisible(!filtersVisible)} 
                className="flex justify-between items-center w-full p-3 rounded-xl hover:bg-slate-50 transition-colors duration-300"
              >
                <span className="font-semibold text-slate-700 flex items-center gap-2">
                  <SlidersHorizontal size={20} className="text-slate-500" />
                  Filter & Sort
                </span>
                <ChevronDown size={20} className={`text-slate-500 transition-transform duration-300 ${filtersVisible ? 'rotate-180' : ''}`} />
              </button>
              {filtersVisible && ( 
                <div className="mt-6 pt-6 border-t border-slate-200"> 
                  <FilterBar {...filterBarProps} isMobileVisible={true} /> 
                </div> 
              )}
            </div>
          )}

          {/* The header has been moved to ExplorePage.jsx for consistency */}

          {loading ? (
             <SearchResultsSkeleton count={grantsPerPage} type="grant" />
          ) : currentList && currentList.length > 0 ? (
            <>
              <div className={`w-full ${viewMode === 'list' ? 'space-y-4' : `grid grid-cols-1 md:grid-cols-2 ${isExploreTab ? 'lg:grid-cols-4' : isProfileView ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-6`}`}>
                {currentList.map((grant) => (
                  <GrantCard
                    key={grant.id}
                    grant={grant}
                    viewMode={viewMode}
                    onSaveToggle={handleSaveToggle}
                    isSaved={savedGrantIds.has(grant.id)}
                    onClick={() => openDetail(grant)}
                    session={session}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16 relative">
              <div className="absolute inset-0 flex items-center justify-center opacity-5">
                <Search size={200} className="text-slate-400" />
              </div>
              
              <div className="relative bg-white/80 backdrop-blur-sm p-12 rounded-3xl border border-white/60 shadow-xl max-w-md mx-auto">
                <div className="w-20 h-20 bg-gradient-to-r from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Search size={40} className="text-slate-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3">No grants found</h3>
                <p className="text-slate-600 mb-6">Try using a broader search term or removing a filter to see more results.</p>
                <button 
                  onClick={handleClearFilters} 
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <XCircle size={16} className="mr-2" /> 
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
          
          {totalPages > 0 && currentList && currentList.length > 0 && !loading && (
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={paginate} />
          )}
        </section>
      </div>
      
      {isDetailModalOpen && selectedGrant && (
        <GrantDetailModal
            grant={selectedGrant}
            isOpen={isDetailModalOpen}
            onClose={closeDetail}
            session={session}
            isSaved={savedGrantIds.has(selectedGrant.id)}
            onSave={handleSaveGrant}
            onUnsave={handleUnsaveGrant}
        />
      )}
    </>
  );
};

export default GrantsPageContent;