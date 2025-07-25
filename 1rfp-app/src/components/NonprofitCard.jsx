// src/components/NonprofitCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { getPillClasses } from '../utils';
import { MapPin, Users, DollarSign, Calendar, Target, Award, ExternalLink, ImageIcon, ClipboardList } from './Icons.jsx';

const NonprofitCard = ({ nonprofit, handleFilterChange }) => {
  // Fallback for missing images
  const ImageFallback = () => (
    <div className="flex flex-col items-center justify-center h-full bg-slate-100 text-slate-500 border-b border-slate-200">
      <ClipboardList size={40} className="mb-2" />
      <p className="text-sm font-medium">Image Unavailable</p>
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 hover:shadow-xl transition-all duration-300 ease-in-out flex flex-col justify-between transform hover:-translate-y-1 h-full overflow-hidden">
      {/* Image Section */}
      <div className="relative h-48 bg-slate-200">
        {nonprofit.imageUrl ? (
          <img
            src={nonprofit.imageUrl}
            alt={`${nonprofit.name} cover image`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <ImageFallback />
        )}
      </div>

      {/* Content Section */}
      <div className="p-6 flex-grow flex flex-col">
        <div className="flex-grow">
          <h3 className="text-lg font-bold text-slate-800 line-clamp-2">{nonprofit.name}</h3>
          <p className="text-sm text-slate-500 mt-1 mb-4 italic line-clamp-2">{nonprofit.tagline}</p>
          
          <p className="text-sm text-slate-600 mb-4 line-clamp-3 leading-relaxed">
            {nonprofit.description}
          </p>

          {/* --- This is the section with the updated icon colors --- */}
          <div className="space-y-3 text-sm mb-5 text-slate-700">
            <div className="flex items-center">
                <MapPin size={15} className="mr-2.5 text-blue-500 flex-shrink-0" />
                <span>{nonprofit.location || 'Not specified'}</span>
            </div>
            <div className="flex items-center">
                <DollarSign size={15} className="mr-2.5 text-green-500 flex-shrink-0" />
                <span>Annual Budget: {nonprofit.budget || 'Not specified'}</span>
            </div>
            <div className="flex items-center">
                <Users size={15} className="mr-2.5 text-indigo-500 flex-shrink-0" />
                <span>Staff Count: {nonprofit.staff_count || 'Not specified'}</span>
            </div>
             <div className="flex items-center">
                <Calendar size={15} className="mr-2.5 text-teal-500 flex-shrink-0" />
                <span>Founded: {nonprofit.year_founded || 'Not specified'}</span>
            </div>
            {nonprofit.impact_metric && (
                <div className="flex items-start">
                    <Award size={15} className="mr-2.5 mt-0.5 text-amber-500 flex-shrink-0" />
                    <span>{nonprofit.impact_metric}</span>
                </div>
            )}
          </div>
        </div>

        {nonprofit.focusAreas && nonprofit.focusAreas.length > 0 && (
            <div className="mt-auto pt-4 border-t border-slate-100">
                <h4 className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Focus Areas</h4>
                <div className="flex flex-wrap gap-2">
                    {nonprofit.focusAreas.map(area => (
                        <button 
                            key={area} 
                            onClick={(e) => {
                                e.preventDefault(); // Prevent link navigation when clicking a pill
                                handleFilterChange('focusAreaFilter', [area]);
                            }}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-transform transform hover:scale-105 active:scale-95 ${getPillClasses(area)}`}
                            title={`Filter by: ${area}`}
                        >
                            {area}
                        </button>
                    ))}
                </div>
            </div>
        )}
      </div>

      {/* Button Section */}
      <div className="p-6 pt-0">
        <Link
          to={`/nonprofits/${nonprofit.slug}`}
          className="inline-flex items-center justify-center w-full px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
        >
          View Profile <ExternalLink size={16} className="ml-2" />
        </Link>
      </div>
    </div>
  );
};

export default NonprofitCard;