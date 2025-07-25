// src/components/OrganizationCard.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { getPillClasses } from '../utils.js';
import { MapPin, DollarSign, Users, Award, MessageSquare, ExternalLink, Heart, Shield, GraduationCap, Stethoscope, Church, Building, ChevronRight, Sparkles, Target, TrendingUp } from './Icons.jsx';

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

// Enhanced gradient pill classes for focus areas
const getEnhancedPillClasses = (focusArea) => {
  const areaMap = {
    'Arts': 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-200',
    'Culture': 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-200',
    'Education': 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-blue-200',
    'Health': 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border-emerald-200',
    'Healthcare': 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border-emerald-200',
    'Environment': 'bg-gradient-to-r from-green-100 to-teal-100 text-green-700 border-green-200',
    'Housing': 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 border-orange-200',
    'Technology': 'bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-700 border-cyan-200',
    'Innovation': 'bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 border-violet-200',
    'Community': 'bg-gradient-to-r from-rose-100 to-pink-100 text-rose-700 border-rose-200',
    'Community Development': 'bg-gradient-to-r from-rose-100 to-pink-100 text-rose-700 border-rose-200',
    'Social Impact': 'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 border-indigo-200',
    'Research': 'bg-gradient-to-r from-slate-100 to-blue-100 text-slate-700 border-slate-200'
  };
  
  return areaMap[focusArea] || 'bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700 border-slate-200';
};

const OrganizationCard = ({ organization, handleFilterChange, linkTo, buttonText = "View Profile" }) => {
  const [isHovered, setIsHovered] = useState(false);
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

  // Auto-generate link if not provided
  const finalLinkTo = linkTo || `/organizations/${organization.slug}`;

  return (
    <div 
      className={`group relative bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all duration-500 ease-out transform hover:-translate-y-3 hover:shadow-2xl cursor-pointer h-full flex flex-col ${
        isHovered ? 'scale-[1.02]' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Magical gradient overlay that appears on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Magical border effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-20 transition-opacity duration-500 -z-10 blur-xl scale-110" />

      {/* Main content */}
      <div className="p-6 relative z-0 flex-grow flex flex-col">
        {/* Header with organization info */}
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0">
            {organization.logo_url ? (
              <img 
                src={organization.logo_url} 
                alt={`${organization.name} logo`} 
                className="h-16 w-16 rounded-xl object-cover border-2 border-white shadow-lg group-hover:shadow-xl transition-shadow duration-300"
                onError={(e) => { 
                  e.currentTarget.style.display = 'none'; 
                  e.currentTarget.nextElementSibling.style.display = 'flex'; 
                }}
              />
            ) : null}
            <div className={`h-16 w-16 rounded-xl ${colorClasses.avatar} text-white flex items-center justify-center font-bold text-lg shadow-lg group-hover:shadow-xl transition-shadow duration-300 ${organization.logo_url ? 'hidden' : 'flex'}`}>
              {getInitials(organization.name)}
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300 line-clamp-2">{organization.name}</h3>
            
            {/* Organization type badge */}
            {handleFilterChange ? (
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleFilterChange('typeFilter', [organization.type]);
                }}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full mt-2 inline-flex items-center gap-1.5 transition-all duration-300 transform hover:scale-105 active:scale-95 border ${colorClasses.bg} ${colorClasses.text} ${colorClasses.border}`}
                title={`Filter by type: ${typeConfig.label}`}
              >
                {typeConfig.icon}
                {typeConfig.label}
              </button>
            ) : (
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full mt-2 inline-flex items-center gap-1.5 border ${colorClasses.bg} ${colorClasses.text} ${colorClasses.border}`}>
                {typeConfig.icon}
                {typeConfig.label}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-slate-600 text-sm leading-relaxed mb-6 line-clamp-3 flex-grow">
          {organization.description}
        </p>

        {/* Key metrics in a beautiful grid */}
        <div className="grid grid-cols-1 gap-3 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 group-hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1 bg-blue-100 rounded-lg">
                <MapPin size={14} className="text-blue-600" />
              </div>
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Location</span>
            </div>
            <div className="text-sm font-bold text-blue-800">
              {organization.location || 'Not specified'}
            </div>
          </div>
          
          {/* Type-specific fields */}
          {organization.type === 'foundation' && organization.total_funding_annually && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100 group-hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 bg-green-100 rounded-lg">
                  <DollarSign size={14} className="text-green-600" />
                </div>
                <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Annual Giving</span>
              </div>
              <div className="text-sm font-bold text-green-800">
                {organization.total_funding_annually}
              </div>
            </div>
          )}
          
          {organization.type === 'nonprofit' && organization.budget && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100 group-hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 bg-green-100 rounded-lg">
                  <DollarSign size={14} className="text-green-600" />
                </div>
                <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Annual Budget</span>
              </div>
              <div className="text-sm font-bold text-green-800">
                {organization.budget}
              </div>
            </div>
          )}
          
          {(organization.staff_count || organization.staffCount) && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100 group-hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 bg-purple-100 rounded-lg">
                  <Users size={14} className="text-purple-600" />
                </div>
                <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Staff Count</span>
              </div>
              <div className="text-sm font-bold text-purple-800">
                {organization.staff_count || organization.staffCount}
              </div>
            </div>
          )}

          {/* Legacy funder fields for backward compatibility */}
          {organization.notable_grant && (
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-4 rounded-xl border border-amber-100 group-hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 bg-amber-100 rounded-lg">
                  <Award size={14} className="text-amber-600" />
                </div>
                <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Notable Grant</span>
              </div>
              <div className="text-sm font-bold text-amber-800">
                {organization.notable_grant}
              </div>
            </div>
          )}
          
          {organization.average_grant_size && (
            <div className="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-xl border border-orange-100 group-hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 bg-orange-100 rounded-lg">
                  <TrendingUp size={14} className="text-orange-600" />
                </div>
                <span className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Avg. Grant Size</span>
              </div>
              <div className="text-sm font-bold text-orange-800">
                {organization.average_grant_size}
              </div>
            </div>
          )}
        </div>

        {/* Focus areas with better design */}
        {((organization.focus_areas && organization.focus_areas.length > 0) || 
          (organization.focusAreas && organization.focusAreas.length > 0)) && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Target size={14} className="text-purple-500" />
              <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Focus Areas</span>
            </div>
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
          </div>
        )}
      </div>

      {/* Action footer */}
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