// src/components/discover/components/DemographicsSection.jsx
import React, { useState } from 'react';
import { useAnimatedCounter, formatNumber } from '../hooks/useAnimatedCounter.js';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function DemographicsSection({ demographics, isVisible }) {
    const [expandedCard, setExpandedCard] = useState(null);

    if (!demographics) return null;

    // Helper function to calculate comparison percentage and status
    const getComparison = (localValue, stateAvg, nationalAvg, higherIsBetter = true) => {
        const localNum = parseFloat(localValue.replace(/[^0-9.]/g, ''));
        const stateNum = parseFloat(stateAvg);
        const nationalNum = parseFloat(nationalAvg);
        
        let comparison = '';
        let comparisonColor = '';
        let progress = 50; // Default middle
        
        if (higherIsBetter) {
            if (localNum > stateNum) {
                const diff = ((localNum - stateNum) / stateNum * 100).toFixed(0);
                comparison = `${diff}% above CA avg`;
                comparisonColor = 'text-green-600';
                progress = Math.min(75 + (localNum - stateNum) / stateNum * 25, 100);
            } else {
                const diff = ((stateNum - localNum) / stateNum * 100).toFixed(0);
                comparison = `${diff}% below CA avg`;
                comparisonColor = 'text-orange-600';
                progress = Math.max(25, 50 - (stateNum - localNum) / stateNum * 25);
            }
        } else {
            // Lower is better (for poverty, unemployment)
            if (localNum < stateNum) {
                const diff = ((stateNum - localNum) / stateNum * 100).toFixed(0);
                comparison = `${diff}% better than CA avg`;
                comparisonColor = 'text-green-600';
                progress = Math.min(75 + (stateNum - localNum) / stateNum * 25, 100);
            } else {
                const diff = ((localNum - stateNum) / stateNum * 100).toFixed(0);
                comparison = `${diff}% higher than CA avg`;
                comparisonColor = 'text-red-600';
                progress = Math.max(25, 50 - (localNum - stateNum) / stateNum * 25);
            }
        }
        
        return { comparison, comparisonColor, progress };
    };

    // California and US averages for comparison
    const benchmarks = {
        medianIncome: { ca: 84097, us: 70784 },
        povertyRate: { ca: 11.2, us: 11.5 },
        unemploymentRate: { ca: 3.9, us: 3.7 }
    };

    // Detailed demographic breakdowns
    const detailedData = {
        population: {
            raceEthnicity: [
                { label: 'White', local: '31.2%', ca: '36.5%', us: '58.9%' },
                { label: 'Asian', local: '35.1%', ca: '15.7%', us: '6.1%' },
                { label: 'Hispanic/Latino', local: '23.8%', ca: '39.4%', us: '18.7%' },
                { label: 'Black/African American', local: '5.8%', ca: '5.8%', us: '12.4%' },
                { label: 'Other/Mixed', local: '4.1%', ca: '2.6%', us: '3.9%' }
            ],
            ageGroups: [
                { label: 'Under 18', local: '18.2%', ca: '22.5%', us: '22.2%' },
                { label: '18-34', local: '28.4%', ca: '25.1%', us: '23.2%' },
                { label: '35-54', local: '32.1%', ca: '26.8%', us: '25.8%' },
                { label: '55-64', local: '12.7%', ca: '13.4%', us: '14.2%' },
                { label: '65+', local: '8.6%', ca: '12.2%', us: '14.6%' }
            ]
        },
        medianIncome: {
            byEducation: [
                { label: 'High School Diploma', local: '$45,200', ca: '$42,100', us: '$38,900' },
                { label: "Bachelor's Degree", local: '$89,500', ca: '$71,200', us: '$65,400' },
                { label: 'Graduate Degree', local: '$142,800', ca: '$95,600', us: '$87,200' }
            ],
            byIndustry: [
                { label: 'Technology', local: '$165,000', ca: '$118,000', us: '$105,000' },
                { label: 'Healthcare', local: '$98,500', ca: '$89,200', us: '$82,600' },
                { label: 'Education', local: '$76,800', ca: '$68,400', us: '$59,200' },
                { label: 'Retail/Service', local: '$48,200', ca: '$41,800', us: '$38,400' }
            ]
        },
        povertyRate: {
            byAge: [
                { label: 'Children (Under 18)', local: '7.2%', ca: '14.8%', us: '16.2%' },
                { label: 'Working Age (18-64)', local: '8.1%', ca: '10.4%', us: '10.9%' },
                { label: 'Seniors (65+)', local: '12.4%', ca: '11.6%', us: '9.5%' }
            ],
            byHousehold: [
                { label: 'Single Parent', local: '18.2%', ca: '26.4%', us: '28.7%' },
                { label: 'Two Parent', local: '4.1%', ca: '8.9%', us: '7.8%' },
                { label: 'Single Adult', local: '11.8%', ca: '15.2%', us: '16.1%' }
            ]
        },
        unemploymentRate: {
            byEducation: [
                { label: 'Less than High School', local: '6.8%', ca: '8.2%', us: '7.9%' },
                { label: 'High School Diploma', local: '4.1%', ca: '5.2%', us: '4.8%' },
                { label: "Bachelor's Degree", local: '2.1%', ca: '2.8%', us: '2.4%' },
                { label: 'Graduate Degree', local: '1.4%', ca: '1.9%', us: '1.7%' }
            ],
            byAge: [
                { label: '16-24 years', local: '8.9%', ca: '11.2%', us: '9.8%' },
                { label: '25-54 years', local: '2.4%', ca: '3.1%', us: '2.9%' },
                { label: '55+ years', local: '1.8%', ca: '2.4%', us: '2.2%' }
            ]
        }
    };

    const demographicMetrics = [
        {
            id: 'population',
            label: 'Population',
            value: demographics.population,
            comparison: 'Bay Area region',
            comparisonColor: 'text-blue-600',
            progress: 65,
            color: 'from-blue-400 to-blue-600',
            bgColor: 'from-blue-50 to-blue-100',
            icon: '👥',
            expandable: true
        },
        {
            id: 'medianIncome',
            label: 'Median Income',
            value: demographics.medianIncome,
            ...getComparison(demographics.medianIncome, benchmarks.medianIncome.ca, benchmarks.medianIncome.us, true),
            color: 'from-emerald-400 to-emerald-600',
            bgColor: 'from-emerald-50 to-emerald-100',
            icon: '💵',
            expandable: true
        },
        {
            id: 'povertyRate',
            label: 'Poverty Rate',
            value: demographics.povertyRate,
            ...getComparison(demographics.povertyRate, benchmarks.povertyRate.ca, benchmarks.povertyRate.us, false),
            color: 'from-amber-400 to-orange-500',
            bgColor: 'from-amber-50 to-orange-100',
            icon: '📊',
            expandable: true
        },
        {
            id: 'unemploymentRate',
            label: 'Unemployment',
            value: demographics.unemploymentRate,
            ...getComparison(demographics.unemploymentRate, benchmarks.unemploymentRate.ca, benchmarks.unemploymentRate.us, false),
            color: 'from-red-400 to-red-600',
            bgColor: 'from-red-50 to-red-100',
            icon: '📉',
            expandable: true
        }
    ];

    const handleCardClick = (metricId) => {
        setExpandedCard(expandedCard === metricId ? null : metricId);
    };

    const renderDetailedBreakdown = (metricId) => {
        const data = detailedData[metricId];
        if (!data) return null;

        return (
            <div className="mt-4 space-y-4 border-t border-slate-200 pt-4">
                {Object.entries(data).map(([category, items], categoryIndex) => (
                    <div key={category} className="space-y-2">
                        <h4 className="text-sm font-semibold text-slate-700 capitalize">
                            {category.replace(/([A-Z])/g, ' $1').trim()}
                        </h4>
                        <div className="space-y-2">
                            {items.map((item, itemIndex) => (
                                <div key={itemIndex} className="flex justify-between items-center text-xs">
                                    <span className="text-slate-600 font-medium">{item.label}</span>
                                    <div className="flex gap-3 text-right">
                                        <div className="min-w-16">
                                            <div className="font-bold text-slate-800">{item.local}</div>
                                            <div className="text-slate-500">Local</div>
                                        </div>
                                        <div className="min-w-16">
                                            <div className="font-medium text-slate-600">{item.ca}</div>
                                            <div className="text-slate-400">CA</div>
                                        </div>
                                        <div className="min-w-16">
                                            <div className="font-medium text-slate-600">{item.us}</div>
                                            <div className="text-slate-400">US</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {demographicMetrics.map((metric, index) => {
                    const animatedValue = useAnimatedCounter(
                        isVisible ? parseFloat(metric.value.replace(/[^0-9.]/g, '')) : 0, 
                        2500
                    );
                    const animatedProgress = useAnimatedCounter(isVisible ? metric.progress : 0, 2000);
                    const isExpanded = expandedCard === metric.id;
                    
                    return (
                        <div 
                            key={index}
                            className={`bg-gradient-to-br ${metric.bgColor} rounded-3xl p-6 border border-white/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group cursor-pointer ${isExpanded ? 'ring-2 ring-blue-400' : ''}`}
                            style={{
                                animation: isVisible ? `slideInUp 0.6s ease-out ${index * 0.15}s both` : 'none'
                            }}
                            onClick={() => metric.expandable && handleCardClick(metric.id)}
                        >
                            <div className="absolute top-2 right-2 text-4xl opacity-20">{metric.icon}</div>
                            <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-white/30 rounded-full blur-xl" />
                            
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
                                            className={`bg-gradient-to-r ${metric.color} h-3 rounded-full shadow-lg transition-all duration-1000 ease-out relative overflow-hidden`}
                                            style={{ width: `${animatedProgress}%` }}
                                        >
                                            <div className="absolute inset-0 bg-white/30 rounded-full animate-pulse" />
                                        </div>
                                    </div>
                                    <p className={`text-xs mt-2 font-medium ${metric.comparisonColor}`}>
                                        {metric.comparison}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Full-Width Expanded Content */}
            {expandedCard && (
                <div 
                    className="bg-white rounded-3xl shadow-lg border border-slate-200 p-8"
                    style={{
                        animation: 'slideInUp 0.4s ease-out both'
                    }}
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
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {detailedData[expandedCard] && Object.entries(detailedData[expandedCard]).map(([category, items], categoryIndex) => (
                            <div key={category} className="space-y-4">
                                <h4 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">
                                    {category.replace(/([A-Z])/g, ' $1').trim()}
                                </h4>
                                <div className="space-y-3">
                                    {items.map((item, itemIndex) => (
                                        <div key={itemIndex} className="bg-slate-50 rounded-xl p-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-slate-700 font-medium">{item.label}</span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-4 text-sm">
                                                <div className="text-center">
                                                    <div className="font-bold text-lg text-slate-900">{item.local}</div>
                                                    <div className="text-slate-500 text-xs">Local</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="font-medium text-slate-600">{item.ca}</div>
                                                    <div className="text-slate-400 text-xs">California</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="font-medium text-slate-600">{item.us}</div>
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