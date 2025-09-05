// src/components/GrantsPortalPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { hasPermission, PERMISSIONS } from '../utils/permissions.js';

// Components
import PortalAccessControl from './portal/PortalAccessControl.jsx';
import PortalBanner from './portal/PortalBanner.jsx';
import PortalActionCards from './portal/PortalActionCards.jsx';
import ExploreFundsTab from './portal/ExploreFundsTab.jsx';
import TrackFundsTab from './portal/track-funds/TrackFundsTab.jsx';
import { 
  CreateFundsTab, 
  RequestFundsTab, 
  CommunitiesTab, 
  OrganizationsTab 
} from './portal/PortalPlaceholderTabs.jsx';
import CreateGrantModal from './portal/CreateGrantModal.jsx';
import GrantDetailModal from '../GrantDetailModal.jsx';

// Hooks and utilities
import { filterGrantsWithTaxonomy } from '../filtering.js';
import { sortGrants } from '../sorting.js';
import usePaginatedFilteredData from '../hooks/usePaginatedFilteredData.js';
import { refreshGrantBookmarkCounts } from '../utils/grantUtils.js';
import { GRANT_STATUSES } from '../constants.js';
import { parseMaxFundingAmount } from '../utils.js';

const GrantsPortalPage = () => {
  const { profile, session } = useOutletContext();
  
  // Access control state
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [userMembership, setUserMembership] = useState(null);
  
  // Data state
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedGrantIds, setSavedGrantIds] = useState(new Set());
  
  // UI state
  const [activeTab, setActiveTab] = useState('explore');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  
  // Grants filtering and pagination state
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
  
  // Grant detail modal state
  const [isDetailModalOpen, setIsDetailModal] = useState(false);
  const [selectedGrant, setSelectedGrant] = useState(null);

  // Permission check
  useEffect(() => {
    const checkAccess = async () => {
      if (!profile) {
        setCheckingAccess(false);
        return;
      }

      if (profile.is_omega_admin === true) {
        setHasAccess(true);
        setCheckingAccess(false);
        return;
      }

      try {
        const { data: membership } = await supabase
          .from('organization_memberships')
          .select(`*, organizations(*)`)
          .eq('profile_id', profile.id)
          .in('role', ['super_admin', 'admin'])
          .limit(1)
          .single();

        if (membership && hasPermission(membership.role, PERMISSIONS.MANAGE_MEMBERS, profile.is_omega_admin)) {
          setUserMembership(membership);
          setHasAccess(true);
        } else {
          setHasAccess(false);
        }
      } catch (error) {
        console.error('Error checking permissions:', error);
        setHasAccess(false);
      }
      
      setCheckingAccess(false);
    };

    checkAccess();
  }, [profile]);

  // Load grants data
  useEffect(() => {
    const fetchGrants = async () => {
      if (!hasAccess) return;
      
      setLoading(true);
      
      try {
        const { data: grantsData, error: grantsError } = await supabase
          .from('grants_with_taxonomy')
          .select('*')
          .order('id', { ascending: false });

        if (grantsError) {
          console.error('Error fetching grants:', grantsError);
          setGrants([]);
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
              organization: {
                image_url: orgData?.image_url || grant.funder_logo_url || null,
                banner_image_url: orgData?.banner_image_url || null
              },
              save_count: 0
            };
          });

          // Get fresh bookmark counts from database
          const grantIds = formattedData.map(grant => grant.id);
          const bookmarkCounts = await refreshGrantBookmarkCounts(grantIds);

          // Update grants with accurate bookmark counts
          formattedData.forEach(grant => {
            grant.save_count = bookmarkCounts[grant.id] || 0;
          });

          setGrants(formattedData);
        }
      } catch (error) {
        console.error('Error loading grants:', error);
        setGrants([]);
      }
      
      setLoading(false);
    };

    fetchGrants();
  }, [hasAccess]);
  
  // Load saved grants for the user
  useEffect(() => {
    if (!session) return;
    
    const fetchSavedGrants = async () => {
      const { data: savedData, error: savedError } = await supabase
        .from('saved_grants')
        .select('grant_id')
        .eq('user_id', session.user.id);
      if (savedError) console.error('Error fetching saved grants:', savedError);
      else setSavedGrantIds(new Set(savedData.map(g => g.grant_id)));
    };
    
    fetchSavedGrants();
  }, [session]);

  // Grant handling functions
  const handleSaveGrant = async (grantId) => {
    if (!session) return;
    
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
        setSavedGrantIds(prev => { 
          const newSet = new Set(prev); 
          newSet.delete(grantId); 
          return newSet; 
        });
        setGrants(prevGrants => prevGrants.map(g => 
          g.id === grantId ? { ...g, save_count: Math.max(0, (g.save_count || 1) - 1) } : g
        ));
      }
    } catch (error) {
      console.error("Error saving grant:", error);
    }
  };

  const handleUnsaveGrant = async (grantId) => {
    if (!session) return;
    
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
        setSavedGrantIds(prev => new Set(prev).add(grantId));
        setGrants(prevGrants => prevGrants.map(g => 
          g.id === grantId ? { ...g, save_count: (g.save_count || 0) + 1 } : g
        ));
      }
    } catch (error) {
      console.error("Error unsaving grant:", error);
    }
  };

  const openDetail = useCallback((grant) => { 
    setSelectedGrant(grant); 
    setIsDetailModal(true); 
  }, []);

  const closeDetail = useCallback(() => { 
    setSelectedGrant(null); 
    setIsDetailModal(false); 
  }, []);

  // Filter and pagination logic
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

  const isGrantActive = (grant) => {
    if (!grant.dueDate) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(grant.dueDate) >= today;
  };

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

  const formatCurrency = (amount) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
    return `${amount.toLocaleString()}`;
  };

  // Render tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'explore':
        return (
          <ExploreFundsTab
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            filterConfig={filterConfig}
            handleFilterChange={handleFilterChange}
            activeGrantFilters={activeGrantFilters}
            loading={loading}
            currentList={currentList}
            totalFilteredItems={totalFilteredItems}
            totalFilteredFunding={totalFilteredFunding}
            grantsPerPage={grantsPerPage}
            handlePerPageChange={handlePerPageChange}
            viewMode={viewMode}
            setViewMode={setViewMode}
            totalPages={totalPages}
            currentPage={currentPage}
            paginate={paginate}
            handleClearFilters={handleClearFilters}
            session={session}
            savedGrantIds={savedGrantIds}
            handleSaveGrant={handleSaveGrant}
            handleUnsaveGrant={handleUnsaveGrant}
            openDetail={openDetail}
            handleFilterByCategory={handleFilterByCategory}
            filterBarProps={filterBarProps}
            formatCurrency={formatCurrency}
          />
        );
      case 'track':
        return <TrackFundsTab session={session} userMembership={userMembership} />;
      case 'communities':
        return <CommunitiesTab />;
      case 'organizations':
        return <OrganizationsTab />;
      case 'create':
        return <CreateFundsTab />;
      case 'request':
        return <RequestFundsTab />;
      default:
        return null;
    }
  };

  return (
    <PortalAccessControl checkingAccess={checkingAccess} hasAccess={hasAccess}>
      <div className="min-h-screen pb-16">
        <div className="px-2 lg:px-4 py-8">
          <PortalBanner userMembership={userMembership} />
          <PortalActionCards 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            userMembership={userMembership} 
          />
          {renderTabContent()}
        </div>

        <CreateGrantModal 
          showCreateModal={showCreateModal} 
          setShowCreateModal={setShowCreateModal} 
        />

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
      </div>
    </PortalAccessControl>
  );
};

export default GrantsPortalPage;