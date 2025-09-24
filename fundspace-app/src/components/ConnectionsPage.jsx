// src/components/ConnectionsPage.jsx - COMPLETE FIXED VERSION
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
                
                // Get incoming requests (people who want to connect to current user)
                const [incomingResult, outgoingResult] = await Promise.all([
                    supabase
                        .from('user_connections')
                        .select('id, requester_id, created_at')
                        .eq('recipient_id', currentUserProfile.id)
                        .eq('status', 'pending'),
                    
                    // Get outgoing requests (current user wants to connect to others)
                    supabase
                        .from('user_connections')
                        .select('id, recipient_id, created_at')
                        .eq('requester_id', currentUserProfile.id)
                        .eq('status', 'pending')
                ]);

                const incomingData = incomingResult.data || [];
                const outgoingData = outgoingResult.data || [];

                // Get all user IDs we need profiles for
                const allUserIds = [
                    ...incomingData.map(req => req.requester_id),
                    ...outgoingData.map(req => req.recipient_id)
                ];

                if (allUserIds.length === 0) {
                    setPendingRequests([]);
                    setLoading(false);
                    return;
                }

                // Fetch all profiles at once
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url, title, organization_name, role')
                    .in('id', allUserIds);

                // Create profiles map for easy lookup
                const profilesMap = {};
                (profilesData || []).forEach(profile => {
                    profilesMap[profile.id] = profile;
                });

                // Format the requests
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
                
                // Get IDs of users already connected or with pending requests
                const connectedUserIds = new Set([
                    ...currentConnections.map(c => c.user.id),
                    ...currentPending.map(r => r.user_profile.id)
                ]);

                // Build query
                let query = supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url, title, organization_name, location, role')
                    .neq('id', currentUserProfile.id)
                    .order('created_at', { ascending: false })
                    .limit(50);

                // Add search filter
                if (searchQuery && searchQuery.length >= 2) {
                    query = query.or(`full_name.ilike.%${searchQuery}%,organization_name.ilike.%${searchQuery}%`);
                }

                // Add type filter
                if (filterType !== 'all') {
                    // You can add specific filters here based on your needs
                }

                const { data, error } = await query;

                if (error) {
                    console.error('Error fetching discover members:', error);
                    setDiscoveredMembers([]);
                } else {
                    // Filter out already connected users
                    const filteredData = (data || []).filter(user => 
                        !connectedUserIds.has(user.id)
                    );
                    setDiscoveredMembers(filteredData);
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

    // ✅ FIXED - Only fetch discover when tab changes to discover
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
                // Refresh requests after sending
                await fetchPendingRequests();
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
    }, [currentUserProfile.id, fetchPendingRequests]);

    const handleDisconnect = useCallback(async (connectionId, userId) => {
        if (actionInProgress.has(userId)) return;
        if (!window.confirm('Are you sure you want to disconnect? This will remove the professional connection between you.'))
            return;

        setActionInProgress(prev => new Set(prev).add(userId));

        try {
            const result = await removeConnection(connectionId);
            
            if (result.success) {
                setConnections(prev => prev.filter(conn => conn.id !== connectionId));
                await fetchDiscoverMembers(); // Refresh discover to show this user again
            } else {
                console.error('Disconnect failed:', result.error);
            }
        } catch (error) {
            console.error('Error disconnecting:', error);
        } finally {
            setActionInProgress(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });
        }
    }, [fetchDiscoverMembers]);

    const handleAcceptRequest = useCallback(async (requestId, userId) => {
        if (actionInProgress.has(userId)) return;

        setActionInProgress(prev => new Set(prev).add(userId));

        try {
            const result = await acceptConnectionRequest(currentUserProfile.id, userId);
            
            if (result.success) {
                setPendingRequests(prev => prev.filter(req => req.id !== requestId));
                await fetchConnections(); // Refresh connections
            } else {
                console.error('Accept request failed:', result.error);
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
        return `${Math.ceil(diffDays / 365)} years ago`;
    }, []);

    if (!currentUserProfile) {
        return <div>Loading...</div>;
    }

    // Filter connections based on search
    const filteredConnections = connections.filter(conn => 
        !searchQuery || 
        conn.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conn.user?.organization_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredPendingRequests = pendingRequests.filter(req => 
        !searchQuery || 
        req.user_profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.user_profile?.organization_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredDiscoveredMembers = discoveredMembers.filter(member => 
        !searchQuery || 
        member.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.organization_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <PublicPageLayout bgColor="bg-slate-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center space-x-4 mb-4">
                        <Link 
                            to="/dashboard"
                            className="flex items-center text-slate-500 hover:text-slate-700 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            Back to Dashboard
                        </Link>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Professional Connections</h1>
                    <p className="text-slate-600">Build your professional network in the social impact space.</p>
                </div>

                {/* Search and Filter Bar */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search connections..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div className="relative">
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="appearance-none bg-white border border-slate-300 rounded-md px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">All Types</option>
                                <option value="nonprofit">Nonprofits</option>
                                <option value="funder">Funders</option>
                                <option value="individual">Individuals</option>
                            </select>
                            <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 mb-6">
                    <div className="border-b border-slate-200">
                        <nav className="flex space-x-8 px-6" aria-label="Tabs">
                            <button
                                onClick={() => setActiveTab('connections')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'connections'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                } transition-colors`}
                            >
                                <div className="flex items-center space-x-2">
                                    <Users className="w-4 h-4" />
                                    <span>My Connections ({filteredConnections.length})</span>
                                </div>
                            </button>

                            <button
                                onClick={() => setActiveTab('pending')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'pending'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                } transition-colors`}
                            >
                                <div className="flex items-center space-x-2">
                                    <Clock className="w-4 h-4" />
                                    <span>Pending ({filteredPendingRequests.length})</span>
                                    {filteredPendingRequests.some(req => req.isIncoming) && (
                                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    )}
                                </div>
                            </button>

                            <button
                                onClick={() => setActiveTab('discover')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'discover'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                } transition-colors`}
                            >
                                <div className="flex items-center space-x-2">
                                    <MapPin className="w-4 h-4" />
                                    <span>Discover People</span>
                                </div>
                            </button>
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {/* Connections Tab */}
                        {activeTab === 'connections' && (
                            <div>
                                {loading ? (
                                    <div className="flex justify-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : filteredConnections.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Users className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                                        <h3 className="text-lg font-medium text-slate-900 mb-2">No connections yet</h3>
                                        <p className="text-slate-600 mb-4">Start building your professional network!</p>
                                        <button
                                            onClick={() => setActiveTab('discover')}
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                        >
                                            Discover People
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {filteredConnections.map((connection) => (
                                            <div
                                                key={connection.id}
                                                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                                            >
                                                <div className="flex items-center space-x-4">
                                                    <Avatar user={connection.user} size="md" />
                                                    <div>
                                                        <div className="flex items-center space-x-2">
                                                            <Link
                                                                to={`/member/${connection.user.id}`}
                                                                className="font-medium text-slate-900 hover:text-blue-600"
                                                            >
                                                                {connection.user.full_name}
                                                            </Link>
                                                        </div>
                                                        {connection.user.title && (
                                                            <p className="text-sm text-slate-600">
                                                                {connection.user.title}
                                                                {connection.user.organization_name && ` at ${connection.user.organization_name}`}
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-slate-500">
                                                            Connected {formatDate(connection.created_at)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDisconnect(connection.id, connection.user.id)}
                                                    disabled={actionInProgress.has(connection.user.id)}
                                                    className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                                                >
                                                    Disconnect
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Pending Tab */}
                        {activeTab === 'pending' && (
                            <div>
                                {loading ? (
                                    <div className="flex justify-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : filteredPendingRequests.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Clock className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                                        <h3 className="text-lg font-medium text-slate-900 mb-2">No pending requests</h3>
                                        <p className="text-slate-600">All connection requests have been handled.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Incoming Requests */}
                                        {filteredPendingRequests.some(req => req.isIncoming) && (
                                            <div>
                                                <h3 className="text-lg font-medium text-slate-900 mb-4 flex items-center">
                                                    <UserCheck className="w-5 h-5 mr-2 text-green-600" />
                                                    Incoming Requests
                                                </h3>
                                                <div className="grid gap-4">
                                                    {filteredPendingRequests
                                                        .filter(req => req.isIncoming)
                                                        .map((request) => (
                                                            <div
                                                                key={request.id}
                                                                className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200"
                                                            >
                                                                <div className="flex items-center space-x-4">
                                                                    <Avatar user={request.user_profile} size="md" />
                                                                    <div>
                                                                        <div className="flex items-center space-x-2">
                                                                            <Link
                                                                                to={`/member/${request.user_profile.id}`}
                                                                                className="font-medium text-slate-900 hover:text-blue-600"
                                                                            >
                                                                                {request.user_profile.full_name}
                                                                            </Link>
                                                                        </div>
                                                                        {request.user_profile.title && (
                                                                            <p className="text-sm text-slate-600">
                                                                                {request.user_profile.title}
                                                                                {request.user_profile.organization_name && ` at ${request.user_profile.organization_name}`}
                                                                            </p>
                                                                        )}
                                                                        <p className="text-xs text-slate-500">
                                                                            Requested {formatDate(request.created_at)}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex space-x-2">
                                                                    <button
                                                                        onClick={() => handleAcceptRequest(request.id, request.user_profile.id)}
                                                                        disabled={actionInProgress.has(request.user_profile.id)}
                                                                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                                                                    >
                                                                        Accept
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeclineRequest(request.id, request.user_profile.id)}
                                                                        disabled={actionInProgress.has(request.user_profile.id)}
                                                                        className="inline-flex items-center px-3 py-2 border border-slate-300 text-sm leading-4 font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50"
                                                                    >
                                                                        Decline
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Outgoing Requests */}
                                        {filteredPendingRequests.some(req => !req.isIncoming) && (
                                            <div>
                                                <h3 className="text-lg font-medium text-slate-900 mb-4 flex items-center">
                                                    <Clock className="w-5 h-5 mr-2 text-blue-600" />
                                                    Sent Requests
                                                </h3>
                                                <div className="grid gap-4">
                                                    {filteredPendingRequests
                                                        .filter(req => !req.isIncoming)
                                                        .map((request) => (
                                                            <div
                                                                key={request.id}
                                                                className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200"
                                                            >
                                                                <div className="flex items-center space-x-4">
                                                                    <Avatar user={request.user_profile} size="md" />
                                                                    <div>
                                                                        <div className="flex items-center space-x-2">
                                                                            <Link
                                                                                to={`/member/${request.user_profile.id}`}
                                                                                className="font-medium text-slate-900 hover:text-blue-600"
                                                                            >
                                                                                {request.user_profile.full_name}
                                                                            </Link>
                                                                        </div>
                                                                        {request.user_profile.title && (
                                                                            <p className="text-sm text-slate-600">
                                                                                {request.user_profile.title}
                                                                                {request.user_profile.organization_name && ` at ${request.user_profile.organization_name}`}
                                                                            </p>
                                                                        )}
                                                                        <p className="text-xs text-slate-500">
                                                                            Sent {formatDate(request.created_at)}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleWithdrawRequest(request.id, request.user_profile.id)}
                                                                    disabled={actionInProgress.has(request.user_profile.id)}
                                                                    className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                                                                >
                                                                    Withdraw
                                                                </button>
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Discover Tab */}
                        {activeTab === 'discover' && (
                            <div>
                                {discoverLoading ? (
                                    <div className="flex justify-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : filteredDiscoveredMembers.length === 0 ? (
                                    <div className="text-center py-12">
                                        <MapPin className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                                        <h3 className="text-lg font-medium text-slate-900 mb-2">No new people to discover</h3>
                                        <p className="text-slate-600">
                                            {searchQuery ? 'Try adjusting your search terms.' : 'Check back later for new members to connect with.'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {filteredDiscoveredMembers.map((member) => (
                                            <div
                                                key={member.id}
                                                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                                            >
                                                <div className="flex items-center space-x-4">
                                                    <Avatar user={member} size="md" />
                                                    <div>
                                                        <div className="flex items-center space-x-2">
                                                            <Link
                                                                to={`/member/${member.id}`}
                                                                className="font-medium text-slate-900 hover:text-blue-600"
                                                            >
                                                                {member.full_name}
                                                            </Link>
                                                        </div>
                                                        {member.title && (
                                                            <p className="text-sm text-slate-600">
                                                                {member.title}
                                                                {member.organization_name && ` at ${member.organization_name}`}
                                                            </p>
                                                        )}
                                                        {member.location && (
                                                            <p className="text-xs text-slate-500 flex items-center">
                                                                <MapPin className="w-3 h-3 mr-1" />
                                                                {member.location}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleSendConnectionRequest(member.id)}
                                                    disabled={actionInProgress.has(member.id)}
                                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                                                >
                                                    {actionInProgress.has(member.id) ? 'Sending...' : 'Connect'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PublicPageLayout>
    );
}