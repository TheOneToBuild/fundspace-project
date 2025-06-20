// src/GrantDetailModal.jsx
import React from 'react';
import { X, ExternalLink, MapPin, Calendar, DollarSign, Tag, ShieldCheck } from 'lucide-react';
import { formatDate, getPillClasses } from './utils.js';

const GrantDetailModal = ({ grant, isOpen, onClose }) => {
  if (!isOpen || !grant) {
    return null;
  }
  
  const grantData = {
    ...grant,
    foundationName: grant.foundation_name || grant.foundationName,
    funderLogoUrl: grant.funderLogoUrl || null, // Ensure logo URL is available
    fundingAmount: grant.funding_amount_text || grant.fundingAmount || 'Not specified',
    dueDate: grant.due_date || grant.dueDate,
    url: grant.application_url || grant.url,
    eligibility_criteria: grant.eligibility_criteria || grant.eligibility,
  };

  const getInitials = (name) => {
      if (!name) return '?';
      const words = name.split(' ');
      if (words.length > 1) {
          return (words[0][0] + words[1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm"
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
      >
        <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-slate-50 rounded-t-xl">
          <h2 className="text-xl font-semibold text-slate-800 leading-tight">{grantData.title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-full hover:bg-slate-200"
            aria-label="Close modal"
          >
            <X size={22} />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
          {/* Funder Info with Logo */}
          <div className="flex items-center">
             {grantData.funderLogoUrl ? (
                <img 
                    src={grantData.funderLogoUrl} 
                    alt={`${grantData.foundationName} logo`}
                    className="h-8 w-8 mr-3 rounded-full object-contain border border-slate-200 flex-shrink-0"
                    onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
                />
            ) : null }
            <div className={`h-8 w-8 mr-3 rounded-full bg-blue-100 text-blue-600 flex-shrink-0 items-center justify-center font-bold text-sm border border-blue-200 ${grantData.funderLogoUrl ? 'hidden' : 'flex'}`}>
                {getInitials(grantData.foundationName)}
            </div>
            <p className="text-md font-medium text-blue-700">{grantData.foundationName}</p>
          </div>
          
          <div>
            <h4 className="text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Full Description</h4>
            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">{grantData.description}</p>
          </div>

          {grantData.eligibility_criteria && (
            <div>
                <h4 className="text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Eligibility Criteria</h4>
                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">{grantData.eligibility_criteria}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-start">
              <Calendar size={18} className="mr-2.5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-xs text-slate-500 block">Due Date</span>
                <span className="text-sm font-medium text-slate-800">{grantData.dueDate ? formatDate(grantData.dueDate) : 'Continuous'}</span>
              </div>
            </div>
            <div className="flex items-start">
              <DollarSign size={18} className="mr-2.5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-xs text-slate-500 block">Funding Amount</span>
                <span className="text-sm font-medium text-slate-800">{grantData.fundingAmount}</span>
              </div>
            </div>
            <div className="flex items-start md:col-span-2">
              <MapPin size={18} className="mr-2.5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-xs text-slate-500 block">Eligible Location(s)</span>
                <span className="text-sm font-medium text-slate-800">{grantData.locations?.map(l => l.name).join(', ') || 'Not specified'}</span>
              </div>
            </div>
          </div>

          {grantData.categories && grantData.categories.length > 0 && (
            <div className="pt-4 border-t border-slate-200">
              <h4 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Relevant Categories</h4>
              <div className="flex flex-wrap gap-2">
                {grantData.categories.map((cat) => (
                  <span key={cat.id} className={`text-sm font-medium px-3 py-1 rounded-full inline-flex items-center ${getPillClasses(cat.name)}`}>
                    {cat.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-200 bg-slate-50 rounded-b-xl flex flex-col sm:flex-row justify-end items-center space-y-3 sm:space-y-0 sm:space-x-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-100"
          >
            Close
          </button>
          {grantData.url && grantData.url !== '#' && (
            <a
              href={grantData.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Go to Grant Page <ExternalLink size={16} className="ml-2" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default GrantDetailModal;
