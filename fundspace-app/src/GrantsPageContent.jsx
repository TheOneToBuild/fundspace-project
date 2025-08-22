// src/GrantsPageContent.jsx - FIXED VERSION
import React, { useState, useEffect, useMemo, useCallback, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from './supabaseClient.js';
import { refreshGrantBookmarkCounts } from './utils/grantUtils';
import { Search, Users, MapPin, Calendar, DollarSign, Info, ChevronDown, ExternalLink, Zap, Clock, Target, Briefcase as IconBriefcase, BarChart3, ClipboardList, TrendingUp, Loader, XCircle, Heart, Bot, Briefcase, LayoutGrid, List, SlidersHorizontal, Bookmark, ArrowRight, Sparkles, Star, TrendingUp as TrendingUpIcon } from './components/Icons.jsx';
import GrantCard from './components/GrantCard.jsx';
import GrantDetailModal from './GrantDetailModal.jsx';
import FilterBar from './components/FilterBar.jsx';
import Pagination from './components/Pagination.jsx';
import AnimatedCounter from './components/AnimatedCounter.jsx';
import { parseMaxFundingAmount } from './utils.js';
import { GRANT_STATUSES } from './constants.js';
import usePaginatedFilteredData from './hooks/usePaginatedFilteredData.js';
import { filterGrantsWithTaxonomy } from './filtering.js';
import { SearchResultsSkeleton } from './components/SkeletonLoader.jsx';
import { LayoutContext } from './App.jsx';

// --- Helper functions & objects (some might be from GrantCard.jsx for consistency) ---

// Taxonomy code to display name mapping (shortened for list view)
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

// --- Updated Grant List Item Component ---
const GrantListItem = ({ grant, onOpenDetailModal, isSaved, onSave, onUnsave, session }) => {
    const dueDateText = grant.dueDate ? new Date(grant.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Rolling';
    const fundingText = grant.fundingAmount ? formatCurrency(parseMaxFundingAmount(grant.fundingAmount.toString())) : 'Not Specified';

    const handleBookmarkClick = (e) => {
        e.stopPropagation();
        if (!session) return;
        isSaved ? onUnsave(grant.id) : onSave(grant.id);
    };

    const getInitials = (name) => {
        if (!name) return '?';
        const words = name.split(' ');
        return words.length > 1 
            ? (words[0][0] + words[1][0]).toUpperCase() 
            : name.substring(0, 2).toUpperCase();
    };

    return (
        <div 
            onClick={() => onOpenDetailModal(grant)} 
            className="group bg-white p-4 md:p-5 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-2xl transition-all duration-300 flex flex-col md:flex-row items-start md:items-center gap-4 cursor-pointer transform hover:-translate-y-1"
        >
            <div className="flex-shrink-0">
                {grant.organization?.image_url ? (
                    <img 
                        src={grant.organization.image_url} 
                        alt={`${grant.foundationName} logo`}
                        className="h-14 w-14 md:h-16 md:w-16 rounded-xl object-contain border-2 border-white shadow-lg group-hover:shadow-xl transition-shadow duration-300" 
                    />
                ) : (
                    <div className="h-14 w-14 md:h-16 md:w-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                        {getInitials(grant.foundationName)}
                    </div>
                )}
            </div>
            
            <div className="flex-grow min-w-0 w-full">
                <div className="flex items-center gap-3 mb-1.5">
                    <p className="text-sm text-slate-500 font-medium truncate">{grant.foundationName}</p>
                    {grant.grantType && (
                        <span className="flex-shrink-0 text-xs bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 px-2 py-0.5 rounded-full font-medium border border-blue-200">
                            {grant.grantType}
                        </span>
                    )}
                </div>
                <h4 className="font-bold text-slate-800 text-lg mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
                    {grant.title}
                </h4>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
                    <div className="flex items-center gap-1.5" title="Funding Amount">
                        <DollarSign size={14} className="text-green-600" />
                        <span className="font-semibold text-green-700">{fundingText}</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Due Date">
                        <Calendar size={14} className="text-red-600" />
                        <span className="font-semibold text-red-700">{dueDateText}</span>
                    </div>
                    {grant.eligible_organization_types && grant.eligible_organization_types.length > 0 && (
                        <div className="flex items-center gap-1.5" title="Eligibility">
                            <Users size={14} className="text-indigo-600" />
                            <span className="font-semibold text-indigo-700">
                                {TAXONOMY_DISPLAY_NAMES[grant.eligible_organization_types[0]] || grant.eligible_organization_types[0]}
                                {grant.eligible_organization_types.length > 1 && (
                                    <span className="text-slate-500 font-medium"> +{grant.eligible_organization_types.length - 1} more</span>
                                )}
                            </span>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="w-full md:w-auto flex-shrink-0 flex flex-row items-center gap-3 mt-4 md:mt-0">
                {session && (
                    <button
                        onClick={handleBookmarkClick}
                        className={`p-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                            isSaved 
                                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white' 
                                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                        }`}
                        aria-label={isSaved ? 'Unsave grant' : 'Save grant'}
                    >
                        <Bookmark size={18} fill={isSaved ? 'currentColor' : 'none'} />
                    </button>
                )}
                <button
                    onClick={(e) => { e.stopPropagation(); onOpenDetailModal(grant); }}
                    className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
                >
                    <Sparkles size={16} />
                    Details
                </button>
            </div>
        </div>
    );
};

const GrantsPageContent = ({ isProfileView = false }) => {
  const { setPageBgColor } = useContext(LayoutContext);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (!isProfileView) {
      setPageBgColor('bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50');
      return () => {
          setPageBgColor('bg-white');
      };
    }
  }, [isProfileView, setPageBgColor]);

  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterConfig, setFilterConfig] = useState({ 
    searchTerm: '', 
    locationFilter: [], 
    categoryFilter: [], 
    grantTypeFilter: '', 
    grantStatusFilter: '', 
    sortCriteria: 'dueDate_asc', 
    taxonomyFilter: [],
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [grantsPerPage, setGrantsPerPage] = useState(12);
  const [isDetailModalOpen, setIsDetailModal] = useState(false);
  const [selectedGrant, setSelectedGrant] = useState(null);
  const [isMobileFiltersVisible, setIsMobileFiltersVisible] = useState(false);
  const [session, setSession] = useState(null);
  const [savedGrantIds, setSavedGrantIds] = useState(new Set());
  const [viewMode, setViewMode] = useState('grid');
  const [filtersVisible, setFiltersVisible] = useState(!isProfileView);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      // FIXED: Use simple query from grants_with_taxonomy view without complex joins
      const { data: grantsData, error: grantsError } = await supabase
        .from('grants_with_taxonomy')
        .select('*')
        .order('id', { ascending: false });

      if (grantsError) {
        console.error('Error fetching grants:', grantsError);
      } else {
        // Get organization IDs and fetch organizations separately
        const orgIds = [...new Set(grantsData.map(g => g.organization_id).filter(Boolean))];
        const { data: orgsData } = await supabase
          .from('organizations')
          .select('id, name, image_url, banner_image_url, slug')
          .in('id', orgIds);

        const formattedData = grantsData.map(grant => {
          const orgData = orgsData?.find(o => o.id === grant.organization_id);
          
          return {
            ...grant,
            foundationName: grant.funder_name || 'Unknown Funder',
            funderSlug: grant.funder_slug || orgData?.slug || null,
            fundingAmount: grant.max_funding_amount || grant.funding_amount_text || 'Not specified',
            dueDate: grant.deadline,
            grantType: grant.grant_type,
            eligibility_criteria: grant.eligibility_criteria,
            categories: grant.category_names ? grant.category_names.map((name, idx) => ({ id: idx, name })) : [],
            locations: grant.location_names ? grant.location_names.map((name, idx) => ({ id: idx, name })) : [],
            eligible_organization_types: grant.taxonomy_codes || [],
            // Updated organization object to use joined data
            organization: {
              image_url: orgData?.image_url || grant.funder_logo_url || null,
              banner_image_url: orgData?.banner_image_url || null
            },
            save_count: 0 // Initialize to 0, will be updated below
          };
        });

        // FIXED: Get fresh bookmark counts from database
        const grantIds = formattedData.map(grant => grant.id);
        const bookmarkCounts = await refreshGrantBookmarkCounts(grantIds);

        // Update grants with accurate bookmark counts
        formattedData.forEach(grant => {
          grant.save_count = bookmarkCounts[grant.id] || 0;
        });

        setGrants(formattedData);
      }

      if (session) {
        const { data: savedData, error: savedError } = await supabase
          .from('saved_grants')
          .select('grant_id')
          .eq('user_id', session.user.id);
        if (savedError) console.error('Error fetching saved grants:', savedError);
        else setSavedGrantIds(new Set(savedData.map(g => g.grant_id)));
      }
      setLoading(false);
    };
    
    fetchInitialData();
    
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
  }, []);

  const openDetail = useCallback((grant) => { 
    setSelectedGrant(grant); 
    setIsDetailModal(true); 
  }, []);

  const closeDetail = useCallback(() => { 
    setSelectedGrant(null); 
    setIsDetailModal(false); 
    searchParams.delete('open_grant');
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const grantIdToOpen = searchParams.get('open_grant');
    if (grantIdToOpen && grants.length > 0 && !selectedGrant) {
      const grantToOpen = grants.find(g => g.id.toString() === grantIdToOpen);
      if (grantToOpen) {
        openDetail(grantToOpen);
      }
    }
  }, [searchParams, grants, openDetail, selectedGrant]);

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
        // SUCCESS: Get fresh count from database
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
        // SUCCESS: Get fresh count from database
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

  const uniqueCategories = useMemo(() => Array.from(new Set(grants.flatMap(g => g.categories?.map(c => c.name) || []).filter(Boolean))).sort(), [grants]);
  const uniqueGrantTypes = useMemo(() => Array.from(new Set(grants.map(g => g.grantType).filter(Boolean))).sort(), [grants]);
  const uniqueLocations = useMemo(() => Array.from(new Set(grants.flatMap(g => g.locations?.map(l => l.name) || []).filter(Boolean))).sort(), [grants]);
  
  const { paginatedItems: currentList = [], totalPages, totalFilteredItems, filteredAndSortedItems } = usePaginatedFilteredData(
    grants, 
    filterConfig, 
    filterGrantsWithTaxonomy, 
    filterConfig.sortCriteria, 
    sortGrants, 
    currentPage, 
    grantsPerPage
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
  }, []);

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
    if (filterConfig.locationFilter.length > 0) { 
      filters = filters.concat(filterConfig.locationFilter.map(loc => ({ key: 'locationFilter', label: `Location: ${loc}`, value: loc }))); 
    }
    if (filterConfig.categoryFilter.length > 0) { 
      filters = filters.concat(filterConfig.categoryFilter.map(cat => ({ key: 'categoryFilter', label: `Category: ${cat}`, value: cat }))); 
    }
    if (filterConfig.taxonomyFilter.length > 0) {
      filters = filters.concat(filterConfig.taxonomyFilter.map(tax => ({ key: 'taxonomyFilter', label: `Org Type: ${tax}`, value: tax })));
    }
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
      taxonomyFilter: filterConfig.taxonomyFilter,
      setTaxonomyFilter: handleTaxonomyChange,
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
      <div className={isProfileView ? "" : "container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12"}>
        {!isProfileView && (
          <section id="funding-opportunity-intro" className="text-center mb-12 relative">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full opacity-10 animate-pulse"></div>
              <div className="absolute top-32 right-20 w-24 h-24 bg-gradient-to-r from-pink-400 to-rose-600 rounded-full opacity-10 animate-pulse delay-1000"></div>
              <div className="absolute bottom-10 left-1/3 w-20 h-20 bg-gradient-to-r from-emerald-400 to-teal-600 rounded-full opacity-10 animate-pulse delay-2000"></div>
            </div>
            
            <div className="relative bg-white/80 backdrop-blur-sm p-6 md:p-10 rounded-3xl border border-white/60 shadow-2xl">
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-3">
                <span className="text-slate-900">Find Your Next </span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
                  Funding Opportunity
                </span>
              </h2>
              
              <p className="text-md md:text-lg text-slate-600 mb-6 max-w-3xl mx-auto leading-relaxed">
                Our AI-powered database pulls funding opportunities from across the Bay Area.
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 font-semibold"> Discover your perfect match.</span>
              </p>

              <div className="mt-8 md:hidden">
                <button 
                  onClick={() => setIsMobileFiltersVisible(!isMobileFiltersVisible)} 
                  className="w-full inline-flex items-center justify-center px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  {isMobileFiltersVisible ? 'Hide Filters' : 'Show Filters'}
                  {activeGrantFilters.length > 0 && ( 
                    <span className="ml-3 inline-flex items-center justify-center px-3 py-1 text-xs font-bold leading-none text-blue-600 bg-white rounded-full">
                      {activeGrantFilters.length}
                    </span> 
                  )}
                </button>
              </div>

              <FilterBar {...filterBarProps} isMobileVisible={isMobileFiltersVisible} />
            </div>
          </section>
        )}

        <section id="grants" className="scroll-mt-20">
          {isProfileView && (
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

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 text-center sm:text-left w-full">
                <h2 className="text-2xl md:text-3xl font-bold">
                    <span className="text-slate-800">Available Grants </span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 font-extrabold">
                    ({totalFilteredItems})
                    </span>
                </h2>
                {totalFilteredItems > 0 && !loading && (
                    <div className="mt-2 sm:mt-0 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full border border-green-200 shadow-sm">
                        <TrendingUpIcon size={20} className="text-green-600" />
                        <span className="text-green-700 font-semibold">
                            <AnimatedCounter 
                                targetValue={totalFilteredFunding} 
                                duration={1000} 
                                formatValue={formatCurrency}
                            /> Available
                        </span>
                    </div>
                )}
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto flex-shrink-0">
                <div className="relative w-full sm:w-auto">
                    <select 
                      id="grants-per-page" 
                      value={grantsPerPage} 
                      onChange={handlePerPageChange} 
                      className="w-full pl-4 pr-10 py-3 border border-slate-300 rounded-xl bg-white text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none shadow-sm hover:shadow-md transition-shadow duration-300"
                    >
                        {[6, 12, 24, 48].map((option) => (
                          <option key={option} value={option}>Show {option}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-slate-400" size={16} />
                </div>
                
                <div className="flex items-center bg-white rounded-xl border border-slate-300 p-1 shadow-sm">
                    <button 
                      onClick={() => setViewMode('grid')} 
                      className={`p-2.5 rounded-lg transition-all duration-300 flex items-center gap-2 ${viewMode === 'grid' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}
                      title="Grid View"
                    >
                      <LayoutGrid size={18}/>
                    </button>
                    <button 
                      onClick={() => setViewMode('list')} 
                      className={`p-2.5 rounded-lg transition-all duration-300 flex items-center gap-2 ${viewMode === 'list' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}
                      title="List View"
                    >
                      <List size={18}/>
                    </button>
                </div>
            </div>
          </div>

          {loading ? (
             <SearchResultsSkeleton count={grantsPerPage} type="grant" />
          ) : currentList && currentList.length > 0 ? (
            <>
              {viewMode === 'grid' ? (
                <div className={`grid grid-cols-1 md:grid-cols-2 ${isProfileView ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-8`}>
                  {currentList.map((grant) => ( 
                    <GrantCard 
                      key={grant.id} 
                      grant={grant} 
                      session={session} 
                      isSaved={savedGrantIds.has(grant.id)} 
                      onSave={handleSaveGrant} 
                      onUnsave={handleUnsaveGrant} 
                      onOpenDetailModal={openDetail} 
                      onFilterByCategory={handleFilterByCategory} 
                    /> 
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {currentList.map((grant) => ( 
                    <GrantListItem 
                      key={grant.id} 
                      grant={grant} 
                      session={session} 
                      isSaved={savedGrantIds.has(grant.id)} 
                      onSave={handleSaveGrant} 
                      onUnsave={handleUnsaveGrant} 
                      onOpenDetailModal={openDetail} 
                    /> 
                  ))}
                </div>
              )}
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