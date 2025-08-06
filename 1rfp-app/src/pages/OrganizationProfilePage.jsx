// src/pages/OrganizationProfilePage.jsx - Updated to match template design with dynamic grants tab
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';

// Shared Components
import PublicPageLayout from '../components/PublicPageLayout.jsx';
import OrganizationHeader from '../components/organization-profile/OrganizationHeader.jsx';
import OrganizationTabs from '../components/organization-profile/OrganizationTabs.jsx';
import OrganizationHome from '../components/organization-profile/OrganizationHome.jsx';
import OrganizationOverview from '../components/organization-profile/OrganizationOverview.jsx';
import OrganizationTeam from '../components/organization-profile/OrganizationTeam.jsx';

// New Components for Template Design
import OrganizationImpact from '../components/organization-profile/OrganizationImpact.jsx';
import OrganizationNorthStar from '../components/organization-profile/OrganizationNorthStar.jsx';
import OrganizationPhotos from '../components/organization-profile/OrganizationPhotos.jsx';
import OrganizationGrantsFixed from '../components/organization-profile/OrganizationGrantsFixed.jsx';

// Hooks
import { useOrganizationSocial } from '../hooks/useOrganizationSocial.js';

// Organization type configurations for different layouts
const ORG_TYPE_CONFIGS = {
  foundation: {
    headerStyle: 'foundation', // Special header styling for foundations
    showNorthStar: true,
    showImpact: true,
    showPhotos: true,
    primaryGradient: 'from-purple-500 to-indigo-600'
  },
  nonprofit: {
    headerStyle: 'nonprofit',
    showNorthStar: false,
    showImpact: true,
    showPhotos: true,
    primaryGradient: 'from-green-500 to-emerald-600'
  },
  // Add other org types as needed
  default: {
    headerStyle: 'default',
    showNorthStar: false,
    showImpact: true,
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
  const [hasGrants, setHasGrants] = useState(false); // Track if organization has grants

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
      // Track view without using the hook that might cause re-renders
      const trackView = async () => {
        try {
          const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const referrer = document.referrer;
          
          await supabase
            .from('profile_views')
            .insert({
              organization_id: organization.id,
              viewer_id: session?.user?.id || null,
              session_id: sessionId,
              referrer: referrer || null,
            });
        } catch (error) {
          console.debug('View tracking error:', error);
        }
      };
      
      // Track after a delay
      setTimeout(trackView, 2000);
    }
  }, [organization?.id]); // Only depend on org ID, not session

  // Get tab configuration based on organization type
  const getTabConfiguration = (orgType) => {
    const baseTabs = [
      { id: 'home', label: 'Home', icon: 'Globe' }
    ];

    // Add North Star for foundations first (right after home)
    if (orgConfig.showNorthStar) {
      baseTabs.push({ id: 'northstar', label: 'North Star', icon: 'Target' });
    }

    // Add Impact tab for foundations and nonprofits
    if (orgConfig.showImpact) {
      baseTabs.push({ id: 'impact', label: 'Impact', icon: 'TrendingUp' });
    }

    // Add Action tab (formerly Photos) if enabled
    if (orgConfig.showPhotos) {
      baseTabs.push({ id: 'photos', label: 'Action', icon: 'Camera' });
    }

    // Add standard tabs
    baseTabs.push(
      { id: 'team', label: 'Team', icon: 'Users' }
    );

    // Add type-specific tabs
    const typeSpecificTabs = getTypeSpecificTabs(orgType);
    return [...baseTabs, ...typeSpecificTabs];
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

  // Fetch organization data
  useEffect(() => {
    const fetchOrganizationData = async () => {
      if (!slug) return;

      setLoading(true);
      setError(null);

      try {
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select(`
            *,
            organization_categories(categories(name)),
            organization_funding_locations(locations(name))
          `)
          .eq('slug', slug)
          .single();

        if (orgError) throw orgError;

        if (orgData) {
          orgData.focusAreas = orgData.organization_categories?.map(oc => oc.categories.name) || [];
          orgData.fundingLocations = orgData.organization_funding_locations?.map(ol => ol.locations.name) || [];

          const { data: photosData } = await supabase
            .from('organization_photos')
            .select('*')
            .eq('organization_id', orgData.id)
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: false });

          setPhotos(photosData?.map(photo => ({
            id: photo.id,
            url: photo.image_url,
            caption: photo.caption,
            alt_text: photo.alt_text,
            is_featured: photo.is_featured
          })) || []);
        }

        setOrganization(orgData);

        if (orgData?.id) {
          const { data: grantsData } = await supabase
            .from('grants')
            .select('id')
            .eq('organization_id', orgData.id)
            .limit(1);

          setHasGrants(grantsData && grantsData.length > 0);

          const [postsRes, teamRes, membershipRes] = await Promise.all([
            supabase
              .from('organization_posts')
              .select('*')
              .eq('organization_id', orgData.id)
              .eq('organization_type', orgData.type)
              .order('created_at', { ascending: false })
              .limit(10),
            supabase
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
              .order('joined_at', { ascending: false }),
            session?.user?.id
              ? supabase
                  .from('organization_memberships')
                  .select('*')
                  .eq('organization_id', orgData.id)
                  .eq('profile_id', session.user.id)
                  .single()
              : Promise.resolve({ data: null })
          ]);

          setOrganizationPosts(postsRes.data || []);
          setTeamMembers(teamRes.data || []);
          setUserMembership(membershipRes?.data || null);
          setTypeSpecificData({});
        }
      } catch (err) {
        console.error('Error fetching organization data:', err);
        setError('Could not load organization profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizationData();
  }, [slug, session?.user?.id]);

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
      photos
    };

    // Shared tabs
    switch (activeTab) {
      case 'home':
        return <OrganizationHome {...props} />;
      case 'team':
        return <OrganizationTeam {...props} userMembership={userMembership} session={session} />;
      case 'impact':
        return <OrganizationImpact {...props} />;
      case 'northstar':
        return <OrganizationNorthStar {...props} userMembership={userMembership} session={session} />;
      case 'photos':
        return <OrganizationPhotos {...props} userMembership={userMembership} session={session} />;
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
    }

    // Handle grants tab for ANY organization type that has grants
    if (activeTab === 'grants' && hasGrants) {
      return <OrganizationGrantsFixed organization={organization} userMembership={userMembership} session={session} />;
    }

    // Fallback
    return <OrganizationHome {...props} />;
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
      {/* Banner Image - New for template design */}
      <div className="relative h-80 bg-slate-200 overflow-hidden">
        {organization.banner_image_url ? (
          <img 
            src={organization.banner_image_url} 
            alt="Organization banner" 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-white via-stone-50 to-stone-100"></div>
        )}
      </div>

      {/* Header with integrated tabs */}
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
      />
      
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