// src/components/GrantCard.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IconBriefcase, MapPin, DollarSign, Calendar, ExternalLink, ShieldCheck, Bookmark } from './Icons.jsx';
import { formatDate, getPillClasses, getGrantTypePillClasses, formatFundingDisplay } from '../utils.js';

const GrantCard = ({ grant, onOpenDetailModal, onFilterByCategory, onSave, onUnsave, isSaved, session }) => {
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

    const grantData = grant;

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
        <div className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-xl transition-all duration-300 ease-in-out flex flex-col justify-between transform hover:-translate-y-1 relative overflow-hidden h-full">
            
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
                        {grantData.title}
                    </h3>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        {grantData.grantType && (
                            <span className={`text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap ${getGrantTypePillClasses(grantData.grantType)}`}>
                                {grantData.grantType}
                            </span>
                        )}
                        {grantData.save_count > 0 && (
                            <div
                                className="flex items-center gap-1 bg-indigo-50 text-indigo-700 rounded-full px-2 py-1"
                                title={`${grantData.save_count} user${grantData.save_count === 1 ? '' : 's'} saved this grant`}
                            >
                                <Bookmark size={14} className="text-indigo-500" fill="currentColor"/>
                                <span className="text-sm font-bold">{grantData.save_count}</span>
                            </div>
                        )}
                    </div>
                </div>
                
                <Link 
                    to={`/funders/${grantData.funderSlug}`} 
                    className={`flex items-center mb-4 group ${isExpired ? 'pointer-events-none' : ''}`}
                    onClick={(e) => { if(isExpired) e.preventDefault(); e.stopPropagation(); }}
                >
                    {grantData.funderLogoUrl ? (
                        <img 
                            src={grantData.funderLogoUrl} 
                            alt={`${grantData.foundationName} logo`}
                            className="h-6 w-6 mr-2 rounded-full object-contain border border-slate-200 flex-shrink-0"
                            onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
                        />
                    ) : null }
                    <div className={`h-6 w-6 mr-2 rounded-full bg-blue-100 text-blue-600 flex-shrink-0 items-center justify-center font-bold text-[10px] border border-blue-200 ${grantData.funderLogoUrl ? 'hidden' : 'flex'}`}>
                        {getInitials(grantData.foundationName)}
                    </div>
                    <span className="text-sm text-slate-600 font-medium truncate group-hover:underline group-hover:text-blue-600 transition-colors">
                        {grantData.foundationName}
                    </span>
                </Link>

                {grantData.categories && grantData.categories.length > 0 && (
                    <div className="mb-4">
                        <h4 className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Focus Areas</h4>
                        <div className="flex flex-wrap gap-2">
                            {grantData.categories.map((category, index) => {
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
                            <div className="line-clamp-4">
                                <span className="font-medium text-slate-600">Eligibility: </span>
                                {grantData.eligibility_criteria}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-auto flex justify-between items-center relative z-0">
                <button
                    onClick={() => onOpenDetailModal(grant)}
                    disabled={isExpired}
                    className="inline-flex items-center justify-center flex-grow px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ease-in-out transform hover:scale-105 disabled:bg-slate-400 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                >
                    View Details
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

export default GrantCard;