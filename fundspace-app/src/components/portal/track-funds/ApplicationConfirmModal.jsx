// src/components/portal/track-funds/ApplicationConfirmModal.jsx
import React, { useState } from 'react';
import { FileText } from '../../Icons.jsx';

const ApplicationConfirmModal = ({ isOpen, onClose, onConfirm, grantTitle }) => {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    const success = await onConfirm(notes);
    setIsSubmitting(false);
    if (success) {
      setNotes('');
    }
  };

  const handleClose = () => {
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-100 to-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText size={32} className="text-orange-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Ready to Apply? 🚀</h3>
          <p className="text-slate-600 mb-4">
            Awesome! You're taking the next step. We'll mark <strong>{grantTitle}</strong> as applied in your tracking system.
          </p>
          
          <textarea
            placeholder="Add any notes about your application (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 mb-6 resize-none"
          />
          
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 text-slate-600 hover:text-slate-800 font-semibold rounded-xl hover:bg-slate-100 transition-all disabled:opacity-50"
            >
              Not Yet
            </button>
            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Marking...
                </>
              ) : (
                <>
                  <FileText size={16} />
                  Yes, I Applied!
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationConfirmModal;