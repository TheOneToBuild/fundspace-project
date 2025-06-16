// src/components/GrantCard.jsx
import React from 'react';
import { Link } from 'react-router-dom'; // Use Link for internal navigation if needed in the future
import { IconBriefcase, MapPin, DollarSign, Calendar, Zap, ExternalLink } from './Icons.jsx';
import { formatDate, getPillClasses, getGrantTypePillClasses } from '../utils.js';

const GrantCard = ({ grant, onOpenDetailModal }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let isEndingSoon = false;
    let daysUntilDue = null;

    if (grant.dueDate) {
        const dueDate = new Date(grant.dueDate);
        daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
        isEndingSoon = daysUntilDue >= 0 && daysUntilDue <= 3;
    }

    const grantData = {
        ...grant,
        foundationName: grant.foundation_name || grant.foundationName,
        fundingAmount: grant.funding_amount_text || grant.fundingAmount,
        dueDate: grant.due_date || grant.dueDate,
        grantType: grant.grant_type || grant.grantType,
        startDate: grant.start_date || grant.startDate
    };


    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-xl transition-all duration-300 ease-in-out flex flex-col justify-between transform hover:-translate-y-1 relative overflow-hidden h-full">
            {isEndingSoon && (
                <span
                    className="absolute top-0 right-[-1px] bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg z-10 uppercase tracking-wider shadow-sm"
                    title={`Due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`}
                >
                    ENDING SOON
                </span>
            )}
            <div>
                <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-slate-800 group-hover:text-blue-600 transition-colors duration-200 pr-4">
                        {grantData.title}
                    </h3>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span
                            className={`text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap ${getPillClasses(grantData.category)}`}
                        >
                            {grantData.category}
                        </span>
                        {grantData.grantType && (
                            <span
                                className={`text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap ${getGrantTypePillClasses(grantData.grantType)}`}
                            >
                                {grantData.grantType}
                            </span>
                        )}
                    </div>
                </div>
                <p className="text-sm text-slate-600 mb-2 flex items-center">
                    <IconBriefcase size={15} className="w-4 h-4 mr-2 text-slate-400 flex-shrink-0" />
                    {grantData.foundationName}
                </p>
                <p className="text-sm text-slate-500 mb-4 line-clamp-3 leading-relaxed">
                    {grantData.description}
                </p>
                <div className="space-y-2.5 text-sm mb-5">
                    <div className="flex items-center text-slate-700">
                        <MapPin size={15} className="mr-2.5 text-blue-500 flex-shrink-0" />
                        <div><span className="font-medium text-slate-600">Location:</span> {grantData.location}</div>
                    </div>
                    <div className="flex items-center text-slate-700">
                        <DollarSign size={15} className="mr-2.5 text-green-500 flex-shrink-0" />
                        <div><span className="font-medium text-slate-600">Funding:</span> {grantData.fundingAmount}</div>
                    </div>
                    <div className="flex items-center text-slate-700">
                        <Calendar size={15} className="mr-2.5 text-red-500 flex-shrink-0" />
                        <div>
                            <span className="font-medium text-slate-600">Due:</span>{' '}
                            {grantData.dueDate ? formatDate(grantData.dueDate) : 'Continuous'}
                        </div>
                    </div>
                    {grantData.startDate && (
                        <div className="flex items-center text-slate-700">
                            <Zap size={15} className="mr-2.5 text-yellow-500 flex-shrink-0" />
                            <div><span className="font-medium text-slate-600">Start Date:</span> {formatDate(grantData.startDate)}</div>
                        </div>
                    )}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200 bg-slate-50 p-3 rounded-md">
                    <h4 className="text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">Eligibility Highlights:</h4>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{grantData.eligibility}</p>
                </div>
            </div>
            <div className="mt-6">
                <button
                    onClick={() => onOpenDetailModal(grantData)}
                    className="inline-flex items-center justify-center w-full px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ease-in-out transform hover:scale-105"
                >
                    View Grant Details <ExternalLink size={16} className="ml-2 opacity-80" />
                </button>
            </div>
        </div>
    );
};

export default GrantCard;