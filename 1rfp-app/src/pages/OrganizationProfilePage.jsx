// src/pages/OrganizationProfilePage.jsx - Refactored for Real-Time State Updates
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';

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

// Hooks and Utilities
import { useOrganizationSocial } from '../hooks/useOrganizationSocial.js';
import { hasPermission, PERMISSIONS } from '../utils/organizationPermissions.js';

const ORG_TYPE_CONFIGS = {
  foundation: {
    headerStyle: 'foundation',
    showNorthStar: true,
    showPhotos: true,
    primaryGradient: 'from-purple-500 to-indigo-600'
  },
  nonprofit: {
    headerStyle: 'nonprofit',
    showNorthStar: true,
    showPhotos: true,
    primaryGradient: 'from-green-500 to-emerald-600'
  },
  default: {
    headerStyle: 'default',
    showNorthStar: true,
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
  const [searchParams] = useSearchParams();
  const isEditMode = searchParams.get('edit') === 'true';

  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [organizationPosts, setOrganizationPosts] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [userMembership, setUserMembership] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [hasGrants, setHasGrants] = useState(false);

  const orgConfig = ORG_TYPE_CONFIGS[organization?.type] || ORG_TYPE_CONFIGS.default;

  // Function to handle state updates from child components
  const handleUpdateOrganization = (updatedData) => {
    setOrganization(prevOrg => ({ ...prevOrg, ...updatedData }));
  };

  useEffect(() => {
    const getSessionAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      if (session?.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(profileData);
      }
    };
    getSessionAndProfile();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setProfile(session?.user ? profile : null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchOrganizationData = async () => {
      if (!slug) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase.from('organizations').select('*').eq('slug', slug).single();
        if (error) throw error;
        
        const { data: categoryData } = await supabase
          .from('organization_categories')
          .select('categories(name)')
          .eq('organization_id', data.id);
        
        const focusAreas = categoryData?.map(item => item.categories?.name).filter(Boolean) || [];
        
        setOrganization({ ...data, focusAreas });

      } catch (err) {
        setError("Could not load organization profile.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrganizationData();
  }, [slug]);

  useEffect(() => {
    if (!organization?.id) return;

    const checkUserMembership = async () => {
      if (!session?.user?.id) return;
      const { data } = await supabase
        .from('organization_memberships')
        .select('*')
        .eq('profile_id', session.user.id)
        .eq('organization_id', organization.id)
        .maybeSingle();
      setUserMembership(data);
    };

    const fetchSecondaryData = async () => {
        const { data: photoData } = await supabase.from('organization_photos').select('*').eq('organization_id', organization.id).order('display_order', { ascending: true });
        setPhotos(photoData || []);
        
        const { data: teamData } = await supabase.from('organization_memberships').select('*, profiles(*)').eq('organization_id', organization.id).eq('is_public', true);
        setTeamMembers(teamData || []);

        const { count } = await supabase.from('grants').select('*', { count: 'exact', head: true }).eq('organization_id', organization.id);
        setHasGrants(count > 0);
    };

    checkUserMembership();
    fetchSecondaryData();
  }, [organization?.id, session?.user?.id]);

  const { isFollowing, followersCount, isBookmarked, bookmarksCount, toggleFollow, toggleBookmark } = useOrganizationSocial(organization?.id, session?.user?.id);
  
  const getTabConfiguration = () => {
    const baseTabs = [{ id: 'home', label: 'Home', icon: 'Globe' }];
    if (orgConfig.showNorthStar) baseTabs.push({ id: 'northstar', label: 'North Star', icon: 'Target' });
    if (orgConfig.showPhotos) baseTabs.push({ id: 'photos', label: 'Photos', icon: 'Camera' });
    baseTabs.push({ id: 'team', label: 'Team', icon: 'Users' });
    if (hasGrants) baseTabs.push({ id: 'grants', label: 'Grants', icon: 'DollarSign' });
    return baseTabs;
  };

  const renderActiveTab = () => {
    const props = {
      organization,
      organizationPosts,
      teamMembers,
      session,
      userMembership,
      photos,
      onUpdate: handleUpdateOrganization,
      activeTab,
      setActiveTab,
      currentUserProfile: profile
    };

    switch (activeTab) {
      case 'home': return isEditMode ? <EditableOrganizationHome {...props} /> : <OrganizationHome {...props} />;
      case 'team': return <OrganizationTeam {...props} />;
      case 'northstar': return <OrganizationNorthStar {...props} isEditMode={isEditMode} />;
      case 'photos': return isEditMode ? <EditableOrganizationPhotos {...props} /> : <OrganizationPhotos {...props} />;
      case 'grants': return hasGrants ? <OrganizationGrantsFixed {...props} /> : <PlaceholderContent contentType="Grants" />;
      default: return <PlaceholderContent contentType={activeTab} />;
    }
  };

  if (loading) return <PublicPageLayout><div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div><span className="ml-3 text-slate-500">Loading organization...</span></div></PublicPageLayout>;
  if (error || !organization) return <PublicPageLayout><div className="text-center py-20"><p className="text-red-600">{error || "Organization not found."}</p></div></PublicPageLayout>;
  
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
          setActiveTab={setActiveTab}
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
          setActiveTab={setActiveTab}
          tabs={getTabConfiguration()}
          userMembership={userMembership}
          session={session}
          showBanner={true}
        />
      )}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto"><div className="min-h-screen py-8">{renderActiveTab()}</div></div>
      </div>
    </PublicPageLayout>
  );
};

export default OrganizationProfilePage;