// hooks/useMemberProfile.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { followUser, unfollowUser, checkFollowStatus } from '../utils/followUtils';

export const useMemberProfile = (memberIdToUse, currentUserProfile) => {
    const [member, setMember] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followingInProgress, setFollowingInProgress] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // NEW: Refresh function to trigger data reload
    const refreshMemberData = useCallback(() => {
        setRefreshTrigger(prev => prev + 1);
    }, []);

    const fetchMemberData = useCallback(async () => {
        if (!memberIdToUse) {
            setError('No member ID provided');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            const { data: memberData, error: memberError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', memberIdToUse)
                .single();

            if (memberError) {
                throw new Error(memberError.message);
            }

            if (!memberData) {
                throw new Error('Member not found');
            }

            setMember(memberData);

            const { data: postsData, error: postsError } = await supabase
                .from('posts')
                .select(`
                    *,
                    profiles (
                        id,
                        full_name,
                        avatar_url,
                        title,
                        organization_name
                    )
                `)
                .eq('profile_id', memberIdToUse)
                .order('created_at', { ascending: false });

            if (!postsError) {
                setPosts(postsData || []);
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [memberIdToUse, refreshTrigger]); // Add refreshTrigger as dependency

    const checkFollowingStatus = useCallback(async () => {
        if (!currentUserProfile?.id || !memberIdToUse || currentUserProfile.id === memberIdToUse) {
            setIsFollowing(false);
            return;
        }

        try {
            const result = await checkFollowStatus(currentUserProfile.id, memberIdToUse);
            if (!result.error) {
                setIsFollowing(result.isFollowing);
            }
        } catch (error) {
            console.error('Error checking follow status:', error);
        }
    }, [currentUserProfile?.id, memberIdToUse]);

    const handleFollow = async (profileIdToFollow) => {
        if (!currentUserProfile || followingInProgress) return;
        
        setFollowingInProgress(true);
        setIsFollowing(true);

        try {
            const result = await followUser(currentUserProfile.id, profileIdToFollow);
            
            if (!result.success) {
                setIsFollowing(false);
            }
        } catch (error) {
            setIsFollowing(false);
        } finally {
            setFollowingInProgress(false);
        }
    };

    const handleUnfollow = async (profileIdToUnfollow) => {
        if (!currentUserProfile || followingInProgress) return;
        
        setFollowingInProgress(true);
        setIsFollowing(false);

        try {
            const result = await unfollowUser(currentUserProfile.id, profileIdToUnfollow);
            
            if (!result.success) {
                setIsFollowing(true);
            }
        } catch (error) {
            setIsFollowing(true);
        } finally {
            setFollowingInProgress(false);
        }
    };

    useEffect(() => {
        fetchMemberData();
    }, [fetchMemberData]);

    useEffect(() => {
        checkFollowingStatus();
    }, [checkFollowingStatus]);

    return {
        member,
        posts,
        loading,
        error,
        isFollowing,
        followingInProgress,
        handleFollow,
        handleUnfollow,
        isCurrentUser: currentUserProfile?.id === member?.id,
        refreshMemberData // NEW: Export refresh function
    };
};