// src/utils/userConnectionsUtils.js - User connections functionality for professional networking
import { supabase } from '../supabaseClient';

/**
 * Send a connection request to another user
 * @param {string} requesterId - The ID of the user sending the request
 * @param {string} recipientId - The ID of the user receiving the request
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const sendConnectionRequest = async (requesterId, recipientId) => {
  try {
    if (!requesterId || !recipientId) {
      return { success: false, error: 'Both requester and recipient IDs are required' };
    }

    // Don't allow connecting to yourself
    if (requesterId === recipientId) {
      return { success: false, error: 'Cannot connect to yourself' };
    }

    // Check if connection already exists (in either direction)
    const { data: existingConnection, error: checkError } = await supabase
      .from('user_connections')
      .select('id, status, requester_id, recipient_id')
      .or(`and(requester_id.eq.${requesterId},recipient_id.eq.${recipientId}),and(requester_id.eq.${recipientId},recipient_id.eq.${requesterId})`)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      return { success: false, error: checkError.message };
    }

    if (existingConnection) {
      switch (existingConnection.status) {
        case 'accepted':
          return { success: false, error: 'Already connected' };
        case 'pending':
          return { success: false, error: 'Connection request already sent' };
        case 'declined':
          // Allow re-sending after decline
          break;
        case 'blocked':
          return { success: false, error: 'Unable to send connection request' };
      }
    }

    // Create or update the connection request
    let result;
    let connectionId;
    
    if (existingConnection && existingConnection.status === 'declined') {
      // Update existing declined connection to pending
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
      // Create new connection request
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

    // Create notification with connection ID reference
    await createConnectionNotification(requesterId, recipientId, 'connection_request', connectionId);

    return { success: true };
  } catch (error) {
    console.error('Error sending connection request:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Accept a connection request
 * @param {string} currentUserId - The ID of the user accepting the request
 * @param {string} requesterId - The ID of the user who sent the request
 * @returns {Promise<{success: boolean, error?: string}>}
 */
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

    // Create notification for accepted connection with connection ID
    await createConnectionNotification(currentUserId, requesterId, 'connection_accepted', data.id);

    return { success: true };
  } catch (error) {
    console.error('Error accepting connection request:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Decline a connection request
 * @param {string} currentUserId - The ID of the user declining the request
 * @param {string} requesterId - The ID of the user who sent the request
 * @returns {Promise<{success: boolean, error?: string}>}
 */
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
    console.error('Error declining connection request:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Remove/disconnect from a user
 * @param {string} currentUserId - The current user's ID
 * @param {string} otherUserId - The other user's ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const removeConnection = async (currentUserId, otherUserId) => {
  try {
    const { error } = await supabase
      .from('user_connections')
      .delete()
      .or(`and(requester_id.eq.${currentUserId},recipient_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},recipient_id.eq.${currentUserId})`);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error removing connection:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get connection status between two users
 * @param {string} userId1 - First user's ID
 * @param {string} userId2 - Second user's ID
 * @returns {Promise<{status: string, isRequester: boolean, error?: string}>}
 */
export const getConnectionStatus = async (userId1, userId2) => {
  try {
    if (!userId1 || !userId2) {
      return { status: 'none', isRequester: false };
    }

    const { data, error } = await supabase
      .from('user_connections')
      .select('status, requester_id, recipient_id')
      .or(`and(requester_id.eq.${userId1},recipient_id.eq.${userId2}),and(requester_id.eq.${userId2},recipient_id.eq.${userId1})`)
      .single();

    if (error && error.code !== 'PGRST116') {
      return { status: 'none', isRequester: false, error: error.message };
    }

    if (!data) {
      return { status: 'none', isRequester: false };
    }

    return {
      status: data.status,
      isRequester: data.requester_id === userId1
    };
  } catch (error) {
    console.error('Error getting connection status:', error);
    return { status: 'none', isRequester: false, error: error.message };
  }
};

/**
 * Withdraw/cancel a connection request
 * @param {string} requesterId - The ID of the user who sent the request
 * @param {string} recipientId - The ID of the user who received the request
 * @returns {Promise<{success: boolean, error?: string}>}
 */
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

    // Also delete any related notifications
    const { error: notificationError } = await supabase
      .from('notifications')
      .delete()
      .eq('actor_id', requesterId)
      .eq('user_id', recipientId)
      .eq('type', 'connection_request');

    if (notificationError) {
      console.warn('Error deleting connection notification:', notificationError);
      // Don't fail the whole operation for notification cleanup
    }

    return { success: true };
  } catch (error) {
    console.error('Error withdrawing connection request:', error);
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
    console.error('Error getting mutual connections count:', error);
    return { count: 0, error: error.message };
  }
};

/**
 * Get user's connections (accepted connections only)
 * @param {string} userId - The user's ID
 * @param {number} limit - Maximum number of connections to return
 * @returns {Promise<{connections: Array, error?: string}>}
 */
export const getUserConnections = async (userId, limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('user_connections')
      .select(`
        id,
        status,
        created_at,
        requester_id,
        recipient_id,
        requester_profile:requester_id (
          id,
          full_name,
          avatar_url,
          title,
          organization_name
        ),
        recipient_profile:recipient_id (
          id,
          full_name,
          avatar_url,
          title,
          organization_name
        )
      `)
      .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { connections: [], error: error.message };
    }

    // Format the connections to always show the "other" user
    const formattedConnections = data.map(conn => {
      const isRequester = conn.requester_id === userId;
      const otherUser = isRequester ? conn.recipient_profile : conn.requester_profile;
      
      return {
        id: conn.id,
        user: otherUser,
        connected_at: conn.created_at
      };
    });

    return { connections: formattedConnections };
  } catch (error) {
    console.error('Error getting user connections:', error);
    return { connections: [], error: error.message };
  }
};

/**
 * Get pending connection requests for a user
 * @param {string} userId - The user's ID
 * @returns {Promise<{requests: Array, error?: string}>}
 */
export const getPendingConnectionRequests = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_connections')
      .select(`
        id,
        created_at,
        requester_profile:requester_id (
          id,
          full_name,
          avatar_url,
          title,
          organization_name
        )
      `)
      .eq('recipient_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      return { requests: [], error: error.message };
    }

    return { requests: data || [] };
  } catch (error) {
    console.error('Error getting pending connection requests:', error);
    return { requests: [], error: error.message };
  }
};

/**
 * Create a notification for connection events
 * @param {string} actorId - The user performing the action
 * @param {string} recipientId - The user receiving the notification
 * @param {string} type - The type of notification ('connection_request', 'connection_accepted')
 * @param {number} connectionId - The connection ID for reference
 */
const createConnectionNotification = async (actorId, recipientId, type, connectionId = null) => {
  try {
    // Don't create notification if user is connecting to themselves
    if (actorId === recipientId) {
      return { success: true };
    }

    // Use the new database function for better consistency
    const { data, error } = await supabase
      .rpc('create_connection_notification', {
        p_recipient_id: recipientId,
        p_actor_id: actorId,
        p_notification_type: type,
        p_connection_id: connectionId
      });

    if (error) {
      console.error('Error creating connection notification:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Connection notification created: ${type}`);
    return { success: true, notificationId: data };
  } catch (error) {
    console.error('Error in createConnectionNotification:', error);
    return { success: false, error: error.message };
  }
};