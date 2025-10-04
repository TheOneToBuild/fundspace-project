import { supabase } from '../supabaseClient';

export const createFollowerNotification = async (followerId, followingId) => {
  try {
    if (followerId === followingId) {
      return { success: true };
    }

    const notificationData = {
      user_id: followingId,
      actor_id: followerId,
      type: 'new_follower',
      is_read: false,
    };

    const { error } = await supabase
      .from('notifications')
      .insert(notificationData);

    if (error) {
      console.error('Error creating follower notification:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in createFollowerNotification:', error);
    return { success: false, error: error.message };
  }
};

export const followUser = async (followerId, followingId) => {
  try {
    if (!followerId || !followingId) {
      return { success: false, error: 'Both follower and following IDs are required' };
    }

    if (followerId === followingId) {
      return { success: false, error: 'Cannot follow yourself' };
    }

    // Use the RPC function instead of direct query
    const followStatus = await checkFollowStatus(followerId, followingId);
    
    if (followStatus.isFollowing) {
      return { success: false, error: 'Already following this user' };
    }

    const { error: followError } = await supabase
      .from('followers')
      .insert({
        follower_id: followerId,
        following_id: followingId
      });

    if (followError) {
      return { success: false, error: followError.message };
    }

    const notificationResult = await createFollowerNotification(followerId, followingId);
    
    if (!notificationResult.success) {
      console.warn('Follow successful but notification failed:', notificationResult.error);
    }

    broadcastFollowEvent('follow', followerId, followingId);

    return { success: true };
  } catch (error) {
    console.error('Error in followUser:', error);
    return { success: false, error: error.message };
  }
};

export const unfollowUser = async (followerId, followingId) => {
  try {
    if (!followerId || !followingId) {
      return { success: false, error: 'Both follower and following IDs are required' };
    }

    const { error } = await supabase
      .from('followers')
      .delete()
      .match({
        follower_id: followerId,
        following_id: followingId
      });

    if (error) {
      return { success: false, error: error.message };
    }

    broadcastFollowEvent('unfollow', followerId, followingId);
    
    return { success: true };
  } catch (error) {
    console.error('Error in unfollowUser:', error);
    return { success: false, error: error.message };
  }
};

const broadcastFollowEvent = (action, followerId, followingId) => {
  try {
    const event = new CustomEvent('followUpdate', {
      detail: {
        action,
        followerId,
        followingId,
        timestamp: Date.now()
      }
    });
    
    window.dispatchEvent(event);
  } catch (error) {
    console.error('Error broadcasting follow event:', error);
  }
};

export const checkFollowStatus = async (followerId, followingId) => {
  try {
    if (!followerId || !followingId) {
      return { isFollowing: false };
    }

    const { data, error } = await supabase.rpc('check_follow_status', {
      p_follower_id: followerId,
      p_following_id: followingId
    });

    if (error) {
      console.error('Error checking follow status:', error);
      return { isFollowing: false, error: error.message };
    }

    return { isFollowing: data };
  } catch (error) {
    console.error('Error checking follow status:', error);
    return { isFollowing: false, error: error.message };
  }
};

export const getFollowStats = async (userId) => {
  try {
    if (!userId) {
      return { followersCount: 0, followingCount: 0 };
    }

    const [followersResult, followingResult] = await Promise.all([
      supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId),
      supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId)
    ]);

    if (followersResult.error) {
      console.error('Error fetching followers count:', followersResult.error);
    }

    if (followingResult.error) {
      console.error('Error fetching following count:', followingResult.error);
    }

    return {
      followersCount: followersResult.count || 0,
      followingCount: followingResult.count || 0
    };
  } catch (error) {
    console.error('Error getting follow stats:', error);
    return { followersCount: 0, followingCount: 0, error: error.message };
  }
};