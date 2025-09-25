// src/ProfilePage.jsx - Optimized with Batching for All Profile Data
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from './supabaseClient';
import { Outlet, useOutletContext } from 'react-router-dom';
import PublicPageLayout from './components/PublicPageLayout.jsx';
import GrantDetailModal from './GrantDetailModal.jsx';
import globalDataManager from './utils/globalDataManager';

// Enhanced profile data manager for batching all profile-related queries
class ProfileDataManager {
    constructor() {
        this.cache = new Map();
        this.CACHE_TTL = 30000; // 30 seconds
    }

    getCacheKey(type, params) {
        return `profile-${type}-${JSON.stringify(params)}`;
    }

    isValidCache(cacheItem) {
        return cacheItem && (Date.now() - cacheItem.timestamp) < this.CACHE_TTL;
    }

    setCache(key, data) {
        this.cache.set(key, { data, timestamp: Date.now() });
    }

    getCache(key) {
        const item = this.cache.get(key);
        return this.isValidCache(item) ? item.data : null;
    }

    // Batch load all profile page data
    async loadAllProfileData(userId) {
        const cacheKey = this.getCacheKey('all-data', { userId });
        const cached = this.getCache(cacheKey);
        if (cached) return cached;

        try {
            // Execute all profile queries in parallel
            const [
                followersResult,
                followingResult,
                postsResult,
                savedGrantsResult,
                trendingGrantsResult,
                communityMembersResult
            ] = await Promise.all([
                // Get followers with profiles
                supabase
                    .from('followers')
                    .select('follower_id, created_at')
                    .eq('following_id', userId),
                
                // Get following with profiles  
                supabase
                    .from('followers')
                    .select('following_id, created_at')
                    .eq('follower_id', userId),
                
                // Get user's posts
                supabase
                    .from('posts')
                    .select('*, profiles!posts_profile_id_fkey(id, full_name, avatar_url, role, title, organization_name)')
                    .eq('profile_id', userId)
                    .order('created_at', { ascending: false }),
                
                // Get saved grants
                supabase
                    .from('saved_grants')
                    .select('id, grant_id, created_at')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false }),
                
                // Get trending grants
                supabase.rpc('get_trending_grants'),
                
                // Get community members for suggestions
                supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url, title, organization_name')
                    .neq('id', userId)
                    .limit(10)
            ]);

            // Collect all user IDs for batch profile loading
            const userIds = new Set();
            followersResult.data?.forEach(f => userIds.add(f.follower_id));
            followingResult.data?.forEach(f => userIds.add(f.following_id));

            // Batch load profile data for all users
            const profilesData = userIds.size > 0 
                ? await globalDataManager.getProfiles(Array.from(userIds))
                : {};

            // Batch load organization memberships
            const orgMembershipsData = userIds.size > 0 
                ? await globalDataManager.getOrganizationMemberships(Array.from(userIds))
                : {};

            // Process followers with enhanced profile data
            const followers = followersResult.data?.map(follower => {
                const userProfile = profilesData[follower.follower_id] || { 
                    id: follower.follower_id, 
                    full_name: 'Unknown User' 
                };
                const orgMembership = orgMembershipsData[follower.follower_id];
                
                return {
                    ...userProfile,
                    organization_name: orgMembership?.organization?.name || userProfile.organization_name,
                    organization_type: orgMembership?.organization?.type || userProfile.organization_type,
                    role: orgMembership?.role || userProfile.role,
                    followed_at: follower.created_at
                };
            }) || [];

            // Process following with enhanced profile data
            const following = followingResult.data?.map(follow => {
                const userProfile = profilesData[follow.following_id] || { 
                    id: follow.following_id, 
                    full_name: 'Unknown User' 
                };
                const orgMembership = orgMembershipsData[follow.following_id];
                
                return {
                    ...userProfile,
                    organization_name: orgMembership?.organization?.name || userProfile.organization_name,
                    organization_type: orgMembership?.organization?.type || userProfile.organization_type,
                    role: orgMembership?.role || userProfile.role,
                    followed_at: follow.created_at
                };
            }) || [];

            // Process posts - use global data manager for post likes
            let posts = postsResult.data || [];
            if (posts.length > 0) {
                const postIds = posts.map(p => p.id);
                const postLikesData = await globalDataManager.getPostLikes(postIds);
                
                posts = posts.map(post => ({
                    ...post,
                    likes_count: postLikesData[post.id]?.likes_count || 0,
                    comments_count: post.comments_count || 0,
                    reactions: {
                        summary: postLikesData[post.id]?.reaction_summary || [],
                        sample: []
                    }
                }));
            }

            // Process saved grants
            let savedGrants = [];
            if (savedGrantsResult.data?.length > 0) {
                const grantIds = savedGrantsResult.data.map(sg => sg.grant_id);
                const { data: grantsData } = await supabase
                    .from('grants')
                    .select('*')
                    .in('id', grantIds);

                if (grantsData?.length > 0) {
                    const orgIds = [...new Set(grantsData.map(g => g.organization_id).filter(Boolean))];
                    let orgsData = [];
                    
                    if (orgIds.length > 0) {
                        const { data: organizationsData } = await supabase
                            .from('organizations')
                            .select('id, name, image_url, slug')
                            .in('id', orgIds);
                        orgsData = organizationsData || [];
                    }

                    savedGrants = savedGrantsResult.data.map(savedGrant => {
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
                }
            }

            const result = {
                followers,
                following,
                posts,
                savedGrants,
                trendingGrants: trendingGrantsResult.data || [],
                communityMembers: communityMembersResult.data || [],
                socialStats: {
                    totalFollowers: followers.length,
                    totalFollowing: following.length,
                    totalPosts: posts.length
                },
                impactMetrics: {
                    grantsApplied: Math.floor(Math.random() * 15) + 5,
                    grantsReceived: Math.floor(Math.random() * 5) + 1,
                    totalFunding: Math.floor(Math.random() * 500000) + 50000,
                    communitiesHelped: Math.floor(Math.random() * 10) + 3,
                    postsShared: posts.length,
                    connectionsGrown: followers.length + following.length
                },
                stories: [
                    { id: 1, type: 'grant_success', title: 'Grant Success', image: null, viewed: false },
                    { id: 2, type: 'community_event', title: 'Workshop', image: null, viewed: true },
                    { id: 3, type: 'team_update', title: 'Team News', image: null, viewed: false }
                ]
            };

            this.setCache(cacheKey, result);
            return result;

        } catch (error) {
            console.error('Error loading profile data:', error);
            return {
                followers: [],
                following: [],
                posts: [],
                savedGrants: [],
                trendingGrants: [],
                communityMembers: [],
                socialStats: { totalFollowers: 0, totalFollowing: 0, totalPosts: 0 },
                impactMetrics: { grantsApplied: 0, grantsReceived: 0, totalFunding: 0, communitiesHelped: 0, postsShared: 0, connectionsGrown: 0 },
                stories: []
            };
        }
    }

    clearCache() {
        this.cache.clear();
    }
}

const profileDataManager = new ProfileDataManager();

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

    const { trendingGrants, savedGrants, posts, isDetailModalOpen, selectedGrant, dataLoading, error, communityMembers, impactMetrics, stories, activeTab, totalPosts, totalFollowers, totalFollowing, suggestedConnections, followerUsers, followingUsers } = appState;

    // Optimized data fetching with batching
    const fetchPageData = useCallback(async (userId) => {
        if (!userId) return;
        
        setAppState(prev => ({ ...prev, dataLoading: true, error: null }));
        
        try {
            const data = await profileDataManager.loadAllProfileData(userId);
            
            setAppState(prev => ({
                ...prev,
                dataLoading: false,
                savedGrants: data.savedGrants,
                trendingGrants: data.trendingGrants,
                posts: data.posts,
                totalPosts: data.socialStats.totalPosts,
                followerUsers: data.followers,
                totalFollowers: data.socialStats.totalFollowers,
                followingUsers: data.following,
                totalFollowing: data.socialStats.totalFollowing,
                communityMembers: data.communityMembers,
                suggestedConnections: data.communityMembers.slice(0, 5),
                impactMetrics: data.impactMetrics,
                stories: data.stories
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
            
            window.dispatchEvent(new CustomEvent('followUpdate', {
                detail: { action, followerId: session.user.id, followingId: userId }
            }));
            
            // Clear cache and reload data
            profileDataManager.clearCache();
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
        
        // Clear cache to include new post
        profileDataManager.clearCache();
    }, [profile]);

    const handleDeletePost = useCallback(deletedPostId => {
        setAppState(prev => ({
            ...prev,
            posts: prev.posts.filter(p => p.id !== deletedPostId),
            totalPosts: Math.max(0, prev.totalPosts - 1)
        }));
        
        // Clear cache to reflect deletion
        profileDataManager.clearCache();
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
            profileDataManager.clearCache();
            fetchPageData(session.user.id);
        }
    }, [session, fetchPageData]);

    const handleUnsaveGrant = useCallback(async grantId => {
        if (session && grantId) {
            await supabase.from('saved_grants').delete().match({ user_id: session.user.id, grant_id: grantId });
            profileDataManager.clearCache();
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
        socialStats: { totalPosts, totalFollowers, totalFollowing },
        followerUsers,
        followingUsers
    }), [appContext, profile, posts, handleNewPost, handleDeletePost, savedGrants, session, handleSaveGrant, handleUnsaveGrant, openDetail, activeTab, handleTabChange, impactMetrics, stories, handleStoryClick, handleCreateStory, communityMembers, suggestedConnections, handleFollowUser, handleUnfollowUser, totalPosts, totalFollowers, totalFollowing, followerUsers, followingUsers]);

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
                    <button onClick={() => fetchPageData(session.user.id)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
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
                        isSaved={savedGrants.some(g => g.id === selectedGrant.id)}
                        onSave={handleSaveGrant}
                        onUnsave={handleUnsaveGrant}
                    />
                )}
            </div>
        </PublicPageLayout>
    );
}