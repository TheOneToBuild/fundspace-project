import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  sendConnectionRequest, 
  acceptConnectionRequest, 
  declineConnectionRequest,
  withdrawConnectionRequest,
  removeConnection,
} from '../../utils/userConnectionsUtils';
import { getMemberProfileComplete } from '../../utils/rpcClientFunctions';
import { UserPlus, UserCheck, User, Users, UserX, Linkedin, Twitter, Globe } from 'lucide-react';

const ConnectionButtons = ({ status, isRequester, onAction, isLoading }) => {
    switch (status) {
        case 'none':
            return (
                <button
                    onClick={() => onAction('connect')}
                    disabled={isLoading}
                    className="inline-flex items-center px-6 py-3 text-sm font-medium bg-white border border-slate-300 text-slate-700 rounded-full hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                    <Users className="w-4 h-4 mr-2" />
                    {isLoading ? 'Connecting...' : 'Connect'}
                </button>
            );
        case 'pending':
            if (isRequester) {
                return (
                    <button
                        onClick={() => onAction('withdraw')}
                        disabled={isLoading}
                        className="inline-flex items-center px-6 py-3 text-sm font-medium bg-white border border-slate-300 text-slate-700 rounded-full hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                        <UserX className="w-4 h-4 mr-2" />
                        {isLoading ? 'Withdrawing...' : 'Withdraw'}
                    </button>
                );
            }
            return (
                <div className="flex gap-2">
                    <button
                        onClick={() => onAction('accept')}
                        disabled={isLoading}
                        className="inline-flex items-center px-4 py-3 text-sm font-medium bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        <UserCheck className="w-4 h-4 mr-1" />
                        {isLoading ? 'Accepting...' : 'Accept'}
                    </button>
                    <button
                        onClick={() => onAction('decline')}
                        disabled={isLoading}
                        className="inline-flex items-center px-4 py-3 text-sm font-medium bg-white border border-slate-300 text-slate-700 rounded-full hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                        <UserX className="w-4 h-4 mr-1" />
                        {isLoading ? 'Declining...' : 'Decline'}
                    </button>
                </div>
            );
        case 'accepted':
            return (
                <button
                    onClick={() => onAction('disconnect')}
                    disabled={isLoading}
                    className="inline-flex items-center px-6 py-3 text-sm font-medium bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white rounded-full hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 transition-all duration-300 disabled:opacity-50 shadow-lg"
                >
                    <UserCheck className="w-4 h-4 mr-2" />
                    {isLoading ? 'Disconnecting...' : 'Connected'}
                </button>
            );
        default:
            return null;
    }
};

const initialProfileData = {
    followersCount: 0,
    followingCount: 0,
    connectionsCount: 0,
    connectionStatus: 'none',
    isRequester: false,
    mutualConnections: 0,
    isFollowing: false,
};

const MemberProfileHeader = ({ 
    member, 
    isFollowing, 
    onFollow, 
    onUnfollow, 
    isCurrentUser, 
    followingInProgress = false,
    currentUserId, // This is the ID of the logged-in user
    onTabChange,
    activeTab = 'activity',
    onNetworkSubTabChange
}) => {
    const [profileData, setProfileData] = useState({ ...initialProfileData, isFollowing });
    const [statsLoading, setStatsLoading] = useState(true);
    const [connectionLoading, setConnectionLoading] = useState(false);
    // ADD THIS STATE:
    const [enrichedMember, setEnrichedMember] = useState(member);

    // Add this useEffect to sync with parent's isFollowing prop
    useEffect(() => {
        setProfileData(prev => ({
            ...prev,
            isFollowing: isFollowing
        }));
    }, [isFollowing]);

    useEffect(() => {
        const fetchMemberData = async (memberId, currentUserId) => {
            try {
                setStatsLoading(true);
                
                const result = await getMemberProfileComplete(memberId, currentUserId);
                
                // UPDATE STATE INSTEAD OF MUTATING PROP:
                setEnrichedMember(result.profile);
                
                setProfileData({
                    followersCount: result.stats?.followers_count ?? 0,
                    followingCount: result.stats?.following_count ?? 0,
                    connectionsCount: result.stats?.connections_count ?? 0,
                    connectionStatus: result.connection_status?.status || 'none',
                    isRequester: result.connection_status?.is_requester || false,
                    mutualConnections: result.mutual_connections || 0,
                    isFollowing: result.is_following || false,
                });
                
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setStatsLoading(false);
            }
        };
        if (member?.id) {
            fetchMemberData(member.id, currentUserId);
        }
    }, [member?.id, currentUserId]);

    if (!enrichedMember) return null;

    const handleFollowClick = async () => {
        if (profileData.isFollowing) {
            await onUnfollow(enrichedMember.id);
            setProfileData(prev => ({ ...prev, isFollowing: false }));
        } else {
            await onFollow(enrichedMember.id);
            setProfileData(prev => ({ ...prev, isFollowing: true }));
        }
    };

    const handleConnectionAction = async (action) => {
        if (!currentUserId || connectionLoading) return;
        setConnectionLoading(true);
        try {
            let result;
            switch (action) {
                case 'connect':
                    result = await sendConnectionRequest(currentUserId, enrichedMember.id);
                    if (result.success) {
                        setProfileData(prev => ({ 
                            ...prev, 
                            connectionStatus: 'pending', 
                            isRequester: true 
                        }));
                    }
                    break;
                case 'accept':
                    result = await acceptConnectionRequest(currentUserId, enrichedMember.id);
                    if (result.success) {
                        setProfileData(prev => ({ 
                            ...prev, 
                            connectionStatus: 'accepted',
                            connectionsCount: prev.connectionsCount + 1
                        }));
                    }
                    break;
                case 'decline':
                    result = await declineConnectionRequest(currentUserId, enrichedMember.id);
                    if (result.success) {
                        setProfileData(prev => ({ 
                            ...prev, 
                            connectionStatus: 'none' 
                        }));
                    }
                    break;
                case 'withdraw':
                    result = await withdrawConnectionRequest(currentUserId, enrichedMember.id);
                    if (result.success) {
                        setProfileData(prev => ({ 
                            ...prev, 
                            connectionStatus: 'none', 
                            isRequester: false 
                        }));
                    }
                    break;
                case 'disconnect':
                    result = await removeConnection(currentUserId, enrichedMember.id);
                    if (result.success) {
                        setProfileData(prev => ({ 
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

    const getMutualConnectionsText = () => {
        const { mutualConnections } = profileData;
        if (mutualConnections > 0) {
            return `${mutualConnections} mutual connection${mutualConnections === 1 ? '' : 's'}`;
        }
        return 'Connect to see mutual connections';
    };

    const handleConnectionsClick = () => onTabChange?.('connections');

    const getDisplayTitle = () => {
        return enrichedMember.title || null;
    };

    const organizationDisplay = useMemo(() => {
        if (enrichedMember.organization_name) {
            // Prioritize slug for the URL, but fall back to ID if slug is not present.
            const orgIdentifier = enrichedMember.organization_slug || enrichedMember.organization_id;

            if (orgIdentifier) {
                return (
                    <Link
                        to={`/organizations/${enrichedMember.organization_slug || enrichedMember.organization_id}`}
                        className="text-blue-600 hover:text-blue-700 transition-colors font-medium"
                    >
                        {enrichedMember.organization_name}
                    </Link>
                );
            } else {
                return <span className="text-lg leading-relaxed">{enrichedMember.organization_name}</span>;
            }
        }
        return null;
    }, [enrichedMember.organization_name, enrichedMember.organization_id, enrichedMember.organization_slug]);

    const socialProfiles = useMemo(() => {
        const profiles = [];
        if (enrichedMember.linkedin_url) {
            profiles.push({
                platform: 'LinkedIn',
                url: enrichedMember.linkedin_url,
                icon: Linkedin,
                color: 'bg-blue-600 hover:bg-blue-700'
            });
        }
        if (enrichedMember.twitter_url) {
            profiles.push({
                platform: 'Twitter/X',
                url: enrichedMember.twitter_url,
                icon: Twitter,
                color: 'bg-slate-900 hover:bg-slate-800'
            });
        }
        if (enrichedMember.website_url) {
            profiles.push({
                platform: 'Website',
                url: enrichedMember.website_url,
                icon: Globe,
                color: 'bg-green-600 hover:bg-green-700'
            });
        }
        return profiles;
    }, [enrichedMember.linkedin_url, enrichedMember.twitter_url, enrichedMember.website_url]);

    return (
        <>
            <div className="relative">
                <div className="h-80 bg-gradient-to-br from-slate-100 via-white to-slate-100 overflow-hidden rounded-t-3xl">
                    {enrichedMember.banner_image_url ? (
                        <img 
                            src={enrichedMember.banner_image_url} 
                            alt={`${enrichedMember.full_name} banner`}
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
                                {enrichedMember.avatar_url ? (
                                    <img 
                                        src={enrichedMember.avatar_url} 
                                        alt={enrichedMember.full_name}
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
                                    {enrichedMember.full_name}
                                </h1>
                                
                                <div className="text-lg text-slate-600 space-y-1">
                                    {(() => {
                                        const title = getDisplayTitle();
                                        const orgDisplay = organizationDisplay;
                                        
                                        if (title && orgDisplay) {
                                            return (
                                                <p className="text-lg leading-relaxed">
                                                    {title}, {orgDisplay}
                                                </p>
                                            );
                                        } 
                                        if (title) {
                                            return <p>{title}</p>;
                                        } 
                                        if (orgDisplay) {
                                            return <p>{orgDisplay}</p>;
                                        } else {
                                            return null;
                                        }
                                    })()}
                                    {enrichedMember.location && (
                                        <p>Based in {enrichedMember.location}</p>
                                    )}
                                </div>
                            </div>

                            {enrichedMember.bio && (
                                <p className="text-slate-700 leading-relaxed mb-4">
                                    {enrichedMember.bio}
                                </p>
                            )}

                            {!isCurrentUser && (
                                <p className="text-sm text-slate-500 mb-4">
                                    {getMutualConnectionsText()}
                                </p>
                            )}

                            {!isCurrentUser && currentUserId && enrichedMember?.id && (
                                <div className="flex gap-3 mb-6">
                                    {profileData.isFollowing ? (
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
                                    
                                    <ConnectionButtons 
                                        status={profileData.connectionStatus}
                                        isRequester={profileData.isRequester}
                                        onAction={handleConnectionAction}
                                        isLoading={connectionLoading}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex-shrink-0 py-4">
                          <div className="flex space-x-6 text-center">
                            <div 
                              className="cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors"
                              onClick={() => {
                                if (activeTab === 'network') {
                                  // Already on network tab, just change sub-tab
                                  onNetworkSubTabChange?.('connections');
                                } else {
                                  // Switch to network tab and set sub-tab
                                  onTabChange('network');
                                  sessionStorage.setItem('networkSubTab', 'connections');
                                }
                              }}
                            >
                              <div className="text-2xl font-bold text-slate-900">
                                {statsLoading ? '...' : profileData.connectionsCount}
                              </div>
                              <div className="text-sm text-slate-500 font-medium">
                                {profileData.connectionsCount === 1 ? 'Connection' : 'Connections'}
                              </div>
                            </div>
                            <div 
                              className="cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors"
                              onClick={() => {
                                if (activeTab === 'network') {
                                  onNetworkSubTabChange?.('followers');
                                } else {
                                  onTabChange('network');
                                  sessionStorage.setItem('networkSubTab', 'followers');
                                }
                              }}
                            >
                              <div className="text-2xl font-bold text-slate-900">
                                {statsLoading ? '...' : profileData.followersCount}
                              </div>
                              <div className="text-sm text-slate-500 font-medium">
                                {profileData.followersCount === 1 ? 'Follower' : 'Followers'}
                              </div>
                            </div>
                            <div 
                              className="cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors"
                              onClick={() => {
                                if (activeTab === 'network') {
                                  onNetworkSubTabChange?.('following');
                                } else {
                                  onTabChange('network');
                                  sessionStorage.setItem('networkSubTab', 'following');
                                }
                              }}
                            >
                              <div className="text-2xl font-bold text-slate-900">
                                {statsLoading ? '...' : profileData.followingCount}
                              </div>
                              <div className="text-sm text-slate-500 font-medium">
                                {profileData.followingCount === 1 ? 'Following' : 'Following'}
                              </div>
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
                                            title={`View ${enrichedMember.full_name}'s ${profile.platform}`}
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
                                { id: 'network', label: 'Network', icon: '🤝' }, // Changed from 'connections'
                                { id: 'photos', label: 'Photos', icon: '📸' },
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