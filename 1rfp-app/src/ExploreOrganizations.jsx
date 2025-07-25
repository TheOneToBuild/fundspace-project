// src/ExploreOrganizations.jsx
import React, { useState, useMemo, useEffect, useCallback, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient.js';
import { Search, MapPin, DollarSign, Users, LayoutGrid, List, SlidersHorizontal, Award, MessageSquare, ExternalLink, XCircle, Building, Heart, Shield, GraduationCap, Stethoscope, Church, Star, Briefcase } from './components/Icons.jsx';
import FilterBar from './components/FilterBar.jsx';
import Pagination from './components/Pagination.jsx';
import { SearchResultsSkeleton } from './components/SkeletonLoader.jsx';
import { getPillClasses } from './utils.js';
import usePaginatedFilteredData from './hooks/usePaginatedFilteredData.js';
import { filterOrganizations } from './filtering.js';
import { sortOrganizations } from './sorting.js';
import { LayoutContext } from './App.jsx';

// Organization type configurations
const ORG_TYPE_CONFIG = {
  nonprofit: {
    label: 'Nonprofits',
    icon: <Heart size={16} />,
    color: 'purple',
    description: 'Nonprofit organizations making a difference in our communities'
  },
  foundation: {
    label: 'Foundations',
    icon: <Award size={16} />,
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

// Unified organization card component
const OrganizationCard = ({ organization, handleFilterChange }) => {
  const typeConfig = ORG_TYPE_CONFIG[organization.type] || ORG_TYPE_CONFIG.nonprofit;
  
  const getInitials = (name) => {
    if (!name) return '?';
    const words = name.split(' ');
    if (words.length > 1) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Use Tailwind classes as strings to avoid dynamic class issues
  const getColorClasses = (color) => {
    const colorMap = {
      purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200', button: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500' },
      green: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200', button: 'bg-green-600 hover:bg-green-700 focus:ring-green-500' },
      blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200', button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' },
      indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', border: 'border-indigo-200', button: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500' },
      teal: { bg: 'bg-teal-100', text: 'text-teal-600', border: 'border-teal-200', button: 'bg-teal-600 hover:bg-teal-700 focus:ring-teal-500' },
      orange: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200', button: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500' },
      amber: { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200', button: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500' }
    };
    return colorMap[color] || colorMap.purple;
  };

  const colorClasses = getColorClasses(typeConfig.color);

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-xl transition-all duration-300 ease-in-out flex flex-col justify-between transform hover:-translate-y-1 h-full">
      <div>
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0">
            {organization.logo_url ? (
              <img 
                src={organization.logo_url} 
                alt={`${organization.name} logo`} 
                className="h-16 w-16 rounded-full object-contain border border-slate-200 p-1"
                loading="lazy"
                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
              />
            ) : null}
            <div className={`h-16 w-16 rounded-full ${colorClasses.bg} ${colorClasses.text} flex items-center justify-center font-bold text-xl ${colorClasses.border} border-2 ${organization.logo_url ? 'hidden' : 'flex'}`}>
              {getInitials(organization.name)}
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-800 line-clamp-2">{organization.name}</h3>
            
            {/* Organization type badge */}
            <button 
              onClick={() => handleFilterChange('typeFilter', [organization.type])}
              className={`text-xs font-semibold px-2.5 py-1 rounded-full mt-2 inline-flex items-center gap-1 transition-transform transform hover:scale-105 active:scale-95 ${colorClasses.bg} ${colorClasses.text} ${colorClasses.border} border`}
              title={`Filter by type: ${typeConfig.label}`}
            >
              {typeConfig.icon}
              {typeConfig.label}
            </button>
          </div>
        </div>

        <p className="text-sm text-slate-600 mb-4 line-clamp-3 leading-relaxed">
          {organization.description}
        </p>

        <div className="space-y-3 text-sm mb-5">
          <div className="flex items-start text-slate-700">
            <MapPin size={16} className="mr-2.5 mt-0.5 text-blue-500 flex-shrink-0" />
            <div><span className="font-medium text-slate-600">Location:</span> {organization.location || 'Not specified'}</div>
          </div>
          
          {/* Type-specific fields */}
          {organization.type === 'foundation' && organization.total_funding_annually && (
            <div className="flex items-start text-slate-700">
              <DollarSign size={16} className="mr-2.5 mt-0.5 text-green-500 flex-shrink-0" />
              <div><span className="font-medium text-slate-600">Annual Giving:</span> {organization.total_funding_annually}</div>
            </div>
          )}
          
          {organization.type === 'nonprofit' && organization.budget && (
            <div className="flex items-start text-slate-700">
              <DollarSign size={16} className="mr-2.5 mt-0.5 text-green-500 flex-shrink-0" />
              <div><span className="font-medium text-slate-600">Annual Budget:</span> {organization.budget}</div>
            </div>
          )}
          
          {(organization.staff_count || organization.staffCount) && (
            <div className="flex items-start text-slate-700">
              <Users size={16} className="mr-2.5 mt-0.5 text-indigo-500 flex-shrink-0" />
              <div><span className="font-medium text-slate-600">Staff Count:</span> {organization.staff_count || organization.staffCount}</div>
            </div>
          )}
        </div>

        {/* Focus areas */}
        {organization.focus_areas && organization.focus_areas.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Focus Areas</h4>
            <div className="flex flex-wrap gap-2">
              {organization.focus_areas.slice(0, 3).map(area => (
                <button 
                  key={area} 
                  onClick={() => handleFilterChange('focusAreaFilter', [area])}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-transform transform hover:scale-105 active:scale-95 ${getPillClasses(area)}`}
                  title={`Filter by: ${area}`}
                >
                  {area}
                </button>
              ))}
              {organization.focus_areas.length > 3 && (
                <span className="text-xs text-slate-500 px-2.5 py-1">+{organization.focus_areas.length - 3} more</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action button */}
      <div className="mt-6">
        <Link 
          to={`/organizations/${organization.slug}`} 
          className={`inline-flex items-center justify-center w-full px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${colorClasses.button} focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors`}
        >
          View Profile <ExternalLink size={16} className="ml-2" />
        </Link>
      </div>
    </div>
  );
};

// Compact list item component
const OrganizationListItem = ({ organization }) => {
  const typeConfig = ORG_TYPE_CONFIG[organization.type] || ORG_TYPE_CONFIG.nonprofit;
  
  const getColorClasses = (color) => {
    const colorMap = {
      purple: 'text-purple-600 border-purple-500',
      green: 'text-green-600 border-green-500',
      blue: 'text-blue-600 border-blue-500',
      indigo: 'text-indigo-600 border-indigo-500',
      teal: 'text-teal-600 border-teal-500',
      orange: 'text-orange-600 border-orange-500',
      amber: 'text-amber-600 border-amber-500'
    };
    return colorMap[color] || colorMap.purple;
  };

  return (
    <Link 
      to={`/organizations/${organization.slug}`} 
      className={`bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all flex items-center gap-4 cursor-pointer`}
    >
      <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
        {organization.name?.split(' ').map(n => n[0]).slice(0,2).join('')}
      </div>
      <div className="flex-grow min-w-0">
        <h4 className="font-semibold text-slate-800 truncate">{organization.name}</h4>
        <div className="flex items-center gap-4 text-xs text-slate-600 mt-1">
          <span className={`flex items-center gap-1.5 ${getColorClasses(typeConfig.color).split(' ')[0]}`}>
            {typeConfig.icon} {typeConfig.label}
          </span>
          {organization.location && <span className="flex items-center gap-1.5"><MapPin size={12} /> {organization.location}</span>}
        </div>
      </div>
      <div className="flex-shrink-0">
        <div className="hidden sm:flex flex-wrap gap-1.5 justify-end max-w-xs">
          {organization.focus_areas?.slice(0, 2).map(area => (
            <span key={area} className={`text-xs font-semibold px-2 py-0.5 rounded ${getPillClasses(area)}`}>{area}</span>
          ))}
        </div>
      </div>
    </Link>
  );
};

const ExploreOrganizations = ({ isProfileView = false }) => {
  const { setPageBgColor } = useContext(LayoutContext);

  useEffect(() => {
    if (!isProfileView) {
      setPageBgColor('bg-gradient-to-br from-rose-50 via-orange-50 to-yellow-50');
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
        const { data, error } = await supabase
          .from('organizations')
          .select(`
            *,
            organization_categories(categories(name))
          `);

        if (error) throw error;

        if (data) {
          const formattedData = data.map(org => ({
            ...org,
            focus_areas: org.organization_categories?.map(oc => oc.categories?.name).filter(Boolean) || []
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
        <section id="org-intro" className="text-center pt-8 pb-12 md:pt-12 md:pb-16 mb-10 md:mb-12 p-6 rounded-xl">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">Explore Organizations</h2>
          <p className="text-md md:text-lg text-slate-600 mb-6 max-w-2xl mx-auto">
            Discover nonprofits, foundations, government agencies, and other organizations making an impact in the Bay Area.
          </p>
          <FilterBar {...filterBarProps} isMobileVisible={true} />
        </section>
      )}

      <section id="organizations-list" className="scroll-mt-20">
        {isProfileView && (
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
            <button onClick={() => setFiltersVisible(!filtersVisible)} className="flex justify-between items-center w-full p-2 rounded-lg hover:bg-slate-50">
              <span className="font-semibold text-slate-700">Filter & Sort Organizations</span>
              <SlidersHorizontal size={20} className={`text-slate-500 transition-transform ${filtersVisible ? 'rotate-90' : ''}`} />
            </button>
            {filtersVisible && ( 
              <div className="mt-4 pt-4 border-t"> 
                <FilterBar {...filterBarProps} isMobileVisible={true} /> 
              </div> 
            )}
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-2xl font-semibold text-slate-800 text-center md:text-left">
            Organizations <span className="text-blue-600">({totalFilteredItems})</span>
          </h2>
          <div className="flex items-center gap-2">
            <select 
              id="orgs-per-page" 
              value={orgsPerPage} 
              onChange={(e) => setOrgsPerPage(Number(e.target.value))} 
              className="pl-3 pr-8 py-2 border border-slate-300 rounded-md bg-white text-xs focus:ring-1 focus:ring-blue-500 outline-none appearance-none"
            >
              {[6, 12, 18, 24].map((n) => (<option key={n} value={n}>Show {n}</option>))}
            </select>
            {isProfileView && (
              <div className="flex items-center rounded-md border border-slate-300 p-1 bg-white shadow-sm">
                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                  <List size={16}/>
                </button>
                <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                  <LayoutGrid size={16}/>
                </button>
              </div>
            )}
          </div>
        </div>

        {loading ? ( 
          <SearchResultsSkeleton count={orgsPerPage} /> 
        ) : currentOrganizations.length > 0 ? (
          viewMode === 'grid' ? (
            <div className={`grid grid-cols-1 md:grid-cols-2 ${isProfileView ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-6`}>
              {currentOrganizations.map((organization) => (
                <OrganizationCard key={organization.id} organization={organization} handleFilterChange={handleFilterChange} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {currentOrganizations.map((organization) => (
                <OrganizationListItem key={organization.id} organization={organization} />
              ))}
            </div>
          )
        ) : (
          <div className="text-center text-slate-500 py-12 bg-white rounded-lg shadow-sm border">
            <Search size={40} className="mx-auto text-slate-400 mb-3" />
            <p className="text-lg font-medium">No organizations found.</p>
            <p className="text-sm mb-4">Try adjusting your search or filter criteria.</p>
            <button onClick={handleClearFilters} className="inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-100">
              <XCircle size={16} className="mr-2" />Clear All Filters
            </button>
          </div>
        )}
        
        {totalPages > 1 && (
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={paginate} 
            activeColorClass="bg-blue-600 text-white border-blue-600" 
          />
        )}
      </section>
    </div>
  );
};

export default ExploreOrganizations;