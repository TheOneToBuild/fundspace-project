// src/components/organization-profile/EditableOrganizationPhotos.jsx - Instagram Grid Style
import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, Upload, Trash2, Heart, MessageCircle, Share, MoreHorizontal, Plus } from 'lucide-react';
import { supabase } from '../../supabaseClient.js';
import { hasPermission, PERMISSIONS } from '../../utils/organizationPermissions.js';
import Avatar from '../Avatar.jsx';

const EditableOrganizationPhotos = ({ 
  organization, 
  userMembership, 
  session,
  onUpdate
}) => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [newPost, setNewPost] = useState({ caption: '', image: null });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('view'); // 'view' or 'manage'
  const [managingPhotos, setManagingPhotos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const fileInputRef = useRef(null);

  // Check if user can create photo posts (must be admin/super_admin member)
  const canCreatePhotoPosts = userMembership && hasPermission(
    userMembership.role, 
    PERMISSIONS.EDIT_ORGANIZATION, 
    session?.user?.is_omega_admin
  );

  // Fetch photo posts from organization_photos table
  const fetchPhotos = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('organization_photos')
        .select(`
          id,
          image_url,
          caption,
          alt_text,
          created_at,
          uploaded_by_user_id,
          is_featured,
          display_order,
          likes_count,
          comments_count
        `)
        .eq('organization_id', organization.id)
        .order('display_order', { ascending: true });

      if (error) throw error;
      
      setPhotos(data || []);
    } catch (err) {
      console.error('Error fetching photos:', err);
      setError('Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organization?.id) {
      fetchPhotos();
    }
  }, [organization?.id]);

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      setError('File is too large. Max size is 5MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }

    setNewPost({ ...newPost, image: file });
    setError('');
  };

  // Handle photo upload and post creation
  const handleCreatePhotoPost = async () => {
    if (!newPost.image || !newPost.caption.trim()) {
      setError('Please add both a photo and caption.');
      return;
    }

    try {
      setUploading(true);
      setError('');

      // Upload image to Supabase storage
      const fileExt = newPost.image.name.split('.').pop();
      const fileName = `org-${organization.id}-photo-${Date.now()}.${fileExt}`;
      const filePath = `organizations/photos/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, newPost.image, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Create photo post in database
      const { error: insertError } = await supabase
        .from('organization_photos')
        .insert({
          organization_id: organization.id,
          image_url: publicUrl,
          caption: newPost.caption.trim(),
          alt_text: newPost.caption.trim(),
          uploaded_by_user_id: session?.user?.id,
          display_order: photos.length // Add to end of current photos
        });

      if (insertError) throw insertError;

      // Reset form and refresh
      setNewPost({ caption: '', image: null });
      setIsCreatingPost(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchPhotos();

      if (onUpdate) await onUpdate();
    } catch (err) {
      console.error('Error creating photo post:', err);
      setError('Failed to create photo post: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Delete photo post
  const handleDeletePhoto = async (photoId) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;

    try {
      const { error } = await supabase
        .from('organization_photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;

      setPhotos(photos.filter(p => p.id !== photoId));
      if (selectedPhoto?.id === photoId) {
        setSelectedPhoto(null);
      }

      if (onUpdate) await onUpdate();
    } catch (err) {
      console.error('Error deleting photo:', err);
      setError('Failed to delete photo');
    }
  };

  // Start managing photos
  const startManaging = () => {
    setManagingPhotos([...photos]);
    setActiveTab('manage');
  };

  // Save photo order
  const savePhotoOrder = async () => {
    try {
      setSaving(true);
      setError('');

      // Update display_order for each photo
      for (let i = 0; i < managingPhotos.length; i++) {
        const { error: updateError } = await supabase
          .from('organization_photos')
          .update({ display_order: i })
          .eq('id', managingPhotos[i].id);

        if (updateError) throw updateError;
      }

      await fetchPhotos();
      setActiveTab('view');
      
      if (onUpdate) await onUpdate();
    } catch (err) {
      console.error('Error saving photo order:', err);
      setError('Failed to save photo order');
    } finally {
      setSaving(false);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.parentNode);
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '';
    setDraggedIndex(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) return;
    
    const newPhotos = [...managingPhotos];
    const draggedPhoto = newPhotos[draggedIndex];
    
    // Remove dragged item
    newPhotos.splice(draggedIndex, 1);
    
    // Insert at new position
    newPhotos.splice(dropIndex, 0, draggedPhoto);
    
    setManagingPhotos(newPhotos);
  };

  // Move photo up/down (keeping for accessibility)
  const movePhoto = (index, direction) => {
    const newPhotos = [...managingPhotos];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex >= 0 && newIndex < newPhotos.length) {
      [newPhotos[index], newPhotos[newIndex]] = [newPhotos[newIndex], newPhotos[index]];
      setManagingPhotos(newPhotos);
    }
  };

  // Delete photo from manage view
  const deletePhotoFromManage = (index) => {
    const newPhotos = managingPhotos.filter((_, i) => i !== index);
    setManagingPhotos(newPhotos);
  };

  // Like/Unlike photo
  const toggleLike = async (photoId) => {
    if (!session?.user) return;

    try {
      const { data: existingLike } = await supabase
        .from('organization_photo_likes')
        .select('id')
        .eq('photo_id', photoId)
        .eq('user_id', session.user.id)
        .single();

      if (existingLike) {
        await supabase
          .from('organization_photo_likes')
          .delete()
          .eq('photo_id', photoId)
          .eq('user_id', session.user.id);
      } else {
        await supabase
          .from('organization_photo_likes')
          .insert({
            photo_id: photoId,
            user_id: session.user.id,
            reaction_type: 'like'
          });
      }
      
      await fetchPhotos();
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    return `${Math.floor(diffInSeconds / 604800)}w`;
  };

  // Open photo modal
  const openPhotoModal = (photo, index) => {
    setSelectedPhoto({ ...photo, index });
  };

  const closePhotoModal = () => {
    setSelectedPhoto(null);
  };

  // Navigate through photos
  const navigatePhoto = (direction) => {
    if (!selectedPhoto) return;
    
    const currentIndex = selectedPhoto.index;
    let newIndex;
    
    if (direction === 'next' && currentIndex < photos.length - 1) {
      newIndex = currentIndex + 1;
    } else if (direction === 'prev' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else {
      return;
    }
    
    openPhotoModal(photos[newIndex], newIndex);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
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

      {/* Header with Tabs */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Photos</h2>
          <p className="text-slate-600 text-sm mt-1">
            Share photos with captions to showcase your work
          </p>
        </div>
        
        {canCreatePhotoPosts && (
          <div className="flex items-center gap-3">
            {/* Tab Navigation */}
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('view')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'view'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                View
              </button>
              <button
                onClick={startManaging}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'manage'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Manage
              </button>
            </div>
            
            {/* Action Buttons */}
            {activeTab === 'view' && (
              <button 
                onClick={() => setIsCreatingPost(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Photo
              </button>
            )}
            
            {activeTab === 'manage' && (
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('view')}
                  className="px-4 py-2 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={savePhotoOrder}
                  disabled={saving}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Saving...
                    </>
                  ) : (
                    'Save Order'
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Photo Modal */}
      {isCreatingPost && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">Share a Photo</h3>
                <button
                  onClick={() => {
                    setIsCreatingPost(false);
                    setNewPost({ caption: '', image: null });
                    setError('');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Image Upload */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {!newPost.image ? (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-8 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors flex flex-col items-center gap-3 text-slate-600"
                  >
                    <Camera className="w-12 h-12" />
                    <div className="text-center">
                      <p className="font-medium">Upload Photo</p>
                      <p className="text-sm">Required - Max 5MB</p>
                    </div>
                  </button>
                ) : (
                  <div className="relative">
                    <img 
                      src={URL.createObjectURL(newPost.image)}
                      alt="Preview"
                      className="w-full max-h-64 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => {
                        setNewPost({ ...newPost, image: null });
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Caption Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Caption *
                </label>
                <textarea
                  value={newPost.caption}
                  onChange={(e) => setNewPost({ ...newPost, caption: e.target.value })}
                  placeholder="Tell the story behind this photo..."
                  className="w-full min-h-[100px] p-3 border border-slate-200 rounded-lg resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  maxLength={500}
                />
                <div className="text-right text-sm text-slate-500 mt-1">
                  {newPost.caption.length}/500
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-4 flex gap-3">
              <button
                onClick={() => {
                  setIsCreatingPost(false);
                  setNewPost({ caption: '', image: null });
                  setError('');
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                disabled={uploading}
                className="flex-1 px-4 py-2 text-slate-600 font-medium border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePhotoPost}
                disabled={!newPost.image || !newPost.caption.trim() || uploading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Posting...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    Share Photo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content based on active tab */}
      {activeTab === 'view' ? (
        // View Tab - Instagram Grid
        photos.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            {photos.map((photo, index) => (
              <div 
                key={photo.id}
                className="relative aspect-square bg-slate-100 group cursor-pointer overflow-hidden rounded-xl"
                onClick={() => openPhotoModal(photo, index)}
              >
                <img 
                  src={photo.image_url} 
                  alt={photo.alt_text || photo.caption || `Photo ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
                
                {/* Instagram-style hover overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-4 text-white">
                    <div className="flex items-center gap-1">
                      <Heart className="w-5 h-5" />
                      <span className="font-semibold">{photo.likes_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-5 h-5" />
                      <span className="font-semibold">{photo.comments_count || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Quick delete button for view mode */}
                {canCreatePhotoPosts && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePhoto(photo.id);
                    }}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all duration-200"
                    title="Delete photo"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          // Empty State for View
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Camera className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-medium text-slate-900 mb-2">No Photos Yet</h3>
            <p className="text-slate-600 mb-4">
              {canCreatePhotoPosts 
                ? "Share your first photo to showcase your work and impact."
                : `${organization?.name} hasn't shared any photos yet.`
              }
            </p>
            {canCreatePhotoPosts && (
              <button 
                onClick={() => setIsCreatingPost(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Camera className="w-5 h-5" />
                Add First Photo
              </button>
            )}
          </div>
        )
      ) : (
        // Manage Tab - Drag and Drop Grid
        managingPhotos.length > 0 ? (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 text-sm">
                <strong>Manage Photos:</strong> Drag and drop photos within the grid to reorder them. Changes are saved when you click "Save Order".
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              {managingPhotos.map((photo, index) => (
                <div 
                  key={photo.id}
                  className={`relative aspect-square bg-slate-100 group overflow-hidden rounded-xl transition-all duration-200 ${
                    draggedIndex === index 
                      ? 'opacity-50 scale-95 ring-2 ring-blue-400' 
                      : 'cursor-move hover:ring-2 hover:ring-slate-300'
                  }`}
                  draggable="true"
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  <img 
                    src={photo.image_url} 
                    alt={photo.alt_text || photo.caption || `Photo ${index + 1}`}
                    className="w-full h-full object-cover pointer-events-none"
                  />
                  
                  {/* Drag overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-center">
                      <div className="text-xs font-medium mb-1">#{index + 1}</div>
                      <div className="text-xs">Drag to reorder</div>
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePhotoFromManage(index);
                    }}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all duration-200 z-10"
                    title="Delete photo"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>

                  {/* Drag handle indicator */}
                  <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex flex-col gap-1">
                      <div className="flex gap-1">
                        <div className="w-1 h-1 bg-white rounded-full"></div>
                        <div className="w-1 h-1 bg-white rounded-full"></div>
                      </div>
                      <div className="flex gap-1">
                        <div className="w-1 h-1 bg-white rounded-full"></div>
                        <div className="w-1 h-1 bg-white rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Camera className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-medium text-slate-900 mb-2">No Photos to Manage</h3>
            <p className="text-slate-600">
              Add some photos first, then come back here to organize them.
            </p>
          </div>
        )
      )}

      {/* Photo Detail Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex">
            {/* Left side - Photo */}
            <div className="flex-1 bg-black flex items-center justify-center relative min-h-[500px]">
              {/* Navigation arrows */}
              {selectedPhoto.index > 0 && (
                <button
                  onClick={() => navigatePhoto('prev')}
                  className="absolute left-4 z-10 w-10 h-10 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  ←
                </button>
              )}
              
              {selectedPhoto.index < photos.length - 1 && (
                <button
                  onClick={() => navigatePhoto('next')}
                  className="absolute right-4 z-10 w-10 h-10 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  →
                </button>
              )}
              
              <img 
                src={selectedPhoto.image_url}
                alt={selectedPhoto.alt_text || selectedPhoto.caption || `Photo ${selectedPhoto.index + 1}`}
                className="max-w-full max-h-full object-contain"
              />
            </div>

            {/* Right side - Details */}
            <div className="w-96 flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {organization?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{organization?.name}</h3>
                    <p className="text-xs text-slate-500">{formatTimeAgo(selectedPhoto.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-1 text-slate-400 hover:text-slate-600">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                  <button
                    onClick={closePhotoModal}
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
                    Comments feature coming soon
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-slate-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      {session?.user ? (
                        <button 
                          onClick={() => toggleLike(selectedPhoto.id)}
                          className="p-1 hover:text-red-500 transition-colors"
                        >
                          <Heart className="w-6 h-6" />
                        </button>
                      ) : (
                        <button className="p-1 text-slate-400 cursor-not-allowed">
                          <Heart className="w-6 h-6" />
                        </button>
                      )}
                      <button className="p-1 hover:text-blue-500 transition-colors">
                        <MessageCircle className="w-6 h-6" />
                      </button>
                      <button className="p-1 hover:text-green-500 transition-colors">
                        <Share className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-sm font-semibold text-slate-900 mb-1">
                    {selectedPhoto.likes_count || 0} likes
                  </div>
                  
                  <div className="text-xs text-slate-500">
                    {selectedPhoto.index + 1} of {photos.length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditableOrganizationPhotos;