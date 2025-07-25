// src/components/organization-profile/OrganizationHeader.jsx

import React from 'react';
import { Heart, Eye, Globe, MapPin, Building, Calendar, Users, DollarSign } from 'lucide-react';
import { getPillClasses } from '../../utils.js';

const OrganizationHeader = ({ 
  organization, 
  isFollowing, 
  followersCount, 
  isBookmarked, 
  bookmarksCount, 
  onFollow, 
  onBookmark 
}) => {
  if (!organization) return null;

  // Get organization type display info
  const getTypeInfo = (type) => {
    const typeMap = {
      'nonprofit': { label: '501(c)(3) Nonprofit', color: 'bg-green-100 text-green-700 border-green-200', icon: '💙' },
      'foundation': { label: 'Foundation', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: '🏛️' },
      'for-profit': { label: 'Company', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: '🏢' },
      'government': { label: 'Government Agency', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: '🏛️' },
      'healthcare': { label: 'Healthcare Organization', color: 'bg-red-100 text-red-700 border-red-200', icon: '🏥' },
      'education': { label: 'Educational Institution', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: '🎓' },
      'religious': { label: 'Religious Organization', color: 'bg-pink-100 text-pink-700 border-pink-200', icon: '⛪' },
      'international': { label: 'International Organization', color: 'bg-teal-100 text-teal-700 border-teal-200', icon: '🌍' }
    };
    return typeMap[type] || { label: 'Organization', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: '🏢' };
  };

  const typeInfo = getTypeInfo(organization.type);

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row items-start gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-6 mb-6">
              {/* Organization Logo */}
              <div className="relative">
                {organization.image_url ? (
                  <img 
                    src={organization.image_url} 
                    alt={`${organization.name} logo`} 
                    className="h-24 w-24 lg:h-32 lg:w-32 rounded-2xl object-cover bg-white/10 backdrop-blur border border-white/20 p-1" 
                  />
                ) : (
                  <div className="h-24 w-24 lg:h-32 lg:w-32 rounded-2xl bg-slate-100 border border-slate-300 flex items-center justify-center font-bold text-3xl lg:text-4xl text-slate-600">
                    {organization.name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 bg-blue-500 rounded-full p-2">
                  <Building size={16} className="text-white" />
                </div>
              </div>
              
              {/* Organization Info */}
              <div className="flex-1">
                <h1 className="text-3xl lg:text-4xl font-bold mb-2 text-slate-800">
                  {organization.name}
                </h1>
                
                {organization.tagline && (
                  <p className="text-lg text-slate-600 mb-4 italic">
                    {organization.tagline}
                  </p>
                )}
                
                {/* Type and Location Badges */}
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${typeInfo.color}`}>
                    {typeInfo.icon} {typeInfo.label}
                  </span>
                  
                  {organization.location && (
                    <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium border border-slate-200 flex items-center gap-1">
                      <MapPin size={12} />
                      {organization.location}
                    </span>
                  )}
                  
                  {organization.website && (
                    <a 
                      href={organization.website} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm"
                    >
                      <Globe size={14} className="mr-1" />
                      Visit Website
                    </a>
                  )}
                </div>
                
                {/* Social Stats and Actions */}
                <div className="flex items-center gap-6 text-slate-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Eye size={14} className="text-blue-600" />
                    <span>{followersCount || 0} followers</span>
                    <button 
                      onClick={onFollow}
                      className={`ml-2 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                        isFollowing 
                          ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' 
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isFollowing ? '✓ Following' : '+ Follow'}
                    </button>
                  </div>
                  
                  <span className="text-slate-400">•</span>
                  
                  <div className="flex items-center gap-2">
                    <Heart 
                      size={14} 
                      className={`text-red-600 ${isBookmarked ? 'fill-current' : ''}`} 
                    />
                    <span>{bookmarksCount || 0} likes</span>
                    <button
                      onClick={onBookmark}
                      className={`ml-2 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                        isBookmarked 
                          ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      {isBookmarked ? '❤️ Liked' : '👍 Like'}
                    </button>
                  </div>
                </div>

                {/* Focus Areas Pills */}
                {organization.focusAreas && organization.focusAreas.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {organization.focusAreas.slice(0, 4).map(area => (
                      <span 
                        key={area} 
                        className={`text-xs font-medium px-3 py-1.5 rounded-full ${getPillClasses(area)}`}
                      >
                        {area}
                      </span>
                    ))}
                    {organization.focusAreas.length > 4 && (
                      <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-slate-100 text-slate-600">
                        +{organization.focusAreas.length - 4} more
                      </span>
                    )}
                  </div>
                )}

                {/* Quick Stats Row */}
                <div className="flex items-center gap-6 text-sm text-slate-500">
                  {organization.year_founded && (
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>Est. {organization.year_founded}</span>
                    </div>
                  )}
                  
                  {organization.staff_count && (
                    <div className="flex items-center gap-1">
                      <Users size={14} />
                      <span>{organization.staff_count} staff</span>
                    </div>
                  )}
                  
                  {organization.annual_budget && (
                    <div className="flex items-center gap-1">
                      <DollarSign size={14} />
                      <span>{organization.annual_budget} budget</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationHeader;