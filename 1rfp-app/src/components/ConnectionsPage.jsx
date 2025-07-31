// src/components/ConnectionsPage.jsx
import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Users, UserCheck, UserX, ArrowLeft, Clock, Building, MapPin } from 'lucide-react';
import Avatar from './Avatar';
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
    const [loading, setLoading] = useState(true);
    const [actionInProgress, setActionInProgress] = useState(new Set());
    const [activeTab, setActiveTab] = useState('connections'); // 'connections' or 'requests'

    useEffect(() => {
        if (currentUserProfile?.id) {
            fetchConnections();
            fetchPendingRequests();
        }
    }, [currentUserProfile?.id]);

    const fetchConnections = async () => {
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
    };

    const fetchPendingRequests = async () => {
        try {
            setLoading(true);
            const result = await getPendingConnectionRequests(currentUserProfile.id);
            if (!result.error) {
                setPendingRequests(result.requests || []);
            } else {
                console.error('Error fetching pending requests:', result.error);
            }
        } catch (error) {
            console.error('Error in fetchPendingRequests:', error);
        } finally {
            setLoading(false);
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
                // Remove from local state
                setConnections(prev => prev.filter(conn => conn.user.id !== userId));
            } else {
                console.error('Error disconnecting:', result.error);
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
                // Remove from pending requests
                setPendingRequests(prev => prev.filter(req => req.requester_profile.id !== userId));
                // Refresh connections list
                await fetchConnections();
            } else {
                console.error('Error accepting request:', result.error);
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
                // Remove from pending requests
                setPendingRequests(prev => prev.filter(req => req.requester_profile.id !== userId));
            } else {
                console.error('Error declining request:', result.error);
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

    return (
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
                    <h1 className="text-2xl font-bold text-slate-900">Professional Connections</h1>
                    <p className="text-slate-600">
                        Manage your professional network and connection requests
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
                </nav>
            </div>

            {/* Content */}
            {loading ? (
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
                                    <Link 
                                        to="/profile/members"
                                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        <Users className="w-4 h-4 mr-2" />
                                        Discover Professionals
                                    </Link>
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
                </>
            )}
        </div>
    );
}