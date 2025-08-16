// src/components/organization-profile/EditableOrganizationHeader.jsx - Updated with Edit Section Button
import React, { useState } from 'react';
import { 
  Eye, AlertTriangle, X, ArrowLeft, Edit3, Save, MapPin, ExternalLink, 
  CheckCircle, Sparkles, Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient.js';
import { hasPermission, PERMISSIONS } from '../../utils/organizationPermissions.js';
import BannerEditSection from './BannerEditSection.jsx';
import LogoEditSection from './LogoEditSection.jsx';

const EditableOrganizationHeader = ({ 
  organization, 
  isFollowing, 
  followersCount, 
  isBookmarked, 
  bookmarksCount, 
  onFollow, 
  onBookmark,
  config = {},
  activeTab,
  setActiveTab,
  tabs = [],
  userMembership,
  session,
  onUpdate // Callback to refresh organization data
}) => {
  // State management
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [isEditingBasicInfo, setIsEditingBasicInfo] = useState(false);
  const [editData, setEditData] = useState({
    name: organization?.name || '',
    location: organization?.location || '',
    website: organization?.website || '',
    year_founded: organization?.year_founded || ''
  });
  const navigate = useNavigate();

  // Check permissions
  const canEdit = userMembership && hasPermission(
    userMembership.role, 
    PERMISSIONS.EDIT_ORGANIZATION, 
    session?.user?.is_omega_admin
  );

  if (!organization) return null;

  // Organization type configuration
  const getTypeInfo = (type) => {
    const normalizedType = type?.toLowerCase();
    const typeMap = {
      'nonprofit': { 
        label: '501(c)(3) Nonprofit', 
        gradient: 'from-green-500 to-emerald-600'
      },
      'foundation': { 
        label: 'Foundation', 
        gradient: 'from-purple-500 to-indigo-600'
      },
      'funder': { 
        label: 'Funder', 
        gradient: 'from-blue-500 to-indigo-600'
      },
      'for-profit': { 
        label: 'Company', 
        gradient: 'from-purple-500 to-pink-600'
      },
      'forprofit': { 
        label: 'Company', 
        gradient: 'from-purple-500 to-pink-600'
      },
      'government': { 
        label: 'Government Agency', 
        gradient: 'from-indigo-500 to-blue-600'
      },
      'healthcare': { 
        label: 'Healthcare Organization', 
        gradient: 'from-red-500 to-pink-600'
      },
      'education': { 
        label: 'Educational Institution', 
        gradient: 'from-yellow-500 to-orange-600'
      }
    };
    return typeMap[normalizedType] || { 
      label: 'Organization', 
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

  // Handle image uploads (both file and URL)
  const handleImageSave = async (imageData, imageType, uploadType) => {
    try {
      setError('');
      setSaving(true);
      
      let imageUrl = imageData;
      
      // If it's a file upload, upload to Supabase
      if (uploadType === 'file') {
        setUploading(true);
        
        // Validate file
        if (imageData.size > 5 * 1024 * 1024) {
          throw new Error('File size must be less than 5MB');
        }
        
        if (!imageData.type.startsWith('image/')) {
          throw new Error('File must be an image');
        }
        
        const fileExt = imageData.name.split('.').pop();
        const fileName = `org-${organization.id}-${imageType}-${Date.now()}.${fileExt}`;
        const filePath = `organizations/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, imageData, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
      } else if (uploadType === 'remove') {
        imageUrl = null;
      }
      
      // Update organization in database
      const updateData = imageType === 'banner' ? 
        { banner_image_url: imageUrl } : 
        { image_url: imageUrl };
      
      const { error: updateError } = await supabase
        .from('organizations')
        .update(updateData)
        .eq('id', organization.id);

      if (updateError) throw updateError;

      // Call the onUpdate callback to refresh organization data
      if (onUpdate) {
        await onUpdate({ ...organization, ...updateData });
      }

      return true;
    } catch (err) {
      console.error('Error saving image:', err);
      setError('Failed to save image: ' + err.message);
      return false;
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  // Handle basic info updates
  const handleBasicInfoSave = async () => {
    try {
      setError('');
      setSaving(true);
      
      const updateData = {};
      
      if (editData.name !== organization.name) updateData.name = editData.name;
      if (editData.location !== organization.location) updateData.location = editData.location;
      if (editData.website !== organization.website) updateData.website = editData.website;
      if (editData.year_founded !== organization.year_founded) {
        updateData.year_founded = editData.year_founded ? parseInt(editData.year_founded) : null;
      }

      if (Object.keys(updateData).length === 0) {
        setIsEditingBasicInfo(false);
        return true;
      }

      const { error: updateError } = await supabase
        .from('organizations')
        .update(updateData)
        .eq('id', organization.id);

      if (updateError) throw updateError;

      // Call the onUpdate callback to refresh organization data
      if (onUpdate) {
        await onUpdate({ ...organization, ...updateData });
      }

      setIsEditingBasicInfo(false);
      return true;
    } catch (err) {
      console.error('Error updating organization:', err);
      setError('Failed to save changes: ' + err.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Handle view live button
  const handleViewLive = () => {
    if (organization.slug) {
      navigate(`/organizations/${organization.slug}`);
    } else {
      // Remove edit parameter from current URL
      const currentUrl = new URL(window.location);
      currentUrl.searchParams.delete('edit');
      navigate(currentUrl.pathname + currentUrl.search);
    }
  };

  // Handle back to dashboard
  const handleBackToDashboard = () => {
    navigate('/profile/my-organization');
  };

  // Reset edit data when starting to edit
  const startEditing = () => {
    setEditData({
      name: organization?.name || '',
      location: organization?.location || '',
      website: organization?.website || '',
      year_founded: organization?.year_founded || ''
    });
    setIsEditingBasicInfo(true);
  };

  return (
    <div className="bg-white border-b border-slate-200">
      {/* Edit Mode Header */}
      <div className="bg-blue-600 text-white px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Editing Mode</span>
            <span className="text-blue-200 text-sm">Make changes to your organization profile</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToDashboard}
              className="flex items-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
            <button
              onClick={handleViewLive}
              className="flex items-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
              View Live
            </button>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button 
              onClick={() => setError('')}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Banner Section */}
      <BannerEditSection
        organization={organization}
        canEdit={canEdit}
        onSave={handleImageSave}
        saving={saving}
        uploading={uploading}
      />

      <div className="max-w-7xl mx-auto px-8">
        <div className="flex items-start gap-6 pb-6">
          {/* Logo Section */}
          <LogoEditSection
            organization={organization}
            canEdit={canEdit}
            onSave={handleImageSave}
            saving={saving}
            uploading={uploading}
          />
          
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
              {canEdit && (
                <button
                  onClick={startEditing}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Section
                </button>
              )}
              {organization.isVerified && (
                <CheckCircle className="w-7 h-7 text-blue-500" />
              )}
            </div>
            
            {/* Location and Website */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              {organization.location ? (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                  <MapPin className="w-4 h-4" />
                  {organization.location}
                </span>
              ) : (
                canEdit && (
                  <button
                    onClick={startEditing}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
                  >
                    <MapPin className="w-4 h-4" />
                    Add location
                  </button>
                )
              )}

              {organization.website ? (
                <a 
                  href={organization.website} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200 hover:bg-purple-200 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Website
                </a>
              ) : (
                canEdit && (
                  <button
                    onClick={startEditing}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Add website
                  </button>
                )
              )}

              {!organization.year_founded && canEdit && (
                <button
                  onClick={startEditing}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
                >
                  <Calendar className="w-4 h-4" />
                  Add year founded
                </button>
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

        {/* Tabs */}
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

      {/* Basic Info Edit Modal - Modern Design with Organic Gradient */}
      {isEditingBasicInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl transform transition-all overflow-hidden">
            {/* Header with Organic Gradient */}
            <div className="relative p-6 overflow-hidden">
              {/* Organic background shapes */}
              <div className="absolute inset-0">
                <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full blur-2xl opacity-60 -translate-x-8 -translate-y-8"></div>
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-300 to-indigo-300 rounded-full blur-xl opacity-50 translate-x-4 -translate-y-4"></div>
                <div className="absolute bottom-0 left-1/2 w-28 h-28 bg-gradient-to-br from-pink-200 to-purple-200 rounded-full blur-2xl opacity-40 -translate-x-1/2 translate-y-8"></div>
              </div>
              
              {/* Content over gradient */}
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Edit Organization Details</h3>
                  <p className="text-slate-600 text-sm mt-1">Update your organization's basic information</p>
                </div>
                <button
                  onClick={() => setIsEditingBasicInfo(false)}
                  className="text-slate-600 hover:text-slate-800 transition-colors p-1 bg-white bg-opacity-50 rounded-lg backdrop-blur-sm"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Organization Name */}
              <div className="group">
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-400"></div>
                  Organization Name
                </label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-transparent focus:ring-2 focus:ring-purple-300 transition-all duration-200 group-hover:border-slate-300 bg-white"
                  placeholder="Enter organization name"
                />
              </div>

              {/* Location */}
              <div className="group">
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-indigo-400"></div>
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={editData.location}
                    onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-transparent focus:ring-2 focus:ring-purple-300 transition-all duration-200 group-hover:border-slate-300 bg-white"
                    placeholder="e.g., San Francisco, CA"
                  />
                </div>
              </div>

              {/* Website */}
              <div className="group">
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-400 to-rose-400"></div>
                  Website
                </label>
                <div className="relative">
                  <ExternalLink className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="url"
                    value={editData.website}
                    onChange={(e) => setEditData({ ...editData, website: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-transparent focus:ring-2 focus:ring-purple-300 transition-all duration-200 group-hover:border-slate-300 bg-white"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>

              {/* Year Founded */}
              <div className="group">
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-400"></div>
                  Year Founded
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="number"
                    value={editData.year_founded}
                    onChange={(e) => setEditData({ ...editData, year_founded: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-transparent focus:ring-2 focus:ring-purple-300 transition-all duration-200 group-hover:border-slate-300 bg-white"
                    placeholder="e.g., 1991"
                    min="1800"
                    max={new Date().getFullYear()}
                  />
                </div>
              </div>

              {/* Loading State */}
              {saving && (
                <div className="relative overflow-hidden bg-white border-2 border-purple-100 rounded-xl p-4">
                  {/* Subtle background gradient */}
                  <div className="absolute inset-0">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full blur-xl opacity-30"></div>
                  </div>
                  <div className="relative flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-400 border-t-transparent"></div>
                    <span className="text-sm font-medium text-purple-700">
                      Saving your changes...
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer with Organic Gradient Button */}
            <div className="bg-slate-50 px-6 py-4 flex gap-3">
              <button
                onClick={() => setIsEditingBasicInfo(false)}
                disabled={saving}
                className="flex-1 px-4 py-3 text-slate-600 font-medium text-sm border-2 border-slate-200 rounded-xl hover:bg-slate-100 hover:border-slate-300 transition-all duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBasicInfoSave}
                disabled={saving}
                className="flex-1 px-4 py-3 relative overflow-hidden text-white font-semibold text-sm rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl group"
              >
                {/* Organic gradient background */}
                <div className="absolute inset-0">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400"></div>
                  <div className="absolute top-0 left-0 w-8 h-8 bg-gradient-to-br from-blue-300 to-indigo-300 rounded-full blur-lg opacity-60 group-hover:scale-150 transition-transform duration-500"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 bg-gradient-to-br from-pink-300 to-purple-300 rounded-full blur-md opacity-40 group-hover:scale-125 transition-transform duration-700"></div>
                </div>
                
                {/* Button content */}
                <div className="relative z-10 flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditableOrganizationHeader;