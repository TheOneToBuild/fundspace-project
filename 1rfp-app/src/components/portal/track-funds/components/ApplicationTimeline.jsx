// src/components/portal/track-funds/components/ApplicationTimeline.jsx
import React from 'react';
import { CheckCircle, Clock, Folder } from '../../../Icons.jsx';

const ApplicationTimeline = ({ phases, currentPhase, totalPhases, nextDeadline, onToggleDocuments }) => {
  const getPhaseGradient = (status, index) => {
    const gradients = [
      'from-blue-400 to-blue-500',
      'from-green-400 to-green-500', 
      'from-purple-400 to-purple-500',
      'from-orange-400 to-orange-500',
      'from-pink-400 to-pink-500',
      'from-indigo-400 to-indigo-500',
      'from-teal-400 to-teal-500'
    ];
    
    if (status === 'completed') return `bg-gradient-to-r ${gradients[index % gradients.length]} text-white`;
    if (status === 'current') return `bg-gradient-to-r from-blue-500 to-purple-500 text-white`;
    return 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-400';
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-slate-700">
          Application Progress: Phase {currentPhase} of {totalPhases}
        </span>
        {nextDeadline && (
          <span className="text-sm font-medium text-red-600 flex items-center gap-1 bg-red-50 px-2 py-1 rounded-md">
            <Clock size={14} />
            {nextDeadline}
          </span>
        )}
      </div>

      {/* Enhanced Timeline */}
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          {phases.slice(0, 7).map((phase, index) => (
            <div key={phase.id} className="flex flex-col items-center relative z-10 max-w-24">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-sm ${getPhaseGradient(phase.status, index)}`}>
                {phase.status === 'completed' ? <CheckCircle size={16} /> :
                 phase.status === 'current' ? <Clock size={16} /> :
                 <div className="w-3 h-3 bg-current rounded-full opacity-50"></div>
                }
              </div>
              <div className="mt-2 text-center">
                <div className={`text-xs font-medium mb-1 ${
                  phase.status === 'completed' ? 'text-slate-700' :
                  phase.status === 'current' ? 'text-blue-700' :
                  'text-slate-500'
                }`}>
                  {phase.name}
                </div>
                {phase.date !== 'TBD' && (
                  <div className="text-xs text-slate-400 mb-1">{phase.date}</div>
                )}
                {(phase.status === 'completed' || phase.status === 'current') && (
                  <button 
                    onClick={() => onToggleDocuments(phase.id)}
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-1 py-0.5 rounded transition-colors"
                  >
                    <Folder size={10} />
                    Docs
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Progress line with gradient */}
        <div className="absolute top-5 left-5 right-5 h-1 bg-slate-200 rounded-full -z-10">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 rounded-full transition-all duration-1000"
            style={{ width: `${((currentPhase - 1) / (totalPhases - 1)) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationTimeline;