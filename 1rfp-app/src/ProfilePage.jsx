// src/ProfilePage.jsx - SOCIAL COMMUNITY HUB VERSION WITH APP CONTEXT FIX
import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate, Outlet, useOutletContext } from 'react-router-dom';
import ProfileLayout from './components/ProfileLayout.jsx';
import GrantDetailModal from './GrantDetailModal.jsx';
import { LayoutContext } from './App.jsx';

export default function ProfilePage() {
    // FIXED: Get the full context from App.jsx
    const appContext = useOutletContext();
    const { session, profile, loading, notifications, unreadCount, markNotificationsAsRead, refreshProfile } = appContext;
    
    const navigate = useNavigate();
    const { setPageBgColor } = useContext(LayoutContext);

    // Enhanced state management for social features
    const [appState, setAppState] = useState({
        // Existing data
        trendingGrants: [],
        savedGrants: [],
        posts: [],
        isDetailModalOpen: false,
        selectedGrant: null,
        dataLoading: false,
        error: null,
        
        // New social features
        communityMembers: [],
        followingUsers: [],
        followerUsers: [],
        impactMetrics: {
            grantsApplied: 0,
            grantsReceived: 0,
            totalFunding: 0,
            communitiesHelped: 0,
            postsShared: 0,
            connectionsGrown: 0
        },
        stories: [],
        communityEvents: [],
        suggestedConnections: [],
        recentActivity: [],
        
        // Social stats
        totalPosts: 0,
        totalFollowers: 0,
        totalFollowing: 0,
        
        // Dashboard state
        activeTab: 'community', // 'community', 'grants', 'organization', 'events', 'analytics'
        showCreatePost: false
    });

    const { 
        trendingGrants, savedGrants, posts, isDetailModalOpen, selectedGrant, 
        dataLoading, error, communityMembers, impactMetrics, stories, activeTab,
        totalPosts, totalFollowers, totalFollowing, suggestedConnections
    } = appState;

    // Enhanced background effect with gradient
    useEffect(() => {
        setPageBgColor('bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20');
        return () => setPageBgColor('bg-white');
    }, [setPageBgColor]);

    // Enhanced data fetching with social features - FIXED VERSION
    const fetchPageData = useCallback(async (userId) => {
        setAppState(prev => ({ ...prev, dataLoading: true, error: null }));
        
        try {
            // Create a function to fetch posts with reactions
            const fetchPostsWithReactions = async () => {
                // Get basic posts first
                const { data: basicPosts, error: postsError } = await supabase
                    .from('posts')
                    .select(`
                        *,
                        profiles!posts_profile_id_fkey(
                            id,
                            full_name,
                            avatar_url,
                            role,
                            title,
                            organization_name
                        )
                    `)
                    .eq('channel', 'hello-world')
                    .order('created_at', { ascending: false });
                
                if (postsError) {
                    console.error('Error fetching posts:', postsError);
                    return { data: [], error: postsError };
                }

                // Add reaction data to each post
                const postsWithReactions = await Promise.all(
                    (basicPosts || []).map(async (post) => {
                        // Get reaction summary
                        const { data: reactionData, error: reactionError } = await supabase
                            .from('post_likes')
                            .select('reaction_type')
                            .eq('post_id', post.id);

                        let reactionSummary = [];
                        if (reactionData && !reactionError) {
                            const counts = {};
                            reactionData.forEach(like => {
                                if (like.reaction_type) {
                                    counts[like.reaction_type] = (counts[like.reaction_type] || 0) + 1;
                                }
                            });
                            
                            reactionSummary = Object.entries(counts).map(([type, count]) => ({
                                type,
                                count
                            }));
                        }

                        // Get basic counts
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
                            reactions: {
                                summary: reactionSummary,
                                sample: []
                            }
                        };
                    })
                );

                return { data: postsWithReactions, error: null };
            };

            const [
                savedGrantsRes, 
                trendingGrantsRes, 
                postsRes, 
                socialStatsRes,
                followersRes,
                followingRes,
                communityMembersRes
            ] = await Promise.all([
                // Existing queries
                supabase
                    .from('saved_grants')
                    .select(`id, grant_id, grants(*, funders(name, logo_url, slug))`)
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false }),
                supabase.rpc('get_trending_grants'),
                fetchPostsWithReactions(), // Use our custom function instead of get_feed_posts
                
                // New social queries
                supabase
                    .from('profiles')
                    .select('id')
                    .eq('id', userId)
                    .single(),
                    
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

            const updatedState = { dataLoading: false };

            // Process existing data
            if (savedGrantsRes.data) {
                updatedState.savedGrants = savedGrantsRes.data.map(item => ({
                    ...item.grants,
                    dueDate: item.grants.deadline,
                    save_id: item.id
                }));
            }

            if (trendingGrantsRes.data) {
                updatedState.trendingGrants = trendingGrantsRes.data;
            }

            if (postsRes.data) {
                updatedState.posts = postsRes.data;
                updatedState.totalPosts = postsRes.data.length;
            }

            // Process social data
            if (followersRes.data) {
                updatedState.followerUsers = followersRes.data.map(f => f.profiles);
                updatedState.totalFollowers = followersRes.data.length;
            }

            if (followingRes.data) {
                updatedState.followingUsers = followingRes.data.map(f => f.profiles);
                updatedState.totalFollowing = followingRes.data.length;
            }

            if (communityMembersRes.data) {
                updatedState.communityMembers = communityMembersRes.data;
                updatedState.suggestedConnections = communityMembersRes.data.slice(0, 5);
            }

            // Mock impact metrics (replace with real data later)
            updatedState.impactMetrics = {
                grantsApplied: Math.floor(Math.random() * 15) + 5,
                grantsReceived: Math.floor(Math.random() * 5) + 1,
                totalFunding: Math.floor(Math.random() * 500000) + 50000,
                communitiesHelped: Math.floor(Math.random() * 10) + 3,
                postsShared: postsRes.data?.length || 0,
                connectionsGrown: (followersRes.data?.length || 0) + (followingRes.data?.length || 0)
            };

            // Mock stories data
            updatedState.stories = [
                { id: 1, type: 'grant_success', title: 'Grant Success', image: null, viewed: false },
                { id: 2, type: 'community_event', title: 'Workshop', image: null, viewed: true },
                { id: 3, type: 'team_update', title: 'Team News', image: null, viewed: false }
            ];

            setAppState(prev => ({ ...prev, ...updatedState }));
        } catch (error) {
            console.error("Error fetching profile page data:", error);
            setAppState(prev => ({ 
                ...prev, 
                dataLoading: false, 
                error: 'Failed to load data. Please try again.' 
            }));
        }
    }, []);

    // Tab switching handler
    const handleTabChange = useCallback((newTab) => {
        setAppState(prev => ({ ...prev, activeTab: newTab }));
    }, []);

    // Social action handlers
    const handleFollowUser = useCallback(async (userId) => {
        try {
            await supabase
                .from('followers')
                .insert({ follower_id: session.user.id, following_id: userId });
            
            // Refresh data to update counts
            fetchPageData(session.user.id);
        } catch (error) {
            console.error('Error following user:', error);
        }
    }, [session, fetchPageData]);

    const handleUnfollowUser = useCallback(async (userId) => {
        try {
            await supabase
                .from('followers')
                .delete()
                .match({ follower_id: session.user.id, following_id: userId });
            
            // Refresh data to update counts
            fetchPageData(session.user.id);
        } catch (error) {
            console.error('Error unfollowing user:', error);
        }
    }, [session, fetchPageData]);

    // Story handlers
    const handleStoryClick = useCallback((storyId) => {
        setAppState(prev => ({
            ...prev,
            stories: prev.stories.map(story => 
                story.id === storyId ? { ...story, viewed: true } : story
            )
        }));
        // Here you would open story viewer modal
        console.log('Opening story:', storyId);
    }, []);

    const handleCreateStory = useCallback(() => {
        // Here you would open story creation modal
        console.log('Opening story creator');
    }, []);

    // Authentication and data loading effect
    useEffect(() => {
        if (loading) return;
        
        if (!session) {
            navigate('/login');
        } else {
            fetchPageData(session.user.id);
        }
    }, [session, loading, navigate, fetchPageData]);
    
    // Existing post handlers (keeping original functionality)
    const handleNewPost = useCallback((newPostData) => {
        const postWithProfileAndReactions = {
            ...newPostData,
            profiles: profile,
            reactions: { summary: [], sample: [] },
            likes_count: 0,
            comments_count: 0
        };
        
        setAppState(prev => ({
            ...prev,
            posts: [postWithProfileAndReactions, ...prev.posts],
            totalPosts: prev.totalPosts + 1
        }));
    }, [profile]);

    const handleDeletePost = useCallback((deletedPostId) => {
        setAppState(prev => ({
            ...prev,
            posts: prev.posts.filter(p => p.id !== deletedPostId),
            totalPosts: Math.max(0, prev.totalPosts - 1)
        }));
    }, []);
    
    // Existing grant modal handlers
    const openDetail = useCallback((grant) => {
        setAppState(prev => ({
            ...prev,
            selectedGrant: grant,
            isDetailModalOpen: true
        }));
    }, []);

    const closeDetail = useCallback(() => {
        setAppState(prev => ({
            ...prev,
            selectedGrant: null,
            isDetailModalOpen: false
        }));
    }, []);

    // Existing grant handlers
    const handleTrendingGrantClick = useCallback(async (grantId) => {
        try {
            const { data } = await supabase
                .from('grants')
                .select(`*, funders(*), grant_categories(categories(*)), grant_locations(locations(*))`)
                .eq('id', grantId)
                .single();
                
            if (data) {
                const formattedGrant = {
                    ...data,
                    foundationName: data.funders?.name,
                    categories: data.grant_categories.map(gc => gc.categories),
                    locations: data.grant_locations.map(gl => gl.locations),
                    dueDate: data.deadline
                };
                openDetail(formattedGrant);
            }
        } catch (error) {
            console.error('Error fetching grant details:', error);
        }
    }, [openDetail]);

    const handleSaveGrant = useCallback(async (grantId) => {
        if (!session || !grantId) return;
        
        try {
            await supabase
                .from('saved_grants')
                .insert({ user_id: session.user.id, grant_id: grantId });
            
            fetchPageData(session.user.id);
        } catch (error) {
            console.error('Error saving grant:', error);
        }
    }, [session, fetchPageData]);
    
    const handleUnsaveGrant = useCallback(async (grantId) => {
        if (!session || !grantId) return;
        
        try {
            await supabase
                .from('saved_grants')
                .delete()
                .match({ user_id: session.user.id, grant_id: grantId });
            
            fetchPageData(session.user.id);
        } catch (error) {
            console.error('Error unsaving grant:', error);
        }
    }, [session, fetchPageData]);

    // FIXED: Enhanced outlet context that merges App context with ProfilePage context
    const outletContext = useMemo(() => ({
        // IMPORTANT: Include ALL the original App.jsx context
        ...appContext,
        
        // ProfilePage-specific context (these may override some App context)
        profile,
        posts,
        handleNewPost,
        handleDeletePost,
        savedGrants,
        session,
        handleSaveGrant,
        handleUnsaveGrant,
        openDetail,
        
        // New social context
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
        socialStats: {
            totalPosts,
            totalFollowers,
            totalFollowing
        }
    }), [
        appContext, // Include the full App context
        profile, posts, handleNewPost, handleDeletePost, savedGrants, session, 
        handleSaveGrant, handleUnsaveGrant, openDetail, activeTab, handleTabChange,
        impactMetrics, stories, handleStoryClick, handleCreateStory, communityMembers,
        suggestedConnections, handleFollowUser, handleUnfollowUser, totalPosts, 
        totalFollowers, totalFollowing
    ]);

    // Loading and error states
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
        <div className="">
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