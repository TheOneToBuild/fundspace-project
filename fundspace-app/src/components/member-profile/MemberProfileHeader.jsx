import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  sendConnectionRequest, 
  acceptConnectionRequest, 
  declineConnectionRequest,
  withdrawConnectionRequest,
  removeConnection,
} from '../../utils/userConnectionsUtils';
import { getUserSocialConnections, getBatchConnectionStatus } from '../../utils/rpcClientFunctions';
import { UserPlus, UserCheck, User, Users, UserX, Linkedin, Twitter, Globe } from 'lucide-react';

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
                const [socialData, connectionData] = await Promise.all([
                    getUserSocialConnections(member.id, 'both'),
                    currentUserId ? getBatchConnectionStatus(currentUserId, [member.id]) : null
                ]);
                setFollowStats({
                    followersCount: socialData?.stats?.followers_count || 0,
                    followingCount: socialData?.stats?.following_count || 0
                });
                if (connectionData && currentUserId) {
                    const status = connectionData.connections?.[member.id] || { status: 'none', isRequester: false };
                    setConnectionStats({
                        connectionStatus: status.status,
                        isRequester: status.isRequester,
                        mutualConnections: status.mutualConnections || 0,
                        connectionsCount: socialData?.stats?.connections_count || 0
                    });
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

    const handleConnectionsClick = () => {
        if (onTabChange) {
            onTabChange('connections');
        }
    };

    const getDisplayTitle = () => {
        return member.title || null;
    };

    const getOrganizationDisplay = () => {
        if (member.organization_name) {
            const hasOrgId = member.organization_id || member.selected_organization_id;
            const orgSlug = member.organization_slug;
            if (hasOrgId) {
                const handleOrgClick = async () => {
                    try {
                        if (orgSlug) {
                            navigate(`/organizations/${orgSlug}`);
                            return;
                        }
                        navigate(`/organizations/${hasOrgId}`);
                    } catch (error) {
                        console.error('Error navigating to organization:', error);
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
                return <span className="text-lg leading-relaxed">{member.organization_name}</span>;
            }
        }
        return null;
    };

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

    return (
        <>
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

            <div className="bg-white rounded-b-3xl">
                <div className="max-w-7xl mx-auto px-8">
                    <div className="flex items-start gap-6 pb-6">
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
                        
                        <div className="flex-1 py-4">
                            <div className="mb-3">
                                <h1 className="text-4xl font-bold text-slate-900 mb-2">
                                    {member.full_name}
                                </h1>
                                
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

                            {!isCurrentUser && currentUserId && member?.id && (
                                <div className="flex gap-3 mb-6">
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
                                    
                                    {getConnectionButton()}
                                </div>
                            )}
                        </div>

                        <div className="flex-shrink-0 py-4">
                            <div className="flex space-x-6 text-center">
                                <div 
                                    className="cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors"
                                    onClick={handleConnectionsClick}
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
                                >
                                    <div className="text-2xl font-bold text-slate-900">
                                        {statsLoading ? '...' : followStats.followingCount}
                                    </div>
                                    <div className="text-sm text-slate-500 font-medium">Following</div>
                                </div>
                            </div>
                        </div>
                    </div>

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