// fundspace-app/src/pages/ExplorePage.jsx
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Search, SlidersHorizontal, LayoutGrid, List, ChevronDown, XCircle, MapPin, Filter, Building } from 'lucide-react';
import ExploreGrantsTab from '../components/explore/ExploreGrantsTab.jsx';
import ExploreRequestsTab from '../components/explore/ExploreRequestsTab.jsx';
import ExploreWinsTab from '../components/explore/ExploreWinsTab.jsx';
import FilterBar from '../components/FilterBar.jsx'; 
import { supabase } from '../supabaseClient.js';

import { CATEGORIES as COMPREHENSIVE_CATEGORIES } from '../constants.js';
import Pagination from '../components/Pagination.jsx'; // This is unused in the provided code, but I'll leave it.
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

const AutocompleteInput = ({ items, selectedItems, onSelectionChange, placeholder }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Get the single selected category (first item in array, or empty string)
  const selectedItem = selectedItems?.[0] || '';

  // Filter categories based on search term
  const filteredItems = items.filter(item => {
    const name = typeof item === 'string' ? item : item.name;
    const label = typeof item === 'object' ? (item.label || item.displayName || item.name) : name;
    return label?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Handle category selection - single select only
  const handleItemSelect = (item) => {
    const itemName = typeof item === 'string' ? item : item.name;
    onSelectionChange([itemName]); // Always pass array with single item (just the name)
    setSearchTerm('');
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  // Handle clearing selection
  const handleClear = () => {
    onSelectionChange([]);
    setSearchTerm('');
    setIsOpen(false);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredItems.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : filteredItems.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredItems[highlightedIndex]) {
          handleItemSelect(filteredItems[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlighted index when filtered categories change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchTerm]);

  // Display value: show selected category or search term
  const displayValue = selectedItem && !isOpen ? selectedItem : searchTerm;
  const displayPlaceholder = selectedItem ? selectedItem : placeholder;

  return (
    <div className="flex-1 relative" ref={dropdownRef}>
      {/* Search Input */}
      <input
        ref={inputRef}
        type="text"
        value={displayValue}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setIsOpen(true);
          // Clear selection when typing
          if (selectedItem) {
            onSelectionChange([]);
          }
        }}
        onFocus={() => {
          setIsOpen(true);
          // If there's a selected category, clear it and show search
          if (selectedItem) {
            setSearchTerm('');
          }
        }}
        onKeyDown={handleKeyDown}
        placeholder={displayPlaceholder}
        className="w-full flex-1 bg-transparent outline-none text-base text-slate-800 placeholder-slate-400 font-medium truncate"
      />

      {/* Dropdown - Show categories with counts */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-xl shadow-2xl max-h-80 overflow-y-auto z-[9999] min-w-[300px]">
          {filteredItems.length > 0 ? (
            <div className="py-2">
              {filteredItems.map((item, index) => {
                const itemName = typeof item === 'string' ? item : item.name;
                const itemLabel = typeof item === 'object' ? (item.label || item.displayName || item.name) : itemName;
                const itemCount = typeof item === 'object' ? item.count : '';
                
                return (
                  <button
                    key={itemName}
                    onClick={() => handleItemSelect(item)}
                    className={`w-full text-left px-6 py-3 text-base transition-colors duration-150 flex items-center justify-between ${
                      index === highlightedIndex
                        ? 'bg-blue-500 text-white'
                        : 'hover:bg-blue-50 text-gray-900'
                    }`}
                  >
                    <span>{typeof item === 'object' ? (item.label || item.name) : item}</span>
                    {itemCount && (
                      <span className={`text-sm font-medium ${
                        index === highlightedIndex ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        ({itemCount}) 
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-6 py-4 text-base text-gray-500">
              {searchTerm ? `No results found for "${searchTerm}"` : "Start typing to search"}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState('grants');

  // State for all grants data to populate filter dropdowns
  const [allGrants, setAllGrants] = useState([]);
  const [loadingGrants, setLoadingGrants] = useState(true);

  // Common grant types for fallback
  const COMMON_GRANT_TYPES = [
    'Project/Program', 'General Operating', 'Capacity Building', 'Capital/Infrastructure',
    'Research', 'Fellowship/Scholarship', 'Emergency/Disaster Relief', 'Planning/Development',
    'Technical Assistance', 'Matching/Challenge', 'Education/Training', 'Community Development'
  ];

  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Add grant-specific filter state
  const [grantFilterConfig, setGrantFilterConfig] = useState({
    searchTerm: '',
    locationSearchTerm: '', // ADD THIS
    locationFilter: [],
    categoryFilter: [], // for grants
    grantStatusFilter: '',
    grantTypeFilter: '', // ADDED: Grant type filter
    sortCriteria: 'dueDate_asc'
  });

  // Derived unique lists for grant filters
  const uniqueGrantCategories = useMemo(() => {
    if (activeTab !== 'grants') return [];

    // Helper to check if a grant is active
    const isGrantActive = (grant) => {
      if (!grant.deadline) return true; // Rolling deadlines are active
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(grant.deadline) >= today;
    };

    // Use only categories from active grants
    const categoryCount = new Map();

    allGrants.filter(isGrantActive).forEach(grant => {
      if (grant.category_names?.length) {
        grant.category_names.forEach(categoryName => {
          if (categoryName && typeof categoryName === 'string') {
            const count = categoryCount.get(categoryName) || 0;
            categoryCount.set(categoryName, count + 1);
          }
        });
      }
    });

    return Array.from(categoryCount.entries())
      .map(([name, count]) => ({
        name,
        count,
        displayName: name // The count is now displayed separately
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [activeTab, allGrants]);

  const uniqueGrantTypes = useMemo(() => {
    const types = new Set();
    allGrants.forEach(grant => {
      if (grant.grant_type) {
        types.add(grant.grant_type);
      }
    });
    const extractedTypes = Array.from(types);
    return extractedTypes.length > 0 ? extractedTypes.sort() : COMMON_GRANT_TYPES;
  }, [allGrants]);

  const availableOrgTypesForFilter = useMemo(() => {
    const types = Array.from(new Set(organizations.map(org => org.type).filter(Boolean))).sort();
    return types.map(type => ({
      name: type,
      label: ORG_TYPE_CONFIG[type]?.label || type
    }));
  }, [organizations]);

  const uniqueGrantLocations = useMemo(() => {
    const locations = new Set();
    allGrants.forEach(grant => {
      if (grant.location_names) {
        grant.location_names.forEach(loc => locations.add(loc));
      }
      // If grants also have a single 'location' field, add it here
      // if (grant.location) locations.add(grant.location);
    });
    return Array.from(locations).sort();
  }, [allGrants]);

  // Grant statuses for the dropdown
  // This is already defined, keeping it as is.
  const grantStatuses = [
    { value: '', label: 'All Statuses' },
    { value: 'active', label: 'Active' }, // Deadline is in the future
    { value: 'closing_soon', label: 'Closing Soon' }, // Deadline within 2 weeks
    { value: 'closed', label: 'Closed' } // Deadline has passed
  ];

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
  
  // Dynamic filter config based on active tab
  const currentFilterConfig = activeTab === 'grants' ? grantFilterConfig : filterConfig;
  const setCurrentFilterConfig = activeTab === 'grants' ? setGrantFilterConfig : setFilterConfig;

  const [currentPage, setCurrentPage] = useState(1);
  const [orgsPerPage, setOrgsPerPage] = useState(12);
  const [viewMode, setViewMode] = useState('grid');
  const [filtersVisible, setFiltersVisible] = useState(false);

  const tabs = [
    { id: 'grants', label: 'Available Grants' },
    { id: 'organizations', label: 'Organizations' },
    { id: 'requests', label: 'Requests for Funds' },
    { id: 'wins', label: 'Recent Fund Wins' }
  ];

  // Fetch grants data for filter options
  useEffect(() => {
    const fetchGrantsForFilters = async () => {
      setLoadingGrants(true);
      try {
        const { data, error } = await supabase
          .from('grants')
          .select(`
            id,
            title,
            grant_type,
            deadline,
            grant_categories(
              categories(name)
            ),
            grant_locations(
              locations(name)
            )
          `)
          .limit(1000); // Increased limit to fetch more grants for filtering

        if (error) throw error;

        // Transform the data to match expected format
        const transformedData = (data || []).map(grant => ({
          ...grant,
          category_names: grant.grant_categories?.map(gc => gc.categories?.name).filter(Boolean) || [],
          location_names: grant.grant_locations?.map(gl => gl.locations?.name).filter(Boolean) || []
        }));

        setAllGrants(transformedData);
      } catch (error) {
        console.error('Error fetching grants for filters:', error);
        setAllGrants([]); // Ensure it's an array on error
      } finally {
        setLoadingGrants(false);
      }
    };
    fetchGrantsForFilters();
  }, []); // Fetch once on mount

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

  // New unified filter change handler
  const handleCurrentFilterChange = useCallback((key, value) => {
    if (activeTab === 'grants') {
      setGrantFilterConfig(prev => ({ ...prev, [key]: value }));
    } else {
      setFilterConfig(prev => ({ ...prev, [key]: value }));
    }
    setCurrentPage(1);
  }, [activeTab]);

  const handleClearFilters = useCallback(() => {
    if (activeTab === 'grants') {
      setGrantFilterConfig({ 
        searchTerm: '', 
        locationSearchTerm: '',
        locationFilter: [], 
        categoryFilter: [], 
        grantStatusFilter: '',
        grantTypeFilter: '', // ADDED: Clear grant type filter
        sortCriteria: 'dueDate_asc'
      });
    } else {
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
    }
    setCurrentPage(1);
  }, [activeTab]);

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

  const uniqueFocusAreas = useMemo(() => {
    if (activeTab !== 'organizations') return [];

    const focusAreaCount = new Map();

    organizations.forEach(org => {
      if (org.focus_areas?.length) {
        org.focus_areas.forEach(areaName => {
          if (areaName && typeof areaName === 'string') {
            const count = focusAreaCount.get(areaName) || 0;
            focusAreaCount.set(areaName, count + 1);
          }
        });
      }
    });

    return Array.from(focusAreaCount.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [activeTab, organizations]);
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

  // Dynamic content based on active tab
  const getSearchPlaceholder = () => {
    switch (activeTab) {
      case 'grants':
        return 'Search for grants';
      case 'organizations':
        return 'Search for organizations';
      default:
        return 'Search for organizations, grants, or opportunities...';
    }
  };

  const getThirdDropdownContent = () => {
    if (activeTab === 'grants') {
      return (
        <>
          <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <AutocompleteInput 
            items={uniqueGrantCategories}
            selectedItems={currentFilterConfig.categoryFilter || []}
            onSelectionChange={(categories) => handleCurrentFilterChange('categoryFilter', categories)}
            placeholder="Categories"
          />
        </>
      );
    } else {
      return (
        <>
          <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <AutocompleteInput
            items={uniqueFocusAreas}
            selectedItems={currentFilterConfig.focusAreaFilter || []}
            onSelectionChange={(areas) => handleCurrentFilterChange('focusAreaFilter', areas)}
            placeholder="Focus Areas"
          />
        </>
      );
    }
  };

  const renderTabContent = () => {
    if (activeTab !== 'organizations') {
      const searchParams = activeTab === 'grants' 
        ? { searchTerm: grantFilterConfig.searchTerm,
            locationFilter: grantFilterConfig.locationFilter,
            categoryFilter: grantFilterConfig.categoryFilter,
            grantTypeFilter: grantFilterConfig.grantTypeFilter,
            grantStatusFilter: grantFilterConfig.grantStatusFilter,
            sortCriteria: grantFilterConfig.sortCriteria }
        : { 
            searchQuery: filterConfig.searchTerm,
            locationFilter: filterConfig.locationFilter,
            focusAreaFilter: filterConfig.focusAreaFilter,
            typeFilter: filterConfig.typeFilter,
            sortCriteria: filterConfig.sortCriteria
          };
      
      switch (activeTab) {
        case 'grants':
          return (
            <ExploreGrantsTab searchParams={searchParams} />
          );
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
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl font-bold text-gray-900 text-center mb-3">
            Explore Opportunities
          </h1>
          <p className="text-lg text-gray-600 text-center mb-10">
            Discover organizations, grants, and funding opportunities that match your mission
          </p>

          {/* Search Bar - Full width */}
          <div className="w-full max-w-[95%] mx-auto relative z-10">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-visible">
              {/* Search Input Row */}
              <div className="flex items-center gap-4 px-6 py-2 border-b border-gray-200" style={{ minHeight: '56px' }}>
                {/* Main Search */}
                <div className="flex-[2] flex items-center bg-white rounded-2xl">
                  <Search className="w-5 h-5 text-gray-400 flex-shrink-0 mr-3" />
                  <EnhancedSearchInput
                    searchTerm={currentFilterConfig.searchTerm}
                    onSearchChange={val => {
                      const searchValue = typeof val === 'string' ? val : val.text;
                      handleCurrentFilterChange('searchTerm', searchValue);
                    }}
                    onSuggestionSelect={val => {
                      handleCurrentFilterChange('searchTerm', typeof val === 'string' ? val : val.text);
                      setCurrentPage(1);
                    }}
                    placeholder={getSearchPlaceholder()}
                    className="flex-1 bg-transparent outline-none text-base text-slate-800 placeholder-slate-400 font-medium tracking-wide"
                    showRecentSearches={false}
                    hideIcon={true}
                  />
                </div>

                <div className="h-6 w-px bg-slate-200" />

                {/* Location Dropdown for Grants */}
                <div className="flex-1 flex items-center gap-2 min-w-[140px]">
                  <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  {activeTab === 'grants' ? (
                    <>
                      <AutocompleteInput
                        items={uniqueGrantLocations}
                        selectedItems={currentFilterConfig.locationFilter || []}
                        onSelectionChange={(locations) => handleCurrentFilterChange('locationFilter', locations)}
                        placeholder="Location"
                      />
                    </>
                  ) : (
                    <input
                      type="text"
                      placeholder="Location"
                      className="w-full flex-1 bg-transparent outline-none text-base text-slate-800 placeholder-slate-400 font-medium truncate"
                      value={currentFilterConfig.locationSearchTerm || ''}
                      onChange={(e) => handleCurrentFilterChange('locationSearchTerm', e.target.value)}
                    />
                  )}
                </div>

                <div className="h-6 w-px bg-slate-200" />

                {/* All Types Dropdown */}
                {/* Replaced with conditional dropdown */}
                <div className="flex-1 flex items-center gap-2 min-w-[130px]">
                  <Building className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  {activeTab === 'grants' ? (
                    <AutocompleteInput
                      items={uniqueGrantTypes}
                      selectedItems={currentFilterConfig.grantTypeFilter ? [currentFilterConfig.grantTypeFilter] : []}
                      onSelectionChange={(types) => handleCurrentFilterChange('grantTypeFilter', types[0] || '')}
                      placeholder="All Types"
                    />
                  ) : (
                    <AutocompleteInput
                      items={availableOrgTypesForFilter}
                      selectedItems={currentFilterConfig.typeFilter || []}
                      onSelectionChange={(types) => handleCurrentFilterChange('typeFilter', types)}
                      placeholder="All Types"
                    />
                  )}
                </div>
                
                <div className="h-6 w-px bg-slate-200" />

                {/* Dynamic Third Dropdown - Focus Areas OR Categories */}
                <div className="flex-1 flex items-center gap-2 min-w-[130px]">
                  {getThirdDropdownContent()}
                </div>

                {activeTab === 'grants' && <div className="h-6 w-px bg-slate-200" />}
                {/* Dynamic Fourth Dropdown - All Statuses (grants only) */}
                {activeTab === 'grants' && (
                  <div className="flex-1 flex items-center gap-2 min-w-[130px]">
                    <SlidersHorizontal className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <select
                      value={currentFilterConfig.grantStatusFilter || ''}
                      onChange={(e) => handleCurrentFilterChange('grantStatusFilter', e.target.value)}
                      className="flex-1 bg-transparent outline-none text-base text-slate-800 font-medium cursor-pointer appearance-none pr-6"
                    >
                      {grantStatuses.map(status => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 -ml-5 pointer-events-none" />
                  </div>
                )}
                <div className="h-6 w-px bg-slate-200" />

                {/* Clear All Filters Button */}
                <div className="flex-shrink-0">
                  <button
                    onClick={handleClearFilters}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors duration-200"
                  >
                    <XCircle className="w-4 h-4" />
                    Clear All
                  </button>
                </div>
              </div>

              {/* Tabs Row */}
              <div className="flex gap-0 bg-gray-50 border-t border-gray-200">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 px-6 py-4 font-medium transition-all relative ${activeTab === tab.id
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
              
              <div className="flex items-center gap-3 flex-wrap justify-center md:justify-end">
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
                
                {/* Sorting Dropdown */}
                <div className="relative">
                  <select 
                    value={currentFilterConfig.sortCriteria}
                    onChange={(e) => handleCurrentFilterChange('sortCriteria', e.target.value)}
                    className="pl-4 pr-10 py-3 border border-slate-300 rounded-xl bg-white text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none shadow-sm"
                  >
                    {activeTab === 'grants' ? (
                      <>
                        <option value="title_asc">Name (A-Z)</option>
                        <option value="title_desc">Name (Z-A)</option>
                      </>
                    ) : (
                      <>
                        <option value="name_asc">Name (A-Z)</option>
                        <option value="name_desc">Name (Z-A)</option>
                      </>
                    )}
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
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8 bg-[#faf7f5]">
          <div className="max-w-[98%] mx-auto">
            {/* Header section for non-organization tabs */}
            {activeTab === 'grants' && (
              <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
                <div className="text-center md:text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 text-center sm:text-left">
                  <h2 className="text-2xl md:text-3xl font-bold">
                    <span className="text-slate-800">Available Grants </span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 font-extrabold">
                      (20)
                    </span>
                  </h2>
                    <div className="mt-2 sm:mt-0 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full border border-green-200 shadow-sm">
                        <span className="text-green-700 font-semibold">💰 $75.0M+ Available</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 flex-wrap justify-center md:justify-end">
                  <div className="relative">
                    <select 
                      value={12} 
                      onChange={(e) => console.log('Per page changed:', e.target.value)} 
                      className="pl-4 pr-10 py-3 border border-slate-300 rounded-xl bg-white text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none shadow-sm"
                    >
                      {[6, 12, 18, 24].map((n) => (<option key={n} value={n}>Show {n}</option>))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-slate-400" size={16} />
                  </div>
                  
                  {/* Sorting Dropdown */}
                  <div className="relative">
                    <select 
                      value={currentFilterConfig.sortCriteria}
                      onChange={(e) => handleCurrentFilterChange('sortCriteria', e.target.value)}
                      className="pl-4 pr-10 py-3 border border-slate-300 rounded-xl bg-white text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none shadow-sm"
                    >
                      <option value="title_asc">Name (A-Z)</option>
                      <option value="title_desc">Name (Z-A)</option>
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
            )}
            
            {renderTabContent()}
          </div>
        </div>
      )}
    </div>
  );
}