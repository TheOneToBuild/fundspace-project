// src/ProfilePage.jsx
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate, Outlet, useOutletContext } from 'react-router-dom';
import ProfileLayout from './components/ProfileLayout.jsx';
import GrantDetailModal from './GrantDetailModal.jsx';
import { LayoutContext } from './App.jsx';

export default function ProfilePage() {
    const { session, profile, loading, notifications, unreadCount, markNotificationsAsRead } = useOutletContext();
    const navigate = useNavigate();
    
    const { setPageBgColor } = useContext(LayoutContext);

    useEffect(() => {
        // Set the grey background for all profile pages
        setPageBgColor('bg-slate-50');
        // Reset to a default when the user navigates away from the profile section
        return () => setPageBgColor('bg-white');
    }, [setPageBgColor]);

    const [trendingGrants, setTrendingGrants] = useState([]);
    const [savedGrants, setSavedGrants] = useState([]);
    const [isDetailModalOpen, setIsDetailModal] = useState(false);
    const [selectedGrant, setSelectedGrant] = useState(null);
    const [posts, setPosts] = useState([]);

    const fetchPageData = useCallback(async (userId) => {
        try {
            const [savedGrantsRes, trendingGrantsRes, postsRes] = await Promise.all([
                supabase.from('saved_grants').select(`id, grant_id, grants(*, funders(name, logo_url, slug))`).eq('user_id', userId).order('created_at', { ascending: false }),
                supabase.rpc('get_trending_grants'),
                supabase.rpc('get_feed_posts', { user_id_param: userId })
            ]);

            if (savedGrantsRes.data) setSavedGrants(savedGrantsRes.data.map(item => ({ ...item.grants, dueDate: item.grants.deadline, save_id: item.id })));
            if (trendingGrantsRes.data) setTrendingGrants(trendingGrantsRes.data);
            if (postsRes.data) setPosts(postsRes.data);
        } catch (error) {
            console.error("Error fetching profile page data:", error);
        }
    }, []);
    
    useEffect(() => {
        if (loading) return;
        if (!session) {
            navigate('/login');
        } else {
            fetchPageData(session.user.id);
        }
    }, [session, loading, navigate, fetchPageData]);
    
    const handleNewPost = (newPostData) => {
        const postWithProfileAndReactions = {
            ...newPostData,
            profiles: profile,
            reactions: { summary: [], sample: [] },
            likes_count: 0,
            comments_count: 0
        };
        setPosts(current => [postWithProfileAndReactions, ...current]);
    };

    const handleDeletePost = (deletedPostId) => {
        setPosts(current => current.filter(p => p.id !== deletedPostId));
    };
    
    const openDetail = (grant) => {
        setSelectedGrant(grant);
        setIsDetailModal(true);
    };

    const closeDetail = () => {
        setSelectedGrant(null);
        setIsDetailModal(false);
    };

    const handleTrendingGrantClick = async (grantId) => {
        const { data } = await supabase.from('grants').select(`*, funders(*), grant_categories(categories(*)), grant_locations(locations(*))`).eq('id', grantId).single();
        if (data) {
            const formattedGrant = { ...data, foundationName: data.funders?.name, categories: data.grant_categories.map(gc => gc.categories), locations: data.grant_locations.map(gl => gl.locations), dueDate: data.deadline };
            openDetail(formattedGrant);
        }
    };

    const handleSaveGrant = async (grantId) => {
        if (!session || !grantId) return;
        await supabase.from('saved_grants').insert({ user_id: session.user.id, grant_id: grantId });
        fetchPageData(session.user.id);
    };
    
    const handleUnsaveGrant = async (grantId) => {
        if (!session || !grantId) return;
        await supabase.from('saved_grants').delete().match({ user_id: session.user.id, grant_id: grantId });
        fetchPageData(session.user.id);
    };

    if (loading || !profile) {
        return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading Profile...</div>;
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
            >
                <Outlet context={{ profile, posts, handleNewPost, handleDeletePost, savedGrants, session, handleSaveGrant, handleUnsaveGrant, openDetail }} />
            </ProfileLayout>
            {isDetailModalOpen && <GrantDetailModal grant={selectedGrant} isOpen={isDetailModalOpen} onClose={closeDetail} session={session} isSaved={savedGrants.some(g => g.id === selectedGrant.id)} onSave={handleSaveGrant} onUnsave={handleUnsaveGrant}/>}
        </div>
    );
}