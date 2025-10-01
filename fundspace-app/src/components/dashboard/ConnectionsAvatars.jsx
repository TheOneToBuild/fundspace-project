import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, Users, UserCheck } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { getDashboardData } from '../../utils/rpcClientFunctions';
import globalDataManager from '../../utils/globalDataManager';
import PropTypes from 'prop-types';

const ConnectionAvatar = ({ person, hasRecentPost, type, onClick }) => {
    const navigate = useNavigate();
    
    const handleClick = () => {
        if (onClick) {
            onClick(person);
        } else {
            navigate(`/profile/members/${person.user ? person.user.id : person.id}`);
        }
    };

    const userData = person.user || person;

    return (
        <div 
            className="flex-shrink-0 flex flex-col items-center space-y-2 cursor-pointer group"
            onClick={handleClick}
        >
            <div className="relative">
                <div className={`p-0.5 rounded-full ${hasRecentPost 
                    ? 'bg-gradient-to-tr from-pink-500 via-purple-500 to-blue-500' 
                    : type === 'connection' 
                        ? 'bg-gradient-to-tr from-green-400 to-green-600' 
                        : 'bg-gradient-to-tr from-blue-400 to-blue-600'
                }`}>
                    <div className="p-0.5 bg-white rounded-full">
                        <img
                            src={userData.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.full_name || 'User')}&background=6366f1&color=ffffff`}
                            alt={userData.full_name || 'User'}
                            className="w-14 h-14 rounded-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                    </div>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white border-2 border-white rounded-full flex items-center justify-center">
                    {hasRecentPost ? (
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    ) : type === 'connection' ? (
                        <Users size={8} className="text-green-600" />
                    ) : (
                        <UserCheck size={8} className="text-blue-600" />
                    )}
                </div>
            </div>
            <div className="text-center max-w-[80px]">
                <span className="text-xs text-slate-700 font-medium truncate block group-hover:text-blue-600 transition-colors">
                    {userData.full_name?.split(' ')[0] || 'User'}
                </span>
                <span className="text-xs text-slate-500 truncate block">
                    {type === 'connection' ? 'Connected' : 'Following'}
                </span>
            </div>
        </div>
    );
};

const ConnectionsAvatars = ({ currentUserProfile }) => {
    const navigate = useNavigate();
    const [networkMembers, setNetworkMembers] = useState([]);
    const [recentPostUsers, setRecentPostUsers] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        connectionsCount: 0,
        followingCount: 0,
        uniqueFollowingCount: 0
    });

    useEffect(() => {
        const loadNetworkData = async () => {
            if (!currentUserProfile?.id) return;
            try {
                setLoading(true);

                const dashboardData = await getDashboardData(currentUserProfile.id);

                // ✅ FIX: Add defensive checks
                if (!dashboardData) {
                    setNetworkMembers([]);
                    setStats({ connectionsCount: 0, followingCount: 0, uniqueFollowingCount: 0 });
                    setLoading(false);
                    return;
                }

                const connections = dashboardData?.connections || [];
                const following = dashboardData?.following || [];
                const profiles = dashboardData?.profiles || {};
                
                const connectionUserIds = new Set();
                const followingUserIds = new Set();
                
                // ✅ FIX: Add null checks for connection data
                connections.forEach(conn => {
                    if (!conn) return;
                    const otherUserId = conn.requester_id === currentUserProfile.id 
                        ? conn.recipient_id 
                        : conn.requester_id;
                    if (otherUserId) {
                        connectionUserIds.add(otherUserId);
                    }
                });
                
                // ✅ FIX: Add null checks for following data
                following.forEach(follow => {
                    if (follow?.following_id) {
                        followingUserIds.add(follow.following_id);
                    }
                });

                const allUserIds = [...new Set([...connectionUserIds, ...followingUserIds])];

                if (allUserIds.length === 0) {
                    setNetworkMembers([]);
                    setStats({ connectionsCount: 0, followingCount: 0, uniqueFollowingCount: 0 });
                    setLoading(false);
                    return;
                }

                let usersWithRecentPosts = new Set();
                try {
                    const postsData = await globalDataManager.getPostsForUsers(allUserIds, 50);
                    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                    usersWithRecentPosts = new Set(
                        Object.entries(postsData)
                            .filter(([userId, posts]) => 
                                posts.some(p => new Date(p.created_at) >= twentyFourHoursAgo)
                            )
                            .map(([userId]) => userId)
                    );
                } catch (error) {
                    console.error('Error checking recent posts:', error);
                }

                const networkData = [];
                const seenUserIds = new Set();

                connectionUserIds.forEach(userId => {
                    const profile = profiles[userId];
                    if (profile && !seenUserIds.has(userId)) {
                        const connectionInfo = connections.find(c => 
                            (c.requester_id === userId || c.recipient_id === userId)
                        );
                        networkData.push({
                            type: 'connection',
                            id: `connection-${userId}`,
                            user: profile,
                            connected_at: connectionInfo?.updated_at || connectionInfo?.created_at
                        });
                        seenUserIds.add(userId);
                    }
                });

                followingUserIds.forEach(userId => {
                    const profile = profiles[userId];
                    if (profile && !seenUserIds.has(userId)) {
                        const followInfo = following.find(f => f.following_id === userId);
                        networkData.push({
                            type: 'following',
                            id: `following-${userId}`,
                            user: profile,
                            followed_at: followInfo?.created_at
                        });
                        seenUserIds.add(userId);
                    }
                });

                const sortedMembers = networkData.sort((a, b) => {
                    const aUserId = a.user.id;
                    const bUserId = b.user.id;
                    const aHasRecent = usersWithRecentPosts.has(aUserId);
                    const bHasRecent = usersWithRecentPosts.has(bUserId);
                    if (aHasRecent && !bHasRecent) return -1;
                    if (!aHasRecent && bHasRecent) return 1;
                    if (a.type === 'connection' && b.type === 'following') return -1;
                    if (a.type === 'following' && b.type === 'connection') return 1;
                    const aDate = new Date(a.connected_at || a.followed_at || 0);
                    const bDate = new Date(b.connected_at || b.followed_at || 0);
                    return bDate - aDate;
                });

                setNetworkMembers(sortedMembers);
                setRecentPostUsers(usersWithRecentPosts);

                const connectionsCount = connectionUserIds.size;
                const followingCount = followingUserIds.size;
                const uniqueFollowingCount = followingUserIds.size - 
                    [...followingUserIds].filter(id => connectionUserIds.has(id)).length;

                setStats({ connectionsCount, followingCount, uniqueFollowingCount });

            } catch (error) {
                console.error('Error loading network data:', error);
                setNetworkMembers([]);
                setStats({ connectionsCount: 0, followingCount: 0, uniqueFollowingCount: 0 });
            } finally {
                setLoading(false);
            }
        };
        loadNetworkData();
    }, [currentUserProfile?.id]);

    const scrollConnections = (direction) => {
        const container = document.getElementById('network-avatars-scroll');
        if (container) {
            container.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: 'smooth' });
        }
    };

    const handleViewAllConnections = () => {
        navigate('/profile/connections?tab=connections');
    };

    const handleViewAllFollowing = () => {
        navigate('/profile/connections?tab=discover');
    };

    const handleFindPeople = () => {
        navigate('/profile/connections?tab=discover');
    };

    if (loading) {
        return (
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">Your Network</h3>
                </div>
                <div className="flex space-x-4 overflow-hidden">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="flex-shrink-0 flex flex-col items-center space-y-2 animate-pulse">
                            <div className="w-14 h-14 bg-slate-200 rounded-full"></div>
                            <div className="w-12 h-3 bg-slate-200 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (networkMembers.length === 0) {
        return (
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">Your Network</h3>
                    <button
                        onClick={handleFindPeople}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                        Find People
                    </button>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <Plus size={24} className="text-slate-400" />
                    </div>
                    <h4 className="text-lg font-medium text-slate-600 mb-2">Build Your Network</h4>
                    <p className="text-slate-500 text-sm mb-4">
                        Connect with other nonprofits, funders, and change-makers in your community
                    </p>
                    <button
                        onClick={handleFindPeople}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Find People to Connect
                    </button>
                </div>
            </div>
        );
    }

    const activeCount = recentPostUsers.size;

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-slate-800">Your Network</h3>
                    <p className="text-sm text-slate-600">
                        {stats.connectionsCount > 0 && stats.uniqueFollowingCount > 0 ? (
                            <>
                                {stats.connectionsCount} {stats.connectionsCount === 1 ? 'connection' : 'connections'} • {stats.uniqueFollowingCount} following
                                {activeCount > 0 && (
                                    <span className="text-blue-600 font-medium ml-2">
                                        • {activeCount} active recently
                                    </span>
                                )}
                            </>
                        ) : stats.connectionsCount > 0 ? (
                            <>
                                {stats.connectionsCount} {stats.connectionsCount === 1 ? 'connection' : 'connections'}
                                {activeCount > 0 && (
                                    <span className="text-blue-600 font-medium ml-2">
                                        • {activeCount} active recently
                                    </span>
                                )}
                            </>
                        ) : stats.uniqueFollowingCount > 0 ? (
                            <>
                                Following {stats.uniqueFollowingCount}
                                {activeCount > 0 && (
                                    <span className="text-blue-600 font-medium ml-2">
                                        • {activeCount} active recently
                                    </span>
                                )}
                            </>
                        ) : null}
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    {networkMembers.length > 6 && (
                        <div className="flex space-x-1">
                            <button
                                onClick={() => scrollConnections('left')}
                                className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <button
                                onClick={() => scrollConnections('right')}
                                className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    )}
                    <div className="flex space-x-1">
                        {stats.connectionsCount > 0 && (
                            <button
                                onClick={handleViewAllConnections}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors px-2 py-1 bg-blue-50 rounded"
                            >
                                All Connections
                            </button>
                        )}
                        {stats.uniqueFollowingCount > 0 && (
                            <button
                                onClick={handleViewAllFollowing}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors px-2 py-1 bg-blue-50 rounded"
                            >
                                Following
                            </button>
                        )}
                        <button
                            onClick={handleFindPeople}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors px-2 py-1 bg-blue-50 rounded"
                        >
                            Find More
                        </button>
                    </div>
                </div>
            </div>
            <div id="network-avatars-scroll" className="flex space-x-4 overflow-x-auto scrollbar-hide pb-2">
                {networkMembers.map(networkMember => {
                    const userId = networkMember.user ? networkMember.user.id : networkMember.id;
                    return (
                        <ConnectionAvatar
                            key={`${networkMember.type}-${networkMember.id}`}
                            person={networkMember}
                            hasRecentPost={recentPostUsers.has(userId)}
                            type={networkMember.type}
                        />
                    );
                })}
            </div>
        </div>
    );
};

ConnectionsAvatars.propTypes = {
    currentUserProfile: PropTypes.object
};

ConnectionAvatar.propTypes = {
    person: PropTypes.object.isRequired,
    hasRecentPost: PropTypes.bool.isRequired,
    type: PropTypes.oneOf(['connection', 'following']).isRequired,
    onClick: PropTypes.func
};

export default ConnectionsAvatars;