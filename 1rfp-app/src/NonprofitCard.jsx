// src/NonprofitCard.jsx
import React from 'react';
import { MapPin, DollarSign, Users, Target, Calendar, ExternalLink } from 'lucide-react';
import { getPillClasses } from './utils.js'; // Import the new function

const NonprofitCard = ({ nonprofit }) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-xl transition-all duration-300 ease-in-out flex flex-col justify-between transform hover:-translate-y-1">
      <div>
        <div className="relative h-40 w-full mb-4 rounded-lg overflow-hidden border border-slate-200">
            <img
                src={nonprofit.imageUrl}
                alt={nonprofit.imageAlt}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = `https://placehold.co/400x160/FEE2E2/991B1B?text=Image+Unavailable&font=inter`; }}
            />
             <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-1">{nonprofit.name}</h3>
        <p className="text-sm font-medium text-purple-700 mb-3">{nonprofit.tagline}</p>
        <p className="text-sm text-slate-500 mb-4 line-clamp-3 leading-relaxed">
          {nonprofit.description}
        </p>
        <div className="space-y-2.5 text-sm mb-5">
          <div className="flex items-center text-slate-700">
            <MapPin size={15} className="mr-2.5 text-blue-500 flex-shrink-0" />
            <div><span className="font-medium text-slate-600">Location:</span> {nonprofit.location}</div>
          </div>
          <div className="flex items-center text-slate-700">
            <DollarSign size={15} className="mr-2.5 text-green-500 flex-shrink-0" />
            <div><span className="font-medium text-slate-600">Annual Budget:</span> {nonprofit.budget}</div>
          </div>
          <div className="flex items-center text-slate-700">
            <Users size={15} className="mr-2.5 text-orange-500 flex-shrink-0" />
            <div><span className="font-medium text-slate-600">Staff Count:</span> {nonprofit.staffCount}</div>
          </div>
          <div className="flex items-center text-slate-700">
            <Calendar size={15} className="mr-2.5 text-slate-400 flex-shrink-0" />
            <div><span className="font-medium text-slate-600">Founded:</span> {nonprofit.yearFounded}</div>
          </div>
          <div className="flex items-center text-slate-700">
            <Target size={15} className="mr-2.5 text-purple-500 flex-shrink-0" />
            <div><span className="font-medium text-slate-600">Impact:</span> {nonprofit.impactMetric}</div>
          </div>
        </div>
        {nonprofit.focusAreas && nonprofit.focusAreas.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200 bg-slate-50 p-3 rounded-md">
                <h4 className="text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wider">Focus Areas:</h4>
                <div className="flex flex-wrap gap-2">
                    {/* Use the new function here */}
                    {nonprofit.focusAreas.map(area => (
                        <span key={area} className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getPillClasses(area)}`}>
                            {area}
                        </span>
                    ))}
                </div>
            </div>
        )}
      </div>
      <div className="mt-6">
        <a
          href={nonprofit.website}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center w-full px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 ease-in-out transform hover:scale-105"
        >
          Visit Website <ExternalLink size={16} className="ml-2 opacity-80" />
        </a>
      </div>
    </div>
  );
};

export default NonprofitCard;