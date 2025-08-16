// src/hooks/useTeamMemberSocial.js - Hooks for team member follow and connect functionality
import { useState, useEffect, useCallback } from 'react';
import { followUser, unfollowUser, checkFollowStatus } from '../utils/followUtils';
import { 
  sendConnectionRequest, 
  getConnectionStatus, 
  getMutualConnectionsCount,
  acceptConnectionRequest,
  removeConnection,
  withdrawConnectionRequest 
} from '../utils/userConnectionsUtils';

/**
 * Hook for managing follow/unfollow functionality for team members
 * @param {string} memberId - The team member's profile ID
 * @param {string} currentUserId - The current user's ID
 */
export const useTeamMemberFollow = (memberId, currentUserId) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check initial follow status
  useEffect(() => {
    const checkStatus = async () => {
      if (!memberId || !currentUserId || memberId === currentUserId) return;
      
      try {
        const { isFollowing: followStatus } = await checkFollowStatus(currentUserId, memberId);
        setIsFollowing(followStatus);
      } catch (error) {
        console.error('Error checking follow status:', error);
      }
    };

    checkStatus();
  }, [memberId, currentUserId]);

  const toggleFollow = useCallback(async () => {
    if (!currentUserId || !memberId || memberId === currentUserId) return;

    setLoading(true);
    try {
      let result;
      if (isFollowing) {
        result = await unfollowUser(currentUserId, memberId);
      } else {
        result = await followUser(currentUserId, memberId);
      }

      if (result.success) {
        setIsFollowing(!isFollowing);
      } else {
        console.error('Follow toggle failed:', result.error);
        // You might want to show a toast notification here
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, memberId, isFollowing]);

  return {
    isFollowing,
    loading,
    toggleFollow
  };
};

/**
 * Hook for managing connection functionality for team members
 * @param {string} memberId - The team member's profile ID
 * @param {string} currentUserId - The current user's ID
 */
export const useTeamMemberConnection = (memberId, currentUserId) => {
  const [connectionStatus, setConnectionStatus] = useState('none'); // 'none', 'pending', 'accepted', 'declined'
  const [isRequester, setIsRequester] = useState(false);
  const [mutualConnections, setMutualConnections] = useState(0);
  const [loading, setLoading] = useState(false);

  // Check initial connection status and mutual connections
  useEffect(() => {
    const checkStatus = async () => {
      if (!memberId || !currentUserId || memberId === currentUserId) return;
      
      try {
        // Get connection status
        const { status, isRequester: requesterStatus } = await getConnectionStatus(currentUserId, memberId);
        setConnectionStatus(status);
        setIsRequester(requesterStatus);

        // Get mutual connections count
        const { count } = await getMutualConnectionsCount(currentUserId, memberId);
        setMutualConnections(count);
      } catch (error) {
        console.error('Error checking connection status:', error);
      }
    };

    checkStatus();
  }, [memberId, currentUserId]);

  const sendRequest = useCallback(async () => {
    if (!currentUserId || !memberId || memberId === currentUserId) return;

    setLoading(true);
    try {
      const result = await sendConnectionRequest(currentUserId, memberId);
      
      if (result.success) {
        setConnectionStatus('pending');
        setIsRequester(true);
      } else {
        console.error('Connection request failed:', result.error);
        // You might want to show a toast notification here
      }
    } catch (error) {
      console.error('Error sending connection request:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, memberId]);

  const acceptRequest = useCallback(async () => {
    if (!currentUserId || !memberId) return;

    setLoading(true);
    try {
      const result = await acceptConnectionRequest(currentUserId, memberId);
      
      if (result.success) {
        setConnectionStatus('accepted');
      } else {
        console.error('Accept connection failed:', result.error);
      }
    } catch (error) {
      console.error('Error accepting connection:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, memberId]);

  const withdrawRequest = useCallback(async () => {
    if (!currentUserId || !memberId) return;

    setLoading(true);
    try {
      const result = await withdrawConnectionRequest(currentUserId, memberId);
      
      if (result.success) {
        setConnectionStatus('none');
        setIsRequester(false);
      } else {
        console.error('Withdraw request failed:', result.error);
      }
    } catch (error) {
      console.error('Error withdrawing request:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, memberId]);

  const disconnect = useCallback(async () => {
    if (!currentUserId || !memberId) return;

    setLoading(true);
    try {
      const result = await removeConnection(currentUserId, memberId);
      
      if (result.success) {
        setConnectionStatus('none');
        setIsRequester(false);
      } else {
        console.error('Disconnect failed:', result.error);
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, memberId]);

  // Get button text and action based on status
  const getConnectionButtonProps = () => {
    switch (connectionStatus) {
      case 'none':
        return {
          text: 'Connect',
          action: sendRequest,
          variant: 'primary',
          disabled: loading
        };
      case 'pending':
        if (isRequester) {
          return {
            text: 'Withdraw',
            action: withdrawRequest,
            variant: 'secondary',
            disabled: loading
          };
        } else {
          return {
            text: 'Accept',
            action: acceptRequest,
            variant: 'primary',
            disabled: loading
          };
        }
      case 'accepted':
        return {
          text: 'Connected',
          action: disconnect,
          variant: 'connected',
          disabled: loading
        };
      case 'declined':
        return {
          text: 'Connect',
          action: sendRequest,
          variant: 'primary',
          disabled: loading
        };
      default:
        return {
          text: 'Connect',
          action: sendRequest,
          variant: 'primary',
          disabled: loading
        };
    }
  };

  return {
    connectionStatus,
    isRequester,
    mutualConnections,
    loading,
    sendRequest,
    acceptRequest,
    disconnect,
    getConnectionButtonProps
  };
};

/**
 * Combined hook for both follow and connection functionality
 * @param {string} memberId - The team member's profile ID
 * @param {string} currentUserId - The current user's ID
 */
export const useTeamMemberSocial = (memberId, currentUserId) => {
  const followHook = useTeamMemberFollow(memberId, currentUserId);
  const connectionHook = useTeamMemberConnection(memberId, currentUserId);

  return {
    // Follow functionality
    isFollowing: followHook.isFollowing,
    followLoading: followHook.loading,
    toggleFollow: followHook.toggleFollow,
    
    // Connection functionality
    connectionStatus: connectionHook.connectionStatus,
    isRequester: connectionHook.isRequester,
    mutualConnections: connectionHook.mutualConnections,
    connectionLoading: connectionHook.loading,
    sendConnectionRequest: connectionHook.sendRequest,
    acceptConnection: connectionHook.acceptRequest,
    disconnect: connectionHook.disconnect,
    withdrawRequest: connectionHook.withdrawRequest,
    getConnectionButtonProps: connectionHook.getConnectionButtonProps
  };
};