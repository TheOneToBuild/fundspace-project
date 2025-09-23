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
    'Globe': '🏠',
    'Target': '🎯', 
    'ClipboardList': '📋',
    'Camera': '📸',
    'Users': '👥',
    'DollarSign': '💰',
    'BarChart3': '📊',
    'Heart': '❤️'
  };

  // Handle image uploads and banner position updates
  const handleImageSave = async (imageData, imageType, uploadType) => {
    try {
      setError('');
      setSaving(true);
      
      // Handle banner position updates separately
      if (imageType === 'banner_position' && uploadType === 'update') {
        const { error: updateError } = await supabase
          .from('organizations')
          .update({ banner_position: imageData.banner_position })
          .eq('id', organization.id);

        if (updateError) throw updateError;

        // Call the onUpdate callback to refresh organization data
        if (onUpdate) {
          await onUpdate({ ...organization, banner_position: imageData.banner_position });
        }

        return true;
      }
      
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
      setError('Failed to save: ' + err.message);
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
        return;
      }
      
      const { error: updateError } = await supabase
        .from('organizations')
        .update(updateData)
        .eq('id', organization.id);

      if (updateError) throw updateError;

      if (onUpdate) {
        await onUpdate({ ...organization, ...updateData });
      }

      setIsEditingBasicInfo(false);
    } catch (err) {
      console.error('Error updating basic info:', err);
      setError('Failed to update organization details: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative">
      {/* Edit Button Header - Only show if user can edit */}
      {canEdit && (
        <div className="bg-blue-600 text-white px-8 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Editing Mode</span>
              <span className="text-blue-200 text-sm">Make changes to your organization profile</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </button>
              <button
                onClick={() => navigate(organization.slug ? `/organizations/${organization.slug}` : window.location.pathname.replace('?edit=true', ''))}
                className="flex items-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4" />
                View Live
              </button>
            </div>
          </div>
        </div>
      )}

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
          {/* Logo - positioned to overlap banner */}
          <div className="relative -mt-20">
            <LogoEditSection
              organization={organization}
              canEdit={canEdit}
              onSave={handleImageSave}
              saving={saving}
              uploading={uploading}
            />
          </div>

          {/* Organization Info */}
          <div className="flex-1 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1">
                {/* Organization Type Badge */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700 border border-purple-200">
                    {typeInfo.label}
                  </span>
                  {organization.year_founded && (
                    <span className="text-sm text-slate-500 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Since {organization.year_founded}
                    </span>
                  )}
                </div>

                {/* Organization Name and Edit Button */}
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-slate-900">{organization.name}</h1>
                  {canEdit && (
                    <button
                      onClick={() => setIsEditingBasicInfo(true)}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit Section
                    </button>
                  )}
                </div>

                {/* Location and Website */}
                <div className="flex flex-wrap items-center gap-4 text-slate-600 mb-4">
                  {organization.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{organization.location}</span>
                    </div>
                  )}
                  {organization.website && (
                    <a
                      href={organization.website.startsWith('http') ? organization.website : `https://${organization.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Website
                    </a>
                  )}
                </div>

                {/* Followers and Likes */}
                <div className="flex items-center gap-6 text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{followersCount || 0}</span>
                    <span>Followers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{bookmarksCount || 0}</span>
                    <span>Likes</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={onFollow}
                  className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                <button
                  onClick={onBookmark}
                  className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <span className={`text-xl ${isBookmarked ? 'text-red-500' : 'text-gray-400'}`}>
                    {isBookmarked ? '❤️' : '🤍'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation - FIXED VERSION */}
        <div className="border-b border-slate-200">
          <div className="flex overflow-x-auto">
            {tabs && tabs.length > 0 ? tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const emoji = iconMap[tab.icon] || '📄';
              
              
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof setActiveTab === 'function' && tab.id) {
                      setActiveTab(tab.id);
                    }
                  }}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                  style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                >
                  <span className="text-base">{emoji}</span>
                  {tab.label}
                </button>
              );
            }) : (
              <div className="text-slate-600 px-6 py-4">No tabs available</div>
            )}
          </div>
        </div>
      </div>

      {/* Basic Info Edit Modal */}
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

            {/* Form Content */}
            <div className="p-6 space-y-4">
              {/* Organization Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-indigo-400"></div>
                  Organization Name
                </label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({...editData, name: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-transparent focus:ring-2 focus:ring-purple-300 transition-all duration-200"
                  placeholder="Enter organization name"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-400 to-emerald-400"></div>
                  Location
                </label>
                <input
                  type="text"
                  value={editData.location}
                  onChange={(e) => setEditData({...editData, location: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-transparent focus:ring-2 focus:ring-purple-300 transition-all duration-200"
                  placeholder="City, State or City, Country"
                />
              </div>

              {/* Website */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-400"></div>
                  Website
                </label>
                <input
                  type="url"
                  value={editData.website}
                  onChange={(e) => setEditData({...editData, website: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-transparent focus:ring-2 focus:ring-purple-300 transition-all duration-200"
                  placeholder="https://example.com"
                />
              </div>

              {/* Year Founded */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400"></div>
                  Year Founded
                </label>
                <input
                  type="number"
                  value={editData.year_founded}
                  onChange={(e) => setEditData({...editData, year_founded: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-transparent focus:ring-2 focus:ring-purple-300 transition-all duration-200"
                  placeholder="2020"
                  min="1800"
                  max={new Date().getFullYear()}
                />
              </div>

              {/* Saving Indicator */}
              {saving && (
                <div className="relative p-4 rounded-xl overflow-hidden">
                  <div className="absolute inset-0">
                    <div className="absolute top-0 left-0 w-16 h-16 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full blur-xl opacity-30"></div>
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