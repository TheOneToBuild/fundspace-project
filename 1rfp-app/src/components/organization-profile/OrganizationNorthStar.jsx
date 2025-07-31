// src/components/organization-profile/OrganizationNorthStar.jsx
import React from 'react';
import { Target, Eye, Zap } from 'lucide-react';

const OrganizationNorthStar = ({ organization }) => {
  if (!organization?.northStar) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <div className="text-6xl mb-4">🌟</div>
        <h3 className="text-xl font-medium text-slate-900 mb-2">North Star Coming Soon</h3>
        <p className="text-slate-600">
          We're working on defining our strategic vision and priorities.
        </p>
      </div>
    );
  }

  const { northStar } = organization;

  return (
    <div className="bg-white rounded-2xl p-10 border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="text-center mb-12 max-w-3xl mx-auto">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Target className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-4xl font-bold text-slate-900 mb-4">{northStar.title}</h2>
        <p className="text-xl text-slate-600">{northStar.description}</p>
      </div>

      {/* Vision and Focus */}
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Vision */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4">
            <Eye className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">{northStar.vision.title}</h3>
          <p className="text-slate-700">{northStar.vision.text}</p>
        </div>

        {/* Strategic Focus */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">{northStar.focus.title}</h3>
          <p className="text-slate-700">{northStar.focus.text}</p>
        </div>
      </div>

      {/* Strategic Priorities */}
      {northStar.priorities && northStar.priorities.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-8 rounded-xl border border-emerald-100">
          <h3 className="text-xl font-bold text-slate-900 mb-6">2024-2026 Strategic Priorities</h3>
          <div className="grid md:grid-cols-3 gap-8">
            {northStar.priorities.map((priority, index) => (
              <div key={index}>
                <h4 className="font-semibold text-emerald-800 mb-2">{priority.title}</h4>
                <p className="text-sm text-slate-700">{priority.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationNorthStar;