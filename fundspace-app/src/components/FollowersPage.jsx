// src/components/FollowersPage.jsx - Fixed with pageData batching
import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { UserCheck, UserPlus, ArrowLeft } from 'lucide-react';
import Avatar from './Avatar';
import { followUser, unfollowUser } from '../utils/followUtils';
import { usePageDataLoader } from '../hooks/usePageDataLoader'; // ✅ ADD THIS

export default function FollowersPage() {
    const { profile: currentUserProfile, pageData } = useOutletContext();
    const [followers, setFollowers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [followedIds, setFollowedIds] = useState(new Set());
    const [followingInProgress, setFollowingInProgress] = useState(new Set());

    // ✅ ADD: Page data loader for batched API calls
    const { pageData: localPageData, loadConnectionsPageData, clearPageData } = usePageDataLoader();
    
    // Use pageData from context if available, otherwise use local
    const activePageData = pageData || localPageData;

    useEffect(() => {
        if (currentUserProfile?.id) {
            fetchFollowers();
            fetchFollowedUsers();
        }
    }, [currentUserProfile?.id]);

    const fetchFollowers = async () => {
        try {
            setLoading(true);
            
            // ✅ OPTIMIZED: Get just the connection data, then batch load profiles
            const { data, error } = await supabase
                .from('followers')
                .select('follower_id, created_at')
                .eq('following_id', currentUserProfile.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching followers:', error);
                return;
            }

            if (data && data.length > 0) {
                // ✅ CRITICAL FIX: Load batched profile and organization data
                await loadConnectionsPageData(data, []);
                
                // Format the data using batched pageData
                const formattedFollowers = data.map(follow => {
                    const profileData = activePageData?.profiles?.[follow.follower_id];
                    const orgMembership = activePageData?.orgMemberships?.[follow.follower_id];
                    
                    return {
                        id: follow.follower_id,
                        full_name: profileData?.full_name || 'Unknown User',
                        avatar_url: profileData?.avatar_url || null,
                        title: profileData?.title || orgMembership?.role || null,
                        organization_name: orgMembership?.organization?.name || profileData?.organization_name || null,
                        role: orgMembership?.role || profileData?.role || null,
                        followed_at: follow.created_at
                    };
                });

                setFollowers(formattedFollowers);
            } else {
                setFollowers([]);
            }
        } catch (error) {
            console.error('Error in fetchFollowers:', error);
            setFollowers([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchFollowedUsers = async () => {
        try {
            // Get list of users that current user is following
            const { data, error } = await supabase
                .from('followers')
                .select('following_id')
                .eq('follower_id', currentUserProfile.id);

            if (error) {
                console.error('Error fetching followed users:', error);
                return;
            }

            const followedSet = new Set(data.map(f => f.following_id));
            setFollowedIds(followedSet);
        } catch (error) {
            console.error('Error in fetchFollowedUsers:', error);
        }
    };

    const handleFollow = async (profileIdToFollow) => {
        if (!currentUserProfile || followingInProgress.has(profileIdToFollow)) return;
        
        // Optimistic update
        setFollowedIds(prev => new Set(prev).add(profileIdToFollow));
        setFollowingInProgress(prev => new Set(prev).add(profileIdToFollow));

        try {
            const result = await followUser(currentUserProfile.id, profileIdToFollow);
            
            if (!result.success) {
                console.error('Error following user:', result.error);
                // Revert optimistic update
                setFollowedIds(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(profileIdToFollow);
                    return newSet;
                });
            }
        } catch (error) {
            console.error('Error in handleFollow:', error);
            // Revert optimistic update
            setFollowedIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(profileIdToFollow);
                return newSet;
            });
        } finally {
            setFollowingInProgress(prev => {
                const newSet = new Set(prev);
                newSet.delete(profileIdToFollow);
                return newSet;
            });
            
            // Clear cache when follow state changes
            clearPageData();
        }
    };

    const handleUnfollow = async (profileIdToUnfollow) => {
        if (!currentUserProfile || followingInProgress.has(profileIdToUnfollow)) return;
        
        // Optimistic update
        setFollowedIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(profileIdToUnfollow);
            return newSet;
        });
        setFollowingInProgress(prev => new Set(prev).add(profileIdToUnfollow));

        try {
            const result = await unfollowUser(currentUserProfile.id, profileIdToUnfollow);
            
            if (!result.success) {
                console.error('Error unfollowing user:', result.error);
                // Revert optimistic update
                setFollowedIds(prev => new Set(prev).add(profileIdToUnfollow));
            }
        } catch (error) {
            console.error('Error in handleUnfollow:', error);
            // Revert optimistic update
            setFollowedIds(prev => new Set(prev).add(profileIdToUnfollow));
        } finally {
            setFollowingInProgress(prev => {
                const newSet = new Set(prev);
                newSet.delete(profileIdToUnfollow);
                return newSet;
            });
            
            // Clear cache when follow state changes
            clearPageData();
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-4">
                <Link 
                    to="/profile" 
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Back to Profile"
                >
                    <ArrowLeft size={20} className="text-slate-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Your Followers</h1>
                    <p className="text-slate-600">
                        {loading ? 'Loading...' : `${followers.length} ${followers.length === 1 ? 'person' : 'people'} following you`}
                    </p>
                </div>
            </div>

            {/* Followers List */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-slate-600 mt-2">Loading your followers...</p>
                </div>
            ) : followers.length > 0 ? (
                <div className="space-y-3">
                    {followers.map(follower => {
                        const isFollowing = followedIds.has(follower.id);
                        const isFollowingInProgress = followingInProgress.has(follower.id);
                        
                        // ✅ ENHANCEMENT: Use enhanced profile data from pageData
                        const enhancedFollower = {
                            ...follower,
                            ...(activePageData?.profiles?.[follower.id] || {}),
                        };
                        
                        const orgMembership = activePageData?.orgMemberships?.[follower.id];
                        if (orgMembership) {
                            enhancedFollower.organization_name = orgMembership.organization?.name || enhancedFollower.organization_name;
                            enhancedFollower.role = orgMembership.role || enhancedFollower.role;
                            enhancedFollower.title = orgMembership.role || enhancedFollower.title;
                        }
                        
                        return (
                            <div 
                                key={follower.id} 
                                className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <Avatar 
                                            src={enhancedFollower.avatar_url} 
                                            fullName={enhancedFollower.full_name} 
                                            size="lg" 
                                        />
                                        <div className="flex-grow">
                                            <Link 
                                                to={`/profile/members/${follower.id}`}
                                                className="text-lg font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                                            >
                                                {enhancedFollower.full_name}
                                            </Link>
                                            
                                            {enhancedFollower.title && (
                                                <p className="text-sm text-slate-600 mt-1">{enhancedFollower.title}</p>
                                            )}
                                            
                                            {enhancedFollower.organization_name && (
                                                <p className="text-sm text-slate-500 mt-1">
                                                    {enhancedFollower.organization_name}
                                                </p>
                                            )}
                                            
                                            <p className="text-xs text-slate-400 mt-1">
                                                Followed you {formatDate(follower.followed_at)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Follow Back Button */}
                                    <div className="flex-shrink-0">
                                        {isFollowing ? (
                                            <button
                                                onClick={() => handleUnfollow(follower.id)}
                                                disabled={isFollowingInProgress}
                                                className="inline-flex items-center px-3 py-2 text-sm font-medium bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <UserCheck className="w-4 h-4 mr-1" />
                                                {isFollowingInProgress ? 'Updating...' : 'Following'}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleFollow(follower.id)}
                                                disabled={isFollowingInProgress}
                                                className="inline-flex items-center px-3 py-2 text-sm font-medium bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <UserPlus className="w-4 h-4 mr-1" />
                                                {isFollowingInProgress ? 'Following...' : 'Follow Back'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserPlus className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No followers yet</h3>
                    <p className="text-slate-600 max-w-md mx-auto">
                        Start engaging with the community by posting updates and connecting with other members. 
                        People will follow you to see your updates!
                    </p>
                </div>
            )}
        </div>
    );
}