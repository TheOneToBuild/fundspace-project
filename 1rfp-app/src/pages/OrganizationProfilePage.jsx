// src/pages/OrganizationProfilePage.jsx - Updated to match template design
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

// Hooks
import { useOrganizationSocial } from '../hooks/useOrganizationSocial.js';
import { useProfileViewTracking } from '../hooks/useProfileViewTracking.js';

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

    // Add Impact tab for foundations and nonprofits
    if (orgConfig.showImpact) {
      baseTabs.push({ id: 'impact', label: 'Impact', icon: 'TrendingUp' });
    }

    // Add North Star for foundations only
    if (orgConfig.showNorthStar) {
      baseTabs.push({ id: 'northstar', label: 'North Star', icon: 'Target' });
    }

    // Add Photos if enabled
    if (orgConfig.showPhotos) {
      baseTabs.push({ id: 'photos', label: 'Photos', icon: 'Camera' });
    }

    // Add standard tabs
    baseTabs.push(
      { id: 'overview', label: 'Overview', icon: 'Building' },
      { id: 'team', label: 'Team', icon: 'Users' }
    );

    // Add type-specific tabs
    const typeSpecificTabs = getTypeSpecificTabs(orgType);
    return [...baseTabs, ...typeSpecificTabs];
  };

  const getTypeSpecificTabs = (orgType) => {
    switch (orgType) {
      case 'foundation':
        return [
          { id: 'programs', label: 'Programs', icon: 'Rocket' },
          { id: 'grants', label: 'Grants', icon: 'DollarSign' },
          { id: 'grantees', label: 'Grantees', icon: 'HandHeart' }
        ];
      
      case 'nonprofit':
        return [
          { id: 'programs', label: 'Programs', icon: 'Rocket' },
          { id: 'kudos', label: 'Community Kudos', icon: 'Star' }
        ];
      
      case 'healthcare':
        return [
          { id: 'services', label: 'Services', icon: 'Heart' },
          { id: 'specialties', label: 'Specialties', icon: 'Award' }
        ];
      
      case 'education':
        return [
          { id: 'programs', label: 'Academic Programs', icon: 'BookOpen' },
          { id: 'research', label: 'Research', icon: 'Microscope' }
        ];
      
      case 'government':
        return [
          { id: 'services', label: 'Public Services', icon: 'Building2' },
          { id: 'initiatives', label: 'Initiatives', icon: 'Flag' }
        ];
      
      default:
        return [
          { id: 'services', label: 'Services', icon: 'Briefcase' }
        ];
    }
  };

  // Fetch organization data
  useEffect(() => {
    const fetchOrganizationData = async () => {
      if (!slug) return;
      
      setLoading(true);
      setError(null);

      try {
        // Get organization by slug
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
        
        // Format organization data
        if (orgData) {
          orgData.focusAreas = orgData.organization_categories?.map(oc => oc.categories.name) || [];
          orgData.fundingLocations = orgData.organization_funding_locations?.map(ol => ol.locations.name) || [];
          
          // Mock North Star data for foundations
          if (orgData.type === 'foundation') {
            orgData.northStar = {
              title: "Our North Star",
              description: "Our strategic vision guides every decision, partnership, and grant we make.",
              vision: {
                title: "Vision 2030",
                text: "Creating lasting impact through strategic philanthropy and community partnerships."
              },
              focus: {
                title: "Strategic Focus", 
                text: "Catalyzing systemic change through collaborative partnerships and innovative funding models."
              },
              priorities: [
                { title: "Education Equity", text: "Closing opportunity gaps through innovative approaches" },
                { title: "Housing Stability", text: "Creating pathways to affordable, stable housing" },
                { title: "Climate Resilience", text: "Building community capacity for environmental challenges" }
              ]
            };
          }

          // Mock impact data
          orgData.impactData = {
            spotlights: [
              { 
                title: "Community Impact", 
                text: "Our focus on community development has created lasting change through strategic partnerships.",
                image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop" 
              }
            ],
            testimonials: [
              { 
                quote: "Their support was transformational for our organization and the communities we serve.",
                name: "Community Leader",
                title: "Executive Director",
                image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop" 
              }
            ]
          };

          // Fetch photos from database
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

        // Fetch related data in parallel
        if (orgData?.id) {
          const [postsRes, teamRes, membershipRes] = await Promise.all([
            // Organization Posts
            supabase
              .from('organization_posts')
              .select('*')
              .eq('organization_id', orgData.id)
              .eq('organization_type', orgData.type)
              .order('created_at', { ascending: false })
              .limit(10),
            
            // Team Members - Query organization_memberships directly
            supabase
              .from('organization_memberships')
              .select(`
                *,
                profiles (
                  id,
                  full_name,
                  avatar_url,
                  title,
                  is_omega_admin
                )
              `)
              .eq('organization_id', orgData.id)
              .eq('is_public', true)
              .order('joined_at', { ascending: false }),
            
            // Check user's membership if logged in
            session?.user?.id ? supabase
              .from('organization_memberships')
              .select('*')
              .eq('organization_id', orgData.id)
              .eq('profile_id', session.user.id)
              .single()
              .then(res => res).catch(() => ({ data: null }))
            : Promise.resolve({ data: null })
          ]);

          setOrganizationPosts(postsRes.data || []);
          setTeamMembers(teamRes.data || []);
          setUserMembership(membershipRes?.data || null);
          
          // For now, just set empty type-specific data
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
  }, [slug, session?.user?.id]); // Removed followersCount, bookmarksCount from dependencies

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
      case 'overview':
        return <OrganizationOverview {...props} />;
      case 'team':
        return <OrganizationTeam {...props} userMembership={userMembership} session={session} />;
      case 'impact':
        return <OrganizationImpact {...props} />;
      case 'northstar':
        return <OrganizationNorthStar {...props} />;
      case 'photos':
        return <OrganizationPhotos {...props} userMembership={userMembership} session={session} />;
    }

    // Type-specific tabs - use placeholders for now
    switch (organization?.type) {
      case 'foundation':
        switch (activeTab) {
          case 'programs':
            return <PlaceholderContent contentType="Programs" organizationType="foundation" />;
          case 'grants':
            return <PlaceholderContent contentType="Grants" organizationType="foundation" />;
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