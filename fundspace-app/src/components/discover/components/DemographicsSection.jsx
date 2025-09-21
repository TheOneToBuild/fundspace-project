import React, { useState } from 'react';
import { useAnimatedCounter, formatNumber } from '../hooks/useAnimatedCounter.js';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function DemographicsSection({ demographics, isVisible }) {
    const [expandedCard, setExpandedCard] = useState(null);

    if (!demographics) return null;

    const safeParseNumber = (value) => {
        if (!value || typeof value.replace !== 'function') return 0;
        return parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
    };

    const getComparison = (localValue, stateAvg, higherIsBetter = true) => {
        const localNum = safeParseNumber(localValue);
        const stateNum = safeParseNumber(String(stateAvg));
        if (localNum <= 0 || stateNum <= 0) {
            return { comparison: 'Data unavailable', comparisonColor: 'text-gray-500', progress: 50 };
        }
        
        let comparison = '', comparisonColor = '', progress = 50;
        if (higherIsBetter) {
            const diff = Math.round(((localNum - stateNum) / stateNum) * 100);
            comparison = diff > 0 ? `${diff}% above CA avg` : `${Math.abs(diff)}% below CA avg`;
            comparisonColor = diff > 0 ? 'text-green-600' : 'text-orange-600';
            progress = 50 + (diff / 2);
        } else {
            const diff = Math.round(((stateNum - localNum) / stateNum) * 100);
            comparison = diff > 0 ? `${diff}% better than CA avg` : `${Math.abs(diff)}% worse than CA avg`;
            comparisonColor = diff > 0 ? 'text-green-600' : 'text-red-600';
            progress = 50 + (diff / 2);
        }
        return { comparison, comparisonColor, progress: Math.max(5, Math.min(95, progress)) };
    };
    
    const benchmarks = { 
        medianIncome: { ca: 84097 },
        povertyRate: { ca: 12.2 }
    };

    const getDetailedData = () => ({
        population: {
            'Race & Ethnicity': demographics.raceEthnicity ? Object.entries(demographics.raceEthnicity).map(([label, data]) => ({ label, ...data })) : [],
            'Age Groups': demographics.ageGroups ? Object.entries(demographics.ageGroups).map(([label, data]) => ({ label, ...data })) : [],
            'Education Levels': demographics.educationLevels ? Object.entries(demographics.educationLevels).map(([label, data]) => ({ label, ...data })) : []
        },
        povertyRate: {
            'by Age': demographics.povertyByAge ? Object.entries(demographics.povertyByAge).map(([label, data]) => ({ label, ...data })) : [],
            'by Household': demographics.povertyByHousehold ? Object.entries(demographics.povertyByHousehold).map(([label, data]) => ({ label, ...data })) : [],
        },
    });

    const detailedData = getDetailedData();
    const safeGetValue = (value, fallback = '...') => (value !== null && value !== undefined) ? value : fallback;

    const demographicMetrics = [
        { id: 'population', label: 'Population', value: safeGetValue(demographics.population), comparison: 'Bay Area region', color: 'from-blue-400 to-blue-600', bgColor: 'from-blue-50 to-blue-100', icon: '👥', expandable: true, progress: 65 },
        { id: 'medianIncome', label: 'Median Income', value: safeGetValue(demographics.medianIncome), ...getComparison(demographics.medianIncome, benchmarks.medianIncome.ca, true), color: 'from-emerald-400 to-emerald-600', bgColor: 'from-emerald-50 to-emerald-100', icon: '💰', expandable: false },
        { 
            id: 'povertyRate', 
            label: 'Poverty Rate', 
            value: safeGetValue(demographics.povertyRate), 
            ...getComparison(demographics.povertyRate, benchmarks.povertyRate.ca, false), 
            color: 'from-amber-400 to-orange-500', 
            bgColor: 'from-amber-50 to-orange-100', 
            icon: '🏠', 
            expandable: false 
        },
        {
            id: 'educationAttainment',
            label: 'Education Attainment',
            value: safeGetValue(demographics.educationAttainment),
            comparison: '% with Bachelor\'s+',
            comparisonColor: 'text-indigo-600',
            progress: safeParseNumber(demographics.educationAttainment),
            color: 'from-indigo-400 to-purple-500',
            bgColor: 'from-indigo-50 to-purple-100',
            icon: '🎓',
            expandable: false
        }
    ];

    const handleCardClick = (metricId) => {
        setExpandedCard(expandedCard === metricId ? null : metricId);
    };

    return (
        <div className="space-y-6 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {demographicMetrics.map((metric, index) => {
                    const animatedValue = useAnimatedCounter(isVisible ? safeParseNumber(metric.value) : 0, 2500);
                    const animatedProgress = useAnimatedCounter(isVisible ? metric.progress : 0, 2000);
                    const isExpanded = expandedCard === metric.id;
                    
                    return (
                        <div 
                            key={index}
                            className={`bg-gradient-to-br ${metric.bgColor} rounded-3xl p-6 border border-white/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group ${metric.expandable ? 'cursor-pointer' : ''} ${isExpanded ? 'ring-2 ring-blue-400' : ''}`}
                            style={{ animation: isVisible ? `slideInUp 0.6s ease-out ${index * 0.15}s both` : 'none' }}
                            onClick={() => metric.expandable && handleCardClick(metric.id)}
                        >
                            <div className="absolute top-2 right-2 text-4xl opacity-20">{metric.icon}</div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-xs text-slate-600 uppercase tracking-widest font-bold">{metric.label}</p>
                                    {metric.expandable && (
                                        <div className="text-slate-400 group-hover:text-slate-600 transition-colors">
                                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </div>
                                    )}
                                </div>
                                <p className="text-3xl font-bold text-slate-800 mb-4">
                                    {formatNumber(animatedValue, metric.value)}
                                </p>
                                <div className="relative">
                                    <div className="w-full bg-white/60 rounded-full h-3 shadow-inner">
                                        <div 
                                            className={`bg-gradient-to-r ${metric.color} h-3 rounded-full shadow-lg transition-all duration-1000 ease-out`}
                                            style={{ width: `${animatedProgress}%` }}
                                        />
                                    </div>
                                    <p className={`text-xs mt-2 font-medium ${metric.comparisonColor}`}>{metric.comparison}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {expandedCard && (
                <div 
                    className="bg-white rounded-3xl shadow-lg border border-slate-200 p-8"
                    style={{ animation: 'slideInUp 0.4s ease-out both' }}
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold text-slate-900">
                            {demographicMetrics.find(m => m.id === expandedCard)?.label} Breakdown
                        </h3>
                        <button
                            onClick={() => setExpandedCard(null)}
                            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <ChevronUp className="w-4 h-4" />
                            <span className="text-sm font-medium">Collapse</span>
                        </button>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {detailedData[expandedCard] && Object.entries(detailedData[expandedCard]).map(([category, items]) => (
                            <div key={category} className="space-y-4">
                                <h4 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">
                                    {category}
                                </h4>
                                <div className="space-y-3">
                                    {items.map((item, itemIndex) => (
                                        <div key={itemIndex} className="bg-slate-50 rounded-xl p-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-slate-700 font-medium">{item.label}</span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-4 text-sm">
                                                <div className="text-center">
                                                    <div className="font-bold text-lg text-slate-900">
                                                        {String(item.local).includes('-') ? 'N/A' : item.local}
                                                    </div>
                                                    <div className="text-slate-500 text-xs">Local</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="font-medium text-slate-600">{item.california || item.ca}</div>
                                                    <div className="text-slate-400 text-xs">California</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="font-medium text-slate-600">{item.usAverage || item.us}</div>
                                                    <div className="text-slate-400 text-xs">US Average</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}