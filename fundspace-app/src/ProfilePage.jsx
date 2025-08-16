// src/ProfilePage.jsx - FIXED VERSION
import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import { supabase } from './supabaseClient';
import { Outlet, useOutletContext } from 'react-router-dom';
import ProfileLayout from './components/ProfileLayout.jsx';
import GrantDetailModal from './GrantDetailModal.jsx';
import { LayoutContext } from './App.jsx';

export default function ProfilePage() {
    const appContext = useOutletContext();
    const { session, profile, loading, notifications, unreadCount, markNotificationsAsRead, refreshProfile } = appContext;
    const { setPageBgColor } = useContext(LayoutContext);

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
        impactMetrics: { grantsApplied: 0, grantsReceived: 0, totalFunding: 0, communitiesHelped: 0, postsShared: 0, connectionsGrown: 0 },
        stories: [],
        communityEvents: [],
        suggestedConnections: [],
        recentActivity: [],
        totalPosts: 0,
        totalFollowers: 0,
        totalFollowing: 0,
        activeTab: 'community',
        showCreatePost: false
    });

    const { trendingGrants, savedGrants, posts, isDetailModalOpen, selectedGrant, dataLoading, error, communityMembers, impactMetrics, stories, activeTab, totalPosts, totalFollowers, totalFollowing, suggestedConnections } = appState;

    useEffect(() => {
        setPageBgColor('bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20');
        return () => setPageBgColor('bg-white');
    }, [setPageBgColor]);

    const fetchPageData = useCallback(async (userId) => {
        if (!userId) return;
        
        setAppState(prev => ({ ...prev, dataLoading: true, error: null }));
        
        try {
            const fetchPostsWithReactions = async () => {
                const { data: basicPosts, error: postsError } = await supabase
                    .from('posts')
                    .select(`
                        *,
                        profiles!posts_profile_id_fkey(id, full_name, avatar_url, role, title, organization_name)
                    `)
                    .eq('channel', 'hello-world')
                    .order('created_at', { ascending: false });

                if (postsError) return { data: [], error: postsError };

                const postsWithReactions = await Promise.all(
                    (basicPosts || []).map(async (post) => {
                        const { data: reactionData } = await supabase
                            .from('post_likes')
                            .select('reaction_type')
                            .eq('post_id', post.id);

                        const counts = {};
                        reactionData?.forEach(like => {
                            if (like.reaction_type) counts[like.reaction_type] = (counts[like.reaction_type] || 0) + 1;
                        });

                        const reactionSummary = Object.entries(counts).map(([type, count]) => ({ type, count }));

                        const { count: likesCount } = await supabase
                            .from('post_likes')
                            .select('*', { count: 'exact', head: true })
                            .eq('post_id', post.id);

                        const { count: commentsCount } = await supabase
                            .from('post_comments')
                            .select('*', { count: 'exact', head: true })
                            .eq('post_id', post.id);

                        return {
                            ...post,
                            likes_count: likesCount || 0,
                            comments_count: commentsCount || 0,
                            reactions: { summary: reactionSummary, sample: [] }
                        };
                    })
                );

                return { data: postsWithReactions, error: null };
            };

            // FIXED: Separate queries to avoid complex joins that cause 400 errors
            const fetchSavedGrants = async () => {
                try {
                    // Step 1: Get saved grants IDs
                    const { data: savedGrantsData, error: savedError } = await supabase
                        .from('saved_grants')
                        .select('id, grant_id, created_at')
                        .eq('user_id', userId)
                        .order('created_at', { ascending: false });

                    if (savedError || !savedGrantsData) return [];

                    const grantIds = savedGrantsData.map(sg => sg.grant_id);
                    if (grantIds.length === 0) return [];

                    // Step 2: Get grants data
                    const { data: grantsData, error: grantsError } = await supabase
                        .from('grants')
                        .select('*')
                        .in('id', grantIds);

                    if (grantsError || !grantsData) return [];

                    // Step 3: Get organizations data
                    const orgIds = [...new Set(grantsData.map(g => g.organization_id).filter(Boolean))];
                    let orgsData = [];
                    if (orgIds.length > 0) {
                        const { data: organizationsData } = await supabase
                            .from('organizations')
                            .select('id, name, image_url, slug')
                            .in('id', orgIds);
                        orgsData = organizationsData || [];
                    }

                    // Step 4: Combine data
                    return savedGrantsData.map(savedGrant => {
                        const grantData = grantsData.find(g => g.id === savedGrant.grant_id);
                        if (!grantData) return null;

                        const orgData = orgsData.find(o => o.id === grantData.organization_id);

                        return {
                            ...grantData,
                            dueDate: grantData.deadline,
                            save_id: savedGrant.id,
                            foundationName: orgData?.name || 'Unknown Organization',
                            funderLogoUrl: orgData?.image_url || null
                        };
                    }).filter(Boolean);
                } catch (error) {
                    console.error('Error fetching saved grants:', error);
                    return [];
                }
            };

            const [
                savedGrantsData,
                trendingGrantsRes,
                postsRes,
                socialStatsRes,
                followersRes,
                followingRes,
                communityMembersRes
            ] = await Promise.all([
                fetchSavedGrants(),
                supabase.rpc('get_trending_grants'),
                fetchPostsWithReactions(),
                supabase.from('profiles').select('id').eq('id', userId).single(),
                supabase
                    .from('followers')
                    .select('follower_id, profiles!followers_follower_id_fkey(id, full_name, avatar_url, title)')
                    .eq('following_id', userId),
                supabase
                    .from('followers')
                    .select('following_id, profiles!followers_following_id_fkey(id, full_name, avatar_url, title)')
                    .eq('follower_id', userId),
                supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url, title, organization_name')
                    .neq('id', userId)
                    .limit(10)
            ]);

            setAppState(prev => ({
                ...prev,
                dataLoading: false,
                savedGrants: savedGrantsData,
                trendingGrants: trendingGrantsRes.data || [],
                posts: postsRes.data || [],
                totalPosts: postsRes.data?.length || 0,
                followerUsers: followersRes.data?.map(f => f.profiles) || [],
                totalFollowers: followersRes.data?.length || 0,
                followingUsers: followingRes.data?.map(f => f.profiles) || [],
                totalFollowing: followingRes.data?.length || 0,
                communityMembers: communityMembersRes.data || [],
                suggestedConnections: communityMembersRes.data?.slice(0, 5) || [],
                impactMetrics: {
                    grantsApplied: Math.floor(Math.random() * 15) + 5,
                    grantsReceived: Math.floor(Math.random() * 5) + 1,
                    totalFunding: Math.floor(Math.random() * 500000) + 50000,
                    communitiesHelped: Math.floor(Math.random() * 10) + 3,
                    postsShared: postsRes.data?.length || 0,
                    connectionsGrown: (followersRes.data?.length || 0) + (followingRes.data?.length || 0)
                },
                stories: [
                    { id: 1, type: 'grant_success', title: 'Grant Success', image: null, viewed: false },
                    { id: 2, type: 'community_event', title: 'Workshop', image: null, viewed: true },
                    { id: 3, type: 'team_update', title: 'Team News', image: null, viewed: false }
                ]
            }));
        } catch (error) {
            console.error('Error fetching page data:', error);
            setAppState(prev => ({ ...prev, dataLoading: false, error: 'Failed to load data. Please try again.' }));
        }
    }, []);

    const handleTabChange = useCallback(newTab => {
        setAppState(prev => ({ ...prev, activeTab: newTab }));
    }, []);

    const handleFollowUser = useCallback(async (userId, action) => {
        if (!session?.user?.id) return;
        
        try {
            if (action === 'follow') {
                await supabase.from('followers').insert({
                    follower_id: session.user.id,
                    following_id: userId
                });
            } else {
                await supabase.from('followers').delete()
                    .eq('follower_id', session.user.id)
                    .eq('following_id', userId);
            }
            
            // Dispatch custom event for real-time UI updates
            window.dispatchEvent(new CustomEvent('followUpdate', {
                detail: { action, followerId: session.user.id, followingId: userId }
            }));
            
            // Refresh the page data to update UI
            fetchPageData(session.user.id);
            
        } catch (error) {
            console.error('Error updating follow status:', error);
        }
    }, [session, fetchPageData]);

    const handleUnfollowUser = useCallback(userId => {
        handleFollowUser(userId, 'unfollow');
    }, [handleFollowUser]);

    const handleStoryClick = useCallback(storyId => {
        setAppState(prev => ({
            ...prev,
            stories: prev.stories.map(story => 
                story.id === storyId ? { ...story, viewed: true } : story)
        }));
    }, []);

    const handleCreateStory = useCallback(() => {}, []);

    // FIXED: Removed the problematic auth redirect logic
    // The ProtectedRoute wrapper in App.jsx now handles authentication
    useEffect(() => {
        if (session?.user?.id) {
            fetchPageData(session.user.id);
        }
    }, [session?.user?.id, fetchPageData]);

    const handleNewPost = useCallback(newPostData => {
        setAppState(prev => ({
            ...prev,
            posts: [{ ...newPostData, profiles: profile, reactions: { summary: [], sample: [] }, likes_count: 0, comments_count: 0 }, ...prev.posts],
            totalPosts: prev.totalPosts + 1
        }));
    }, [profile]);

    const handleDeletePost = useCallback(deletedPostId => {
        setAppState(prev => ({
            ...prev,
            posts: prev.posts.filter(p => p.id !== deletedPostId),
            totalPosts: Math.max(0, prev.totalPosts - 1)
        }));
    }, []);

    const openDetail = useCallback(grant => {
        setAppState(prev => ({ ...prev, selectedGrant: grant, isDetailModalOpen: true }));
    }, []);

    const closeDetail = useCallback(() => {
        setAppState(prev => ({ ...prev, selectedGrant: null, isDetailModalOpen: false }));
    }, []);

    const handleTrendingGrantClick = useCallback(async grantId => {
        const { data } = await supabase
            .from('grants')
            .select(`*, grant_categories(categories(*)), grant_locations(locations(*))`)
            .eq('id', grantId)
            .single();

        if (data) {
            // Get organization data separately
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
                categories: data.grant_categories?.map(gc => gc.categories) || [],
                locations: data.grant_locations?.map(gl => gl.locations) || [],
                dueDate: data.deadline
            });
        }
    }, [openDetail]);

    const handleSaveGrant = useCallback(async grantId => {
        if (session && grantId) {
            await supabase.from('saved_grants').insert({ user_id: session.user.id, grant_id: grantId });
            fetchPageData(session.user.id);
        }
    }, [session, fetchPageData]);

    const handleUnsaveGrant = useCallback(async grantId => {
        if (session && grantId) {
            await supabase.from('saved_grants').delete().match({ user_id: session.user.id, grant_id: grantId });
            fetchPageData(session.user.id);
        }
    }, [session, fetchPageData]);

    const outletContext = useMemo(() => ({
        ...appContext,
        profile,
        posts,
        handleNewPost,
        handleDeletePost,
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
        socialStats: { totalPosts, totalFollowers, totalFollowing }
    }), [appContext, profile, posts, handleNewPost, handleDeletePost, savedGrants, session, handleSaveGrant, handleUnsaveGrant, openDetail, activeTab, handleTabChange, impactMetrics, stories, handleStoryClick, handleCreateStory, communityMembers, suggestedConnections, handleFollowUser, handleUnfollowUser, totalPosts, totalFollowers, totalFollowing]);

    // FIXED: Let ProtectedRoute handle authentication, simplified loading states
    if (loading || !profile) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading your community hub...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
                <div className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-sm border border-red-200">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button onClick={() => fetchPageData(session.user.id)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="pb-72">
            <ProfileLayout
                profile={profile}
                user={session?.user}
                savedGrants={savedGrants}
                trendingGrants={trendingGrants}
                handleTrendingGrantClick={handleTrendingGrantClick}
                notifications={notifications}
                unreadCount={unreadCount}
                onNotificationPanelToggle={markNotificationsAsRead}
                isLoading={dataLoading}
            >
                <Outlet context={outletContext} />
            </ProfileLayout>
            {isDetailModalOpen && selectedGrant && (
                <GrantDetailModal
                    grant={selectedGrant}
                    isOpen={isDetailModalOpen}
                    onClose={closeDetail}
                    session={session}
                    isSaved={savedGrants.some(g => g.id === selectedGrant.id)}
                    onSave={handleSaveGrant}
                    onUnsave={handleUnsaveGrant}
                />
            )}
        </div>
    );
}