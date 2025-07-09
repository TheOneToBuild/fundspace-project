// src/ProfilePage.jsx - OPTIMIZED VERSION
import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate, Outlet, useOutletContext } from 'react-router-dom';
import ProfileLayout from './components/ProfileLayout.jsx';
import GrantDetailModal from './GrantDetailModal.jsx';
import { LayoutContext } from './App.jsx';

export default function ProfilePage() {
    const { session, profile, loading, notifications, unreadCount, markNotificationsAsRead } = useOutletContext();
    const navigate = useNavigate();
    const { setPageBgColor } = useContext(LayoutContext);

    // Consolidated state with better organization
    const [appState, setAppState] = useState({
        trendingGrants: [],
        savedGrants: [],
        posts: [],
        isDetailModalOpen: false,
        selectedGrant: null,
        dataLoading: false,
        error: null
    });

    const { trendingGrants, savedGrants, posts, isDetailModalOpen, selectedGrant, dataLoading, error } = appState;

    // Memoized background effect
    useEffect(() => {
        setPageBgColor('bg-slate-50');
        return () => setPageBgColor('bg-white');
    }, [setPageBgColor]);

    // Optimized data fetching with error handling and loading states
    const fetchPageData = useCallback(async (userId) => {
        setAppState(prev => ({ ...prev, dataLoading: true, error: null }));
        
        try {
            const [savedGrantsRes, trendingGrantsRes, postsRes] = await Promise.all([
                supabase
                    .from('saved_grants')
                    .select(`id, grant_id, grants(*, funders(name, logo_url, slug))`)
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false }),
                supabase.rpc('get_trending_grants'),
                supabase.rpc('get_feed_posts', { user_id_param: userId })
            ]);

            const updatedState = { dataLoading: false };

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
            }

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
    
    // Authentication and data loading effect
    useEffect(() => {
        if (loading) return;
        
        if (!session) {
            navigate('/login');
        } else {
            fetchPageData(session.user.id);
        }
    }, [session, loading, navigate, fetchPageData]);
    
    // Optimized post handlers with immediate UI updates
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
            posts: [postWithProfileAndReactions, ...prev.posts]
        }));
    }, [profile]);

    const handleDeletePost = useCallback((deletedPostId) => {
        setAppState(prev => ({
            ...prev,
            posts: prev.posts.filter(p => p.id !== deletedPostId)
        }));
    }, []);
    
    // Grant modal handlers
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

    // Optimized trending grant click with better data transformation
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

    // Optimized save/unsave handlers with optimistic updates
    const handleSaveGrant = useCallback(async (grantId) => {
        if (!session || !grantId) return;
        
        try {
            await supabase
                .from('saved_grants')
                .insert({ user_id: session.user.id, grant_id: grantId });
            
            // Optimistic update - refresh data
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
            
            // Optimistic update - refresh data
            fetchPageData(session.user.id);
        } catch (error) {
            console.error('Error unsaving grant:', error);
        }
    }, [session, fetchPageData]);

    // Memoized outlet context to prevent unnecessary re-renders
    const outletContext = useMemo(() => ({
        profile,
        posts,
        handleNewPost,
        handleDeletePost,
        savedGrants,
        session,
        handleSaveGrant,
        handleUnsaveGrant,
        openDetail
    }), [profile, posts, handleNewPost, handleDeletePost, savedGrants, session, handleSaveGrant, handleUnsaveGrant, openDetail]);

    // Loading and error states
    if (loading || !profile) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading Profile...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center bg-white p-8 rounded-xl shadow-sm border border-red-200">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button 
                        onClick={() => fetchPageData(session.user.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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