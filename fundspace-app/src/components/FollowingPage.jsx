// src/components/FollowingPage.jsx - Fixed with pageData batching
import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { UserCheck, ArrowLeft } from 'lucide-react';
import Avatar from './Avatar';
import { unfollowUser } from '../utils/followUtils';
import { usePageDataLoader } from '../hooks/usePageDataLoader'; // ✅ ADD THIS

export default function FollowingPage() {
    const { profile: currentUserProfile, pageData } = useOutletContext();
    const [following, setFollowing] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unfollowingInProgress, setUnfollowingInProgress] = useState(new Set());

    // ✅ ADD: Page data loader for batched API calls
    const { pageData: localPageData, loadConnectionsPageData, clearPageData } = usePageDataLoader();
    
    // Use pageData from context if available, otherwise use local
    const activePageData = pageData || localPageData;

    useEffect(() => {
        if (currentUserProfile?.id) {
            fetchFollowing();
        }
    }, [currentUserProfile?.id]);

    const fetchFollowing = async () => {
        try {
            setLoading(true);
            
            // ✅ OPTIMIZED: Get just the connection data, then batch load profiles
            const { data, error } = await supabase
                .from('followers')
                .select('following_id, created_at')
                .eq('follower_id', currentUserProfile.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching following:', error);
                return;
            }

            if (data && data.length > 0) {
                // ✅ CRITICAL FIX: Load batched profile and organization data
                await loadConnectionsPageData([], data);
                
                // Format the data using batched pageData
                const formattedFollowing = data.map(follow => {
                    const profileData = activePageData?.profiles?.[follow.following_id];
                    const orgMembership = activePageData?.orgMemberships?.[follow.following_id];
                    
                    return {
                        id: follow.following_id,
                        full_name: profileData?.full_name || 'Unknown User',
                        avatar_url: profileData?.avatar_url || null,
                        title: profileData?.title || orgMembership?.role || null,
                        organization_name: orgMembership?.organization?.name || profileData?.organization_name || null,
                        role: orgMembership?.role || profileData?.role || null,
                        followed_at: follow.created_at
                    };
                });

                setFollowing(formattedFollowing);
            } else {
                setFollowing([]);
            }
        } catch (error) {
            console.error('Error in fetchFollowing:', error);
            setFollowing([]);
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
                        
                        // ✅ ENHANCEMENT: Use enhanced profile data from pageData
                        const enhancedUser = {
                            ...user,
                            ...(activePageData?.profiles?.[user.id] || {}),
                        };
                        
                        const orgMembership = activePageData?.orgMemberships?.[user.id];
                        if (orgMembership) {
                            enhancedUser.organization_name = orgMembership.organization?.name || enhancedUser.organization_name;
                            enhancedUser.role = orgMembership.role || enhancedUser.role;
                            enhancedUser.title = orgMembership.role || enhancedUser.title;
                        }
                        
                        return (
                            <div 
                                key={user.id} 
                                className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <Avatar 
                                            src={enhancedUser.avatar_url} 
                                            fullName={enhancedUser.full_name} 
                                            size="lg" 
                                        />
                                        <div className="flex-grow">
                                            <Link 
                                                to={`/profile/members/${user.id}`}
                                                className="text-lg font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                                            >
                                                {enhancedUser.full_name}
                                            </Link>
                                            
                                            {enhancedUser.title && (
                                                <p className="text-sm text-slate-600 mt-1">{enhancedUser.title}</p>
                                            )}
                                            
                                            {enhancedUser.organization_name && (
                                                <p className="text-sm text-slate-500 mt-1">
                                                    {enhancedUser.organization_name}
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