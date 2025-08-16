// src/components/portal/track-funds/AwardConfirmModal.jsx
import React, { useState } from 'react';
import { Trophy } from '../../Icons.jsx';

const AwardConfirmModal = ({ isOpen, onClose, onConfirm, grantTitle }) => {
  const [awardAmount, setAwardAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    const amount = awardAmount ? parseFloat(awardAmount) : null;
    const success = await onConfirm(amount, notes);
    setIsSubmitting(false);
    if (success) {
      setAwardAmount('');
      setNotes('');
    }
  };

  const handleClose = () => {
    setAwardAmount('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy size={32} className="text-green-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Congratulations! 🎉</h3>
          <p className="text-slate-600 mb-4">
            Amazing news! You received funding for <strong>{grantTitle}</strong>. This is huge! 
          </p>
          
          <input
            type="number"
            placeholder="Award amount (optional)"
            value={awardAmount}
            onChange={(e) => setAwardAmount(e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 mb-4"
          />

          <textarea
            placeholder="Add any notes about the award (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 mb-6 resize-none"
          />
          
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 text-slate-600 hover:text-slate-800 font-semibold rounded-xl hover:bg-slate-100 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Celebrating...
                </>
              ) : (
                <>
                  <Trophy size={16} />
                  Mark as Received!
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AwardConfirmModal;