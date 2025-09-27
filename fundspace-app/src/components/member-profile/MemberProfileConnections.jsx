// components/member-profile/MemberProfileConnections.jsx - FULLY OPTIMIZED VERSION
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { optimizedSupabaseQuery } from '../../utils/apiRequestOptimizer'; // ✅ CRITICAL IMPORT
import { User, Users, Heart, UserPlus, UserCheck, UserX, Clock } from 'lucide-react';
import { 
    sendConnectionRequest, 
    acceptConnectionRequest, 
    declineConnectionRequest,
    withdrawConnectionRequest,
    removeConnection 
} from '../../utils/userConnectionsUtils';
import apiRequestOptimizer from '../../utils/apiRequestOptimizer';

const MemberProfileConnections = ({ member, loading, currentUserId, isCurrentUser }) => {
    const [activeSubTab, setActiveSubTab] = useState('connections');
    const [connectionsData, setConnectionsData] = useState({
        connections: [],
        followers: [],
        following: [],
        loading: true,
        error: null
    });
    const [connectionActions, setConnectionActions] = useState({}); // Track connection status for each user

    useEffect(() => {
        fetchConnectionsData();
    }, [member?.id]);

    const fetchConnectionsData = async () => {
        if (!member?.id) return;

        try {
            setConnectionsData(prev => ({ ...prev, loading: true }));

            // ✅ OPTIMIZED: Wrap user_connections query
            const optimizedConnectionsQuery = optimizedSupabaseQuery(
                supabase
                    .from('user_connections')
                    .select('id, created_at, requester_id, recipient_id')
                    .eq('status', 'accepted')
                    .or(`requester_id.eq.${member.id},recipient_id.eq.${member.id}`)
                    .order('created_at', { ascending: false }),
                'user_connections_single',
                { userId: member.id, status: 'accepted' }
            );

            // ✅ OPTIMIZED: Wrap followers query
            const optimizedFollowersQuery = optimizedSupabaseQuery(
                supabase
                    .from('followers')
                    .select('id, created_at, follower_id')
                    .eq('following_id', member.id)
                    .order('created_at', { ascending: false }),
                'followers_single',
                { userId: member.id }
            );

            // ✅ OPTIMIZED: Wrap following query
            const optimizedFollowingQuery = optimizedSupabaseQuery(
                supabase
                    .from('followers')
                    .select('id, created_at, following_id')
                    .eq('follower_id', member.id)
                    .order('created_at', { ascending: false }),
                'following_single',
                { userId: member.id }
            );

            // Execute all queries
            const [connectionsResult, followersResult, followingResult] = await Promise.all([
                optimizedConnectionsQuery,
                optimizedFollowersQuery,
                optimizedFollowingQuery
            ]);

            const connectionsData = connectionsResult.data || [];
            const followersData = followersResult.data || [];
            const followingData = followingResult.data || [];

            if (connectionsResult.error || followersResult.error || followingResult.error) {
                throw new Error(
                    connectionsResult.error?.message || 
                    followersResult.error?.message || 
                    followingResult.error?.message
                );
            }

            // Get user IDs to fetch profile details
            const connectionUserIds = connectionsData.map(conn => 
                conn.requester_id === member.id ? conn.recipient_id : conn.requester_id
            );
            const followerUserIds = followersData.map(f => f.follower_id);
            const followingUserIds = followingData.map(f => f.following_id);

            // Fetch all user profile details
            const allUserIds = [...new Set([...connectionUserIds, ...followerUserIds, ...followingUserIds])];
            
            let userProfiles = {};
            if (allUserIds.length > 0) {
                // ✅ CRITICAL FIX: Replace direct profiles query with optimized version
                const optimizedProfilesQuery = optimizedSupabaseQuery(
                    supabase
                        .from('profiles')
                        .select('id, full_name, avatar_url, title, organization_name, location')
                        .in('id', allUserIds),
                    'profiles_single',
                    { userIds: allUserIds }
                );

                const { data: profilesData, error: profilesError } = await optimizedProfilesQuery;

                if (profilesError) {
                    console.error('Error fetching user profiles:', profilesError);
                } else {
                    userProfiles = (profilesData || []).reduce((acc, profile) => {
                        acc[profile.id] = profile;
                        return acc;
                    }, {});
                }
            }

            // Transform connections data
            const connections = connectionsData.map(conn => {
                const otherUserId = conn.requester_id === member.id ? conn.recipient_id : conn.requester_id;
                return {
                    id: conn.id,
                    user: userProfiles[otherUserId] || { id: otherUserId, full_name: 'Unknown User' },
                    created_at: conn.created_at,
                    type: 'connection'
                };
            });

            const followers = followersData.map(follow => ({
                id: follow.id,
                user: userProfiles[follow.follower_id] || { id: follow.follower_id, full_name: 'Unknown User' },
                created_at: follow.created_at,
                type: 'follower'
            }));

            const following = followingData.map(follow => ({
                id: follow.id,
                user: userProfiles[follow.following_id] || { id: follow.following_id, full_name: 'Unknown User' },
                created_at: follow.created_at,
                type: 'following'
            }));

            setConnectionsData({
                connections,
                followers,
                following,
                loading: false,
                error: null
            });

            // If current user is viewing someone else's profile, check connection status for each person
            if (currentUserId && currentUserId !== member.id) {
                await fetchConnectionStatuses([...connections, ...followers, ...following]);
            }

        } catch (error) {
            console.error('Error fetching connections data:', error);
            setConnectionsData(prev => ({
                ...prev,
                loading: false,
                error: error.message
            }));
        }
    };

    // OPTIMIZED: Replace individual API calls with batch call
    const fetchConnectionStatuses = async (allUsers) => {
        // Extract all user IDs we need to check
        const targetUserIds = allUsers
            .filter(item => item.user?.id && item.user.id !== currentUserId)
            .map(item => item.user.id);
        
        if (targetUserIds.length === 0) return;

        try {
            // Use the batch optimizer instead of individual calls in a loop
            const batchStatuses = await apiRequestOptimizer.optimizeSupabaseQuery(
                null, 
                'connection_statuses_batch', 
                { currentUserId, targetUserIds }
            );
            
            setConnectionActions(batchStatuses.data || {});
        } catch (error) {
            console.error('Error fetching batch connection statuses:', error);
            // Fallback to empty statuses
            const fallbackStatuses = {};
            targetUserIds.forEach(userId => {
                fallbackStatuses[userId] = { status: 'none', isRequester: false };
            });
            setConnectionActions(fallbackStatuses);
        }
    };

    const handleConnectionAction = async (targetUserId, action) => {
        if (!currentUserId) return;

        try {
            let result;
            switch (action) {
                case 'connect':
                    result = await sendConnectionRequest(currentUserId, targetUserId);
                    if (result.success) {
                        setConnectionActions(prev => ({
                            ...prev,
                            [targetUserId]: { status: 'pending', isRequester: true }
                        }));
                    }
                    break;
                    
                case 'accept':
                    result = await acceptConnectionRequest(currentUserId, targetUserId);
                    if (result.success) {
                        setConnectionActions(prev => ({
                            ...prev,
                            [targetUserId]: { status: 'accepted', isRequester: false }
                        }));
                        // Refresh data to show new connection
                        await fetchConnectionsData();
                    }
                    break;
                    
                case 'decline':
                    result = await declineConnectionRequest(currentUserId, targetUserId);
                    if (result.success) {
                        setConnectionActions(prev => ({
                            ...prev,
                            [targetUserId]: { status: 'none', isRequester: false }
                        }));
                    }
                    break;
                    
                case 'withdraw':
                    result = await withdrawConnectionRequest(currentUserId, targetUserId);
                    if (result.success) {
                        setConnectionActions(prev => ({
                            ...prev,
                            [targetUserId]: { status: 'none', isRequester: false }
                        }));
                    }
                    break;
                    
                case 'disconnect':
                    result = await removeConnection(currentUserId, targetUserId);
                    if (result.success) {
                        setConnectionActions(prev => ({
                            ...prev,
                            [targetUserId]: { status: 'none', isRequester: false }
                        }));
                        // Refresh data to remove connection
                        await fetchConnectionsData();
                    }
                    break;
            }
        } catch (error) {
            console.error('Connection action error:', error);
        }
    };

    const getConnectionButton = (user) => {
        if (!currentUserId || currentUserId === user.id) return null;

        const status = connectionActions[user.id];
        if (!status) return null;

        switch (status.status) {
            case 'none':
                return (
                    <button
                        onClick={() => handleConnectionAction(user.id, 'connect')}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                    >
                        <UserPlus className="w-3 h-3 mr-1" />
                        Connect
                    </button>
                );
            case 'pending':
                if (status.isRequester) {
                    return (
                        <button
                            onClick={() => handleConnectionAction(user.id, 'withdraw')}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-slate-600 text-white rounded-full hover:bg-slate-700 transition-colors"
                        >
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                        </button>
                    );
                } else {
                    return (
                        <div className="flex gap-1">
                            <button
                                onClick={() => handleConnectionAction(user.id, 'accept')}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
                            >
                                <UserCheck className="w-3 h-3" />
                            </button>
                            <button
                                onClick={() => handleConnectionAction(user.id, 'decline')}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                            >
                                <UserX className="w-3 h-3" />
                            </button>
                        </div>
                    );
                }
            case 'accepted':
                return (
                    <button
                        onClick={() => handleConnectionAction(user.id, 'disconnect')}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
                    >
                        <UserCheck className="w-3 h-3 mr-1" />
                        Connected
                    </button>
                );
            default:
                return null;
        }
    };

    const PersonCard = ({ person, type, showConnectionButton = true }) => (
        <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:shadow-sm transition-shadow">
            <div className="flex items-center space-x-3">
                <Link to={`/profile/${person.user.id}`} className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200">
                        {person.user.avatar_url ? (
                            <img 
                                src={person.user.avatar_url} 
                                alt={person.user.full_name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <User className="w-6 h-6 text-slate-400" />
                            </div>
                        )}
                    </div>
                </Link>
                <div className="min-w-0 flex-1">
                    <Link to={`/profile/${person.user.id}`} className="block">
                        <h4 className="text-sm font-medium text-slate-900 hover:text-blue-600 transition-colors">
                            {person.user.full_name}
                        </h4>
                    </Link>
                    {person.user.title && (
                        <p className="text-xs text-slate-600">{person.user.title}</p>
                    )}
                    {person.user.organization_name && (
                        <p className="text-xs text-slate-500">{person.user.organization_name}</p>
                    )}
                    {person.user.location && (
                        <p className="text-xs text-slate-500">{person.user.location}</p>
                    )}
                </div>
            </div>
            <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400 capitalize">{type}</span>
                {showConnectionButton && getConnectionButton(person.user)}
            </div>
        </div>
    );

    if (loading || connectionsData.loading) {
        return (
            <div className="max-w-7xl mx-auto px-8 py-8">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="text-slate-600 mt-2">Loading connections...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (connectionsData.error) {
        return (
            <div className="max-w-7xl mx-auto px-8 py-8">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="text-center py-12">
                        <div className="text-red-500 text-lg font-medium mb-2">Error</div>
                        <p className="text-slate-600">{connectionsData.error}</p>
                    </div>
                </div>
            </div>
        );
    }

    const { connections, followers, following } = connectionsData;
    const firstName = member.full_name?.split(' ')[0] || member.full_name;

    return (
        <div className="max-w-7xl mx-auto px-8 py-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                {/* Header */}
                <div className="border-b border-slate-200 p-6">
                    <h3 className="text-xl font-bold text-slate-800 mb-2">
                        {isCurrentUser ? 'Your Network' : `${firstName}'s Network`}
                    </h3>
                    <p className="text-slate-600">
                        {isCurrentUser 
                            ? 'Manage your professional connections and network'
                            : `See who ${firstName} is connected with`
                        }
                    </p>
                </div>

                {/* Sub-tabs */}
                <div className="border-b border-slate-200">
                    <nav className="flex px-6">
                        <button
                            onClick={() => setActiveSubTab('connections')}
                            className={`py-4 px-4 text-sm font-medium border-b-2 transition-colors ${
                                activeSubTab === 'connections'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-slate-600 hover:text-slate-800'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                <span>Connections ({connections.length})</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveSubTab('followers')}
                            className={`py-4 px-4 text-sm font-medium border-b-2 transition-colors ${
                                activeSubTab === 'followers'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-slate-600 hover:text-slate-800'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <Heart className="w-4 h-4" />
                                <span>Followers ({followers.length})</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveSubTab('following')}
                            className={`py-4 px-4 text-sm font-medium border-b-2 transition-colors ${
                                activeSubTab === 'following'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-slate-600 hover:text-slate-800'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                <span>Following ({following.length})</span>
                            </div>
                        </button>
                    </nav>
                </div>

                {/* Content */}
                <div className="p-6">
                    {activeSubTab === 'connections' && (
                        <div>
                            {connections.length > 0 ? (
                                <div className="space-y-3">
                                    {connections.map(connection => (
                                        <PersonCard 
                                            key={connection.id} 
                                            person={connection} 
                                            type="connection"
                                            showConnectionButton={!isCurrentUser}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                                        <Users className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <h4 className="text-lg font-medium text-slate-900 mb-2">
                                        {isCurrentUser ? 'No connections yet' : `${firstName} has no connections yet`}
                                    </h4>
                                    <p className="text-slate-600 max-w-md mx-auto">
                                        {isCurrentUser 
                                            ? 'Start building your professional network by connecting with colleagues and industry peers.'
                                            : `${firstName} hasn't made any professional connections yet.`
                                        }
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeSubTab === 'followers' && (
                        <div>
                            {followers.length > 0 ? (
                                <div className="space-y-3">
                                    {followers.map(follower => (
                                        <PersonCard 
                                            key={follower.id} 
                                            person={follower} 
                                            type="follower"
                                            showConnectionButton={!isCurrentUser}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                                        <Heart className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <h4 className="text-lg font-medium text-slate-900 mb-2">
                                        {isCurrentUser ? 'No followers yet' : `${firstName} has no followers yet`}
                                    </h4>
                                    <p className="text-slate-600 max-w-md mx-auto">
                                        {isCurrentUser 
                                            ? 'Share valuable content and engage with the community to attract followers.'
                                            : `${firstName} doesn't have any followers yet.`
                                        }
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeSubTab === 'following' && (
                        <div>
                            {following.length > 0 ? (
                                <div className="space-y-3">
                                    {following.map(follow => (
                                        <PersonCard 
                                            key={follow.id} 
                                            person={follow} 
                                            type="following"
                                            showConnectionButton={!isCurrentUser}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                                        <User className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <h4 className="text-lg font-medium text-slate-900 mb-2">
                                        {isCurrentUser ? 'Not following anyone yet' : `${firstName} isn't following anyone yet`}
                                    </h4>
                                    <p className="text-slate-600 max-w-md mx-auto">
                                        {isCurrentUser 
                                            ? 'Discover and follow interesting people to see their updates in your feed.'
                                            : `${firstName} hasn't started following anyone yet.`
                                        }
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MemberProfileConnections;