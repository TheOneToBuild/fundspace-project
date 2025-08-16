// src/components/portal/CreateGrantModal.jsx
import React from 'react';
import { X } from '../Icons.jsx';

const CreateGrantModal = ({ showCreateModal, setShowCreateModal }) => {
  if (!showCreateModal) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl">
        <div className="p-8 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Create New Grant</h2>
              <p className="text-slate-600 mt-1">Set up a new funding opportunity</p>
            </div>
            <button
              onClick={() => setShowCreateModal(false)}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all"
            >
              <X size={24} />
            </button>
          </div>
        </div>
        
        <div className="p-8">
          <p className="text-slate-600 text-center">Grant creation form will be implemented here.</p>
        </div>

        <div className="p-8 border-t border-slate-100 bg-slate-50/50">
          <div className="flex gap-4">
            <button
              onClick={() => setShowCreateModal(false)}
              className="flex-1 px-6 py-3 text-slate-600 hover:text-slate-800 font-semibold rounded-2xl hover:bg-white transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => setShowCreateModal(false)}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              Create Grant
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateGrantModal;