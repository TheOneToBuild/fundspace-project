// src/ExploreOrganizations.jsx
import React, { useState, useMemo, useEffect, useCallback, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient.js';
import { Search, MapPin, LayoutGrid, List, SlidersHorizontal, Building, Heart, Shield, GraduationCap, Stethoscope, Church, XCircle, ChevronDown, TrendingUp, Sparkles, Star, Target } from './components/Icons.jsx';
import FilterBar from './components/FilterBar.jsx';
import Pagination from './components/Pagination.jsx';
import OrganizationCard from './components/OrganizationCard.jsx';
import { SearchResultsSkeleton } from './components/SkeletonLoader.jsx';
import { getPillClasses } from './utils.js';
import usePaginatedFilteredData from './hooks/usePaginatedFilteredData.js';
import { filterOrganizations } from './filtering.js';
import { sortOrganizations } from './sorting.js';
import { LayoutContext } from './App.jsx';

// Organization type configurations (for filtering UI)
const ORG_TYPE_CONFIG = {
  nonprofit: {
    label: 'Nonprofits',
    icon: <Heart size={16} />,
    color: 'purple',
    description: 'Nonprofit organizations making a difference in our communities'
  },
  foundation: {
    label: 'Foundations',
    icon: <Shield size={16} />,
    color: 'green', 
    description: 'Foundations and grantmakers providing funding'
  },
  government: {
    label: 'Government',
    icon: <Shield size={16} />,
    color: 'blue',
    description: 'Government agencies and departments'
  },
  education: {
    label: 'Education',
    icon: <GraduationCap size={16} />,
    color: 'indigo',
    description: 'Educational institutions and schools'
  },
  healthcare: {
    label: 'Healthcare',
    icon: <Stethoscope size={16} />,
    color: 'teal',
    description: 'Healthcare organizations and medical institutions'
  },
  forprofit: {
    label: 'For-Profit',
    icon: <Building size={16} />,
    color: 'orange',
    description: 'For-profit organizations with social impact'
  },
  religious: {
    label: 'Religious',
    icon: <Church size={16} />,
    color: 'amber',
    description: 'Religious organizations and faith-based groups'
  }
};

// Enhanced List Item Component
const OrganizationListItem = ({ organization }) => {
  const typeConfig = ORG_TYPE_CONFIG[organization.type] || ORG_TYPE_CONFIG.nonprofit;
  
  const getInitials = (name) => {
    if (!name) return '?';
    const words = name.split(' ');
    return words.length > 1 ? 
      (words[0][0] + words[1][0]).toUpperCase() : 
      name.substring(0, 2).toUpperCase();
  };

  return (
    <Link 
      to={`/organizations/${organization.slug}`} 
      className="group bg-white p-4 md:p-5 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-2xl transition-all duration-300 flex flex-col md:flex-row items-start md:items-center gap-4 cursor-pointer transform hover:-translate-y-1"
    >
      <div className="flex-shrink-0">
        {organization.logo_url ? (
          <img 
            src={organization.logo_url} 
            alt={`${organization.name} logo`}
            className="h-14 w-14 md:h-16 md:w-16 rounded-xl object-contain border-2 border-white shadow-lg group-hover:shadow-xl transition-shadow duration-300" 
          />
        ) : (
          <div className="h-14 w-14 md:h-16 md:w-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:shadow-xl transition-shadow duration-300">
            {getInitials(organization.name)}
          </div>
        )}
      </div>
      
      <div className="flex-grow min-w-0 w-full">
        <div className="flex items-center gap-3 mb-2">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-gradient-to-r ${
            typeConfig.color === 'purple' ? 'from-purple-100 to-pink-100 text-purple-700 border-purple-200' :
            typeConfig.color === 'green' ? 'from-green-100 to-emerald-100 text-green-700 border-green-200' :
            typeConfig.color === 'blue' ? 'from-blue-100 to-indigo-100 text-blue-700 border-blue-200' :
            typeConfig.color === 'indigo' ? 'from-indigo-100 to-purple-100 text-indigo-700 border-indigo-200' :
            typeConfig.color === 'teal' ? 'from-teal-100 to-cyan-100 text-teal-700 border-teal-200' :
            typeConfig.color === 'orange' ? 'from-orange-100 to-amber-100 text-orange-700 border-orange-200' :
            'from-amber-100 to-yellow-100 text-amber-700 border-amber-200'
          } border`}>
            {typeConfig.icon} {typeConfig.label}
          </span>
        </div>
        <h4 className="font-bold text-slate-800 text-lg mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
          {organization.name}
        </h4>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
          {organization.location && (
            <div className="flex items-center gap-1.5">
              <MapPin size={14} className="text-blue-600" />
              <span className="font-semibold text-blue-700">{organization.location}</span>
            </div>
          )}
          {organization.focus_areas && organization.focus_areas.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Target size={14} className="text-purple-600"/>
              {organization.focus_areas.slice(0, 2).map((area, index) => (
                  <span key={index} className="text-xs font-medium px-2 py-1 bg-purple-100 text-purple-700 rounded-full border border-purple-200">
                      {area}
                  </span>
              ))}
              {organization.focus_areas.length > 2 && (
                  <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                      +{organization.focus_areas.length - 2}
                  </span>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="w-full md:w-auto flex-shrink-0 flex items-center mt-4 md:mt-0">
        <Link
          to={`/organizations/${organization.slug}`}
          className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
        >
          <Sparkles size={16} />
          View Profile
        </Link>
      </div>
    </Link>
  );
};

const ExploreOrganizations = ({ isProfileView = false }) => {
  const { setPageBgColor } = useContext(LayoutContext);

  useEffect(() => {
    if (!isProfileView) {
      setPageBgColor('bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50');
      return () => {
        setPageBgColor('bg-white');
      };
    }
  }, [isProfileView, setPageBgColor]);

  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterConfig, setFilterConfig] = useState({ 
    searchTerm: '', 
    locationFilter: [],
    focusAreaFilter: [], 
    typeFilter: [],
    taxonomyFilter: [],
    sortCriteria: 'name_asc' 
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [orgsPerPage, setOrgsPerPage] = useState(12);
  const [viewMode, setViewMode] = useState('grid');
  const [filtersVisible, setFiltersVisible] = useState(!isProfileView);
  
  const location = useLocation();

  useEffect(() => {
    if (location.state?.prefilledFilter) {
      const { key, value } = location.state.prefilledFilter;
      handleFilterChange(key, [value]);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchOrganizations = async () => {
      setLoading(true);
      try {
        let { data, error } = await supabase
          .from('organizations_with_engagement')
          .select(`
            *,
            organization_categories(categories(name))
          `);

        if (error && error.message.includes('relation "organizations_with_engagement" does not exist')) {
          console.log('📊 Engagement view not found, fetching without counts...');
          
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('organizations')
            .select(`
              *,
              organization_categories(categories(name))
            `);
          
          if (fallbackError) throw fallbackError;
          data = fallbackData;
        } else if (error) {
          throw error;
        }

        if (data) {
          const formattedData = data.map(org => ({
            ...org,
            focus_areas: org.organization_categories?.map(oc => oc.categories?.name).filter(Boolean) || [],
            followers_count: org.followers_count || 0,
            likes_count: org.likes_count || 0
          }));
          setOrganizations(formattedData);
        }
      } catch (error) {
        console.error('Error fetching organizations:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrganizations();
  }, []);

  const { paginatedItems: currentOrganizations, totalPages, totalFilteredItems } = usePaginatedFilteredData(
    organizations, 
    filterConfig, 
    filterOrganizations, 
    filterConfig.sortCriteria, 
    sortOrganizations, 
    currentPage, 
    orgsPerPage
  );

  const handleFilterChange = useCallback((key, value) => {
    setFilterConfig(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }, []);

  const handleSearchAction = useCallback((suggestion) => {
    setFilterConfig(prevConfig => {
      const newConfig = { ...prevConfig, searchTerm: suggestion.text };
      if (suggestion.type === 'focus_area') {
        newConfig.focusAreaFilter = [suggestion.text];
      } else if (suggestion.type === 'location') {
        newConfig.locationFilter = [suggestion.text];
      }
      return newConfig;
    });
    setCurrentPage(1);
  }, []);

  const paginate = useCallback((pageNumber) => {
    if (pageNumber < 1 || (totalPages > 0 && pageNumber > totalPages)) return;
    setCurrentPage(pageNumber);
    const element = document.getElementById('organizations-list');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [totalPages]);

  const handleClearFilters = useCallback(() => {
    setFilterConfig({ 
      searchTerm: '', 
      locationFilter: [], 
      focusAreaFilter: [], 
      typeFilter: [],
      taxonomyFilter: [],
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

  useEffect(() => { 
    document.title = '1RFP - Explore Organizations'; 
  }, []);

  const activeFilters = useMemo(() => {
    const filters = [];
    if (filterConfig.searchTerm) filters.push({ key: 'searchTerm', label: `Search: "${filterConfig.searchTerm}"` });
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

  const filterBarProps = {
    searchTerm: filterConfig.searchTerm, 
    onSuggestionSelect: handleSearchAction,
    setSearchTerm: (value) => handleFilterChange('searchTerm', value),
    locationFilter: filterConfig.locationFilter, 
    setLocationFilter: (value) => handleFilterChange('locationFilter', value),
    focusAreaFilter: filterConfig.focusAreaFilter, 
    setFocusAreaFilter: (value) => handleFilterChange('focusAreaFilter', value),
    typeFilter: filterConfig.typeFilter,
    setTypeFilter: (value) => handleFilterChange('typeFilter', value),
    sortCriteria: filterConfig.sortCriteria, 
    setSortCriteria: (value) => handleFilterChange('sortCriteria', value),
    uniqueFocusAreas, 
    uniqueLocations,
    availableTypes,
    orgTypeConfig: ORG_TYPE_CONFIG,
    organizations, 
    pageType: "organizations",
    onClearFilters: handleClearFilters, 
    activeFilters: activeFilters, 
    onRemoveFilter: handleRemoveFilter,
  };

  return (
    <div className={isProfileView ? "" : "container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12"}>
      {!isProfileView && (
        <section id="organization-intro" className="text-center mb-12 relative">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full opacity-10 animate-pulse"></div>
            <div className="absolute top-32 right-20 w-24 h-24 bg-gradient-to-r from-pink-400 to-rose-600 rounded-full opacity-10 animate-pulse delay-1000"></div>
            <div className="absolute bottom-10 left-1/3 w-20 h-20 bg-gradient-to-r from-emerald-400 to-teal-600 rounded-full opacity-10 animate-pulse delay-2000"></div>
          </div>
          
          <div className="relative bg-white/80 backdrop-blur-sm p-6 md:p-10 rounded-3xl border border-white/60 shadow-2xl">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-3">
              <span className="text-slate-900">Explore </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
                Organizations
              </span>
            </h2>
            
            <p className="text-md md:text-lg text-slate-600 mb-6 max-w-3xl mx-auto leading-relaxed">
              Discover nonprofits, foundations, government agencies, and other organizations making an impact in the Bay Area.
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 font-semibold"> Find your community.</span>
            </p>

            <FilterBar {...filterBarProps} isMobileVisible={true} />
          </div>
        </section>
      )}

      <section id="organizations-list" className="scroll-mt-20">
        {isProfileView && (
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/60 mb-8">
            <button 
              onClick={() => setFiltersVisible(!filtersVisible)} 
              className="flex justify-between items-center w-full p-3 rounded-xl hover:bg-slate-50 transition-colors duration-300"
            >
              <span className="font-semibold text-slate-700 flex items-center gap-2">
                <SlidersHorizontal size={20} className="text-slate-500" />
                Filter & Sort Organizations
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
                id="orgs-per-page" 
                value={orgsPerPage} 
                onChange={(e) => setOrgsPerPage(Number(e.target.value))} 
                className="pl-4 pr-10 py-3 border border-slate-300 rounded-xl bg-white text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                {[6, 12, 18, 24].map((n) => (<option key={n} value={n}>Show {n}</option>))}
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
                <span className="hidden sm:inline text-sm font-medium">Grid</span>
              </button>
              <button 
                onClick={() => setViewMode('list')} 
                className={`p-2.5 rounded-lg transition-all duration-300 flex items-center gap-2 ${viewMode === 'list' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}
                title="List View"
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
            {viewMode === 'grid' ? (
              <div className={`grid grid-cols-1 md:grid-cols-2 ${isProfileView ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-8`}>
                {currentOrganizations.map((organization) => (
                  <OrganizationCard 
                    key={organization.id} 
                    organization={organization} 
                    handleFilterChange={handleFilterChange} 
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {currentOrganizations.map((organization) => (
                  <OrganizationListItem key={organization.id} organization={organization} />
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
              <h3 className="text-2xl font-bold text-slate-800 mb-3">No organizations found</h3>
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
        
        {totalPages > 1 && (
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={paginate} 
          />
        )}
      </section>
    </div>
  );
};

export default ExploreOrganizations;
