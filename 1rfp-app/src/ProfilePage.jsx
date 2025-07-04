// src/ProfilePage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate, Outlet } from 'react-router-dom';
import ProfileLayout from './components/ProfileLayout.jsx';
import GrantDetailModal from './GrantDetailModal.jsx';

export default function ProfilePage() {
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [trendingGrants, setTrendingGrants] = useState([]);
    const [savedGrants, setSavedGrants] = useState([]);
    const [isDetailModalOpen, setIsDetailModal] = useState(false);
    const [selectedGrant, setSelectedGrant] = useState(null);
    const [posts, setPosts] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const navigate = useNavigate();

    const fetchLayoutData = useCallback(async (userId) => {
        try {
            const [
                profileRes, 
                savedGrantsRes, 
                trendingGrantsRes, 
                notificationsRes,
                postsRes 
            ] = await Promise.all([
                supabase.from('profiles').select('*').eq('id', userId).single(),
                supabase.from('saved_grants').select(`id, grant_id, grants(*, funders(name, logo_url, slug))`).eq('user_id', userId).order('created_at', { ascending: false }),
                supabase.rpc('get_trending_grants'),
                supabase.from('notifications').select('*, actor_id(*)', { count: 'exact' }).eq('user_id', userId).order('created_at', { ascending: false }),
                supabase.rpc('get_feed_posts', { user_id_param: userId })
            ]);

            if (profileRes.error) throw profileRes.error;

            if (profileRes.data) setProfile(profileRes.data);
            if (savedGrantsRes.data) setSavedGrants(savedGrantsRes.data.map(item => ({ ...item.grants, dueDate: item.grants.deadline, save_id: item.id })));
            if (trendingGrantsRes.data) setTrendingGrants(trendingGrantsRes.data);
            if (notificationsRes.data) {
                setNotifications(notificationsRes.data);
                setUnreadCount(notificationsRes.data.filter(n => !n.is_read).length);
            }
            if (postsRes.data) setPosts(postsRes.data);

        } catch (error) {
            console.error("Error fetching layout data:", error);
        } finally {
            setLoading(false);
        }
    }, []);
    
    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            if (session) {
                await fetchLayoutData(session.user.id);
            } else {
                navigate('/login');
            }
        };
        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (!session) navigate('/login');
        });
        return () => subscription.unsubscribe();
    }, [navigate, fetchLayoutData]);

    // This real-time listener is for notifications, which is still very useful.
    useEffect(() => {
        if (session) {
            const channel = supabase.channel(`profile-notifications:${session.user.id}`);
            channel
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${session.user.id}` }, async (payload) => {
                     const { data: actor } = await supabase.from('profiles').select('*').eq('id', payload.new.actor_id).single();
                    if(actor){
                        const newNotification = { ...payload.new, actor_id: actor };
                        setNotifications(current => [newNotification, ...current]);
                        setUnreadCount(current => current + 1);
                    }
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [session]);
    
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

    const markNotificationsAsRead = async () => {
        if (unreadCount > 0 && session) {
            const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
            if (unreadIds.length === 0) return;
            await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
            setUnreadCount(0);
            setNotifications(current => current.map(n => ({ ...n, is_read: true })));
        }
    };

    const handleSaveGrant = async (grantId) => {
        if (!session || !grantId) return;
        await supabase.from('saved_grants').insert({ user_id: session.user.id, grant_id: grantId });
        fetchLayoutData(session.user.id);
    };
    
    const handleUnsaveGrant = async (grantId) => {
        if (!session || !grantId) return;
        await supabase.from('saved_grants').delete().match({ user_id: session.user.id, grant_id: grantId });
        fetchLayoutData(session.user.id);
    };


    if (loading || !profile) {
        return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading Profile...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-50">
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