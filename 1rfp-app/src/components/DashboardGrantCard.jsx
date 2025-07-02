// src/components/GrantCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, MapPin, DollarSign, Calendar, Briefcase } from './Icons.jsx'; // Assuming you have these icons

// Helper to format currency
const formatFunding = (amount) => {
    if (typeof amount === 'number') {
        if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
        if (amount >= 1000) return `$${(amount / 1000)}k`;
        return `$${amount}`;
    }
    return amount; // Return text like 'Varies' as is
};

// Helper to get a color based on grant type for the tag
const getTagColor = (grantType) => {
    switch (grantType) {
        case 'Project Grant': return 'bg-pink-100 text-pink-800';
        case 'General Operating Support': return 'bg-green-100 text-green-800';
        case 'Capacity Building': return 'bg-indigo-100 text-indigo-800';
        default: return 'bg-slate-100 text-slate-800';
    }
};

export default function GrantCard({ grant, session, isSaved, onSave, onUnsave, onOpenDetailModal, onFilterByCategory }) {
    
    // Destructure grant details for easier access
    const {
        title,
        foundationName,
        funderLogoUrl,
        description,
        fundingAmount,
        dueDate,
        locations,
        categories,
        grantType,
        id
    } = grant;

    const locationText = locations?.map(l => l.name).join(', ') || 'Multiple Locations';
    const fundingText = formatFunding(fundingAmount);
    const dueDateText = dueDate ? new Date(dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Rolling';

    return (
        <div className="bg-white rounded-2xl shadow-md border border-slate-200/80 p-6 flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            
            {/* Card Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <div className="flex items-center mb-2">
                        {funderLogoUrl ? (
                            <img src={funderLogoUrl} alt={`${foundationName} logo`} className="h-6 w-6 rounded-full mr-2 object-contain" />
                        ) : (
                            <div className="h-6 w-6 rounded-full bg-slate-200 mr-2"></div>
                        )}
                        <span className="text-sm font-semibold text-slate-600">{foundationName}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 leading-tight">{title}</h3>
                </div>
                {session && (
                    <button 
                        onClick={() => isSaved ? onUnsave(id) : onSave(id)}
                        className={`p-2 rounded-full transition-colors ${isSaved ? 'bg-pink-100 text-pink-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                        aria-label={isSaved ? 'Unsave grant' : 'Save grant'}
                    >
                        <Bookmark size={18} filled={isSaved} />
                    </button>
                )}
            </div>

            {/* Grant Type Tag */}
            {grantType && (
                <div className="mb-4">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${getTagColor(grantType)}`}>
                        {grantType}
                    </span>
                </div>
            )}

            {/* Grant Description */}
            <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 mb-4">
                {description}
            </p>

            {/* Focus Area Tags */}
            {categories && categories.length > 0 && (
                <div className="mb-5">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Focus Areas</h4>
                    <div className="flex flex-wrap gap-2">
                        {categories.slice(0, 4).map(cat => (
                            <button 
                                key={cat.id} 
                                onClick={() => onFilterByCategory(cat.name)}
                                className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-md hover:bg-slate-200 transition-colors"
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Spacer to push footer to bottom */}
            <div className="flex-grow"></div>

            {/* Card Footer with Details */}
            <div className="border-t border-slate-200 pt-4 space-y-3 text-sm">
                <div className="flex items-center text-slate-600">
                    <MapPin size={14} className="mr-2.5 flex-shrink-0" />
                    <span className="truncate">{locationText}</span>
                </div>
                <div className="flex items-center text-slate-600">
                    <DollarSign size={14} className="mr-2.5 flex-shrink-0" />
                    <span>Funding: <span className="font-semibold text-slate-800">{fundingText}</span></span>
                </div>
                <div className="flex items-center text-slate-600">
                    <Calendar size={14} className="mr-2.5 flex-shrink-0" />
                    <span>Due: <span className="font-semibold text-slate-800">{dueDateText}</span></span>
                </div>
            </div>

            {/* Action Button */}
            <div className="mt-6">
                <button 
                    onClick={() => onOpenDetailModal(grant)}
                    className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm"
                >
                    View Details
                </button>
            </div>
        </div>
    );
}
