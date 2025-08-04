// src/components/portal/ExploreFundsTab.jsx
import React from 'react';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  Grid3X3, 
  List, 
  TrendingUp, 
  XCircle, 
  Heart,
  DollarSign,
  Calendar,
  Users,
  Bookmark,
  Sparkles
} from '../Icons.jsx';
import GrantCard from '../GrantCard.jsx';
import FilterBar from '../FilterBar.jsx';
import Pagination from '../Pagination.jsx';
import AnimatedCounter from '../AnimatedCounter.jsx';
import { parseMaxFundingAmount } from '../../utils.js';

// Use the same taxonomy display names from GrantsPageContent
const TAXONOMY_DISPLAY_NAMES = {
  'nonprofit.501c3': '501(c)(3)',
  'nonprofit.501c4': '501(c)(4)',
  'nonprofit.501c6': 'Business Leagues',
  'education.university': 'Universities',
  'education.k12': 'K-12 Schools',
  'education.research': 'Research Institutions',
  'healthcare.hospital': 'Hospitals',
  'healthcare.clinic': 'Clinics',
  'government.federal': 'Federal Agencies',
  'government.state': 'State Agencies',
  'government.local': 'Local Government',
  'foundation.family': 'Family Foundations',
  'foundation.community': 'Community Foundations',
  'foundation.corporate': 'Corporate Foundations',
  'forprofit.startup': 'Startups',
  'forprofit.socialenterprise': 'Social Enterprises',
  'forprofit.socialenterprise.bcorp': 'B-Corps',
  'religious.church': 'Religious Orgs'
};

const formatCurrency = (amount) => {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M+`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K+`;
  return `${amount.toLocaleString()}`;
};

// Use the same GrantListItem from GrantsPageContent
const GrantListItem = ({ grant, onOpenDetailModal, isSaved, onSave, onUnsave, session }) => {
  const dueDateText = grant.dueDate ? new Date(grant.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Rolling';
  const fundingText = grant.fundingAmount ? formatCurrency(parseMaxFundingAmount(grant.fundingAmount.toString())) : 'Not Specified';

  const handleBookmarkClick = (e) => {
    e.stopPropagation();
    if (!session) return;
    isSaved ? onUnsave(grant.id) : onSave(grant.id);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const words = name.split(' ');
    return words.length > 1 
      ? (words[0][0] + words[1][0]).toUpperCase() 
      : name.substring(0, 2).toUpperCase();
  };

  return (
    <div 
      onClick={() => onOpenDetailModal(grant)} 
      className="group bg-white p-4 md:p-5 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-2xl transition-all duration-300 flex flex-col md:flex-row items-start md:items-center gap-4 cursor-pointer transform hover:-translate-y-1"
    >
      <div className="flex-shrink-0">
        {grant.organization?.image_url ? (
          <img 
            src={grant.organization.image_url} 
            alt={`${grant.foundationName} logo`}
            className="h-14 w-14 md:h-16 md:w-16 rounded-xl object-contain border-2 border-white shadow-lg group-hover:shadow-xl transition-shadow duration-300" 
          />
        ) : (
          <div className="h-14 w-14 md:h-16 md:w-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:shadow-xl transition-shadow duration-300">
            {getInitials(grant.foundationName)}
          </div>
        )}
      </div>
      
      <div className="flex-grow min-w-0 w-full">
        <div className="flex items-center gap-3 mb-1.5">
          <p className="text-sm text-slate-500 font-medium truncate">{grant.foundationName}</p>
          {grant.grantType && (
            <span className="flex-shrink-0 text-xs bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 px-2 py-0.5 rounded-full font-medium border border-blue-200">
              {grant.grantType}
            </span>
          )}
        </div>
        <h4 className="font-bold text-slate-800 text-lg mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
          {grant.title}
        </h4>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
          <div className="flex items-center gap-1.5" title="Funding Amount">
            <DollarSign size={14} className="text-green-600" />
            <span className="font-semibold text-green-700">{fundingText}</span>
          </div>
          <div className="flex items-center gap-1.5" title="Due Date">
            <Calendar size={14} className="text-red-600" />
            <span className="font-semibold text-red-700">{dueDateText}</span>
          </div>
          {grant.eligible_organization_types && grant.eligible_organization_types.length > 0 && (
            <div className="flex items-center gap-1.5" title="Eligibility">
              <Users size={14} className="text-indigo-600" />
              <span className="font-semibold text-indigo-700">
                {TAXONOMY_DISPLAY_NAMES[grant.eligible_organization_types[0]] || grant.eligible_organization_types[0]}
                {grant.eligible_organization_types.length > 1 && (
                  <span className="text-slate-500 font-medium"> +{grant.eligible_organization_types.length - 1} more</span>
                )}
              </span>
            </div>
          )}
        </div>
      </div>
      
      <div className="w-full md:w-auto flex-shrink-0 flex flex-row items-center gap-3 mt-4 md:mt-0">
        {session && (
          <button
            onClick={handleBookmarkClick}
            className={`p-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 ${
              isSaved 
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white' 
                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
            }`}
            aria-label={isSaved ? 'Unsave grant' : 'Save grant'}
          >
            <Bookmark size={18} fill={isSaved ? 'currentColor' : 'none'} />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onOpenDetailModal(grant); }}
          className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
        >
          <Sparkles size={16} />
          Details
        </button>
      </div>
    </div>
  );
};

const ExploreFundsTab = ({
  // State
  showFilters,
  setShowFilters,
  filterConfig,
  handleFilterChange,
  activeGrantFilters,
  loading,
  currentList,
  totalFilteredItems,
  totalFilteredFunding,
  grantsPerPage,
  handlePerPageChange,
  viewMode,
  setViewMode,
  totalPages,
  currentPage,
  paginate,
  handleClearFilters,
  
  // Grant handlers
  session,
  savedGrantIds,
  handleSaveGrant,
  handleUnsaveGrant,
  openDetail,
  handleFilterByCategory,
  
  // Filter bar props
  filterBarProps,
  formatCurrency
}) => {
  return (
    <div>
      {/* Search and Filter Section */}
      <div className="mb-8">
        <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-800">Explore Available Grants</h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
              {activeGrantFilters.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-blue-600 bg-blue-100 rounded-full">
                  {activeGrantFilters.length}
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="mb-6">
              <FilterBar {...filterBarProps} isMobileVisible={true} />
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search grants and opportunities..."
              value={filterConfig.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 text-center sm:text-left w-full">
          <h2 className="text-2xl md:text-3xl font-bold">
            <span className="text-slate-800">Available Grants </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 font-extrabold">
              ({totalFilteredItems})
            </span>
          </h2>
          {totalFilteredItems > 0 && !loading && (
            <div className="mt-2 sm:mt-0 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full border border-green-200 shadow-sm">
              <TrendingUp size={20} className="text-green-600" />
              <span className="text-green-700 font-semibold">
                <AnimatedCounter 
                  targetValue={totalFilteredFunding} 
                  duration={1000} 
                  prefix="$" 
                  formatValue={formatCurrency}
                /> Available
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto flex-shrink-0">
          <div className="relative w-full sm:w-auto">
            <select 
              id="grants-per-page" 
              value={grantsPerPage} 
              onChange={handlePerPageChange} 
              className="w-full pl-4 pr-10 py-3 border border-slate-300 rounded-xl bg-white text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              {[6, 12, 24, 48].map((option) => (
                <option key={option} value={option}>Show {option}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-slate-400" size={16} />
          </div>
          
          <div className="flex items-center bg-white rounded-xl border border-slate-300 p-1 shadow-sm">
            <button 
              onClick={() => setViewMode('grid')} 
              className={`p-2.5 rounded-lg transition-all duration-300 flex items-center gap-2 ${viewMode === 'grid' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}
              title="Grid View"
            >
              <Grid3X3 size={18}/>
            </button>
            <button 
              onClick={() => setViewMode('list')} 
              className={`p-2.5 rounded-lg transition-all duration-300 flex items-center gap-2 ${viewMode === 'list' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}
              title="List View"
            >
              <List size={18}/>
            </button>
          </div>
        </div>
      </div>

      {/* Grants Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Heart className="w-8 h-8 text-blue-500 animate-pulse mx-auto mb-4" />
            <p className="text-slate-700 font-medium">Loading grants...</p>
          </div>
        </div>
      ) : currentList && currentList.length > 0 ? (
        <>
          {viewMode === 'grid' ? (
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8`}>
              {currentList.map((grant) => ( 
                <GrantCard 
                  key={grant.id} 
                  grant={grant} 
                  session={session} 
                  isSaved={savedGrantIds.has(grant.id)} 
                  onSave={handleSaveGrant} 
                  onUnsave={handleUnsaveGrant} 
                  onOpenDetailModal={openDetail} 
                  onFilterByCategory={handleFilterByCategory} 
                /> 
              ))}
            </div>
          ) : (
            <div className="space-y-4 mb-8">
              {currentList.map((grant) => ( 
                <GrantListItem 
                  key={grant.id} 
                  grant={grant} 
                  session={session} 
                  isSaved={savedGrantIds.has(grant.id)} 
                  onSave={handleSaveGrant} 
                  onUnsave={handleUnsaveGrant} 
                  onOpenDetailModal={openDetail} 
                /> 
              ))}
            </div>
          )}

          {totalPages > 0 && (
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={paginate} />
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
            <h3 className="text-2xl font-bold text-slate-800 mb-3">No grants found</h3>
            <p className="text-slate-600 mb-6">Try adjusting your search criteria or removing a filter to see more results.</p>
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
    </div>
  );
};

export default ExploreFundsTab;