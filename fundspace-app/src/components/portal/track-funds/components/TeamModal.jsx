// src/components/portal/track-funds/components/TeamModal.jsx
import React, { useState } from 'react';
import { X } from '../../../Icons.jsx';

const TeamModal = ({ isVisible, onClose }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('reviewer');

  const handleSubmit = () => {
    if (email.trim()) {
      // In real app, this would call your API
      console.log('Inviting team member:', { email, role });
      setEmail('');
      setRole('reviewer');
      onClose();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Add Team Member</h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="Enter team member's email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Role
              </label>
              <select 
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="reviewer">Reviewer</option>
                <option value="writer">Writer</option>
                <option value="lead">Lead</option>
                <option value="observer">Observer</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-xl">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-slate-600 hover:text-slate-800 font-medium rounded-lg hover:bg-slate-100 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!email.trim()}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send Invitation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamModal;