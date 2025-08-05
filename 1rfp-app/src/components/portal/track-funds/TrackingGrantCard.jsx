// src/components/portal/track-funds/TrackingGrantCard.jsx
import React, { useState } from 'react';
import { 
  FileText, 
  Trophy, 
  Building2, 
  DollarSign, 
  Calendar, 
  Sparkles,
  RotateCcw,
  User
} from '../../Icons.jsx';
import ApplicationConfirmModal from './ApplicationConfirmModal.jsx';
import AwardConfirmModal from './AwardConfirmModal.jsx';

const TrackingGrantCard = ({ 
  grant, 
  onOpenDetailModal, 
  onMarkAsApplied, 
  onMarkAsReceived,
  onRemoveApplication,
  activeSection 
}) => {
  const [showAppliedConfirm, setShowAppliedConfirm] = useState(false);
  const [showReceivedConfirm, setShowReceivedConfirm] = useState(false);
  const [showUndoConfirm, setShowUndoConfirm] = useState(false);

  const hasApplication = grant.application_id;
  const hasAward = grant.award_id;

  const handleAppliedConfirm = async (notes = '') => {
    const success = await onMarkAsApplied(grant.id, notes);
    if (success) {
      setShowAppliedConfirm(false);
    }
    return success;
  };

  const handleReceivedConfirm = async (awardAmount = null, notes = '') => {
    const success = await onMarkAsReceived(grant.id, awardAmount, notes);
    if (success) {
      setShowReceivedConfirm(false);
    }
    return success;
  };

  const handleUndoApplication = async () => {
    const success = await onRemoveApplication(grant.id);
    if (success) {
      setShowUndoConfirm(false);
    }
    return success;
  };

  // Format funding amount for display
  const formatFundingAmount = (amount) => {
    if (!amount || amount === 'Not specified') return 'Amount not specified';
    
    // If it's already a formatted string, return it
    if (typeof amount === 'string' && amount.includes('$')) return amount;
    
    // If it's a number, format it
    const numAmount = typeof amount === 'string' ? parseInt(amount) : amount;
    if (numAmount >= 1000000) {
      return `$${(numAmount / 1000000).toFixed(1)}M`;
    } else if (numAmount >= 1000) {
      return `$${(numAmount / 1000).toFixed(0)}K`;
    }
    return `$${numAmount?.toLocaleString() || 'Not specified'}`;
  };

  // Get user initials for avatar fallback
  const getUserInitials = (name) => {
    if (!name) return '?';
    const words = name.split(' ');
    return words.length > 1 
      ? (words[0][0] + words[words.length - 1][0]).toUpperCase() 
      : name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="relative group">
      {/* Base Grant Card */}
      <div className="bg-white rounded-xl border border-slate-200 hover:shadow-xl transition-all duration-300 ease-in-out flex flex-col justify-between transform hover:-translate-y-1 relative overflow-hidden h-full">
        
        {/* Top right corner elements */}
        <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-2">
          {/* Undo Applied button - small in top right for applications */}
          {activeSection === 'applications' && hasApplication && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowUndoConfirm(true);
              }}
              className="flex items-center gap-1 px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-md shadow-sm transition-all duration-200 transform hover:scale-105"
              title="Undo Application"
            >
              <RotateCcw size={12} />
              Undo
            </button>
          )}

          {/* Status badges */}
          <div className="flex flex-col gap-1">
            {hasApplication && (
              <div className="bg-orange-300 text-orange-800 text-xs font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                <FileText size={10} />
                Applied
              </div>
            )}
            {hasAward && (
              <div className="bg-gradient-to-r from-green-400 to-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                <Trophy size={10} />
                Received
              </div>
            )}
          </div>
        </div>

        {/* Grant content */}
        <div onClick={() => onOpenDetailModal(grant)} className="cursor-pointer p-6 flex-grow">
          {/* Organization header with logo */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-slate-100 shadow-sm flex-shrink-0">
              {grant.organization?.image_url ? (
                <img 
                  src={grant.organization.image_url} 
                  alt={`${grant.foundationName} logo`}
                  className="w-full h-full object-contain bg-white"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
            <div className="flex-grow min-w-0">
              <p className="font-semibold text-slate-800 text-sm truncate">{grant.foundationName}</p>
              {grant.grantType && (
                <p className="text-xs text-blue-600 font-medium">{grant.grantType}</p>
              )}
            </div>
          </div>

          {/* Grant title */}
          <h3 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300 leading-tight">
            {grant.title}
          </h3>

          {/* Description */}
          <p className="text-slate-600 text-sm mb-4 line-clamp-3 leading-relaxed">{grant.description}</p>

          {/* Funding amount and due date on same line */}
          <div className="flex items-center justify-between mb-4">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 px-3 py-2 rounded-lg">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="font-bold text-green-700 text-sm">
                {formatFundingAmount(grant.fundingAmount)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar className="w-4 h-4 text-red-500" />
              <span className="font-medium">
                Due: {grant.dueDate ? new Date(grant.dueDate).toLocaleDateString() : 'Rolling'}
              </span>
            </div>
          </div>

          {/* Applicant info for applications section */}
          {activeSection === 'applications' && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg mb-4">
              <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                {grant.applicant_profile?.avatar_url ? (
                  <img 
                    src={grant.applicant_profile.avatar_url} 
                    alt={grant.applicant_profile.full_name || 'Applicant'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {getUserInitials(grant.applicant_profile?.full_name || grant.applied_by_name || 'Team Member')}
                    </span>
                  </div>
                )}
              </div>
              <span className="text-sm text-blue-700 font-medium">
                Applied by {grant.applicant_profile?.full_name || grant.applied_by_name || 'Team Member'}
              </span>
              {grant.applied_date && (
                <span className="text-xs text-blue-600 ml-auto">
                  {new Date(grant.applied_date).toLocaleDateString()}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action buttons at bottom */}
        <div className="px-6 pb-6 flex gap-2">
          {activeSection === 'saved' && (
            <>
              {!hasApplication ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAppliedConfirm(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                  <FileText size={14} />
                  Mark Applied
                </button>
              ) : !hasAward ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowReceivedConfirm(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                  <Trophy size={14} />
                  Mark Received
                </button>
              ) : (
                <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-slate-400 to-slate-500 text-white font-semibold rounded-xl">
                  <Trophy size={14} />
                  Completed
                </div>
              )}
            </>
          )}

          {/* Details button - always present, full width for applications */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetailModal(grant);
            }}
            className={`${activeSection === 'saved' ? 'px-4' : 'flex-1'} flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-105`}
          >
            <Sparkles size={14} />
            Details
          </button>
        </div>
      </div>

      {/* Confirmation Modals */}
      <ApplicationConfirmModal
        isOpen={showAppliedConfirm}
        onClose={() => setShowAppliedConfirm(false)}
        onConfirm={handleAppliedConfirm}
        grantTitle={grant.title}
      />

      <AwardConfirmModal
        isOpen={showReceivedConfirm}
        onClose={() => setShowReceivedConfirm(false)}
        onConfirm={handleReceivedConfirm}
        grantTitle={grant.title}
      />

      {/* Undo Confirmation Modal */}
      {showUndoConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <RotateCcw size={32} className="text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Undo Application? 🤔</h3>
              <p className="text-slate-600 mb-6">
                This will remove <strong>{grant.title}</strong> from your applications and move it back to saved grants. Are you sure?
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowUndoConfirm(false)}
                  className="flex-1 px-4 py-3 text-slate-600 hover:text-slate-800 font-semibold rounded-xl hover:bg-slate-100 transition-all"
                >
                  Keep Applied
                </button>
                <button
                  onClick={handleUndoApplication}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-700 transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw size={16} />
                  Yes, Undo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackingGrantCard;