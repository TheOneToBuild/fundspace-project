// src/components/discover/components/InsightsCards.jsx
import React from 'react';
import { useAnimatedCounter } from '../hooks/useAnimatedCounter.js';

export default function InsightsCards({ isVisible }) {
    const insights = [
        {
            title: 'Community Impact',
            value: '89%',
            subtitle: 'Satisfaction rate',
            gradient: 'from-emerald-400 to-teal-500',
            icon: '🎯',
            chart: true
        },
        {
            title: 'Grant Success',
            value: '67%',
            subtitle: 'Approval rate',
            gradient: 'from-blue-400 to-indigo-500',
            icon: '📈',
            chart: true
        },
        {
            title: 'Active Programs',
            value: '24',
            subtitle: 'Running this month',
            gradient: 'from-purple-400 to-pink-500',
            icon: '🚀',
            stats: [
                { label: 'Education', value: 8, color: 'bg-yellow-400' },
                { label: 'Health', value: 6, color: 'bg-green-400' },
                { label: 'Environment', value: 10, color: 'bg-blue-400' }
            ]
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {insights.map((insight, index) => {
                const animatedValue = useAnimatedCounter(isVisible ? parseFloat(insight.value.replace(/[^0-9]/g, '')) : 0, 2000);
                
                return (
                    <div 
                        key={index} 
                        className={`bg-gradient-to-br ${insight.gradient} rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 relative overflow-hidden group`}
                        style={{
                            animation: isVisible ? `slideInUp 0.6s ease-out ${index * 0.2}s both` : 'none'
                        }}
                    >
                        <div className="absolute top-4 right-4 text-4xl opacity-30">{insight.icon}</div>
                        <div className="absolute -top-8 -left-8 w-24 h-24 bg-white/20 rounded-full blur-2xl" />
                        <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/10 rounded-full blur-xl" />
                        
                        <div className="relative z-10 text-white">
                            <div className="mb-6">
                                <p className="text-white/80 text-sm font-medium mb-2">{insight.title}</p>
                                <p className="text-4xl font-bold mb-1">
                                    {insight.value.includes('%') ? `${Math.round(animatedValue)}%` : Math.round(animatedValue)}
                                </p>
                                <p className="text-white/80 text-sm">{insight.subtitle}</p>
                            </div>

                            {insight.chart && (
                                <div className="flex items-end gap-1 h-12">
                                    {[40, 65, 45, 80, 55, 90, 75].map((height, i) => (
                                        <div
                                            key={i}
                                            className="bg-white/40 rounded-sm transition-all duration-300 hover:bg-white/60"
                                            style={{ 
                                                height: `${height}%`, 
                                                width: '12px',
                                                animation: isVisible ? `growUp 0.8s ease-out ${(index * 0.2) + (i * 0.05)}s both` : 'none'
                                            }}
                                        />
                                    ))}
                                </div>
                            )}

                            {insight.stats && (
                                <div className="space-y-3">
                                    {insight.stats.map((stat, i) => (
                                        <div 
                                            key={i} 
                                            className="flex items-center justify-between"
                                            style={{
                                                animation: isVisible ? `slideInRight 0.6s ease-out ${(index * 0.2) + (i * 0.1)}s both` : 'none'
                                            }}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 ${stat.color} rounded-full`} />
                                                <span className="text-sm text-white/90">{stat.label}</span>
                                            </div>
                                            <span className="text-sm font-semibold">{stat.value}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}