import React from 'react';
import { Link } from 'react-router-dom';
import { getPillClasses } from '../../utils';
import { Globe, Star, MapPin, Eye, Heart } from '../Icons.jsx';

export default function FunderProfileHeader({ 
  funder,
  isFollowing,
  followersCount,
  followLoading,
  handleFollow,
  isLiked,
  likesCount,
  likeLoading,
  handleLike
}) {

  if (!funder) {
    return null;
  }
  
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-rose-50 via-orange-50 to-yellow-50">
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row items-start gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-6 mb-6">
              <div className="relative">
                {funder.logo_url ? (
                  <img
                    src={funder.logo_url}
                    alt={`${funder.name} logo`}
                    className="h-24 w-24 lg:h-32 lg:w-32 rounded-2xl object-contain bg-white/10 backdrop-blur border border-white/20 p-3"
                  />
                ) : (
                  <div className="h-24 w-24 lg:h-32 lg:w-32 rounded-2xl bg-slate-100 border border-slate-300 flex items-center justify-center font-bold text-3xl lg:text-4xl text-slate-600">
                    {funder.name?.charAt(0)}
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2">
                  <Star size={16} className="text-white" />
                </div>
              </div>

              <div className="flex-1">
                <h1 className="text-3xl lg:text-4xl font-bold mb-2 text-slate-800">{funder.name}</h1>
                {funder.funder_type?.name && (
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium border border-emerald-200">
                      {funder.funder_type.name}
                    </span>
                    {funder.location && (
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium border border-blue-200 flex items-center gap-1">
                          <MapPin size={12} />
                          {funder.location}
                        </span>
                        {funder.website && (
                            <a
                              href={funder.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm text-sm"
                            >
                              <Globe size={14} className="mr-1" />
                              Visit Website
                            </a>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-6 text-slate-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Eye size={14} className="text-blue-600" />
                    <span>{followLoading ? '...' : followersCount} followers</span>
                    <button
                      onClick={handleFollow}
                      disabled={followLoading}
                      className={`ml-2 px-3 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-50 ${
                        isFollowing
                          ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {followLoading ? '...' : (isFollowing ? '✓ Following' : '+ Follow')}
                    </button>
                  </div>
                  <span className="text-slate-400">•</span>
                  <div className="flex items-center gap-2">
                    <Heart size={14} className={`text-red-600 ${isLiked ? 'fill-current' : ''}`} />
                    <span>{likeLoading ? '...' : likesCount} likes</span>
                    <button
                      onClick={handleLike}
                      disabled={likeLoading}
                      className={`ml-2 px-3 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-50 ${
                        isLiked
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      {likeLoading ? '...' : (isLiked ? '❤️ Liked' : '👍 Like')}
                    </button>
                  </div>
                </div>

                {funder.focus_areas?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                     {funder.focus_areas.slice(0, 4).map(area => (
                      <span key={area} className={`text-xs font-medium px-3 py-1.5 rounded-full ${getPillClasses(area)}`}>
                        {area}
                      </span>
                    ))}
                    {funder.focus_areas.length > 4 && (
                      <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-slate-100 text-slate-600">
                        +{funder.focus_areas.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}