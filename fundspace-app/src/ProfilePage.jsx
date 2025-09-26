import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from './supabaseClient';
import { Outlet, useOutletContext } from 'react-router-dom';
import PublicPageLayout from './components/PublicPageLayout.jsx';
import GrantDetailModal from './GrantDetailModal.jsx';
import { usePageDataLoader } from './hooks/usePageDataLoader';

export default function ProfilePage() {
  const appContext = useOutletContext();
  const { session, profile, loading, notifications, unreadCount, markNotificationsAsRead, refreshProfile } = appContext;

  const [appState, setAppState] = useState({
    trendingGrants: [],
    savedGrants: [],
    posts: [],
    postsLikesData: {}, // NEW: Cache for batched likes data
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

  // NEW: Batch load post likes data
  const batchLoadPostLikes = useCallback(async (postIds, userId) => {
    if (!postIds.length || !userId) return {};

    try {
      // Single batch query instead of N individual queries
      const { data: likesData, error } = await supabase
        .from('post_likes')
        .select('post_id, reaction_type, user_id, created_at')
        .in('post_id', postIds)
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching batch post likes:', error);
        return {};
      }

      // Convert to lookup object: { postId: { userReaction: 'like|dislike', ... } }
      const likesLookup = {};
      postIds.forEach(postId => {
        likesLookup[postId] = { userReaction: null };
      });

      (likesData || []).forEach(like => {
        if (!likesLookup[like.post_id]) {
          likesLookup[like.post_id] = {};
        }
        likesLookup[like.post_id].userReaction = like.reaction_type;
      });

      return likesLookup;
    } catch (error) {
      console.error('Error in batchLoadPostLikes:', error);
      return {};
    }
  }, []);

  const fetchPageData = useCallback(async (userId) => {
    if (!userId) return;

    setAppState((prev) => ({ ...prev, dataLoading: true, error: null }));

    try {
      // Load posts first
      const { data: postsData } = await supabase
        .from('posts')
        .select(`
          id, content, created_at, likes_count, comments_count, channel, tags, image_urls,
          profiles:profile_id(id, full_name, avatar_url, title, organization_name, role, organization_type)
        `)
        .eq('profile_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      const posts = postsData || [];
      const postIds = posts.map(p => p.id);

      // FIXED: Batch load all post likes in single query instead of N+1
      const likesData = await batchLoadPostLikes(postIds, userId);

      await loadProfilePageData(userId, posts);

      // Continue with other parallel queries (unchanged)
      const [
        { data: savedGrantsData },
        { data: followersData },
        { data: followingData },
        { data: communityMembersData },
      ] = await Promise.all([
        supabase
          .from('saved_grants')
          .select('*, grants:grant_id(*)')
          .eq('user_id', userId)
          .limit(10),
        supabase
          .from('followers')
          .select('follower_id, profiles:follower_id(id, full_name, avatar_url, title, organization_name)')
          .eq('following_id', userId)
          .limit(20),
        supabase
          .from('followers')
          .select('following_id, profiles:following_id(id, full_name, avatar_url, title, organization_name)')
          .eq('follower_id', userId)
          .limit(20),
        supabase
          .from('profiles')
          .select('id, full_name, avatar_url, title, organization_name')
          .neq('id', userId)
          .limit(10),
      ]);

      // Trending grants with single batch query
      const { data: trendingGrantsData } = await supabase
        .from('grants')
        .select('*')
        .order('id', { ascending: false })
        .limit(15);

      // Batch fetch organizations
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
        communitiesHelped: followersData?.length || 0,
        postsShared: posts.length,
        connectionsGrown: (followersData?.length || 0) + (followingData?.length || 0),
      };

      const stories = [
        { id: 1, type: 'grant_success', title: 'Grant Success', image: null, viewed: false },
        { id: 2, type: 'community_event', title: 'Workshop', image: null, viewed: true },
        { id: 3, type: 'team_update', title: 'Team News', image: null, viewed: false },
      ];

      setAppState((prev) => ({
        ...prev,
        dataLoading: false,
        posts,
        postsLikesData: likesData, // NEW: Store batched likes data
        savedGrants: savedGrantsData?.map((sg) => sg.grants) || [],
        trendingGrants: formattedTrendingGrants,
        totalPosts: posts.length,
        followerUsers: followersData?.map((f) => f.profiles) || [],
        totalFollowers: followersData?.length || 0,
        followingUsers: followingData?.map((f) => f.profiles) || [],
        totalFollowing: followingData?.length || 0,
        communityMembers: communityMembersData || [],
        suggestedConnections: (communityMembersData || []).slice(0, 5),
        impactMetrics,
        stories,
      }));
    } catch (error) {
      console.error('Error fetching page data:', error);
      setAppState((prev) => ({
        ...prev,
        dataLoading: false,
        error: 'Failed to load data. Please try again.',
      }));
    }
  }, [loadProfilePageData, batchLoadPostLikes]);

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
        // Update likes data for new post
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
        // Remove from likes data
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

  // NEW: Handle post like/unlike with optimistic updates
  const handlePostLike = useCallback(async (postId, currentReaction, newReaction) => {
    if (!session?.user?.id) return;

    // Optimistic update
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
          // Remove reaction
          await supabase
            .from('post_likes')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', session.user.id);
        } else {
          // Update existing reaction
          await supabase
            .from('post_likes')
            .update({ reaction_type: newReaction })
            .eq('post_id', postId)
            .eq('user_id', session.user.id);
        }
      } else {
        // Insert new reaction
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
      // Revert optimistic update on error
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
      postsLikesData, // NEW: Provide batched likes data to components
      pageData,
      handleNewPost,
      handleDeletePost,
      handlePostLike, // NEW: Provide like handler
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
      postsLikesData, // NEW
      pageData,
      handleNewPost,
      handleDeletePost,
      handlePostLike, // NEW
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