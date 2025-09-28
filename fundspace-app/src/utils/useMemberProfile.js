import { useState, useEffect, useCallback } from 'react';
import { getUserProfileComplete } from '../utils/rpcClientFunctions';
import { followUser, unfollowUser, checkFollowStatus } from '../utils/followUtils';

export const useMemberProfile = (memberIdToUse, currentUserProfile) => {
    const [member, setMember] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followingInProgress, setFollowingInProgress] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

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
            
            const profileData = await getUserProfileComplete(
                memberIdToUse,
                currentUserProfile?.id
            );

            if (!profileData) {
                throw new Error('Member not found');
            }

            setMember(profileData);
            setPosts(profileData.posts || []);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [memberIdToUse, currentUserProfile?.id, refreshTrigger]);

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
        refreshMemberData
    };
};