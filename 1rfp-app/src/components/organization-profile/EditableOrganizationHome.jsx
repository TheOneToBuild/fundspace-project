// src/components/organization-profile/EditableOrganizationHome.jsx - Updated with OrganizationPostsManager
import React, { useState } from 'react';
import { MessageSquare, Plus, Edit3, X } from 'lucide-react';
import { supabase } from '../../supabaseClient.js';
import OrganizationPostsManager from './OrganizationPostsManager.jsx';
import { hasPermission, PERMISSIONS } from '../../utils/organizationPermissions.js';

// Refactored components
import MissionEditModal from './MissionEditModal.jsx';
import PhotoPreviewSection from './PhotoPreviewSection.jsx';
import { FocusAreaPill } from './FocusAreasManager.jsx';

const EditableOrganizationHome = ({ 
  organization, 
  organizationPosts, 
  session, 
  onPostDelete,
  userMembership,
  photos = [],
  onUpdate,
  activeTab,
  setActiveTab
}) => {
  // State management - simplified
  const [isEditingMission, setIsEditingMission] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Check permissions
  const canCreatePosts = userMembership && hasPermission(
    userMembership.role, 
    PERMISSIONS.EDIT_ORGANIZATION, 
    session?.user?.is_omega_admin
  );

  const handleViewAllPhotos = () => {
    if (setActiveTab) {
      setActiveTab('photos');
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
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

      return publicUrl;
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image: ' + err.message);
      return false;
    } finally {
      setUploading(false);
    }
  };

  // Handle comprehensive save (mission + focus areas)
  const handleMissionSave = async (editData) => {
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
        await onUpdate();
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

      {/* Mission Section */}
      <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm grid md:grid-cols-2 gap-10 items-center relative">
        {/* Edit Button */}
        {canCreatePosts && (
          <button
            onClick={() => setIsEditingMission(true)}
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
          {organization.focusAreas && organization.focusAreas.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-200">
              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Focus Areas</h4>
              <div className="flex flex-wrap gap-3">
                {organization.focusAreas.map((area) => (
                  <FocusAreaPill key={area} area={area} />
                ))}
              </div>
            </div>
          )}
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

      {/* Organization Posts Section - Using OrganizationPostsManager */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-900">Manage Organization Updates</h3>
          <p className="text-sm text-slate-600 mt-1">Create and manage posts that will appear on your organization's public profile</p>
        </div>
        
        <OrganizationPostsManager 
          organization={organization}
          session={session}
          userMembership={userMembership}
          currentUserProfile={session?.user}
        />
      </div>

      {/* Mission Edit Modal */}
      <MissionEditModal
        isOpen={isEditingMission}
        onClose={() => setIsEditingMission(false)}
        organization={organization}
        onSave={handleMissionSave}
        saving={saving}
        uploading={uploading}
        error={error}
        onImageUpload={handleMissionImageUpload}
      />
    </div>
  );
};

export default EditableOrganizationHome;