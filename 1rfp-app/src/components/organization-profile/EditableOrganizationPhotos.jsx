// src/components/organization-profile/EditableOrganizationPhotos.jsx - Instagram-style design
import React, { useState } from 'react';
import { Camera, X, Plus, Upload, Trash2, Save, Edit3, Star, Heart, MessageCircle, Share, MoreHorizontal } from 'lucide-react';
import { supabase } from '../../supabaseClient.js';
import { hasPermission, PERMISSIONS } from '../../utils/organizationPermissions.js';

const EditableOrganizationPhotos = ({ 
  organization, 
  photos = [], 
  userMembership, 
  session,
  onUpdate // Callback to refresh organization data
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isEditingPhotos, setIsEditingPhotos] = useState(false);
  const [editPhotos, setEditPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Check if user can upload photos (must be admin/super_admin member)
  const canUploadPhotos = userMembership && hasPermission(
    userMembership.role, 
    PERMISSIONS.EDIT_ORGANIZATION, 
    session?.user?.is_omega_admin
  );

  console.log('Can upload photos:', canUploadPhotos, 'User membership:', userMembership); // Debug log

  // Open photo in Instagram-style modal
  const openPhoto = (photo, index) => {
    setSelectedPhoto({ 
      ...photo,
      index,
      src: photo.url || photo,
      caption: photo.caption,
      alt_text: photo.alt_text,
      is_featured: photo.is_featured
    });
  };

  const closePhoto = () => {
    setSelectedPhoto(null);
  };

  // Navigate through photos
  const nextPhoto = () => {
    if (selectedPhoto && selectedPhoto.index < photos.length - 1) {
      openPhoto(photos[selectedPhoto.index + 1], selectedPhoto.index + 1);
    }
  };

  const prevPhoto = () => {
    if (selectedPhoto && selectedPhoto.index > 0) {
      openPhoto(photos[selectedPhoto.index - 1], selectedPhoto.index - 1);
    }
  };

  // Start editing photos
  const startEditingPhotos = () => {
    setEditPhotos([...photos]);
    setError('');
    setIsEditingPhotos(true);
  };

  // Handle multiple file uploads
  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setError('');

    try {
      const uploadPromises = Array.from(files).map(async (file, index) => {
        // Validate file
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`File ${file.name} is too large. Max size is 5MB.`);
        }

        if (!file.type.startsWith('image/')) {
          throw new Error(`File ${file.name} is not an image.`);
        }

        // Upload to Supabase
        const fileExt = file.name.split('.').pop();
        const fileName = `org-${organization.id}-photo-${Date.now()}-${index}.${fileExt}`;
        const filePath = `organizations/photos/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        return {
          id: `temp-${Date.now()}-${index}`,
          url: publicUrl,
          caption: '',
          alt_text: file.name.split('.')[0],
          is_featured: false,
          display_order: editPhotos.length + index
        };
      });

      const newPhotos = await Promise.all(uploadPromises);
      setEditPhotos([...editPhotos, ...newPhotos]);
    } catch (err) {
      console.error('Error uploading photos:', err);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Update photo data
  const updatePhoto = (index, field, value) => {
    const updatedPhotos = [...editPhotos];
    updatedPhotos[index] = { ...updatedPhotos[index], [field]: value };
    setEditPhotos(updatedPhotos);
  };

  // Remove photo
  const removePhoto = (index) => {
    const updatedPhotos = editPhotos.filter((_, i) => i !== index);
    setEditPhotos(updatedPhotos);
  };

  // Toggle featured status
  const toggleFeatured = (index) => {
    const updatedPhotos = [...editPhotos];
    updatedPhotos[index] = { 
      ...updatedPhotos[index], 
      is_featured: !updatedPhotos[index].is_featured 
    };
    setEditPhotos(updatedPhotos);
  };

  // Save all photo changes
  const savePhotos = async () => {
    try {
      setSaving(true);
      setError('');

      // Delete all existing photos for this organization
      const { error: deleteError } = await supabase
        .from('organization_photos')
        .delete()
        .eq('organization_id', organization.id);

      if (deleteError) throw deleteError;

      // Insert new photos if any exist
      if (editPhotos.length > 0) {
        const photosToInsert = editPhotos.map((photo, index) => ({
          organization_id: organization.id,
          image_url: photo.url,
          caption: photo.caption || null,
          alt_text: photo.alt_text || null,
          is_featured: photo.is_featured || false,
          display_order: index
        }));

        const { error: insertError } = await supabase
          .from('organization_photos')
          .insert(photosToInsert);

        if (insertError) throw insertError;
      }

      // Call the onUpdate callback to refresh organization data
      if (onUpdate) {
        await onUpdate();
      }

      setIsEditingPhotos(false);
      return true;
    } catch (err) {
      console.error('Error saving photos:', err);
      setError('Failed to save photos: ' + err.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Empty state for non-editors
  if (photos.length === 0 && !canUploadPhotos) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <Camera className="w-16 h-16 mx-auto text-slate-300 mb-4" />
        <h3 className="text-xl font-medium text-slate-900 mb-2">No Photos Yet</h3>
        <p className="text-slate-600">
          Photos from {organization?.name} will appear here when they're shared.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
          <div className="flex">
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

      {/* Header - Instagram style */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Photos</h2>
          <p className="text-slate-600 text-sm mt-1">
            {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {canUploadPhotos && (
            <button 
              onClick={startEditingPhotos}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Edit3 className="w-4 h-4" />
              Manage Photos
            </button>
          )}
          
          {photos.length > 0 && (
            <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
              View All
            </button>
          )}
        </div>
      </div>

      {/* Upload Area for Empty State */}
      {photos.length === 0 && canUploadPhotos && (
        <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-12 text-center">
          <Upload className="w-16 h-16 mx-auto text-slate-400 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Share Your First Photos</h3>
          <p className="text-slate-600 mb-4">
            Upload photos to showcase your work and community impact
          </p>
          <button 
            onClick={startEditingPhotos}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Camera className="w-5 h-5" />
            Add Photos
          </button>
        </div>
      )}

      {/* Instagram-style Photo Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-1 md:gap-2">
          {photos.map((photo, index) => (
            <div 
              key={photo.id || index}
              className="relative aspect-square bg-slate-100 group cursor-pointer overflow-hidden"
              onClick={() => openPhoto(photo, index)}
            >
              <img 
                src={photo.url || photo} 
                alt={photo.alt_text || `Photo ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
              
              {/* Hover Overlay - Instagram style */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-4 text-white">
                  <div className="flex items-center gap-1">
                    <Heart className="w-5 h-5" />
                    <span className="font-semibold">42</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-5 h-5" />
                    <span className="font-semibold">7</span>
                  </div>
                </div>
              </div>

              {/* Featured Badge */}
              {photo.is_featured && (
                <div className="absolute top-2 left-2 bg-yellow-500 text-white p-1 rounded-full">
                  <Star className="w-3 h-3" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Instagram-style Photo Detail Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black z-50 flex">
          {/* Left side - Photo */}
          <div className="flex-1 flex items-center justify-center bg-black relative">
            {/* Navigation arrows */}
            {selectedPhoto.index > 0 && (
              <button
                onClick={prevPhoto}
                className="absolute left-4 z-10 w-10 h-10 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full flex items-center justify-center text-white transition-colors"
              >
                ←
              </button>
            )}
            
            {selectedPhoto.index < photos.length - 1 && (
              <button
                onClick={nextPhoto}
                className="absolute right-4 z-10 w-10 h-10 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full flex items-center justify-center text-white transition-colors"
              >
                →
              </button>
            )}
            
            <img 
              src={selectedPhoto.src}
              alt={selectedPhoto.alt_text || `Photo ${selectedPhoto.index + 1}`}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {/* Right side - Details (Instagram style) */}
          <div className="w-96 bg-white flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {organization?.name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{organization?.name}</h3>
                  <p className="text-xs text-slate-500">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-1 text-slate-400 hover:text-slate-600">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
                <button
                  onClick={closePhoto}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col">
              {/* Caption */}
              {selectedPhoto.caption && (
                <div className="p-4 border-b border-slate-200">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {organization?.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-semibold">{organization?.name}</span>{' '}
                        {selectedPhoto.caption}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Comments area */}
              <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                <div className="text-xs text-slate-500 text-center">
                  Comments will be available in future updates
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-slate-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <button className="p-1 hover:text-red-500 transition-colors">
                      <Heart className="w-6 h-6" />
                    </button>
                    <button className="p-1 hover:text-blue-500 transition-colors">
                      <MessageCircle className="w-6 h-6" />
                    </button>
                    <button className="p-1 hover:text-green-500 transition-colors">
                      <Share className="w-6 h-6" />
                    </button>
                  </div>
                  {selectedPhoto.is_featured && (
                    <Star className="w-5 h-5 text-yellow-500" />
                  )}
                </div>
                
                <div className="text-sm font-semibold text-slate-900 mb-1">
                  42 likes
                </div>
                
                <div className="text-xs text-slate-500">
                  {selectedPhoto.index + 1} of {photos.length}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Management Modal */}
      {isEditingPhotos && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-6xl w-full shadow-2xl transform transition-all overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="relative p-6 overflow-hidden">
              <div className="absolute inset-0">
                <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-300 to-purple-300 rounded-full blur-2xl opacity-60 -translate-x-8 -translate-y-8"></div>
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full blur-xl opacity-50 translate-x-4 -translate-y-4"></div>
              </div>
              
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">Manage Photos</h3>
                  <p className="text-slate-600 text-sm mt-1">Upload, organize, and caption your organization's photos</p>
                </div>
                <button
                  onClick={() => setIsEditingPhotos(false)}
                  className="text-slate-600 hover:text-slate-800 transition-colors p-1 bg-white bg-opacity-50 rounded-lg backdrop-blur-sm"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Upload Area */}
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="cursor-pointer block"
                >
                  {uploading ? (
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mb-4"></div>
                      <p className="text-blue-600 font-medium">Uploading photos...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-12 h-12 text-slate-400 mb-4" />
                      <p className="text-lg font-medium text-slate-900 mb-2">Upload Photos</p>
                      <p className="text-slate-600 mb-4">
                        Click here or drag and drop images to upload multiple photos at once
                      </p>
                      <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <Camera className="w-5 h-5" />
                        Choose Photos
                      </div>
                    </div>
                  )}
                </label>
              </div>

              {/* Photos Grid */}
              {editPhotos.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-slate-900 mb-4">
                    Your Photos ({editPhotos.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {editPhotos.map((photo, index) => (
                      <div key={photo.id || index} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                        {/* Photo */}
                        <div className="relative">
                          <img 
                            src={photo.url}
                            alt={photo.alt_text || `Photo ${index + 1}`}
                            className="w-full h-48 object-cover"
                          />
                          
                          {/* Controls Overlay */}
                          <div className="absolute top-2 right-2 flex gap-2">
                            <button
                              onClick={() => toggleFeatured(index)}
                              className={`p-2 rounded-full transition-colors ${
                                photo.is_featured 
                                  ? 'bg-yellow-500 text-white' 
                                  : 'bg-white bg-opacity-80 text-slate-600 hover:bg-yellow-500 hover:text-white'
                              }`}
                              title={photo.is_featured ? 'Remove from featured' : 'Mark as featured'}
                            >
                              <Star className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removePhoto(index)}
                              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                              title="Delete photo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Featured Badge */}
                          {photo.is_featured && (
                            <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              Featured
                            </div>
                          )}
                        </div>

                        {/* Photo Details */}
                        <div className="p-4 space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Caption
                            </label>
                            <input
                              type="text"
                              value={photo.caption || ''}
                              onChange={(e) => updatePhoto(index, 'caption', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                              placeholder="Add a caption..."
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Alt Text
                            </label>
                            <input
                              type="text"
                              value={photo.alt_text || ''}
                              onChange={(e) => updatePhoto(index, 'alt_text', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                              placeholder="Describe the image for accessibility..."
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {editPhotos.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <Camera className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-lg font-medium text-slate-700 mb-2">No Photos Added Yet</p>
                  <p>Upload some photos using the area above to get started!</p>
                </div>
              )}

              {/* Loading State */}
              {saving && (
                <div className="relative overflow-hidden bg-white border-2 border-blue-100 rounded-xl p-4">
                  <div className="absolute inset-0">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full blur-xl opacity-30"></div>
                  </div>
                  <div className="relative flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-400 border-t-transparent"></div>
                    <span className="text-sm font-medium text-blue-700">
                      Saving your photos...
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-4 flex gap-3">
              <button
                onClick={() => setIsEditingPhotos(false)}
                disabled={saving || uploading}
                className="flex-1 px-6 py-3 text-slate-600 font-medium text-sm border-2 border-slate-200 rounded-xl hover:bg-slate-100 hover:border-slate-300 transition-all duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={savePhotos}
                disabled={saving || uploading}
                className="flex-1 px-6 py-3 relative overflow-hidden text-white font-semibold text-sm rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl group"
              >
                <div className="absolute inset-0">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400"></div>
                  <div className="absolute top-0 left-0 w-8 h-8 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full blur-lg opacity-60 group-hover:scale-150 transition-transform duration-500"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 bg-gradient-to-br from-blue-300 to-purple-300 rounded-full blur-md opacity-40 group-hover:scale-125 transition-transform duration-700"></div>
                </div>
                
                <div className="relative z-10 flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Photos'}
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditableOrganizationPhotos;