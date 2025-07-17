import React from 'react';
import GrantCard from '../GrantCard.jsx';
import { ClipboardList } from '../Icons.jsx';

export default function FunderProfileGrants({ grants, onOpenDetail }) {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-slate-800 mb-3">Active Grants</h3>
        
        {grants && grants.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {grants.map(grant => (
              <GrantCard
                key={grant.id}
                grant={grant}
                onOpenDetailModal={onOpenDetail}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200">
            <ClipboardList className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Active Grants Found</h3>
            <p className="text-slate-600">There are currently no active grant opportunities listed for this funder.</p>
          </div>
        )}
      </div>
    </div>
  );
}