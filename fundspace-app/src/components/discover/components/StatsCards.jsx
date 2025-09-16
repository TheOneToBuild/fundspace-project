// src/components/discover/components/StatsCards.jsx
import React from 'react';
import { Building, DollarSign, MessageSquare } from 'lucide-react';

export default function StatsCards({ stats }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-slate-600 text-sm">Organizations</p>
                        <p className="text-2xl font-bold text-slate-900">{stats.totalOrgs}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building className="w-6 h-6 text-blue-600" />
                    </div>
                </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-slate-600 text-sm">Active Grants</p>
                        <p className="text-2xl font-bold text-slate-900">{stats.totalGrants}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-slate-600 text-sm">Community Posts</p>
                        <p className="text-2xl font-bold text-slate-900">{stats.totalPosts}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-purple-600" />
                    </div>
                </div>
            </div>
        </div>
    );
}