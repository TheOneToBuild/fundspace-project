// src/components/discover/components/StatsCards.jsx
import React from 'react';
import { Building, DollarSign, MessageSquare, TrendingUp } from 'lucide-react';
import { useAnimatedCounter, formatNumber } from '../hooks/useAnimatedCounter.js';

export default function StatsCards({ stats, isVisible }) {
    const cards = [
        {
            title: 'Organizations',
            value: stats?.totalOrgs || '12',
            subtitle: 'Active in community',
            icon: Building,
            gradient: 'from-indigo-400 via-purple-400 to-pink-400',
            bgGradient: 'from-indigo-50 to-purple-50',
            iconColor: 'text-indigo-600',
            change: '+14%',
            trend: [20, 25, 22, 30, 28, 35, 32],
            illustration: '🏢'
        },
        {
            title: 'Active Grants',
            value: stats?.totalGrants || '12',
            subtitle: '$2.4M total funding',
            icon: DollarSign,
            gradient: 'from-emerald-400 via-teal-400 to-cyan-400',
            bgGradient: 'from-emerald-50 to-teal-50',
            iconColor: 'text-emerald-600',
            change: '+8%',
            trend: [15, 18, 22, 19, 25, 28, 24],
            illustration: '💰'
        },
        {
            title: 'Community Posts',
            value: stats?.totalPosts || '11',
            subtitle: 'This week',
            icon: MessageSquare,
            gradient: 'from-violet-400 via-purple-400 to-fuchsia-400',
            bgGradient: 'from-violet-50 to-purple-50',
            iconColor: 'text-violet-600',
            change: '+25%',
            trend: [8, 12, 10, 15, 18, 22, 25],
            illustration: '💬'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {cards.map((card, index) => {
                const animatedValue = useAnimatedCounter(isVisible ? parseInt(card.value) : 0, 2000);
                
                return (
                    <div 
                        key={index} 
                        className="group relative"
                        style={{
                            animation: isVisible ? `slideInUp 0.6s ease-out ${index * 0.1}s both` : 'none'
                        }}
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-10 transition-all duration-500 rounded-3xl blur-xl`} />
                        
                        <div className={`relative bg-gradient-to-br ${card.bgGradient} rounded-3xl p-6 border border-white/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden`}>
                            <div className="absolute top-4 right-4 text-3xl opacity-10">{card.illustration}</div>
                            <div className="absolute -top-10 -right-10 w-20 h-20 bg-white/20 rounded-full blur-2xl" />
                            
                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-6">
                                    <div className={`w-16 h-16 bg-white/80 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-sm`}>
                                        <card.icon className={`w-8 h-8 ${card.iconColor}`} />
                                    </div>
                                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-emerald-600 bg-white/80 shadow-sm backdrop-blur-sm`}>
                                        <TrendingUp className="w-3.5 h-3.5" />
                                        {card.change}
                                    </div>
                                </div>
                                
                                <div className="space-y-2 mb-4">
                                    <p className="text-4xl font-bold text-slate-800">
                                        {Math.round(animatedValue)}
                                    </p>
                                    <p className="text-base font-semibold text-slate-700">{card.title}</p>
                                    <p className="text-sm text-slate-600">{card.subtitle}</p>
                                </div>

                                <div className="flex items-end gap-1 h-8">
                                    {card.trend.map((height, i) => (
                                        <div
                                            key={i}
                                            className={`bg-gradient-to-t ${card.gradient} rounded-sm opacity-60 transition-all duration-300 hover:opacity-100`}
                                            style={{ 
                                                height: `${(height / Math.max(...card.trend)) * 100}%`, 
                                                width: '8px',
                                                animation: isVisible ? `growUp 0.8s ease-out ${(index * 0.1) + (i * 0.05)}s both` : 'none'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}