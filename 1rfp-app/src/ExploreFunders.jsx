// src/ExploreFunders.jsx
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient.js';
import { Search, MapPin, DollarSign, IconBriefcase, MessageSquare, ExternalLink, ChevronDown, Info, ClipboardList, Loader, XCircle, Calendar } from './components/Icons.jsx';
import FilterBar from './components/FilterBar.jsx';
import Pagination from './components/Pagination.jsx';
import { formatDate, getPillClasses, parseMaxFundingAmount, parseMinFundingAmount } from './utils.js';
import { COMMON_LOCATIONS, GRANT_TYPES } from './constants.js';
import usePaginatedFilteredData from './hooks/usePaginatedFilteredData.js';
import { filterFunders } from './filtering.js';
import { sortFunders } from './sorting.js';

// Funder Card Component
const FunderCard = ({ funder }) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-xl transition-all duration-300 ease-in-out flex flex-col justify-between transform hover:-translate-y-1">
      <div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">{funder.name}</h3>
        <p className="text-sm text-slate-500 mb-4 line-clamp-3 leading-relaxed">
          {funder.description}
        </p>
        <div className="space-y-2.5 text-sm mb-5">
          <div className="flex items-center text-slate-700">
            <MapPin size={15} className="mr-2.5 text-blue-500 flex-shrink-0" />
            <div><span className="font-medium text-slate-600">Location Focus:</span> {funder.location}</div>
          </div>
          <div className="flex items-center text-slate-700">
            <DollarSign size={15} className="mr-2.5 text-green-500 flex-shrink-0" />
            <div><span className="font-medium text-slate-600">Annual Funding:</span> {funder.totalFundingAnnually}</div>
          </div>
          <div className="flex items-center text-slate-700">
            <IconBriefcase size={15} className="w-4 h-4 mr-2.5 text-purple-500 flex-shrink-0" />
            <div><span className="font-medium text-slate-600">Grant Types:</span> {funder.grantTypes.join(', ')}</div>
          </div>
          <div className="flex items-center text-slate-700">
            <MessageSquare size={15} className="mr-2.5 text-orange-500 flex-shrink-0" />
            <div><span className="font-medium text-slate-600">Avg. Grant Size:</span> {funder.averageGrantSize}</div>
          </div>
          {funder.grantsOffered && (
              <div className="flex items-center text-slate-700">
                <ClipboardList size={15} className="mr-2.5 text-blue-500 flex-shrink-0" />
                <div><span className="font-medium text-slate-600">Grants Offered Annually:</span> {funder.grantsOffered}</div>
              </div>
          )}
          {funder.lastUpdated && (
              <div className="flex items-center text-slate-700">
                <Calendar size={15} className="mr-2.5 text-slate-400 flex-shrink-0" />
                <div><span className="font-medium text-slate-600">Last Updated:</span> {formatDate(funder.lastUpdated)}</div>
              </div>
          )}
        </div>
        {funder.focusAreas && funder.focusAreas.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200 bg-slate-50 p-3 rounded-md">
                <h4 className="text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">Focus Areas:</h4>
                <div className="flex flex-wrap gap-2">
                    {funder.focusAreas.map(area => (
                        <span key={area} className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getPillClasses(area)}`}>
                            {area}
                        </span>
                    ))}
                </div>
            </div>
        )}
      </div>
      <div className="mt-6">
        <a
          href={funder.website}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center w-full px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 ease-in-out transform hover:scale-105"
        >
          Visit Funder Website <ExternalLink size={16} className="ml-2 opacity-80" />
        </a>
      </div>
    </div>
  );
};


const ExploreFunders = () => {
  const [funders, setFunders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterConfig, setFilterConfig] = useState({
    searchTerm: '',
    locationFilter: '',
    focusAreaFilter: '',
    grantTypeFilter: '',
    minFunding: '',
    maxFunding: '',
    sortCriteria: 'name_asc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [fundersPerPage, setFundersPerPage] = useState(12);
  const [isMobileFiltersVisible, setIsMobileFiltersVisible] = useState(false);

  useEffect(() => {
    const fetchFunders = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('funders')
                .select('*');
            
            if (error) throw error;

            if (data) {
                const formattedData = data.map(funder => ({
                    ...funder,
                    totalFundingAnnually: funder.total_funding_annually,
                    grantTypes: funder.grant_types,
                    averageGrantSize: funder.average_grant_size,
                    focusAreas: funder.focus_areas,
                    grantsOffered: funder.grants_offered,
                    lastUpdated: funder.last_updated
                }));
                setFunders(formattedData);
            }
        } catch (error) {
            console.error('Error fetching funders:', error);
        } finally {
            setLoading(false);
        }
    };
    fetchFunders();
  }, []);

  const uniqueFocusAreas = useMemo(() => {
    if (!funders) return [];
    const allAreas = funders.flatMap(f => f.focusAreas || []);
    return Array.from(new Set(allAreas)).sort();
  }, [funders]);

  const { paginatedItems: currentFunders, totalPages, totalFilteredItems } = usePaginatedFilteredData(
    funders,
    filterConfig,
    filterFunders,
    filterConfig.sortCriteria,
    sortFunders,
    currentPage,
    fundersPerPage
  );

  const handleFilterChange = (key, value) => {
    setFilterConfig(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const paginate = useCallback((pageNumber) => {
    if (pageNumber < 1 || (totalPages > 0 && pageNumber > totalPages)) return;
    setCurrentPage(pageNumber);
    const fundersSection = document.getElementById('funders-list');
    if (fundersSection) {
      const offset = 80;
      const position = fundersSection.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: position, behavior: 'smooth' });
    }
  }, [totalPages]);

  const handleClearFilters = useCallback(() => {
    setFilterConfig({
      searchTerm: '',
      locationFilter: '',
      focusAreaFilter: '',
      grantTypeFilter: '',
      minFunding: '',
      maxFunding: '',
      sortCriteria: 'name_asc'
    });
    setCurrentPage(1);
  }, []);

  const handleRemoveFunderFilter = useCallback((keyToRemove) => {
    handleFilterChange(keyToRemove, '');
  }, []);

  useEffect(() => {
    document.title = '1RFP - Explore Funders';
  }, []);

  const activeFunderFilters = useMemo(() => {
    const filters = [];
    if (filterConfig.searchTerm) filters.push({ key: 'searchTerm', label: `Search: "${filterConfig.searchTerm}"` });
    if (filterConfig.locationFilter) filters.push({ key: 'locationFilter', label: `Location: ${filterConfig.locationFilter}` });
    if (filterConfig.focusAreaFilter) filters.push({ key: 'focusAreaFilter', label: `Focus Area: ${filterConfig.focusAreaFilter}` });
    if (filterConfig.grantTypeFilter) filters.push({ key: 'grantTypeFilter', label: `Grant Type: ${filterConfig.grantTypeFilter}` });
    if (filterConfig.minFunding) filters.push({ key: 'minFunding', label: `Min Funding: $${parseInt(filterConfig.minFunding).toLocaleString()}` });
    if (filterConfig.maxFunding) filters.push({ key: 'maxFunding', label: `Max Funding: $${parseInt(filterConfig.maxFunding).toLocaleString()}` });
    return filters;
  }, [filterConfig]);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <section id="funder-intro" className="text-center pt-8 pb-12 md:pt-12 md:pb-16 mb-10 md:mb-12 scroll-mt-20 bg-white p-6 sm:p-8 md:p-10 rounded-xl shadow-lg border border-slate-200">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">
          Explore Funding Organizations
        </h2>
        <p className="text-md md:text-lg text-slate-600 mb-6 max-w-2xl mx-auto">
          Discover foundations and organizations that fund initiatives in the San Francisco Bay Area.
        </p>
        <div className="text-xs text-slate-500 bg-slate-100 border border-slate-200 px-3 py-2 rounded-md inline-flex items-center gap-1.5">
          <Info size={14} className="flex-shrink-0" />
          <span>Connecting to live funder database.</span>
        </div>

        <div className="mt-8 md:hidden">
            <button
                onClick={() => setIsMobileFiltersVisible(!isMobileFiltersVisible)}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
            >
                {isMobileFiltersVisible ? 'Hide Filters' : 'Show Filters'}
                {activeFunderFilters.length > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-green-600 rounded-full">
                        {activeFunderFilters.length}
                    </span>
                )}
            </button>
        </div>

        <FilterBar
          isMobileVisible={isMobileFiltersVisible}
          searchTerm={filterConfig.searchTerm}
          setSearchTerm={(value) => handleFilterChange('searchTerm', value)}
          locationFilter={filterConfig.locationFilter}
          setLocationFilter={(value) => handleFilterChange('locationFilter', value)}
          focusAreaFilter={filterConfig.focusAreaFilter}
          setFocusAreaFilter={(value) => handleFilterChange('focusAreaFilter', value)}
          grantTypeFilter={filterConfig.grantTypeFilter}
          setGrantTypeFilter={(value) => handleFilterChange('grantTypeFilter', value)}
          minFunding={filterConfig.minFunding}
          setMinFunding={(value) => handleFilterChange('minFunding', value)}
          maxFunding={filterConfig.maxFunding}
          setMaxFunding={(value) => handleFilterChange('maxFunding', value)}
          sortCriteria={filterConfig.sortCriteria}
          setSortCriteria={(value) => handleFilterChange('sortCriteria', value)}
          uniqueLocations={COMMON_LOCATIONS}
          uniqueFocusAreas={uniqueFocusAreas}
          uniqueGrantTypes={GRANT_TYPES}
          pageType="funders"
          onClearFilters={handleClearFilters}
          activeFilters={activeFunderFilters}
          onRemoveFilter={handleRemoveFunderFilter}
        />
      </section>

      <section id="funders-list" className="mb-12 scroll-mt-20">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h2 className="text-2xl font-semibold text-slate-800 text-center md:text-left">
            Foundations & Grantmakers <span className="text-green-600">({totalFilteredItems})</span>
          </h2>
          <div className="flex flex-col sm:flex-row gap-3 items-center w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <label htmlFor="funders-per-page" className="sr-only">Funders per page</label>
              <IconBriefcase size={16} className="text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
              <select
                id="funders-per-page"
                value={fundersPerPage}
                onChange={(e) => {
                  setFundersPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-8 py-2.5 border border-slate-300 rounded-md bg-white text-xs focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none appearance-none shadow-sm"
              >
                {[6, 9, 12, 15, 21, 24].map((option) => (
                  <option key={option} value={option}>
                    Show {option}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" size={16} />
            </div>
          </div>
        </div>

        {loading ? (
            <div className="text-center text-slate-500 py-12 bg-white rounded-lg shadow-sm border border-slate-200">
              <Loader size={40} className="mx-auto text-green-400 mb-3 animate-spin" />
              <p className="text-lg font-medium">Loading funders...</p>
              <p className="text-sm">Connecting to the database.</p>
            </div>
          ) : currentFunders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentFunders.map((funder) => (
              <FunderCard key={funder.id} funder={funder} />
            ))}
          </div>
        ) : (
          <div className="text-center text-slate-500 py-12 bg-white rounded-lg shadow-sm border border-slate-200">
            <Search size={40} className="mx-auto text-slate-400 mb-3" />
            <p className="text-lg font-medium">No funders found.</p>
            <p className="text-sm mb-4">Try adjusting your search or filter criteria.</p>
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <XCircle size={16} className="mr-2" />
              Clear All Filters
            </button>
          </div>
        )}

        {totalPages > 0 && currentFunders.length > 0 && !loading && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={paginate}
            activeColorClass="bg-green-600 text-white border-green-600"
            inactiveColorClass="bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
            disabledColorClass="disabled:opacity-50"
          />
        )}
      </section>
    </div>
  );
};

export default ExploreFunders;
