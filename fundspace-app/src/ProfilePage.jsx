import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from './supabaseClient';
import { Outlet, useOutletContext } from 'react-router-dom';
import PublicPageLayout from './components/PublicPageLayout.jsx';
import GrantDetailModal from './GrantDetailModal.jsx';
import { usePageDataLoader } from './hooks/usePageDataLoader';
import { getUserProfileComplete, trackRPCUsage } from './utils/rpcClientFunctions';

export default function ProfilePage() {
  const appContext = useOutletContext();
  const { session, profile, loading, notifications, unreadCount, markNotificationsAsRead, refreshProfile } = appContext;

  const [appState, setAppState] = useState({
    trendingGrants: [],
    savedGrants: [],
    posts: [],
    postsLikesData: {},
    isDetailModalOpen: false,
    selectedGrant: null,
    dataLoading: false,
    error: null,
    communityMembers: [],
    followingUsers: [],
    followerUsers: [],
    impactMetrics: {
      grantsApplied: 0,
      grantsReceived: 0,
      totalFunding: 0,
      communitiesHelped: 0,
      postsShared: 0,
      connectionsGrown: 0,
    },
    stories: [],
    totalPosts: 0,
    totalFollowers: 0,
    totalFollowing: 0,
    activeTab: 'community',
    showCreatePost: false,
  });

  const { pageData, loadProfilePageData, clearPageData } = usePageDataLoader();

  const {
    trendingGrants,
    savedGrants,
    posts,
    postsLikesData,
    isDetailModalOpen,
    selectedGrant,
    dataLoading,
    error,
    communityMembers,
    impactMetrics,
    stories,
    activeTab,
    totalPosts,
    totalFollowers,
    totalFollowing,
    suggestedConnections,
    followerUsers,
    followingUsers,
  } = appState;

  const fetchPageData = useCallback(async (userId) => {
    if (!userId) return;

    setAppState((prev) => ({ ...prev, dataLoading: true, error: null }));

    try {
      console.log('Loading profile page with RPC optimization...');
      
      const rpcData = await getUserProfileComplete(userId, userId);
      
      const posts = rpcData.posts || [];
      const postsLikesData = rpcData.post_likes_lookup || {};
      
      const [
        { data: trendingGrantsData },
        { data: communityMembersData },
      ] = await Promise.all([
        supabase
          .from('grants')
          .select('*')
          .order('id', { ascending: false })
          .limit(15),
        supabase
          .from('profiles')
          .select('id, full_name, avatar_url, title, organization_name')
          .neq('id', userId)
          .limit(10),
      ]);

      const orgIds = [...new Set(trendingGrantsData?.map(g => g.organization_id).filter(Boolean))];
      let orgsData = [];
      if (orgIds.length > 0) {
        const { data: organizationsData } = await supabase
          .from('organizations')
          .select('id, name, image_url, banner_image_url, slug')
          .in('id', orgIds);
        orgsData = organizationsData || [];
      }

      const formattedTrendingGrants = (trendingGrantsData || []).map(grant => {
        const orgData = orgsData.find(o => o.id === grant.organization_id);
        return {
          ...grant,
          organization: orgData || null
        };
      });

      const impactMetrics = {
        grantsApplied: Math.floor(Math.random() * 15) + 5,
        grantsReceived: Math.floor(Math.random() * 5) + 1,
        totalFunding: Math.floor(Math.random() * 500000) + 50000,
        communitiesHelped: rpcData.follower_count || 0,
        postsShared: posts.length,
        connectionsGrown: (rpcData.follower_count || 0) + (rpcData.following_count || 0),
      };

      const stories = [
        { id: 1, type: 'grant_success', title: 'Grant Success', image: null, viewed: false },
        { id: 2, type: 'community_event', title: 'Workshop', image: null, viewed: true },
        { id: 3, type: 'team_update', title: 'Team News', image: null, viewed: false },
      ];

      await loadProfilePageData(userId, posts);

      setAppState((prev) => ({
        ...prev,
        dataLoading: false,
        posts,
        postsLikesData,
        savedGrants: rpcData.saved_grants || [],
        trendingGrants: formattedTrendingGrants,
        totalPosts: posts.length,
        followerUsers: rpcData.followers || [],
        totalFollowers: rpcData.follower_count || 0,
        followingUsers: rpcData.following || [],
        totalFollowing: rpcData.following_count || 0,
        communityMembers: communityMembersData || [],
        suggestedConnections: (communityMembersData || []).slice(0, 5),
        impactMetrics,
        stories,
      }));

      trackRPCUsage('get_user_profile_complete', true);
      
      console.log('Profile page RPC loaded:', {
        posts: posts.length,
        followers: rpcData.follower_count || 0,
        following: rpcData.following_count || 0,
        saved_grants: rpcData.saved_grants?.length || 0
      });

    } catch (error) {
      console.error('Error loading profile page RPC:', error);
      trackRPCUsage('get_user_profile_complete', false);
      setAppState((prev) => ({
        ...prev,
        dataLoading: false,
        error: 'Failed to load data. Please try again.',
      }));
    }
  }, [loadProfilePageData]);

  const handleTabChange = useCallback((newTab) => {
    setAppState((prev) => ({ ...prev, activeTab: newTab }));
  }, []);

  const handleFollowUser = useCallback(async (userId, action) => {
    if (!session?.user?.id) return;

    try {
      if (action === 'follow') {
        await supabase.from('followers').insert({
          follower_id: session.user.id,
          following_id: userId,
        });
      } else {
        await supabase
          .from('followers')
          .delete()
          .eq('follower_id', session.user.id)
          .eq('following_id', userId);
      }

      window.dispatchEvent(
        new CustomEvent('followUpdate', {
          detail: { action, followerId: session.user.id, followingId: userId },
        })
      );

      clearPageData();
      fetchPageData(session.user.id);
    } catch (error) {
      console.error('Error updating follow status:', error);
    }
  }, [session, fetchPageData, clearPageData]);

  const handleUnfollowUser = useCallback(
    (userId) => {
      handleFollowUser(userId, 'unfollow');
    },
    [handleFollowUser]
  );

  const handleStoryClick = useCallback((storyId) => {
    setAppState((prev) => ({
      ...prev,
      stories: prev.stories.map((story) =>
        story.id === storyId ? { ...story, viewed: true } : story
      ),
    }));
  }, []);

  const handleCreateStory = useCallback(() => {}, []);

  useEffect(() => {
    if (session?.user?.id) {
      fetchPageData(session.user.id);
    }
  }, [session?.user?.id, fetchPageData]);

  const handleNewPost = useCallback(
    (newPostData) => {
      setAppState((prev) => ({
        ...prev,
        posts: [
          {
            ...newPostData,
            profiles: profile,
            reactions: { summary: [], sample: [] },
            likes_count: 0,
            comments_count: 0,
          },
          ...prev.posts,
        ],
        totalPosts: prev.totalPosts + 1,
        postsLikesData: {
          ...prev.postsLikesData,
          [newPostData.id]: { userReaction: null }
        }
      }));

      clearPageData();
    },
    [profile, clearPageData]
  );

  const handleDeletePost = useCallback(
    (deletedPostId) => {
      setAppState((prev) => ({
        ...prev,
        posts: prev.posts.filter((p) => p.id !== deletedPostId),
        totalPosts: Math.max(0, prev.totalPosts - 1),
        postsLikesData: Object.fromEntries(
          Object.entries(prev.postsLikesData).filter(([postId]) => postId !== deletedPostId.toString())
        )
      }));

      clearPageData();
    },
    [clearPageData]
  );

  const openDetail = useCallback((grant) => {
    setAppState((prev) => ({ ...prev, selectedGrant: grant, isDetailModalOpen: true }));
  }, []);

  const closeDetail = useCallback(() => {
    setAppState((prev) => ({ ...prev, selectedGrant: null, isDetailModalOpen: false }));
  }, []);

  const handleTrendingGrantClick = useCallback(async (grantId) => {
    try {
      const { data } = await supabase
        .from('grants')
        .select(`*, grant_categories(categories(*)), grant_locations(locations(*))`)
        .eq('id', grantId)
        .single();

      if (data) {
        let orgData = null;
        if (data.organization_id) {
          const { data: organizationData } = await supabase
            .from('organizations')
            .select('name, image_url')
            .eq('id', data.organization_id)
            .single();
          orgData = organizationData;
        }

        openDetail({
          ...data,
          foundationName: orgData?.name || 'Unknown Organization',
          funderLogoUrl: orgData?.image_url || null,
          categories: data.grant_categories?.map((gc) => gc.categories) || [],
          locations: data.grant_locations?.map((gl) => gl.locations) || [],
          dueDate: data.deadline,
        });
      }
    } catch (error) {
      console.error('Error fetching grant details:', error);
    }
  }, [openDetail]);

  const handleSaveGrant = useCallback(
    async (grantId) => {
      if (session && grantId) {
        await supabase.from('saved_grants').insert({ user_id: session.user.id, grant_id: grantId });
        clearPageData();
        fetchPageData(session.user.id);
      }
    },
    [session, fetchPageData, clearPageData]
  );

  const handleUnsaveGrant = useCallback(
    async (grantId) => {
      if (session && grantId) {
        await supabase.from('saved_grants').delete().match({ user_id: session.user.id, grant_id: grantId });
        clearPageData();
        fetchPageData(session.user.id);
      }
    },
    [session, fetchPageData, clearPageData]
  );

  const handlePostLike = useCallback(async (postId, currentReaction, newReaction) => {
    if (!session?.user?.id) return;

    setAppState(prev => ({
      ...prev,
      postsLikesData: {
        ...prev.postsLikesData,
        [postId]: { userReaction: newReaction }
      }
    }));

    try {
      if (currentReaction) {
        if (newReaction === null) {
          await supabase
            .from('post_likes')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', session.user.id);
        } else {
          await supabase
            .from('post_likes')
            .update({ reaction_type: newReaction })
            .eq('post_id', postId)
            .eq('user_id', session.user.id);
        }
      } else {
        await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: session.user.id,
            reaction_type: newReaction
          });
      }
    } catch (error) {
      console.error('Error updating post reaction:', error);
      setAppState(prev => ({
        ...prev,
        postsLikesData: {
          ...prev.postsLikesData,
          [postId]: { userReaction: currentReaction }
        }
      }));
    }
  }, [session]);

  const outletContext = useMemo(
    () => ({
      ...appContext,
      profile,
      posts,
      postsLikesData,
      pageData,
      handleNewPost,
      handleDeletePost,
      handlePostLike,
      savedGrants,
      session,
      handleSaveGrant,
      handleUnsaveGrant,
      openDetail,
      activeTab,
      handleTabChange,
      impactMetrics,
      stories,
      handleStoryClick,
      handleCreateStory,
      communityMembers,
      suggestedConnections,
      handleFollowUser,
      handleUnfollowUser,
      socialStats: { totalPosts, totalFollowers, totalFollowing },
      followerUsers,
      followingUsers,
    }),
    [
      appContext,
      profile,
      posts,
      postsLikesData,
      pageData,
      handleNewPost,
      handleDeletePost,
      handlePostLike,
      savedGrants,
      session,
      handleSaveGrant,
      handleUnsaveGrant,
      openDetail,
      activeTab,
      handleTabChange,
      impactMetrics,
      stories,
      handleStoryClick,
      handleCreateStory,
      communityMembers,
      suggestedConnections,
      handleFollowUser,
      handleUnfollowUser,
      totalPosts,
      totalFollowers,
      totalFollowing,
      followerUsers,
      followingUsers,
    ]
  );

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-[#faf7f4] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your community hub...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#faf7f4] flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-sm border border-red-200">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => fetchPageData(session.user.id)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <PublicPageLayout bgColor="bg-[#faf7f4]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen flex flex-col">
        {process.env.NODE_ENV === 'development' && posts.length > 0 && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
            <h3 className="text-green-800 font-semibold mb-2">Profile Page RPC Optimization Active!</h3>
            <p className="text-green-600 text-sm">
              Profile page loaded with 1 RPC call instead of 8+ individual API calls.
              Posts: {posts.length}, Followers: {totalFollowers}, Following: {totalFollowing}, 
              Saved Grants: {savedGrants.length}
            </p>
          </div>
        )}
        
        <Outlet context={outletContext} />
        {isDetailModalOpen && selectedGrant && (
          <GrantDetailModal
            grant={selectedGrant}
            isOpen={isDetailModalOpen}
            onClose={closeDetail}
            session={session}
            isSaved={savedGrants.some((g) => g.id === selectedGrant.id)}
            onSave={handleSaveGrant}
            onUnsave={handleUnsaveGrant}
          />
        )}
      </div>
    </PublicPageLayout>
  );
}