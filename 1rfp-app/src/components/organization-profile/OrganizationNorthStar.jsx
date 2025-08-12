// src/components/organization-profile/OrganizationNorthStar.jsx - Fixed with Global Edit Mode Support
import React, { useState, useEffect } from 'react';
import { Edit3, Plus } from 'lucide-react';
import { supabase } from '../../supabaseClient.js';
import { hasPermission, PERMISSIONS } from '../../utils/organizationPermissions.js';
import NorthStarEditView from './north-star/NorthStarEditView.jsx';
import NorthStarPublicView from './north-star/NorthStarPublicView.jsx';

const OrganizationNorthStar = ({ organization, userMembership, session, isEditMode = false }) => {
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Enhanced permission check
  const canEdit = userMembership && hasPermission(
    userMembership.role, 
    PERMISSIONS.EDIT_ORGANIZATION, 
    session?.user?.is_omega_admin
  );

  // FIXED: Reset local editing state when global edit mode changes to false
  useEffect(() => {
    if (!isEditMode && isEditing) {
      setIsEditing(false);
      setEditData(null);
      setError(null);
      
      // Clear sessionStorage when exiting edit mode
      const storageKey = `editData_${organization?.id}`;
      sessionStorage.removeItem(storageKey);
    }
  }, [isEditMode, isEditing, organization?.id]);

  // Fetch page data
  useEffect(() => {
    const fetchPageData = async () => {
      if (!organization?.id) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('organization_north_stars')
          .select('*')
          .eq('organization_id', organization.id)
          .eq('is_published', true)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        setPageData(data);
      } catch (err) {
        console.error('Error fetching North Star data:', err);
        setError('Failed to load page data');
      } finally {
        setLoading(false);
      }
    };

    fetchPageData();
  }, [organization?.id]);

  // Initialize edit mode with flexible structure
  const startEditing = () => {
    // Load from sessionStorage first
    const storageKey = `editData_${organization?.id}`;
    const savedData = sessionStorage.getItem(storageKey);
    
    let initialData = pageData || {
      blocks: []
    };
    
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        if (parsedData && parsedData.blocks) {
          initialData = parsedData;
        }
      } catch (error) {
        console.warn('Failed to parse saved edit data:', error);
      }
    }

    setEditData(initialData);
    setIsEditing(true);
    setError(null);
  };

  // Cancel editing with confirmation
  const cancelEditing = () => {
    if (editData && JSON.stringify(editData) !== JSON.stringify(pageData)) {
      if (!window.confirm('You have unsaved changes. Are you sure you want to discard them?')) {
        return;
      }
    }
    setIsEditing(false);
    setEditData(null);
    setError(null);
    
    // Clear sessionStorage
    const storageKey = `editData_${organization?.id}`;
    sessionStorage.removeItem(storageKey);
  };

  // Save page data with better validation
  const savePage = async () => {
    if (!editData || !session?.user?.id) return;

    // FIXED: Allow saving empty content (for "All Clear" functionality)
    const hasBlocks = editData.blocks && editData.blocks.length > 0;
    
    // If there are blocks, validate that at least one has content
    if (hasBlocks) {
      const hasBlocksWithContent = editData.blocks.some(block => 
        block.title && block.title.trim() || 
        block.content && (
          typeof block.content === 'string' ? block.content.trim() :
          Array.isArray(block.content) ? block.content.some(item => 
            typeof item === 'string' ? item.trim() : 
            (item && (item.label || item.value))
          ) : false
        )
      );

      if (!hasBlocksWithContent) {
        setError('Please add some content before saving');
        return;
      }
    }
    // If no blocks at all, we'll save empty content (for "All Clear")

    setSaving(true);
    setError(null);

    try {
      // Save the blocks data (can be empty array)
      const dataToSave = {
        organization_id: organization.id,
        blocks: editData.blocks || [],
        is_published: true
      };

      let result;
      if (pageData?.id) {
        result = await supabase
          .from('organization_north_stars')
          .update(dataToSave)
          .eq('id', pageData.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('organization_north_stars')
          .insert(dataToSave)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      setPageData(result.data);
      setIsEditing(false);
      setEditData(null);
      
      // Clear sessionStorage since we've saved successfully
      const storageKey = `editData_${organization?.id}`;
      sessionStorage.removeItem(storageKey);

    } catch (err) {
      console.error('Error saving page:', err);
      setError(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-500">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  // Render edit view if in editing mode AND global edit mode is true
  if (isEditing && isEditMode) {
    return (
      <NorthStarEditView
        editData={editData}
        setEditData={setEditData}
        onSave={savePage}
        onCancel={cancelEditing}
        saving={saving}
        organization={organization}
      />
    );
  }

  // FIXED: Pass isEditMode prop to NorthStarPublicView
  return (
    <NorthStarPublicView
      pageData={pageData}
      organization={organization}
      canEdit={canEdit}
      onEdit={startEditing}
      isEditMode={isEditMode}
    />
  );
};

export default OrganizationNorthStar;