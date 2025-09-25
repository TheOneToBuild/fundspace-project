import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { UserCheck, ArrowLeft } from 'lucide-react';
import Avatar from './Avatar';
import { unfollowUser } from '../utils/followUtils';
import { usePageDataLoader } from '../hooks/usePageDataLoader';

export default function FollowingPage() {
    const { profile: currentUserProfile, pageData } = useOutletContext();
    const [following, setFollowing] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unfollowingInProgress, setUnfollowingInProgress] = useState(new Set());

    const { pageData: localPageData, loadConnectionsPageData, clearPageData } = usePageDataLoader();
    const activePageData = pageData || localPageData;

    useEffect(() => {
        if (currentUserProfile?.id) {
            fetchFollowing();
        }
    }, [currentUserProfile?.id]);

    const fetchFollowing = async () => {
        try {
            setLoading(true);
            
            // ✅ CORRECT: follower_id and following_id are the correct column names
            const { data, error } = await supabase
                .from('followers')
                .select('following_id, created_at')
                .eq('follower_id', currentUserProfile.id) // ✅ CORRECT: follower_id
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching following:', error);
                return;
            }

            if (data && data.length > 0) {
                await loadConnectionsPageData([], data);
                
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
        
        setFollowing(prevFollowing => 
            prevFollowing.filter(person => person.id !== profileIdToUnfollow)
        );

        try {
            const result = await unfollowUser(currentUserProfile.id, profileIdToUnfollow);
            
            if (!result.success) {
                console.error('Error unfollowing user:', result.error);
                fetchFollowing();
            }
        } catch (error) {
            console.error('Error in handleUnfollow:', error);
            fetchFollowing();
        } finally {
            setUnfollowingInProgress(prev => {
                const newSet = new Set(prev);
                newSet.delete(profileIdToUnfollow);
                return newSet;
            });
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
                        {loading ? 'Loading...' : `You are following ${following.length} ${following.length === 1 ? 'person' : 'people'}`}
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-slate-600 mt-2">Loading...</p>
                </div>
            ) : following.length > 0 ? (
                <div className="space-y-3">
                    {following.map(person => {
                        const isUnfollowingInProgress = unfollowingInProgress.has(person.id);
                        
                        const enhancedPerson = {
                            ...person,
                            ...(activePageData?.profiles?.[person.id] || {}),
                        };
                        
                        const orgMembership = activePageData?.orgMemberships?.[person.id];
                        if (orgMembership) {
                            enhancedPerson.organization_name = orgMembership.organization?.name || enhancedPerson.organization_name;
                            enhancedPerson.role = orgMembership.role || enhancedPerson.role;
                            enhancedPerson.title = orgMembership.role || enhancedPerson.title;
                        }
                        
                        return (
                            <div 
                                key={person.id} 
                                className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <Avatar 
                                            src={enhancedPerson.avatar_url} 
                                            fullName={enhancedPerson.full_name} 
                                            size="lg" 
                                        />
                                        <div className="flex-grow">
                                            <Link 
                                                to={`/profile/members/${person.id}`}
                                                className="text-lg font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                                            >
                                                {enhancedPerson.full_name}
                                            </Link>
                                            
                                            {enhancedPerson.title && (
                                                <p className="text-sm text-slate-600 mt-1">{enhancedPerson.title}</p>
                                            )}
                                            
                                            {enhancedPerson.organization_name && (
                                                <p className="text-sm text-slate-500 mt-1">
                                                    {enhancedPerson.organization_name}
                                                </p>
                                            )}
                                            
                                            <p className="text-xs text-slate-400 mt-1">
                                                Following since {formatDate(person.followed_at)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex-shrink-0">
                                        <button
                                            onClick={() => handleUnfollow(person.id)}
                                            disabled={isUnfollowingInProgress}
                                            className="inline-flex items-center px-3 py-2 text-sm font-medium bg-green-100 text-green-700 rounded-lg hover:bg-red-100 hover:text-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <UserCheck className="w-4 h-4 mr-1" />
                                            {isUnfollowingInProgress ? 'Unfollowing...' : 'Following'}
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
                    <p className="text-slate-600 max-w-md mx-auto">
                        Discover interesting people in the community and follow them to see their updates in your feed!
                    </p>
                    <Link 
                        to="/profile/members"
                        className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Discover Members
                    </Link>
                </div>
            )}
        </div>
    );
}