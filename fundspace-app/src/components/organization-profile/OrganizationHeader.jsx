// src/components/organization-profile/OrganizationHeader.jsx - Updated with Edit Button at Top

import React from 'react';
import { Heart, MapPin, ExternalLink, CheckCircle, Users, Sparkles, Edit3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { hasPermission, PERMISSIONS } from '../../utils/organizationPermissions.js';

const OrganizationHeader = ({ 
  organization, 
  isFollowing, 
  followersCount, 
  isBookmarked, 
  bookmarksCount, 
  onFollow, 
  onBookmark,
  config = {},
  // New props for integrated tabs
  activeTab,
  setActiveTab,
  tabs = [],
  // Edit mode props
  userMembership,
  session,
  // Banner props - only show banner if this prop is true
  showBanner = false
}) => {
  const navigate = useNavigate();

  if (!organization) return null;

  // Check permissions
  const canEdit = userMembership && hasPermission(
    userMembership.role, 
    PERMISSIONS.EDIT_ORGANIZATION, 
    session?.user?.is_omega_admin
  );

  // Handle edit button click
  const handleEditClick = () => {
    if (organization.slug) {
      navigate(`/organizations/${organization.slug}?edit=true`);
    } else {
      // Add edit parameter to current URL
      const currentUrl = new URL(window.location);
      currentUrl.searchParams.set('edit', 'true');
      navigate(currentUrl.pathname + currentUrl.search);
    }
  };

  // Organization type configurations
  const getTypeInfo = (type) => {
    const normalizedType = type?.toLowerCase();
    
    const typeMap = {
      'nonprofit': { 
        label: '501(c)(3) Nonprofit', 
        color: 'bg-green-100 text-green-700 border-green-200', 
        icon: '💙',
        gradient: 'from-green-500 to-emerald-600'
      },
      'foundation': { 
        label: 'Foundation', 
        color: 'bg-purple-100 text-purple-700 border-purple-200', 
        icon: '🏛️',
        gradient: 'from-purple-500 to-indigo-600'
      },
      'funder': { 
        label: 'Funder', 
        color: 'bg-blue-100 text-blue-700 border-blue-200', 
        icon: '💰',
        gradient: 'from-blue-500 to-indigo-600'
      },
      'for-profit': { 
        label: 'Company', 
        color: 'bg-purple-100 text-purple-700 border-purple-200', 
        icon: '🏢',
        gradient: 'from-purple-500 to-pink-600'
      },
      'forprofit': { 
        label: 'Company', 
        color: 'bg-purple-100 text-purple-700 border-purple-200', 
        icon: '🏢',
        gradient: 'from-purple-500 to-pink-600'
      },
      'government': { 
        label: 'Government Agency', 
        color: 'bg-indigo-100 text-indigo-700 border-indigo-200', 
        icon: '🏛️',
        gradient: 'from-indigo-500 to-blue-600'
      },
      'healthcare': { 
        label: 'Healthcare Organization', 
        color: 'bg-red-100 text-red-700 border-red-200', 
        icon: '🏥',
        gradient: 'from-red-500 to-pink-600'
      },
      'education': { 
        label: 'Educational Institution', 
        color: 'bg-yellow-100 text-yellow-700 border-yellow-200', 
        icon: '🎓',
        gradient: 'from-yellow-500 to-orange-600'
      },
      'religious': { 
        label: 'Religious Organization', 
        color: 'bg-pink-100 text-pink-700 border-pink-200', 
        icon: '⛪',
        gradient: 'from-pink-500 to-rose-600'
      },
      'international': { 
        label: 'International Organization', 
        color: 'bg-teal-100 text-teal-700 border-teal-200', 
        icon: '🌍',
        gradient: 'from-teal-500 to-cyan-600'
      }
    };
    return typeMap[normalizedType] || { 
      label: 'Organization', 
      color: 'bg-slate-100 text-slate-700 border-slate-200', 
      icon: '🏢',
      gradient: 'from-slate-500 to-slate-600'
    };
  };

  const typeInfo = getTypeInfo(organization.type);

  // Icon mapping for tabs
  const iconMap = {
    Globe: '🌐', Building: '🏢', Users: '👥', Rocket: '🚀', TrendingUp: '📈', 
    Star: '⭐', DollarSign: '💰', HandHeart: '🤝', BarChart3: '📊', Heart: '❤️', 
    Award: '🏆', BookOpen: '📚', Microscope: '🔬', Building2: '🏛️', Flag: '🚩', 
    Briefcase: '💼', Target: '🎯', Camera: '📷'
  };

  return (
    <>
      {/* Edit Button Header - Only show if user can edit - AT THE TOP */}
      {canEdit && (
        <div className="bg-blue-600 text-white px-8 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Live View</span>
              <span className="text-blue-200 text-sm">Your organization profile is currently live</span>
            </div>
            <button
              onClick={handleEditClick}
              className="flex items-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              Edit Page
            </button>
          </div>
        </div>
      )}

      {/* Banner Image Section - Only show if showBanner prop is true */}
      {showBanner && (
        <div className="relative">
          {/* Banner Image */}
          <div className="h-80 bg-gradient-to-br from-slate-100 via-white to-slate-100 overflow-hidden">
            {organization.banner_image_url ? (
              <img 
                src={organization.banner_image_url} 
                alt={`${organization.name} banner`}
                className="w-full h-full object-cover"
              />
            ) : (
              // Default gradient banner if no image
              <div className="w-full h-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
                <div className="text-6xl opacity-20">🏢</div>
              </div>
            )}
          </div>
          
          {/* Banner Overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        </div>
      )}

      {/* Main Header Content - Below banner */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex items-start gap-6 pb-6">
            {/* Logo - positioned to overlap banner */}
            <div className="relative -mt-20">
              <div className="w-40 h-40 rounded-2xl bg-white border-4 border-white shadow-xl overflow-hidden">
                {organization.image_url ? (
                  <img 
                    src={organization.image_url} 
                    alt={`${organization.name} logo`} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center text-4xl font-bold text-slate-600">
                    {organization.name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            
            {/* Organization Info */}
            <div className="flex-1 py-4">
              {/* Type Badge and Year Founded */}
              <div className="flex items-center gap-3 mb-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${typeInfo.gradient} text-white`}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {typeInfo.label}
                </span>
                {organization.year_founded && (
                  <span className="text-slate-500 font-medium text-sm">
                    Since {organization.year_founded}
                  </span>
                )}
              </div>
              
              {/* Organization Name and Verification */}
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-4xl font-bold text-slate-900">{organization.name}</h1>
                {organization.isVerified && (
                  <CheckCircle className="w-7 h-7 text-blue-500" />
                )}
              </div>
              
              {/* Location and Website */}
              <div className="flex items-center gap-3 mb-4">
                {organization.location && (
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                    <MapPin className="w-4 h-4" />
                    {organization.location}
                  </span>
                )}
                {organization.website && (
                  <a 
                    href={organization.website} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200 hover:bg-purple-200 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Website
                  </a>
                )}
              </div>
              
              {/* Social Stats */}
              <div className="flex items-center gap-6 mb-6">
                <div className="flex items-center gap-2 text-slate-600">
                  <span className="text-base">👥</span>
                  <span className="font-semibold text-slate-900">
                    {new Intl.NumberFormat('en-US').format(followersCount || 0)}
                  </span>
                  <span className="text-sm">Followers</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <span className="text-base">{bookmarksCount > 0 ? '❤️' : '🤍'}</span>
                  <span className="font-semibold text-slate-900">
                    {new Intl.NumberFormat('en-US').format(bookmarksCount || 0)}
                  </span>
                  <span className="text-sm">Likes</span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3 py-4">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onFollow();
                }}
                className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 ${
                  isFollowing 
                    ? 'bg-slate-200 text-slate-800' 
                    : `bg-gradient-to-r ${typeInfo.gradient} text-white hover:shadow-lg`
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onBookmark();
                }}
                className="p-3 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors w-12 h-12 flex items-center justify-center"
              >
                <span className="text-lg">
                  {isBookmarked ? '❤️' : '🤍'}
                </span>
              </button>
            </div>
          </div>

          {/* Tabs - Full width row */}
          <div className="pb-6">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const emoji = iconMap[tab.icon] || '📄';
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm transition-all duration-200 whitespace-nowrap ${
                      isActive 
                        ? `bg-gradient-to-r ${typeInfo.gradient} text-white shadow-md`
                        : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-base">{emoji}</span>
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrganizationHeader;