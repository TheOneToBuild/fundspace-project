// src/SavedGrantsPage.jsx
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

// A corrected filter function tailored for the data structure on this page.
const filterSavedGrants = (grant, filters) => {
  const { searchTerm, locationFilter, categoryFilter, grantTypeFilter, grantStatusFilter } = filters;

  // Search Logic is robust enough, no changes needed here.
  const term = (typeof searchTerm === 'string' ? searchTerm.trim() : '').toLowerCase();
  const matchesSearch = !term ||
    (grant.title || '').toLowerCase().includes(term) ||
    (grant.description || '').toLowerCase().includes(term) ||
    (grant.foundationName || '').toLowerCase().includes(term) ||
    (grant.categories && grant.categories.some(c => (c.name || '').toLowerCase().includes(term)));

  // Location Logic
  const locFilterArray = Array.isArray(locationFilter) ? locationFilter.map(l => l.toLowerCase().trim()) : [];
  const grantLocs = (grant.locations || []).map(l => (l.name || '').toLowerCase().trim());
  const matchesLocation = locFilterArray.length === 0 ||
    locFilterArray.some(filterLoc => grantLocs.includes(filterLoc));

  // Category Logic
  const categoryFilterArray = Array.isArray(categoryFilter) ? categoryFilter.map(c => c.toLowerCase().trim()) : [];
  const grantCats = (grant.categories || []).map(c => (c.name || '').toLowerCase().trim());
  const matchesCategory = categoryFilterArray.length === 0 ||
    categoryFilterArray.some(filterCat => grantCats.includes(filterCat));
    
  // Other Filters
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

  const fetchSavedGrants = useCallback(async (userId) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('saved_grants')
      .select(`id, grant_id, grants(*, funders(name, logo_url, slug), grant_categories(categories(id, name)), grant_locations(locations(id, name)))`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching saved grants:', error);
      setAllSavedGrants([]);
    } else {
      const formattedData = data.map(item => ({
        ...item.grants,
        save_id: item.id,
        foundationName: item.grants.funders?.name || 'Unknown Funder',
        funderLogoUrl: item.grants.funders?.logo_url || null,
        fundingAmount: item.grants.max_funding_amount || item.grants.funding_amount_text || 'Not specified',
        dueDate: item.grants.deadline,
        grantType: item.grants.grant_type,
        categories: item.grants.grant_categories.map(gc => gc.categories),
        locations: item.grants.grant_locations.map(gl => gl.locations),
        eligibility_criteria: item.grants.eligibility_criteria,
        save_count: item.grants.save_count
      }));
      setAllSavedGrants(formattedData);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (session) {
      fetchSavedGrants(session.user.id);
    }
  }, [session, fetchSavedGrants]);

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

  // FIX: This handler now correctly processes both simple values and search objects.
  const handleFilterChange = useCallback((key, value) => {
    // If the value is an object from the search input, extract the text.
    if (key === 'searchTerm' && typeof value === 'object' && value !== null) {
        setFilterConfig(prev => ({ ...prev, searchTerm: value.text || '' }));
    } else {
        setFilterConfig(prev => ({ ...prev, [key]: value }));
    }
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
  
  const handleRemoveGrantFilter = useCallback((keyToRemove, valueToRemove) => {
    if (Array.isArray(filterConfig[keyToRemove]) && valueToRemove) {
        handleFilterChange(keyToRemove, filterConfig[keyToRemove].filter(item => item !== valueToRemove));
    } else {
        handleFilterChange(keyToRemove, '');
    }
  }, [filterConfig, handleFilterChange]);

  const activeGrantFilters = useMemo(() => {
    let filters = [];
    if (filterConfig.searchTerm) filters.push({ key: 'searchTerm', label: `Search: "${filterConfig.searchTerm}"` });
    if (filterConfig.locationFilter.length > 0) filters.push(...filterConfig.locationFilter.map(loc => ({ key: 'locationFilter', value: loc, label: `Location: ${loc}` })));
    if (filterConfig.categoryFilter.length > 0) filters.push(...filterConfig.categoryFilter.map(cat => ({ key: 'categoryFilter', value: cat, label: `Category: ${cat}` })));
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
    await supabase.from('saved_grants').delete().eq('id', grantToUnsave.save_id);
    fetchSavedGrants(session.user.id);
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
            // FIX: Pass the correct handler for the search input
            onSuggestionSelect={(value) => handleFilterChange('searchTerm', value)}
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
          <p>Loading saved grants...</p>
        ) : allSavedGrants.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200 text-center">
            <div className="mx-auto w-12 h-12 flex items-center justify-center bg-slate-100 rounded-full mb-4"><BookmarkIcon /></div>
            <h3 className="text-xl font-semibold mt-4">No Saved Grants Yet</h3>
            <p className="text-slate-500 mt-2">Start exploring and save grants to see them here.</p>
            <Link to="/" className="mt-4 inline-block px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">Explore Grants</Link>
          </div>
        ) : currentGrants.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentGrants.map(grant => (
                <GrantCard 
                  key={grant.id} 
                  grant={grant}
                  session={session}
                  isSaved={true}
                  onSave={() => {}}
                  onUnsave={() => handleUnsaveGrant(grant.id)}
                  onOpenDetailModal={() => openDetail(grant)}
                  onFilterByCategory={(categoryName) => handleFilterChange('categoryFilter', [categoryName])}
                />
              ))}
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={paginate} />
          </>
        ) : (
           <div className="text-center text-slate-500 py-12 bg-white rounded-lg shadow-sm border border-slate-200">
              <Search size={40} className="mx-auto text-slate-400 mb-3" />
              <p className="text-lg font-medium">No saved grants match your criteria.</p>
              <p className="text-sm mb-4">Try using a broader search term or removing a filter.</p>
              <button onClick={handleClearFilters} className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-100">
                <XCircle size={16} className="mr-2" />
                Clear All Filters
              </button>
            </div>
        )}
      </div>
      {isDetailModalOpen && selectedGrant && (
        <GrantDetailModal grant={selectedGrant} isOpen={isDetailModalOpen} onClose={closeDetail} />
      )}
    </>
  );
}
