// src/components/organization-profile/EditableOrganizationHome.jsx - Single edit modal approach
import React, { useState } from 'react';
import { MessageSquare, Plus, Edit3, Save, X, Image, Trash2, Upload } from 'lucide-react';
import { supabase } from '../../supabaseClient.js';
import OrganizationPostCard from '../OrganizationPostCard.jsx';
import OrganizationPostDetailModal from '../OrganizationPostDetailModal.jsx';
import CreatePost from '../CreatePost.jsx';
import { hasPermission, PERMISSIONS } from '../../utils/organizationPermissions.js';

const EditableOrganizationHome = ({ 
  organization, 
  organizationPosts, 
  session, 
  onPostDelete,
  userMembership,
  photos = [],
  onUpdate // Callback to refresh organization data
}) => {
  const [selectedPost, setSelectedPost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditingMission, setIsEditingMission] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Combined edit state for mission section
  const [editData, setEditData] = useState({
    description: organization?.description || '',
    mission_image_url: organization?.mission_image_url || '',
    focusAreas: organization?.focusAreas || []
  });
  const [newFocusArea, setNewFocusArea] = useState('');

  // Check if user can create posts (must be a member with edit permissions)
  const canCreatePosts = userMembership && hasPermission(
    userMembership.role, 
    PERMISSIONS.EDIT_ORGANIZATION, 
    session?.user?.is_omega_admin
  );

  // Check if user can edit/delete posts
  const canEditPosts = canCreatePosts;

  const handleOpenDetail = (post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const handleCloseDetail = () => {
    setSelectedPost(null);
    setIsModalOpen(false);
  };

  const handleNewPost = (newPost) => {
    console.log('New post created:', newPost);
  };

  // Handle mission image upload
  const handleMissionImageUpload = async (file) => {
    try {
      setUploading(true);
      setError('');

      // Validate file
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `org-${organization.id}-mission-${Date.now()}.${fileExt}`;
      const filePath = `organizations/${fileName}`;

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

      setEditData({ ...editData, mission_image_url: publicUrl });
      return true;
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image: ' + err.message);
      return false;
    } finally {
      setUploading(false);
    }
  };

  // Handle comprehensive save (mission + focus areas)
  const handleSaveAll = async () => {
    try {
      setSaving(true);
      setError('');

      // Step 1: Update organization basic info
      const orgUpdateData = {};
      
      if (editData.description !== organization.description) {
        orgUpdateData.description = editData.description;
      }
      
      if (editData.mission_image_url !== organization.mission_image_url) {
        orgUpdateData.mission_image_url = editData.mission_image_url;
      }

      if (Object.keys(orgUpdateData).length > 0) {
        const { error: updateError } = await supabase
          .from('organizations')
          .update(orgUpdateData)
          .eq('id', organization.id);

        if (updateError) throw updateError;
      }

      // Step 2: Update focus areas if they changed
      const currentFocusAreas = organization.focusAreas || [];
      const newFocusAreas = editData.focusAreas || [];
      
      // Check if focus areas changed
      const areasChanged = JSON.stringify(currentFocusAreas.sort()) !== JSON.stringify(newFocusAreas.sort());
      
      if (areasChanged) {
        // Remove all existing categories for this organization
        const { error: deleteError } = await supabase
          .from('organization_categories')
          .delete()
          .eq('organization_id', organization.id);

        if (deleteError) throw deleteError;

        // Add the new focus areas
        if (newFocusAreas.length > 0) {
          // Get or create category IDs
          const categoryPromises = newFocusAreas.map(async (areaName) => {
            // Try to find existing category
            let { data: existingCategory } = await supabase
              .from('categories')
              .select('id')
              .eq('name', areaName)
              .single();

            if (!existingCategory) {
              // Create new category
              const { data: newCategory, error: createError } = await supabase
                .from('categories')
                .insert({ name: areaName })
                .select('id')
                .single();

              if (createError) throw createError;
              existingCategory = newCategory;
            }

            return existingCategory.id;
          });

          const categoryIds = await Promise.all(categoryPromises);

          // Insert organization_categories relationships
          const organizationCategories = categoryIds.map(categoryId => ({
            organization_id: organization.id,
            category_id: categoryId
          }));

          const { error: insertError } = await supabase
            .from('organization_categories')
            .insert(organizationCategories);

          if (insertError) throw insertError;
        }
      }

      // Call the onUpdate callback to refresh organization data
      if (onUpdate) {
        await onUpdate({ 
          ...organization, 
          ...orgUpdateData, 
          focusAreas: editData.focusAreas 
        });
      }

      setIsEditingMission(false);
      return true;
    } catch (err) {
      console.error('Error saving mission section:', err);
      setError('Failed to save changes: ' + err.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Add new focus area
  const addFocusArea = () => {
    if (newFocusArea.trim() && !editData.focusAreas.includes(newFocusArea.trim())) {
      setEditData({
        ...editData,
        focusAreas: [...editData.focusAreas, newFocusArea.trim()]
      });
      setNewFocusArea('');
    }
  };

  // Remove focus area
  const removeFocusArea = (areaToRemove) => {
    setEditData({
      ...editData,
      focusAreas: editData.focusAreas.filter(area => area !== areaToRemove)
    });
  };

  // Start editing - reset all edit data
  const startEditing = () => {
    setEditData({
      description: organization?.description || '',
      mission_image_url: organization?.mission_image_url || '',
      focusAreas: organization?.focusAreas || []
    });
    setNewFocusArea('');
    setError('');
    setIsEditingMission(true);
  };

  const FocusAreaPill = ({ area, onRemove = null, editable = false }) => {
    const gradients = [
      'from-amber-100 to-orange-100 text-amber-700 border-orange-200', 
      'from-emerald-100 to-teal-100 text-emerald-700 border-teal-200', 
      'from-rose-100 to-pink-100 text-rose-700 border-rose-200', 
      'from-blue-100 to-indigo-100 text-blue-700 border-indigo-200'
    ];
    const gradient = gradients[area.length % gradients.length];
    
    return (
      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border bg-gradient-to-r ${gradient} ${editable ? 'pr-1' : ''}`}>
        {area}
        {editable && onRemove && (
          <button
            onClick={() => onRemove(area)}
            className="ml-2 p-0.5 hover:bg-black hover:bg-opacity-10 rounded-full transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </span>
    );
  };

  const PhotoGallery = ({ photos, title }) => (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <div className="flex items-center gap-2">
          {canCreatePosts && (
            <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
              Edit Photos
            </button>
          )}
          <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">View All</button>
        </div>
      </div>
      <div className="flex overflow-x-auto space-x-4 pb-4 -mb-4">
        {photos.slice(0, 9).map((photo, index) => (
          <div 
            key={photo.id || index} 
            className="flex-shrink-0 w-72 h-52 rounded-lg overflow-hidden bg-slate-100 hover:scale-105 transition-transform cursor-pointer shadow-md group"
          >
            <img 
              src={photo.url || photo} 
              alt={photo.alt_text || `Photo ${index + 1}`} 
              className="w-full h-full object-cover" 
            />
            {photo.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                {photo.caption}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {photos.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <div className="text-4xl mb-2">📷</div>
          <p>No photos uploaded yet</p>
          {canCreatePosts && (
            <button className="mt-3 text-sm text-purple-600 hover:text-purple-700 font-medium">
              Add Photos
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-10">
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

      {/* Mission Section - Single Edit Button */}
      <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm grid md:grid-cols-2 gap-10 items-center relative">
        {/* Single Edit Button */}
        {canEditPosts && (
          <button
            onClick={startEditing}
            className="absolute top-4 right-4 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Edit3 className="w-4 h-4" />
            Edit Section
          </button>
        )}

        <div className="flex flex-col h-full">
          <h2 className="text-3xl font-black text-slate-900 mb-4">Our Mission ✨</h2>
          
          <p className="text-slate-700 leading-relaxed text-lg flex-grow">
            {organization.description || "Working to create positive impact in our community through strategic partnerships and innovative solutions."}
          </p>
          
          {/* Focus Areas */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Focus Areas</h4>
            
            {organization.focusAreas && organization.focusAreas.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {organization.focusAreas.map((area) => (
                  <FocusAreaPill key={area} area={area} />
                ))}
              </div>
            ) : (
              <div className="text-slate-500 text-sm">
                {canEditPosts ? "Click 'Edit Section' to add focus areas" : "No focus areas specified"}
              </div>
            )}
          </div>
        </div>
        
        {/* Mission Image */}
        <div className="relative">
          <img 
            src={organization.mission_image_url || 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&h=600&fit=crop'} 
            alt="Our Mission" 
            className="rounded-2xl object-cover w-full h-full max-h-[450px]" 
          />
        </div>
      </div>

      {/* Photo Gallery */}
      {photos.length > 0 ? (
        <PhotoGallery photos={photos} title="Community in Action" />
      ) : (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-900">Community in Action</h3>
            {canCreatePosts && (
              <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                Add Photos
              </button>
            )}
          </div>
          <div className="text-center py-12 text-slate-500">
            <div className="text-6xl mb-4">📷</div>
            <h4 className="text-lg font-medium text-slate-700 mb-2">No Photos Yet</h4>
            <p className="text-slate-600">
              {canCreatePosts 
                ? "Share photos of your work and community impact to bring your mission to life."
                : `${organization.name} hasn't shared any photos yet.`
              }
            </p>
          </div>
        </div>
      )}

      {/* Create Post Section - Only show if user can post */}
      {canCreatePosts && (
        <CreatePost 
          profile={session?.user} 
          onNewPost={handleNewPost}
          channel="organization"
          placeholder={`Share an update for ${organization.name}...`}
          organizationId={organization.id}
          organizationType={organization.type}
          organization={organization}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"
        />
      )}

      {/* Posts Feed */}
      {organizationPosts && organizationPosts.length > 0 ? (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">Recent Posts</h3>
            {organizationPosts.length > 3 && (
              <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                View All Posts
              </button>
            )}
          </div>
          
          {/* Recent posts preview or full feed */}
          <div className="space-y-6">
            {organizationPosts.slice(0, 3).map((post) => (
              <OrganizationPostCard 
                key={post.id} 
                post={post} 
                organization={organization}
                onDelete={canEditPosts ? onPostDelete : null}
                canEdit={canEditPosts}
                currentUserId={session?.user?.id}
                onOpenDetail={handleOpenDetail}
                currentUserProfile={session?.user}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center">
          <MessageSquare className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No Updates Yet</h3>
          <p className="text-slate-600">
            {canCreatePosts 
              ? `Be the first to share an update for ${organization.name}!`
              : `No updates have been shared by ${organization.name} yet.`
            }
          </p>
          {canCreatePosts && (
            <button className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus size={16} className="mr-2" />
              Create First Post
            </button>
          )}
        </div>
      )}

      {/* Post Detail Modal */}
      {isModalOpen && (
        <OrganizationPostDetailModal
          post={selectedPost}
          organization={organization}
          onClose={handleCloseDetail}
          currentUserId={session?.user?.id}
          canEdit={canEditPosts}
        />
      )}

      {/* Comprehensive Mission Edit Modal */}
      {isEditingMission && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl transform transition-all overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="relative p-6 overflow-hidden">
              <div className="absolute inset-0">
                <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full blur-2xl opacity-60 -translate-x-8 -translate-y-8"></div>
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-300 to-indigo-300 rounded-full blur-xl opacity-50 translate-x-4 -translate-y-4"></div>
              </div>
              
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">Edit Mission Section</h3>
                  <p className="text-slate-600 text-sm mt-1">Update your mission statement, image, and focus areas</p>
                </div>
                <button
                  onClick={() => setIsEditingMission(false)}
                  className="text-slate-600 hover:text-slate-800 transition-colors p-1 bg-white bg-opacity-50 rounded-lg backdrop-blur-sm"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Left Column - Text Content */}
                <div className="space-y-6">
                  {/* Mission Description */}
                  <div className="group">
                    <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-400"></div>
                      Mission Statement
                    </label>
                    <textarea
                      value={editData.description}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-transparent focus:ring-2 focus:ring-purple-300 transition-all duration-200 group-hover:border-slate-300 bg-white resize-none"
                      placeholder="Describe your organization's mission and goals..."
                      rows={6}
                    />
                  </div>

                  {/* Focus Areas */}
                  <div className="group">
                    <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400"></div>
                      Focus Areas
                    </label>
                    
                    {/* Current Focus Areas */}
                    {editData.focusAreas.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {editData.focusAreas.map((area) => (
                          <FocusAreaPill 
                            key={area} 
                            area={area} 
                            onRemove={removeFocusArea}
                            editable={true}
                          />
                        ))}
                      </div>
                    )}

                    {/* Add New Focus Area */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newFocusArea}
                        onChange={(e) => setNewFocusArea(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addFocusArea()}
                        className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-transparent focus:ring-2 focus:ring-purple-300 transition-all duration-200 group-hover:border-slate-300 bg-white"
                        placeholder="e.g., Education, Healthcare, Environment"
                      />
                      <button
                        onClick={addFocusArea}
                        disabled={!newFocusArea.trim()}
                        className="px-4 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column - Image */}
                <div className="space-y-6">
                  {/* Mission Image */}
                  <div className="group">
                    <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-indigo-400"></div>
                      Mission Image
                    </label>
                    
                    {/* Current Image Preview */}
                    <div className="mb-4 relative">
                      <img 
                        src={editData.mission_image_url || 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&h=600&fit=crop'} 
                        alt="Mission" 
                        className="w-full h-64 object-cover rounded-xl border-2 border-slate-200" 
                      />
                      {editData.mission_image_url && editData.mission_image_url !== 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&h=600&fit=crop' && (
                        <button
                          onClick={() => setEditData({ ...editData, mission_image_url: '' })}
                          className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Upload Options */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => e.target.files[0] && handleMissionImageUpload(e.target.files[0])}
                          className="hidden"
                          id="mission-image-upload"
                        />
                        <label
                          htmlFor="mission-image-upload"
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                        >
                          {uploading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              Upload Image
                            </>
                          )}
                        </label>
                        <span className="text-sm text-slate-500">or paste URL below</span>
                      </div>

                      <input
                        type="url"
                        value={editData.mission_image_url}
                        onChange={(e) => setEditData({ ...editData, mission_image_url: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-transparent focus:ring-2 focus:ring-purple-300 transition-all duration-200 group-hover:border-slate-300 bg-white"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Loading State */}
              {saving && (
                <div className="relative overflow-hidden bg-white border-2 border-purple-100 rounded-xl p-4">
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

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-4 flex gap-3">
              <button
                onClick={() => setIsEditingMission(false)}
                disabled={saving}
                className="flex-1 px-6 py-3 text-slate-600 font-medium text-sm border-2 border-slate-200 rounded-xl hover:bg-slate-100 hover:border-slate-300 transition-all duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAll}
                disabled={saving}
                className="flex-1 px-6 py-3 relative overflow-hidden text-white font-semibold text-sm rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl group"
              >
                <div className="absolute inset-0">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400"></div>
                  <div className="absolute top-0 left-0 w-8 h-8 bg-gradient-to-br from-blue-300 to-indigo-300 rounded-full blur-lg opacity-60 group-hover:scale-150 transition-transform duration-500"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 bg-gradient-to-br from-pink-300 to-purple-300 rounded-full blur-md opacity-40 group-hover:scale-125 transition-transform duration-700"></div>
                </div>
                
                <div className="relative z-10 flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save All Changes'}
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditableOrganizationHome;