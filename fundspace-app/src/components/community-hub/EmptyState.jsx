// src/components/community-hub/components/EmptyState.jsx
import React from 'react';
import { MessageCircle } from 'lucide-react';
import PropTypes from 'prop-types';

const EmptyState = ({ channelName, channelConfig }) => (
  <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-12 text-center relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-white to-blue-50/30"></div>
    <div className="relative">
      <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
        <MessageCircle size={32} className="text-white" />
      </div>
      <h3 className="text-2xl font-bold text-slate-900 mb-3">Start the Conversation</h3>
      <p className="text-slate-600 mb-8 max-w-md mx-auto leading-relaxed">
        Be the first to share something amazing in <span className="font-semibold text-slate-800">{channelName}</span>!
      </p>
      <div className={`inline-flex items-center px-6 py-3 bg-gradient-to-r ${channelConfig?.gradient || 'from-blue-500 to-purple-600'} text-white rounded-xl font-semibold shadow-lg`}>
        <span className="w-2 h-2 bg-white/60 rounded-full mr-3 animate-pulse"></span>
        Share your first post above
      </div>
    </div>
  </div>
);

EmptyState.propTypes = { 
  channelName: PropTypes.string.isRequired,
  channelConfig: PropTypes.object 
};

export default EmptyState;