// src/components/WelcomeHeader.jsx
import React from 'react';

export default function WelcomeHeader({ profile }) {
    const firstName = profile?.full_name?.split(' ')[0] || 'there';
    const today = new Date();
    const dateString = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    return (
      <div className="bg-gradient-to-r from-blue-50 via-white to-indigo-50 p-6 rounded-xl shadow-sm border border-slate-200/80 mb-8">
        <div className="flex items-center">
            <span className="text-4xl mr-4" role="img" aria-label="Waving hand">👋</span>
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Hi {firstName},</h2>
                <p className="text-slate-500 mt-1">Happy {dateString}</p>
            </div>
        </div>
      </div>
    );
};