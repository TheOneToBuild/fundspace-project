// src/pages/OrganizationProfilePage.jsx - Fixed to allow all organization types to edit
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';

// Import safe membership queries
import { getUserMembershipSafe } from '../utils/membershipQueries.js';

// Shared Components
import PublicPageLayout from '../components/PublicPageLayout.jsx';
import EditableOrganizationHeader from '../components/organization-profile/EditableOrganizationHeader.jsx';
import OrganizationHeader from '../components/organization-profile/OrganizationHeader.jsx';

// Regular Components
import OrganizationHome from '../components/organization-profile/OrganizationHome.jsx';
import OrganizationTeam from '../components/organization-profile/OrganizationTeam.jsx';

// Editable Components
import EditableOrganizationHome from '../components/organization-profile/EditableOrganizationHome.jsx';
import EditableOrganizationPhotos from '../components/organization-profile/EditableOrganizationPhotos.jsx';

// New Components for Template Design
import OrganizationNorthStar from '../components/organization-profile/OrganizationNorthStar.jsx';
import OrganizationPhotos from '../components/organization-profile/OrganizationPhotos.jsx';
import OrganizationGrantsFixed from '../components/organization-profile/OrganizationGrantsFixed.jsx';

// Hooks
import { useOrganizationSocial } from '../hooks/useOrganizationSocial.js';
import { hasPermission, PERMISSIONS } from '../utils/organizationPermissions.js';

// Organization type configurations for different layouts - FIXED: All types can edit
const ORG_TYPE_CONFIGS = {
  foundation: {
    headerStyle: 'foundation',
    showNorthStar: true,
    showPhotos: true,
    primaryGradient: 'from-purple-500 to-indigo-600'
  },
  nonprofit: {
    headerStyle: 'nonprofit',
    showNorthStar: true,  // ✅ NOW ENABLED for nonprofits
    showPhotos: true,
    primaryGradient: 'from-green-500 to-emerald-600'
  },
  healthcare: {
    headerStyle: 'healthcare',
    showNorthStar: true,  // ✅ NOW ENABLED for healthcare
    showPhotos: true,
    primaryGradient: 'from-red-500 to-pink-600'
  },
  education: {
    headerStyle: 'education',
    showNorthStar: true,  // ✅ NOW ENABLED for education
    showPhotos: true,
    primaryGradient: 'from-yellow-500 to-orange-600'
  },
  government: {
    headerStyle: 'government',
    showNorthStar: true,  // ✅ NOW ENABLED for government
    showPhotos: true,
    primaryGradient: 'from-indigo-500 to-blue-600'
  },
  'for-profit': {
    headerStyle: 'for-profit',
    showNorthStar: true,  // ✅ NOW ENABLED for for-profit
    showPhotos: true,
    primaryGradient: 'from-purple-500 to-pink-600'
  },
  forprofit: {
    headerStyle: 'forprofit',
    showNorthStar: true,  // ✅ NOW ENABLED for forprofit
    showPhotos: true,
    primaryGradient: 'from-purple-500 to-pink-600'
  },
  religious: {
    headerStyle: 'religious',
    showNorthStar: true,  // ✅ NOW ENABLED for religious
    showPhotos: true,
    primaryGradient: 'from-pink-500 to-rose-600'
  },
  international: {
    headerStyle: 'international',
    showNorthStar: true,  // ✅ NOW ENABLED for international
    showPhotos: true,
    primaryGradient: 'from-teal-500 to-cyan-600'
  },
  default: {
    headerStyle: 'default',
    showNorthStar: true,  // ✅ NOW ENABLED for all other types
    showPhotos: true,
    primaryGradient: 'from-slate-500 to-slate-600'
  }
};

// Temporary placeholder component for type-specific content
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
  
  // Check if we're in edit mode
  const isEditMode = searchParams.get('edit') === 'true';
  
  // Core States
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  
  // Content States
  const [organizationPosts, setOrganizationPosts] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [typeSpecificData, setTypeSpecificData] = useState({});
  const [userMembership, setUserMembership] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [hasGrants, setHasGrants] = useState(false);

  // Get organization type configuration
  const orgConfig = ORG_TYPE_CONFIGS[organization?.type] || ORG_TYPE_CONFIGS.default;

  // Get user session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  // Social Features
  const { 
    isFollowing, 
    followersCount, 
    isBookmarked, 
    bookmarksCount, 
    toggleFollow, 
    toggleBookmark 
  } = useOrganizationSocial(organization?.id, session?.user?.id);

  // Track profile views - Use useRef to prevent re-runs on social state changes
  const hasTrackedView = useRef(false);
  useEffect(() => {
    if (organization?.id && !hasTrackedView.current) {
      hasTrackedView.current = true;
      const trackView = async () => {
        try {
          const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const referrer = document.referrer;
          
          const { error } = await supabase
            .from('profile_views')
            .insert({
              organization_id: organization.id,
              viewer_id: session?.user?.id || null,
              session_id: sessionId,
              referrer: referrer || null,
            });

          if (error) {
            console.debug('View tracking error (expected if table missing):', error);
          }
        } catch (error) {
          console.debug('View tracking error (non-critical):', error);
        }
      };
      
      // Track after a delay
      setTimeout(trackView, 2000);
    }
  }, [organization?.id]);

  // Get tab configuration based on organization type
  const getTabConfiguration = (orgType) => {
    const baseTabs = [
      { id: 'home', label: 'Home', icon: 'Globe' }
    ];

    // Add North Star for ALL organization types (now enabled for all)
    if (orgConfig.showNorthStar) {
      baseTabs.push({ id: 'northstar', label: 'North Star', icon: 'Target' });
    }

    // Add Programs right after North Star
    const typeSpecificTabs = getTypeSpecificTabs(orgType);
    const programsTab = typeSpecificTabs.find(tab => tab.id === 'programs');
    if (programsTab) {
      baseTabs.push(programsTab);
    }

    // Add Photos tab if enabled (now enabled for all types)
    if (orgConfig.showPhotos) {
      baseTabs.push({ id: 'photos', label: 'Photos', icon: 'Camera' });
    }

    // Add standard tabs
    baseTabs.push(
      { id: 'team', label: 'Team', icon: 'Users' }
    );

    // Add remaining type-specific tabs (excluding programs which we already added)
    const remainingTabs = typeSpecificTabs.filter(tab => tab.id !== 'programs');
    return [...baseTabs, ...remainingTabs];
  };

  const getTypeSpecificTabs = (orgType) => {
    const tabs = [];
    
    switch (orgType) {
      case 'foundation':
        tabs.push(
          { id: 'programs', label: 'Programs', icon: 'Rocket' },
          { id: 'grantees', label: 'Grantees', icon: 'HandHeart' }
        );
        break;
      
      case 'nonprofit':
        tabs.push(
          { id: 'programs', label: 'Programs', icon: 'Rocket' },
          { id: 'kudos', label: 'Community Kudos', icon: 'Star' }
        );
        break;
      
      case 'healthcare':
        tabs.push(
          { id: 'services', label: 'Services', icon: 'Heart' },
          { id: 'specialties', label: 'Specialties', icon: 'Award' }
        );
        break;
      
      case 'education':
        tabs.push(
          { id: 'programs', label: 'Academic Programs', icon: 'BookOpen' },
          { id: 'research', label: 'Research', icon: 'Microscope' }
        );
        break;
      
      case 'government':
        tabs.push(
          { id: 'services', label: 'Public Services', icon: 'Building2' },
          { id: 'initiatives', label: 'Initiatives', icon: 'Flag' }
        );
        break;
      
      case 'religious':
        tabs.push(
          { id: 'services', label: 'Services', icon: 'Heart' },
          { id: 'community', label: 'Community', icon: 'Users' }
        );
        break;
      
      case 'international':
        tabs.push(
          { id: 'programs', label: 'Programs', icon: 'Rocket' },
          { id: 'regions', label: 'Regions', icon: 'Globe' }
        );
        break;
      
      case 'for-profit':
      case 'forprofit':
        tabs.push(
          { id: 'services', label: 'Services', icon: 'Briefcase' },
          { id: 'products', label: 'Products', icon: 'Star' }
        );
        break;
      
      default:
        tabs.push(
          { id: 'services', label: 'Services', icon: 'Briefcase' }
        );
        break;
    }

    // Add Grants tab for ANY organization type that has grants
    if (hasGrants) {
      tabs.push({ id: 'grants', label: 'Grants', icon: 'DollarSign' });
    }

    return tabs;
  };

  // Function to refresh organization data
  const refreshOrganizationData = async (updatedOrg = null) => {
    if (updatedOrg) {
      setOrganization(updatedOrg);
    } else {
      // Re-fetch from database
      await fetchOrganizationData();
    }
  };

  // FIXED: Fetch organization data with separate queries to avoid joins
  const fetchOrganizationData = useCallback(async () => {
    if (!slug) return;

    setLoading(true);
    setError(null);

    try {
      // STEP 1: Get basic organization data (no joins)
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', slug)
        .single();

      if (orgError) throw orgError;

      // STEP 2: Get organization categories separately (safe approach)
      let focusAreas = [];
      if (orgData?.id) {
        try {
          // Try the join approach first
          const { data: categoryData, error: categoryError } = await supabase
            .from('organization_categories')
            .select('category_id, categories(name)')
            .eq('organization_id', orgData.id);

          if (categoryError) {
            console.warn('Categories join failed, trying fallback:', categoryError);
            // Fallback: get category IDs then lookup names
            const { data: categoryIds } = await supabase
              .from('organization_categories')
              .select('category_id')
              .eq('organization_id', orgData.id);

            if (categoryIds && categoryIds.length > 0) {
              const { data: categoryNames } = await supabase
                .from('categories')
                .select('name')
                .in('id', categoryIds.map(c => c.category_id));

              focusAreas = categoryNames?.map(c => c.name) || [];
            }
          } else {
            focusAreas = categoryData?.map(item => item.categories?.name).filter(Boolean) || [];
          }
        } catch (categoryError) {
          console.warn('Error fetching categories (all approaches failed):', categoryError);
          focusAreas = [];
        }
      }

      // STEP 3: Get organization funding locations separately (safe approach)
      let fundingLocations = [];
      if (orgData?.id) {
        try {
          // Try the join approach first
          const { data: locationData, error: locationError } = await supabase
            .from('organization_funding_locations')
            .select('location_id, locations(name)')
            .eq('organization_id', orgData.id);

          if (locationError) {
            console.warn('Locations join failed, trying fallback:', locationError);
            // Fallback: get location IDs then lookup names
            const { data: locationIds } = await supabase
              .from('organization_funding_locations')
              .select('location_id')
              .eq('organization_id', orgData.id);

            if (locationIds && locationIds.length > 0) {
              const { data: locationNames } = await supabase
                .from('locations')
                .select('name')
                .in('id', locationIds.map(l => l.location_id));

              fundingLocations = locationNames?.map(l => l.name) || [];
            }
          } else {
            fundingLocations = locationData?.map(item => item.locations?.name).filter(Boolean) || [];
          }
        } catch (locationError) {
          console.warn('Error fetching locations (all approaches failed):', locationError);
          fundingLocations = [];
        }
      }

      // STEP 4: Get organization photos
      let photosData = [];
      if (orgData?.id) {
        try {
          const { data: photoResults } = await supabase
            .from('organization_photos')
            .select('*')
            .eq('organization_id', orgData.id)
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: false });

          photosData = photoResults?.map(photo => ({
            id: photo.id,
            url: photo.image_url,
            caption: photo.caption,
            alt_text: photo.alt_text,
            is_featured: photo.is_featured
          })) || [];
        } catch (photoError) {
          console.warn('Error fetching photos:', photoError);
        }
      }

      // Combine all data
      const completeOrgData = {
        ...orgData,
        focusAreas,
        fundingLocations
      };

      setOrganization(completeOrgData);
      setPhotos(photosData);

      // STEP 5: Get additional data if org exists
      if (orgData?.id) {
        // Check for grants
        try {
          const { data: grantsData } = await supabase
            .from('grants')
            .select('id')
            .eq('organization_id', orgData.id)
            .limit(1);

          setHasGrants(grantsData && grantsData.length > 0);
        } catch (grantsError) {
          console.warn('Error checking grants:', grantsError);
        }

        // Get organization posts
        try {
          const { data: postsData } = await supabase
            .from('organization_posts')
            .select('*')
            .eq('organization_id', orgData.id)
            .eq('organization_type', orgData.type)
            .order('created_at', { ascending: false })
            .limit(10);

          setOrganizationPosts(postsData || []);
        } catch (postsError) {
          console.warn('Error fetching posts:', postsError);
        }

        // FIXED: Get team members using safe cache approach
        try {
          const { data: membershipData } = await supabase
            .from('organization_membership_cache')
            .select('profile_id')
            .eq('organization_id', orgData.id)
            .eq('is_public', true);

          if (membershipData && membershipData.length > 0) {
            const profileIds = membershipData.map(m => m.profile_id);
            
            const { data: profilesData } = await supabase
              .from('profiles')
              .select(`
                id,
                full_name,
                avatar_url,
                title,
                bio,
                location,
                is_omega_admin,
                linkedin_url,
                twitter_url,
                website_url
              `)
              .in('id', profileIds);

            // Combine membership and profile data
            const teamData = membershipData.map(membership => {
              const profile = profilesData?.find(p => p.id === membership.profile_id);
              return profile ? {
                profile_id: membership.profile_id,
                organization_id: orgData.id,
                is_public: true,
                profiles: profile
              } : null;
            }).filter(Boolean);

            setTeamMembers(teamData);
          }
        } catch (teamError) {
          console.warn('Error fetching team members:', teamError);
          // Fallback: try to get memberships without cache
          try {
            const { data: fallbackMemberships } = await supabase
              .from('organization_memberships')
              .select(`
                *,
                profiles (
                  id,
                  full_name,
                  avatar_url,
                  title,
                  bio,
                  location,
                  is_omega_admin,
                  linkedin_url,
                  twitter_url,
                  website_url
                )
              `)
              .eq('organization_id', orgData.id)
              .eq('is_public', true)
              .order('joined_at', { ascending: false });

            setTeamMembers(fallbackMemberships || []);
          } catch (fallbackError) {
            console.warn('Fallback team fetch also failed:', fallbackError);
            setTeamMembers([]);
          }
        }

        // FIXED: Get user membership using safe approach
        if (session?.user?.id) {
          try {
            const membershipData = await getUserMembershipSafe(session.user.id);
            if (membershipData && membershipData.organization_id === orgData.id) {
              setUserMembership({
                organization_id: orgData.id,
                profile_id: session.user.id,
                role: membershipData.role,
                is_public: membershipData.is_public
              });
            } else {
              setUserMembership(null);
            }
          } catch (membershipError) {
            console.warn('Error fetching user membership:', membershipError);
            setUserMembership(null);
          }
        }

        setTypeSpecificData({});
      }
    } catch (err) {
      console.error('Error fetching organization data:', err);
      setError('Could not load organization profile.');
    } finally {
      setLoading(false);
    }
  }, [slug, session?.user?.id]);

  useEffect(() => {
    fetchOrganizationData();
  }, [fetchOrganizationData]);

  // Render active tab content
  const renderActiveTab = () => {
    const props = {
      organization,
      organizationPosts,
      teamMembers,
      typeSpecificData,
      session,
      userMembership,
      onPostDelete: handleDeletePost,
      photos,
      onUpdate: refreshOrganizationData, // Add this for editable components
      activeTab, // Add these for navigation
      setActiveTab
    };

    // Shared tabs - Use editable versions when in edit mode
    switch (activeTab) {
      case 'home':
        return isEditMode ? 
          <EditableOrganizationHome {...props} /> : 
          <OrganizationHome {...props} />;
      case 'team':
        return <OrganizationTeam {...props} userMembership={userMembership} session={session} />;
      case 'northstar':
        return <OrganizationNorthStar {...props} userMembership={userMembership} session={session} isEditMode={isEditMode} />;
      case 'photos':
        return isEditMode ? 
          <EditableOrganizationPhotos {...props} userMembership={userMembership} session={session} /> :
          <OrganizationPhotos {...props} userMembership={userMembership} session={session} />;
    }

    // Type-specific tabs - use placeholders for now except grants
    switch (organization?.type) {
      case 'foundation':
        switch (activeTab) {
          case 'programs':
            return <PlaceholderContent contentType="Programs" organizationType="foundation" />;
          case 'grantees':
            return <PlaceholderContent contentType="Grantees" organizationType="foundation" />;
        }
        break;
      
      case 'nonprofit':
        switch (activeTab) {
          case 'programs':
            return <PlaceholderContent contentType="Programs" organizationType="nonprofit" />;
          case 'kudos':
            return <PlaceholderContent contentType="Community Kudos" organizationType="nonprofit" />;
        }
        break;
      
      case 'healthcare':
        switch (activeTab) {
          case 'services':
            return <PlaceholderContent contentType="Services" organizationType="healthcare" />;
          case 'specialties':
            return <PlaceholderContent contentType="Specialties" organizationType="healthcare" />;
        }
        break;
      
      case 'education':
        switch (activeTab) {
          case 'programs':
            return <PlaceholderContent contentType="Academic Programs" organizationType="education" />;
          case 'research':
            return <PlaceholderContent contentType="Research" organizationType="education" />;
        }
        break;

      case 'government':
        switch (activeTab) {
          case 'services':
            return <PlaceholderContent contentType="Public Services" organizationType="government" />;
          case 'initiatives':
            return <PlaceholderContent contentType="Initiatives" organizationType="government" />;
        }
        break;

      case 'religious':
        switch (activeTab) {
          case 'services':
            return <PlaceholderContent contentType="Services" organizationType="religious" />;
          case 'community':
            return <PlaceholderContent contentType="Community" organizationType="religious" />;
        }
        break;

      case 'international':
        switch (activeTab) {
          case 'programs':
            return <PlaceholderContent contentType="Programs" organizationType="international" />;
          case 'regions':
            return <PlaceholderContent contentType="Regions" organizationType="international" />;
        }
        break;

      case 'for-profit':
      case 'forprofit':
        switch (activeTab) {
          case 'services':
            return <PlaceholderContent contentType="Services" organizationType="for-profit" />;
          case 'products':
            return <PlaceholderContent contentType="Products" organizationType="for-profit" />;
        }
        break;
    }

    // Handle grants tab for ANY organization type that has grants
    if (activeTab === 'grants' && hasGrants) {
      return <OrganizationGrantsFixed organization={organization} userMembership={userMembership} session={session} />;
    }

    // Fallback
    return isEditMode ? 
      <EditableOrganizationHome {...props} /> : 
      <OrganizationHome {...props} />;
  };

  const handleDeletePost = async (postId) => {
    if (!organization || !session) return;
    
    const { error } = await supabase
      .from('organization_posts')
      .delete()
      .eq('id', postId)
      .eq('organization_id', organization.id);
      
    if (!error) {
      setOrganizationPosts(prev => prev.filter(p => p.id !== postId));
    }
  };

  const handleFollow = useCallback(() => {
    if (!session) {
      navigate('/login');
      return;
    }
    toggleFollow();
  }, [session, navigate, toggleFollow]);

  const handleBookmark = useCallback(() => {
    if (!session) {
      navigate('/login');
      return;
    }
    toggleBookmark();
  }, [session, navigate, toggleBookmark]);

  if (loading) {
    return (
      <PublicPageLayout bgColor="bg-slate-50">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-slate-500">Loading organization...</span>
        </div>
      </PublicPageLayout>
    );
  }

  if (error || !organization) {
    return (
      <PublicPageLayout bgColor="bg-slate-50">
        <div className="text-center py-20">
          <p className="text-red-600">{error || "Organization not found."}</p>
        </div>
      </PublicPageLayout>
    );
  }

  const tabConfig = getTabConfiguration(organization.type);

  return (
    <PublicPageLayout bgColor="bg-slate-50">
      {/* Header - Use EditableOrganizationHeader if in edit mode, regular OrganizationHeader otherwise */}
      {isEditMode ? (
        <EditableOrganizationHeader 
          organization={organization}
          isFollowing={isFollowing}
          followersCount={followersCount}
          isBookmarked={isBookmarked}
          bookmarksCount={bookmarksCount}
          onFollow={handleFollow}
          onBookmark={handleBookmark}
          config={orgConfig}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tabs={tabConfig}
          userMembership={userMembership}
          session={session}
          onUpdate={refreshOrganizationData}
        />
      ) : (
        <OrganizationHeader 
          organization={organization}
          isFollowing={isFollowing}
          followersCount={followersCount}
          isBookmarked={isBookmarked}
          bookmarksCount={bookmarksCount}
          onFollow={handleFollow}
          onBookmark={handleBookmark}
          config={orgConfig}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tabs={tabConfig}
          userMembership={userMembership}
          session={session}
          showBanner={true}
        />
      )}
      
      {/* Main Content */}
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