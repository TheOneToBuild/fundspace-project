// MemberProfilePage.jsx - Updated with Follow and Connection Notifications
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { supabase } from './supabaseClient';
import PostCard from './components/PostCard';
import { followUser, unfollowUser, checkFollowStatus } from './utils/followUtils';
import { 
  sendConnectionRequest, 
  getConnectionStatus, 
  acceptConnectionRequest, 
  declineConnectionRequest,
  withdrawConnectionRequest,
  removeConnection,
  getMutualConnectionsCount 
} from './utils/userConnectionsUtils';
import { UserPlus, UserCheck, MapPin, Building, User, Mail, ExternalLink, Users, UserX } from 'lucide-react';

// Enhanced MemberProfileHeader component with connection features
const MemberProfileHeader = ({ 
    member, 
    isFollowing, 
    onFollow, 
    onUnfollow, 
    isCurrentUser, 
    followingInProgress = false,
    currentUserId 
}) => {
    const [followStats, setFollowStats] = useState({
        followersCount: 0,
        followingCount: 0
    });
    const [connectionStats, setConnectionStats] = useState({
        connectionStatus: 'none', // 'none', 'pending', 'accepted', 'declined'
        isRequester: false,
        mutualConnections: 0,
        connectionsCount: 0
    });
    const [statsLoading, setStatsLoading] = useState(true);
    const [connectionLoading, setConnectionLoading] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            if (!member?.id) return;
            
            try {
                setStatsLoading(true);
                
                // Fetch follow stats
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

                // Fetch connection stats if not current user
                if (currentUserId && currentUserId !== member.id) {
                    const [connectionStatusResult, mutualConnectionsResult, connectionsCountResult] = await Promise.all([
                        getConnectionStatus(currentUserId, member.id),
                        getMutualConnectionsCount(currentUserId, member.id),
                        supabase
                            .from('user_connections')
                            .select('*', { count: 'exact', head: true })
                            .or(`and(requester_id.eq.${member.id},status.eq.accepted),and(recipient_id.eq.${member.id},status.eq.accepted)`)
                    ]);

                    setConnectionStats({
                        connectionStatus: connectionStatusResult.status,
                        isRequester: connectionStatusResult.isRequester,
                        mutualConnections: mutualConnectionsResult.count,
                        connectionsCount: connectionsCountResult.count || 0
                    });
                }
            } catch (error) {
                // Handle error silently or with user-friendly message
            } finally {
                setStatsLoading(false);
            }
        };

        fetchStats();
    }, [member?.id, currentUserId]);

    if (!member) return null;

    const handleFollowClick = () => {
        if (isFollowing) {
            onUnfollow(member.id);
        } else {
            onFollow(member.id);
        }
    };

    const handleConnectionAction = async (action) => {
        if (!currentUserId || connectionLoading) return;
        
        setConnectionLoading(true);
        try {
            let result;
            switch (action) {
                case 'connect':
                    result = await sendConnectionRequest(currentUserId, member.id);
                    if (result.success) {
                        setConnectionStats(prev => ({ 
                            ...prev, 
                            connectionStatus: 'pending', 
                            isRequester: true 
                        }));
                    }
                    break;
                    
                case 'accept':
                    result = await acceptConnectionRequest(currentUserId, member.id);
                    if (result.success) {
                        setConnectionStats(prev => ({ 
                            ...prev, 
                            connectionStatus: 'accepted',
                            connectionsCount: prev.connectionsCount + 1
                        }));
                    }
                    break;
                    
                case 'decline':
                    result = await declineConnectionRequest(currentUserId, member.id);
                    if (result.success) {
                        setConnectionStats(prev => ({ 
                            ...prev, 
                            connectionStatus: 'none' 
                        }));
                    }
                    break;
                    
                case 'withdraw':
                    result = await withdrawConnectionRequest(currentUserId, member.id);
                    if (result.success) {
                        setConnectionStats(prev => ({ 
                            ...prev, 
                            connectionStatus: 'none', 
                            isRequester: false 
                        }));
                    }
                    break;
                    
                case 'disconnect':
                    result = await removeConnection(currentUserId, member.id);
                    if (result.success) {
                        setConnectionStats(prev => ({ 
                            ...prev, 
                            connectionStatus: 'none',
                            connectionsCount: Math.max(0, prev.connectionsCount - 1)
                        }));
                    }
                    break;
            }
            
            if (!result.success) {
                // Handle error silently or with user-friendly message
            }
        } catch (error) {
            // Handle error silently or with user-friendly message
        } finally {
            setConnectionLoading(false);
        }
    };

    const getConnectionButton = () => {
        const { connectionStatus, isRequester } = connectionStats;
        
        switch (connectionStatus) {
            case 'none':
                return (
                    <button
                        onClick={() => handleConnectionAction('connect')}
                        disabled={connectionLoading}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Users className="w-4 h-4 mr-2" />
                        {connectionLoading ? 'Connecting...' : 'Connect'}
                    </button>
                );
                
            case 'pending':
                if (isRequester) {
                    return (
                        <button
                            onClick={() => handleConnectionAction('withdraw')}
                            disabled={connectionLoading}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <UserX className="w-4 h-4 mr-2" />
                            {connectionLoading ? 'Withdrawing...' : 'Withdraw'}
                        </button>
                    );
                } else {
                    return (
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleConnectionAction('accept')}
                                disabled={connectionLoading}
                                className="inline-flex items-center px-3 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <UserCheck className="w-4 h-4 mr-1" />
                                {connectionLoading ? 'Accepting...' : 'Accept'}
                            </button>
                            <button
                                onClick={() => handleConnectionAction('decline')}
                                disabled={connectionLoading}
                                className="inline-flex items-center px-3 py-2 text-sm font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <UserX className="w-4 h-4 mr-1" />
                                {connectionLoading ? 'Declining...' : 'Decline'}
                            </button>
                        </div>
                    );
                }
                
            case 'accepted':
                return (
                    <button
                        onClick={() => handleConnectionAction('disconnect')}
                        disabled={connectionLoading}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <UserCheck className="w-4 h-4 mr-2" />
                        {connectionLoading ? 'Disconnecting...' : 'Connected'}
                    </button>
                );
                
            default:
                return null;
        }
    };

    const getMutualConnectionsText = () => {
        const { mutualConnections } = connectionStats;
        if (mutualConnections > 0) {
            return `${mutualConnections} mutual connection${mutualConnections === 1 ? '' : 's'}`;
        }
        return 'Connect to see mutual connections';
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

                            {/* Mutual connections info */}
                            {!isCurrentUser && (
                                <p className="text-sm text-slate-500 mt-3">
                                    {getMutualConnectionsText()}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Right side - Action buttons and stats */}
                    <div className="flex-shrink-0">
                        <div className="flex flex-col items-end space-y-4">
                            {/* Action buttons */}
                            {!isCurrentUser && (
                                <div className="flex flex-col gap-2">
                                    {/* Connection button */}
                                    {getConnectionButton()}
                                    
                                    {/* Follow button */}
                                    {isFollowing ? (
                                        <button
                                            onClick={handleFollowClick}
                                            disabled={followingInProgress}
                                            className="inline-flex items-center px-4 py-2 text-sm font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

                            {/* Stats */}
                            <div className="flex space-x-6 text-sm">
                                <div className="text-center">
                                    <div className="font-semibold text-slate-900">
                                        {statsLoading ? '...' : connectionStats.connectionsCount}
                                    </div>
                                    <div className="text-slate-500">
                                        {connectionStats.connectionsCount === 1 ? 'Connection' : 'Connections'}
                                    </div>
                                </div>
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
            
            // Fetch member profile
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
                // Handle error silently
            } else {
                setPosts(postsData || []);
            }

        } catch (err) {
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
            const result = await checkFollowStatus(currentUserProfile.id, memberIdToUse);
            if (!result.error) {
                setIsFollowing(result.isFollowing);
            }
        } catch (error) {
            // Handle error silently
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
                // Revert optimistic update
                setIsFollowing(false);
            }
        } catch (error) {
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
                // Revert optimistic update
                setIsFollowing(true);
            }
        } catch (error) {
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
                currentUserId={currentUserProfile?.id}
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