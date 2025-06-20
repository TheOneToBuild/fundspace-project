// src/components/GrantCard.jsx
import React from 'react';
import { IconBriefcase, MapPin, DollarSign, Calendar, ExternalLink } from './Icons.jsx';
import { formatDate, getPillClasses, getGrantTypePillClasses } from '../utils.js';

const GrantCard = ({ grant, onOpenDetailModal, onFilterByCategory }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let isEndingSoon = false;
    let daysUntilDue = null;

    if (grant.dueDate || grant.due_date) {
        const dueDate = new Date(grant.dueDate || grant.due_date);
        daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
        isEndingSoon = daysUntilDue >= 0 && daysUntilDue <= 14;
    }

    // Handle different data structures (some grants might have different field names)
    const grantData = {
        ...grant,
        foundationName: grant.foundation_name || grant.foundationName,
        fundingAmount: grant.funding_amount_text || grant.fundingAmount || 'Not specified',
        dueDate: grant.due_date || grant.dueDate,
        grantType: grant.grant_type || grant.grantType,
        categories: grant.categories || [],
        locations: grant.locations || []
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-xl transition-all duration-300 ease-in-out flex flex-col justify-between transform hover:-translate-y-1 relative overflow-hidden h-full">
            {/* Expiring Soon Tag */}
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
                {/* Header with Title and Grant Type */}
                <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-slate-800 group-hover:text-blue-600 transition-colors duration-200 pr-4">
                        {grantData.title}
                    </h3>
                    {/* Grant Type Pill on top right */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        {grantData.grantType && (
                            <span className={`text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap ${getGrantTypePillClasses(grantData.grantType)}`}>
                                {grantData.grantType}
                            </span>
                        )}
                    </div>
                </div>

                {/* Foundation Name */}
                <p className="text-sm text-slate-600 mb-3 flex items-center">
                    <IconBriefcase size={15} className="w-4 h-4 mr-2 text-slate-400 flex-shrink-0" />
                    {grantData.foundationName}
                </p>

                {/* Focus Areas (Categories) - Interactive Pills */}
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
                
                {/* Description */}
                <p className="text-sm text-slate-500 mb-4 line-clamp-3 leading-relaxed">
                    {grantData.description}
                </p>

                {/* Grant Details */}
                <div className="space-y-2.5 text-sm mb-5">
                    {/* Location */}
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

                    {/* Funding Amount */}
                    <div className="flex items-center text-slate-700">
                        <DollarSign size={15} className="mr-2.5 text-green-500 flex-shrink-0" />
                        <div>
                            <span className="font-medium text-slate-600">Funding: </span>
                            {grantData.fundingAmount}
                        </div>
                    </div>

                    {/* Due Date */}
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
                </div>
            </div>

            {/* Action Button */}
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