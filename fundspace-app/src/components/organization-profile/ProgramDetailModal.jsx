// src/components/organization-profile/ProgramDetailModal.jsx
import React, { useState } from 'react';
import { 
  X, ExternalLink, MapPin, Calendar, Users, Target, Info, 
  FileText, Award, ChevronRight, ClipboardList,
  TrendingUp, Clock, CheckCircle, AlertCircle, Edit3, Building2
} from 'lucide-react';

const ProgramDetailModal = ({ program, isOpen, onClose, onEdit, canEdit = false }) => {
  if (!isOpen || !program) {
    return null;
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-emerald-500';
      case 'planned': return 'bg-blue-500';
      case 'completed': return 'bg-slate-400';
      case 'paused': return 'bg-amber-500';
      default: return 'bg-emerald-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle size={16} />;
      case 'planned': return <Clock size={16} />;
      case 'completed': return <Award size={16} />;
      case 'paused': return <AlertCircle size={16} />;
      default: return <CheckCircle size={16} />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-white/20 animate-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="relative p-8 bg-gradient-to-br from-slate-50/80 via-white/50 to-indigo-50/30 border-b border-slate-200/50">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-200/40 to-purple-200/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-200/30 to-cyan-200/20 rounded-full blur-2xl" />
          </div>
          
          <div className="relative flex justify-between items-start">
            <div className="flex-1 pr-6">
              {/* Status and Title */}
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(program.status)} shadow-lg`} />
                <span className="text-sm font-medium text-slate-600 capitalize">
                  {program.status || 'active'} program
                </span>
              </div>
              
              <h1 className="text-3xl font-bold text-slate-900 mb-4 leading-tight">
                {program.name}
              </h1>
              
              {program.description && (
                <p className="text-lg text-slate-600 leading-relaxed mb-6 max-w-2xl">
                  {program.description}
                </p>
              )}

              {/* Funded By Section in Header */}
              {program.funded_by_organizations && program.funded_by_organizations.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">Funded By</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {program.funded_by_organizations.map((funder) => (
                      <div key={funder.id} className="flex items-center gap-2 px-3 py-2 bg-white/60 border border-slate-200/50 rounded-xl backdrop-blur-sm">
                        {funder.image_url ? (
                          <img
                            src={funder.image_url}
                            alt={funder.name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-slate-300 flex items-center justify-center">
                            <Building2 className="w-3 h-3 text-slate-600" />
                          </div>
                        )}
                        <span className="text-sm font-medium text-slate-800">
                          {funder.name}
                        </span>
                        <span className="text-xs text-slate-500 capitalize">
                          {funder.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <button 
              onClick={onClose} 
              className="p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-200 shadow-lg border border-white/40 hover:scale-110"
              aria-label="Close modal"
            >
              <X size={20} className="text-slate-600" />
            </button>
          </div>
        </div>

        {/* Content - Single page layout, no scrolling */}
        <div className="flex-1 p-8 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            
            {/* Left Column - Goals, Target Population, and Location */}
            <div className="space-y-4">
              
              {/* Goals Section - Top left */}
              {program.goals && (
                <div className="bg-gradient-to-br from-slate-50/50 to-gray-50/30 rounded-2xl p-6 border border-slate-100/50 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                      <Target size={20} className="text-slate-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Goals & Objectives</h3>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{program.goals}</p>
                </div>
              )}

              {/* Target Population - Under Goals */}
              {program.target_population && (
                <div className="bg-gradient-to-br from-purple-50/50 to-indigo-50/30 rounded-2xl p-6 border border-purple-100/50 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Users size={20} className="text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Target Population</h3>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{program.target_population}</p>
                </div>
              )}

              {/* Location - Bottom left */}
              {program.location && (
                <div className="bg-gradient-to-br from-blue-50/50 to-cyan-50/30 rounded-2xl p-6 border border-blue-100/50 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <MapPin size={20} className="text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Location</h3>
                  </div>
                  <p className="text-slate-700">{program.location}</p>
                </div>
              )}
            </div>

            {/* Right Column - Impact and Duration */}
            <div className="space-y-4">
              
              {/* Impact Metrics - Top right */}
              {program.impact_metrics && (
                <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/30 rounded-2xl p-6 border border-amber-100/50 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                      <TrendingUp size={20} className="text-amber-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Impact Metrics</h3>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{program.impact_metrics}</p>
                </div>
              )}

              {/* Duration - Bottom right */}
              {(program.start_date || program.end_date) && (
                <div className="bg-gradient-to-br from-emerald-50/50 to-teal-50/30 rounded-2xl p-6 border border-emerald-100/50 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <Calendar size={20} className="text-emerald-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900">Duration</h3>
                  </div>
                  <p className="text-slate-700">
                    {program.start_date && new Date(program.start_date).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric' 
                    })}
                    {program.start_date && program.end_date && ' — '}
                    {program.end_date && new Date(program.end_date).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric' 
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200/50 bg-slate-50/30 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 text-slate-700 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl hover:bg-white hover:border-slate-300 font-medium transition-all duration-200 hover:scale-105"
              >
                Close
              </button>
              
              {canEdit && (
                <button
                  onClick={() => {
                    onClose();
                    onEdit(program);
                  }}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-medium transition-all duration-200 hover:bg-slate-800 hover:scale-105 shadow-lg"
                >
                  <Edit3 size={16} />
                  Edit Program
                </button>
              )}
            </div>
            
            {program.external_url && (
              <a
                href={program.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium transition-all duration-200 hover:bg-indigo-700 hover:scale-105 shadow-lg"
              >
                <ExternalLink size={16} />
                Learn More
                <ChevronRight size={16} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgramDetailModal;