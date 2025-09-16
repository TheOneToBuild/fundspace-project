import React from 'react';
import { Building } from 'lucide-react';

export default function GrantCard({ grant }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-slate-900 line-clamp-2">{grant.title}</h3>
                <span className="text-xs text-slate-500 whitespace-nowrap ml-2">
                    {grant.deadline && new Date(grant.deadline).toLocaleDateString()}
                </span>
            </div>
            
            <p className="text-slate-600 text-sm line-clamp-2 mb-3">{grant.description}</p>
            
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-slate-100 rounded overflow-hidden">
                        {grant.organizations?.image_url ? (
                            <img src={grant.organizations.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <Building className="w-4 h-4 text-slate-400 m-1" />
                        )}
                    </div>
                    <span className="text-sm text-slate-600">{grant.organizations?.name}</span>
                </div>
                
                <div className="text-right">
                    <p className="text-sm font-medium text-green-600">
                        {grant.funding_amount_text || 'Amount varies'}
                    </p>
                </div>
            </div>
        </div>
    );
}