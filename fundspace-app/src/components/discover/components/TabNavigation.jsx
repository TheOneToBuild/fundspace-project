import React from 'react';
import { BarChart3, Building, DollarSign, FileText, Trophy } from 'lucide-react';

export default function TabNavigation({ activeTab, setActiveTab, stats }) {
    const tabs = [
        { id: 'overview', label: 'Overview', count: null, icon: BarChart3 },
        { id: 'organizations', label: 'Organizations', count: stats.totalOrganizations, icon: Building },
        { id: 'grants', label: 'Grants', count: 'Live', icon: DollarSign },
        { id: 'requests', label: 'Funding Requests', count: 'Soon', icon: FileText },
        { id: 'wins', label: 'Funding Wins', count: 'Soon', icon: Trophy }
    ];

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2 mb-8">
            <div className="flex gap-3">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2.5 px-5 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                            activeTab === tab.id 
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30' 
                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                        {tab.count && (
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                activeTab === tab.id 
                                    ? 'bg-white/20 text-white' 
                                    : 'bg-slate-200 text-slate-700'
                            }`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}