// src/components/FunderCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { getPillClasses, getGrantTypePillClasses, getFunderTypePillClasses } from '../utils.js'; // Note path change
import { MapPin, IconBriefcase, DollarSign, Award, MessageSquare, ExternalLink } from './Icons.jsx';

const FunderCard = ({ funder, handleFilterChange }) => {
    const getInitials = (name) => {
        if (!name) return '?';
        const words = name.split(' ');
        if (words.length > 1) {
            return (words[0][0] + words[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-xl transition-all duration-300 ease-in-out flex flex-col justify-between transform hover:-translate-y-1 h-full">
            <div>
                <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0">
                        {funder.logo_url ? (
                            <img 
                                src={funder.logo_url} 
                                alt={`${funder.name} logo`} 
                                className="h-16 w-16 rounded-full object-contain border border-slate-200 p-1"
                                loading="lazy"
                                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                            />
                        ) : null}
                        <div className={`h-16 w-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl border-2 border-blue-200 ${funder.logo_url ? 'hidden' : 'flex'}`}>
                            {getInitials(funder.name)}
                        </div>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-800 line-clamp-2">{funder.name}</h3>
                        
                        {funder.funder_type?.name && (
                            <button onClick={() => handleFilterChange('funderTypeFilter', funder.funder_type.name)}
                                className={`text-xs font-semibold px-2.5 py-1 rounded-full mt-2 inline-block transition-transform transform hover:scale-105 active:scale-95 ${getFunderTypePillClasses(funder.funder_type.name)}`}
                                title={`Filter by type: ${funder.funder_type.name}`} >
                                {funder.funder_type.name}
                            </button>
                        )}
                    </div>
                </div>
                <p className="text-sm text-slate-600 mb-4 line-clamp-3 leading-relaxed">
                    <span className="font-semibold text-slate-700">Funding Philosophy: </span>
                    {funder.description}
                </p>
                <div className="space-y-3 text-sm mb-5">
                    <div className="flex items-start text-slate-700">
                        <MapPin size={16} className="mr-2.5 mt-0.5 text-blue-500 flex-shrink-0" />
                        <div><span className="font-medium text-slate-600">Headquarters:</span> {funder.location || 'Not specified'}</div>
                    </div>
                    {funder.funding_locations && funder.funding_locations.length > 0 && (
                        <div className="flex items-start text-slate-700">
                            <IconBriefcase size={16} className="mr-2.5 mt-0.5 text-purple-500 flex-shrink-0" />
                            <div>
                                <span className="font-medium text-slate-600">Geographic Scope:</span>
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                    {funder.funding_locations.map(location => (
                                        <button key={location} onClick={() => handleFilterChange('geographicScopeFilter', [location])}
                                            className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-all transform hover:scale-105 active:scale-95 ${getPillClasses(location)}`}
                                            title={`Filter by scope: ${location}`}>
                                            {location}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="flex items-start text-slate-700">
                        <DollarSign size={16} className="mr-2.5 mt-0.5 text-green-500 flex-shrink-0" />
                        <div><span className="font-medium text-slate-600">Annual Giving:</span> {funder.total_funding_annually || 'Not specified'}</div>
                    </div>
                    {funder.notable_grant && (
                        <div className="flex items-start text-slate-700">
                            <Award size={16} className="mr-2.5 mt-0.5 text-amber-500 flex-shrink-0" />
                            <div><span className="font-medium text-slate-600">Notable Grant:</span> {funder.notable_grant}</div>
                        </div>
                    )}
                    <div className="flex items-start text-slate-700">
                        <MessageSquare size={16} className="mr-2.5 mt-0.5 text-orange-500 flex-shrink-0" />
                        <div><span className="font-medium text-slate-600">Avg. Grant Size:</span> {funder.average_grant_size || 'Not specified'}</div>
                    </div>
                </div>
                {funder.grant_types && funder.grant_types.length > 0 && (
                    <div className="pt-4 border-t border-slate-100">
                        <h4 className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Grant Types Offered</h4>
                        <div className="flex flex-wrap gap-2">
                            {funder.grant_types.map(type => (
                                <span key={type} className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getGrantTypePillClasses(type)}`}>{type}</span>
                            ))}
                        </div>
                    </div>
                )}
                {funder.focus_areas && funder.focus_areas.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <h4 className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Key Focus Areas</h4>
                        <div className="flex flex-wrap gap-2">
                            {funder.focus_areas.map(area => (
                                <button key={area} onClick={() => handleFilterChange('focusAreaFilter', [area])}
                                    className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-transform transform hover:scale-105 active:scale-95 ${getPillClasses(area)}`}
                                    title={`Filter by: ${area}`}>
                                    {area}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <div className="mt-6">
                <Link to={`/funders/${funder.slug}`} className="inline-flex items-center justify-center w-full px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors">
                    View Their Grants <ExternalLink size={16} className="ml-2" />
                </Link>
            </div>
        </div>
    );
};

export default FunderCard;