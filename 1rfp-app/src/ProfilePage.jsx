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
    const [followedIds, setFollowedIds] = useState(new Set());
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const navigate = useNavigate();

    const fetchLayoutData = useCallback(async (userId) => {
        const [
            profileRes, savedGrantsRes, trendingGrantsRes, 
            notificationsRes, followedRes
        ] = await Promise.all([
            supabase.from('profiles').select('*').eq('id', userId).single(),
            supabase.from('saved_grants').select(`id, grant_id, grants(*, funders(name, logo_url, slug))`).eq('user_id', userId).order('created_at', { ascending: false }),
            supabase.rpc('get_trending_grants'),
            supabase.from('notifications').select('*, actor_id(*)', { count: 'exact' }).eq('user_id', userId).order('created_at', { ascending: false }),
            supabase.from('followers').select('following_id').eq('follower_id', userId)
        ]);

        if (profileRes.data) setProfile(profileRes.data);
        if (savedGrantsRes.data) setSavedGrants(savedGrantsRes.data.map(item => ({ ...item.grants, save_id: item.id })));
        if (trendingGrantsRes.data) setTrendingGrants(trendingGrantsRes.data);
        if (notificationsRes.data) {
            setNotifications(notificationsRes.data);
            setUnreadCount(notificationsRes.data.filter(n => !n.is_read).length);
        }
        
        const initialFollowedIds = new Set((followedRes.data || []).map(item => item.following_id));
        const profileIdsToFetch = [userId, ...Array.from(initialFollowedIds)];
        setFollowedIds(initialFollowedIds);

        const { data: postsRes } = await supabase.from('posts').select(`*, profiles (*)`).in('profile_id', profileIdsToFetch).order('created_at', { ascending: false });
        if (postsRes) setPosts(postsRes);
        
        setLoading(false);
    }, []);
    
    // These handlers remain unchanged
    const handleSaveGrant = async (grantId) => { /* ... */ };
    const handleUnsaveGrant = async (grantId) => { /* ... */ };
    const openDetail = (grant) => { setSelectedGrant(grant); setIsDetailModal(true); };
    const closeDetail = () => { setSelectedGrant(null); setIsDetailModal(false); };
    const handleTrendingGrantClick = async (grantId) => { /* ... */ };
    const handleDeletePost = (deletedPostId) => { setPosts(current => current.filter(p => p.id !== deletedPostId)); };
    const handleNewPost = (newPost) => { setPosts(current => [{ ...newPost, profiles: profile }, ...current]); };
    const markNotificationsAsRead = async () => { /* ... */ };

    useEffect(() => {
        const getSession = async () => {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            if (currentSession) {
                setSession(currentSession);
                await fetchLayoutData(currentSession.user.id);
            } else {
                navigate('/login');
            }
        };
        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
            setSession(newSession);
            if (!newSession) navigate('/login');
        });
        return () => subscription.unsubscribe();
    }, [navigate, fetchLayoutData]);

    // --- FINAL FIX in useEffect ---
    useEffect(() => {
        if (!session) return;

        // The channel is created here
        const channel = supabase.channel(`profile:${session.user.id}`);

        // All listeners are attached
        channel
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, async (payload) => {
                const authorId = payload.new.profile_id;
                const relevantIds = new Set(followedIds);
                relevantIds.add(session.user.id);
                if (relevantIds.has(authorId) && authorId !== session.user.id) {
                    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', authorId).single();
                    if (profileData) setPosts(current => [{ ...payload.new, profiles: profileData }, ...current]);
                }
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, async (payload) => {
                const { data: actor } = await supabase.from('profiles').select('*').eq('id', payload.new.actor_id).single();
                if (actor) {
                    setNotifications(current => [{ ...payload.new, actor_id: actor }, ...current]);
                    setUnreadCount(current => current + 1);
                }
            })
            .subscribe();

        // The cleanup function uses the correct method to remove the channel
        return () => {
            supabase.removeChannel(channel);
        };
    }, [session, followedIds]); // Dependency array is now correct

    if (loading || !profile) {
        return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
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
            {isDetailModalOpen && selectedGrant && <GrantDetailModal grant={selectedGrant} isOpen={isDetailModalOpen} onClose={closeDetail} session={session} isSaved={savedGrants.some(g => g.id === selectedGrant.id)} onSave={handleSaveGrant} onUnsave={handleUnsaveGrant}/>}
        </div>
    );
}