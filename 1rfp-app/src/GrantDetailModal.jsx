// src/GrantDetailModal.jsx
import React, { useState } from 'react';
import { X, ExternalLink, MapPin, Calendar, DollarSign, Tag, ShieldCheck, Bookmark, Users, Building2, Clock, Zap, Target, Info, CheckCircle, AlertCircle, Sparkles, ChevronRight, Globe, Mail, Phone, FileText, Award } from 'lucide-react';
import { formatDate, getPillClasses } from './utils.js';

// Enhanced taxonomy display names
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

// Enhanced pill classes with gradients
const getEnhancedPillClasses = (categoryName) => {
  const categoryMap = {
    'Arts': 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-200',
    'Culture': 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-200',
    'Education': 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-blue-200',
    'Health': 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border-emerald-200',
    'Healthcare': 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border-emerald-200',
    'Environment': 'bg-gradient-to-r from-green-100 to-teal-100 text-green-700 border-green-200',
    'Housing': 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 border-orange-200',
    'Technology': 'bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-700 border-cyan-200',
    'Innovation': 'bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 border-violet-200',
    'Community': 'bg-gradient-to-r from-rose-100 to-pink-100 text-rose-700 border-rose-200',
    'Community Development': 'bg-gradient-to-r from-rose-100 to-pink-100 text-rose-700 border-rose-200',
    'Social Impact': 'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 border-indigo-200',
    'Research': 'bg-gradient-to-r from-slate-100 to-blue-100 text-slate-700 border-slate-200'
  };
  
  return categoryMap[categoryName] || 'bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700 border-slate-200';
};

const getOrgTypePillClasses = (taxonomyCode) => {
  const typeMap = {
    'nonprofit': 'bg-gradient-to-r from-rose-100 to-red-100 text-rose-700 border-rose-200',
    'education': 'bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-700 border-indigo-200',
    'healthcare': 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border-emerald-200',
    'government': 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-blue-200',
    'foundation': 'bg-gradient-to-r from-purple-100 to-violet-100 text-purple-700 border-purple-200',
    'forprofit': 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200',
    'religious': 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border-amber-200',
    'international': 'bg-gradient-to-r from-cyan-100 to-teal-100 text-cyan-700 border-cyan-200'
  };
  
  const prefix = taxonomyCode.split('.')[0];
  return typeMap[prefix] || 'bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700 border-slate-200';
};

const GrantDetailModal = ({ grant, isOpen, onClose, session, isSaved, onSave, onUnsave }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!isOpen || !grant) {
    return null;
  }
  
  const grantData = {
    ...grant,
    foundationName: grant.foundation_name || grant.foundationName,
    funderLogoUrl: grant.funderLogoUrl || null,
    fundingAmount: grant.funding_amount_text || grant.fundingAmount || 'Not specified',
    dueDate: grant.due_date || grant.dueDate,
    url: grant.application_url || grant.url,
    eligibility_criteria: grant.eligibility_criteria || grant.eligibility,
  };

  const getInitials = (name) => {
      if (!name) return '?';
      const words = name.split(' ');
      if (words.length > 1 && words[0] && words[1]) {
          return (words[0][0] + words[1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
  };

  const formatFunding = (amount) => {
    if (typeof amount === 'string' && amount.includes('$')) return amount;
    const cleanAmount = amount?.toString().replace(/[^0-9]/g, '') || '0';
    const num = parseInt(cleanAmount);
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
    return `$${num.toLocaleString()}`;
  };

  const handleBookmarkClick = () => {
    if (!session) return;
    isSaved ? onUnsave(grant.id) : onSave(grant.id);
  };

  const isEndingSoon = grantData.dueDate && new Date(grantData.dueDate) <= new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const isExpired = grantData.dueDate && new Date(grantData.dueDate) < new Date();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Info },
    { id: 'eligibility', label: 'Eligibility', icon: ShieldCheck },
    { id: 'details', label: 'Details', icon: FileText }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-white/20">
        {/* Enhanced Header */}
        <div className="relative p-6 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-b border-slate-200">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-600/10 rounded-full -translate-y-8 translate-x-8"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-400/10 to-rose-600/10 rounded-full translate-y-4 -translate-x-4"></div>
          </div>
          
          <div className="relative flex justify-between items-start">
            <div className="flex-1 pr-4">
              {/* Status badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {isExpired && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-slate-400 to-slate-500 text-white text-sm font-semibold rounded-full">
                    <AlertCircle size={14} />
                    Expired
                  </span>
                )}
                {isEndingSoon && !isExpired && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-red-400 to-orange-500 text-white text-sm font-semibold rounded-full animate-pulse">
                    <Clock size={14} />
                    Ending Soon
                  </span>
                )}
                {grantData.grantType && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 text-sm font-semibold rounded-full border border-blue-200">
                    <Award size={14} />
                    {grantData.grantType}
                  </span>
                )}
              </div>
              
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-3 leading-tight">
                {grantData.title}
              </h2>
              
              {/* Funder info */}
              <div className="flex items-center">
                {grantData.funderLogoUrl ? (
                  <img 
                    src={grantData.funderLogoUrl} 
                    alt={`${grantData.foundationName} logo`} 
                    className="h-10 w-10 mr-3 rounded-xl object-cover border-2 border-white shadow-lg"
                    onError={(e) => { 
                      e.currentTarget.style.display = 'none'; 
                      e.currentTarget.nextSibling.style.display = 'flex'; 
                    }}
                  />
                ) : null}
                <div className={`h-10 w-10 mr-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-lg ${grantData.funderLogoUrl ? 'hidden' : 'flex'}`}>
                  {getInitials(grantData.foundationName)}
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-700">{grantData.foundationName}</p>
                  <p className="text-sm text-slate-500">Grant Funder</p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={onClose} 
              className="p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors shadow-lg border border-white/40"
              aria-label="Close modal"
            >
              <X size={24} className="text-slate-600" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-semibold transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
                }`}
              >
                <Icon size={18} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="p-6 space-y-6">
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-2xl border border-green-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-100 rounded-xl">
                      <DollarSign size={20} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-green-700">Funding Amount</p>
                      <p className="text-xl font-bold text-green-800">{formatFunding(grantData.fundingAmount)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-red-50 to-orange-50 p-4 rounded-2xl border border-red-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-red-100 rounded-xl">
                      <Calendar size={20} className="text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-red-700">Due Date</p>
                      <p className="text-lg font-bold text-red-800">
                        {grantData.dueDate ? formatDate(grantData.dueDate) : 'Rolling Deadline'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-xl">
                      <MapPin size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-blue-700">Location</p>
                      <p className="text-sm font-bold text-blue-800">
                        {grantData.locations?.map(l => l.name).join(', ') || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <FileText size={20} className="text-slate-600" />
                  Grant Description
                </h3>
                <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                  {grantData.description}
                </p>
              </div>

              {/* Focus Areas */}
              {grantData.categories && grantData.categories.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Target size={20} className="text-slate-600" />
                    Focus Areas & Categories
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {grantData.categories.map((category, index) => {
                      const categoryName = category.name || category;
                      return (
                        <span 
                          key={category.id || index} 
                          className={`px-4 py-2 rounded-full font-semibold border transition-all duration-300 hover:scale-105 ${getEnhancedPillClasses(categoryName)}`}
                        >
                          {categoryName}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'eligibility' && (
            <div className="p-6 space-y-6">
              {/* Eligible Organizations */}
              {grantData.eligible_organization_types && grantData.eligible_organization_types.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Users size={20} className="text-slate-600" />
                    Eligible Organization Types
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {grantData.eligible_organization_types.map((taxonomyCode, index) => {
                      const displayName = TAXONOMY_DISPLAY_NAMES[taxonomyCode] || taxonomyCode;
                      return (
                        <div 
                          key={index}
                          className={`p-4 rounded-xl border transition-all duration-300 hover:scale-105 ${getOrgTypePillClasses(taxonomyCode)}`}
                        >
                          <div className="flex items-center gap-3">
                            <CheckCircle size={16} className="flex-shrink-0" />
                            <span className="font-semibold">{displayName}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Detailed Eligibility Criteria */}
              {grantData.eligibility_criteria && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100">
                  <h3 className="text-lg font-semibold text-indigo-800 mb-4 flex items-center gap-2">
                    <ShieldCheck size={20} className="text-indigo-600" />
                    Detailed Eligibility Requirements
                  </h3>
                  <div className="prose prose-indigo max-w-none">
                    <p className="text-indigo-700 leading-relaxed whitespace-pre-line">
                      {grantData.eligibility_criteria}
                    </p>
                  </div>
                </div>
              )}

              {/* Additional Requirements */}
              <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200">
                <h3 className="text-lg font-semibold text-amber-800 mb-3 flex items-center gap-2">
                  <AlertCircle size={20} className="text-amber-600" />
                  Important Notes
                </h3>
                <ul className="space-y-2 text-amber-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                    Review all eligibility requirements carefully before applying
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                    Ensure your organization meets the funder's mission alignment
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                    Prepare required documentation in advance
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="p-6 space-y-6">
              {/* Application Information */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-2xl border border-blue-100">
                <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
                  <ExternalLink size={20} className="text-blue-600" />
                  Application Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl">
                    <span className="font-medium text-blue-700">Application Deadline</span>
                    <span className="font-bold text-blue-800">
                      {grantData.dueDate ? formatDate(grantData.dueDate) : 'Rolling'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl">
                    <span className="font-medium text-blue-700">Grant Type</span>
                    <span className="font-bold text-blue-800">{grantData.grantType || 'General Grant'}</span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Mail size={20} className="text-slate-600" />
                  Funder Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-white rounded-xl">
                    <Building2 size={18} className="text-slate-500" />
                    <div>
                      <p className="font-semibold text-slate-800">{grantData.foundationName}</p>
                      <p className="text-sm text-slate-600">Grant Funder</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Resources */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-100">
                <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center gap-2">
                  <Sparkles size={20} className="text-purple-600" />
                  Next Steps
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-white/60 rounded-xl">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-sm mt-0.5">1</div>
                    <div>
                      <p className="font-semibold text-purple-800">Review Requirements</p>
                      <p className="text-sm text-purple-600">Ensure your project aligns with the grant criteria</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-white/60 rounded-xl">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-sm mt-0.5">2</div>
                    <div>
                      <p className="font-semibold text-purple-800">Prepare Application</p>
                      <p className="text-sm text-purple-600">Gather required documents and information</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-white/60 rounded-xl">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-sm mt-0.5">3</div>
                    <div>
                      <p className="font-semibold text-purple-800">Submit Application</p>
                      <p className="text-sm text-purple-600">Apply through the official grant portal</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Footer */}
        <div className="p-6 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 border border-slate-300 rounded-xl text-slate-700 bg-white hover:bg-slate-50 font-semibold transition-all duration-300 hover:shadow-lg"
              >
                Close
              </button>
              
              {session && (
                <button
                  onClick={handleBookmarkClick}
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg transform hover:scale-105 ${
                    isSaved 
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600' 
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Bookmark size={18} fill={isSaved ? 'currentColor' : 'none'} />
                  {isSaved ? 'Saved' : 'Save Grant'}
                </button>
              )}
            </div>
            
            {grantData.url && grantData.url !== '#' && (
              <a
                href={grantData.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:from-blue-700 hover:to-purple-700"
              >
                <Sparkles size={18} />
                Apply for Grant
                <ChevronRight size={18} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrantDetailModal;