// src/GrantDetailModal.jsx
import React from 'react';
import { X, ExternalLink, MapPin, Calendar, DollarSign, Tag } from 'lucide-react';
import { formatDate, getPillClasses } from './utils.js'; // Import the new function

const GrantDetailModal = ({ grant, isOpen, onClose }) => {
  if (!isOpen || !grant) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm transition-opacity duration-300 ease-in-out"
      style={{ opacity: isOpen ? 1 : 0 }}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden transform transition-all duration-300 ease-in-out scale-95"
        style={{ transform: isOpen ? 'scale(1)' : 'scale(0.95)', opacity: isOpen ? 1 : 0 }}
      >
        <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-slate-50 rounded-t-xl">
          <h2 className="text-xl font-semibold text-slate-800 leading-tight">{grant.title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-full hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            aria-label="Close modal"
          >
            <X size={22} />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
          <div className="pb-3 border-b border-slate-200">
            <p className="text-md font-medium text-blue-700 mb-1.5">{grant.foundationName}</p>
            {/* Use the new function here */}
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center ${getPillClasses(grant.category)}`}>
              <Tag size={13} className="inline mr-1.5 opacity-80" />{grant.category}
            </span>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Full Description</h4>
            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">{grant.description}</p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Eligibility Criteria</h4>
            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">{grant.eligibility}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-start">
              <Calendar size={18} className="mr-2.5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-xs text-slate-500 block">Due Date</span>
                <span className="text-sm font-medium text-slate-800">{formatDate(grant.dueDate)}</span>
              </div>
            </div>
            <div className="flex items-start">
              <DollarSign size={18} className="mr-2.5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-xs text-slate-500 block">Funding Amount</span>
                <span className="text-sm font-medium text-slate-800">{grant.fundingAmount}</span>
              </div>
            </div>
            <div className="flex items-start md:col-span-2">
              <MapPin size={18} className="mr-2.5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-xs text-slate-500 block">Eligible Location(s)</span>
                <span className="text-sm font-medium text-slate-800">{grant.location}</span>
              </div>
            </div>
          </div>

          {grant.keywords && grant.keywords.length > 0 && (
            <div className="pt-4 border-t border-slate-200">
              <h4 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Keywords</h4>
              <div className="flex flex-wrap gap-2">
                {grant.keywords.map((keyword, index) => (
                  <span key={index} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs border border-slate-200 hover:bg-slate-200 transition-colors">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-200 bg-slate-50 rounded-b-xl flex flex-col sm:flex-row justify-end items-center space-y-3 sm:space-y-0 sm:space-x-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150"
          >
            Close
          </button>
          {grant.url && grant.url !== '#' && (
            <a
              href={grant.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150"
            >
              Visit Grant Website <ExternalLink size={16} className="ml-2 opacity-90" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default GrantDetailModal;