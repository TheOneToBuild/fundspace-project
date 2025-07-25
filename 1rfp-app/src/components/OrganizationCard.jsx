// src/components/OrganizationCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { getPillClasses } from '../utils.js';
import { MapPin, DollarSign, Users, Award, MessageSquare, ExternalLink, Heart, Shield, GraduationCap, Stethoscope, Church, Building } from './Icons.jsx';

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

const OrganizationCard = ({ organization, handleFilterChange, linkTo, buttonText = "View Profile" }) => {
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

  // Auto-generate link if not provided
  const finalLinkTo = linkTo || `/organizations/${organization.slug}`;

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
            {handleFilterChange && (
              <button 
                onClick={() => handleFilterChange('typeFilter', [organization.type])}
                className={`text-xs font-semibold px-2.5 py-1 rounded-full mt-2 inline-flex items-center gap-1 transition-transform transform hover:scale-105 active:scale-95 ${colorClasses.bg} ${colorClasses.text} ${colorClasses.border} border`}
                title={`Filter by type: ${typeConfig.label}`}
              >
                {typeConfig.icon}
                {typeConfig.label}
              </button>
            )}
            {!handleFilterChange && (
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full mt-2 inline-flex items-center gap-1 ${colorClasses.bg} ${colorClasses.text} ${colorClasses.border} border`}>
                {typeConfig.icon}
                {typeConfig.label}
              </span>
            )}
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

          {/* Legacy funder fields for backward compatibility */}
          {organization.notable_grant && (
            <div className="flex items-start text-slate-700">
              <Award size={16} className="mr-2.5 mt-0.5 text-amber-500 flex-shrink-0" />
              <div><span className="font-medium text-slate-600">Notable Grant:</span> {organization.notable_grant}</div>
            </div>
          )}
          
          {organization.average_grant_size && (
            <div className="flex items-start text-slate-700">
              <MessageSquare size={16} className="mr-2.5 mt-0.5 text-orange-500 flex-shrink-0" />
              <div><span className="font-medium text-slate-600">Avg. Grant Size:</span> {organization.average_grant_size}</div>
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
                  onClick={handleFilterChange ? () => handleFilterChange('focusAreaFilter', [area]) : undefined}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${handleFilterChange ? 'transition-transform transform hover:scale-105 active:scale-95 cursor-pointer' : 'cursor-default'} ${getPillClasses(area)}`}
                  title={handleFilterChange ? `Filter by: ${area}` : area}
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

        {/* Legacy focusAreas field for backward compatibility */}
        {organization.focusAreas && organization.focusAreas.length > 0 && !organization.focus_areas && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Focus Areas</h4>
            <div className="flex flex-wrap gap-2">
              {organization.focusAreas.slice(0, 3).map(area => (
                <button 
                  key={area} 
                  onClick={handleFilterChange ? () => handleFilterChange('focusAreaFilter', [area]) : undefined}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${handleFilterChange ? 'transition-transform transform hover:scale-105 active:scale-95 cursor-pointer' : 'cursor-default'} ${getPillClasses(area)}`}
                  title={handleFilterChange ? `Filter by: ${area}` : area}
                >
                  {area}
                </button>
              ))}
              {organization.focusAreas.length > 3 && (
                <span className="text-xs text-slate-500 px-2.5 py-1">+{organization.focusAreas.length - 3} more</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action button */}
      <div className="mt-6">
        <Link 
          to={finalLinkTo} 
          className={`inline-flex items-center justify-center w-full px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${colorClasses.button} focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors`}
        >
          {buttonText} <ExternalLink size={16} className="ml-2" />
        </Link>
      </div>
    </div>
  );
};

export default OrganizationCard;