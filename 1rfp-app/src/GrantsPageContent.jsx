// src/GrantsPageContent.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from './supabaseClient.js';
import {
  Search,
  Users,
  MapPin,
  Calendar,
  DollarSign,
  Info,
  ChevronDown,
  ExternalLink,
  Zap,
  Clock,
  Target,
  IconBriefcase,
  BarChart3,
  ClipboardList,
  TrendingUp,
  Loader,
  XCircle,
  Heart,
  Bot
} from './components/Icons.jsx';
import GrantDetailModal from './GrantDetailModal.jsx';
import FilterBar from './components/FilterBar.jsx';
import Pagination from './components/Pagination.jsx';
import AnimatedCounter from './components/AnimatedCounter.jsx';
import { formatDate, getPillClasses, parseMaxFundingAmount, getGrantTypePillClasses } from './utils.js';
import { heroImpactCardsData } from './data.js';
import headerLogoImage from './assets/1rfp-logo.png';
import { COMMON_LOCATIONS, GRANT_STATUSES } from './constants.js';
import usePaginatedFilteredData from './hooks/usePaginatedFilteredData.js';
import { filterGrants } from './filtering.js';
import { sortGrants } from './sorting.js';

// Grant Card Component
const GrantCard = ({ grant, onOpenDetailModal }) => {
    const today = new Date();
    const grantAddedDate = new Date(grant.dateAdded);
    const timeDiff = today.getTime() - grantAddedDate.getTime();
    const dayDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
    const isNew = grant.dateAdded && dayDiff >= 0 && dayDiff <= 14;

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-xl transition-all duration-300 ease-in-out flex flex-col justify-between transform hover:-translate-y-1 relative overflow-hidden">
            {isNew && (
                <span
                    className="absolute top-0 right-[-1px] bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg z-10 uppercase tracking-wider shadow-sm"
                    title={`Added ${dayDiff === 0 ? 'today' : `${dayDiff} day${dayDiff > 1 ? 's' : ''} ago`}`}
                >
                    NEW
                </span>
            )}
            <div>
                <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-slate-800 group-hover:text-blue-600 transition-colors duration-200 pr-4">
                        {grant.title}
                    </h3>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span
                            className={`text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap ${getPillClasses(grant.category)}`}
                        >
                            {grant.category}
                        </span>
                        {grant.grantType && (
                            <span
                                className={`text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap ${getGrantTypePillClasses(grant.grantType)}`}
                            >
                                {grant.grantType}
                            </span>
                        )}
                    </div>
                </div>
                <p className="text-sm text-slate-600 mb-2 flex items-center">
                    <IconBriefcase size={15} className="w-4 h-4 mr-2 text-slate-400 flex-shrink-0" />
                    {grant.foundationName}
                </p>
                <p className="text-sm text-slate-500 mb-4 line-clamp-3 leading-relaxed">
                    {grant.description}
                </p>
                <div className="space-y-2.5 text-sm mb-5">
                    <div className="flex items-center text-slate-700">
                        <MapPin size={15} className="mr-2.5 text-blue-500 flex-shrink-0" />
                        <div><span className="font-medium text-slate-600">Location:</span> {grant.location}</div>
                    </div>
                    <div className="flex items-center text-slate-700">
                        <DollarSign size={15} className="mr-2.5 text-green-500 flex-shrink-0" />
                        <div><span className="font-medium text-slate-600">Funding:</span> {grant.fundingAmount}</div>
                    </div>
                    <div className="flex items-center text-slate-700">
                        <Calendar size={15} className="mr-2.5 text-red-500 flex-shrink-0" />
                        <div><span className="font-medium text-slate-600">Due:</span> {formatDate(grant.dueDate)}</div>
                    </div>
                    {grant.dateAdded && (
                        <div className="flex items-center text-slate-700">
                            <Clock size={15} className="mr-2.5 text-slate-400 flex-shrink-0" />
                            <div><span className="font-medium text-slate-600">Posted:</span> {formatDate(grant.dateAdded)}</div>
                        </div>
                    )}
                </div>
                    <div className="mt-4 pt-4 border-t border-slate-200 bg-slate-50 p-3 rounded-md">
                    <h4 className="text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">Eligibility Highlights:</h4>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{grant.eligibility}</p>
                </div>
            </div>
            <div className="mt-6">
                <button
                    onClick={() => onOpenDetailModal(grant)}
                    className="inline-flex items-center justify-center w-full px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ease-in-out transform hover:scale-105"
                >
                    View Grant Details <ExternalLink size={16} className="ml-2 opacity-80" />
                </button>
            </div>
        </div>
    );
};

const formatCurrency = (amount) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M+`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K+`;
    }
    return `${amount}`;
};

const HeroImageCard = ({ card, layoutClass, initialDelay = 0 }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    if (!card.imageUrls || card.imageUrls.length <= 1) return;

    const FLIP_DURATION = 700;
    const DISPLAY_DURATION = 10000;
    let flipTimeout;
    let interval;

    const flipAndSwitch = () => {
      setIsFlipped(false);
      flipTimeout = setTimeout(() => {
        setCurrentImageIndex((prev) => (prev + 1) % card.imageUrls.length);
        setIsFlipped(false);
      }, FLIP_DURATION / 2);
    };

    const startCycle = () => {
      interval = setInterval(flipAndSwitch, DISPLAY_DURATION + FLIP_DURATION);
    };

    const initialTimer = setTimeout(startCycle, initialDelay);

    return () => {
      clearTimeout(initialTimer);
      clearTimeout(flipTimeout);
      clearInterval(interval);
    };
  }, [card.imageUrls, initialDelay]);

  // Updated base classes with better positioning and sizing
  const baseClasses = `rounded-xl shadow-lg overflow-hidden relative group ${layoutClass} [perspective:1000px]`;
  const flipClasses = `
    w-full h-full
    transition-transform duration-700 ease-in-out
    [transform-style:preserve-3d]
    ${isFlipped ? '[transform:rotateY(180deg)]' : '[transform:rotateY(0deg)]'}
  `;
  
  return (
    <div className={baseClasses}>
      <div className={flipClasses}>
        <div className="absolute inset-0 w-full h-full [backface-visibility:hidden]">
          <img
            src={card.imageUrls[currentImageIndex]}
            alt={card.imageAlt}
            className="w-full h-full object-cover object-center"
            key={`front-${card.id}-${currentImageIndex}`}
            loading="lazy"
          />
        </div>
        <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <img
            src={card.imageUrls[(currentImageIndex + 1) % card.imageUrls.length]}
            alt={card.imageAlt}
            className="w-full h-full object-cover object-center"
            key={`back-${card.id}-${currentImageIndex}`}
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
};

const HeroImpactSection = ({ grants }) => {
  // Updated layout classes with better responsive behavior
  const layoutClasses = [
    'col-span-1 row-span-2 h-full min-h-[300px] md:min-h-[400px]', // Tall card
    'col-span-1 row-span-1 h-full min-h-[140px] md:min-h-[190px]', // Square cards
    'col-span-1 row-span-1 h-full min-h-[140px] md:min-h-[190px]',
    'col-span-1 row-span-1 h-full min-h-[140px] md:min-h-[190px]',
    'col-span-1 row-span-1 h-full min-h-[140px] md:min-h-[190px]'
  ];

  const totalAvailableFunding = useMemo(() => {
    return grants.reduce((sum, grant) => {
      return sum + parseMaxFundingAmount(grant.fundingAmount);
    }, 0);
  }, [grants]);

  const totalGrantsAvailable = grants.length;

  return (
    <section className="py-16 md:py-24 bg-white border-b border-slate-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-10 xl:gap-16 items-center">
          <div className="text-center lg:text-left">
            <div className="flex flex-col sm:flex-row gap-8 justify-center lg:justify-start mb-8">
              {totalGrantsAvailable > 0 && (
                <div className="text-left">
                  <div className="flex items-center gap-3">
                    <ClipboardList size={32} className="text-purple-500" />
                    <AnimatedCounter
                      targetValue={totalGrantsAvailable}
                      duration={2500}
                      step={1}
                      className="text-purple-600 text-4xl md:text-5xl font-bold"
                    />
                  </div>
                  <p className="text-sm font-medium text-slate-500 mt-1 ml-1">Total Grants Available</p>
                </div>
              )}
              {totalAvailableFunding > 0 && (
                <div className="text-left">
                  <div className="flex items-center gap-3">
                    <TrendingUp size={32} className="text-green-500" />
                    <AnimatedCounter
                      targetValue={totalAvailableFunding}
                      duration={2500}
                      step={1}
                      prefix="$"
                      formatValue={formatCurrency}
                      className="text-green-600 text-4xl md:text-5xl font-bold"
                    />
                  </div>
                  <p className="text-sm font-medium text-slate-500 mt-1 ml-1">Total Funding Opportunities</p>
                </div>
              )}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-slate-900 mb-4 leading-tight">
              A Smarter Path to <span className="text-blue-600">Funding.</span>
            </h1>
            <p className="text-lg text-slate-600 mb-6 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Our mission is to empower Bay Area nonprofits by transforming grant discovery. We combine AI-powered data aggregation with community-driven insights to create a single, comprehensive, and easy-to-use platform.
            </p>
             <p className="text-lg text-slate-600 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Spend less time searching and more time making an impact.
            </p>
            <div className="flex justify-center lg:justify-start">
              <a href="#funding-opportunity-intro" className="inline-flex items-center justify-center px-8 py-3.5 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 ease-in-out shadow-md hover:shadow-lg transform hover:scale-105">
                Explore Grants Now <Search size={20} className="ml-2.5" />
              </a>
            </div>
          </div>
          
          {/* Updated grid with explicit heights and better responsive behavior */}
          <div className="w-full">
            <div className="grid grid-cols-2 gap-4 h-[500px] md:h-[600px]">
              {heroImpactCardsData.map((card, index) => {
                const IconComponent = {
                  'discover-time': Clock,
                  'bay-area-nonprofits': Users,
                  'faster-applications': Zap,
                  'tool-consolidation': Target,
                  'community-impact': BarChart3
                }[card.id];

                return (
                  <HeroImageCard
                    key={card.id}
                    card={{ 
                      ...card, 
                      icon: IconComponent ? <IconComponent size={18} className={
                        card.id === 'discover-time' ? 'text-red-400' : 
                        card.id === 'bay-area-nonprofits' ? 'text-indigo-400' : 
                        card.id === 'faster-applications' ? 'text-yellow-400' : 
                        card.id === 'tool-consolidation' ? 'text-green-400' : 
                        'text-purple-400'
                      } /> : null 
                    }}
                    layoutClass={layoutClasses[index] || 'col-span-1 h-full'}
                    initialDelay={index * 300}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const GrantsPageContent = () => {
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterConfig, setFilterConfig] = useState({
    searchTerm: '',
    locationFilter: '',
    categoryFilter: '',
    minFunding: '',
    maxFunding: '',
    grantTypeFilter: '',
    grantStatusFilter: '',
    sortCriteria: 'dueDate_asc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [grantsPerPage, setGrantsPerPage] = useState(12);
  const [isDetailModalOpen, setIsDetailModal] = useState(false);
  const [selectedGrant, setSelectedGrant] = useState(null);
  const [isMobileFiltersVisible, setIsMobileFiltersVisible] = useState(false);

  useEffect(() => {
    const fetchGrants = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('grants')
          .select('*');
        
        if (error) {
          throw error;
        }

        if (data) {
          const formattedData = data.map(grant => ({
              ...grant,
              foundationName: grant.foundation_name,
              fundingAmount: grant.funding_amount_text,
              dueDate: grant.due_date,
              dateAdded: grant.date_added,
              grantType: grant.grant_type
          }));
          setGrants(formattedData);
        }
      } catch (error) {
        console.error('Error fetching grants:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGrants();
  }, []);

  const uniqueCategories = useMemo(() => {
    if (!grants) return [];
    return Array.from(new Set(grants.map(g => g.category).filter(Boolean))).sort();
  }, [grants]);

  const uniqueGrantTypes = useMemo(() => {
    if (!grants) return [];
    return Array.from(new Set(grants.map(g => g.grantType).filter(Boolean))).sort();
  }, [grants]);


  const grantsPerPageOptions = [6, 9, 12, 15, 21, 24, 30, 45, 60, 86];

  const { paginatedItems: currentList, totalPages, totalFilteredItems, filteredAndSortedItems } = usePaginatedFilteredData(
    grants,
    filterConfig,
    filterGrants,
    filterConfig.sortCriteria,
    sortGrants,
    currentPage,
    grantsPerPage
  );
  
  const totalFilteredFunding = useMemo(() => {
    if (!filteredAndSortedItems) return 0;
    return filteredAndSortedItems.reduce((sum, grant) => {
      return sum + parseMaxFundingAmount(grant.fundingAmount);
    }, 0);
  }, [filteredAndSortedItems]);


  const handleFilterChange = (key, value) => {
    setFilterConfig(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const paginate = useCallback((page) => {
    if (page < 1 || (totalPages > 0 && page > totalPages)) return;
    setCurrentPage(page);
    const grantsSection = document.getElementById('grants');
    if (grantsSection) {
      const offset = 80;
      const position = grantsSection.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: position, behavior: 'smooth' });
    }
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
    setFilterConfig({
      searchTerm: '',
      locationFilter: '',
      categoryFilter: '',
      minFunding: '',
      maxFunding: '',
      grantTypeFilter: '',
      grantStatusFilter: '',
      sortCriteria: 'dueDate_asc'
    });
    setCurrentPage(1);
  }, []);

  const handleRemoveGrantFilter = useCallback((keyToRemove) => {
    handleFilterChange(keyToRemove, '');
  }, []);

  useEffect(() => {
    document.title = '1RFP - Find Your Next Funding Opportunity';
  }, []);

  const activeGrantFilters = useMemo(() => {
    const filters = [];
    if (filterConfig.searchTerm) filters.push({ key: 'searchTerm', label: `Search: "${filterConfig.searchTerm}"` });
    if (filterConfig.locationFilter) filters.push({ key: 'locationFilter', label: `Location: ${filterConfig.locationFilter}` });
    if (filterConfig.categoryFilter) filters.push({ key: 'categoryFilter', label: `Category: ${filterConfig.categoryFilter}` });
    if (filterConfig.grantTypeFilter) filters.push({ key: 'grantTypeFilter', label: `Grant Type: ${filterConfig.grantTypeFilter}` });
    if (filterConfig.grantStatusFilter) filters.push({ key: 'grantStatusFilter', label: `Status: ${filterConfig.grantStatusFilter}` });
    if (filterConfig.minFunding) filters.push({ key: 'minFunding', label: `Min Funding: $${parseInt(filterConfig.minFunding).toLocaleString()}` });
    if (filterConfig.maxFunding) filters.push({ key: 'maxFunding', label: `Max Funding: $${parseInt(filterConfig.maxFunding).toLocaleString()}` });
    return filters;
  }, [filterConfig]);

  return (
    <>
      <HeroImpactSection grants={grants} />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <section id="funding-opportunity-intro" className="text-center pt-8 pb-12 md:pt-12 md:pb-16 mb-10 md:mb-12 scroll-mt-20 bg-white p-6 sm:p-8 md:p-10 rounded-xl shadow-lg border border-slate-200">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">
            Find Your Next Funding Opportunity
          </h2>
          <p className="text-md md:text-lg text-slate-600 mb-6 max-w-2xl mx-auto">
            Discover RFPs and grants tailored for nonprofits in the San Francisco Bay Area.
          </p>
          <div className="text-xs text-slate-500 bg-slate-100 border border-slate-200 px-3 py-2 rounded-md inline-flex items-center gap-1.5">
            <Info size={14} className="flex-shrink-0" />
            <span>Connecting to live grant data.</span>
          </div>

           <div className="mt-8 md:hidden">
              <button
                  onClick={() => setIsMobileFiltersVisible(!isMobileFiltersVisible)}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
              >
                  {isMobileFiltersVisible ? 'Hide Filters' : 'Show Filters'}
                  {activeGrantFilters.length > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
                          {activeGrantFilters.length}
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
            categoryFilter={filterConfig.categoryFilter}
            setCategoryFilter={(value) => handleFilterChange('categoryFilter', value)}
            minFunding={filterConfig.minFunding}
            setMinFunding={(value) => handleFilterChange('minFunding', value)}
            maxFunding={filterConfig.maxFunding}
            setMaxFunding={(value) => handleFilterChange('maxFunding', value)}
            grantTypeFilter={filterConfig.grantTypeFilter}
            setGrantTypeFilter={(value) => handleFilterChange('grantTypeFilter', value)}
            grantStatusFilter={filterConfig.grantStatusFilter}
            setGrantStatusFilter={(value) => handleFilterChange('grantStatusFilter', value)}
            sortCriteria={filterConfig.sortCriteria}
            setSortCriteria={(value) => handleFilterChange('sortCriteria', value)}
            uniqueCategories={uniqueCategories}
            uniqueLocations={COMMON_LOCATIONS}
            uniqueGrantTypes={uniqueGrantTypes}
            uniqueGrantStatuses={GRANT_STATUSES}
            pageType="grants"
            onClearFilters={handleClearFilters}
            activeFilters={activeGrantFilters}
            onRemoveFilter={handleRemoveGrantFilter}
          />
        </section>

        <section id="grants" className="mb-12 scroll-mt-20">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <h2 className="text-2xl font-semibold text-slate-800 text-center md:text-left">
              <span>Available Grants </span>
              <span className="text-blue-600">({totalFilteredItems})</span>
              
              {totalFilteredItems > 0 && !loading && (
                <>
                  <span className="text-slate-300 mx-3" aria-hidden="true">·</span>
                  <span className="text-green-600">
                    Total Funds (<AnimatedCounter
                        targetValue={totalFilteredFunding}
                        duration={1000}
                        prefix="$"
                        formatValue={formatCurrency}
                      />)
                  </span>
                </>
              )}
            </h2>
            <div className="flex flex-col sm:flex-row gap-3 items-center w-full sm:w-auto">
              <div className="relative w-full sm:w-auto">
                <label htmlFor="grants-per-page" className="sr-only">Grants per page</label>
                <Users size={16} className="text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                <select
                  id="grants-per-page"
                  value={grantsPerPage}
                  onChange={handlePerPageChange}
                  className="w-full pl-10 pr-8 py-2.5 border border-slate-300 rounded-md bg-white text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none shadow-sm"
                >
                  {grantsPerPageOptions.map((option) => (
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
              <Loader size={40} className="mx-auto text-blue-400 mb-3 animate-spin" />
              <p className="text-lg font-medium">Loading live grants...</p>
              <p className="text-sm">Connecting to the grant database.</p>
            </div>
          ) : currentList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentList.map((grant) => (
                <GrantCard key={grant.id} grant={grant} onOpenDetailModal={openDetail} />
              ))}
            </div>
          ) : (
            <div className="text-center text-slate-500 py-12 bg-white rounded-lg shadow-sm border border-slate-200">
              <Search size={40} className="mx-auto text-slate-400 mb-3" />
              <p className="text-lg font-medium">No grants found for your criteria.</p>
              <p className="text-sm mb-4">Try using a broader search term or removing a filter to see more results.</p>
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                <XCircle size={16} className="mr-2" />
                Clear All Filters
              </button>
            </div>
          )}
          {totalPages > 0 && currentList.length > 0 && !loading && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={paginate}
              activeColorClass="bg-blue-600 text-white border-blue-600"
              inactiveColorClass="bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
              disabledColorClass="disabled:opacity-50"
            />
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
