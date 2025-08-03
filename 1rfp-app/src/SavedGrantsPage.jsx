// src/SavedGrantsPage.jsx - FINAL WORKING VERSION
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from './supabaseClient';
import { useOutletContext, Link } from 'react-router-dom';
import GrantCard from './components/GrantCard.jsx';
import GrantDetailModal from './GrantDetailModal.jsx';
import FilterBar from './components/FilterBar.jsx';
import Pagination from './components/Pagination.jsx';
import { sortGrants } from './sorting.js';
import { BookmarkIcon, Search, XCircle } from './components/Icons.jsx';
import { GRANT_STATUSES } from './constants.js';
import { refreshGrantBookmarkCounts } from './utils/grantUtils.js';

const filterSavedGrants = (grant, filters) => {
  const { searchTerm, locationFilter, categoryFilter, grantTypeFilter, grantStatusFilter } = filters;

  const term = (typeof searchTerm === 'string' ? searchTerm.trim() : '').toLowerCase();
  const matchesSearch = !term ||
    (grant.title || '').toLowerCase().includes(term) ||
    (grant.description || '').toLowerCase().includes(term) ||
    (grant.foundationName || '').toLowerCase().includes(term) ||
    (grant.categories && grant.categories.some(c => (c.name || '').toLowerCase().includes(term)));

  const locFilterArray = Array.isArray(locationFilter) ? locationFilter.map(l => l.toLowerCase().trim()) : [];
  const grantLocs = (grant.locations || []).map(l => (l.name || '').toLowerCase().trim());
  const matchesLocation = locFilterArray.length === 0 ||
    locFilterArray.some(filterLoc => grantLocs.includes(filterLoc));

  const categoryFilterArray = Array.isArray(categoryFilter) ? categoryFilter.map(c => c.toLowerCase().trim()) : [];
  const grantCats = (grant.categories || []).map(c => (c.name || '').toLowerCase().trim());
  const matchesCategory = categoryFilterArray.length === 0 ||
    categoryFilterArray.some(filterCat => grantCats.includes(filterCat));
    
  const matchesGrantType = !grantTypeFilter || grant.grantType === grantTypeFilter;

  let matchesGrantStatus = true;
  if (grantStatusFilter) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    const grantDueDateString = grant.dueDate;
    if (grantStatusFilter === 'Open') {
      matchesGrantStatus = !grantDueDateString || new Date(grantDueDateString) >= today;
    } else if (grantStatusFilter === 'Rolling') {
      matchesGrantStatus = !grantDueDateString;
    } else if (grantStatusFilter === 'Closed') {
      matchesGrantStatus = grantDueDateString && new Date(grantDueDateString) < today;
    }
  }

  return matchesSearch && matchesLocation && matchesCategory && matchesGrantType && matchesGrantStatus;
};

export default function SavedGrantsPage() {
  const { session } = useOutletContext();
  const [loading, setLoading] = useState(true);
  const [allSavedGrants, setAllSavedGrants] = useState([]);
  const [isDetailModalOpen, setIsDetailModal] = useState(false);
  const [selectedGrant, setSelectedGrant] = useState(null);

  const [filterConfig, setFilterConfig] = useState({
    searchTerm: '',
    locationFilter: [],
    categoryFilter: [],
    grantTypeFilter: '',
    grantStatusFilter: '',
    sortCriteria: 'dueDate_asc' 
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [grantsPerPage, setGrantsPerPage] = useState(10);

  // WORKING VERSION - Build up the data step by step
  const fetchSavedGrantsWorking = useCallback(async (userId) => {
    setLoading(true);
    try {
      // Step 1: Get saved grants
      const { data: savedGrantsData, error: savedError } = await supabase
        .from('saved_grants')
        .select('id, grant_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (savedError) {
        console.error('Error fetching saved grants:', savedError);
        setAllSavedGrants([]);
        return;
      }

      if (!savedGrantsData || savedGrantsData.length === 0) {
        setAllSavedGrants([]);
        return;
      }
      const grantIds = savedGrantsData.map(sg => sg.grant_id);

      // Step 2: Get basic grant data
      const { data: grantsData, error: grantsError } = await supabase
        .from('grants')
        .select('*')
        .in('id', grantIds);

      if (grantsError) {
        console.error('Error fetching grants:', grantsError);
        setAllSavedGrants([]);
        return;
      }

      // Step 3: Get organization data for the grants
      const orgIds = [...new Set(grantsData.map(g => g.organization_id).filter(Boolean))];
      let orgsData = [];
      if (orgIds.length > 0) {
        const { data: organizationsData } = await supabase
          .from('organizations')
          .select('id, name, image_url, banner_image_url, slug')
          .in('id', orgIds);
        orgsData = organizationsData || [];
      }

      // Step 4: Get categories for the grants
      const { data: categoriesData } = await supabase
        .from('grant_categories')
        .select('grant_id, categories(id, name)')
        .in('grant_id', grantIds);

      // Step 5: Get locations for the grants
      const { data: locationsData } = await supabase
        .from('grant_locations')
        .select('grant_id, locations(id, name)')
        .in('grant_id', grantIds);

      // Step 6: Get real-time bookmark counts using utility function
      const bookmarkCounts = await refreshGrantBookmarkCounts(grantIds);

      // Step 7: Combine everything
      const formattedData = savedGrantsData.map(savedGrant => {
        const grantData = grantsData.find(g => g.id === savedGrant.grant_id);
        if (!grantData) return null;

        const orgData = orgsData.find(o => o.id === grantData.organization_id);
        const grantCategories = (categoriesData || []).filter(gc => gc.grant_id === savedGrant.grant_id);
        const grantLocations = (locationsData || []).filter(gl => gl.grant_id === savedGrant.grant_id);

        return {
          ...grantData,
          save_id: savedGrant.id,
          foundationName: orgData?.name || 'Unknown Organization',
          funderLogoUrl: orgData?.image_url || null,
          fundingAmount: grantData.max_funding_amount || grantData.funding_amount_text || 'Not specified',
          dueDate: grantData.deadline,
          grantType: grantData.grant_type,
          categories: grantCategories.map(gc => gc.categories).filter(Boolean),
          locations: grantLocations.map(gl => gl.locations).filter(Boolean),
          eligibility_criteria: grantData.eligibility_criteria,
          save_count: bookmarkCounts[savedGrant.grant_id] || 0,
          // Add organization object for GrantCard compatibility
          organization: {
            image_url: orgData?.image_url || null,
            banner_image_url: orgData?.banner_image_url || null,
            name: orgData?.name || 'Unknown Organization'
          }
        };
      }).filter(Boolean);

      setAllSavedGrants(formattedData);

    } catch (err) {
      console.error('Unexpected error:', err);
      setAllSavedGrants([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      fetchSavedGrantsWorking(session.user.id);
    }
  }, [session, fetchSavedGrantsWorking]);

  const filteredAndSortedGrants = useMemo(() => {
    let grants = [...allSavedGrants];
    grants = grants.filter(grant => filterSavedGrants(grant, filterConfig));
    grants = sortGrants(grants, filterConfig.sortCriteria);
    return grants;
  }, [allSavedGrants, filterConfig]);

  const totalPages = Math.ceil(filteredAndSortedGrants.length / grantsPerPage);
  const currentGrants = useMemo(() => {
    const start = (currentPage - 1) * grantsPerPage;
    const end = start + grantsPerPage;
    return filteredAndSortedGrants.slice(start, end);
  }, [filteredAndSortedGrants, currentPage, grantsPerPage]);

  const handleFilterChange = useCallback((key, value) => {
    const newValue = (typeof value === 'object' && value !== null && 'text' in value) ? value.text : value;
    setFilterConfig(prev => ({ ...prev, [key]: newValue }));
    setCurrentPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilterConfig({
      searchTerm: '',
      locationFilter: [],
      categoryFilter: [],
      grantTypeFilter: '',
      grantStatusFilter: '',
      sortCriteria: 'dueDate_asc'
    });
    setCurrentPage(1);
  }, []);

  const handleRemoveGrantFilter = useCallback((filterToRemove) => {
    const newConfig = { ...filterConfig };
    
    if (filterToRemove.key === 'searchTerm') {
      newConfig.searchTerm = '';
    } else if (filterToRemove.key === 'locationFilter' && Array.isArray(newConfig.locationFilter)) {
      newConfig.locationFilter = newConfig.locationFilter.filter(l => l !== filterToRemove.value);
    } else if (filterToRemove.key === 'categoryFilter' && Array.isArray(newConfig.categoryFilter)) {
      newConfig.categoryFilter = newConfig.categoryFilter.filter(c => c !== filterToRemove.value);
    } else if (filterToRemove.key === 'grantTypeFilter') {
      newConfig.grantTypeFilter = '';
    } else if (filterToRemove.key === 'grantStatusFilter') {
      newConfig.grantStatusFilter = '';
    }
    
    setFilterConfig(newConfig);
    setCurrentPage(1);
  }, [filterConfig]);

  const activeGrantFilters = useMemo(() => {
    const filters = [];
    if (filterConfig.searchTerm) filters.push({ key: 'searchTerm', label: `Search: ${filterConfig.searchTerm}` });
    if (Array.isArray(filterConfig.locationFilter)) {
      filterConfig.locationFilter.forEach(loc => filters.push({ key: 'locationFilter', label: `Location: ${loc}`, value: loc }));
    }
    if (Array.isArray(filterConfig.categoryFilter)) {
      filterConfig.categoryFilter.forEach(cat => filters.push({ key: 'categoryFilter', label: `Category: ${cat}`, value: cat }));
    }
    if (filterConfig.grantTypeFilter) filters.push({ key: 'grantTypeFilter', label: `Type: ${filterConfig.grantTypeFilter}` });
    if (filterConfig.grantStatusFilter) filters.push({ key: 'grantStatusFilter', label: `Status: ${filterConfig.grantStatusFilter}` });
    return filters;
  }, [filterConfig]);

  const uniqueCategories = useMemo(() => Array.from(new Set(allSavedGrants.flatMap(g => g.categories?.map(c => c.name) || []).filter(Boolean))).sort(), [allSavedGrants]);
  const uniqueGrantTypes = useMemo(() => Array.from(new Set(allSavedGrants.map(g => g.grantType).filter(Boolean))).sort(), [allSavedGrants]);
  const uniqueLocations = useMemo(() => Array.from(new Set(allSavedGrants.flatMap(g => g.locations?.map(l => l.name) || []).filter(Boolean))).sort(), [allSavedGrants]);

  const handleUnsaveGrant = async (grantId) => {
    const grantToUnsave = allSavedGrants.find(g => g.id === grantId);
    if (!grantToUnsave) return;
    
    try {
      const { error } = await supabase
        .from('saved_grants')
        .delete()
        .eq('id', grantToUnsave.save_id);
      
      if (error) {
        console.error('Error unsaving grant:', error);
        return;
      }
      
      // Refresh the list
      fetchSavedGrantsWorking(session.user.id);
    } catch (err) {
      console.error('Unexpected error unsaving grant:', err);
    }
  };
  
  const openDetail = useCallback((grant) => { setSelectedGrant(grant); setIsDetailModal(true); }, []);
  const closeDetail = useCallback(() => { setSelectedGrant(null); setIsDetailModal(false); }, []);
  const paginate = useCallback((page) => { if (page > 0 && page <= totalPages) setCurrentPage(page); }, [totalPages]);

  return (
    <>
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800">My Saved Grants ({allSavedGrants.length})</h2>
          <p className="text-slate-500 mt-1">Filter, sort, and manage all the grants you've bookmarked.</p>
        </div>
        
        <FilterBar
          isMobileVisible={true}
          searchTerm={filterConfig.searchTerm}
          setSearchTerm={(value) => handleFilterChange('searchTerm', value)}
          locationFilter={filterConfig.locationFilter}
          setLocationFilter={(value) => handleFilterChange('locationFilter', value)}
          categoryFilter={filterConfig.categoryFilter}
          setCategoryFilter={(value) => handleFilterChange('categoryFilter', value)}
          grantStatusFilter={filterConfig.grantStatusFilter}
          setGrantStatusFilter={(value) => handleFilterChange('grantStatusFilter', value)}
          grantTypeFilter={filterConfig.grantTypeFilter}
          setGrantTypeFilter={(value) => handleFilterChange('grantTypeFilter', value)}
          sortCriteria={filterConfig.sortCriteria}
          setSortCriteria={(value) => handleFilterChange('sortCriteria', value)}
          uniqueCategories={uniqueCategories}
          uniqueLocations={uniqueLocations}
          uniqueGrantTypes={uniqueGrantTypes}
          uniqueGrantStatuses={GRANT_STATUSES}
          pageType="grants"
          onClearFilters={handleClearFilters}
          activeFilters={activeGrantFilters}
          onRemoveFilter={handleRemoveGrantFilter}
        />

        {loading ? (
          <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-slate-200 rounded w-1/4"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-slate-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        ) : allSavedGrants.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200 text-center">
            <div className="mx-auto w-12 h-12 flex items-center justify-center bg-slate-100 rounded-full mb-4">
              <BookmarkIcon className="w-6 h-6 text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold mt-4">No Saved Grants Yet</h3>
            <p className="text-slate-500 mt-2">Start exploring and save grants to see them here.</p>
            <Link 
              to="/grants" 
              className="mt-4 inline-block px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Explore Grants
            </Link>
          </div>
        ) : currentGrants.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentGrants.map((grant) => (
              <GrantCard 
                key={grant.id} 
                grant={grant} 
                onOpenDetailModal={openDetail}
                onUnsave={() => handleUnsaveGrant(grant.id)}
                onSave={() => {}} // Empty function since these are already saved
                isSaved={true} // Always true for saved grants page
                session={session}
                showUnsaveButton={true}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200 text-center">
            <Search className="w-12 h-12 mx-auto text-slate-400 mb-4" />
            <h3 className="text-xl font-semibold text-slate-600">No grants match your current filters</h3>
            <p className="text-slate-500 mt-2 mb-4">Try adjusting your search criteria to see more results.</p>
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <XCircle size={16} className="mr-2" /> 
              Clear All Filters
            </button>
          </div>
        )}

        {totalPages > 0 && currentGrants && currentGrants.length > 0 && !loading && (
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={paginate} />
        )}
      </div>
      
      {isDetailModalOpen && selectedGrant && (
        <GrantDetailModal
          grant={selectedGrant}
          isOpen={isDetailModalOpen}
          onClose={closeDetail}
          session={session}
          isSaved={true}
          onUnsave={() => handleUnsaveGrant(selectedGrant.id)}
        />
      )}
    </>
  );
}