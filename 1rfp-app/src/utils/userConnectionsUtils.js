import { supabase } from '../supabaseClient';

export const sendConnectionRequest = async (requesterId, recipientId) => {
  try {
    if (!requesterId || !recipientId) {
      return { success: false, error: 'Both requester and recipient IDs are required' };
    }
    if (requesterId === recipientId) {
      return { success: false, error: 'Cannot connect to yourself' };
    }

    // FIXED: Use two separate queries instead of complex OR with AND
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
    // FIXED: Use two separate delete operations
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

export const getConnectionStatus = async (userId1, userId2) => {
  try {
    if (!userId1 || !userId2) {
      return { status: 'none', isRequester: false };
    }

    // FIXED: Use two separate queries instead of complex OR with AND
    const [query1, query2] = await Promise.all([
      supabase
        .from('user_connections')
        .select('status, requester_id, recipient_id')
        .eq('requester_id', userId1)
        .eq('recipient_id', userId2)
        .maybeSingle(),
      supabase
        .from('user_connections')
        .select('status, requester_id, recipient_id')
        .eq('requester_id', userId2)
        .eq('recipient_id', userId1)
        .maybeSingle()
    ]);

    if (query1.error || query2.error) {
      return { status: 'none', isRequester: false, error: query1.error?.message || query2.error?.message };
    }

    const data = query1.data || query2.data;

    if (!data) {
      return { status: 'none', isRequester: false };
    }

    return {
      status: data.status,
      isRequester: data.requester_id === userId1
    };
  } catch (error) {
    return { status: 'none', isRequester: false, error: error.message };
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

    // Clean up notification
    const { error: notificationError } = await supabase
      .from('notifications')
      .delete()
      .eq('actor_id', requesterId)
      .eq('user_id', recipientId)
      .eq('type', 'connection_request');

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getMutualConnectionsCount = async (userId1, userId2) => {
  try {
    const { data, error } = await supabase
      .rpc('get_mutual_connections', {
        user1_id: userId1,
        user2_id: userId2
      });

    if (error) {
      return { count: 0, error: error.message };
    }
    return { count: data || 0 };
  } catch (error) {
    return { count: 0, error: error.message };
  }
};

export const getUserConnections = async (userId, limit = 50) => {
  try {
    const { data: connectionsData, error: connectionsError } = await supabase
      .from('user_connections')
      .select('id, status, created_at, requester_id, recipient_id')
      .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (connectionsError) {
      return { connections: [], error: connectionsError.message };
    }

    if (!connectionsData || connectionsData.length === 0) {
      return { connections: [] };
    }

    const otherUserIds = connectionsData.map(conn => {
      return conn.requester_id === userId ? conn.recipient_id : conn.requester_id;
    });

    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, title, organization_name')
      .in('id', otherUserIds);

    if (profilesError) {
      return { connections: [], error: profilesError.message };
    }

    const profilesMap = {};
    profilesData.forEach(profile => {
      profilesMap[profile.id] = profile;
    });

    const formattedConnections = connectionsData.map(conn => {
      const isRequester = conn.requester_id === userId;
      const otherUserId = isRequester ? conn.recipient_id : conn.requester_id;
      const otherUser = profilesMap[otherUserId];
      
      return {
        id: conn.id,
        user: otherUser || {
          id: otherUserId,
          full_name: 'Unknown User',
          avatar_url: null,
          title: null,
          organization_name: null
        },
        connected_at: conn.created_at
      };
    });

    return { connections: formattedConnections };
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

    const { data, error } = await supabase
      .rpc('create_connection_notification', {
        p_recipient_id: recipientId,
        p_actor_id: actorId,
        p_notification_type: type,
        p_connection_id: connectionId
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, notificationId: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};