// src/pages/OrganizationProfilePage.jsx - Fixed version with existing components only
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';

// Shared Components
import PublicPageLayout from '../components/PublicPageLayout.jsx';
import OrganizationHeader from '../components/organization-profile/OrganizationHeader.jsx';
import OrganizationTabs from '../components/organization-profile/OrganizationTabs.jsx';
import OrganizationHome from '../components/organization-profile/OrganizationHome.jsx';
import OrganizationOverview from '../components/organization-profile/OrganizationOverview.jsx';
import OrganizationTeam from '../components/organization-profile/OrganizationTeam.jsx';

// Hooks
import { useOrganizationSocial } from '../hooks/useOrganizationSocial.js';
import { useProfileViewTracking } from '../hooks/useProfileViewTracking.js';

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

  // Track profile views
  useProfileViewTracking(organization?.id, session?.user?.id);

  // Get tab configuration based on organization type
  const getTabConfiguration = (orgType) => {
    const baseTabs = [
      { id: 'home', label: 'Home', icon: 'Globe' },
      { id: 'overview', label: 'Overview', icon: 'Building' },
      { id: 'team', label: 'Team', icon: 'Users' }
    ];

    const typeSpecificTabs = getTypeSpecificTabs(orgType);
    return [...baseTabs, ...typeSpecificTabs];
  };

  const getTypeSpecificTabs = (orgType) => {
    switch (orgType) {
      case 'nonprofit':
        return [
          { id: 'programs', label: 'Programs', icon: 'Rocket' },
          { id: 'impact', label: 'Impact Stories', icon: 'TrendingUp' },
          { id: 'kudos', label: 'Community Kudos', icon: 'Star' }
        ];
      
      case 'foundation':
      case 'funder':
        return [
          { id: 'grants', label: 'Grants', icon: 'DollarSign' },
          { id: 'grantees', label: 'Grantees', icon: 'HandHeart' },
          { id: 'impact', label: 'Impact Metrics', icon: 'BarChart3' }
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
            
            // Team Members - using RPC function if it exists, otherwise empty array
            supabase.rpc('get_organization_members', { 
              organization_id_param: orgData.id, 
              organization_type_param: orgData.type 
            }).then(res => res).catch(() => ({ data: [] })),
            
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
      onPostDelete: handleDeletePost
    };

    // Shared tabs
    switch (activeTab) {
      case 'home':
        return <OrganizationHome {...props} />;
      case 'overview':
        return <OrganizationOverview {...props} />;
      case 'team':
        return <OrganizationTeam {...props} />;
    }

    // Type-specific tabs - use placeholders for now
    switch (organization?.type) {
      case 'nonprofit':
        switch (activeTab) {
          case 'programs':
            return <PlaceholderContent contentType="Programs" organizationType="nonprofit" />;
          case 'impact':
            return <PlaceholderContent contentType="Impact Stories" organizationType="nonprofit" />;
          case 'kudos':
            return <PlaceholderContent contentType="Community Kudos" organizationType="nonprofit" />;
        }
        break;
      
      case 'foundation':
      case 'funder':
        switch (activeTab) {
          case 'grants':
            return <PlaceholderContent contentType="Grants" organizationType="foundation" />;
          case 'grantees':
            return <PlaceholderContent contentType="Grantees" organizationType="foundation" />;
          case 'impact':
            return <PlaceholderContent contentType="Impact Metrics" organizationType="foundation" />;
        }
        break;
      
      case 'healthcare':
        switch (activeTab) {
          case 'services':
            return <PlaceholderContent contentType="Services" organizationType="healthcare" />;
        }
        break;
      
      case 'education':
        switch (activeTab) {
          case 'programs':
            return <PlaceholderContent contentType="Academic Programs" organizationType="education" />;
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

  const handleFollow = () => !session ? navigate('/login') : toggleFollow();
  const handleBookmark = () => !session ? navigate('/login') : toggleBookmark();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-slate-500">Loading organization...</span>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600">{error || "Organization not found."}</p>
      </div>
    );
  }

  const tabConfig = getTabConfiguration(organization.type);

  return (
    <PublicPageLayout bgColor="bg-slate-50">
      <OrganizationHeader 
        organization={organization}
        isFollowing={isFollowing}
        followersCount={followersCount}
        isBookmarked={isBookmarked}
        bookmarksCount={bookmarksCount}
        onFollow={handleFollow}
        onBookmark={handleBookmark}
      />
      
      <OrganizationTabs 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={tabConfig}
      />
      
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