// src/components/organization-profile/ProgramDetailModal.jsx
import React, { useState } from 'react';
import { 
  X, ExternalLink, MapPin, Calendar, Users, Target, Info, 
  FileText, Award, Sparkles, ChevronRight, ClipboardList,
  TrendingUp, Clock, CheckCircle, AlertCircle, Edit3
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="space-y-8">
            
            {/* Key Information Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Target Population */}
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

              {/* Location */}
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

              {/* Duration */}
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

              {/* Impact */}
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
            </div>

            {/* Goals Section */}
            {program.goals && (
              <div className="bg-gradient-to-br from-slate-50/50 to-gray-50/30 rounded-2xl p-8 border border-slate-100/50 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                    <Target size={24} className="text-slate-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">Goals & Objectives</h3>
                </div>
                <div className="bg-white/60 rounded-xl p-6 border border-slate-200/50">
                  <p className="text-slate-700 leading-relaxed whitespace-pre-line text-lg">
                    {program.goals}
                  </p>
                </div>
              </div>
            )}

            {/* Program Highlights */}
            <div className="bg-gradient-to-br from-indigo-50/30 via-purple-50/20 to-pink-50/30 rounded-2xl p-8 border border-indigo-100/30 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <Sparkles size={24} className="text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900">Program Features</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-white/40 rounded-xl border border-white/60">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users size={20} className="text-indigo-600" />
                  </div>
                  <p className="font-semibold text-slate-900">Community</p>
                  <p className="text-sm text-slate-600 mt-1">Focused</p>
                </div>
                <div className="text-center p-6 bg-white/40 rounded-xl border border-white/60">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Target size={20} className="text-purple-600" />
                  </div>
                  <p className="font-semibold text-slate-900">Impact</p>
                  <p className="text-sm text-slate-600 mt-1">Driven</p>
                </div>
                <div className="text-center p-6 bg-white/40 rounded-xl border border-white/60">
                  <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <TrendingUp size={20} className="text-pink-600" />
                  </div>
                  <p className="font-semibold text-slate-900">Results</p>
                  <p className="text-sm text-slate-600 mt-1">Oriented</p>
                </div>
              </div>
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