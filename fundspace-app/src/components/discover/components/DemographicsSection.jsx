// src/components/discover/components/DemographicsSection.jsx
import React from 'react';
import { Users, Globe, TrendingUp } from 'lucide-react';

export default function DemographicsSection({ demographics }) {
    if (!demographics) return null;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Community Demographics & Challenges
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Population</p>
                    <p className="text-lg font-semibold text-slate-900">{demographics.population}</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Median Income</p>
                    <p className="text-lg font-semibold text-green-600">{demographics.medianIncome}</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Poverty Rate</p>
                    <p className="text-lg font-semibold text-orange-600">{demographics.povertyRate}</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Unemployment</p>
                    <p className="text-lg font-semibold text-red-600">{demographics.unemploymentRate}</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <Globe className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-slate-700">Diversity Index</span>
                    </div>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        demographics.diversityIndex === 'Very High' ? 'bg-green-100 text-green-800' :
                        demographics.diversityIndex === 'High' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                    }`}>
                        {demographics.diversityIndex}
                    </span>
                </div>
                
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-medium text-slate-700">Key Challenges</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {demographics.majorChallenges.map((challenge, index) => (
                            <span key={index} className="px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded-full">
                                {challenge}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}