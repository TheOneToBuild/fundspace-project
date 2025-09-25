// src/pages/OrganizationProfilePage.jsx - Added pageData support
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';
import { usePageDataLoader } from '../hooks/usePageDataLoader'; // NEW: Add page data loader

// Shared Components
import PublicPageLayout from '../components/PublicPageLayout.jsx';
import EditableOrganizationHeader from '../components/organization-profile/EditableOrganizationHeader.jsx';
import OrganizationHeader from '../components/organization-profile/OrganizationHeader.jsx';

// Page Section Components
import OrganizationHome from '../components/organization-profile/OrganizationHome.jsx';
import OrganizationTeam from '../components/organization-profile/OrganizationTeam.jsx';
import EditableOrganizationHome from '../components/organization-profile/EditableOrganizationHome.jsx';
import EditableOrganizationPhotos from '../components/organization-profile/EditableOrganizationPhotos.jsx';
import OrganizationNorthStar from '../components/organization-profile/OrganizationNorthStar.jsx';
import OrganizationPhotos from '../components/organization-profile/OrganizationPhotos.jsx';
import OrganizationGrantsFixed from '../components/organization-profile/OrganizationGrantsFixed.jsx';
import OrganizationPrograms from '../components/organization-profile/OrganizationPrograms.jsx';
import EditableOrganizationPrograms from '../components/organization-profile/EditableOrganizationPrograms.jsx';

// Hooks and Utilities
import { useOrganizationSocial } from '../hooks/useOrganizationSocial.js';
import { hasPermission, PERMISSIONS } from '../utils/organizationPermissions.js';

const ORG_TYPE_CONFIGS = {
  foundation: {
    headerStyle: 'foundation',
    showNorthStar: true,
    showPrograms: true,
    showPhotos: true,
    primaryGradient: 'from-purple-500 to-indigo-600'
  },
  nonprofit: {
    headerStyle: 'nonprofit',
    showNorthStar: true,
    showPrograms: true,
    showPhotos: true,
    primaryGradient: 'from-green-500 to-emerald-600'
  },
  default: {
    headerStyle: 'default',
    showNorthStar: true,
    showPrograms: true,
    showPhotos: true,
    primaryGradient: 'from-slate-500 to-slate-600'
  }
};

const PlaceholderContent = ({ contentType, organizationType }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
    <div className="text-6xl mb-4">🚧</div>
    <h3 className="text-xl font-medium text-slate-900 mb-2">Coming Soon</h3>
    <p className="text-slate-600">
      {contentType} content for {organizationType} organizations is being built.
    </p>
  </div>
);

const OrganizationProfilePage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const hasInitialized = useRef(false);
  
  // NEW: Add page data loader for batched API calls
  const { pageData, loadPostsPageData, clearPageData } = usePageDataLoader();

  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  const [userMembership, setUserMembership] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [organizationPosts, setOrganizationPosts] = useState([]); // NEW: Track organization posts
  
  // Social features (follow/bookmark)
  const {
    isFollowing,
    followersCount,
    isBookmarked,
    bookmarksCount,
    toggleFollow,
    toggleBookmark
  } = useOrganizationSocial(organization?.id, session?.user?.id);

  // Edit mode state
  const isEditMode = searchParams.get('edit') === 'true';
  
  // Get organization type configuration
  const getOrgTypeFromType = (type) => {
    if (!type) return 'default';
    const baseType = type.split('.')[0];
    return ['foundation', 'nonprofit'].includes(baseType) ? baseType : 'default';
  };
  
  const orgConfig = organization ? ORG_TYPE_CONFIGS[getOrgTypeFromType(organization.type)] : ORG_TYPE_CONFIGS.default;

  // Get active user session
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => setSession(session)
    );

    return () => subscription.unsubscribe();
  }, []);

  // Check user's membership in this organization
  useEffect(() => {
    const checkMembership = async () => {
      if (!session?.user?.id || !organization?.id) {
        setUserMembership(null);
        return;
      }

      try {
        const { data: membership } = await supabase
          .from('organization_memberships')
          .select('role, joined_at')
          .eq('organization_id', organization.id)
          .eq('profile_id', session.user.id)
          .maybeSingle();

        setUserMembership(membership);
      } catch (error) {
        console.error('Error checking membership:', error);
        setUserMembership(null);
      }
    };

    checkMembership();
  }, [session?.user?.id, organization?.id]);

  // Load organization data
  const loadOrganization = useCallback(async () => {
    if (!slug) {
      setError("Organization identifier is required");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Determine if slug is numeric (ID) or text (slug)
      const isNumeric = /^\d+$/.test(slug);
      const query = supabase
        .from('organizations')
        .select('*')
        .single();
      
      if (isNumeric) {
        query.eq('id', parseInt(slug, 10));
      } else {
        query.eq('slug', slug);
      }

      const { data: orgData, error: orgError } = await query;

      if (orgError) throw orgError;
      if (!orgData) throw new Error("Organization not found");

      setOrganization(orgData);
      
      // NEW: Load organization posts for batched data
      const { data: postsData, error: postsError } = await supabase
        .from('organization_posts')
        .select('*')
        .eq('organization_id', orgData.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!postsError && postsData) {
        setOrganizationPosts(postsData);
        // Load batched data for organization posts
        loadPostsPageData(postsData);
      }

    } catch (err) {
      console.error('Error loading organization:', err);
      setError(err.message || 'Failed to load organization');
    } finally {
      setLoading(false);
    }
  }, [slug, loadPostsPageData]);

  // Initial load
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      loadOrganization();
    }
  }, [loadOrganization]);

  // Clear cache when organization changes
  useEffect(() => {
    return () => clearPageData();
  }, [clearPageData, organization?.id]);

  // Handle organization updates (for edit mode)
  const handleUpdateOrganization = useCallback((updatedData) => {
    setOrganization(prev => ({ ...prev, ...updatedData }));
  }, []);

  // Tab management
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['home', 'team', 'northstar', 'programs', 'photos', 'grants'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = useCallback((newTab) => {
    setActiveTab(newTab);
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('tab', newTab);
    setSearchParams(newSearchParams, { replace: true });
  }, [searchParams, setSearchParams]);

  // Get available tabs based on organization type and permissions
  const getTabConfiguration = useCallback(() => {
    if (!organization) return [];

    const canEdit = userMembership && hasPermission(userMembership.role, PERMISSIONS.EDIT_ORGANIZATION_PROFILE);
    const hasGrants = organization.grants && organization.grants.length > 0;

    const tabs = [
      { id: 'home', label: 'Overview', available: true },
      { id: 'team', label: 'Team', available: true },
      { id: 'northstar', label: 'North Star', available: orgConfig.showNorthStar },
      { id: 'programs', label: 'Programs', available: orgConfig.showPrograms },
      { id: 'photos', label: 'Photos', available: orgConfig.showPhotos },
      { id: 'grants', label: 'Grants', available: hasGrants }
    ];

    return tabs.filter(tab => tab.available);
  }, [organization, orgConfig, userMembership]);

  // Render active tab content with pageData
  const renderActiveTab = () => {
    if (!organization) return null;

    // Common props passed to all tab components - INCLUDING pageData
    const commonProps = {
      organization,
      userMembership,
      session,
      onUpdate: handleUpdateOrganization,
      pageData, // NEW: Pass pageData to all tab components
      organizationPosts // NEW: Pass organization posts
    };

    switch (activeTab) {
      case 'home': return isEditMode ? 
        <EditableOrganizationHome {...commonProps} /> : <OrganizationHome {...commonProps} />;
      case 'team': return <OrganizationTeam {...commonProps} />;
      case 'northstar': return <OrganizationNorthStar {...commonProps} isEditMode={isEditMode} />;
      case 'programs': return isEditMode ? 
        <EditableOrganizationPrograms {...commonProps} /> : <OrganizationPrograms {...commonProps} isEditMode={isEditMode} />;
      case 'photos': return isEditMode ? 
        <EditableOrganizationPhotos {...commonProps} /> : <OrganizationPhotos {...commonProps} />;
      case 'grants': return <OrganizationGrantsFixed {...commonProps} />;
      default: return <PlaceholderContent contentType={activeTab} organizationType={organization.type} />;
    }
  };

  if (loading) return (
    <PublicPageLayout>
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-slate-500">Loading organization...</span>
      </div>
    </PublicPageLayout>
  );
  
  if (error || !organization) return (
    <PublicPageLayout>
      <div className="text-center py-20">
        <p className="text-red-600">{error || "Organization not found."}</p>
      </div>
    </PublicPageLayout>
  );
  
  return (
    <PublicPageLayout bgColor="bg-slate-50">
      {isEditMode ? (
        <EditableOrganizationHeader 
          organization={organization}
          isFollowing={isFollowing}
          followersCount={followersCount}
          isBookmarked={isBookmarked}
          bookmarksCount={bookmarksCount}
          onFollow={toggleFollow}
          onBookmark={toggleBookmark}
          config={orgConfig}
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          tabs={getTabConfiguration()}
          userMembership={userMembership}
          session={session}
          onUpdate={handleUpdateOrganization}
        />
      ) : (
        <OrganizationHeader 
          organization={organization}
          isFollowing={isFollowing}
          followersCount={followersCount}
          isBookmarked={isBookmarked}
          bookmarksCount={bookmarksCount}
          onFollow={toggleFollow}
          onBookmark={toggleBookmark}
          config={orgConfig}
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          tabs={getTabConfiguration()}
          userMembership={userMembership}
          session={session}
          showBanner={true}
        />
      )}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="min-h-screen py-8">
            {renderActiveTab()}
          </div>
        </div>
      </div>
    </PublicPageLayout>
  );
};

export default OrganizationProfilePage;