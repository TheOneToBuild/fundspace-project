// src/components/discover/components/DemographicsSection.jsx
import React from 'react';
import { useAnimatedCounter, formatNumber } from '../hooks/useAnimatedCounter.js';

export default function DemographicsSection({ demographics, isVisible }) {
    if (!demographics) return null;

    const demographicMetrics = [
        {
            label: 'Population',
            value: demographics.population,
            progress: 78,
            color: 'from-blue-400 to-blue-600',
            bgColor: 'from-blue-50 to-blue-100',
            icon: '👥'
        },
        {
            label: 'Median Income',
            value: demographics.medianIncome,
            progress: 64,
            color: 'from-emerald-400 to-emerald-600',
            bgColor: 'from-emerald-50 to-emerald-100',
            icon: '💵'
        },
        {
            label: 'Poverty Rate',
            value: demographics.povertyRate,
            progress: 32,
            color: 'from-amber-400 to-orange-500',
            bgColor: 'from-amber-50 to-orange-100',
            icon: '📊'
        },
        {
            label: 'Unemployment',
            value: demographics.unemploymentRate,
            progress: 28,
            color: 'from-red-400 to-red-600',
            bgColor: 'from-red-50 to-red-100',
            icon: '📉'
        }
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            {demographicMetrics.map((metric, index) => {
                const animatedValue = useAnimatedCounter(
                    isVisible ? parseFloat(metric.value.replace(/[^0-9.]/g, '')) : 0, 
                    2500
                );
                const animatedProgress = useAnimatedCounter(isVisible ? metric.progress : 0, 2000);
                
                return (
                    <div 
                        key={index} 
                        className={`bg-gradient-to-br ${metric.bgColor} rounded-3xl p-6 border border-white/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group`}
                        style={{
                            animation: isVisible ? `slideInUp 0.6s ease-out ${index * 0.15}s both` : 'none'
                        }}
                    >
                        <div className="absolute top-2 right-2 text-4xl opacity-20">{metric.icon}</div>
                        <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-white/30 rounded-full blur-xl" />
                        
                        <div className="relative z-10">
                            <p className="text-xs text-slate-600 uppercase tracking-widest font-bold mb-3">{metric.label}</p>
                            <p className="text-3xl font-bold text-slate-800 mb-4">
                                {formatNumber(animatedValue, metric.value)}
                            </p>
                            
                            <div className="relative">
                                <div className="w-full bg-white/60 rounded-full h-3 shadow-inner">
                                    <div 
                                        className={`bg-gradient-to-r ${metric.color} h-3 rounded-full shadow-lg transition-all duration-1000 ease-out relative overflow-hidden`}
                                        style={{ width: `${animatedProgress}%` }}
                                    >
                                        <div className="absolute inset-0 bg-white/30 rounded-full animate-pulse" />
                                    </div>
                                </div>
                                <p className="text-xs text-slate-600 mt-2 font-medium">
                                    {Math.round(animatedProgress)}% of benchmark
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}