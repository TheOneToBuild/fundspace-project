// src/components/portal/track-funds/components/DashboardHeader.jsx
import React from 'react';
import { FileText, DollarSign, Clock } from '../../../Icons.jsx';

const DashboardHeader = ({ applications = [] }) => {
  // Calculate summary statistics
  const totalAmount = applications.reduce((sum, app) => {
    const amount = app.amount.replace(/[$,KM]/g, '');
    const multiplier = app.amount.includes('K') ? 1000 : app.amount.includes('M') ? 1000000 : 1;
    return sum + (parseFloat(amount) * multiplier);
  }, 0);

  // Calculate pending deadlines (applications with upcoming deadlines in next 30 days)
  const pendingDeadlines = applications.filter(app => {
    if (!app.nextDeadline) return false;
    // For demo purposes, assume some applications have pending deadlines
    return Math.random() > 0.6; // ~40% have pending deadlines
  }).length;

  const formatAmount = (amount) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  return (
    <div className="bg-gradient-to-r from-pink-200 via-purple-200 to-blue-200 text-slate-800 rounded-xl p-6 shadow-lg border border-pink-200">
      <h1 className="text-2xl font-bold mb-2 text-slate-900">Application Dashboard</h1>
      <p className="text-purple-700 mb-6">Comprehensive grant application tracking and team collaboration</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/40 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={20} className="text-pink-600" />
            <span className="font-medium text-slate-700">Active Applications</span>
          </div>
          <span className="text-2xl font-bold text-slate-900">{applications.length}</span>
        </div>
        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/40 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={20} className="text-purple-600" />
            <span className="font-medium text-slate-700">Total Applied</span>
          </div>
          <span className="text-2xl font-bold text-slate-900">{formatAmount(totalAmount)}</span>
        </div>
        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/40 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={20} className="text-blue-600" />
            <span className="font-medium text-slate-700">Pending Deadlines</span>
          </div>
          <span className="text-2xl font-bold text-slate-900">{pendingDeadlines}</span>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;