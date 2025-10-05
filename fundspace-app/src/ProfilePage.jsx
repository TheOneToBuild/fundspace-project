import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from './supabaseClient';
import { Outlet, useOutletContext } from 'react-router-dom';
import PublicPageLayout from './components/PublicPageLayout.jsx';
import GrantDetailModal from './GrantDetailModal.jsx';
import { usePageDataLoader } from './hooks/usePageDataLoader.js';import { getCompleteProfilePageData, trackRPCUsage, getGrantById, toggleSavedGrant, toggleFollowUser } from './utils/rpcClientFunctions';

export default function ProfilePage() {
  const appContext = useOutletContext();
  const { session, profile, loading, notifications, unreadCount, markNotificationsAsRead, refreshProfile } = appContext;

  const [appState, setAppState] = useState({
    trendingGrants: [],
    savedGrants: [],
    posts: [],
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
      // ONE MEGA RPC CALL - gets everything
      const pageData = await getCompleteProfilePageData(userId);
      
      // Extract all data
      const posts = pageData.posts || [];
      const savedGrants = pageData.saved_grants || [];
      const trendingGrants = pageData.trending_grants || [];
      const communityMembers = pageData.trending_profiles || [];
      const followerUsers = pageData.followers || [];
      const followingUsers = pageData.following || [];
      
      const impactMetrics = {
        grantsApplied: Math.floor(Math.random() * 15) + 5,
        grantsReceived: Math.floor(Math.random() * 5) + 1,
        totalFunding: Math.floor(Math.random() * 500000) + 50000,
        communitiesHelped: pageData.profile?.follower_count || 0,
        postsShared: posts.length,
        connectionsGrown: (pageData.profile?.follower_count || 0) + (pageData.profile?.following_count || 0),
      };
      
      await loadProfilePageData(userId, posts);
      
      setAppState((prev) => ({
        ...prev,
        dataLoading: false,
        posts,
        savedGrants,
        trendingGrants,
        totalPosts: posts.length,
        followerUsers,
        totalFollowers: pageData.profile?.follower_count || 0,
        followingUsers,
        totalFollowing: pageData.profile?.following_count || 0,
        communityMembers,
        suggestedConnections: communityMembers.slice(0, 5),
        impactMetrics,
        stories: [
          { id: 1, type: 'grant_success', title: 'Grant Success', image: null, viewed: false },
          { id: 2, type: 'community_event', title: 'Workshop', image: null, viewed: true },
          { id: 3, type: 'team_update', title: 'Team News', image: null, viewed: false },
        ],
      }));
      
      trackRPCUsage('get_complete_profile_page_data', true);
    } catch (error) {
      console.error('Error loading profile page:', error);
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
      await toggleFollowUser(session.user.id, userId);
      window.dispatchEvent(
        new CustomEvent('followUpdate', {
          detail: { action, followerId: session.user.id, followingId: userId },
        })
      );
      invalidateCache('profile');
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
            reaction_summary: [],
            user_reaction: null,
            likes_count: 0,
            comments_count: 0,
          },
          ...prev.posts,
        ],
        totalPosts: prev.totalPosts + 1,
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
      const result = await getGrantById(grantId, session?.user?.id);
      
      if (result?.grant) {
        const grant = result.grant;
        openDetail({
          ...grant,
          foundationName: grant.organization?.name || 'Unknown Organization',
          funderLogoUrl: grant.organization?.logo_url || null,
          categories: grant.categories || [],
          locations: grant.locations || [],
          dueDate: grant.deadline,
        });
      }
    } catch (error) {
      console.error('Error fetching grant details:', error);
    }
  }, [openDetail, session?.user?.id]);

  const handleSaveGrant = useCallback(
    async (grantId) => {
      if (session && grantId) {
        await toggleSavedGrant(session.user.id, grantId);
        clearPageData();
        fetchPageData(session.user.id);
      }
    },
    [session, fetchPageData, clearPageData]
  );

  const handleUnsaveGrant = useCallback(
    async (grantId) => {
      if (session && grantId) {
        await toggleSavedGrant(session.user.id, grantId);
        clearPageData();
        fetchPageData(session.user.id);
      }
    },
    [session, fetchPageData, clearPageData]
  );

  const handlePostLike = useCallback(async (postId, currentReaction, newReaction) => {
    if (!session?.user?.id) return;
    
    setAppState(prev => {
      const newPosts = prev.posts.map(p => 
        p.id === postId ? { ...p, user_reaction: newReaction } : p
      );
      return { ...prev, posts: newPosts };
    });

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
      setAppState(prev => {
        const newPosts = prev.posts.map(p => 
          p.id === postId ? { ...p, user_reaction: currentReaction } : p
        );
        return { ...prev, posts: newPosts };
      });
    }
  }, [session]);

  const outletContext = useMemo(
    () => ({
      ...appContext,
      profile,
      posts,
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