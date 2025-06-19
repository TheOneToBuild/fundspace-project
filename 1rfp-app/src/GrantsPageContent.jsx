// src/GrantsPageContent.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from './supabaseClient.js';
import { Search, Users, MapPin, Calendar, DollarSign, Info, ChevronDown, ExternalLink, Zap, Clock, Target, IconBriefcase, BarChart3, ClipboardList, TrendingUp, Loader, XCircle, Heart, Bot } from './components/Icons.jsx';
import GrantCard from './components/GrantCard.jsx';
import GrantDetailModal from './GrantDetailModal.jsx';
import FilterBar from './components/FilterBar.jsx';
import Pagination from './components/Pagination.jsx';
import AnimatedCounter from './components/AnimatedCounter.jsx';
import { parseMaxFundingAmount } from './utils.js';
import { heroImpactCardsData } from './data.jsx';
import { GRANT_STATUSES } from './constants.js';
import usePaginatedFilteredData from './hooks/usePaginatedFilteredData.js';
import { sortGrants } from './sorting.js';


const filterGrants = (grants, config) => {
  if (!Array.isArray(grants)) {
    return [];
  }
  return grants.filter(grant => {
    // Search Term Filter (now without keywords)
    if (config.searchTerm) {
      const searchTerm = config.searchTerm.toLowerCase();
      const searchableText = [
        grant.title,
        grant.description,
        grant.foundationName
      ].join(' ').toLowerCase();
      if (!searchableText.includes(searchTerm)) {
        return false;
      }
    }

    // Multi-Location Filter
    if (config.locationFilter.length > 0) {
      if (!grant.locations || grant.locations.length === 0) return false;
      const grantLocationNames = grant.locations.map(l => l.name);
      const hasMatch = grantLocationNames.some(locName => config.locationFilter.includes(locName));
      if (!hasMatch) {
        return false;
      }
    }
    
    // Multi-Category Filter
    if (config.categoryFilter.length > 0) {
      if (!grant.categories || grant.categories.length === 0) return false;
      const grantCategoryNames = grant.categories.map(c => c.name);
      const hasMatch = grantCategoryNames.some(catName => config.categoryFilter.includes(catName));
      if (!hasMatch) {
        return false;
      }
    }
    
    // Grant Type Filter
    if (config.grantTypeFilter) {
      if (!grant.grantType || grant.grantType !== config.grantTypeFilter) {
        return false;
      }
    }

    return true;
  });
};


const formatCurrency = (amount) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M+`;
    else if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K+`;
    return `${amount}`;
};
const HeroImageCard = ({ card, layoutClass, initialDelay = 0 }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  useEffect(() => {
    if (!card.imageUrls || card.imageUrls.length <= 1) return;
    const interval = setInterval(() => { setCurrentImageIndex(prev => (prev + 1) % card.imageUrls.length); }, 10000 + initialDelay);
    return () => clearInterval(interval);
  }, [card.imageUrls, initialDelay]);
  return ( <div className={`rounded-xl shadow-lg overflow-hidden relative group ${layoutClass}`}><img src={card.imageUrls[currentImageIndex]} alt={card.imageAlt} className="w-full h-full object-cover object-center" loading="lazy" /></div> );
};
const HeroImpactSection = ({ grants }) => {
  const layoutClasses = [ 'col-span-1 row-span-2 h-full min-h-[300px] md:min-h-[400px]', 'col-span-1 row-span-1 h-full min-h-[140px] md:min-h-[190px]', 'col-span-1 row-span-1 h-full min-h-[140px] md:min-h-[190px]', 'col-span-1 row-span-1 h-full min-h-[140px] md:min-h-[190px]', 'col-span-1 row-span-1 h-full min-h-[140px] md:min-h-[190px]' ];
  const totalAvailableFunding = useMemo(() => {
    if (!Array.isArray(grants)) return 0;
    return grants.reduce((sum, grant) => sum + parseMaxFundingAmount(grant.fundingAmount), 0);
  }, [grants]);
  const totalGrantsAvailable = Array.isArray(grants) ? grants.length : 0;
  return (
    <section className="py-16 md:py-24 bg-white border-b border-slate-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-10 xl:gap-16 items-center">
          <div className="text-center lg:text-left">
            <div className="flex flex-col sm:flex-row gap-8 justify-center lg:justify-start mb-8">
              {totalGrantsAvailable > 0 && (
                <div className="text-center sm:text-left">
                  <div className="flex items-center gap-3 justify-center sm:justify-start">
                    <ClipboardList size={32} className="text-purple-500" />
                    <AnimatedCounter targetValue={totalGrantsAvailable} duration={2500} step={1} className="text-purple-600 text-4xl md:text-5xl font-bold" />
                  </div>
                  <p className="text-sm font-medium text-slate-500 mt-1 ml-1">Total Grants Available</p>
                </div>
              )}
              {totalAvailableFunding > 0 && (
                <div className="text-center sm:text-left">
                  <div className="flex items-center gap-3 justify-center sm:justify-start">
                    <TrendingUp size={32} className="text-green-500" />
                    <AnimatedCounter targetValue={totalAvailableFunding} duration={2500} step={1} prefix="$" formatValue={formatCurrency} className="text-green-600 text-4xl md:text-5xl font-bold" />
                  </div>
                  <p className="text-sm font-medium text-slate-500 mt-1 ml-1">Total Funding Opportunities</p>
                </div>
              )}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-slate-900 mb-4 leading-tight"> A Smarter Path to <span className="text-blue-600">Funding.</span></h1>
            <p className="text-lg text-slate-600 mb-6 max-w-xl mx-auto lg:mx-0 leading-relaxed">Our mission is to empower Bay Area nonprofits by transforming grant discovery. We combine AI-powered data aggregation with community-driven insights to create a single, comprehensive, and easy-to-use platform.</p>
            <p className="text-lg text-slate-600 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">Spend less time searching and more time making an impact.</p>
            <div className="flex justify-center lg:justify-start">
              <a href="#funding-opportunity-intro" className="inline-flex items-center justify-center px-8 py-3.5 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700">Explore Grants Now <Search size={20} className="ml-2.5" /></a>
            </div>
          </div>
          <div className="w-full"><div className="grid grid-cols-2 gap-4 h-[500px] md:h-[600px]">{heroImpactCardsData.map((card, index) => ( <HeroImageCard key={card.id} card={card} layoutClass={layoutClasses[index]} initialDelay={index * 300} /> ))}</div></div>
        </div>
      </div>
    </section>
  );
};

const GrantsPageContent = () => {
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterConfig, setFilterConfig] = useState({ searchTerm: '', locationFilter: [], categoryFilter: [], grantTypeFilter: '', sortCriteria: 'dueDate_asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [grantsPerPage, setGrantsPerPage] = useState(12);
  const [isDetailModalOpen, setIsDetailModal] = useState(false);
  const [selectedGrant, setSelectedGrant] = useState(null);
  const [isMobileFiltersVisible, setIsMobileFiltersVisible] = useState(false);

  useEffect(() => {
    const fetchGrants = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_grants_with_details');
        if (error) throw error;
        const grantsData = Array.isArray(data) ? data : [];
        
        // --- THIS IS THE CORRECTED MAPPING TO MATCH THE DATABASE FUNCTION ---
        const formattedData = grantsData.map(grant => ({
            ...grant,
            foundationName: grant.foundation_name,
            fundingAmount: grant.funding_amount_text, // CORRECTED
            dueDate: grant.due_date,                 // CORRECTED
            grantType: grant.grant_type,
        }));
        setGrants(formattedData);
      } catch (error) {
        console.error('Error fetching grants:', error);
        setGrants([]);
      } finally {
        setLoading(false);
      }
    };
    fetchGrants();
  }, []);

  const uniqueCategories = useMemo(() => {
    if (!grants) return [];
    const allCategories = new Set();
    grants.forEach(grant => {
        if (grant.categories && Array.isArray(grant.categories)) {
            grant.categories.forEach(cat => { if(cat.name) allCategories.add(cat.name); });
        }
    });
    return Array.from(allCategories).sort();
  }, [grants]);
  const uniqueGrantTypes = useMemo(() => Array.from(new Set(grants.map(g => g.grantType).filter(Boolean))).sort(), [grants]);
  const uniqueLocations = useMemo(() => {
    if (!grants) return [];
    const allLocations = new Set();
    grants.forEach(grant => {
        if (grant.locations && Array.isArray(grant.locations)) {
            grant.locations.forEach(loc => { if(loc.name) allLocations.add(loc.name); });
        }
    });
    return Array.from(allLocations).sort();
  }, [grants]);

  const grantsPerPageOptions = [6, 9, 12, 15, 21, 24, 30, 45, 60, 86];
  const { paginatedItems: currentList = [], totalPages, totalFilteredItems, filteredAndSortedItems } = usePaginatedFilteredData(grants, filterConfig, filterGrants, filterConfig.sortCriteria, sortGrants, currentPage, grantsPerPage);
  const totalFilteredFunding = useMemo(() => {
    if (!filteredAndSortedItems) return 0;
    return filteredAndSortedItems.reduce((sum, grant) => sum + parseMaxFundingAmount(grant.fundingAmount), 0);
  }, [filteredAndSortedItems]);

  const handleFilterChange = useCallback((key, value) => {
    setFilterConfig(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }, []);
  const paginate = useCallback((page) => {
    if (page < 1 || (totalPages > 0 && page > totalPages)) return;
    setCurrentPage(page);
    document.getElementById('grants')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [totalPages]);
  const handlePerPageChange = useCallback((e) => {
    setGrantsPerPage(Number(e.target.value));
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
  const handleClearFilters = useCallback(() => {
    setFilterConfig({ searchTerm: '', locationFilter: [], categoryFilter: [], grantTypeFilter: '', sortCriteria: 'dueDate_asc' });
    setCurrentPage(1);
  }, []);
  const handleRemoveGrantFilter = useCallback((keyToRemove) => {
    const value = keyToRemove === 'locationFilter' || keyToRemove === 'categoryFilter' ? [] : '';
    handleFilterChange(keyToRemove, value);
  }, [handleFilterChange]);
  useEffect(() => { document.title = '1RFP - Find Your Next Funding Opportunity'; }, []);

  const activeGrantFilters = useMemo(() => {
    const filters = [];
    if (filterConfig.searchTerm) filters.push({ key: 'searchTerm', label: `Search: "${filterConfig.searchTerm}"` });
    if (filterConfig.locationFilter.length > 0) filters.push({ key: 'locationFilter', label: `Location: ${filterConfig.locationFilter.join(', ')}` });
    if (filterConfig.categoryFilter.length > 0) filters.push({ key: 'categoryFilter', label: `Category: ${filterConfig.categoryFilter.join(', ')}` });
    if (filterConfig.grantTypeFilter) filters.push({ key: 'grantTypeFilter', label: `Grant Type: ${filterConfig.grantTypeFilter}` });
    return filters;
  }, [filterConfig]);

  return (
    <>
      <HeroImpactSection grants={grants} />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <section id="funding-opportunity-intro" className="text-center pt-8 pb-12 md:pt-12 md:pb-16 mb-10 md:mb-12 scroll-mt-20 bg-white p-6 sm:p-8 md:p-10 rounded-xl shadow-lg border border-slate-200">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">Find Your Next Funding Opportunity</h2>
          <p className="text-md md:text-lg text-slate-600 mb-6 max-w-2xl mx-auto">Discover RFPs and grants tailored for nonprofits in the San Francisco Bay Area.</p>
          <div className="text-xs text-slate-500 bg-slate-100 border border-slate-200 px-3 py-2 rounded-md inline-flex items-center gap-1.5">
            <Info size={14} className="flex-shrink-0" />
            <span>Connecting to live grant data.</span>
          </div>
          <div className="mt-8 md:hidden">
            <button onClick={() => setIsMobileFiltersVisible(!isMobileFiltersVisible)} className="w-full inline-flex items-center justify-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50">
              {isMobileFiltersVisible ? 'Hide Filters' : 'Show Filters'}
              {activeGrantFilters.length > 0 && ( <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">{activeGrantFilters.length}</span> )}
            </button>
          </div>
          <FilterBar
            isMobileVisible={isMobileFiltersVisible}
            searchTerm={filterConfig.searchTerm}
            setSearchTerm={(value) => handleFilterChange('searchTerm', value)}
            locationFilter={filterConfig.locationFilter}
            setLocationFilter={(value) => handleFilterChange('locationFilter', value)}
            categoryFilter={filterConfig.categoryFilter}
            setCategoryFilter={(value) => handleFilterChange('categoryFilter', value)}
            sortCriteria={filterConfig.sortCriteria}
            setSortCriteria={(value) => handleFilterChange('sortCriteria', value)}
            uniqueCategories={uniqueCategories}
            uniqueLocations={uniqueLocations}
            uniqueGrantTypes={uniqueGrantTypes}
            pageType="grants"
            onClearFilters={handleClearFilters}
            activeFilters={activeGrantFilters}
            onRemoveFilter={handleRemoveGrantFilter}
          />
        </section>
        <section id="grants" className="mb-12 scroll-mt-20">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <h2 className="text-2xl font-semibold text-slate-800 text-center md:text-left">
              <span>Available Grants </span><span className="text-blue-600">({totalFilteredItems})</span>
              {totalFilteredItems > 0 && !loading && (
                <><span className="text-slate-300 mx-3" aria-hidden="true">·</span><span className="text-green-600">Total Funds (<AnimatedCounter targetValue={totalFilteredFunding} duration={1000} prefix="$" formatValue={formatCurrency}/>)</span></>
              )}
            </h2>
            <div className="relative w-full sm:w-auto">
              <label htmlFor="grants-per-page" className="sr-only">Grants per page</label>
              <Users size={16} className="text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
              <select id="grants-per-page" value={grantsPerPage} onChange={handlePerPageChange} className="w-full pl-10 pr-8 py-2.5 border border-slate-300 rounded-md bg-white text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none shadow-sm">
                {grantsPerPageOptions.map((option) => (<option key={option} value={option}>Show {option}</option>))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" size={16} />
            </div>
          </div>
          {loading ? (
            <div className="text-center text-slate-500 py-12 bg-white rounded-lg shadow-sm border border-slate-200">
              <Loader size={40} className="mx-auto text-blue-400 mb-3 animate-spin" />
              <p className="text-lg font-medium">Loading live grants...</p>
              <p className="text-sm">Connecting to the grant database.</p>
            </div>
          ) : currentList && currentList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentList.map((grant) => (<GrantCard key={grant.id} grant={grant} onOpenDetailModal={openDetail} />))}
            </div>
          ) : (
            <div className="text-center text-slate-500 py-12 bg-white rounded-lg shadow-sm border border-slate-200">
              <Search size={40} className="mx-auto text-slate-400 mb-3" />
              <p className="text-lg font-medium">No grants found for your criteria.</p>
              <p className="text-sm mb-4">Try using a broader search term or removing a filter to see more results.</p>
              <button onClick={handleClearFilters} className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors">
                <XCircle size={16} className="mr-2" />
                Clear All Filters
              </button>
            </div>
          )}
          {totalPages > 0 && currentList && currentList.length > 0 && !loading && (
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={paginate} />
          )}
        </section>
      </main>
      {isDetailModalOpen && selectedGrant && (
        <GrantDetailModal grant={selectedGrant} isOpen={isDetailModalOpen} onClose={closeDetail} />
      )}
    </>
  );
};

export default GrantsPageContent;