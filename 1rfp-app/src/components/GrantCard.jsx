// src/components/EnhancedGrantCard.jsx
import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IconBriefcase, MapPin, DollarSign, Calendar, ExternalLink, ShieldCheck, Bookmark, Users, Building2 } from './Icons.jsx';
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

// Organization type colors for pills
const getOrgTypePillClasses = (taxonomyCode) => {
  const typeMap = {
    'nonprofit': 'bg-rose-100 text-rose-700 border-rose-200',
    'education': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    'healthcare': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'government': 'bg-blue-100 text-blue-700 border-blue-200',
    'foundation': 'bg-purple-100 text-purple-700 border-purple-200',
    'forprofit': 'bg-green-100 text-green-700 border-green-200',
    'religious': 'bg-amber-100 text-amber-700 border-amber-200',
    'international': 'bg-cyan-100 text-cyan-700 border-cyan-200'
  };
  
  const prefix = taxonomyCode.split('.')[0];
  return typeMap[prefix] || 'bg-slate-100 text-slate-700 border-slate-200';
};

const EnhancedGrantCard = ({ grant, onOpenDetailModal, onFilterByCategory, onSave, onUnsave, isSaved, session, userOrganizationType = null }) => {
    const navigate = useNavigate();
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
        <div className={`bg-white p-6 rounded-xl border transition-all duration-300 ease-in-out flex flex-col justify-between transform hover:-translate-y-1 relative overflow-hidden h-full ${
            isEligibleForUser 
                ? 'border-slate-200 hover:shadow-xl hover:border-blue-300' 
                : 'border-slate-300 bg-slate-50 opacity-75'
        }`}>
            
            {/* Eligibility indicator for user */}
            {!isEligibleForUser && (
                <div className="absolute top-0 left-0 bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-br-lg z-10 uppercase tracking-wider">
                    Check Eligibility
                </div>
            )}

            {isExpired && (
                <>
                    <div className="absolute inset-0 bg-slate-50/70 z-10"></div>
                    <span className="absolute top-0 right-[-1px] bg-slate-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg z-20 uppercase tracking-wider">
                        EXPIRED
                    </span>
                </>
            )}

            {isEndingSoon && !isExpired && (
                <span
                    className="absolute top-0 right-[-1px] bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg z-10 uppercase tracking-wider shadow-sm"
                    title={`Due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`}
                >
                    {daysUntilDue === 1 ? 'DUE TOMORROW' : 
                     daysUntilDue === 0 ? 'DUE TODAY' : 
                     `${daysUntilDue} DAYS LEFT`}
                </span>
            )}

            <div className="relative z-0">
                <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-slate-800 group-hover:text-blue-600 transition-colors duration-200 pr-4">
                        {grant.title}
                    </h3>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        {grant.grantType && (
                            <span className={`text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap ${getGrantTypePillClasses(grant.grantType)}`}>
                                {grant.grantType}
                            </span>
                        )}
                        {grant.save_count > 0 && (
                            <div
                                className="flex items-center gap-1 bg-indigo-50 text-indigo-700 rounded-full px-2 py-1"
                                title={`${grant.save_count} user${grant.save_count === 1 ? '' : 's'} saved this grant`}
                            >
                                <Bookmark size={14} className="text-indigo-500" fill="currentColor"/>
                                <span className="text-sm font-bold">{grant.save_count}</span>
                            </div>
                        )}
                    </div>
                </div>
                
                <Link 
                    to={`/funders/${grant.funderSlug}`} 
                    className={`flex items-center mb-4 group ${isExpired ? 'pointer-events-none' : ''}`}
                    onClick={(e) => { if(isExpired) e.preventDefault(); e.stopPropagation(); }}
                >
                    {grant.funderLogoUrl ? (
                        <img 
                            src={grant.funderLogoUrl} 
                            alt={`${grant.foundationName} logo`}
                            className="h-6 w-6 mr-2 rounded-full object-contain border border-slate-200 flex-shrink-0"
                            onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
                        />
                    ) : null }
                    <div className={`h-6 w-6 mr-2 rounded-full bg-blue-100 text-blue-600 flex-shrink-0 items-center justify-center font-bold text-[10px] border border-blue-200 ${grant.funderLogoUrl ? 'hidden' : 'flex'}`}>
                        {getInitials(grant.foundationName)}
                    </div>
                    <span className="text-sm text-slate-600 font-medium truncate group-hover:underline group-hover:text-blue-600 transition-colors">
                        {grant.foundationName}
                    </span>
                </Link>

                {/* NEW: Eligible Organization Types Section */}
                {grant.eligible_organization_types && grant.eligible_organization_types.length > 0 && (
                    <div className="mb-4">
                        <h4 className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider flex items-center gap-1">
                            <Users size={12} />
                            Eligible Organizations
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {grant.eligible_organization_types.slice(0, 3).map((taxonomyCode, index) => {
                                const displayName = TAXONOMY_DISPLAY_NAMES[taxonomyCode] || taxonomyCode;
                                const isUserEligible = userOrganizationType && taxonomyCode.startsWith(userOrganizationType);
                                
                                return (
                                    <span 
                                        key={index}
                                        className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-all ${
                                            isUserEligible 
                                                ? 'bg-green-100 text-green-800 border-green-300 ring-2 ring-green-200' 
                                                : getOrgTypePillClasses(taxonomyCode)
                                        }`}
                                        title={isUserEligible ? 'You are eligible for this grant!' : displayName}
                                    >
                                        {isUserEligible && '✓ '}
                                        {displayName}
                                    </span>
                                );
                            })}
                            {grant.eligible_organization_types.length > 3 && (
                                <span className="text-xs text-slate-500 px-2 py-1">
                                    +{grant.eligible_organization_types.length - 3} more
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Legacy Categories Section (keep for backward compatibility) */}
                {grant.categories && grant.categories.length > 0 && (
                    <div className="mb-4">
                        <h4 className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Focus Areas</h4>
                        <div className="flex flex-wrap gap-2">
                            {grant.categories.map((category, index) => {
                                const categoryName = category.name || category;
                                return (
                                    <button 
                                        key={category.id || index} 
                                        disabled={isExpired}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onFilterByCategory(categoryName);
                                        }}
                                        className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-transform transform hover:scale-105 active:scale-95 ${getPillClasses(categoryName)} ${isExpired ? 'cursor-not-allowed' : ''}`}
                                        title={`Filter by: ${categoryName}`}
                                    >
                                        {categoryName}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
                
                <p className="text-sm text-slate-500 mb-4 line-clamp-3 leading-relaxed">
                    {grant.description}
                </p>

                <div className="space-y-2.5 text-sm mb-5">
                   <div className="flex items-start text-slate-700">
                        <MapPin size={15} className="mr-2.5 mt-0.5 text-blue-500 flex-shrink-0" />
                        <div>
                            <span className="font-medium text-slate-600">Location: </span> 
                            {grant.locations && grant.locations.length > 0
                                ? grant.locations.map(loc => loc.name || loc).join(', ')
                                : 'Not specified'
                            }
                        </div>
                    </div>

                    <div className="flex items-center text-slate-700">
                        <DollarSign size={15} className="mr-2.5 text-green-500 flex-shrink-0" />
                        <div>
                            <span className="font-medium text-slate-600">Funding: </span>
                            <span className="font-semibold text-green-600">
                                {formatFundingDisplay(grant.fundingAmount)}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center text-slate-700">
                        <Calendar size={15} className="mr-2.5 text-red-500 flex-shrink-0" />
                        <div>
                            <span className="font-medium text-slate-600">Due: </span>
                            {grant.dueDate 
                                ? formatDate(grant.dueDate)
                                : 'Continuous'
                            }
                        </div>
                    </div>

                    {grant.eligibility_criteria && (
                        <div className="flex items-start text-slate-700">
                            <ShieldCheck size={15} className="mr-2.5 mt-0.5 text-indigo-500 flex-shrink-0" />
                            <div className="line-clamp-4">
                                <span className="font-medium text-slate-600">Eligibility: </span>
                                {grant.eligibility_criteria}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-auto flex justify-between items-center relative z-0">
                <button
                    onClick={() => onOpenDetailModal(grant)}
                    disabled={isExpired}
                    className={`inline-flex items-center justify-center flex-grow px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium transition-all duration-200 ease-in-out transform hover:scale-105 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none ${
                        isEligibleForUser
                            ? 'text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                            : 'text-slate-600 bg-slate-200 hover:bg-slate-300'
                    } ${isExpired ? 'bg-slate-400' : ''}`}
                >
                    {isEligibleForUser ? 'View Details' : 'Check Details'}
                </button>
                <button
                    onClick={handleSaveClick}
                    title={isSaved && session ? "Unsave this grant" : "Save this grant"}
                    disabled={isExpired}
                    className={`ml-2 p-2.5 rounded-lg transition-colors duration-200 disabled:opacity-50 ${
                        isSaved && session
                            ? 'bg-pink-100 text-pink-600 hover:bg-pink-200' 
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                >
                    <Bookmark size={18} fill={isSaved && session ? 'currentColor' : 'none'} />
                </button>
            </div>
        </div>
    );
};

export default EnhancedGrantCard;