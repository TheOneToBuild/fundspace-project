// src/components/organization-profile/OrganizationNorthStar.jsx - Main Component
import React, { useState, useEffect } from 'react';
import { Star, Edit3, AlertTriangle } from 'lucide-react';
import { supabase } from '../../supabaseClient.js';
import { hasPermission, PERMISSIONS } from '../../utils/organizationPermissions.js';

// Import sub-components
import NorthStarEditView from './north-star/NorthStarEditView.jsx';
import NorthStarPublicView from './north-star/NorthStarPublicView.jsx';

const OrganizationNorthStar = ({ organization, userMembership, session }) => {
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);

  // Enhanced permission check
  const canEdit = userMembership && hasPermission(
    userMembership.role, 
    PERMISSIONS.EDIT_ORGANIZATION, 
    session?.user?.is_omega_admin
  );

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

  // Handle successful save from edit view
  const handleSaveSuccess = (savedData) => {
    setPageData(savedData);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
          <p className="text-slate-600 text-lg">Loading your story...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 m-6">
        <div className="flex items-center gap-3 text-red-800">
          <AlertTriangle size={20} />
          <span className="font-medium">{error}</span>
        </div>
      </div>
    );
  }

  // Enhanced empty state for organizations without North Star
  if (!pageData && !isEditing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <Star className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-slate-900 mb-6">
            Tell Your Story
          </h1>
          <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            {canEdit 
              ? `Create a compelling page that showcases ${organization?.name}'s vision, impact, and strategic direction. This is where your story comes to life.`
              : `${organization?.name} is crafting their story. Check back soon to discover their vision and impact.`
            }
          </p>
          {canEdit && (
            <div className="space-y-6">
              <button
                onClick={() => setIsEditing(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-12 py-4 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 font-medium text-lg shadow-xl"
              >
                <Edit3 size={24} className="inline mr-3" />
                Start Building Your Page
              </button>
              <p className="text-sm text-slate-500">
                Drag, drop, and customize - make it uniquely yours
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render appropriate view
  if (isEditing) {
    return (
      <NorthStarEditView
        initialData={pageData}
        organization={organization}
        session={session}
        onSave={handleSaveSuccess}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <NorthStarPublicView
      pageData={pageData}
      organization={organization}
      canEdit={canEdit}
      onEdit={() => setIsEditing(true)}
    />
  );
};

export default OrganizationNorthStar;