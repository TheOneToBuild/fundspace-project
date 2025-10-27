import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, DollarSign, Users, Award, Heart, Shield, GraduationCap, Stethoscope, Church, Building, Sparkles, Target, TrendingUp, Eye, ChevronRight } from './Icons.jsx';

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
  'for-profit': {
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

const getEnhancedPillClasses = (focusArea) => {
  if (!focusArea) return 'bg-gradient-to-r from-slate-100 to-zinc-100 text-slate-700 border-slate-200';
  
  // Color palettes for gradients
  const colorPalettes = [
    'bg-gradient-to-r from-fuchsia-100 to-purple-100 text-fuchsia-700 border-fuchsia-200',
    'bg-gradient-to-r from-rose-100 to-pink-100 text-rose-700 border-rose-200',
    'bg-gradient-to-r from-sky-100 to-blue-100 text-sky-700 border-sky-200',
    'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border-emerald-200',
    'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200',
    'bg-gradient-to-r from-lime-100 to-green-100 text-lime-700 border-lime-200',
    'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border-amber-200',
    'bg-gradient-to-r from-cyan-100 to-teal-100 text-cyan-700 border-cyan-200',
    'bg-gradient-to-r from-indigo-100 to-violet-100 text-indigo-700 border-indigo-200',
    'bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700 border-pink-200',
    'bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border-red-200',
    'bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 border-violet-200',
    'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-blue-200',
    'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border-purple-200',
    'bg-gradient-to-r from-teal-100 to-green-100 text-teal-700 border-teal-200',
    'bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 border-orange-200',
    'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 border-yellow-200',
    'bg-gradient-to-r from-emerald-100 to-cyan-100 text-emerald-700 border-emerald-200',
  ];
  
  // Simple hash function to consistently map focus area to a color
  const hashString = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  };
  
  const colorIndex = hashString(focusArea) % colorPalettes.length;
  return colorPalettes[colorIndex];
};

const getStaffRange = (count) => {
  if (!count) return null;
  const num = parseInt(count);
  if (isNaN(num)) return count;
  
  if (num === 1) return '1 employee';
  if (num < 10) return '1-10 employees';
  if (num < 50) return '10-50 employees';
  if (num < 100) return '50-100 employees';
  if (num < 500) return '100-500 employees';
  if (num < 1000) return '500-1,000 employees';
  return '1,000+ employees';
};

const getBudgetRange = (amount) => {
  if (!amount) return null;
  
  // If it's already a string range, return it
  if (typeof amount === 'string' && amount.includes('-')) return amount;
  
  // Convert number to string and remove non-numeric characters
  const numStr = String(amount).replace(/[^0-9]/g, '');
  const num = parseInt(numStr);
  
  if (isNaN(num)) return amount; // Return original if can't parse
  
  // Define ranges
  if (num < 100000) return 'Under $100K';
  if (num < 500000) return '$100K - $500K';
  if (num < 1000000) return '$500K - $1M';
  if (num < 5000000) return '$1M - $5M';
  if (num < 10000000) return '$5M - $10M';
  if (num < 50000000) return '$10M - $50M';
  if (num < 100000000) return '$50M - $100M';
  return 'Over $100M';
};

const OrganizationCard = ({ organization, viewMode, onClick, handleFilterChange, linkTo, buttonText = "View Profile" }) => {
  // Add list view rendering
  if (viewMode === 'list') {
    return (
      <div 
        className="flex items-start py-3 px-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        onClick={onClick}
      >
        {/* Organization logo - aligned with title */}
        <div className="flex-shrink-0 mr-3 mt-1">
          {organization.image_url ? (
            <img 
              src={organization.image_url} 
              alt={organization.name}
              className="w-10 h-10 rounded-lg object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              {organization.name?.charAt(0) || 'O'}
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-gray-900 truncate leading-tight">{organization.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{organization.type}</p>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                {organization.description?.substring(0, 120)}...
              </p>
            </div>
            
            {/* Right side - Key details */}
            <div className="ml-4 flex-shrink-0 text-right min-w-[140px] flex flex-col items-end">
              <div className="text-sm text-gray-600">
                {organization.county || organization.location}
              </div>
              
              {/* Action buttons */}
              <div className="flex items-center mt-2 space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Add follow functionality if needed
                  }}
                  className="p-2 rounded-lg transition-colors text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                >
                  <Heart className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Tags row - more compact */}
          <div className="flex items-center mt-2 space-x-2 text-xs flex-wrap">
            {/* Location tag */}
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {organization.county || organization.location}
            </span>
            
            {/* Type tag */}
            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
              {organization.type}
            </span>
            
            {/* Focus areas */}
            {organization.focus_areas?.slice(0, 2).map((area, idx) => (
              <span key={idx} className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                {area}
              </span>
            ))}
            
            {organization.focus_areas?.length > 2 && (
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded">
                +{organization.focus_areas.length - 2} more
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  const [isHovered, setIsHovered] = useState(false);
  
  const normalizedType = organization.type?.toLowerCase();
  const typeConfig = ORG_TYPE_CONFIG[normalizedType] || ORG_TYPE_CONFIG.nonprofit;
  
  const getInitials = (name) => {
    if (!name) return '?';
    const words = name.split(' ');
    if (words.length > 1) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getColorClasses = (color) => {
    const colorMap = {
      purple: { 
        bg: 'bg-gradient-to-br from-purple-100 to-pink-100', 
        text: 'text-purple-700', 
        border: 'border-purple-200', 
        button: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:ring-purple-500',
        avatar: 'bg-gradient-to-br from-purple-500 to-pink-600'
      },
      green: { 
        bg: 'bg-gradient-to-br from-green-100 to-emerald-100', 
        text: 'text-green-700', 
        border: 'border-green-200', 
        button: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:ring-green-500',
        avatar: 'bg-gradient-to-br from-green-500 to-emerald-600'
      },
      blue: { 
        bg: 'bg-gradient-to-br from-blue-100 to-indigo-100', 
        text: 'text-blue-700', 
        border: 'border-blue-200', 
        button: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:ring-blue-500',
        avatar: 'bg-gradient-to-br from-blue-500 to-indigo-600'
      },
      indigo: { 
        bg: 'bg-gradient-to-br from-indigo-100 to-purple-100', 
        text: 'text-indigo-700', 
        border: 'border-indigo-200', 
        button: 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:ring-indigo-500',
        avatar: 'bg-gradient-to-br from-indigo-500 to-purple-600'
      },
      teal: { 
        bg: 'bg-gradient-to-br from-teal-100 to-cyan-100', 
        text: 'text-teal-700', 
        border: 'border-teal-200', 
        button: 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 focus:ring-teal-500',
        avatar: 'bg-gradient-to-br from-teal-500 to-cyan-600'
      },
      orange: { 
        bg: 'bg-gradient-to-br from-orange-100 to-amber-100', 
        text: 'text-orange-700', 
        border: 'border-orange-200', 
        button: 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 focus:ring-orange-500',
        avatar: 'bg-gradient-to-br from-orange-500 to-amber-600'
      },
      amber: { 
        bg: 'bg-gradient-to-br from-amber-100 to-yellow-100', 
        text: 'text-amber-700', 
        border: 'border-amber-200', 
        button: 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 focus:ring-amber-500',
        avatar: 'bg-gradient-to-br from-amber-500 to-yellow-600'
      }
    };
    return colorMap[color] || colorMap.purple;
  };

  const colorClasses = getColorClasses(typeConfig.color);
  const finalLinkTo = linkTo || `/organizations/${organization.slug}`;

  return (
    <div 
      className={`group relative bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all duration-500 ease-out transform hover:-translate-y-3 hover:shadow-2xl cursor-pointer h-full flex flex-col ${
        isHovered ? 'scale-[1.02]' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        <div className="h-24 bg-gradient-to-br from-slate-100 via-white to-slate-100">
          {organization.banner_image_url && (
            <img
              src={organization.banner_image_url}
              alt={`${organization.name} banner`}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        <div className="absolute bottom-0 left-4 translate-y-1/2 transform transition-transform duration-300 group-hover:scale-105">
          {organization.image_url ? (
            <img 
              src={organization.image_url} 
              alt={`${organization.name} logo`} 
              className="h-14 w-14 rounded-xl object-cover border-3 border-white shadow-lg bg-white"
              onError={(e) => { 
                e.currentTarget.style.display = 'none'; 
                e.currentTarget.nextElementSibling.style.display = 'flex'; 
              }}
            />
          ) : null}
          <div className={`h-14 w-14 rounded-xl ${colorClasses.avatar} text-white flex items-center justify-center font-bold text-lg shadow-lg border-3 border-white ${organization.image_url ? 'hidden' : 'flex'}`}>
            {getInitials(organization.name)}
          </div>
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-20 transition-opacity duration-500 -z-10 blur-xl scale-110" />

      <div className="p-6 pt-10 relative z-0 flex-grow flex flex-col">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300 line-clamp-1 h-7">{organization.name}</h3>
          
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {handleFilterChange ? (
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleFilterChange('typeFilter', [organization.type]);
                }}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 transition-all duration-300 transform hover:scale-105 active:scale-95 border ${colorClasses.bg} ${colorClasses.text} ${colorClasses.border}`}
                title={`Filter by type: ${typeConfig.label}`}
              >
                {typeConfig.icon}
                {typeConfig.label}
              </button>
            ) : (
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 border ${colorClasses.bg} ${colorClasses.text} ${colorClasses.border}`}>
                {typeConfig.icon}
                {typeConfig.label}
              </span>
            )}

            {/* Show followers count */}
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200 inline-flex items-center gap-1">
              <Eye size={12} />
              {organization.followers_count || 0} followers
            </span>

            {/* Show bookmarks count (likes) */}
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-pink-50 text-pink-600 border border-pink-200 inline-flex items-center gap-1">
              <Heart size={12} />
              {organization.bookmarks_count || 0} likes
            </span>
          </div>
        </div>

        <div className="mb-6 h-16">
          <p className="text-slate-600 text-sm leading-relaxed line-clamp-3 h-full">
            {organization.description}
          </p>
        </div>

        {/* HQ, Areas Served, Team Size, and Budget - Two rows */}
        <div className="mb-4 space-y-3">
          {/* First Row: HQ and Areas Served */}
          <div className="grid grid-cols-2 gap-3">
            {/* HQ (Headquarters) */}
            <div>
              <div className="flex items-center gap-1 mb-2">
                <MapPin size={12} className="text-blue-600" />
                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Headquarters</span>
              </div>
              {organization.location ? (
                <span className="inline-flex items-center text-xs font-semibold px-2 py-1 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border border-blue-200 line-clamp-1">
                  {organization.location}
                </span>
              ) : (
                <span className="inline-flex items-center text-xs font-medium px-2 py-1 rounded-full bg-slate-50 text-slate-500 border border-slate-200 italic">
                  Unknown
                </span>
              )}
            </div>

            {/* Areas Served */}
            <div>
              <div className="flex items-center gap-1 mb-2">
                <MapPin size={12} className="text-indigo-600" />
                <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Areas Served</span>
              </div>
              {organization.areas_served ? (
                <span className="inline-flex items-center text-xs font-semibold px-2 py-1 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 border border-indigo-200 line-clamp-1">
                  {organization.areas_served}
                </span>
              ) : (
                <span className="inline-flex items-center text-xs font-medium px-2 py-1 rounded-full bg-slate-50 text-slate-500 border border-slate-200 italic">
                  Unknown
                </span>
              )}
            </div>
          </div>

          {/* Second Row: Team Size and Budget */}
          <div className="grid grid-cols-2 gap-3">
            {/* Team Size */}
            <div>
              <div className="flex items-center gap-1 mb-2">
                <Users size={12} className="text-purple-600" />
                <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Team Size</span>
              </div>
              {(organization.staff_count || organization.staffCount) ? (
                <span className="inline-flex items-center text-xs font-semibold px-2 py-1 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200 line-clamp-1">
                  {organization.staff_count || organization.staffCount}
                </span>
              ) : (
                <span className="inline-flex items-center text-xs font-medium px-2 py-1 rounded-full bg-slate-50 text-slate-500 border border-slate-200 italic">
                  Unknown
                </span>
              )}
            </div>

            {/* Annual Budget/Giving */}
            <div>
              <div className="flex items-center gap-1 mb-2">
                <DollarSign size={12} className="text-green-600" />
                <span className="text-xs font-semibold text-green-700 uppercase tracking-wide whitespace-nowrap">
                  {normalizedType === 'foundation' ? 'Annual Giving' : 'Budget'}
                </span>
              </div>
              {((normalizedType === 'foundation' && organization.total_funding_annually) ||
                (normalizedType === 'nonprofit' && organization.budget)) ? (
                <span className="inline-flex items-center text-xs font-semibold px-2 py-1 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200 line-clamp-1">
                  {getBudgetRange(organization.total_funding_annually || organization.budget)}
                </span>
              ) : (
                <span className="inline-flex items-center text-xs font-medium px-2 py-1 rounded-full bg-slate-50 text-slate-500 border border-slate-200 italic">
                  Unknown
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-3 mb-6">
          {organization.notable_grant && (
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-4 rounded-xl border border-amber-100 group-hover:shadow-lg transition-shadow duration-300 h-20">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 bg-amber-100 rounded-lg">
                  <Award size={14} className="text-amber-600" />
                </div>
                <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Notable Grant</span>
              </div>
              <div className="text-sm font-bold text-amber-800 line-clamp-1">
                {organization.notable_grant}
              </div>
            </div>
          )}
          
          {organization.average_grant_size && (
            <div className="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-xl border border-orange-100 group-hover:shadow-lg transition-shadow duration-300 h-20">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 bg-orange-100 rounded-lg">
                  <TrendingUp size={14} className="text-orange-600" />
                </div>
                <span className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Avg. Grant Size</span>
              </div>
              <div className="text-sm font-bold text-orange-800 line-clamp-1">
                {organization.average_grant_size}
              </div>
            </div>
          )}
        </div>

        {/* Focus Areas Section - Always show */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Target size={14} className="text-purple-500" />
            <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Focus Areas</span>
          </div>
          
          {((organization.focus_areas && organization.focus_areas.length > 0) || 
            (organization.focusAreas && organization.focusAreas.length > 0)) ? (
            <div className="flex flex-wrap gap-2">
              {(organization.focus_areas || organization.focusAreas || []).slice(0, 3).map((area, index) => (
                <button 
                  key={area || index} 
                  onClick={handleFilterChange ? (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleFilterChange('focusAreaFilter', [area]);
                  } : undefined}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 border ${getEnhancedPillClasses(area)} ${handleFilterChange ? 'hover:shadow-lg cursor-pointer' : 'cursor-default'}`}
                  title={handleFilterChange ? `Filter by: ${area}` : area}
                >
                  {area}
                </button>
              ))}
              {(organization.focus_areas || organization.focusAreas || []).length > 3 && (
                <span className="text-xs text-slate-500 px-3 py-1.5 bg-slate-100 rounded-full font-medium">
                  +{(organization.focus_areas || organization.focusAreas || []).length - 3} more
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-xs text-slate-500 italic">
                No focus areas listed yet
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 pb-6 relative z-0 mt-auto">
        <Link 
          to={finalLinkTo} 
          className={`group/btn inline-flex items-center justify-center w-full px-6 py-3 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white transition-all duration-300 transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 ${colorClasses.button}`}
        >
          <Sparkles size={16} className="mr-2 group-hover/btn:animate-pulse" />
          {buttonText} 
          <ChevronRight size={16} className="ml-2 group-hover/btn:translate-x-1 transition-transform duration-300" />
        </Link>
      </div>
    </div>
  );
};

export default OrganizationCard;