// src/components/GrantCard.jsx
import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IconBriefcase, MapPin, DollarSign, Calendar, ExternalLink, ShieldCheck, Bookmark, Users, Building2, Clock, Zap, Target, ChevronRight, Sparkles } from './Icons.jsx';
import { formatDate, getPillClasses, getGrantTypePillClasses, formatFundingDisplay } from '../utils.js';

// Taxonomy code to display name mapping
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

// Enhanced gradient pill classes for categories - each with unique colors
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
    
    // Environmental and Climate Focus Areas
    'Flood Management': 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-blue-200',
    'Habitat Restoration': 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200',
    'Climate Justice': 'bg-gradient-to-r from-teal-100 to-green-100 text-teal-700 border-teal-200',
    'Climate Change': 'bg-gradient-to-r from-sky-100 to-indigo-100 text-sky-700 border-sky-200',
    'Renewable Energy': 'bg-gradient-to-r from-yellow-100 to-green-100 text-yellow-700 border-yellow-200',
    'Sustainability': 'bg-gradient-to-r from-emerald-100 to-lime-100 text-emerald-700 border-emerald-200',
    'Conservation': 'bg-gradient-to-r from-green-100 to-teal-100 text-green-700 border-green-200',
    'Wildlife': 'bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-700 border-teal-200',
    
    // Worker and Labor Rights
    'Food Production Workers\' Health and Safety': 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 border-orange-200',
    'Worker Safety': 'bg-gradient-to-r from-red-100 to-orange-100 text-red-700 border-red-200',
    'Labor Rights': 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border-purple-200',
    'Workplace Safety': 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border-amber-200',
    
    // Additional Categories
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

// Organization type colors for pills
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

// Location-specific colors for different counties and regions
const getLocationPillClasses = (locationName) => {
  const locationMap = {
    // Bay Area Counties - each with unique colors
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
    
    // Major Cities - unique colors
    'Oakland': 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border-amber-200',
    'Berkeley': 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-blue-200',
    'San Jose': 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200',
    'Fremont': 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 border-orange-200',
    'Hayward': 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 border-yellow-200',
    'Sunnyvale': 'bg-gradient-to-r from-cyan-100 to-teal-100 text-cyan-700 border-cyan-200',
    'Santa Clara': 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border-emerald-200',
    'Mountain View': 'bg-gradient-to-r from-teal-100 to-emerald-100 text-teal-700 border-teal-200',
    'Palo Alto': 'bg-gradient-to-r from-lime-100 to-green-100 text-lime-700 border-lime-200',
    'Redwood City': 'bg-gradient-to-r from-green-100 to-lime-100 text-green-700 border-green-200',
    
    // Regional descriptors
    'Bay Area': 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-blue-200',
    'San Francisco Bay Area': 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-blue-200',
    'Northern California': 'bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-700 border-indigo-200',
    'California': 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border-purple-200',
    'United States': 'bg-gradient-to-r from-red-100 to-blue-100 text-slate-700 border-slate-200',
    'National': 'bg-gradient-to-r from-slate-100 to-zinc-100 text-slate-700 border-slate-200',
    'International': 'bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-700 border-teal-200'
  };
  
  // Try exact match first
  if (locationMap[locationName]) {
    return locationMap[locationName];
  }
  
  // Try partial matches for flexibility
  const locationLower = locationName.toLowerCase();
  for (const [key, value] of Object.entries(locationMap)) {
    if (locationLower.includes(key.toLowerCase())) {
      return value;
    }
  }
  
  // Default fallback
  return 'bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700 border-slate-200';
};

const GrantCard = ({ grant, onOpenDetailModal, onFilterByCategory, onSave, onUnsave, isSaved, session, userOrganizationType = null }) => {
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);
    
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

    // Check if user's organization type is eligible for this grant
    const isEligibleForUser = useMemo(() => {
        if (!userOrganizationType || !grant.eligible_organization_types) {
            return true; // Show all grants if no eligibility data
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
        if (!session) {
            navigate('/login');
            return;
        }
        if (isSaved) {
            onUnsave(grant.id);
        } else {
            onSave(grant.id);
        }
    };

    return (
        <div 
            className={`group relative bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all duration-500 ease-out transform hover:-translate-y-3 hover:shadow-2xl cursor-pointer h-full flex flex-col ${
                isHovered ? 'scale-[1.02]' : ''
            } ${isEligibleForUser ? '' : 'opacity-80'} ${isExpired ? 'opacity-60' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => onOpenDetailModal(grant)}
        >
            {/* Magical gradient overlay that appears on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Magical border effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-20 transition-opacity duration-500 -z-10 blur-xl scale-110" />

            {/* Status badges */}
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                {!isEligibleForUser && (
                    <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                        <ShieldCheck size={12} />
                        Check Eligibility
                    </div>
                )}
                
                {isExpired && (
                    <div className="bg-gradient-to-r from-slate-400 to-slate-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                        EXPIRED
                    </div>
                )}
                
                {isEndingSoon && !isExpired && (
                    <div className="bg-gradient-to-r from-red-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
                        {daysUntilDue === 1 ? 'DUE TOMORROW' : 
                         daysUntilDue === 0 ? 'DUE TODAY' : 
                         `${daysUntilDue} DAYS LEFT`}
                    </div>
                )}
                
                {grant.save_count > 0 && (
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                        <Bookmark size={12} fill="currentColor" />
                        {grant.save_count}
                    </div>
                )}
            </div>

            {/* Main content */}
            <div className="p-6 relative z-0 flex-grow flex flex-col">
                {/* Header with funder info */}
                <div className="flex items-center mb-4">
                    {grant.funderLogoUrl ? (
                        <img 
                            src={grant.funderLogoUrl} 
                            alt={`${grant.foundationName} logo`}
                            className="h-12 w-12 rounded-xl object-cover border-2 border-white shadow-lg mr-4 group-hover:shadow-xl transition-shadow duration-300"
                            onError={(e) => { 
                                e.currentTarget.style.display = 'none'; 
                                e.currentTarget.nextElementSibling.style.display = 'flex'; 
                            }}
                        />
                    ) : null}
                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-lg mr-4 group-hover:shadow-xl transition-shadow duration-300 ${grant.funderLogoUrl ? 'hidden' : 'flex'}`}>
                        {getInitials(grant.foundationName)}
                    </div>
                    
                    <div className="flex-1">
                        <Link 
                            to={`/organizations/${grant.funderSlug}`} 
                            className="font-semibold text-slate-700 text-sm hover:text-blue-600 transition-colors duration-300 block"
                            onClick={(e) => { if(isExpired) e.preventDefault(); e.stopPropagation(); }}
                        >
                            {grant.foundationName}
                        </Link>
                        {grant.grantType && (
                            <span className="inline-block mt-1 text-xs bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 px-3 py-1 rounded-full font-medium border border-blue-200">
                                {grant.grantType}
                            </span>
                        )}
                    </div>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300 line-clamp-1">
                    {grant.title}
                </h3>

                {/* Description */}
                <p className="text-slate-600 text-sm leading-relaxed mb-6 line-clamp-3 flex-grow">
                    {grant.description}
                </p>

                {/* Key metrics in a beautiful grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100 group-hover:shadow-lg transition-shadow duration-300">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1 bg-green-100 rounded-lg">
                                <DollarSign size={14} className="text-green-600" />
                            </div>
                            <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Funding</span>
                        </div>
                        <div className="text-lg font-bold text-green-800">
                            {formatFunding(grant.fundingAmount)}
                        </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-red-50 to-orange-50 p-4 rounded-xl border border-red-100 group-hover:shadow-lg transition-shadow duration-300">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1 bg-red-100 rounded-lg">
                                <Calendar size={14} className="text-red-600" />
                            </div>
                            <span className="text-xs font-semibold text-red-700 uppercase tracking-wide">Due Date</span>
                        </div>
                        <div className="text-sm font-bold text-red-800">
                            {grant.dueDate ? formatDate(grant.dueDate) : 'Rolling'}
                        </div>
                    </div>
                </div>

                {/* Location with better design and unique colors */}
                <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <MapPin size={14} className="text-blue-500" />
                        <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Location</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {grant.locations && grant.locations.length > 0 ? (
                            grant.locations.slice(0, 3).map((location, index) => (
                                <span 
                                    key={index}
                                    className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all duration-300 ${getLocationPillClasses(location.name)}`}
                                >
                                    {location.name}
                                </span>
                            ))
                        ) : (
                            <span className="text-xs font-medium px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full">
                                Not specified
                            </span>
                        )}
                        {grant.locations && grant.locations.length > 3 && (
                            <span className="text-xs text-slate-500 px-2 py-1">
                                +{grant.locations.length - 3} more
                            </span>
                        )}
                    </div>
                </div>

                {/* Categories with title and better design */}
                {grant.categories && grant.categories.length > 0 && (
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Target size={14} className="text-purple-500" />
                            <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Focus Areas</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {grant.categories.slice(0, 2).map((category, index) => {
                                const categoryName = category.name || category;
                                return (
                                    <button 
                                        key={category.id || index} 
                                        disabled={isExpired}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onFilterByCategory(categoryName);
                                        }}
                                        className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 border ${getEnhancedPillClasses(categoryName)} ${isExpired ? 'cursor-not-allowed opacity-50' : 'hover:shadow-lg'}`}
                                    >
                                        {categoryName}
                                    </button>
                                );
                            })}
                            {grant.categories.length > 2 && (
                                <span className="text-xs text-slate-500 px-3 py-1.5 bg-slate-100 rounded-full font-medium">
                                    +{grant.categories.length - 2} more
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Eligible Organizations with better design */}
                {grant.eligible_organization_types && grant.eligible_organization_types.length > 0 && (
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Users size={14} className="text-emerald-500" />
                            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Eligible Organizations</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {grant.eligible_organization_types.slice(0, 2).map((taxonomyCode, index) => {
                                const displayName = TAXONOMY_DISPLAY_NAMES[taxonomyCode] || taxonomyCode;
                                const isUserEligible = userOrganizationType && taxonomyCode.startsWith(userOrganizationType);
                                
                                return (
                                    <span 
                                        key={index}
                                        className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all duration-300 ${
                                            isUserEligible 
                                                ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300 shadow-lg' 
                                                : getOrgTypePillClasses(taxonomyCode)
                                        }`}
                                    >
                                        {isUserEligible && '✓ '}
                                        {displayName}
                                    </span>
                                );
                            })}
                            {grant.eligible_organization_types.length > 2 && (
                                <span className="text-xs text-slate-500 px-3 py-1.5 bg-slate-100 rounded-full font-medium">
                                    +{grant.eligible_organization_types.length - 2} more
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Action footer */}
            <div className="px-6 pb-6 flex justify-between items-center relative z-0 mt-auto">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onOpenDetailModal(grant);
                    }}
                    disabled={isExpired}
                    className={`group/btn flex items-center gap-2 px-6 py-3 font-semibold rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex-1 mr-3 justify-center ${
                        isEligibleForUser && !isExpired
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                            : 'bg-gradient-to-r from-slate-400 to-slate-500 text-white'
                    }`}
                >
                    <Sparkles size={16} className="group-hover/btn:animate-pulse" />
                    {isEligibleForUser ? 'View Details' : 'Check Details'}
                    <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform duration-300" />
                </button>
                
                <button
                    onClick={handleSaveClick}
                    disabled={isExpired}
                    className={`p-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                        isSaved && session
                            ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600' 
                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                    title={isSaved && session ? "Unsave this grant" : "Save this grant"}
                >
                    <Bookmark size={18} fill={isSaved && session ? 'currentColor' : 'none'} />
                </button>
            </div>
        </div>
    );
};

export default GrantCard;