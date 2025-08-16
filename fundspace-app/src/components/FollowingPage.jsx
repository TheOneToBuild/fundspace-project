// src/components/FollowingPage.jsx
import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { UserCheck, ArrowLeft } from 'lucide-react';
import Avatar from './Avatar';
import { unfollowUser } from '../utils/followUtils';

export default function FollowingPage() {
    const { profile: currentUserProfile } = useOutletContext();
    const [following, setFollowing] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unfollowingInProgress, setUnfollowingInProgress] = useState(new Set());

    useEffect(() => {
        if (currentUserProfile?.id) {
            fetchFollowing();
        }
    }, [currentUserProfile?.id]);

    const fetchFollowing = async () => {
        try {
            setLoading(true);
            
            // Get all users that the current user is following
            const { data, error } = await supabase
                .from('followers')
                .select(`
                    following_id,
                    created_at,
                    profiles!followers_following_id_fkey(
                        id,
                        full_name,
                        avatar_url,
                        title,
                        organization_name,
                        role
                    )
                `)
                .eq('follower_id', currentUserProfile.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching following:', error);
                return;
            }

            // Format the data for easier use
            const formattedFollowing = data?.map(follow => ({
                id: follow.profiles.id,
                full_name: follow.profiles.full_name,
                avatar_url: follow.profiles.avatar_url,
                title: follow.profiles.title,
                organization_name: follow.profiles.organization_name,
                role: follow.profiles.role,
                followed_at: follow.created_at
            })) || [];

            setFollowing(formattedFollowing);
        } catch (error) {
            console.error('Error in fetchFollowing:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUnfollow = async (profileIdToUnfollow) => {
        if (!currentUserProfile || unfollowingInProgress.has(profileIdToUnfollow)) return;
        
        setUnfollowingInProgress(prev => new Set(prev).add(profileIdToUnfollow));

        try {
            const result = await unfollowUser(currentUserProfile.id, profileIdToUnfollow);
            
            if (result.success) {
                // Remove from local state
                setFollowing(prev => prev.filter(user => user.id !== profileIdToUnfollow));
            } else {
                console.error('Error unfollowing user:', result.error);
            }
        } catch (error) {
            console.error('Error in handleUnfollow:', error);
        } finally {
            setUnfollowingInProgress(prev => {
                const newSet = new Set(prev);
                newSet.delete(profileIdToUnfollow);
                return newSet;
            });
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
                    <h1 className="text-2xl font-bold text-slate-900">Following</h1>
                    <p className="text-slate-600">
                        {loading ? 'Loading...' : `You're following ${following.length} ${following.length === 1 ? 'person' : 'people'}`}
                    </p>
                </div>
            </div>

            {/* Following List */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-slate-600 mt-2">Loading who you're following...</p>
                </div>
            ) : following.length > 0 ? (
                <div className="space-y-3">
                    {following.map(user => {
                        const isUnfollowing = unfollowingInProgress.has(user.id);
                        
                        return (
                            <div 
                                key={user.id} 
                                className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <Avatar 
                                            src={user.avatar_url} 
                                            fullName={user.full_name} 
                                            size="lg" 
                                        />
                                        <div className="flex-grow">
                                            <Link 
                                                to={`/profile/members/${user.id}`}
                                                className="text-lg font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                                            >
                                                {user.full_name}
                                            </Link>
                                            
                                            {user.title && (
                                                <p className="text-sm text-slate-600 mt-1">{user.title}</p>
                                            )}
                                            
                                            {user.organization_name && (
                                                <p className="text-sm text-slate-500 mt-1">
                                                    {user.organization_name}
                                                </p>
                                            )}
                                            
                                            <p className="text-xs text-slate-400 mt-1">
                                                You followed {formatDate(user.followed_at)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Unfollow Button */}
                                    <div className="flex-shrink-0">
                                        <button
                                            onClick={() => handleUnfollow(user.id)}
                                            disabled={isUnfollowing}
                                            className="inline-flex items-center px-3 py-2 text-sm font-medium bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <UserCheck className="w-4 h-4 mr-1" />
                                            {isUnfollowing ? 'Unfollowing...' : 'Following'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserCheck className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">Not following anyone yet</h3>
                    <p className="text-slate-600 max-w-md mx-auto mb-4">
                        Discover and follow other community members to see their updates in your feed.
                    </p>
                    <Link 
                        to="/profile/members"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Explore Members
                    </Link>
                </div>
            )}
        </div>
    );
}