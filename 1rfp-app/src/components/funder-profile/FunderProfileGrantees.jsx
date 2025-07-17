import React from 'react';
import NonprofitCard from '../NonprofitCard.jsx';
import { getPillClasses } from '../../utils';
import { Users, DollarSign, Tag, MapPin } from '../Icons.jsx';

export default function FunderProfileGrantees({ grantees }) {
    if (!grantees || grantees.length === 0) {
        return (
            <div className="text-center py-12 text-slate-500">
                Information about past grantees is not available yet.
            </div>
        );
    }

    const totalGrantees = grantees.length;
    const totalFunding = grantees.reduce((sum, grantee) => {
      const amount = parseInt(grantee.grantAmount?.replace(/[$,]/g, '') || 0);
      return sum + amount;
    }, 0);

    const focusAreaCounts = {};
    grantees.forEach(grantee => {
      grantee.focusAreas.forEach(area => {
        focusAreaCounts[area] = (focusAreaCounts[area] || 0) + 1;
      });
    });

    const locationCounts = {};
    grantees.forEach(grantee => {
      const city = grantee.location.split(',')[0];
      locationCounts[city] = (locationCounts[city] || 0) + 1;
    });

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h3 className="text-2xl font-bold text-slate-800 mb-3">Our Grantees</h3>
                <p className="text-slate-600">Organizations we're proud to support in the Bay Area</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">{totalGrantees}</div>
                    <div className="text-blue-700 font-medium">Total Grantees</div>
                    <div className="text-xs text-blue-600 mt-1">Active partnerships</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">${(totalFunding / 1000).toFixed(0)}K</div>
                    <div className="text-green-700 font-medium">Total Awarded</div>
                    <div className="text-xs text-green-600 mt-1">In recent grants</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">{Object.keys(focusAreaCounts).length}</div>
                    <div className="text-purple-700 font-medium">Focus Areas</div>
                    <div className="text-xs text-purple-600 mt-1">Areas of impact</div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Tag className="text-pink-500" />
                    What Our Grantees Focus On
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Object.entries(focusAreaCounts).sort(([, a], [, b]) => b - a).map(([area, count]) => (
                        <div key={area} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <span className="text-sm font-medium text-slate-700">{area}</span>
                            <span className="text-xs font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-700">{count}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <MapPin className="text-indigo-500" />
                    Where We Fund
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(locationCounts).sort(([, a], [, b]) => b - a).map(([city, count]) => (
                        <div key={city} className="text-center p-4 bg-indigo-50 rounded-lg">
                            <div className="text-lg font-bold text-indigo-600">{count}</div>
                            <div className="text-sm text-indigo-700">{city}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h4 className="text-lg font-bold text-slate-800 mb-4">All Grantees</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {grantees.map(grantee => (
                        <div key={grantee.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
                            <div className="aspect-video relative overflow-hidden">
                                <img src={grantee.imageUrl} alt={grantee.name} className="w-full h-full object-cover" />
                                <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">{grantee.grantAmount}</div>
                            </div>
                            <div className="p-4">
                                <h5 className="font-bold text-slate-800 mb-2">{grantee.name}</h5>
                                <p className="text-slate-600 text-sm mb-3">{grantee.tagline}</p>
                                <div className="flex items-center gap-2 mb-3"><MapPin size={14} className="text-slate-400" /><span className="text-sm text-slate-600">{grantee.location}</span></div>
                                <div className="flex flex-wrap gap-1 mb-3">
                                    {grantee.focusAreas.slice(0, 2).map(area => (
                                        <span key={area} className={`text-xs px-2 py-1 rounded-full ${getPillClasses(area)}`}>{area}</span>
                                    ))}
                                    {grantee.focusAreas.length > 2 && <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">+{grantee.focusAreas.length - 2}</span>}
                                </div>
                                <div className="text-xs text-slate-500">Funded in {grantee.grantYear}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}