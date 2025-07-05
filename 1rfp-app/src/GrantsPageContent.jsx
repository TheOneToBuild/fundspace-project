// src/GrantsPageContent.jsx
import React, { useState, useEffect, useMemo, useCallback, useContext } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient.js';
import { Search, Users, MapPin, Calendar, DollarSign, Info, ChevronDown, ExternalLink, Zap, Clock, Target, Briefcase as IconBriefcase, BarChart3, ClipboardList, TrendingUp, Loader, XCircle, Heart, Bot, Briefcase, LayoutGrid, List, SlidersHorizontal, Bookmark } from './components/Icons.jsx';
import GrantCard from './components/GrantCard.jsx';
import GrantDetailModal from './GrantDetailModal.jsx';
import FilterBar from './components/FilterBar.jsx';
import Pagination from './components/Pagination.jsx';
import AnimatedCounter from './components/AnimatedCounter.jsx';
import { parseMaxFundingAmount } from './utils.js';
import { heroImpactCardsData } from './data.jsx';
import { GRANT_STATUSES } from './constants.js';
import usePaginatedFilteredData from './hooks/usePaginatedFilteredData.js';
import { filterGrants } from './filtering.js';
import { SearchResultsSkeleton } from './components/SkeletonLoader.jsx';
import { LayoutContext } from './App.jsx';

// --- Helper functions ---
const formatCurrency = (amount) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M+`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K+`;
    return `${amount}`;
};
const isGrantActive = (grant) => {
    if (!grant.dueDate) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(grant.dueDate) >= today;
};
const sortGrants = (grants, sortCriteria) => {
    return [...grants].sort((a, b) => {
        const aIsActive = isGrantActive(a);
        const bIsActive = isGrantActive(b);
        if (aIsActive && !bIsActive) return -1;
        if (!aIsActive && bIsActive) return 1;
        switch (sortCriteria) {
            case 'dueDate_asc': {
                const dateA = a.dueDate ? new Date(a.dueDate) : new Date('9999-12-31');
                const dateB = b.dueDate ? new Date(b.dueDate) : new Date('9999-12-31');
                return dateA - dateB;
            }
            case 'dueDate_desc': {
                const dateA = a.dueDate ? new Date(a.dueDate) : new Date('9999-12-31');
                const dateB = b.dueDate ? new Date(b.dueDate) : new Date('9999-12-31');
                return dateB - dateA;
            }
            case 'amount_desc':
                return parseMaxFundingAmount(b.max_funding_amount) - parseMaxFundingAmount(a.max_funding_amount);
            case 'amount_asc':
                return parseMaxFundingAmount(a.max_funding_amount) - parseMaxFundingAmount(b.max_funding_amount);
            default:
                return 0;
        }
    });
};
const HeroImageCard = ({ card, layoutClass, initialDelay = 0 }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  useEffect(() => {
    if (!card.imageUrls || card.imageUrls.length <= 1) return;
    const interval = setInterval(() => { setCurrentImageIndex(prev => (prev + 1) % card.imageUrls.length); }, 10000 + initialDelay);
    return () => clearInterval(interval);
  }, [card.imageUrls, initialDelay]);
  return ( <div className={`rounded-xl shadow-lg overflow-hidden relative group ${layoutClass}`}><img src={card.imageUrls[currentImageIndex]} alt={card.imageAlt} className="w-full h-full object-cover object-center" loading="lazy" /></div> );
};
const HeroImpactSection = ({ grants }) => {
  const layoutClasses = [ 'col-span-1 row-span-2 h-full min-h-[300px] md:min-h-[400px]', 'col-span-1 row-span-1 h-full min-h-[140px] md:min-h-[190px]', 'col-span-1 row-span-1 h-full min-h-[140px] md:min-h-[190px]', 'col-span-1 row-span-1 h-full min-h-[140px] md:min-h-[190px]', 'col-span-1 row-span-1 h-full min-h-[140px] md:min-h-[190px]' ];
  const totalAvailableFunding = useMemo(() => {
    if (!Array.isArray(grants)) return 0;
    return grants.filter(isGrantActive).reduce((sum, grant) => { const amount = grant.max_funding_amount || '0'; return sum + parseMaxFundingAmount(amount.toString()); }, 0);
  }, [grants]);
  const totalGrantsAvailable = useMemo(() => {
    if (!Array.isArray(grants)) return 0;
    return grants.filter(isGrantActive).length;
  }, [grants]);
  return (
    <section className="py-16 md:py-24 bg-white border-b border-slate-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-10 xl:gap-16 items-center">
          <div className="text-center lg:text-left">
            <div className="flex flex-col sm:flex-row gap-8 justify-center lg:justify-start mb-8">
              {totalGrantsAvailable > 0 && (
                <div className="text-center sm:text-left">
                  <div className="flex items-center gap-3 justify-center sm:justify-start"><ClipboardList size={32} className="text-purple-500" /><AnimatedCounter targetValue={totalGrantsAvailable} duration={2500} step={1} className="text-purple-600 text-4xl md:text-5xl font-bold" /></div>
                  <p className="text-sm font-medium text-slate-500 mt-1 ml-1">Active Grants Available</p>
                </div>
              )}
              {totalAvailableFunding > 0 && (
                <div className="text-center sm:text-left">
                  <div className="flex items-center gap-3 justify-center sm:justify-start"><TrendingUp size={32} className="text-green-500" /><AnimatedCounter targetValue={totalAvailableFunding} duration={2500} step={1} prefix="$" formatValue={formatCurrency} className="text-green-600 text-4xl md:text-5xl font-bold" /></div>
                  <p className="text-sm font-medium text-slate-500 mt-1 ml-1">Total Active Funding</p>
                </div>
              )}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-slate-900 mb-4 leading-tight"> A Smarter Path to <span className="text-blue-600">Funding.</span></h1>
            <p className="text-lg text-slate-600 mb-6 max-w-xl mx-auto lg:mx-0 leading-relaxed">Our mission is to empower Bay Area nonprofits by transforming grant discovery. We combine AI-powered data aggregation with community-driven insights to create a single, comprehensive, and easy-to-use platform.</p>
            <p className="text-lg text-slate-600 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">Spend less time searching and more time making an impact.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <a href="#funding-opportunity-intro" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-transform hover:scale-105 w-full sm:w-auto">Explore Grants Now <Search size={20} className="ml-2" /></a>
              <Link to="/how-it-works" className="inline-flex items-center justify-center px-6 py-3 border border-purple-200 text-base font-medium rounded-lg text-purple-700 bg-purple-50 hover:bg-purple-100 shadow-sm hover:shadow-lg transition-all w-full sm:w-auto">How 1RFP Works <Zap size={18} className="ml-2 text-purple-500"/></Link>
              <Link to="/about" className="inline-flex items-center justify-center px-6 py-3 border border-green-200 text-base font-medium rounded-lg text-green-700 bg-green-50 hover:bg-green-100 shadow-sm hover:shadow-lg transition-all w-full sm:w-auto">About Us <Users size={18} className="ml-2 text-green-500"/></Link>
            </div>
          </div>
          <div className="w-full"><div className="grid grid-cols-2 gap-4 h-[500px] md:h-[600px]">{heroImpactCardsData.map((card, index) => ( <HeroImageCard key={card.id} card={card} layoutClass={layoutClasses[index]} initialDelay={index * 300} /> ))}</div></div>
        </div>
      </div>
    </section>
  );
};

const GrantListItem = ({ grant, onOpenDetailModal, isSaved, onSave, onUnsave, session }) => {
    const dueDateText = grant.dueDate ? new Date(grant.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Rolling';
    const fundingText = formatCurrency(grant.fundingAmount);

    const handleBookmarkClick = (e) => {
        e.stopPropagation(); // Prevent the row click from opening the modal
        if (!session) return; // Or navigate to login
        isSaved ? onUnsave(grant.id) : onSave(grant.id);
    };

    return (
        <div onClick={() => onOpenDetailModal(grant)} className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all flex items-center gap-4 cursor-pointer">
            <div className="flex-shrink-0">
                {grant.funderLogoUrl ? ( <img src={grant.funderLogoUrl} alt={`${grant.foundationName} logo`} className="h-12 w-12 rounded-lg object-contain border p-1" /> ) : ( <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold">{grant.foundationName?.charAt(0) || 'F'}</div> )}
            </div>
            <div className="flex-grow min-w-0">
                <p className="text-sm text-slate-500 truncate">{grant.foundationName}</p>
                <h4 className="font-semibold text-slate-800 truncate">{grant.title}</h4>
                <div className="flex items-center gap-4 text-xs text-slate-600 mt-1">
                    <span className="flex items-center gap-1"><DollarSign size={12} /> {fundingText}</span>
                    <span className="flex items-center gap-1"><Calendar size={12} /> {dueDateText}</span>
                </div>
            </div>
            <div className="flex-shrink-0 flex items-center gap-2">
                {session && (
                    <button 
                        onClick={handleBookmarkClick}
                        className={`p-2.5 rounded-lg transition-colors ${isSaved ? 'bg-pink-100 text-pink-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                        aria-label={isSaved ? 'Unsave grant' : 'Save grant'}
                    >
                        <Bookmark size={18} />
                    </button>
                )}
                <button 
                    onClick={(e) => { e.stopPropagation(); onOpenDetailModal(grant); }}
                    className="px-4 py-2 bg-blue-50 text-blue-700 font-semibold rounded-lg hover:bg-blue-100 text-sm"
                >
                    Details
                </button>
            </div>
        </div>
    );
};

const GrantsPageContent = ({ hideHero = false, isProfileView = false }) => {
  const { setPageBgColor } = useContext(LayoutContext);

  useEffect(() => {
    if (!isProfileView) {
      // MODIFIED: Changed to the new gradient background
      setPageBgColor('bg-gradient-to-br from-rose-50 via-orange-50 to-yellow-50');

      return () => {
          setPageBgColor('bg-white');
      };
    }
  }, [isProfileView, setPageBgColor]);


  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterConfig, setFilterConfig] = useState({ searchTerm: '', locationFilter: [], categoryFilter: [], grantTypeFilter: '', grantStatusFilter: '', sortCriteria: 'dueDate_asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [grantsPerPage, setGrantsPerPage] = useState(12);
  const [isDetailModalOpen, setIsDetailModal] = useState(false);
  const [selectedGrant, setSelectedGrant] = useState(null);
  const [isMobileFiltersVisible, setIsMobileFiltersVisible] = useState(false);
  const [session, setSession] = useState(null);
  const [savedGrantIds, setSavedGrantIds] = useState(new Set());
  const [viewMode, setViewMode] = useState(isProfileView ? 'list' : 'grid');
  const [filtersVisible, setFiltersVisible] = useState(!isProfileView);

  useEffect(() => {
    const fetchInitialData = async () => {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        const { data: grantsData, error: grantsError } = await supabase.from('grants').select(`*, funders(name, logo_url, slug), grant_categories(categories(id, name)), grant_locations(locations(id, name))`).order('id', { ascending: false });
        if (grantsError) console.error('Error fetching grants:', grantsError);
        else {
            const formattedData = grantsData.map(grant => ({...grant, foundationName: grant.funders?.name || 'Unknown Funder', funderLogoUrl: grant.funders?.logo_url || null, funderSlug: grant.funders?.slug || null, fundingAmount: grant.max_funding_amount || grant.funding_amount_text || 'Not specified', dueDate: grant.deadline, grantType: grant.grant_type, eligibility_criteria: grant.eligibility_criteria, categories: grant.grant_categories.map(gc => gc.categories), locations: grant.grant_locations.map(gl => gl.locations)}));
            setGrants(formattedData);
        }
        if (session) {
            const { data: savedData, error: savedError } = await supabase.from('saved_grants').select('grant_id').eq('user_id', session.user.id);
            if (savedError) console.error('Error fetching saved grants:', savedError);
            else setSavedGrantIds(new Set(savedData.map(g => g.grant_id)));
        }
        setLoading(false);
    };
    fetchInitialData();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        if(session){
            supabase.from('saved_grants').select('grant_id').eq('user_id', session.user.id).then(({ data, error }) => { if(!error) setSavedGrantIds(new Set(data.map(g => g.grant_id)))})
        } else { setSavedGrantIds(new Set()); }
      });
    return () => { authListener.subscription.unsubscribe(); };
  }, []);

  const handleSaveGrant = async (grantId) => {
    if (!session) return;
    setSavedGrantIds(prev => new Set(prev).add(grantId));
    setGrants(prevGrants => prevGrants.map(g => g.id === grantId ? { ...g, save_count: (g.save_count || 0) + 1 } : g));
    const { error } = await supabase.from('saved_grants').insert({ user_id: session.user.id, grant_id: grantId });
    if (error) {
      console.error("Error saving grant:", error);
      setSavedGrantIds(prev => { const newSet = new Set(prev); newSet.delete(grantId); return newSet; });
      setGrants(prevGrants => prevGrants.map(g => g.id === grantId ? { ...g, save_count: g.save_count - 1 } : g));
    }
  };
  const handleUnsaveGrant = async (grantId) => {
    if (!session) return;
    setSavedGrantIds(prev => { const newSet = new Set(prev); newSet.delete(grantId); return newSet; });
    setGrants(prevGrants => prevGrants.map(g => g.id === grantId ? { ...g, save_count: Math.max(0, g.save_count - 1) } : g));
    const { error } = await supabase.from('saved_grants').delete().match({ user_id: session.user.id, grant_id: grantId });
    if (error) {
      console.error("Error unsaving grant:", error);
      setSavedGrantIds(prev => new Set(prev).add(grantId));
      setGrants(prevGrants => prevGrants.map(g => g.id === grantId ? { ...g, save_count: g.save_count + 1 } : g));
    }
  };
  
  const uniqueCategories = useMemo(() => Array.from(new Set(grants.flatMap(g => g.categories?.map(c => c.name) || []).filter(Boolean))).sort(), [grants]);
  const uniqueGrantTypes = useMemo(() => Array.from(new Set(grants.map(g => g.grantType).filter(Boolean))).sort(), [grants]);
  const uniqueLocations = useMemo(() => Array.from(new Set(grants.flatMap(g => g.locations?.map(l => l.name) || []).filter(Boolean))).sort(), [grants]);
  const grantsPerPageOptions = [6, 9, 12, 15, 21, 24, 30, 45, 60, 86];
  const { paginatedItems: currentList = [], totalPages, totalFilteredItems, filteredAndSortedItems } = usePaginatedFilteredData(grants, filterConfig, filterGrants, filterConfig.sortCriteria, sortGrants, currentPage, grantsPerPage);
  const totalFilteredFunding = useMemo(() => {
    if (!filteredAndSortedItems) return 0;
    return filteredAndSortedItems.filter(isGrantActive).reduce((sum, grant) => { const amount = grant.max_funding_amount || '0'; return sum + parseMaxFundingAmount(amount.toString()); }, 0);
  }, [filteredAndSortedItems]);
  
  const handleFilterChange = useCallback((key, value) => { setFilterConfig(prev => ({ ...prev, [key]: value })); setCurrentPage(1); }, []);
  
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
    const newCategoryFilter = categoryExists ? filterConfig.categoryFilter.filter(cat => cat !== categoryName) : [...filterConfig.categoryFilter, categoryName];
    handleFilterChange('categoryFilter', newCategoryFilter);
  }, [filterConfig.categoryFilter, handleFilterChange]);
  
  const paginate = useCallback((page) => { if (page < 1 || (totalPages > 0 && page > totalPages)) return; setCurrentPage(page); document.getElementById('grants')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, [totalPages]);
  const handlePerPageChange = useCallback((e) => { setGrantsPerPage(Number(e.target.value)); setCurrentPage(1); }, []);
  const openDetail = useCallback((grant) => { setSelectedGrant(grant); setIsDetailModal(true); }, []);
  const closeDetail = useCallback(() => { setSelectedGrant(null); setIsDetailModal(false); }, []);
  const handleClearFilters = useCallback(() => { setFilterConfig({ searchTerm: '', locationFilter: [], categoryFilter: [], grantTypeFilter: '', grantStatusFilter: '', sortCriteria: 'dueDate_asc' }); setCurrentPage(1); }, []);
  const handleRemoveGrantFilter = useCallback((keyToRemove, valueToRemove) => {
    if (keyToRemove === 'categoryFilter' || keyToRemove === 'locationFilter') { handleFilterChange(keyToRemove, filterConfig[keyToRemove].filter(item => item !== valueToRemove)); } 
    else { handleFilterChange(keyToRemove, ''); }
  }, [filterConfig, handleFilterChange]);
  
  useEffect(() => { document.title = '1RFP - Find Your Next Funding Opportunity'; }, []);
  
  const activeGrantFilters = useMemo(() => {
    let filters = [];
    if (filterConfig.searchTerm) filters.push({ key: 'searchTerm', label: `Search: "${filterConfig.searchTerm}"` });
    if (filterConfig.locationFilter.length > 0) { filters = filters.concat(filterConfig.locationFilter.map(loc => ({ key: 'locationFilter', label: `Location: ${loc}`, value: loc }))); }
    if (filterConfig.categoryFilter.length > 0) { filters = filters.concat(filterConfig.categoryFilter.map(cat => ({ key: 'categoryFilter', label: `Category: ${cat}`, value: cat }))); }
    if (filterConfig.grantTypeFilter) filters.push({ key: 'grantTypeFilter', label: `Type: ${filterConfig.grantTypeFilter}` });
    if (filterConfig.grantStatusFilter) filters.push({ key: 'grantStatusFilter', label: `Status: ${filterConfig.grantStatusFilter}` });
    return filters;
  }, [filterConfig]);

  const filterBarProps = {
      isMobileVisible: isMobileFiltersVisible,
      searchTerm: filterConfig.searchTerm,
      onSuggestionSelect: handleSearchAction,
      onSearchChange: (value) => handleFilterChange('searchTerm', value),
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
      uniqueCategories: uniqueCategories,
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
      {!hideHero && <HeroImpactSection grants={grants} />}
      
      <div className={isProfileView ? "" : "container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12"}>
        {!isProfileView && (
          <section id="funding-opportunity-intro" className="text-center pt-8 pb-12 md:pt-12 md:pb-16 mb-10 md:mb-12 scroll-mt-20 bg-transparent p-6 sm:p-8 md:p-10 rounded-xl">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">Find Your Next Funding Opportunity</h2>
            <p className="text-md md:text-lg text-slate-600 mb-6 max-w-2xl mx-auto">Discover RFPs and grants tailored for nonprofits in the San Francisco Bay Area.</p>
            <div className="mt-8 md:hidden">
              <button onClick={() => setIsMobileFiltersVisible(!isMobileFiltersVisible)} className="w-full inline-flex items-center justify-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50">
                {isMobileFiltersVisible ? 'Hide Filters' : 'Show Filters'}
                {activeGrantFilters.length > 0 && ( <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">{activeGrantFilters.length}</span> )}
              </button>
            </div>
            <FilterBar {...filterBarProps} isMobileVisible={isMobileFiltersVisible} />
          </section>
        )}

        <section id="grants" className="scroll-mt-20">
          {isProfileView && (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
              <button onClick={() => setFiltersVisible(!filtersVisible)} className="flex justify-between items-center w-full p-2 rounded-lg hover:bg-slate-50">
                <span className="font-semibold text-slate-700">Filter & Sort</span>
                <SlidersHorizontal size={20} className={`text-slate-500 transition-transform ${filtersVisible ? 'rotate-90' : ''}`} />
              </button>
              {filtersVisible && ( <div className="mt-4 pt-4 border-t"> <FilterBar {...filterBarProps} isMobileVisible={true} /> </div> )}
            </div>
          )}
          
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h2 className="text-2xl font-semibold text-slate-800 text-center md:text-left">
              <span>Available Grants </span><span className="text-blue-600">({totalFilteredItems})</span>
              {totalFilteredItems > 0 && !loading && (
                <><span className="text-slate-300 mx-3" aria-hidden="true">·</span><span className="text-green-600 font-semibold">Active Funds (<AnimatedCounter targetValue={totalFilteredFunding} duration={1000} prefix="$" formatValue={formatCurrency}/>)</span></>
              )}
            </h2>
            <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-auto">
                    <select id="grants-per-page" value={grantsPerPage} onChange={handlePerPageChange} className="w-full pl-3 pr-8 py-2 border border-slate-300 rounded-md bg-white text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none shadow-sm">
                        {[6, 12, 24, 48].map((option) => (<option key={option} value={option}>Show {option}</option>))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none" size={16} />
                </div>
                {isProfileView && (
                    <div className="flex items-center rounded-md border border-slate-300 p-1 bg-white shadow-sm">
                        <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}><List size={16}/></button>
                        <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}><LayoutGrid size={16}/></button>
                    </div>
                )}
            </div>
          </div>

          {loading ? (
             <SearchResultsSkeleton count={grantsPerPage} type="grant" />
          ) : currentList && currentList.length > 0 ? (
            viewMode === 'grid' ? (
              <div className={`grid grid-cols-1 md:grid-cols-2 ${isProfileView ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-6`}>
                {currentList.map((grant) => ( <GrantCard key={grant.id} grant={grant} session={session} isSaved={savedGrantIds.has(grant.id)} onSave={handleSaveGrant} onUnsave={handleUnsaveGrant} onOpenDetailModal={openDetail} onFilterByCategory={handleFilterByCategory} /> ))}
              </div>
            ) : (
              <div className="space-y-4">
                {currentList.map((grant) => ( <GrantListItem key={grant.id} grant={grant} session={session} isSaved={savedGrantIds.has(grant.id)} onSave={handleSaveGrant} onUnsave={handleUnsaveGrant} onOpenDetailModal={openDetail} /> ))}
              </div>
            )
          ) : (
            <div className="text-center text-slate-500 py-12 bg-transparent rounded-lg">
              <Search size={40} className="mx-auto text-slate-400 mb-3" />
              <p className="text-lg font-medium">No grants found for your criteria.</p>
              <p className="text-sm mb-4">Try using a broader search term or removing a filter to see more results.</p>
              <button onClick={handleClearFilters} className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors">
                <XCircle size={16} className="mr-2" /> Clear All Filters
              </button>
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