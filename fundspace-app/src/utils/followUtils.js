// utils/followUtils.js - Enhanced Follow Functionality with Notifications
import { supabase } from '../supabaseClient';

/**
 * Creates a follower notification when someone follows a user
 * @param {string} followerId - The ID of the user who is following
 * @param {string} followingId - The ID of the user being followed
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const createFollowerNotification = async (followerId, followingId) => {
  try {
    // Don't create notification if user is following themselves
    if (followerId === followingId) {
      return { success: true };
    }

    // Create the follower notification with minimal required fields only
    const notificationData = {
      user_id: followingId,  // The person being followed receives the notification
      actor_id: followerId,  // The person doing the following is the actor
      type: 'new_follower',
      is_read: false,
    };

    // Do NOT include post_id or organization_post_id at all to avoid constraint issues
    const { error } = await supabase
      .from('notifications')
      .insert(notificationData);

    if (error) {
      console.error('Error creating follower notification:', error);
      // If we still get a constraint error, provide helpful debug info
      if (error.message.includes('constraint') || error.message.includes('check')) {
        console.error('🔍 Constraint error detected. You may need to run the database fix script.');
        console.error('💡 Check the Supabase SQL editor and run the constraint removal script.');
      }
      return { success: false, error: error.message };
    }

    console.log('✅ Follower notification created successfully');
    return { success: true };
  } catch (error) {
    console.error('Error in createFollowerNotification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Enhanced follow function that creates a follower relationship and notification
 * @param {string} followerId - The ID of the user who is following
 * @param {string} followingId - The ID of the user being followed
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const followUser = async (followerId, followingId) => {
  try {
    if (!followerId || !followingId) {
      return { success: false, error: 'Both follower and following IDs are required' };
    }

    // Don't allow following yourself
    if (followerId === followingId) {
      return { success: false, error: 'Cannot follow yourself' };
    }

    // Check if already following
    const { data: existingFollow, error: checkError } = await supabase
      .from('followers')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      return { success: false, error: checkError.message };
    }

    if (existingFollow) {
      return { success: false, error: 'Already following this user' };
    }

    // Create the follow relationship
    const { error: followError } = await supabase
      .from('followers')
      .insert({
        follower_id: followerId,
        following_id: followingId
      });

    if (followError) {
      return { success: false, error: followError.message };
    }

    // Create the notification
    const notificationResult = await createFollowerNotification(followerId, followingId);
    
    // Even if notification fails, the follow was successful
    if (!notificationResult.success) {
      console.warn('Follow successful but notification failed:', notificationResult.error);
    }

    // Broadcast follow event for real-time updates
    broadcastFollowEvent('follow', followerId, followingId);

    return { success: true };
  } catch (error) {
    console.error('Error in followUser:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Enhanced unfollow function
 * @param {string} followerId - The ID of the user who is unfollowing
 * @param {string} followingId - The ID of the user being unfollowed
 * @returns {Promise<{success: boolean, error?: string}>}
 */
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

    // Broadcast unfollow event for real-time updates
    broadcastFollowEvent('unfollow', followerId, followingId);

    // Note: We don't delete the notification when unfollowing
    // This preserves the notification history for the user
    
    return { success: true };
  } catch (error) {
    console.error('Error in unfollowUser:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Broadcast follow/unfollow events for real-time UI updates
 * @param {string} action - 'follow' or 'unfollow'
 * @param {string} followerId - The ID of the user doing the action
 * @param {string} followingId - The ID of the user being followed/unfollowed
 */
const broadcastFollowEvent = (action, followerId, followingId) => {
  try {
    // Create a custom event that components can listen to
    const event = new CustomEvent('followUpdate', {
      detail: {
        action,
        followerId,
        followingId,
        timestamp: Date.now()
      }
    });
    
    // Dispatch the event on the window object so any component can listen
    window.dispatchEvent(event);
    
    console.log(`✅ Broadcasted ${action} event:`, { followerId, followingId });
  } catch (error) {
    console.error('Error broadcasting follow event:', error);
  }
};

/**
 * Check if one user is following another
 * @param {string} followerId - The ID of the potential follower
 * @param {string} followingId - The ID of the potential following
 * @returns {Promise<{isFollowing: boolean, error?: string}>}
 */
export const checkFollowStatus = async (followerId, followingId) => {
  try {
    if (!followerId || !followingId) {
      return { isFollowing: false };
    }

    const { data, error } = await supabase
      .from('followers')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return { isFollowing: false, error: error.message };
    }

    return { isFollowing: !!data };
  } catch (error) {
    console.error('Error checking follow status:', error);
    return { isFollowing: false, error: error.message };
  }
};

/**
 * Get follow statistics for a user
 * @param {string} userId - The user's ID
 * @returns {Promise<{followersCount: number, followingCount: number, error?: string}>}
 */
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