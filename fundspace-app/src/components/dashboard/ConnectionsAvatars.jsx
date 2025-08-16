// src/components/dashboard/ConnectionsAvatars.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, Users, UserCheck } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { getUserConnections } from '../../utils/userConnectionsUtils';
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

    // Get the user data regardless of whether it's a connection or following
    const userData = person.user || person;

    return (
        <div 
            className="flex-shrink-0 flex flex-col items-center space-y-2 cursor-pointer group"
            onClick={handleClick}
        >
            <div className="relative">
                {/* Avatar with gradient ring for recent posts or different colors for different types */}
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
                
                {/* Indicator icons */}
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
            
            {/* Name */}
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
    const [connections, setConnections] = useState([]);
    const [following, setFollowing] = useState([]);
    const [recentPostUsers, setRecentPostUsers] = useState(new Set());
    const [loading, setLoading] = useState(true);

    // Fetch user following
    const fetchFollowing = async (userId) => {
        try {
            const { data: followingData, error } = await supabase
                .from('followers')
                .select(`
                    id,
                    following_id,
                    created_at,
                    following:following_id (
                        id,
                        full_name,
                        avatar_url,
                        title,
                        organization_name
                    )
                `)
                .eq('follower_id', userId)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) {
                console.error('Error fetching following:', error);
                return [];
            }

            // Transform the data to match our interface
            return followingData?.map(follow => ({
                id: follow.id,
                user: follow.following,
                followed_at: follow.created_at
            })) || [];
        } catch (error) {
            console.error('Error in fetchFollowing:', error);
            return [];
        }
    };

    useEffect(() => {
        const fetchAllData = async () => {
            if (!currentUserProfile?.id) return;
            
            try {
                setLoading(true);
                
                // Fetch connections and following in parallel
                const [connectionsResult, followingResult] = await Promise.all([
                    getUserConnections(currentUserProfile.id, 20),
                    fetchFollowing(currentUserProfile.id)
                ]);
                
                const connectionsData = connectionsResult.connections || [];
                const followingData = followingResult || [];

                setConnections(connectionsData);
                setFollowing(followingData);

                // Combine all user IDs to check for recent posts
                const allUserIds = [
                    ...connectionsData.map(conn => conn.user.id),
                    ...followingData.map(follow => follow.user.id)
                ];

                if (allUserIds.length > 0) {
                    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
                    
                    const { data: recentPosts } = await supabase
                        .from('posts')
                        .select('profile_id')
                        .in('profile_id', allUserIds)
                        .gte('created_at', twentyFourHoursAgo);
                    
                    if (recentPosts) {
                        const recentPostUserIds = new Set(recentPosts.map(post => post.profile_id));
                        setRecentPostUsers(recentPostUserIds);
                    }
                }
            } catch (error) {
                console.error('Error fetching network data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [currentUserProfile?.id]);

    const scrollConnections = (direction) => {
        const container = document.getElementById('network-avatars-scroll');
        if (container) {
            container.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: 'smooth' });
        }
    };

    const handleViewAllConnections = () => {
        navigate('/profile/connections');
    };

    const handleViewAllFollowing = () => {
        navigate('/profile/following');
    };

    const handleFindPeople = () => {
        navigate('/profile/members');
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

    // Combine and deduplicate network members (connections take priority over following)
    const allNetworkMembers = [];
    const seenUserIds = new Set();

    // First, add all connections
    connections.forEach(conn => {
        const userId = conn.user.id;
        if (!seenUserIds.has(userId)) {
            allNetworkMembers.push({ ...conn, type: 'connection' });
            seenUserIds.add(userId);
        }
    });

    // Then, add following relationships only if user is not already a connection
    following.forEach(follow => {
        const userId = follow.user.id;
        if (!seenUserIds.has(userId)) {
            allNetworkMembers.push({ ...follow, type: 'following' });
            seenUserIds.add(userId);
        }
    });

    // Don't show the section if user has no network
    if (allNetworkMembers.length === 0) {
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

    // Sort network members to show those with recent posts first, then by type
    const sortedNetworkMembers = [...allNetworkMembers].sort((a, b) => {
        const aUserId = a.user ? a.user.id : a.id;
        const bUserId = b.user ? b.user.id : b.id;
        const aHasRecentPost = recentPostUsers.has(aUserId);
        const bHasRecentPost = recentPostUsers.has(bUserId);
        
        // First sort by recent posts
        if (aHasRecentPost && !bHasRecentPost) return -1;
        if (!aHasRecentPost && bHasRecentPost) return 1;
        
        // Then sort by type (connections first)
        if (a.type === 'connection' && b.type === 'following') return -1;
        if (a.type === 'following' && b.type === 'connection') return 1;
        
        return 0;
    });

    const activeCount = recentPostUsers.size;
    const connectionsCount = connections.length;
    const followingCount = following.length;
    const uniqueFollowingCount = following.filter(follow => 
        !connections.some(conn => conn.user.id === follow.user.id)
    ).length;

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-slate-800">Your Network</h3>
                    <p className="text-sm text-slate-600">
                        {connectionsCount > 0 && uniqueFollowingCount > 0 ? (
                            <>
                                {connectionsCount} {connectionsCount === 1 ? 'connection' : 'connections'} • {uniqueFollowingCount} following
                                {activeCount > 0 && (
                                    <span className="text-blue-600 font-medium ml-2">
                                        • {activeCount} active recently
                                    </span>
                                )}
                            </>
                        ) : connectionsCount > 0 ? (
                            <>
                                {connectionsCount} {connectionsCount === 1 ? 'connection' : 'connections'}
                                {activeCount > 0 && (
                                    <span className="text-blue-600 font-medium ml-2">
                                        • {activeCount} active recently
                                    </span>
                                )}
                            </>
                        ) : uniqueFollowingCount > 0 ? (
                            <>
                                Following {uniqueFollowingCount}
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
                    {allNetworkMembers.length > 6 && (
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
                        {connectionsCount > 0 && (
                            <button
                                onClick={handleViewAllConnections}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors px-2 py-1 bg-blue-50 rounded"
                            >
                                All Connections
                            </button>
                        )}
                        {uniqueFollowingCount > 0 && (
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
                {sortedNetworkMembers.map(networkMember => {
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