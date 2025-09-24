// src/components/ConnectionsPage.jsx - FIXED VERSION with Original Design
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Users, UserCheck, UserX, ArrowLeft, Clock, Building, MapPin, Search, Filter } from 'lucide-react';
import Avatar from './Avatar';
import PublicPageLayout from './PublicPageLayout.jsx';
import { 
    removeConnection, 
    acceptConnectionRequest, 
    declineConnectionRequest,
    getPendingConnectionRequests,
    getUserConnections,
    sendConnectionRequest,
    withdrawConnectionRequest
} from '../utils/userConnectionsUtils';

// ✅ REQUEST DEDUPLICATION HOOK
function useRequestDeduplication() {
    const pendingRequests = useRef(new Map());

    const deduplicate = useCallback((key, requestFunction) => {
        if (pendingRequests.current.has(key)) {
            return pendingRequests.current.get(key);
        }

        const promise = requestFunction()
            .finally(() => {
                pendingRequests.current.delete(key);
            });

        pendingRequests.current.set(key, promise);
        return promise;
    }, []);

    return deduplicate;
}

export default function ConnectionsPage() {
    const { profile: currentUserProfile } = useOutletContext();
    const [connections, setConnections] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [discoveredMembers, setDiscoveredMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [discoverLoading, setDiscoverLoading] = useState(false);
    const [actionInProgress, setActionInProgress] = useState(new Set());
    const [activeTab, setActiveTab] = useState('connections');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');

    // ✅ Add request deduplication
    const deduplicate = useRequestDeduplication();
    
    // ✅ Use refs to track current state without causing re-renders
    const connectionsRef = useRef([]);
    const pendingRequestsRef = useRef([]);
    
    // ✅ Update refs when state changes
    useEffect(() => {
        connectionsRef.current = connections;
    }, [connections]);

    useEffect(() => {
        pendingRequestsRef.current = pendingRequests;
    }, [pendingRequests]);

    // ✅ FIXED - Remove circular dependencies
    const fetchConnections = useCallback(async () => {
        if (!currentUserProfile?.id) return;
        
        return deduplicate(`connections-${currentUserProfile.id}`, async () => {
            try {
                const result = await getUserConnections(currentUserProfile.id, 100);
                
                if (!result.error) {
                    setConnections(result.connections || []);
                } else {
                    console.error('Error fetching connections:', result.error);
                }
            } catch (error) {
                console.error('Error in fetchConnections:', error);
            }
        });
    }, [currentUserProfile?.id, deduplicate]);

    // ✅ FIXED - Remove circular dependencies 
    const fetchPendingRequests = useCallback(async () => {
        if (!currentUserProfile?.id) return;
        
        return deduplicate(`pending-${currentUserProfile.id}`, async () => {
            try {
                setLoading(true);
                
                // Get incoming requests (people who want to connect with you)
                const { data: incomingData, error: incomingError } = await supabase
                    .from('user_connections')
                    .select('id, created_at, requester_id')
                    .eq('recipient_id', currentUserProfile.id)
                    .eq('status', 'pending')
                    .order('created_at', { ascending: false });

                // Get outgoing requests (people you want to connect with)
                const { data: outgoingData, error: outgoingError } = await supabase
                    .from('user_connections')
                    .select('id, created_at, recipient_id')
                    .eq('requester_id', currentUserProfile.id)
                    .eq('status', 'pending')
                    .order('created_at', { ascending: false });

                if (incomingError || outgoingError) {
                    console.error('Error fetching requests:', incomingError || outgoingError);
                    return;
                }

                // Get user profiles separately
                const allUserIds = [
                    ...(incomingData || []).map(req => req.requester_id),
                    ...(outgoingData || []).map(req => req.recipient_id)
                ];

                let profilesData = [];
                if (allUserIds.length > 0) {
                    const { data: profiles, error: profilesError } = await supabase
                        .from('profiles')
                        .select('id, full_name, avatar_url, title, organization_name, location')
                        .in('id', allUserIds);

                    if (!profilesError) {
                        profilesData = profiles || [];
                    }
                }

                // Create profiles map
                const profilesMap = {};
                profilesData.forEach(profile => {
                    profilesMap[profile.id] = profile;
                });

                // Combine and format the requests
                const formattedRequests = [
                    // Incoming requests
                    ...(incomingData || []).map(req => ({
                        id: req.id,
                        created_at: req.created_at,
                        type: 'incoming',
                        user_profile: profilesMap[req.requester_id] || {
                            id: req.requester_id,
                            full_name: 'Unknown User',
                            avatar_url: null,
                            title: null,
                            organization_name: null
                        },
                        isIncoming: true
                    })),
                    // Outgoing requests
                    ...(outgoingData || []).map(req => ({
                        id: req.id,
                        created_at: req.created_at,
                        type: 'outgoing',
                        user_profile: profilesMap[req.recipient_id] || {
                            id: req.recipient_id,
                            full_name: 'Unknown User',
                            avatar_url: null,
                            title: null,
                            organization_name: null
                        },
                        isIncoming: false
                    }))
                ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

                setPendingRequests(formattedRequests);
            } catch (error) {
                console.error('Error in fetchPendingRequests:', error);
            } finally {
                setLoading(false);
            }
        });
    }, [currentUserProfile?.id, deduplicate]);

    // ✅ FIXED - Remove circular dependencies, use refs to access current state
    const fetchDiscoverMembers = useCallback(async () => {
        if (!currentUserProfile?.id) return;
        
        return deduplicate(`discover-${currentUserProfile.id}-${searchQuery}-${filterType}`, async () => {
            try {
                setDiscoverLoading(true);
                
                // Get current state from refs to avoid circular dependencies
                const currentConnections = connectionsRef.current;
                const currentPending = pendingRequestsRef.current;
                
                // Get IDs of users already connected or with pending requests (both sent and received)
                const connectedUserIds = new Set([
                    ...currentConnections.map(c => c.user.id),
                    ...currentPending.map(r => r.user_profile.id)
                ]);

                // Also get pending requests that the current user has sent
                const { data: sentRequests } = await supabase
                    .from('user_connections')
                    .select('recipient_id')
                    .eq('requester_id', currentUserProfile.id)
                    .eq('status', 'pending');

                if (sentRequests) {
                    sentRequests.forEach(req => connectedUserIds.add(req.recipient_id));
                }

                let query = supabase
                    .from('profiles')
                    .select(`
                        id,
                        full_name,
                        title,
                        avatar_url,
                        location,
                        organization_name,
                        organization_type,
                        role
                    `)
                    .neq('id', currentUserProfile.id)
                    .limit(20);

                // Only filter out connected users if we have any
                if (connectedUserIds.size > 0) {
                    const userIdArray = Array.from(connectedUserIds);
                    query = query.not('id', 'in', `(${userIdArray.map(id => `"${id}"`).join(',')})`);
                }

                // Apply search filter
                if (searchQuery.trim()) {
                    query = query.or(`full_name.ilike.%${searchQuery}%,organization_name.ilike.%${searchQuery}%,title.ilike.%${searchQuery}%`);
                }

                // Apply type filter based on organization_type patterns
                if (filterType !== 'all') {
                    if (filterType === 'nonprofit') {
                        query = query.ilike('organization_type', 'nonprofit%');
                    } else if (filterType === 'foundation') {
                        query = query.ilike('organization_type', 'foundation%');
                    } else if (filterType === 'education') {
                        query = query.ilike('organization_type', 'education%');
                    } else if (filterType === 'government') {
                        query = query.ilike('organization_type', 'government%');
                    }
                }

                const { data, error } = await query.order('updated_at', { ascending: false });
                
                if (!error) {
                    setDiscoveredMembers(data || []);
                } else {
                    console.error('Error fetching discover members:', error);
                }
            } catch (error) {
                console.error('Error in fetchDiscoverMembers:', error);
            } finally {
                setDiscoverLoading(false);
            }
        });
    }, [currentUserProfile?.id, searchQuery, filterType, deduplicate]);

    // ✅ FIXED - Only fetch when profile changes, not on callback changes
    useEffect(() => {
        if (currentUserProfile?.id) {
            fetchConnections();
            fetchPendingRequests();
        }
    }, [currentUserProfile?.id]);

    // ✅ FIXED - Only fetch discover when tab changes or filters change
    useEffect(() => {
        if (activeTab === 'discover') {
            fetchDiscoverMembers();
        }
    }, [activeTab, searchQuery, filterType]);

    const handleSendConnectionRequest = useCallback(async (userId) => {
        if (actionInProgress.has(userId)) return;

        setActionInProgress(prev => new Set(prev).add(userId));

        try {
            const result = await sendConnectionRequest(currentUserProfile.id, userId);
            
            if (result.success) {
                setDiscoveredMembers(prev => prev.filter(member => member.id !== userId));
                await fetchPendingRequests();
                await fetchConnections();
            } else {
                console.error('Connection request failed:', result.error);
            }
        } catch (error) {
            console.error('Error sending connection request:', error);
        } finally {
            setActionInProgress(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });
        }
    }, [currentUserProfile.id, fetchPendingRequests, fetchConnections]);

    const handleDisconnect = useCallback(async (connectionId, userId) => {
        if (actionInProgress.has(userId)) return;
        if (!window.confirm('Are you sure you want to disconnect? This will remove the professional connection between you.')) {
            return;
        }
        setActionInProgress(prev => new Set(prev).add(userId));
        try {
            const result = await removeConnection(currentUserProfile.id, userId);
            if (result.success) {
                setConnections(prev => prev.filter(conn => conn.user.id !== userId));
            }
        } catch (error) {
            console.error('Error in handleDisconnect:', error);
        } finally {
            setActionInProgress(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });
        }
    }, [currentUserProfile.id]);

    const handleAcceptRequest = useCallback(async (requestId, userId) => {
        if (actionInProgress.has(userId)) return;

        setActionInProgress(prev => new Set(prev).add(userId));

        try {
            const result = await acceptConnectionRequest(currentUserProfile.id, userId);
            
            if (result.success) {
                setPendingRequests(prev => prev.filter(req => req.id !== requestId));
                await fetchConnections();
            } 
        } catch (error) {
            console.error('Error in handleAcceptRequest:', error);
        } finally {
            setActionInProgress(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });
        }
    }, [currentUserProfile.id, fetchConnections]);

    const handleDeclineRequest = useCallback(async (requestId, userId) => {
        if (actionInProgress.has(userId)) return;

        setActionInProgress(prev => new Set(prev).add(userId));

        try {
            const result = await declineConnectionRequest(currentUserProfile.id, userId);
            
            if (result.success) {
                setPendingRequests(prev => prev.filter(req => req.id !== requestId));
            } 
        } catch (error) {
            console.error('Error in handleDeclineRequest:', error);
        } finally {
            setActionInProgress(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });
        }
    }, [currentUserProfile.id]);

    // New handler for withdrawing outgoing requests
    const handleWithdrawRequest = useCallback(async (requestId, userId) => {
        if (actionInProgress.has(userId)) return;

        setActionInProgress(prev => new Set(prev).add(userId));

        try {
            const result = await withdrawConnectionRequest(currentUserProfile.id, userId);
            
            if (result.success) {
                setPendingRequests(prev => prev.filter(req => req.id !== requestId));
                await fetchDiscoverMembers(); // Refresh discover to show this user again
            }
        } catch (error) {
            console.error('Error withdrawing request:', error);
        } finally {
            setActionInProgress(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });
        }
    }, [currentUserProfile.id, fetchDiscoverMembers]);

    const formatDate = useCallback((dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
        return date.toLocaleDateString();
    }, []);

    // Enhanced ConnectionCard to handle both incoming and outgoing requests
    const ConnectionCard = useCallback(({ connection, type = 'connection' }) => {
        let user, connectionDate, isActionInProgress;
        
        if (type === 'connection') {
            user = connection.user;
            connectionDate = connection.connected_at;
            isActionInProgress = actionInProgress.has(user?.id);
        } else if (type === 'request') {
            user = connection.user_profile;
            connectionDate = connection.created_at;
            isActionInProgress = actionInProgress.has(user?.id);
        }

        if (!user) {
            return (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <p className="text-red-500">Error: User data not found</p>
                </div>
            );
        }

        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-grow">
                        <Avatar 
                            src={user.avatar_url} 
                            fullName={user.full_name} 
                            size="lg" 
                        />
                        <div className="flex-grow min-w-0">
                            <Link 
                                to={`/profile/members/${user.id}`}
                                className="text-lg font-semibold text-slate-900 hover:text-blue-600 transition-colors block"
                            >
                                {user.full_name}
                            </Link>
                            
                            {user.title && (
                                <p className="text-sm text-slate-600 mt-1 flex items-center">
                                    <Building className="w-3 h-3 mr-1" />
                                    {user.title}
                                </p>
                            )}
                            
                            {user.organization_name && (
                                <p className="text-sm text-slate-500 mt-1">
                                    {user.organization_name}
                                </p>
                            )}

                            {user.location && (
                                <p className="text-sm text-slate-500 mt-1 flex items-center">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    {user.location}
                                </p>
                            )}

                            <div className="flex items-center text-xs text-slate-400 mt-2">
                                <Clock className="w-3 h-3 mr-1" />
                                {type === 'connection' 
                                    ? `Connected ${formatDate(connectionDate)}`
                                    : type === 'request' && connection.isIncoming
                                    ? `Requested ${formatDate(connectionDate)}`
                                    : `You requested ${formatDate(connectionDate)}`
                                }
                            </div>

                            {/* Show request type indicator */}
                            {type === 'request' && (
                                <div className="mt-2">
                                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                                        connection.isIncoming 
                                            ? 'bg-blue-100 text-blue-800' 
                                            : 'bg-amber-100 text-amber-800'
                                    }`}>
                                        {connection.isIncoming ? 'Wants to connect' : 'Pending approval'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex-shrink-0 ml-4">
                        {type === 'connection' ? (
                            <button
                                onClick={() => handleDisconnect(connection.id, user.id)}
                                disabled={isActionInProgress}
                                className="inline-flex items-center px-3 py-2 text-sm font-medium bg-green-100 text-green-700 rounded-lg hover:bg-red-100 hover:text-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                                title="Disconnect"
                            >
                                <UserCheck className="w-4 h-4 mr-1 group-hover:hidden" />
                                <UserX className="w-4 h-4 mr-1 hidden group-hover:block" />
                                {isActionInProgress ? 'Disconnecting...' : 'Connected'}
                            </button>
                        ) : connection.isIncoming ? (
                            // Incoming request - show Accept/Decline buttons
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleAcceptRequest(connection.id, user.id)}
                                    disabled={isActionInProgress}
                                    className="inline-flex items-center px-3 py-2 text-sm font-medium bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <UserCheck className="w-4 h-4 mr-1" />
                                    {isActionInProgress ? 'Accepting...' : 'Accept'}
                                </button>
                                <button
                                    onClick={() => handleDeclineRequest(connection.id, user.id)}
                                    disabled={isActionInProgress}
                                    className="inline-flex items-center px-3 py-2 text-sm font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <UserX className="w-4 h-4 mr-1" />
                                    {isActionInProgress ? 'Declining...' : 'Decline'}
                                </button>
                            </div>
                        ) : (
                            // Outgoing request - show Withdraw button
                            <button
                                onClick={() => handleWithdrawRequest(connection.id, user.id)}
                                disabled={isActionInProgress}
                                className="inline-flex items-center px-3 py-2 text-sm font-medium bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <UserX className="w-4 h-4 mr-1" />
                                {isActionInProgress ? 'Withdrawing...' : 'Withdraw'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }, [actionInProgress, formatDate, handleDisconnect, handleAcceptRequest, handleDeclineRequest, handleWithdrawRequest]);

    const DiscoverCard = useCallback(({ member }) => {
        const isActionInProgress = actionInProgress.has(member.id);

        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-grow">
                        <Avatar 
                            src={member.avatar_url} 
                            fullName={member.full_name} 
                            size="lg" 
                        />
                        <div className="flex-grow min-w-0">
                            <Link 
                                to={`/profile/members/${member.id}`}
                                className="text-lg font-semibold text-slate-900 hover:text-blue-600 transition-colors block"
                            >
                                {member.full_name}
                            </Link>
                            
                            {member.title && (
                                <p className="text-sm text-slate-600 mt-1 flex items-center">
                                    <Building className="w-3 h-3 mr-1" />
                                    {member.title}
                                </p>
                            )}
                            
                            {member.organization_name && (
                                <p className="text-sm text-slate-500 mt-1">
                                    {member.organization_name}
                                </p>
                            )}

                            {member.location && (
                                <p className="text-sm text-slate-500 mt-1 flex items-center">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    {member.location}
                                </p>
                            )}

                            {member.organization_type && (
                                <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full ${
                                    member.organization_type?.startsWith('nonprofit') ? 'bg-green-100 text-green-800' :
                                    member.organization_type?.startsWith('foundation') ? 'bg-blue-100 text-blue-800' :
                                    member.organization_type?.startsWith('education') ? 'bg-purple-100 text-purple-800' :
                                    member.organization_type?.startsWith('government') ? 'bg-gray-100 text-gray-800' :
                                    'bg-slate-100 text-slate-800'
                                }`}>
                                    {member.organization_type?.startsWith('nonprofit') ? 'Nonprofit' :
                                     member.organization_type?.startsWith('foundation') ? 'Foundation' :
                                     member.organization_type?.startsWith('education') ? 'Education' :
                                     member.organization_type?.startsWith('government') ? 'Government' :
                                     member.organization_type}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Connect Button */}
                    <div className="flex-shrink-0 ml-4">
                        <button
                            onClick={() => handleSendConnectionRequest(member.id)}
                            disabled={isActionInProgress}
                            className="inline-flex items-center px-3 py-2 text-sm font-medium bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Users className="w-4 h-4 mr-1" />
                            {isActionInProgress ? 'Connecting...' : 'Connect'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }, [actionInProgress, handleSendConnectionRequest]);

    return (
        <PublicPageLayout bgColor="bg-[#faf7f4]">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen flex flex-col">
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center space-x-4">
                        <Link 
                            to="/profile" 
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Back to Profile"
                        >
                            <ArrowLeft size={20} className="text-slate-600" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Connections & Discovery</h1>
                            <p className="text-slate-600">
                                Manage your professional network and discover new connections
                            </p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-slate-200">
                        <nav className="flex space-x-8">
                            <button
                                onClick={() => setActiveTab('connections')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === 'connections'
                                        ? 'border-green-500 text-green-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                My Connections ({connections.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('requests')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors relative ${
                                    activeTab === 'requests'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                Pending Requests ({pendingRequests.length})
                                {pendingRequests.filter(r => r.isIncoming).length > 0 && (
                                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('discover')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === 'discover'
                                        ? 'border-purple-500 text-purple-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                Discover People
                            </button>
                        </nav>
                    </div>

                    {/* Discover Tab Filters */}
                    {activeTab === 'discover' && (
                        <div className="bg-white rounded-lg border border-slate-200 p-4">
                            <div className="flex flex-col sm:flex-row gap-4">
                                {/* Search */}
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            placeholder="Search by name, organization, or title..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                                
                                {/* Filter */}
                                <div className="sm:w-48">
                                    <select
                                        value={filterType}
                                        onChange={(e) => setFilterType(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="all">All Types</option>
                                        <option value="nonprofit">Nonprofits</option>
                                        <option value="foundation">Foundations</option>
                                        <option value="education">Education</option>
                                        <option value="government">Government</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    {loading && activeTab !== 'discover' ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                            <p className="text-slate-600 mt-2">Loading your connections...</p>
                        </div>
                    ) : (
                        <>
                            {/* Connections Tab */}
                            {activeTab === 'connections' && (
                                <div className="space-y-4">
                                    {connections.length > 0 ? (
                                        connections.map(connection => (
                                            <ConnectionCard 
                                                key={connection.id} 
                                                connection={connection} 
                                                type="connection"
                                            />
                                        ))
                                    ) : (
                                        <div className="text-center py-12">
                                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Users className="w-8 h-8 text-slate-400" />
                                            </div>
                                            <h3 className="text-lg font-medium text-slate-900 mb-2">No connections yet</h3>
                                            <p className="text-slate-600 max-w-md mx-auto mb-4">
                                                Start building your professional network by connecting with colleagues, 
                                                team members, and other professionals in your field.
                                            </p>
                                            <button 
                                                onClick={() => setActiveTab('discover')}
                                                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                            >
                                                <Users className="w-4 h-4 mr-2" />
                                                Discover People
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Pending Requests Tab */}
                            {activeTab === 'requests' && (
                                <div className="space-y-4">
                                    {pendingRequests.length > 0 ? (
                                        pendingRequests.map(request => (
                                            <ConnectionCard 
                                                key={request.id} 
                                                connection={request} 
                                                type="request"
                                            />
                                        ))
                                    ) : (
                                        <div className="text-center py-12">
                                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Clock className="w-8 h-8 text-slate-400" />
                                            </div>
                                            <h3 className="text-lg font-medium text-slate-900 mb-2">No pending requests</h3>
                                            <p className="text-slate-600 max-w-md mx-auto">
                                                You don't have any pending connection requests at the moment.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Discover Tab */}
                            {activeTab === 'discover' && (
                                <div className="space-y-4">
                                    {discoverLoading ? (
                                        <div className="text-center py-12">
                                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                                            <p className="text-slate-600 mt-2">Finding people for you to connect with...</p>
                                        </div>
                                    ) : discoveredMembers.length > 0 ? (
                                        <>
                                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                                <p className="text-purple-800 text-sm">
                                                    Found <strong>{discoveredMembers.length}</strong> professionals you might want to connect with. 
                                                    Use the search and filter options above to refine your results.
                                                </p>
                                            </div>
                                            {discoveredMembers.map(member => (
                                                <DiscoverCard 
                                                    key={member.id} 
                                                    member={member}
                                                />
                                            ))}
                                        </>
                                    ) : (
                                        <div className="text-center py-12">
                                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Search className="w-8 h-8 text-slate-400" />
                                            </div>
                                            <h3 className="text-lg font-medium text-slate-900 mb-2">
                                                {searchQuery || filterType !== 'all' ? 'No matches found' : 'No new people to discover'}
                                            </h3>
                                            <p className="text-slate-600 max-w-md mx-auto">
                                                {searchQuery || filterType !== 'all' 
                                                    ? 'Try adjusting your search terms or filters to find more people.'
                                                    : 'All available professionals are either already connected with you or have pending requests.'
                                                }
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </PublicPageLayout>
    );
}