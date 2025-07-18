// MemberProfilePage.jsx - Updated with Follow Notifications
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { supabase } from './supabaseClient';
import PostCard from './components/PostCard';
import { followUser, unfollowUser, checkFollowStatus } from './utils/followUtils';
import { UserPlus, UserCheck, MapPin, Building, User, Mail, ExternalLink } from 'lucide-react';

// Inline MemberProfileHeader component with enhanced features
const MemberProfileHeader = ({ 
    member, 
    isFollowing, 
    onFollow, 
    onUnfollow, 
    isCurrentUser, 
    followingInProgress = false 
}) => {
    const [followStats, setFollowStats] = useState({
        followersCount: 0,
        followingCount: 0
    });
    const [statsLoading, setStatsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!member?.id) return;
            
            try {
                setStatsLoading(true);
                
                const [followersResult, followingResult] = await Promise.all([
                    supabase
                        .from('followers')
                        .select('*', { count: 'exact', head: true })
                        .eq('following_id', member.id),
                    supabase
                        .from('followers')
                        .select('*', { count: 'exact', head: true })
                        .eq('follower_id', member.id)
                ]);

                setFollowStats({
                    followersCount: followersResult.count || 0,
                    followingCount: followingResult.count || 0
                });
            } catch (error) {
                console.error('Error fetching follow stats:', error);
            } finally {
                setStatsLoading(false);
            }
        };

        fetchStats();
    }, [member?.id]);

    if (!member) return null;

    const handleFollowClick = () => {
        if (isFollowing) {
            onUnfollow(member.id);
        } else {
            onFollow(member.id);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                    {/* Left side - Profile info */}
                    <div className="flex items-start space-x-4 flex-grow">
                        <div className="flex-shrink-0">
                            {member.avatar_url ? (
                                <img 
                                    src={member.avatar_url} 
                                    alt={member.full_name}
                                    className="w-20 h-20 rounded-full object-cover border-2 border-slate-100"
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center border-2 border-slate-100">
                                    <User className="w-10 h-10 text-slate-400" />
                                </div>
                            )}
                        </div>
                        
                        <div className="flex-grow min-w-0">
                            <h1 className="text-2xl font-bold text-slate-900 mb-2">
                                {member.full_name}
                            </h1>
                            
                            {member.title && (
                                <p className="text-lg text-slate-600 mb-3">{member.title}</p>
                            )}
                            
                            <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                                {member.organization_name && (
                                    <div className="flex items-center">
                                        <Building className="w-4 h-4 mr-1" />
                                        {member.organization_name}
                                    </div>
                                )}
                                
                                {member.location && (
                                    <div className="flex items-center">
                                        <MapPin className="w-4 h-4 mr-1" />
                                        {member.location}
                                    </div>
                                )}
                                
                                {member.email && !isCurrentUser && (
                                    <div className="flex items-center">
                                        <Mail className="w-4 h-4 mr-1" />
                                        <a 
                                            href={`mailto:${member.email}`}
                                            className="hover:text-blue-600 transition-colors"
                                        >
                                            Contact
                                        </a>
                                    </div>
                                )}
                                
                                {member.website && (
                                    <div className="flex items-center">
                                        <ExternalLink className="w-4 h-4 mr-1" />
                                        <a 
                                            href={member.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hover:text-blue-600 transition-colors"
                                        >
                                            Website
                                        </a>
                                    </div>
                                )}
                            </div>

                            {member.bio && (
                                <p className="text-slate-700 mt-4 leading-relaxed">
                                    {member.bio}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Right side - Follow button and stats */}
                    <div className="flex-shrink-0">
                        <div className="flex flex-col items-end space-y-4">
                            {/* Follow button */}
                            {!isCurrentUser && (
                                <div>
                                    {isFollowing ? (
                                        <button
                                            onClick={handleFollowClick}
                                            disabled={followingInProgress}
                                            className="inline-flex items-center px-4 py-2 text-sm font-medium bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <UserCheck className="w-4 h-4 mr-2" />
                                            {followingInProgress ? 'Updating...' : 'Following'}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleFollowClick}
                                            disabled={followingInProgress}
                                            className="inline-flex items-center px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <UserPlus className="w-4 h-4 mr-2" />
                                            {followingInProgress ? 'Following...' : 'Follow'}
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Follow stats */}
                            <div className="flex space-x-6 text-sm">
                                <div className="text-center">
                                    <div className="font-semibold text-slate-900">
                                        {statsLoading ? '...' : followStats.followersCount}
                                    </div>
                                    <div className="text-slate-500">
                                        {followStats.followersCount === 1 ? 'Follower' : 'Followers'}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="font-semibold text-slate-900">
                                        {statsLoading ? '...' : followStats.followingCount}
                                    </div>
                                    <div className="text-slate-500">Following</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function MemberProfilePage() {
    const { memberId, profileId } = useParams(); // Get both possible parameter names
    const { profile: currentUserProfile } = useOutletContext();
    
    // Use whichever parameter is available
    const memberIdToUse = memberId || profileId;
    
    console.log('🔍 MemberProfilePage params:', { memberId, profileId, memberIdToUse });
    
    const [member, setMember] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followingInProgress, setFollowingInProgress] = useState(false);

    const fetchMemberData = useCallback(async () => {
        if (!memberIdToUse) {
            setError('No member ID provided');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            console.log('🔍 Fetching member data for ID:', memberIdToUse);

            // Fetch member profile
            const { data: memberData, error: memberError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', memberIdToUse)
                .single();

            if (memberError) {
                console.error('❌ Error fetching member:', memberError);
                throw new Error(memberError.message);
            }

            if (!memberData) {
                throw new Error('Member not found');
            }

            console.log('✅ Member data fetched:', memberData.full_name);
            setMember(memberData);

            // Fetch member's posts
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

            if (postsError) {
                console.error('⚠️ Error fetching posts:', postsError);
            } else {
                console.log('✅ Posts fetched:', postsData?.length || 0);
                setPosts(postsData || []);
            }

        } catch (err) {
            console.error('💥 Error in fetchMemberData:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [memberIdToUse]);

    const checkFollowingStatus = useCallback(async () => {
        if (!currentUserProfile?.id || !memberIdToUse || currentUserProfile.id === memberIdToUse) {
            setIsFollowing(false);
            return;
        }

        try {
            console.log('🔍 Checking follow status between:', currentUserProfile.id, 'and', memberIdToUse);
            const result = await checkFollowStatus(currentUserProfile.id, memberIdToUse);
            if (!result.error) {
                console.log('✅ Follow status:', result.isFollowing);
                setIsFollowing(result.isFollowing);
            }
        } catch (error) {
            console.error('❌ Error checking follow status:', error);
        }
    }, [currentUserProfile?.id, memberIdToUse]);

    useEffect(() => {
        fetchMemberData();
    }, [fetchMemberData]);

    useEffect(() => {
        checkFollowingStatus();
    }, [checkFollowingStatus]);

    const handleFollow = async (profileIdToFollow) => {
        if (!currentUserProfile || followingInProgress) return;
        
        setFollowingInProgress(true);
        // Optimistic update
        setIsFollowing(true);

        try {
            const result = await followUser(currentUserProfile.id, profileIdToFollow);
            
            if (!result.success) {
                console.error('Error following user:', result.error);
                // Revert optimistic update
                setIsFollowing(false);
            }
        } catch (error) {
            console.error('Error in handleFollow:', error);
            // Revert optimistic update
            setIsFollowing(false);
        } finally {
            setFollowingInProgress(false);
        }
    };

    const handleUnfollow = async (profileIdToUnfollow) => {
        if (!currentUserProfile || followingInProgress) return;
        
        setFollowingInProgress(true);
        // Optimistic update
        setIsFollowing(false);

        try {
            const result = await unfollowUser(currentUserProfile.id, profileIdToUnfollow);
            
            if (!result.success) {
                console.error('Error unfollowing user:', result.error);
                // Revert optimistic update
                setIsFollowing(true);
            }
        } catch (error) {
            console.error('Error in handleUnfollow:', error);
            // Revert optimistic update
            setIsFollowing(true);
        } finally {
            setFollowingInProgress(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center p-10">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-slate-600 mt-2">Loading profile...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center p-10">
                <div className="text-red-500 text-lg font-medium mb-2">Error</div>
                <p className="text-slate-600">{error}</p>
            </div>
        );
    }

    if (!member) {
        return (
            <div className="text-center p-10">
                <div className="text-slate-500 text-lg font-medium mb-2">Member Not Found</div>
                <p className="text-slate-600">The member you're looking for doesn't exist.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <MemberProfileHeader 
                member={member}
                isFollowing={isFollowing}
                onFollow={handleFollow}
                onUnfollow={handleUnfollow}
                isCurrentUser={currentUserProfile?.id === member?.id}
                followingInProgress={followingInProgress}
            />
            
            <div>
                <h3 className="text-xl font-bold text-slate-800 border-b pb-2">
                    {member.full_name.split(' ')[0]}'s Activity
                </h3>

                {posts.length > 0 ? (
                    <div className="space-y-6 mt-6">
                        {posts.map(post => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center mt-6">
                        <p className="text-slate-500">This member hasn't posted anything yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}