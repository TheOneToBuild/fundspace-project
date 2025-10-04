import { supabase } from '../supabaseClient';
import { getBatchConnectionStatus, getUserProfileComplete } from './rpcClientFunctions';

export const getConnectionStatus = async (userId1, userId2) => {
  try {
    if (!userId1 || !userId2) {
      return { status: 'none', isRequester: false };
    }

    const result = await getBatchConnectionStatus(userId1, [userId2]);
    const status = result.connections?.[userId2] || { status: 'none', isRequester: false };
    
    return status;

  } catch (error) {
    console.error('Error getting connection status:', error);
    return { status: 'none', isRequester: false, error: error.message };
  }
};

export const getBatchConnectionStatuses = async (currentUserId, targetUserIds) => {
  try {
    if (!currentUserId || !targetUserIds || targetUserIds.length === 0) {
      return {};
    }

    const result = await getBatchConnectionStatus(currentUserId, targetUserIds);
    return result.connections || {};
  } catch (error) {
    console.error('Error getting batch connection statuses:', error);
    return {};
  }
};

export const getMutualConnectionsCount = async (userId1, userId2) => {
  try {
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_mutual_connections', {
        user1_id: userId1,
        user2_id: userId2
      });

    if (!rpcError) {
      return { count: rpcData || 0 };
    }

    const { data: mutualData } = await supabase
      .from('user_connections')
      .select('requester_id, recipient_id')
      .eq('status', 'accepted');

    if (!mutualData) return { count: 0 };

    const user1Ids = new Set();
    const user2Ids = new Set();

    mutualData.forEach(conn => {
      if (conn.requester_id === userId1) user1Ids.add(conn.recipient_id);
      if (conn.recipient_id === userId1) user1Ids.add(conn.requester_id);
      if (conn.requester_id === userId2) user2Ids.add(conn.recipient_id);
      if (conn.recipient_id === userId2) user2Ids.add(conn.requester_id);
    });

    const mutual = [...user1Ids].filter(id => user2Ids.has(id));
    return { count: mutual.length };
  } catch (error) {
    return { count: 0, error: error.message };
  }
};

export const sendConnectionRequest = async (requesterId, recipientId) => {
  try {
    if (!requesterId || !recipientId) {
      return { success: false, error: 'Both requester and recipient IDs are required' };
    }
    if (requesterId === recipientId) {
      return { success: false, error: 'Cannot connect to yourself' };
    }

    const [query1, query2] = await Promise.all([
      supabase
        .from('user_connections')
        .select('id, status, requester_id, recipient_id')
        .eq('requester_id', requesterId)
        .eq('recipient_id', recipientId)
        .maybeSingle(),
      supabase
        .from('user_connections')
        .select('id, status, requester_id, recipient_id')
        .eq('requester_id', recipientId)
        .eq('recipient_id', requesterId)
        .maybeSingle()
    ]);

    if (query1.error || query2.error) {
      return { success: false, error: query1.error?.message || query2.error?.message };
    }

    const existingConnection = query1.data || query2.data;

    if (existingConnection) {
      switch (existingConnection.status) {
        case 'accepted':
          return { success: false, error: 'Already connected' };
        case 'pending':
          return { success: false, error: 'Connection request already sent' };
        case 'declined':
          break;
        case 'blocked':
          return { success: false, error: 'Unable to send connection request' };
      }
    }

    let result;
    let connectionId;

    if (existingConnection && existingConnection.status === 'declined') {
      result = await supabase
        .from('user_connections')
        .update({
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingConnection.id)
        .select('id')
        .single();
      connectionId = existingConnection.id;
    } else {
      result = await supabase
        .from('user_connections')
        .insert({
          requester_id: requesterId,
          recipient_id: recipientId,
          status: 'pending'
        })
        .select('id')
        .single();
      connectionId = result.data?.id;
    }

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    await createConnectionNotification(requesterId, recipientId, 'connection_request', connectionId);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const acceptConnectionRequest = async (currentUserId, requesterId) => {
  try {
    const { data, error } = await supabase
      .from('user_connections')
      .update({
        status: 'accepted',
        updated_at: new Date().toISOString()
      })
      .eq('requester_id', requesterId)
      .eq('recipient_id', currentUserId)
      .eq('status', 'pending')
      .select('id')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    await createConnectionNotification(currentUserId, requesterId, 'connection_accepted', data.id);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const declineConnectionRequest = async (currentUserId, requesterId) => {
  try {
    const { error } = await supabase
      .from('user_connections')
      .update({
        status: 'declined',
        updated_at: new Date().toISOString()
      })
      .eq('requester_id', requesterId)
      .eq('recipient_id', currentUserId)
      .eq('status', 'pending');

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const removeConnection = async (currentUserId, otherUserId) => {
  try {
    const [delete1, delete2] = await Promise.all([
      supabase
        .from('user_connections')
        .delete()
        .eq('requester_id', currentUserId)
        .eq('recipient_id', otherUserId),
      supabase
        .from('user_connections')
        .delete()
        .eq('requester_id', otherUserId)
        .eq('recipient_id', currentUserId)
    ]);

    if (delete1.error && delete2.error) {
      return { success: false, error: delete1.error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const withdrawConnectionRequest = async (requesterId, recipientId) => {
  try {
    if (!requesterId || !recipientId) {
      return { success: false, error: 'Both requester and recipient IDs are required' };
    }

    const { error } = await supabase
      .from('user_connections')
      .delete()
      .eq('requester_id', requesterId)
      .eq('recipient_id', recipientId)
      .eq('status', 'pending');

    if (error) {
      return { success: false, error: error.message };
    }

    const { error: notificationError } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', recipientId)
      .eq('type', 'connection_request');

    if (notificationError) {
      console.warn('Could not clean up notification:', notificationError);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getUserConnections = async (userId, limit = 50) => {
  if (!userId) return { connections: [], error: 'User ID is required' };

  try {
    // Use the optimized RPC function to get connections with profile data included
    const result = await getUserConnectionsComplete(userId, 'accepted');

    if (result.error) {
      throw result.error;
    }

    // The RPC function returns a complete payload, we just need to format it
    const formattedConnections = (result.connections || []).map(conn => {
      return {
        id: conn.connection_id,
        user: {
          id: conn.profile_id,
          full_name: conn.full_name,
          avatar_url: conn.avatar_url,
          title: conn.title,
          organization_name: conn.organization_name,
          location: conn.location
        },
        connected_at: conn.updated_at || conn.created_at
      };
    });

    return { connections: formattedConnections.slice(0, limit) };
  } catch (error) {
    return { connections: [], error: error.message };
  }
};

export const getPendingConnectionRequests = async (userId) => {
  try {
    const { data: requestsData, error: requestsError } = await supabase
      .from('user_connections')
      .select('id, created_at, requester_id')
      .eq('recipient_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (requestsError) {
      return { requests: [], error: requestsError.message };
    }

    if (!requestsData || requestsData.length === 0) {
      return { requests: [] };
    }

    const requesterIds = requestsData.map(req => req.requester_id);

    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, title, organization_name')
      .in('id', requesterIds);

    if (profilesError) {
      return { requests: [], error: profilesError.message };
    }

    const profilesMap = {};
    profilesData.forEach(profile => {
      profilesMap[profile.id] = profile;
    });

    const formattedRequests = requestsData.map(req => {
      const requesterProfile = profilesMap[req.requester_id];
      return {
        id: req.id,
        created_at: req.created_at,
        requester_profile: requesterProfile || {
          id: req.requester_id,
          full_name: 'Unknown User',
          avatar_url: null,
          title: null,
          organization_name: null
        }
      };
    });

    return { requests: formattedRequests };
  } catch (error) {
    return { requests: [], error: error.message };
  }
};

const createConnectionNotification = async (actorId, recipientId, type, connectionId = null) => {
  try {
    if (actorId === recipientId) {
      return { success: true };
    }

    const { data, error } = await supabase.rpc('create_connection_notification', {
      p_actor_id: actorId,
      p_recipient_id: recipientId,
      p_notification_type: type,
      p_connection_id: connectionId
    });

    if (error) {
      console.error('Notification creation error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, notificationId: data };
  } catch (error) {
    console.error('Notification creation failed:', error);
    return { success: false, error: error.message };
  }
};