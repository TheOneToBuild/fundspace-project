// fundspace-app/src/pages/ExplorePage.jsx
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, SlidersHorizontal, LayoutGrid, List, ChevronDown, XCircle, MapPin, Filter, Building } from 'lucide-react';
import ExploreGrantsTab from '../components/explore/ExploreGrantsTab.jsx';
import ExploreRequestsTab from '../components/explore/ExploreRequestsTab.jsx';
import ExploreWinsTab from '../components/explore/ExploreWinsTab.jsx';
import FilterBar from '../components/FilterBar.jsx';

import Pagination from '../components/Pagination.jsx';
import OrganizationCard from '../components/OrganizationCard.jsx';
import { SearchResultsSkeleton } from '../components/SkeletonLoader.jsx';
import EnhancedSearchInput from '../components/EnhancedSearchInput.jsx';
import { getOrganizationsWithCategories } from '../utils/rpcClientFunctions';
import { filterOrganizations } from '../filtering.js';
import { sortOrganizations } from '../sorting.js';
import usePaginatedFilteredData from '../hooks/usePaginatedFilteredData.js';

const ORG_TYPE_CONFIG = {
  nonprofit: { label: 'Nonprofits', color: 'purple' },
  foundation: { label: 'Foundations', color: 'green' },
  government: { label: 'Government', color: 'blue' },
  education: { label: 'Education', color: 'indigo' },
  healthcare: { label: 'Healthcare', color: 'teal' },
  forprofit: { label: 'For-Profit', color: 'orange' },
  'for-profit': { label: 'For-Profit', color: 'orange' },
  religious: { label: 'Religious', color: 'amber' }
};

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState('organizations');
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [filterConfig, setFilterConfig] = useState({ 
    searchTerm: '', 
    typeSearchTerm: '', // Add this
    focusAreaSearchTerm: '',
    locationSearchTerm: '',
    locationFilter: [],
    focusAreaFilter: [], 
    typeFilter: [],
    sortCriteria: 'name_asc' 
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [orgsPerPage, setOrgsPerPage] = useState(12);
  const [viewMode, setViewMode] = useState('grid');
  const [filtersVisible, setFiltersVisible] = useState(false);

  const tabs = [
    { id: 'organizations', label: 'Organizations' },
    { id: 'grants', label: 'Available Grants' },
    { id: 'requests', label: 'Requests for Funds' },
    { id: 'wins', label: 'Recent Fund Wins' }
  ];

  useEffect(() => {
    const fetchOrganizations = async () => {
      setLoading(true);
      setError('');
      try {
        const result = await getOrganizationsWithCategories();
        setOrganizations(result.organizations || []);
      } catch (error) {
        console.error('Error:', error);
        setError('Failed to load organizations');
      } finally {
        setLoading(false);
      }
    };
    if (activeTab === 'organizations') {
      fetchOrganizations();
    }
  }, [activeTab]);

  const handleFilterChange = useCallback((key, value) => {
    setFilterConfig(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilterConfig({ 
      searchTerm: '', 
      locationSearchTerm: '',
      typeSearchTerm: '',
      focusAreaSearchTerm: '',
      locationFilter: [], 
      focusAreaFilter: [], 
      typeFilter: [],
      sortCriteria: 'name_asc' 
    });
    setCurrentPage(1);
  }, []);

  const handleRemoveFilter = useCallback((keyToRemove, valueToRemove = null) => {
    if (Array.isArray(filterConfig[keyToRemove]) && valueToRemove) {
      const newValues = filterConfig[keyToRemove].filter(item => item !== valueToRemove);
      handleFilterChange(keyToRemove, newValues);
    } else {
      handleFilterChange(keyToRemove, Array.isArray(filterConfig[keyToRemove]) ? [] : '');
    }
  }, [filterConfig, handleFilterChange]);

  const activeFilters = useMemo(() => {
    const filters = [];
    if (filterConfig.searchTerm) filters.push({ key: 'searchTerm', label: `Search: "${filterConfig.searchTerm}"` });
    if (filterConfig.locationSearchTerm) filters.push({ key: 'locationSearchTerm', label: `Location: "${filterConfig.locationSearchTerm}"` });
    if (filterConfig.typeSearchTerm) filters.push({ key: 'typeSearchTerm', label: `Type: "${filterConfig.typeSearchTerm}"` });
    if (filterConfig.focusAreaSearchTerm) filters.push({ key: 'focusAreaSearchTerm', label: `Focus: "${filterConfig.focusAreaSearchTerm}"` });
    filterConfig.locationFilter.forEach(loc => filters.push({ key: 'locationFilter', value: loc, label: `Location: ${loc}` }));
    filterConfig.focusAreaFilter.forEach(area => filters.push({ key: 'focusAreaFilter', value: area, label: `Focus: ${area}` }));
    filterConfig.typeFilter.forEach(type => {
      const typeConfig = ORG_TYPE_CONFIG[type];
      filters.push({ key: 'typeFilter', value: type, label: `Type: ${typeConfig?.label || type}` });
    });
    return filters;
  }, [filterConfig]);

  const uniqueFocusAreas = useMemo(() => Array.from(new Set(organizations.flatMap(org => org.focus_areas || []))).sort(), [organizations]);
  const uniqueLocations = useMemo(() => Array.from(new Set(organizations.map(org => org.location).filter(Boolean))).sort(), [organizations]);
  const availableTypes = useMemo(() => Array.from(new Set(organizations.map(org => org.type).filter(Boolean))).sort(), [organizations]);

  const { paginatedItems: currentOrganizations, totalPages, totalFilteredItems } = usePaginatedFilteredData(
    organizations, 
    filterConfig, 
    filterOrganizations, 
    filterConfig.sortCriteria, 
    sortOrganizations, 
    currentPage, 
    orgsPerPage
  );

  const paginate = useCallback((pageNumber) => {
    if (pageNumber < 1 || (totalPages > 0 && pageNumber > totalPages)) return;
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [totalPages]);

  const renderTabContent = () => {
    if (activeTab !== 'organizations') {
      const searchParams = { 
        searchQuery: filterConfig.searchTerm,
        locationFilter: filterConfig.locationFilter,
        focusAreaFilter: filterConfig.focusAreaFilter,
        typeFilter: filterConfig.typeFilter,
        sortCriteria: filterConfig.sortCriteria
      };
      
      switch (activeTab) {
        case 'grants':
          return <ExploreGrantsTab searchParams={searchParams} />;
        case 'requests':
          return <ExploreRequestsTab searchParams={searchParams} />;
        case 'wins':
          return <ExploreWinsTab searchParams={searchParams} />;
        default:
          return null;
      }
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#faf7f4]">
      <div className="bg-[#faf7f4] pt-12 pb-8">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-4xl font-bold text-gray-900 text-center mb-3">
            Explore Funding Opportunities
          </h1>
          <p className="text-lg text-gray-600 text-center mb-10">
            Discover organizations, grants, and funding opportunities that match your mission
          </p>

          {/* Search Bar - Full width */}
          <div className="w-full max-w-[95%] mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
              {/* Search Input Row - Reduced height even more */}
              <div className="flex items-center gap-4 px-6 py-2 border-b border-gray-200" style={{ minHeight: '56px' }}>
                {/* Main Search - takes up more space */}
                <div className="flex-[2] flex items-center bg-white rounded-2xl">
                  <Search className="w-5 h-5 text-gray-400 flex-shrink-0 mr-3" />
                  <EnhancedSearchInput
                    searchTerm={filterConfig.searchTerm}
                    onSearchChange={val => {
                      handleFilterChange('searchTerm', typeof val === 'string' ? val : val.text);
                    }}
                    onSuggestionSelect={val => {
                      handleFilterChange('searchTerm', typeof val === 'string' ? val : val.text);
                      setCurrentPage(1);
                    }}
                    placeholder="Search for organizations, grants, or opportunities..."
                    className="flex-1 bg-transparent outline-none text-base text-slate-800 placeholder-slate-400 font-medium tracking-wide"
                    showRecentSearches={false}
                    hideIcon={true}
                  />
                </div>

                <div className="h-6 w-px bg-slate-200" />

                {/* Location - next to search */}
                <div className="flex-1 flex items-center gap-2 min-w-[140px]">
                  <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Location"
                    className="flex-1 bg-transparent outline-none text-base text-slate-800 placeholder-slate-400 font-medium"
                    value={filterConfig.locationSearchTerm}
                    onChange={(e) => handleFilterChange('locationSearchTerm', e.target.value)}
                  />
                </div>

                <div className="h-6 w-px bg-slate-200" />

                {/* All Types Dropdown */}
                <div className="flex-1 flex items-center gap-2 min-w-[130px]">
                  <Building className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <select
                    value={filterConfig.typeFilter[0] || ''}
                    onChange={(e) => handleFilterChange('typeFilter', e.target.value ? [e.target.value] : [])}
                    className="flex-1 bg-transparent outline-none text-base text-slate-800 font-medium cursor-pointer appearance-none pr-6"
                  >
                    <option value="">All Types</option>
                    {availableTypes.map(type => (
                      <option key={type} value={type}>
                        {ORG_TYPE_CONFIG[type]?.label || type}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 -ml-5 pointer-events-none" />
                </div>

                <div className="h-6 w-px bg-slate-200" />

                {/* Focus Areas Dropdown */}
                <div className="flex-1 flex items-center gap-2 min-w-[130px]">
                  <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <select
                    value={filterConfig.focusAreaFilter[0] || ''}
                    onChange={(e) => handleFilterChange('focusAreaFilter', e.target.value ? [e.target.value] : [])}
                    className="flex-1 bg-transparent outline-none text-base text-slate-800 font-medium cursor-pointer appearance-none pr-6"
                  >
                    <option value="">Focus Areas</option>
                    {uniqueFocusAreas.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 -ml-5 pointer-events-none" />
                </div>

                <div className="h-6 w-px bg-slate-200" />

                {/* Sort Dropdown */}
                <div className="flex-1 flex items-center gap-2 min-w-[130px]">
                  <SlidersHorizontal className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <select
                    value={filterConfig.sortCriteria}
                    onChange={(e) => handleFilterChange('sortCriteria', e.target.value)}
                    className="flex-1 bg-transparent outline-none text-base text-slate-800 font-medium cursor-pointer appearance-none pr-6"
                  >
                    <option value="name_asc">Name (A-Z)</option>
                    <option value="name_desc">Name (Z-A)</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 -ml-5 pointer-events-none" />
                </div>
              </div>

              {/* Tabs Row */}
              <div className="flex gap-0 bg-gray-50 border-t border-gray-200">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 px-6 py-4 font-medium transition-all relative ${
                      activeTab === tab.id
                        ? 'text-gray-900 bg-white'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {tab.label}
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Organizations Content */}
      {activeTab === 'organizations' && (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8 bg-[#faf7f5]">
          <div className="max-w-[98%] mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
              <div className="text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">
                  <span className="text-slate-800">Organizations </span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 font-extrabold">
                    ({totalFilteredItems})
                  </span>
                </h2>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <select 
                    value={orgsPerPage} 
                    onChange={(e) => setOrgsPerPage(Number(e.target.value))} 
                    className="pl-4 pr-10 py-3 border border-slate-300 rounded-xl bg-white text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none shadow-sm"
                  >
                    {[6, 12, 18, 24].map((n) => (<option key={n} value={n}>Show {n}</option>))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-slate-400" size={16} />
                </div>
                
                <div className="flex items-center bg-white rounded-xl border border-slate-300 p-1 shadow-sm">
                  <button 
                    onClick={() => setViewMode('grid')} 
                    className={`p-2.5 rounded-lg transition-all duration-300 flex items-center gap-2 ${viewMode === 'grid' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}
                  >
                    <LayoutGrid size={18}/>
                    <span className="hidden sm:inline text-sm font-medium">Grid</span>
                  </button>
                  <button 
                    onClick={() => setViewMode('list')} 
                    className={`p-2.5 rounded-lg transition-all duration-300 flex items-center gap-2 ${viewMode === 'list' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}
                  >
                    <List size={18}/>
                    <span className="hidden sm:inline text-sm font-medium">List</span>
                  </button>
                </div>
              </div>
            </div>

            {loading ? ( 
              <SearchResultsSkeleton count={orgsPerPage} type="organization" /> 
            ) : currentOrganizations.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {currentOrganizations.map((organization) => (
                    <OrganizationCard 
                      key={organization.id} 
                      organization={organization} 
                      handleFilterChange={handleFilterChange} 
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <div className="bg-white/80 backdrop-blur-sm p-12 rounded-3xl border border-white/60 shadow-xl max-w-md mx-auto">
                  <h3 className="text-2xl font-bold text-slate-800 mb-3">No organizations found</h3>
                  <p className="text-slate-600 mb-6">Try using a broader search term or removing a filter.</p>
                  <button 
                    onClick={handleClearFilters} 
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg"
                  >
                    <XCircle size={16} className="mr-2" /> 
                    Clear All Filters
                  </button>
                </div>
              </div>
            )}
            
            {totalPages > 1 && (
              <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                onPageChange={paginate} 
              />
            )}
          </div>
        </div>
      )}

      {/* Other Tabs Content */}
      {activeTab !== 'organizations' && (
        <div className="w-full px-6 py-8">
          {renderTabContent()}
        </div>
      )}
    </div>
  );
}