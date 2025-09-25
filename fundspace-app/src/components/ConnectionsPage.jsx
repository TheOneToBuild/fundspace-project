// src/components/ConnectionsPage.jsx - Fixed with proper auth user ID handling
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Users, UserCheck, UserX, ArrowLeft, Clock, Building, MapPin, Search, Filter } from 'lucide-react';
import Avatar from './Avatar';
import PublicPageLayout from './PublicPageLayout.jsx';
import globalDataManager from '../utils/globalDataManager';

// Enhanced connections data loader that batches all connection-related queries
class ConnectionsDataManager {
  constructor() {
    this.cache = new Map();
    this.CACHE_TTL = 30000; // 30 seconds
  }

  getCacheKey(type, params) {
    return `connections-${type}-${JSON.stringify(params)}`;
  }

  isValidCache(cacheItem) {
    return cacheItem && (Date.now() - cacheItem.timestamp) < this.CACHE_TTL;
  }

  setCache(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  getCache(key) {
    const item = this.cache.get(key);
    return this.isValidCache(item) ? item.data : null;
  }

  // Get the current user's auth ID
  async getCurrentAuthUserId() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Batch load all connection data in one go
  async loadAllConnectionData() {
    const cacheKey = this.getCacheKey('all-data', {});
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      // Get the current auth user ID first
      const authUserId = await this.getCurrentAuthUserId();
      if (!authUserId) {
        throw new Error('No authenticated user found');
      }

      // Execute all queries in parallel for maximum efficiency
      const [
        connectionsResult,
        incomingRequestsResult,
        outgoingRequestsResult,
        sentRequestsResult
      ] = await Promise.all([
        // Get established connections
        supabase
          .from('user_connections')
          .select('id, created_at, requester_id, recipient_id, updated_at')
          .or(`requester_id.eq.${authUserId},recipient_id.eq.${authUserId}`)
          .eq('status', 'accepted'),
        
        // Get incoming pending requests
        supabase
          .from('user_connections')
          .select('id, created_at, requester_id')
          .eq('recipient_id', authUserId)
          .eq('status', 'pending'),
        
        // Get outgoing pending requests
        supabase
          .from('user_connections')
          .select('id, created_at, recipient_id')
          .eq('requester_id', authUserId)
          .eq('status', 'pending'),
        
        // Get all sent requests for discovery filtering
        supabase
          .from('user_connections')
          .select('recipient_id')
          .eq('requester_id', authUserId)
          .eq('status', 'pending')
      ]);

      // Collect all auth user IDs we need profile data for
      const allAuthUserIds = new Set();
      
      // Add connection user IDs
      connectionsResult.data?.forEach(conn => {
        const otherUserId = conn.requester_id === authUserId ? conn.recipient_id : conn.requester_id;
        allAuthUserIds.add(otherUserId);
      });
      
      // Add request user IDs
      incomingRequestsResult.data?.forEach(req => allAuthUserIds.add(req.requester_id));
      outgoingRequestsResult.data?.forEach(req => allAuthUserIds.add(req.recipient_id));

      // Convert auth user IDs to profile data
      let authUserToProfileMap = {};
      let allUserProfiles = {};
      let orgMembershipsData = {};

      if (allAuthUserIds.size > 0) {
        const authUserIdsArray = Array.from(allAuthUserIds);
        
        // Get profiles for these auth user IDs - assuming profiles table has auth_user_id column
        // If your profiles.id IS the auth user ID, use this instead:
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, title, location, organizational_role')
          .in('id', authUserIdsArray); // Change this line if your schema is different
        
        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
        } else {
          // Create mapping from auth_user_id to profile data
          profilesData?.forEach(profile => {
            authUserToProfileMap[profile.id] = profile; // Assuming profile.id = auth user id
            allUserProfiles[profile.id] = profile;
          });

          // Get organization memberships for all profile IDs
          const profileIds = profilesData?.map(p => p.id).filter(Boolean) || [];
          if (profileIds.length > 0) {
            orgMembershipsData = await globalDataManager.getOrganizationMemberships(profileIds);
          }
        }
      }

      // Process connections with enhanced profile data
      const connections = connectionsResult.data?.map(conn => {
        const otherAuthUserId = conn.requester_id === authUserId ? conn.recipient_id : conn.requester_id;
        const userProfile = authUserToProfileMap[otherAuthUserId] || { id: otherAuthUserId, full_name: 'Unknown User' };
        const orgMembership = orgMembershipsData[userProfile.id];
        
        return {
          id: conn.id,
          connected_at: conn.updated_at || conn.created_at,
          user: {
            ...userProfile,
            organization_name: orgMembership?.organization?.name || userProfile.organization_name,
            organization_type: orgMembership?.organization?.type || userProfile.organization_type,
            role: orgMembership?.role || userProfile.role
          }
        };
      }) || [];

      // Process pending requests with enhanced profile data
      const pendingRequests = [
        // Incoming requests
        ...(incomingRequestsResult.data?.map(req => {
          const userProfile = authUserToProfileMap[req.requester_id] || { id: req.requester_id, full_name: 'Unknown User' };
          const orgMembership = orgMembershipsData[userProfile.id];
          
          return {
            id: req.id,
            created_at: req.created_at,
            type: 'incoming',
            isIncoming: true,
            user_profile: {
              ...userProfile,
              organization_name: orgMembership?.organization?.name || userProfile.organization_name,
              organization_type: orgMembership?.organization?.type || userProfile.organization_type,
              role: orgMembership?.role || userProfile.role
            }
          };
        }) || []),
        // Outgoing requests
        ...(outgoingRequestsResult.data?.map(req => {
          const userProfile = authUserToProfileMap[req.recipient_id] || { id: req.recipient_id, full_name: 'Unknown User' };
          const orgMembership = orgMembershipsData[userProfile.id];
          
          return {
            id: req.id,
            created_at: req.created_at,
            type: 'outgoing',
            isIncoming: false,
            user_profile: {
              ...userProfile,
              organization_name: orgMembership?.organization?.name || userProfile.organization_name,
              organization_type: orgMembership?.organization?.type || userProfile.organization_type,
              role: orgMembership?.role || userProfile.role
            }
          };
        }) || [])
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Get connected user IDs for discovery filtering (use profile IDs)
      const connectedProfileIds = new Set([
        ...connections.map(c => c.user.id),
        ...pendingRequests.map(r => r.user_profile.id),
        ...(sentRequestsResult.data?.map(r => authUserToProfileMap[r.recipient_id]?.id).filter(Boolean) || [])
      ]);

      const result = {
        connections,
        pendingRequests,
        connectedProfileIds,
        authUserId
      };

      this.setCache(cacheKey, result);
      return result;

    } catch (error) {
      console.error('Error loading connection data:', error);
      return {
        connections: [],
        pendingRequests: [],
        connectedProfileIds: new Set(),
        authUserId: null
      };
    }
  }

  // Batch load discovery data
  async loadDiscoveryData(searchQuery = '', filterType = 'all', connectedProfileIds = new Set()) {
    const cacheKey = this.getCacheKey('discovery', { searchQuery, filterType });
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      // Get current user's profile ID to exclude from results
      const authUserId = await this.getCurrentAuthUserId();
      if (!authUserId) return [];

      const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', authUserId)
        .single();

      let query = supabase
        .from('profiles')
        .select('id, full_name, title, avatar_url, location, organization_name, organization_type, role')
        .limit(20);

      // Exclude current user
      if (currentUserProfile?.id) {
        query = query.neq('id', currentUserProfile.id);
      }

      // Filter out connected users
      if (connectedProfileIds.size > 0) {
        const userIdArray = Array.from(connectedProfileIds);
        query = query.not('id', 'in', `(${userIdArray.map(id => `"${id}"`).join(',')})`);
      }

      // Apply search filter
      if (searchQuery.trim()) {
        query = query.or(`full_name.ilike.%${searchQuery}%,organization_name.ilike.%${searchQuery}%,title.ilike.%${searchQuery}%`);
      }

      // Apply type filter
      if (filterType !== 'all') {
        const filterMap = {
          nonprofit: 'nonprofit%',
          foundation: 'foundation%',
          education: 'education%',
          government: 'government%'
        };
        if (filterMap[filterType]) {
          query = query.ilike('organization_type', filterMap[filterType]);
        }
      }

      const { data, error } = await query.order('updated_at', { ascending: false });
      
      if (error) throw error;

      const result = data || [];
      this.setCache(cacheKey, result);
      return result;

    } catch (error) {
      console.error('Error loading discovery data:', error);
      return [];
    }
  }

  clearCache() {
    this.cache.clear();
  }
}

const connectionsDataManager = new ConnectionsDataManager();

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
  
  const connectedProfileIdsRef = useRef(new Set());
  const authUserIdRef = useRef(null);

  // Load all connection data in batches
  const loadConnectionData = useCallback(async () => {
    if (!currentUserProfile?.id) return;
    
    setLoading(true);
    
    try {
      const data = await connectionsDataManager.loadAllConnectionData();
      
      setConnections(data.connections);
      setPendingRequests(data.pendingRequests);
      connectedProfileIdsRef.current = data.connectedProfileIds;
      authUserIdRef.current = data.authUserId;
      
    } catch (error) {
      console.error('Error loading connection data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUserProfile?.id]);

  // Load discovery data
  const loadDiscoveryData = useCallback(async () => {
    if (!currentUserProfile?.id) return;
    
    setDiscoverLoading(true);
    
    try {
      const data = await connectionsDataManager.loadDiscoveryData(
        searchQuery,
        filterType,
        connectedProfileIdsRef.current
      );
      
      setDiscoveredMembers(data);
      
    } catch (error) {
      console.error('Error loading discovery data:', error);
    } finally {
      setDiscoverLoading(false);
    }
  }, [currentUserProfile?.id, searchQuery, filterType]);

  // Initial data load
  useEffect(() => {
    loadConnectionData();
  }, [loadConnectionData]);

  // Load discovery when needed
  useEffect(() => {
    if (activeTab === 'discover') {
      loadDiscoveryData();
    }
  }, [activeTab, loadDiscoveryData]);

  // Action handlers with optimistic updates and cache invalidation
  const handleSendConnectionRequest = useCallback(async (profileId) => {
    if (actionInProgress.has(profileId)) return;
    if (!authUserIdRef.current) return;

    setActionInProgress(prev => new Set(prev).add(profileId));

    try {
      // Get the recipient's auth user ID from their profile ID
      const { data: recipientProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', profileId)
        .single();

      if (!recipientProfile) {
        throw new Error('Recipient profile not found');
      }

      const { error } = await supabase
        .from('user_connections')
        .insert({
          requester_id: authUserIdRef.current,
          recipient_id: recipientProfile.id, // This should be the auth user ID
          status: 'pending'
        });
      
      if (error) throw error;
      
      // Clear cache and reload data
      connectionsDataManager.clearCache();
      setDiscoveredMembers(prev => prev.filter(member => member.id !== profileId));
      await loadConnectionData();
      
    } catch (error) {
      console.error('Error sending connection request:', error);
    } finally {
      setActionInProgress(prev => {
        const newSet = new Set(prev);
        newSet.delete(profileId);
        return newSet;
      });
    }
  }, [loadConnectionData]);

  const handleAcceptRequest = useCallback(async (requestId, profileId) => {
    if (actionInProgress.has(profileId)) return;

    setActionInProgress(prev => new Set(prev).add(profileId));

    try {
      const { error } = await supabase
        .from('user_connections')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', requestId);
      
      if (error) throw error;
      
      // Clear cache and reload data
      connectionsDataManager.clearCache();
      await loadConnectionData();
      
    } catch (error) {
      console.error('Error accepting connection request:', error);
    } finally {
      setActionInProgress(prev => {
        const newSet = new Set(prev);
        newSet.delete(profileId);
        return newSet;
      });
    }
  }, [loadConnectionData]);

  const handleDeclineRequest = useCallback(async (requestId, profileId) => {
    if (actionInProgress.has(profileId)) return;

    setActionInProgress(prev => new Set(prev).add(profileId));

    try {
      const { error } = await supabase
        .from('user_connections')
        .delete()
        .eq('id', requestId);
      
      if (error) throw error;
      
      // Clear cache and reload data
      connectionsDataManager.clearCache();
      await loadConnectionData();
      
    } catch (error) {
      console.error('Error declining connection request:', error);
    } finally {
      setActionInProgress(prev => {
        const newSet = new Set(prev);
        newSet.delete(profileId);
        return newSet;
      });
    }
  }, [loadConnectionData]);

  const handleWithdrawRequest = useCallback(async (requestId, profileId) => {
    if (actionInProgress.has(profileId)) return;

    setActionInProgress(prev => new Set(prev).add(profileId));

    try {
      const { error } = await supabase
        .from('user_connections')
        .delete()
        .eq('id', requestId);
      
      if (error) throw error;
      
      // Clear cache and reload data
      connectionsDataManager.clearCache();
      await loadConnectionData();
      await loadDiscoveryData();
      
    } catch (error) {
      console.error('Error withdrawing request:', error);
    } finally {
      setActionInProgress(prev => {
        const newSet = new Set(prev);
        newSet.delete(profileId);
        return newSet;
      });
    }
  }, [loadConnectionData, loadDiscoveryData]);

  const handleDisconnect = useCallback(async (connectionId, profileId) => {
    if (actionInProgress.has(profileId)) return;
    if (!window.confirm('Are you sure you want to disconnect? This will remove the professional connection between you.')) {
      return;
    }

    setActionInProgress(prev => new Set(prev).add(profileId));

    try {
      const { error } = await supabase
        .from('user_connections')
        .delete()
        .eq('id', connectionId);
      
      if (error) throw error;
      
      // Clear cache and reload data
      connectionsDataManager.clearCache();
      await loadConnectionData();
      
    } catch (error) {
      console.error('Error disconnecting:', error);
    } finally {
      setActionInProgress(prev => {
        const newSet = new Set(prev);
        newSet.delete(profileId);
        return newSet;
      });
    }
  }, [loadConnectionData]);

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

  // Component rendering (UI remains the same, just using optimized data)
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

          {activeTab === 'discover' && (
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex flex-col sm:flex-row gap-4">
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

          {loading && activeTab !== 'discover' ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <p className="text-slate-600 mt-2">Loading your connections...</p>
            </div>
          ) : (
            <>
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