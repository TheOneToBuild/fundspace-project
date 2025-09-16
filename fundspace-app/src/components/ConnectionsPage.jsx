// src/components/ConnectionsPage.jsx - Enhanced with Discover functionality
import React, { useState, useEffect } from 'react';
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
    getUserConnections
} from '../utils/userConnectionsUtils';

export default function ConnectionsPage() {
    const { profile: currentUserProfile } = useOutletContext();
    const [connections, setConnections] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [discoveredMembers, setDiscoveredMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [discoverLoading, setDiscoverLoading] = useState(false);
    const [actionInProgress, setActionInProgress] = useState(new Set());
    const [activeTab, setActiveTab] = useState('connections'); // 'connections', 'requests', 'discover'
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all'); // 'all', 'nonprofit', 'foundation', 'education', 'government'

    useEffect(() => {
        if (currentUserProfile?.id) {
            fetchConnections();
            fetchPendingRequests();
        }
    }, [currentUserProfile?.id]);

    useEffect(() => {
        if (activeTab === 'discover') {
            fetchDiscoverMembers();
        }
    }, [activeTab, searchQuery, filterType]);

    const fetchConnections = async () => {
        try {
            const result = await getUserConnections(currentUserProfile.id, 100);
            
            if (!result.error) {
                setConnections(result.connections || []);
            } 
        } catch (error) {
            console.error('❌ Error in fetchConnections:', error);
        }
    };

    const fetchPendingRequests = async () => {
        try {
            setLoading(true);
            const result = await getPendingConnectionRequests(currentUserProfile.id);
            
            if (!result.error) {
                setPendingRequests(result.requests || []);
            } 
        } catch (error) {
            console.error('❌ Error in fetchPendingRequests:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDiscoverMembers = async () => {
        try {
            setDiscoverLoading(true);
            
            // Get IDs of users already connected or with pending requests
            const connectedUserIds = new Set([
                ...connections.map(c => c.user.id),
                ...pendingRequests.map(r => r.requester_profile.id)
            ]);

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
                    role,
                    created_at
                `)
                .neq('id', currentUserProfile.id)
                .limit(20);

            // Only filter out connected users if we have any
            if (connectedUserIds.size > 0) {
                query = query.not('id', 'in', `(${Array.from(connectedUserIds).join(',')})`);
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

            const { data, error } = await query.order('created_at', { ascending: false });
            
            if (!error) {
                setDiscoveredMembers(data || []);
            }
        } catch (error) {
            console.error('❌ Error in fetchDiscoverMembers:', error);
        } finally {
            setDiscoverLoading(false);
        }
    };

    const handleSendConnectionRequest = async (userId) => {
        if (actionInProgress.has(userId)) return;

        setActionInProgress(prev => new Set(prev).add(userId));

        try {
            const { error } = await supabase
                .from('user_connections')
                .insert({
                    requester_id: currentUserProfile.id,
                    recipient_id: userId,
                    status: 'pending'
                });

            if (!error) {
                // Remove from discovered members
                setDiscoveredMembers(prev => prev.filter(member => member.id !== userId));
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
    };

    const handleDisconnect = async (connectionId, userId) => {
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
    };

    const handleAcceptRequest = async (requestId, userId) => {
        if (actionInProgress.has(userId)) return;

        setActionInProgress(prev => new Set(prev).add(userId));

        try {
            const result = await acceptConnectionRequest(currentUserProfile.id, userId);
            
            if (result.success) {
                setPendingRequests(prev => prev.filter(req => req.requester_profile.id !== userId));
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
    };

    const handleDeclineRequest = async (requestId, userId) => {
        if (actionInProgress.has(userId)) return;

        setActionInProgress(prev => new Set(prev).add(userId));

        try {
            const result = await declineConnectionRequest(currentUserProfile.id, userId);
            
            if (result.success) {
                setPendingRequests(prev => prev.filter(req => req.requester_profile.id !== userId));
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
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
        return date.toLocaleDateString();
    };

    const ConnectionCard = ({ connection, type = 'connection' }) => {
        const user = type === 'connection' ? connection.user : connection.requester_profile;
        const connectionDate = type === 'connection' ? connection.connected_at : connection.created_at;
        const isActionInProgress = actionInProgress.has(user.id);

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
                                    : `Requested ${formatDate(connectionDate)}`
                                }
                            </div>
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
                        ) : (
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
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const DiscoverCard = ({ member }) => {
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
    };

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
                                {pendingRequests.length > 0 && (
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
                                        <>
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                <p className="text-blue-800 text-sm">
                                                    <strong>{pendingRequests.length}</strong> people want to connect with you professionally. 
                                                    Review and respond to their requests below.
                                                </p>
                                            </div>
                                            {pendingRequests.map(request => (
                                                <ConnectionCard 
                                                    key={request.id} 
                                                    connection={request} 
                                                    type="request"
                                                />
                                            ))}
                                        </>
                                    ) : (
                                        <div className="text-center py-12">
                                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Clock className="w-8 h-8 text-slate-400" />
                                            </div>
                                            <h3 className="text-lg font-medium text-slate-900 mb-2">No pending requests</h3>
                                            <p className="text-slate-600 max-w-md mx-auto">
                                                When people send you connection requests, they'll appear here for you to accept or decline.
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