import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient.js';
import PublicPageLayout from './components/PublicPageLayout.jsx';
import GrantDetailModal from './GrantDetailModal.jsx';
import { Loader, ArrowLeft } from './components/Icons.jsx';

// Import the new, smaller components we created
import FunderProfileHeader from './components/funder-profile/FunderProfileHeader.jsx';
import FunderProfileTabs from './components/funder-profile/FunderProfileTabs.jsx';
import FunderProfileHome from './components/funder-profile/FunderProfileHome.jsx';
import FunderProfileOverview from './components/funder-profile/FunderProfileOverview.jsx';
import FunderProfileGrants from './components/funder-profile/FunderProfileGrants.jsx';
import FunderProfileGrantees from './components/funder-profile/FunderProfileGrantees.jsx';
import FunderProfileKudos from './components/funder-profile/FunderProfileKudos.jsx';
import FunderProfileImpact from './components/funder-profile/FunderProfileImpact.jsx';
import FunderProfileTeam from './components/funder-profile/FunderProfileTeam.jsx';

// Import the custom hooks for social features and analytics
import { useFunderFollow, useFunderBookmark } from './utils/funderSocialHooks.js';
import { useProfileViewTracking } from './utils/profileViewsHooks.js';

const FunderProfilePage = () => {
  const { funderSlug } = useParams();
  const navigate = useNavigate();
  
  // All state is managed in this parent component
  const [funder, setFunder] = useState(null);
  const [funderGrants, setFunderGrants] = useState([]);
  const [organizationPosts, setOrganizationPosts] = useState([]);
  const [grantees, setGrantees] = useState([]);
  const [kudos, setKudos] = useState([]);
  const [impactStories, setImpactStories] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  
  const [isDetailModalOpen, setIsDetailModal] = useState(false);
  const [selectedGrant, setSelectedGrant] = useState(null);

  // Fetch user session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  // Use custom hooks for social interactions
  const { isFollowing, followersCount, loading: followLoading, toggleFollow } = useFunderFollow(funder?.id, session?.user?.id);
  const { isBookmarked: isLiked, bookmarksCount: likesCount, loading: likeLoading, toggleBookmark: toggleLike } = useFunderBookmark(funder?.id, session?.user?.id);
  
  // Track profile views
  useProfileViewTracking(funder?.id, session?.user?.id);

  // Data fetching logic remains in the parent component
  useEffect(() => {
    const fetchFunderData = async () => {
      if (!funderSlug) return;
      setLoading(true);
      setError(null);

      try {
        const { data: funderData, error: funderError } = await supabase
          .from('funders')
          .select('*, funder_categories(categories(name)), funder_type:funder_type_id(name), funder_funding_locations(locations(id, name))')
          .eq('slug', funderSlug)
          .single();

        if (funderError) throw funderError;
        
        // Format the main funder object
        if (funderData) {
          funderData.focus_areas = funderData.funder_categories.map(fc => fc.categories.name);
          funderData.funding_locations = funderData.funder_funding_locations.map(ffl => ffl.locations.name);
        }
        setFunder(funderData);

        // Fetch all related data in parallel once we have the funder ID
        if (funderData?.id) {
          const funderId = funderData.id;
          const [grantsRes, orgPostsRes, activitiesRes, storiesRes, membersRes] = await Promise.all([
            // Fetch Grants
            supabase.from('grants').select(`*, funders(name, logo_url, slug), grant_categories(categories(id, name)), grant_locations(locations(id, name))`).eq('funder_id', funderId).order('deadline', { ascending: true, nullsFirst: false }),
            // Fetch Organization Posts
            supabase.from('posts').select(`*, profiles!posts_profile_id_fkey(*)`).eq('organization_id', funderId).eq('organization_type', 'funder').order('created_at', { ascending: false }).limit(10),
            // Fetch Recent Activities (using mock for now as per original code)
            Promise.resolve({ data: [{ id: 1, type: 'grant_awarded', description: 'Awarded $50,000 to Bay Area Food Bank', date: '2024-01-15', amount: '$50,000' }] }),
            // Fetch Impact Stories (using mock for now)
            Promise.resolve({ data: [{ id: 1, title: 'Transforming Youth Education in Oakland', nonprofit: 'Oakland Youth Center', amount: '$75,000', impact: 'Served 500+ at-risk youth', image: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400' }] }),
            // Fetch Team Members
            supabase.rpc('get_organization_members', { organization_id_param: funderId, organization_type_param: 'funder' })
          ]);

          // Set Grants
          setFunderGrants((grantsRes.data || []).map(grant => ({ ...grant, foundationName: grant.funders?.name, funderLogoUrl: grant.funders?.logo_url, fundingAmount: grant.max_funding_amount, dueDate: grant.deadline, grantType: grant.grant_type, categories: grant.grant_categories.map(gc => gc.categories), locations: grant.grant_locations.map(gl => gl.locations) })));
          
          // Set Organization Posts
          setOrganizationPosts(orgPostsRes.data || []);
          
          // Set Other Mock/Fetched Data
          setRecentActivities(activitiesRes.data || []);
          setImpactStories(storiesRes.data || []);
          setTeamMembers(membersRes.data || []);
          // Set mock grantees and kudos as in original file
          setGrantees([{ id: 1, name: "Bay Area Food Bank", grantAmount: "$50,000", focusAreas: [], location: "Oakland, CA", grantYear: "2023", tagline: "", imageUrl: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400" }]);
          setKudos([]);
        }

      } catch (err) {
        console.error('Error fetching funder data:', err);
        setError('Could not load funder profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchFunderData();
  }, [funderSlug]);

  // All handler functions remain in the parent component
  const handleDeletePost = async (postId) => {
    if (!funder || !session) return;
    const { error } = await supabase.from('posts').delete().eq('id', postId).eq('organization_id', funder.id);
    if (error) {
      setError('Failed to delete the post.');
    } else {
      setOrganizationPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
    }
  };

  const openDetail = useCallback((grant) => {
    setSelectedGrant(grant);
    setIsDetailModal(true);
  }, []);

  const closeDetail = useCallback(() => {
    setSelectedGrant(null);
    setIsDetailModal(false);
  }, []);

  const handleFollow = () => !session ? navigate('/login') : toggleFollow();
  const handleLike = () => !session ? navigate('/login') : toggleLike();
  
  // This function conditionally renders the correct tab component
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'home':
            return <FunderProfileHome posts={organizationPosts} onDelete={handleDeletePost} funder={funder} />;
      case 'overview':
        return <FunderProfileOverview funder={funder} recentActivities={recentActivities} />;
      case 'grants':
        return <FunderProfileGrants grants={funderGrants} onOpenDetail={openDetail} />;
      case 'grantees':
        return <FunderProfileGrantees grantees={grantees} />;
      case 'kudos':
        return <FunderProfileKudos funder={funder} kudos={kudos} session={session} />;
      case 'impact':
        return <FunderProfileImpact funder={funder} stories={impactStories} />;
      case 'team':
        return <FunderProfileTeam members={teamMembers} />;
      default:
        return <FunderProfileHome posts={organizationPosts} onDelete={handleDeletePost} />;
    }
  };

  if (loading) return (
    <div className="text-center py-20">
      <Loader size={40} className="mx-auto text-green-400 mb-3 animate-spin" />
      <p>Loading Funder Profile...</p>
    </div>
  );

  if (error || !funder) return (
    <div className="text-center py-20">
      <p className="text-red-600">{error || "Funder not found."}</p>
      <Link to="/funders" className="mt-4 inline-flex items-center text-blue-600 hover:underline">
        <ArrowLeft size={16} className="mr-1" />Back
      </Link>
    </div>
  );

  return (
    <PublicPageLayout bgColor="bg-slate-50">
      <FunderProfileHeader 
        funder={funder}
        isFollowing={isFollowing}
        followersCount={followersCount}
        followLoading={followLoading}
        handleFollow={handleFollow}
        isLiked={isLiked}
        likesCount={likesCount}
        likeLoading={likeLoading}
        handleLike={handleLike}
      />
      <FunderProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="min-h-screen py-8">
            {renderActiveTab()}
          </div>
        </div>
      </div>

      {isDetailModalOpen && (
        <GrantDetailModal
          grant={selectedGrant}
          isOpen={isDetailModalOpen}
          onClose={closeDetail}
        />
      )}
    </PublicPageLayout>
  );
};

export default FunderProfilePage;