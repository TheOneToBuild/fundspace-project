// src/components/GrantCard.jsx
import React from 'react';
import { IconBriefcase, MapPin, DollarSign, Calendar, ExternalLink, ShieldCheck } from './Icons.jsx';
// Import the new formatting function
import { formatDate, getPillClasses, getGrantTypePillClasses, formatFundingDisplay } from '../utils.js';

const GrantCard = ({ grant, onOpenDetailModal, onFilterByCategory }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let isEndingSoon = false;
    let daysUntilDue = null;

    if (grant.dueDate) {
        const dueDate = new Date(grant.dueDate);
        daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
        isEndingSoon = daysUntilDue >= 0 && daysUntilDue <= 14;
    }

    const grantData = grant;

    // Helper function to get initials from the funder's name
    const getInitials = (name) => {
        if (!name) return '?';
        const words = name.split(' ');
        if (words.length > 1) {
            // Take the first letter of the first two words
            return (words[0][0] + words[1][0]).toUpperCase();
        }
        // If it's a single word, take the first two letters
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-xl transition-all duration-300 ease-in-out flex flex-col justify-between transform hover:-translate-y-1 relative overflow-hidden h-full">
            {isEndingSoon && (
                <span
                    className="absolute top-0 right-[-1px] bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg z-10 uppercase tracking-wider shadow-sm"
                    title={`Due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`}
                >
                    {daysUntilDue === 1 ? 'DUE TOMORROW' : 
                     daysUntilDue === 0 ? 'DUE TODAY' : 
                     `${daysUntilDue} DAYS LEFT`}
                </span>
            )}

            <div>
                <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-slate-800 group-hover:text-blue-600 transition-colors duration-200 pr-4">
                        {grantData.title}
                    </h3>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        {grantData.grantType && (
                            <span className={`text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap ${getGrantTypePillClasses(grantData.grantType)}`}>
                                {grantData.grantType}
                            </span>
                        )}
                    </div>
                </div>

                {/* Logic for logo with initials fallback */}
                <div className="flex items-center mb-4">
                    {grantData.funderLogoUrl ? (
                        <img 
                            src={grantData.funderLogoUrl} 
                            alt={`${grantData.foundationName} logo`}
                            className="h-6 w-6 mr-2 rounded-full object-contain border border-slate-200 flex-shrink-0"
                            // If the image fails to load, this element will be hidden, and the fallback will appear.
                            onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
                        />
                    ) : null }
                     {/* This is the fallback div that is hidden by default if the logo exists */}
                    <div className={`h-6 w-6 mr-2 rounded-full bg-blue-100 text-blue-600 flex-shrink-0 items-center justify-center font-bold text-[10px] border border-blue-200 ${grantData.funderLogoUrl ? 'hidden' : 'flex'}`}>
                        {getInitials(grantData.foundationName)}
                    </div>
                    <span className="text-sm text-slate-600 font-medium truncate">{grantData.foundationName}</span>
                </div>


                {grantData.categories && grantData.categories.length > 0 && (
                    <div className="mb-4">
                        <h4 className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Focus Areas</h4>
                        <div className="flex flex-wrap gap-2">
                            {grantData.categories.map((category, index) => {
                                const categoryName = category.name || category;
                                return (
                                    <button 
                                        key={category.id || index} 
                                        onClick={() => onFilterByCategory && onFilterByCategory(categoryName)}
                                        className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-transform transform hover:scale-105 active:scale-95 ${getPillClasses(categoryName)}`}
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
                    {grantData.description}
                </p>

                <div className="space-y-2.5 text-sm mb-5">
                    <div className="flex items-start text-slate-700">
                        <MapPin size={15} className="mr-2.5 mt-0.5 text-blue-500 flex-shrink-0" />
                        <div>
                            <span className="font-medium text-slate-600">Location: </span> 
                            {grantData.locations && grantData.locations.length > 0
                                ? grantData.locations.map(loc => loc.name || loc).join(', ')
                                : 'Not specified'
                            }
                        </div>
                    </div>

                    <div className="flex items-center text-slate-700">
                        <DollarSign size={15} className="mr-2.5 text-green-500 flex-shrink-0" />
                        <div>
                            <span className="font-medium text-slate-600">Funding: </span>
                            <span className="font-semibold text-green-600">
                                {formatFundingDisplay(grantData.fundingAmount)}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center text-slate-700">
                        <Calendar size={15} className="mr-2.5 text-red-500 flex-shrink-0" />
                        <div>
                            <span className="font-medium text-slate-600">Due: </span>
                            {grantData.dueDate 
                                ? formatDate(grantData.dueDate)
                                : 'Continuous'
                            }
                        </div>
                    </div>

                    {grantData.eligibility_criteria && (
                        <div className="flex items-start text-slate-700">
                            <ShieldCheck size={15} className="mr-2.5 mt-0.5 text-indigo-500 flex-shrink-0" />
                            <div>
                                <span className="font-medium text-slate-600">Eligibility: </span>
                                <span className="line-clamp-2">{grantData.eligibility_criteria}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-auto">
                <button
                    onClick={() => onOpenDetailModal(grant)}
                    className="inline-flex items-center justify-center w-full px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ease-in-out transform hover:scale-105"
                >
                    View Grant Details <ExternalLink size={16} className="ml-2" />
                </button>
            </div>
        </div>
    );
};

export default GrantCard;
