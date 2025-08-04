// src/components/portal/track-funds/TrackFundsTab.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Bookmark, 
  FileText, 
  Trophy, 
  Users, 
  User,
  Search,
  Filter,
  ChevronDown,
  XCircle,
  Heart,
  Building2
} from '../../Icons.jsx';
import TrackingGrantCard from './TrackingGrantCard.jsx';
import GrantDetailModal from '../../../GrantDetailModal.jsx';
import FilterBar from '../../FilterBar.jsx';
import Pagination from '../../Pagination.jsx';
import { useTrackingData } from './hooks/useTrackingData.js';
import { useTrackingActions } from './hooks/useTrackingActions.js';
import { GRANT_STATUSES } from '../../../constants.js';

// Filter function (moved from main component)
const filterTrackedGrants = (grant, filters) => {
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

const TrackFundsTab = ({ session, userMembership }) => {
  const [activeSection, setActiveSection] = useState('saved');
  const [selectedGrant, setSelectedGrant] = useState(null);
  const [isDetailModalOpen, setIsDetailModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter and pagination state
  const [filterConfig, setFilterConfig] = useState({
    searchTerm: '',
    locationFilter: [],
    categoryFilter: [],
    grantTypeFilter: '',
    grantStatusFilter: '',
    sortCriteria: 'dueDate_asc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [grantsPerPage, setGrantsPerPage] = useState(12);

  // Use custom hooks for data and actions
  const { 
    data, 
    loading, 
    loadSectionData, 
    loadSavedGrants, 
    loadApplications, 
    loadReceivedGrants
  } = useTrackingData(session, userMembership);
  
  const { markAsApplied, markAsReceived, removeApplication, removeAward } = useTrackingActions(
    session, 
    userMembership, 
    { 
      loadSavedGrants, 
      loadApplications, 
      loadReceivedGrants
    }
  );

  // Load data when section changes and ensure counts are updated
  useEffect(() => {
    loadSectionData(activeSection);
    // Also refresh all sections to ensure counts are accurate
    if (activeSection === 'saved') {
      setTimeout(() => {
        loadApplications();
        loadReceivedGrants();
      }, 200);
    }
  }, [activeSection, loadSectionData, loadApplications, loadReceivedGrants]);

  // Filter and pagination logic
  const currentData = data[activeSection] || [];
  
  const filteredAndSortedData = useMemo(() => {
    return currentData.filter(item => filterTrackedGrants(item, filterConfig));
  }, [currentData, filterConfig]);

  const totalPages = Math.ceil(filteredAndSortedData.length / grantsPerPage);
  const currentPageData = useMemo(() => {
    const start = (currentPage - 1) * grantsPerPage;
    const end = start + grantsPerPage;
    return filteredAndSortedData.slice(start, end);
  }, [filteredAndSortedData, currentPage, grantsPerPage]);

  // Event handlers
  const handleFilterChange = useCallback((key, value) => {
    setFilterConfig(prev => ({ ...prev, [key]: value }));
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

  const openDetail = useCallback((grant) => {
    setSelectedGrant(grant);
    setIsDetailModal(true);
  }, []);

  const closeDetail = useCallback(() => {
    setSelectedGrant(null);
    setIsDetailModal(false);
  }, []);

  const paginate = useCallback((page) => {
    if (page > 0 && page <= totalPages) setCurrentPage(page);
  }, [totalPages]);

  // Get unique values for filters
  const uniqueCategories = useMemo(() => 
    Array.from(new Set(currentData.flatMap(g => g.categories?.map(c => c.name) || []).filter(Boolean))).sort(), 
    [currentData]
  );
  const uniqueGrantTypes = useMemo(() => 
    Array.from(new Set(currentData.map(g => g.grantType).filter(Boolean))).sort(), 
    [currentData]
  );
  const uniqueLocations = useMemo(() => 
    Array.from(new Set(currentData.flatMap(g => g.locations?.map(l => l.name) || []).filter(Boolean))).sort(), 
    [currentData]
  );

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

  const filterBarProps = {
    isMobileVisible: true,
    searchTerm: filterConfig.searchTerm,
    setSearchTerm: (value) => handleFilterChange('searchTerm', value),
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
    uniqueCategories,
    uniqueLocations,
    uniqueGrantTypes,
    uniqueGrantStatuses: GRANT_STATUSES,
    pageType: "grants",
    onClearFilters: handleClearFilters,
    activeFilters: activeGrantFilters,
    onRemoveFilter: handleRemoveGrantFilter,
  };

  const sections = [
    {
      id: 'saved',
      label: 'Saved Grants',
      icon: Bookmark,
      description: 'Grants you\'ve bookmarked',
      scope: 'individual',
      color: 'blue'
    },
    {
      id: 'applications',
      label: 'Applications',
      icon: FileText,
      description: userMembership?.role && ['super_admin', 'admin'].includes(userMembership.role) 
        ? 'Organization applications' 
        : 'Your applications',
      scope: userMembership?.role && ['super_admin', 'admin'].includes(userMembership.role) ? 'organization' : 'individual',
      color: 'orange'
    },
    {
      id: 'received',
      label: 'Received',
      icon: Trophy,
      description: userMembership?.role && ['super_admin', 'admin'].includes(userMembership.role) 
        ? 'Organization awards' 
        : 'Your awards',
      scope: userMembership?.role && ['super_admin', 'admin'].includes(userMembership.role) ? 'organization' : 'individual',
      color: 'green'
    }
  ];

  return (
    <div>
      {/* Section Navigation */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-4">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            const colorClasses = {
              blue: isActive ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100',
              orange: isActive ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-700 hover:bg-orange-100',
              green: isActive ? 'bg-green-500 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'
            };
            
            return (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id);
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 ${colorClasses[section.color]}`}
              >
                <Icon size={20} />
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span>{section.label}</span>
                    <span className="text-xs px-2 py-1 bg-white/20 rounded-full">
                      {data[section.id]?.length || 0}
                    </span>
                  </div>
                  <p className="text-xs opacity-80 flex items-center gap-1">
                    {section.scope === 'organization' ? <Building2 size={12} /> : <User size={12} />}
                    {section.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">
              {sections.find(s => s.id === activeSection)?.label}
            </h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors text-sm"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
              {activeGrantFilters.length > 0 && (
                <span className="ml-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-blue-600 bg-blue-100 rounded-full">
                  {activeGrantFilters.length}
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <FilterBar {...filterBarProps} />
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Heart className="w-8 h-8 text-blue-500 animate-pulse mx-auto mb-4" />
            <p className="text-slate-700 font-medium">Loading...</p>
          </div>
        </div>
      ) : currentPageData.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {currentPageData.map((grant) => (
              <TrackingGrantCard 
                key={`${activeSection}-${grant.id}`}
                grant={grant} 
                onOpenDetailModal={openDetail}
                onMarkAsApplied={markAsApplied}
                onMarkAsReceived={markAsReceived}
                onRemoveApplication={removeApplication}
                activeSection={activeSection}
              />
            ))}
          </div>

          {totalPages > 0 && (
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={paginate} />
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <div className="bg-white/80 backdrop-blur-sm p-12 rounded-3xl border border-white/60 shadow-xl max-w-md mx-auto">
            <div className="w-20 h-20 bg-gradient-to-r from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Search size={40} className="text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">
              No {sections.find(s => s.id === activeSection)?.label.toLowerCase()} found
            </h3>
            <p className="text-slate-600 mb-6">
              {activeGrantFilters.length > 0 
                ? "Try adjusting your filters to see more results."
                : `You haven't ${activeSection === 'saved' ? 'saved any grants' : activeSection === 'applications' ? 'applied to any grants' : 'received any grants'} yet.`
              }
            </p>
            {activeGrantFilters.length > 0 ? (
              <button 
                onClick={handleClearFilters}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <XCircle size={16} className="mr-2" /> 
                Clear All Filters
              </button>
            ) : (
              <p className="text-sm text-slate-500">
                {activeSection === 'saved' && "Start exploring grants and bookmark the ones you're interested in."}
                {activeSection === 'applications' && "Grant applications will appear here once you start applying."}
                {activeSection === 'received' && "Successful grant awards will be tracked here."}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Grant Detail Modal */}
      {isDetailModalOpen && selectedGrant && (
        <GrantDetailModal
          grant={selectedGrant}
          isOpen={isDetailModalOpen}
          onClose={closeDetail}
          session={session}
          isSaved={activeSection === 'saved'}
          onSave={() => {}}
          onUnsave={() => {}}
        />
      )}
    </div>
  );
};

export default TrackFundsTab;