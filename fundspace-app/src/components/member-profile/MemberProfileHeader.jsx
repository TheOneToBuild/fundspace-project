// components/member-profile/MemberProfileHeader.jsx - Complete consolidated version with Social Profiles
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { 
  sendConnectionRequest, 
  getConnectionStatus, 
  acceptConnectionRequest, 
  declineConnectionRequest,
  withdrawConnectionRequest,
  removeConnection,
  getMutualConnectionsCount 
} from '../../utils/userConnectionsUtils';
import { UserPlus, UserCheck, User, Users, UserX, Linkedin, Twitter, Globe, ExternalLink } from 'lucide-react';

const MemberProfileHeader = ({ 
    member, 
    isFollowing, 
    onFollow, 
    onUnfollow, 
    isCurrentUser, 
    followingInProgress = false,
    currentUserId,
    onTabChange,
    activeTab = 'activity'
}) => {
    const navigate = useNavigate();
    
    const [followStats, setFollowStats] = useState({
        followersCount: 0,
        followingCount: 0
    });
    const [connectionStats, setConnectionStats] = useState({
        connectionStatus: 'none',
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
                    try {
                        const [connectionStatusResult, mutualConnectionsResult, connectionsCountResult] = await Promise.all([
                            getConnectionStatus(currentUserId, member.id),
                            getMutualConnectionsCount(currentUserId, member.id),
                            supabase
                                .from('user_connections')
                                .select('*', { count: 'exact', head: true })
                                .or(`and(requester_id.eq.${member.id},status.eq.accepted),and(recipient_id.eq.${member.id},status.eq.accepted)`)
                        ]);

                        setConnectionStats({
                            connectionStatus: connectionStatusResult.status || 'none',
                            isRequester: connectionStatusResult.isRequester || false,
                            mutualConnections: mutualConnectionsResult.count || 0,
                            connectionsCount: connectionsCountResult.count || 0
                        });
                    } catch (connectionError) {
                        console.error('Connection stats error:', connectionError);
                        setConnectionStats({
                            connectionStatus: 'none',
                            isRequester: false,
                            mutualConnections: 0,
                            connectionsCount: 0
                        });
                    }
                }
            } catch (error) {
                console.error('Error fetching stats:', error);
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
        } catch (error) {
            console.error('Connection action error:', error);
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
                        className="inline-flex items-center px-6 py-3 text-sm font-medium bg-white border border-slate-300 text-slate-700 rounded-full hover:bg-slate-50 transition-colors disabled:opacity-50"
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
                            className="inline-flex items-center px-6 py-3 text-sm font-medium bg-white border border-slate-300 text-slate-700 rounded-full hover:bg-slate-50 transition-colors disabled:opacity-50"
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
                                className="inline-flex items-center px-4 py-3 text-sm font-medium bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                <UserCheck className="w-4 h-4 mr-1" />
                                {connectionLoading ? 'Accepting...' : 'Accept'}
                            </button>
                            <button
                                onClick={() => handleConnectionAction('decline')}
                                disabled={connectionLoading}
                                className="inline-flex items-center px-4 py-3 text-sm font-medium bg-white border border-slate-300 text-slate-700 rounded-full hover:bg-slate-50 transition-colors disabled:opacity-50"
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
                        className="inline-flex items-center px-6 py-3 text-sm font-medium bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white rounded-full hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 transition-all duration-300 disabled:opacity-50 shadow-lg"
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

    // Handle stats clicks - trigger tab changes instead of navigation
    const handleConnectionsClick = () => {
        if (onTabChange) {
            onTabChange('connections');
        }
    };

    // Helper function to get the display title
    const getDisplayTitle = () => {
        return member.title || null;
    };

    // Helper function to get the display organization info
    const getOrganizationDisplay = () => {
        if (member.organization_name) {
            // Check if we have organization routing information
            const hasOrgId = member.organization_id || member.selected_organization_id;
            const orgSlug = member.organization_slug;
            
            if (hasOrgId) {
                const handleOrgClick = async () => {
                    try {
                        // If we already have a slug, use it
                        if (orgSlug) {
                            navigate(`/organizations/${orgSlug}`);
                            return;
                        }
                        
                        // If no slug, fetch it from the database
                        const { data: orgData, error } = await supabase
                            .from('organizations')
                            .select('slug')
                            .eq('id', hasOrgId)
                            .single();
                        
                        if (!error && orgData?.slug) {
                            navigate(`/organizations/${orgData.slug}`);
                        } else {
                            // Fallback to generic route with ID if no slug found
                            navigate(`/organizations/${hasOrgId}`);
                        }
                    } catch (error) {
                        console.error('Error navigating to organization:', error);
                        // Fallback to search if all else fails
                        navigate(`/organizations?search=${encodeURIComponent(member.organization_name)}`);
                    }
                };
                
                return (
                    <button
                        onClick={handleOrgClick}
                        className="text-blue-600 hover:text-blue-800 hover:underline transition-colors bg-transparent border-none p-0 cursor-pointer font-inherit text-lg leading-relaxed"
                    >
                        {member.organization_name}
                    </button>
                );
            } else {
                // No routing info available, show as plain text
                return <span className="text-lg leading-relaxed">{member.organization_name}</span>;
            }
        }
        return null;
    };

    // Social profiles helper function
    const getSocialProfiles = () => {
        const profiles = [];
        
        if (member.linkedin_url) {
            profiles.push({
                platform: 'LinkedIn',
                url: member.linkedin_url,
                icon: Linkedin,
                color: 'bg-blue-600 hover:bg-blue-700'
            });
        }
        
        if (member.twitter_url) {
            profiles.push({
                platform: 'Twitter/X',
                url: member.twitter_url,
                icon: Twitter,
                color: 'bg-slate-900 hover:bg-slate-800'
            });
        }
        
        if (member.website_url) {
            profiles.push({
                platform: 'Website',
                url: member.website_url,
                icon: Globe,
                color: 'bg-green-600 hover:bg-green-700'
            });
        }
        
        return profiles;
    };

    const socialProfiles = getSocialProfiles();

    // For testing - add some test profiles
    const testSocialProfiles = [
        {
            platform: 'LinkedIn',
            url: 'https://linkedin.com/in/test',
            icon: Linkedin,
            color: 'bg-blue-600 hover:bg-blue-700'
        },
        {
            platform: 'Twitter/X',
            url: 'https://twitter.com/test',
            icon: Twitter,
            color: 'bg-slate-900 hover:bg-slate-800'
        }
    ];

    return (
        <>
            {/* Banner Image Section - Full width with rounded top corners */}
            <div className="relative">
                <div className="h-80 bg-gradient-to-br from-slate-100 via-white to-slate-100 overflow-hidden rounded-t-3xl">
                    {member.banner_image_url ? (
                        <img 
                            src={member.banner_image_url} 
                            alt={`${member.full_name} banner`}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <img 
                            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
                            alt="San Francisco skyline"
                            className="w-full h-full object-cover"
                        />
                    )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent rounded-t-3xl" />
            </div>

            {/* Main Header Content */}
            <div className="bg-white rounded-b-3xl">
                <div className="max-w-7xl mx-auto px-8">
                    <div className="flex items-start gap-6 pb-6">
                        {/* Avatar - overlapping banner, rounded square */}
                        <div className="relative -mt-20">
                            <div className="w-48 h-48 rounded-2xl bg-white border-4 border-white shadow-xl overflow-hidden">
                                {member.avatar_url ? (
                                    <img 
                                        src={member.avatar_url} 
                                        alt={member.full_name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                                        <User className="w-24 h-24 text-slate-400" />
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Profile Info */}
                        <div className="flex-1 py-4">
                            <div className="mb-3">
                                <h1 className="text-4xl font-bold text-slate-900 mb-2">
                                    {member.full_name}
                                </h1>
                                
                                {/* Combined title and organization */}
                                <div className="text-lg text-slate-600 space-y-1">
                                    {(() => {
                                        const title = getDisplayTitle();
                                        const orgDisplay = getOrganizationDisplay();
                                        
                                        if (title && orgDisplay) {
                                            return (
                                                <p>
                                                    {title}, {orgDisplay}
                                                </p>
                                            );
                                        } else if (title) {
                                            return <p>{title}</p>;
                                        } else if (orgDisplay) {
                                            return <p>{orgDisplay}</p>;
                                        } else {
                                            return null;
                                        }
                                    })()}
                                    {member.location && (
                                        <p>Based in {member.location}</p>
                                    )}
                                </div>
                            </div>

                            {member.bio && (
                                <p className="text-slate-700 leading-relaxed mb-4">
                                    {member.bio}
                                </p>
                            )}

                            {!isCurrentUser && (
                                <p className="text-sm text-slate-500 mb-4">
                                    {getMutualConnectionsText()}
                                </p>
                            )}

                            {/* Action buttons */}
                            {!isCurrentUser && currentUserId && member?.id && (
                                <div className="flex gap-3 mb-6">
                                    {/* Follow button */}
                                    {isFollowing ? (
                                        <button
                                            onClick={handleFollowClick}
                                            disabled={followingInProgress}
                                            className="inline-flex items-center px-6 py-3 text-sm font-medium bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white rounded-full hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 transition-all duration-300 disabled:opacity-50 shadow-lg"
                                        >
                                            <UserCheck className="w-4 h-4 mr-2" />
                                            {followingInProgress ? 'Updating...' : 'Following'}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleFollowClick}
                                            disabled={followingInProgress}
                                            className="inline-flex items-center px-6 py-3 text-sm font-medium bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-colors disabled:opacity-50"
                                        >
                                            <UserPlus className="w-4 h-4 mr-2" />
                                            {followingInProgress ? 'Following...' : 'Follow'}
                                        </button>
                                    )}
                                    
                                    {/* Connection button */}
                                    {getConnectionButton()}
                                </div>
                            )}
                        </div>

                        {/* Stats - Show individual breakdown */}
                        <div className="flex-shrink-0 py-4">
                            <div className="flex space-x-6 text-center">
                                <div 
                                    className="cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors"
                                    onClick={handleConnectionsClick}
                                    title={`View ${isCurrentUser ? 'your' : member.full_name + "'s"} connections`}
                                >
                                    <div className="text-2xl font-bold text-slate-900">
                                        {statsLoading ? '...' : connectionStats.connectionsCount}
                                    </div>
                                    <div className="text-sm text-slate-500 font-medium">
                                        {connectionStats.connectionsCount === 1 ? 'Connection' : 'Connections'}
                                    </div>
                                </div>
                                <div 
                                    className="cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors"
                                    onClick={handleConnectionsClick}
                                    title={`View ${isCurrentUser ? 'your' : member.full_name + "'s"} followers`}
                                >
                                    <div className="text-2xl font-bold text-slate-900">
                                        {statsLoading ? '...' : followStats.followersCount}
                                    </div>
                                    <div className="text-sm text-slate-500 font-medium">
                                        {followStats.followersCount === 1 ? 'Follower' : 'Followers'}
                                    </div>
                                </div>
                                <div 
                                    className="cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors"
                                    onClick={handleConnectionsClick}
                                    title={`View who ${isCurrentUser ? 'you follow' : member.full_name + ' follows'}`}
                                >
                                    <div className="text-2xl font-bold text-slate-900">
                                        {statsLoading ? '...' : followStats.followingCount}
                                    </div>
                                    <div className="text-sm text-slate-500 font-medium">Following</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Social Profiles Section - Only show if user has social profiles */}
                    {socialProfiles.length > 0 && (
                        <div className="flex justify-end pb-6">
                            <div className="flex gap-3">
                                {socialProfiles.map((profile, index) => {
                                    const IconComponent = profile.icon;
                                    return (
                                        <a
                                            key={index}
                                            href={profile.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110 hover:shadow-lg ${profile.color}`}
                                            title={`View ${member.full_name}'s ${profile.platform}`}
                                        >
                                            <IconComponent className="w-5 h-5" />
                                        </a>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Tabs Navigation - Updated with 4 tabs */}
                    <div className="border-t border-slate-200">
                        <div className="flex space-x-0 overflow-x-auto">
                            {[
                                { id: 'activity', label: 'Activity', icon: '📝' },
                                { id: 'experience', label: 'Experience', icon: '💼' },
                                { id: 'photos', label: 'Photos', icon: '📸' },
                                { id: 'connections', label: 'Network', icon: '🤝' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => onTabChange && onTabChange(tab.id)}
                                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                                        activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600 bg-blue-50'
                                            : 'border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-300'
                                    }`}
                                >
                                    <span className="text-base">{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default MemberProfileHeader;