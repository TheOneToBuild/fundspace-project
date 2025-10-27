import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { IconBriefcase, MapPin, DollarSign, Calendar, ExternalLink, ShieldCheck, Bookmark, Users, Building2, Clock, Zap, Target, ChevronRight, Sparkles } from './Icons.jsx';
import { formatDate, getPillClasses, getGrantTypePillClasses, formatFundingDisplay } from '../utils.js';

const TAXONOMY_DISPLAY_NAMES = {
  'nonprofit.501c3': '501(c)(3) Nonprofits',
  'nonprofit.501c4': '501(c)(4) Organizations',
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
  'forprofit.socialenterprise.bcorp': 'B-Corporations',
  'religious.church': 'Religious Organizations'
};

const getEnhancedPillClasses = (categoryName) => {
  const categoryMap = {
    'Arts': 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-200',
    'Culture': 'bg-gradient-to-r from-fuchsia-100 to-rose-100 text-fuchsia-700 border-fuchsia-200',
    'Education': 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-blue-200',
    'Health': 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border-emerald-200',
    'Healthcare': 'bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-700 border-teal-200',
    'Environment': 'bg-gradient-to-r from-green-100 to-lime-100 text-green-700 border-green-200',
    'Housing': 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 border-orange-200',
    'Technology': 'bg-gradient-to-r from-cyan-100 to-sky-100 text-cyan-700 border-cyan-200',
    'Innovation': 'bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 border-violet-200',
    'Community': 'bg-gradient-to-r from-rose-100 to-pink-100 text-rose-700 border-rose-200',
    'Community Development': 'bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border-red-200',
    'Community Engagement': 'bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700 border-pink-200',
    'Social Impact': 'bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-700 border-indigo-200',
    'Research': 'bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700 border-slate-200',
    'Medical Research': 'bg-gradient-to-r from-zinc-100 to-stone-100 text-zinc-700 border-zinc-200',
    'Mental Health': 'bg-gradient-to-r from-purple-100 to-violet-100 text-purple-700 border-purple-200',
    'Health Equity': 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border-emerald-200',
    'Chronic Disease Prevention': 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border-amber-200',
    'Pediatric Health': 'bg-gradient-to-r from-yellow-100 to-lime-100 text-yellow-700 border-yellow-200',
    'Child Health Research': 'bg-gradient-to-r from-lime-100 to-green-100 text-lime-700 border-lime-200',
    'Pediatric Education': 'bg-gradient-to-r from-sky-100 to-blue-100 text-sky-700 border-sky-200',
    'Flood Management': 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-blue-200',
    'Habitat Restoration': 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200',
    'Climate Justice': 'bg-gradient-to-r from-teal-100 to-green-100 text-teal-700 border-teal-200',
    'Climate Change': 'bg-gradient-to-r from-sky-100 to-indigo-100 text-sky-700 border-sky-200',
    'Renewable Energy': 'bg-gradient-to-r from-yellow-100 to-green-100 text-yellow-700 border-yellow-200',
    'Sustainability': 'bg-gradient-to-r from-emerald-100 to-lime-100 text-emerald-700 border-emerald-200',
    'Conservation': 'bg-gradient-to-r from-green-100 to-teal-100 text-green-700 border-green-200',
    'Wildlife': 'bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-700 border-teal-200',
    'Food Production Workers\' Health and Safety': 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 border-orange-200',
    'Worker Safety': 'bg-gradient-to-r from-red-100 to-orange-100 text-red-700 border-red-200',
    'Labor Rights': 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border-purple-200',
    'Workplace Safety': 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border-amber-200',
    'Sports': 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 border-orange-200',
    'Recreation': 'bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700 border-pink-200',
    'Youth Development': 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200',
    'Senior Services': 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border-gray-200',
    'Disability Services': 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-blue-200',
    'Economic Development': 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border-emerald-200',
    'Food Security': 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border-amber-200',
    'Agriculture': 'bg-gradient-to-r from-lime-100 to-yellow-100 text-lime-700 border-lime-200',
    'Social Justice': 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border-red-200',
    'Human Rights': 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border-purple-200',
    'Civil Rights': 'bg-gradient-to-r from-indigo-100 to-violet-100 text-indigo-700 border-indigo-200',
    'Immigration': 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-blue-200',
    'Criminal Justice': 'bg-gradient-to-r from-slate-100 to-zinc-100 text-slate-700 border-slate-200',
    'International Development': 'bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-700 border-cyan-200',
    'Global Health': 'bg-gradient-to-r from-teal-100 to-emerald-100 text-teal-700 border-teal-200',
    'Disaster Relief': 'bg-gradient-to-r from-red-100 to-orange-100 text-red-700 border-red-200',
    'Emergency Services': 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 border-orange-200',
    'Public Safety': 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border-amber-200'
  };
  return categoryMap[categoryName] || 'bg-gradient-to-r from-slate-100 to-zinc-100 text-slate-700 border-slate-200';
};

const getOrgTypePillClasses = (taxonomyCode) => {
  const typeMap = {
    'nonprofit': 'bg-gradient-to-r from-rose-100 to-red-100 text-rose-700 border-rose-200',
    'education': 'bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-700 border-indigo-200',
    'healthcare': 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border-emerald-200',
    'government': 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-blue-200',
    'foundation': 'bg-gradient-to-r from-purple-100 to-violet-100 text-purple-700 border-purple-200',
    'forprofit': 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200',
    'religious': 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border-amber-200',
    'international': 'bg-gradient-to-r from-cyan-100 to-teal-100 text-cyan-700 border-cyan-200'
  };
  const prefix = taxonomyCode.split('.')[0];
  return typeMap[prefix] || 'bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700 border-slate-200';
};

const getLocationPillClasses = (locationName) => {
  const locationMap = {
    'San Francisco': 'bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border-red-200',
    'San Francisco County': 'bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border-red-200',
    'Alameda': 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 border-orange-200',
    'Alameda County': 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 border-orange-200',
    'Contra Costa': 'bg-gradient-to-r from-yellow-100 to-lime-100 text-yellow-700 border-yellow-200',
    'Contra Costa County': 'bg-gradient-to-r from-yellow-100 to-lime-100 text-yellow-700 border-yellow-200',
    'San Mateo': 'bg-gradient-to-r from-lime-100 to-green-100 text-lime-700 border-lime-200',
    'San Mateo County': 'bg-gradient-to-r from-lime-100 to-green-100 text-lime-700 border-lime-200',
    'Santa Clara': 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border-emerald-200',
    'Santa Clara County': 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border-emerald-200',
    'Marin': 'bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-700 border-teal-200',
    'Marin County': 'bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-700 border-teal-200',
    'Sonoma': 'bg-gradient-to-r from-sky-100 to-blue-100 text-sky-700 border-sky-200',
    'Sonoma County': 'bg-gradient-to-r from-sky-100 to-blue-100 text-sky-700 border-sky-200',
    'Solano': 'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 border-indigo-200',
    'Solano County': 'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 border-indigo-200',
    'Napa': 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-200',
    'Napa County': 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-200',
    'Oakland': 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border-amber-200',
    'Berkeley': 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-blue-200',
    'San Jose': 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200',
    'Fremont': 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 border-orange-200',
    'Hayward': 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 border-yellow-200',
    'Sunnyvale': 'bg-gradient-to-r from-cyan-100 to-teal-100 text-cyan-700 border-cyan-200',
    'Mountain View': 'bg-gradient-to-r from-teal-100 to-emerald-100 text-teal-700 border-teal-200',
    'Palo Alto': 'bg-gradient-to-r from-lime-100 to-green-100 text-lime-700 border-lime-200',
    'Redwood City': 'bg-gradient-to-r from-green-100 to-lime-100 text-green-700 border-green-200',
    'Bay Area': 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-blue-200',
    'San Francisco Bay Area': 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-blue-200',
    'Northern California': 'bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-700 border-indigo-200',
    'California': 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border-purple-200',
    'United States': 'bg-gradient-to-r from-red-100 to-blue-100 text-slate-700 border-slate-200',
    'National': 'bg-gradient-to-r from-slate-100 to-zinc-100 text-slate-700 border-slate-200',
    'International': 'bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-700 border-teal-200'
  };
  if (locationMap[locationName]) {
    return locationMap[locationName];
  }
  const locationLower = locationName.toLowerCase();
  for (const [key, value] of Object.entries(locationMap)) {
    if (locationLower.includes(key.toLowerCase())) {
      return value;
    }
  }
  return locationMap[locationName] || 'bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700 border-slate-200';
};

const GrantCard = ({ grant, viewMode = 'grid', onClick, onFilterByCategory, onSaveToggle, isSaved, session, userOrganizationType = null }) => {
    // Add list view rendering
    if (viewMode === 'list') {
  // Helper function to format funding amounts
  const formatFunding = (amount) => {
    if (!amount) return 'Not specified';
    const numStr = amount.toString().replace(/[,$]/g, '');
    const num = parseFloat(numStr);
    if (isNaN(num)) return amount;
    
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(0)}K`;
    }
    return `$${num.toLocaleString()}`;
  };

  // Helper function to format locations
  const formatLocations = (locations) => {
    if (!locations || locations.length === 0) return [];
    
    // Check if it includes all major counties (simplified check)
    const majorCounties = ['Alameda County', 'Contra Costa County', 'Marin County', 'San Francisco County', 'San Mateo County', 'Santa Clara County'];
    const hasAllMajor = majorCounties.every(county => 
      locations.some(loc => loc.name === county)
    );
    
    if (hasAllMajor && locations.length >= 6) {
      return [{ name: 'All Counties' }];
    }
    
    return locations.slice(0, 3);
  };

  // Calculate days left
  const getDaysLeft = (dueDate) => {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysLeft = getDaysLeft(grant.dueDate);
  const formattedLocations = formatLocations(grant.locations);

  return (
    <div 
      className="flex items-start py-3 px-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      {/* Organization logo - aligned with title */}
      <div className="flex-shrink-0 mr-3 mt-1">
        {grant.organization?.image_url || grant.funder_logo_url ? (
          <img 
            src={grant.organization?.image_url || grant.funder_logo_url} 
            alt={grant.foundationName}
            className="w-10 h-10 rounded-lg object-cover"
          />
        ) : (
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            {grant.foundationName?.charAt(0) || 'G'}
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-gray-900 truncate leading-tight">{grant.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{grant.foundationName}</p>
            <p className="text-sm text-gray-500 mt-1 line-clamp-2 leading-relaxed">
              {grant.description?.substring(0, 120)}...
            </p>
          </div>
          
          {/* Right side - Key details */}
          <div className="ml-4 flex-shrink-0 text-right min-w-[140px] flex flex-col items-end">
            <div className="text-lg font-semibold text-green-600">
              {formatFunding(grant.fundingAmount || grant.max_funding_amount)}
            </div>
            <div className="flex items-center mt-1 space-x-2">
              {daysLeft !== null && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  daysLeft <= 7 ? 'bg-red-100 text-red-700' :
                  daysLeft <= 30 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {daysLeft > 0 ? `${daysLeft}d left` : daysLeft === 0 ? 'Due today' : 'Overdue'}
                </span>
              )}
              {!grant.dueDate && (
                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                  Rolling
                </span>
              )}
              
              {/* Bigger bookmark button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSaveToggle(grant.id);
                }}
                className={`p-2 rounded-lg transition-colors ${
                  isSaved ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <Bookmark className="w-5 h-5" fill={isSaved ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Tags row - more compact */}
        <div className="flex items-center mt-2 space-x-2 text-xs flex-wrap">
          {/* Location tags */}
          {formattedLocations.map((location, idx) => (
            <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {location.name}
            </span>
          ))}
          
          {/* Category tags */}
          {grant.categories?.slice(0, 2).map((category, idx) => (
            <span key={idx} className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
              {category.name}
            </span>
          ))}
          
          {/* Grant type */}
          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
            {grant.grant_type || grant.grantType || 'Grant'}
          </span>
          
          {/* Due date */}
          <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
            Due: {grant.dueDate ? new Date(grant.dueDate).toLocaleDateString() : 'Rolling'}
          </span>
        </div>
      </div>
    </div>
  );
}

    const [isHovered, setIsHovered] = useState(false);
    
    // Common data processing
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let isEndingSoon = false;
    let daysUntilDue = null;
    let isExpired = false;

    if (grant.dueDate) {
        const dueDate = new Date(grant.dueDate);
        daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
        isEndingSoon = daysUntilDue >= 0 && daysUntilDue <= 14;
        isExpired = dueDate < today;
    }

    const isEligibleForUser = useMemo(() => {
        if (!userOrganizationType || !grant.eligible_organization_types) {
            return true;
        }
        return grant.eligible_organization_types.some(eligible => 
            eligible.startsWith(userOrganizationType) || eligible === userOrganizationType
        );
    }, [userOrganizationType, grant.eligible_organization_types]);

    const getInitials = (name) => {
        if (!name) return '?';
        const words = name.split(' ');
        if (words.length > 1) {
            return (words[0][0] + words[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const formatFunding = (amount) => {
        if (typeof amount === 'string' && amount.includes('$')) return amount;
        const cleanAmount = amount?.toString().replace(/[^0-9]/g, '') || '0';
        const num = parseInt(cleanAmount);
        if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
        return `$${num.toLocaleString()}`;
    };

    const handleSaveClick = (e) => {
        e.stopPropagation();
        onSaveToggle(grant.id);
    };

    return (
        <div 
            className={`group relative bg-white rounded-xl border border-slate-200 overflow-hidden transition-all duration-300 ease-out transform hover:-translate-y-1 hover:shadow-lg cursor-pointer h-full flex flex-col ${
                isHovered ? 'scale-[1.01]' : ''
            } ${isEligibleForUser ? '' : 'opacity-80'} ${isExpired ? 'opacity-60' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => onClick(grant)}
        >
            <div className="relative">
                <div className="h-28 bg-gradient-to-br from-slate-100 via-white to-slate-100">
                    {grant.organization?.banner_image_url && (
                        <img
                            src={grant.organization.banner_image_url}
                            alt={`${grant.foundationName || 'Funder'} banner`}
                            className="w-full h-full object-cover"
                        />
                    )}
                </div>
                <div
                    className="absolute bottom-0 left-4 translate-y-1/2 transform transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); navigate(`/organizations/${grant.funderSlug}`); }}
                >
                    {grant.organization?.image_url ? (
                        <img
                            src={grant.organization.image_url}
                            alt={`${grant.foundationName || 'Funder'} logo`}
                            className="h-16 w-16 rounded-xl object-cover border-4 border-white shadow-lg bg-white"
                        />
                    ) : (
                         <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-bold text-xl shadow-lg border-4 border-white">
                            {getInitials(grant.foundationName)}
                        </div>
                    )}
                </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
                {!isEligibleForUser && (
                    <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                        <ShieldCheck size={10} />
                        Check
                    </div>
                )}
                {isExpired && (
                    <div className="bg-gradient-to-r from-slate-400 to-slate-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                        EXPIRED
                    </div>
                )}
                {isEndingSoon && !isExpired && (
                    <div className="bg-gradient-to-r from-red-400 to-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                        {daysUntilDue === 1 ? 'DUE TOMORROW' : 
                         daysUntilDue === 0 ? 'DUE TODAY' : 
                         `${daysUntilDue}d left`}
                    </div>
                )}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                    <Bookmark size={10} fill="currentColor" />
                    {grant.save_count || 0}
                </div>
            </div>
            <div className="p-4 pt-12 relative z-0 flex-grow flex flex-col">
                <div className="mb-3">
                    <Link 
                        to={grant.funderSlug ? `/organizations/${grant.funderSlug}` : '#'}
                        className="font-semibold text-slate-800 text-base hover:text-blue-600 transition-colors duration-300 block truncate"
                        onClick={(e) => { if(isExpired) e.preventDefault(); e.stopPropagation(); }}
                    >
                        {grant.foundationName}
                    </Link>
                    {grant.grantType && (
                        <span className="inline-block mt-1 text-xs bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 px-2 py-0.5 rounded-full font-medium border border-blue-200">
                            {grant.grantType}
                        </span>
                    )}
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300 line-clamp-2 leading-tight">
                    {grant.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-3 line-clamp-3 h-[4.25rem]">
                    {grant.description}
                </p>
                <div className="flex gap-2 mb-3">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-2 rounded-lg border border-green-100 flex-1">
                        <div className="flex items-center gap-1 mb-1">
                            <DollarSign size={12} className="text-green-600" />
                            <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Funding</span>
                        </div>
                        <div className="text-sm font-bold text-green-800">
                            {formatFunding(grant.fundingAmount)}
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-orange-50 p-2 rounded-lg border border-red-100 flex-1">
                        <div className="flex items-center gap-1 mb-1">
                            <Calendar size={12} className="text-red-600" />
                            <span className="text-xs font-semibold text-red-700 uppercase tracking-wide">Due</span>
                        </div>
                        <div className="text-xs font-bold text-red-800">
                            {grant.dueDate ? formatDate(grant.dueDate) : 'Rolling'}
                        </div>
                    </div>
                </div>
                {grant.locations && grant.locations.length > 0 && (
                    <div className="mb-3">
                        <div className="flex items-center gap-1 mb-1">
                            <MapPin size={12} className="text-blue-500" />
                            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Location</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {grant.locations.slice(0, 3).map((location, index) => (
                                <span 
                                    key={index}
                                    className={`text-xs font-medium px-2 py-1 rounded-full border transition-all duration-300 ${getLocationPillClasses(location.name)}`}
                                >
                                    {location.name}
                                </span>
                            ))}
                            {grant.locations.length > 3 && (
                                <span className="text-xs text-slate-500 px-2 py-1">
                                    +{grant.locations.length - 3}
                                </span>
                            )}
                        </div>
                    </div>
                )}
                {grant.categories && grant.categories.length > 0 && (
                    <div className="mb-3">
                        <div className="flex items-center gap-1 mb-1">
                            <Target size={12} className="text-purple-500" />
                            <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Focus Areas</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {grant.categories.slice(0, 3).map((category, index) => {
                                const categoryName = category.name || category;
                                return (
                                    <button 
                                        key={category.id || index} 
                                        disabled={isExpired}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onFilterByCategory(categoryName);
                                        }}
                                        className={`text-xs font-semibold px-2 py-1 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 border ${getEnhancedPillClasses(categoryName)} ${isExpired ? 'cursor-not-allowed opacity-50' : 'hover:shadow-sm'}`}
                                    >
                                        {categoryName}
                                    </button>
                                );
                            })}
                            {grant.categories.length > 3 && (
                                <span className="text-xs text-slate-500 px-2 py-1 bg-slate-100 rounded-full font-medium">
                                    +{grant.categories.length - 3}
                                </span>
                            )}
                        </div>
                    </div>
                )}
                {grant.eligible_organization_types && grant.eligible_organization_types.length > 0 && (
                    <div className="mb-3">
                        <div className="flex items-center gap-1 mb-1">
                            <Users size={12} className="text-emerald-500" />
                            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Eligible</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {grant.eligible_organization_types.slice(0, 3).map((taxonomyCode, index) => {
                                const displayName = TAXONOMY_DISPLAY_NAMES[taxonomyCode] || taxonomyCode;
                                const isUserEligible = userOrganizationType && taxonomyCode.startsWith(userOrganizationType);
                                return (
                                    <span 
                                        key={index}
                                        className={`text-xs font-medium px-2 py-1 rounded-full border transition-all duration-300 ${
                                            isUserEligible 
                                                ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300' 
                                                : getOrgTypePillClasses(taxonomyCode)
                                        }`}
                                    >
                                        {isUserEligible && '✓ '}
                                        {displayName}
                                    </span>
                                );
                            })}
                            {grant.eligible_organization_types.length > 3 && (
                                <span className="text-xs text-slate-500 px-2 py-1 bg-slate-100 rounded-full font-medium">
                                    +{grant.eligible_organization_types.length - 3}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <div className="px-4 pb-4 flex justify-between items-center relative z-0 mt-auto">
                <button
                    onClick={(e) => {
                        e.stopPropagation(); // Already on the main div, but good for clarity
                        onClick(grant);
                    }}
                    disabled={isExpired}
                    className={`group/btn flex items-center gap-2 px-4 py-2 font-semibold rounded-lg shadow-sm transition-all duration-300 transform hover:scale-105 hover:shadow-md disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex-1 mr-2 justify-center text-sm ${
                        isEligibleForUser && !isExpired
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                            : 'bg-gradient-to-r from-slate-400 to-slate-500 text-white'
                    }`}
                >
                    <Sparkles size={14} className="group-hover/btn:animate-pulse" />
                    Details
                </button>
                <button
                    onClick={handleSaveClick}
                    disabled={isExpired}
                    className={`p-2 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                        isSaved && session
                            ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600' 
                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                    title={isSaved && session ? "Unsave this grant" : "Save this grant"}
                >
                    <Bookmark size={16} fill={isSaved && session ? 'currentColor' : 'none'} />
                </button>
            </div>
        </div>
    );
};

export default GrantCard;