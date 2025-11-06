import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'; 
import { Search, SlidersHorizontal, LayoutGrid, List, ChevronDown, XCircle, MapPin, Filter, Building } from 'lucide-react';
import ExploreRequestsTab from '../components/explore/ExploreRequestsTab.jsx';
import ExploreGrantsTab from '../components/explore/ExploreGrantsTab.jsx';
import ExploreWinsTab from '../components/explore/ExploreWinsTab.jsx';
import FilterBar from '../components/FilterBar.jsx'; 
import { supabase } from '../supabaseClient.js';
import { CATEGORIES as COMPREHENSIVE_CATEGORIES } from '../constants.js';
import Pagination from '../components/Pagination.jsx';
import OrganizationCard from '../components/OrganizationCard.jsx';
import AnimatedCounter from '../components/AnimatedCounter.jsx';
import { SearchResultsSkeleton } from '../components/SkeletonLoader.jsx';
import EnhancedSearchInput from '../components/EnhancedSearchInput.jsx';
import { getOrganizationsWithCategories, getGrantsWithCategories } from '../utils/rpcClientFunctions';
import { filterOrganizations, filterGrantsWithTaxonomy } from '../filtering.js';
import { sortOrganizations } from '../sorting.js';
import usePaginatedFilteredData from '../hooks/usePaginatedFilteredData.js';
import { useNavigate as useRouterNavigate, useSearchParams } from 'react-router-dom';
import { parseMaxFundingAmount } from '../utils.js';

const isGrantActive = (grant) => {
    if (!grant.dueDate) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(grant.dueDate) >= today;
};

const getSortableFundingAmount = (grant) => {
  if (typeof grant.max_funding_amount === 'number') {
    return grant.max_funding_amount;
  }
  return parseMaxFundingAmount(grant.funding_amount_text || '0');
};

const sortGrants = (grants, sort) => [...grants].sort((a,b)=>{
  const aAct = isGrantActive(a), bAct = isGrantActive(b);
  if (aAct !== bAct) return aAct ? -1 : 1;
  const dateOrMax = (g) => g.dueDate ? new Date(g.dueDate) : new Date('9999-12-31');

  switch (sort){
    case 'dueDate_asc': return dateOrMax(a) - dateOrMax(b);
    case 'amount_desc': return getSortableFundingAmount(b) - getSortableFundingAmount(a);
    case 'amount_asc': return getSortableFundingAmount(a) - getSortableFundingAmount(b);
    default: return 0;
  }
});

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

  const selectedItem = selectedItems?.[0] || '';

  const filteredItems = items.filter(item => {
    const name = typeof item === 'string' ? item : item.name;
    const label = typeof item === 'object' ? (item.label || item.displayName || item.name) : name;
    return label?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleItemSelect = (item) => {
    const itemName = typeof item === 'string' ? item : item.name;
    onSelectionChange([itemName]);
    setSearchTerm('');
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleClear = () => {
    onSelectionChange([]);
    setSearchTerm('');
    setIsOpen(false);
  };
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

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchTerm]);

  const displayValue = selectedItem && !isOpen ? selectedItem : searchTerm;
  const displayPlaceholder = selectedItem ? selectedItem : placeholder;

  return (
    <div className="flex-1 relative" ref={dropdownRef}>
      <input
        ref={inputRef}
        type="text"
        value={displayValue}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setIsOpen(true);
          if (selectedItem) {
            onSelectionChange([]);
          }
        }}
        onFocus={() => {
          setIsOpen(true);
          if (selectedItem) {
            setSearchTerm('');
          }
        }}
        onKeyDown={handleKeyDown}
        placeholder={displayPlaceholder}
        className="w-full flex-1 bg-transparent outline-none text-base text-slate-800 placeholder-slate-400 font-medium truncate"
      />

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
  const navigate = useRouterNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'grants';
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const [allGrants, setAllGrants] = useState([]);
  const [loadingGrants, setLoadingGrants] = useState(true);

  const [fetchedGrantCategories, setFetchedGrantCategories] = useState([]);

  const COMMON_GRANT_TYPES = [
    'Project/Program', 'General Operating', 'Capacity Building', 'Capital/Infrastructure',
    'Research', 'Fellowship/Scholarship', 'Emergency/Disaster Relief', 'Planning/Development',
    'Technical Assistance', 'Matching/Challenge', 'Education/Training', 'Community Development'
  ];

  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [grantFilterConfig, setGrantFilterConfig] = useState({
    searchTerm: '',
    locationSearchTerm: '',
    locationFilter: [],
    categoryFilter: [],
    grantStatusFilter: 'active',
    grantTypeFilter: '',
    sortCriteria: 'dueDate_asc'
  });

  const [filterConfig, setFilterConfig] = useState({ 
    searchTerm: '',
    typeSearchTerm: '',
    focusAreaSearchTerm: '',
    locationSearchTerm: '',
    locationFilter: [],
    focusAreaFilter: [], 
    typeFilter: [],
    sortCriteria: 'name_asc' 
  });

  useEffect(() => {
    const fetchGrantCategories = async () => {
      try {
        const { getAvailableGrantCategories } = await import('../utils/rpcClientFunctions.js');
        const categories = await getAvailableGrantCategories();
        setFetchedGrantCategories(categories || []);
      } catch (error) {
        console.error('Error fetching grant categories:', error);
        setFetchedGrantCategories([]);
      }
    };
    
    if (activeTab === 'grants') {
      fetchGrantCategories();
    }
  }, [activeTab]);

  const uniqueGrantCategories = useMemo(() => {
    if (activeTab !== 'grants') return [];
  
    const filteredGrants = allGrants.filter(grant => {
      if (grantFilterConfig.grantStatusFilter === 'closing_soon') {
        if (!grant.deadline) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(grant.deadline);
        const closingSoon = new Date(today);
        closingSoon.setDate(today.getDate() + 14);
        if (!(dueDate >= today && dueDate <= closingSoon)) return false;
      } else if (grantFilterConfig.grantStatusFilter === 'closed') {
        if (!grant.deadline) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (new Date(grant.deadline) >= today) return false;
      } else {
        if (grant.deadline) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (new Date(grant.deadline) < today) return false;
        }
      }
  
      if (grantFilterConfig.locationFilter?.length > 0) {
        const hasMatchingLocation = grant.locations?.some(loc =>
          grantFilterConfig.locationFilter.includes(loc.name)
        );
        if (!hasMatchingLocation) return false;
      }
  
      if (grantFilterConfig.grantTypeFilter) {
        if (grant.grant_type !== grantFilterConfig.grantTypeFilter) return false;
      }
  
      if (grantFilterConfig.searchTerm) {
        const searchLower = grantFilterConfig.searchTerm.toLowerCase();
        const matchesSearch = 
          grant.title?.toLowerCase().includes(searchLower) ||
          grant.foundationName?.toLowerCase().includes(searchLower) ||
          grant.description?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
  
      return true;
    });
  
    const categoryCount = new Map();
    
    filteredGrants.forEach(grant => {
      if (grant.categories?.length) {
        grant.categories.forEach(category => {
          if (category.name) {
            const count = categoryCount.get(category.name) || 0;
            categoryCount.set(category.name, count + 1);
          }
        });
      }
    });

    return Array.from(categoryCount.entries())
      .map(([name, count]) => ({
        name,
        count,
        displayName: `${name} (${count})`
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

  }, [activeTab, allGrants, grantFilterConfig.grantStatusFilter, grantFilterConfig.locationFilter, grantFilterConfig.grantTypeFilter, grantFilterConfig.searchTerm]);

  const uniqueGrantTypes = useMemo(() => {
    if (activeTab !== 'grants') return [];
  
    const filteredGrants = allGrants.filter(grant => {
      if (grantFilterConfig.grantStatusFilter === 'closing_soon') {
        if (!grant.deadline) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(grant.deadline);
        const closingSoon = new Date(today);
        closingSoon.setDate(today.getDate() + 14);
        if (!(dueDate >= today && dueDate <= closingSoon)) return false;
      } else if (grantFilterConfig.grantStatusFilter === 'closed') {
        if (!grant.deadline) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (new Date(grant.deadline) >= today) return false;
      } else {
        if (grant.deadline) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (new Date(grant.deadline) < today) return false;
        }
      }
  
      if (grantFilterConfig.locationFilter?.length > 0) {
        const hasMatchingLocation = grant.locations?.some(loc =>
          grantFilterConfig.locationFilter.includes(loc.name)
        );
        if (!hasMatchingLocation) return false;
      }
  
      if (grantFilterConfig.categoryFilter?.length > 0) {
        const hasMatchingCategory = grant.categories?.some(cat =>
          grantFilterConfig.categoryFilter.includes(cat.name)
        );
        if (!hasMatchingCategory) return false;
      }
  
      if (grantFilterConfig.searchTerm) {
        const searchLower = grantFilterConfig.searchTerm.toLowerCase();
        const matchesSearch = 
          grant.title?.toLowerCase().includes(searchLower) ||
          grant.foundationName?.toLowerCase().includes(searchLower) ||
          grant.description?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
  
      return true;
    });
  
    const typeCount = new Map();
    
    filteredGrants.forEach(grant => {
      if (grant.grant_type) {
        const count = typeCount.get(grant.grant_type) || 0;
        typeCount.set(grant.grant_type, count + 1);
      }
    });
  
    return Array.from(typeCount.entries())
      .map(([name, count]) => ({
        name,
        count,
        displayName: `${name} (${count})`
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  
  }, [activeTab, allGrants, grantFilterConfig.grantStatusFilter, grantFilterConfig.locationFilter, grantFilterConfig.categoryFilter, grantFilterConfig.searchTerm]);

  const availableOrgTypesForFilter = useMemo(() => {
    if (activeTab !== 'organizations') return [];

    const filteredOrgs = organizations.filter(org => {
      if (filterConfig.searchTerm) {
        const searchLower = filterConfig.searchTerm.toLowerCase();
        const matchesSearch = 
          org.name?.toLowerCase().includes(searchLower) ||
          org.description?.toLowerCase().includes(searchLower) ||
          (org.focus_areas && org.focus_areas.some(area => area.toLowerCase().includes(searchLower)));
        if (!matchesSearch) return false;
      }

      if (filterConfig.locationFilter?.length > 0) {
        const hasMatchingCounty = filterConfig.locationFilter.some(loc =>
          org.county?.toLowerCase().includes(loc.toLowerCase())
        );
        if (!hasMatchingCounty) return false;
      }

      if (filterConfig.focusAreaFilter?.length > 0) {
        const hasMatchingFocusArea = org.focus_areas?.some(area =>
          filterConfig.focusAreaFilter.includes(area)
        );
        if (!hasMatchingFocusArea) return false;
      }

      return true;
    });

    const typeCount = new Map();
    
    filteredOrgs.forEach(org => {
      if (org.type) {
        const count = typeCount.get(org.type) || 0;
        typeCount.set(org.type, count + 1);
      }
    });

    return Array.from(typeCount.entries())
      .map(([name, count]) => ({
        name,
        count,
        displayName: `${ORG_TYPE_CONFIG[name]?.label || name} (${count})`,
        label: ORG_TYPE_CONFIG[name]?.label || name
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [activeTab, organizations, filterConfig.searchTerm, filterConfig.locationFilter, filterConfig.focusAreaFilter]);

  const uniqueGrantLocations = useMemo(() => {
    if (activeTab !== 'grants') return [];
  
    const filteredGrants = allGrants.filter(grant => {
      if (grantFilterConfig.grantStatusFilter === 'closing_soon') {
        if (!grant.deadline) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(grant.deadline);
        const closingSoon = new Date(today);
        closingSoon.setDate(today.getDate() + 14);
        if (!(dueDate >= today && dueDate <= closingSoon)) return false;
      } else if (grantFilterConfig.grantStatusFilter === 'closed') {
        if (!grant.deadline) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (new Date(grant.deadline) >= today) return false;
      } else {
        if (grant.deadline) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (new Date(grant.deadline) < today) return false;
        }
      }
  
      if (grantFilterConfig.categoryFilter?.length > 0) {
        const hasMatchingCategory = grant.categories?.some(cat =>
          grantFilterConfig.categoryFilter.includes(cat.name)
        );
        if (!hasMatchingCategory) return false;
      }
  
      if (grantFilterConfig.searchTerm) {
        const searchLower = grantFilterConfig.searchTerm.toLowerCase();
        const matchesSearch = 
          grant.title?.toLowerCase().includes(searchLower) ||
          grant.foundationName?.toLowerCase().includes(searchLower) ||
          grant.description?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
  
      if (grantFilterConfig.grantTypeFilter) {
        if (grant.grant_type !== grantFilterConfig.grantTypeFilter) return false;
      }
  
      return true;
    });
  
    const locationCount = new Map();
    filteredGrants.forEach(grant => {
      if (grant.locations?.length) {
        grant.locations.forEach(location => {
          if (location.name) {
            const count = locationCount.get(location.name) || 0;
            locationCount.set(location.name, count + 1);
          }
        });
      }
    });
  
    return Array.from(locationCount.entries())
      .map(([name, count]) => ({
        name,
        count,
        displayName: `${name} (${count})`
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  
  }, [activeTab, allGrants, grantFilterConfig.grantStatusFilter, grantFilterConfig.categoryFilter, grantFilterConfig.searchTerm, grantFilterConfig.grantTypeFilter]);

  const grantStatuses = [
    { value: '', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'closing_soon', label: 'Closing Soon' },
    { value: 'closed', label: 'Closed' }
  ];

  const currentFilterConfig = activeTab === 'grants' ? grantFilterConfig : filterConfig;
  const setCurrentFilterConfig = activeTab === 'grants' ? setGrantFilterConfig : setFilterConfig;

  const [currentPage, setCurrentPage] = useState(1);
  const [orgsPerPage, setOrgsPerPage] = useState(12);
  const [viewMode, setViewMode] = useState('grid');
  const [grantsPerPage, setGrantsPerPage] = useState(12);
  const [filtersVisible, setFiltersVisible] = useState(false);

  const tabs = [
    { id: 'grants', label: 'Available Grants' },
    { id: 'organizations', label: 'Organizations' },
    { id: 'requests', label: 'Requests for Funds', comingSoon: true },
    { id: 'wins', label: 'Recent Fund Wins', comingSoon: true }
  ];

  useEffect(() => {
    const fetchGrantsData = async () => {
      setLoadingGrants(true);
      try {
        const grantsResult = await getGrantsWithCategories();
        const grantsData = grantsResult.grants || [];

        grantsData.forEach(grant => {
          grant.save_count = 0;
        });

        setAllGrants(grantsData);
      } catch (error) {
        console.error('Error fetching grants for filters:', error);
        setAllGrants([]); // Ensure it's an array on error
      } finally {
        setLoadingGrants(false);
      }
    };
    fetchGrantsData();
  }, []);

  useEffect(() => {
    const fetchOrganizations = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_organizations_with_categories');
        if (error) throw error;
        
        setOrganizations(data || []);
      } catch (error) {
        console.error('Error fetching organizations:', error);
        try {
          const { data: orgsData, error: orgsError } = await supabase
            .from('organizations')
            .select(`
              id, name, description, location, county, type,
              organization_categories(categories(name))
            `)
            .order('name');
            
          if (orgsError) throw orgsError;
          
          const transformedData = orgsData.map(org => ({
            ...org,
            focus_areas: org.organization_categories?.map(oc => oc.categories?.name).filter(Boolean) || []
          }));
          
          setOrganizations(transformedData);
        } catch (fallbackError) {
          console.error('Fallback failed:', fallbackError);
          setError('Failed to load organizations');
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (activeTab === 'organizations') {
      fetchOrganizations();
    }
  }, [activeTab]);

  const handleSearchChange = useCallback((value) => {
    if (activeTab === 'grants') {
      setGrantFilterConfig(prev => ({
        ...prev,
        searchTerm: value
      }));
    } else {
      setFilterConfig(prev => ({
        ...prev,
        searchTerm: value
      }));
    }
  }, [activeTab]);

  const handleClearFilters = useCallback(() => {
    if (activeTab === 'grants') {
      setGrantFilterConfig({
        searchTerm: '',
        locationFilter: [],
        categoryFilter: [],
        grantStatusFilter: 'active',
        grantTypeFilter: '',
        sortCriteria: 'dueDate_asc'
      });
    } else {
      setFilterConfig({
        searchTerm: '',
        locationFilter: [],
        focusAreaFilter: [],
        typeFilter: [],
        sortCriteria: 'name_asc'
      });
    }
    setCurrentPage(1);
  }, [activeTab]);

  const handleCurrentFilterChange = useCallback((key, value) => {
    if (activeTab === 'grants') {
      setGrantFilterConfig(prev => ({ ...prev, [key]: value }));
    } else {
      setFilterConfig(prev => ({ ...prev, [key]: value }));
    }
    setCurrentPage(1);
  }, [activeTab]);

  const handleRemoveFilter = useCallback((keyToRemove, valueToRemove = null) => {
    if (Array.isArray(filterConfig[keyToRemove]) && valueToRemove) {
      const newValues = filterConfig[keyToRemove].filter(item => item !== valueToRemove);
      handleCurrentFilterChange(keyToRemove, newValues);
    } else {
      handleCurrentFilterChange(keyToRemove, Array.isArray(filterConfig[keyToRemove]) ? [] : '');
    }
  }, [filterConfig, handleCurrentFilterChange]);

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

  const filteredOrgs = organizations.filter(org => {
    if (filterConfig.searchTerm) {
      const searchLower = filterConfig.searchTerm.toLowerCase();
      const matchesSearch = 
        org.name?.toLowerCase().includes(searchLower) ||
        org.description?.toLowerCase().includes(searchLower) ||
        (org.focus_areas && org.focus_areas.some(area => area.toLowerCase().includes(searchLower)));
      if (!matchesSearch) return false;
    }

    if (filterConfig.locationFilter?.length > 0) {
      const hasMatchingCounty = filterConfig.locationFilter.some(loc =>
        org.county?.toLowerCase().includes(loc.toLowerCase())
      );
      if (!hasMatchingCounty) return false;
    }

    if (filterConfig.typeFilter?.length > 0) {
      const hasMatchingType = filterConfig.typeFilter.includes(org.type);
      if (!hasMatchingType) return false;
    }

    return true;
  });

  const focusAreaCount = new Map();
  
  filteredOrgs.forEach(org => {
    if (org.focus_areas?.length) {
      org.focus_areas.forEach(area => {
        if (area) {
          const count = focusAreaCount.get(area) || 0;
          focusAreaCount.set(area, count + 1);
        }
      });
    }
  });

  return Array.from(focusAreaCount.entries())
    .map(([name, count]) => ({
      name,
      count,
      displayName: `${name} (${count})`
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

}, [organizations, filterConfig.searchTerm, filterConfig.locationFilter, filterConfig.typeFilter]);
  const uniqueLocations = useMemo(() => {
    if (activeTab !== 'organizations') return [];
  
    const filteredOrgs = organizations.filter(org => {
      if (filterConfig.searchTerm) {
        const searchLower = filterConfig.searchTerm.toLowerCase();
        const matchesSearch = 
          org.name?.toLowerCase().includes(searchLower) ||
          org.description?.toLowerCase().includes(searchLower) ||
          (org.focus_areas && org.focus_areas.some(area => area.toLowerCase().includes(searchLower)));
        if (!matchesSearch) return false;
      }
  
      if (filterConfig.focusAreaFilter?.length > 0) {
        const hasMatchingFocusArea = org.focus_areas?.some(area =>
          filterConfig.focusAreaFilter.includes(area)
        );
        if (!hasMatchingFocusArea) return false;
      }
  
      if (filterConfig.typeFilter?.length > 0) {
        const hasMatchingType = filterConfig.typeFilter.includes(org.type);
        if (!hasMatchingType) return false;
      }
  
      return true;
    });
  
    const locationCount = new Map();
    
    filteredOrgs.forEach(org => {
      if (org.county) {
        const count = locationCount.get(org.county) || 0;
        locationCount.set(org.county, count + 1);
      }
    });
  
    return Array.from(locationCount.entries())
      .map(([name, count]) => ({
        name,
        count,
        displayName: `${name} (${count})`
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  
  }, [organizations, filterConfig.searchTerm, filterConfig.focusAreaFilter, filterConfig.typeFilter]);
  const availableTypes = useMemo(() => Array.from(new Set(organizations.map(org => org.type).filter(Boolean))).sort(), [organizations]);

  const { paginatedItems: currentOrganizations, totalPages, totalFilteredItems } = usePaginatedFilteredData(
    organizations, 
    currentFilterConfig, 
    filterOrganizations, 
    currentFilterConfig.sortCriteria, 
    sortOrganizations, 
    currentPage, 
    orgsPerPage
  );

  const { paginatedItems: currentGrants, totalPages: totalGrantPages, totalFilteredItems: totalFilteredGrants, filteredAndSortedItems: allFilteredGrants } = usePaginatedFilteredData(
    allGrants,
    currentFilterConfig,
    filterGrantsWithTaxonomy,
    currentFilterConfig.sortCriteria,
    sortGrants,
    currentPage,
    grantsPerPage
  );

  const totalFilteredFunding = useMemo(() => {
    if (!allFilteredGrants || allFilteredGrants.length === 0) return 0;
    
    return allFilteredGrants.reduce((sum, grant) => {
      if (grant.max_funding_amount) {
        return sum + grant.max_funding_amount;
      }
      if (grant.funding_amount_text) {
        const cleanText = grant.funding_amount_text.toLowerCase().replace(/[$,\s]/g, '');
        const mMatch = cleanText.match(/(\d+(?:\.\d+)?)\s*m/);
        if (mMatch) return sum + (parseFloat(mMatch[1]) * 1000000);
        const kMatch = cleanText.match(/(\d+(?:\.\d+)?)\s*k/);
        if (kMatch) return sum + (parseFloat(kMatch[1]) * 1000);
        const numMatch = cleanText.match(/(\d+)/);
        if (numMatch) return sum + parseFloat(numMatch[1]);
      }
      return sum;
    }, 0);
  }, [allFilteredGrants]);

  const paginate = useCallback((pageNumber) => {
    if (pageNumber < 1 || (totalPages > 0 && pageNumber > totalPages)) return;
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [totalPages]);

  const formatCurrency = (amount) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M+`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K+`;
    return `$${amount.toLocaleString()}`;
  };


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

  const getSecondDropdownContent = () => {
    if (activeTab === 'grants') {
      return (
        <>
          <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <AutocompleteInput 
            items={uniqueGrantLocations}
            selectedItems={currentFilterConfig.locationFilter || []}
            onSelectionChange={(locations) => handleCurrentFilterChange('locationFilter', locations)}
            placeholder="Location"
          />
        </>
      );
    } else {
      return (
        <>
          <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <AutocompleteInput
            items={uniqueLocations}
            selectedItems={currentFilterConfig.locationFilter || []}
            onSelectionChange={(locations) => handleCurrentFilterChange('locationFilter', locations)}
            placeholder="Location"
          />
        </>
      );
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
    if (activeTab === 'grants' || activeTab === 'requests' || activeTab === 'wins') {
      const searchParams = activeTab === 'grants' 
        ? { 
            searchTerm: grantFilterConfig.searchTerm,
            locationFilter: grantFilterConfig.locationFilter,
            categoryFilter: grantFilterConfig.categoryFilter,
            grantTypeFilter: grantFilterConfig.grantTypeFilter,
            grantStatusFilter: grantFilterConfig.grantStatusFilter,
            sortCriteria: grantFilterConfig.sortCriteria,
            onFilterChange: handleCurrentFilterChange,
            uniqueGrantCategories: uniqueGrantCategories,
            uniqueGrantLocations: uniqueGrantLocations,
            uniqueGrantTypes: uniqueGrantTypes,
            allGrants: allGrants
          }
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
            <ExploreGrantsTab 
              searchParams={{
                ...grantFilterConfig,
                onFilterChange: handleCurrentFilterChange,
                uniqueGrantCategories,
                uniqueGrantLocations,
                uniqueGrantTypes,
                allGrants,
                viewMode: viewMode
              }}
            />
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
            Explore Community
          </h1>
          <p className="text-lg text-gray-600 text-center mb-10">
            Discover organizations, grants, and funding opportunities that match your mission
          </p>

          <div className="w-full max-w-[95%] mx-auto relative z-10">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-visible">
              <div className="flex items-center gap-4 px-6 py-2 border-b border-gray-200" style={{ minHeight: '56px' }}>
                <div className="flex-[2] flex items-center bg-white rounded-2xl">
                  <Search className="w-5 h-5 text-gray-400 flex-shrink-0 mr-3" />
                  <EnhancedSearchInput
                    searchTerm={currentFilterConfig.searchTerm || ''}
                    onSearchChange={(value) => handleSearchChange(value)}
                    onSuggestionSelect={(val) => handleSearchChange(typeof val === 'string' ? val : val.text)} placeholder={getSearchPlaceholder()} className="flex-1 bg-transparent outline-none text-base text-slate-800 placeholder-slate-400 font-medium tracking-wide" showRecentSearches={false} hideIcon={true} />
                </div>

                <div className="h-6 w-px bg-slate-200" />

                <div className="flex-1 flex items-center gap-2 min-w-[140px]">
                  {getSecondDropdownContent()}
                </div>

                <div className="h-6 w-px bg-slate-200" />

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

                <div className="flex-1 flex items-center gap-2 min-w-[130px]">
                  {getThirdDropdownContent()}
                </div>

                {activeTab === 'grants' && <div className="h-6 w-px bg-slate-200" />}
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

              <div className="flex gap-0 bg-gray-50 border-t border-gray-200">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`flex-1 px-6 py-4 font-medium transition-all relative ${activeTab === tab.id
                        ? 'text-gray-900 bg-white'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span>{tab.label}</span>
                      {tab.comingSoon && (
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-yellow-100 text-yellow-800 rounded-full border border-yellow-200">
                          SOON
                        </span>
                      )}
                    </div>
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
                <div className={`w-full ${
                  viewMode === 'list' 
                    ? 'space-y-4' 
                    : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                }`}>
                  {currentOrganizations.map((organization) => (
                    <OrganizationCard 
                      key={organization.id} 
                      organization={organization} 
                      viewMode={viewMode}
                      onClick={() => navigate(`/organizations/${organization.slug}`)}
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

      {activeTab !== 'organizations' && (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8 bg-[#faf7f5]">
          <div className="max-w-[98%] mx-auto">
            {activeTab === 'grants' && (
              <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
                <div className="text-center md:text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 text-center sm:text-left">
                  <h2 className="text-2xl md:text-3xl font-bold">
                    <span className="text-slate-800">Available Grants </span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 font-extrabold">
                      ({totalFilteredGrants})
                    </span>
                  </h2>
                    <div className="mt-2 sm:mt-0 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full border border-green-200 shadow-sm">
                        <span className="text-green-700 font-semibold">
                          💰 <AnimatedCounter 
                            targetValue={totalFilteredFunding || 0} 
                            duration={800} 
                            formatValue={formatCurrency}
                          /> Available
                        </span>
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
                  
                  <div className="relative">
                    <select 
                      value={grantFilterConfig.sortCriteria}
                      onChange={(e) => handleCurrentFilterChange('sortCriteria', e.target.value)}
                      className="pl-4 pr-10 py-3 border border-slate-300 rounded-xl bg-white text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none shadow-sm"
                    >
                      <option value="dueDate_asc">Due Date (Soonest)</option>
                      <option value="amount_desc">Amount (High to Low)</option>
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