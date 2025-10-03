import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Users, Heart, UserPlus, UserCheck, UserX, Clock } from 'lucide-react';
import { 
    sendConnectionRequest, 
    acceptConnectionRequest, 
    declineConnectionRequest,
    withdrawConnectionRequest,
    removeConnection,
    getBatchConnectionStatuses
} from '../../utils/userConnectionsUtils';

const MemberProfileConnections = ({ 
    member, 
    loading, 
    currentUserId, 
    isCurrentUser,
    connections,
    followers,
    following
}) => {
    const [activeSubTab, setActiveSubTab] = useState('connections');
    const [connectionActions, setConnectionActions] = useState({});
    const [isDataLoading, setIsDataLoading] = useState(true);

    useEffect(() => {
        const initializeData = async () => {
            setIsDataLoading(true);
            if (currentUserId && currentUserId !== member.id) {
                await fetchConnectionStatuses([...connections, ...followers, ...following]);
            }
            setIsDataLoading(false);
        };

        if (!loading) {
            initializeData();
        }
    }, [member?.id, currentUserId, loading]);

    const fetchConnectionStatuses = async (allUsers) => {
        const targetUserIds = allUsers
            .filter(item => item?.profile?.id && item.profile.id !== currentUserId)
            .map(item => item.profile.id);
        
        if (targetUserIds.length === 0) return;

        try {
            const batchStatuses = await getBatchConnectionStatuses(currentUserId, targetUserIds);
            setConnectionActions(batchStatuses.connections || {});
        } catch (error) {
            console.error('Error fetching batch connection statuses:', error);
            const fallbackStatuses = {};
            targetUserIds.forEach(userId => {
                fallbackStatuses[userId] = { status: 'none', isRequester: false };
            });
            setConnectionActions(fallbackStatuses);
        }
    };
    
    const refreshParentData = () => {
        // This would ideally call a refresh function passed from MemberProfilePage
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
                        refreshParentData();
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
                        refreshParentData();
                    }
                    break;
            }
        } catch (error) {
            console.error('Connection action error:', error);
        }
    };

    const getConnectionButton = (person) => {
        if (!currentUserId || !person || currentUserId === person.id) return null;

        const status = connectionActions[person.id];
        if (!status) return null;

        switch (status.status) {
            case 'none':
                return (
                    <button
                        onClick={() => handleConnectionAction(person.id, 'connect')}
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
                            onClick={() => handleConnectionAction(person.id, 'withdraw')}
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
                                onClick={() => handleConnectionAction(person.id, 'accept')}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
                            >
                                <UserCheck className="w-3 h-3" />
                            </button>
                            <button
                                onClick={() => handleConnectionAction(person.id, 'decline')}
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
                        onClick={() => handleConnectionAction(person.id, 'disconnect')}
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

    const PersonCard = ({ person, type, showConnectionButton = true }) => {
        // Add safety check
        if (!person || !person.id) {
            return null;
        }
    
        return (
            <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex items-center space-x-3">
                    <Link to={`/profile/${person.id}`} className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200">
                            {person.avatar_url ? (
                                <img 
                                    src={person.avatar_url} 
                                    alt={person.full_name}
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
                        <Link to={`/profile/${person.id}`} className="block">
                            <h4 className="text-sm font-medium text-slate-900 hover:text-blue-600 transition-colors">
                                {person.full_name}
                            </h4>
                        </Link>
                        {person.title && (
                            <p className="text-xs text-slate-600">{person.title}</p>
                        )}
                        {person.organization_name && (
                            <p className="text-xs text-slate-500">{person.organization_name}</p>
                        )}
                        {person.location && (
                            <p className="text-xs text-slate-500">{person.location}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-400 capitalize">{type}</span>
                    {showConnectionButton && getConnectionButton(person)}
                </div>
            </div>
        );
    };

    if (loading || isDataLoading) {
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

    const firstName = member.full_name?.split(' ')[0] || 'This user';

    return (
        <div className="max-w-7xl mx-auto px-8 py-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
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

                <div className="p-6">
                    {activeSubTab === 'connections' && (
                        <div>
                            {connections.length > 0 ? (
                                <div className="space-y-3">
                                    {connections.map(connection => (
                                        <PersonCard 
                                            key={connection.profile?.id || connection.id} 
                                            person={connection.profile} 
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
                                            key={follower.profile?.id || follower.id} 
                                            person={follower.profile} 
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
                                            key={follow.profile?.id || follow.id} 
                                            person={follow.profile} 
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