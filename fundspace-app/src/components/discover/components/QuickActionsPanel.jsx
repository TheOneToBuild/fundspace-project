// src/components/discover/components/QuickActionsPanel.jsx
import React from 'react';
import { Building, DollarSign, MessageSquare, BarChart3, Zap } from 'lucide-react';

export default function QuickActionsPanel({ isVisible }) {
    const actions = [
        { label: 'Submit Grant', icon: DollarSign, color: 'from-blue-400 to-blue-600', bgColor: 'bg-blue-50' },
        { label: 'Add Organization', icon: Building, color: 'from-emerald-400 to-emerald-600', bgColor: 'bg-emerald-50' },
        { label: 'Create Post', icon: MessageSquare, color: 'from-purple-400 to-purple-600', bgColor: 'bg-purple-50' },
        { label: 'View Analytics', icon: BarChart3, color: 'from-orange-400 to-orange-600', bgColor: 'bg-orange-50' }
    ];

    return (
        <div 
            className="bg-white rounded-3xl shadow-lg border border-slate-200 p-6 mb-8"
            style={{
                animation: isVisible ? 'slideInUp 0.6s ease-out 0.8s both' : 'none'
            }}
        >
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Quick Actions</h3>
                    <p className="text-sm text-slate-600">Get things done faster</p>
                </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {actions.map((action, index) => (
                    <button 
                        key={index} 
                        className={`${action.bgColor} rounded-2xl p-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group`}
                        style={{
                            animation: isVisible ? `slideInUp 0.4s ease-out ${0.9 + (index * 0.1)}s both` : 'none'
                        }}
                    >
                        <div className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform duration-300`}>
                            <action.icon className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-sm font-semibold text-slate-700 text-center">{action.label}</p>
                    </button>
                ))}
            </div>
        </div>
    );
}