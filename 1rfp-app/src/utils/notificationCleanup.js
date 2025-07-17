// src/utils/notificationCleanup.js
import { supabase } from '../supabaseClient';

/**
 * Clear all notifications for the current user
 */
export const clearAllNotifications = async (userId) => {
  try {
    console.log('🗑️ Clearing all notifications for user:', userId);
    
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);
    
    if (error) {
      console.error('❌ Error clearing notifications:', error);
      throw error;
    }
    
    console.log('✅ Successfully cleared all notifications');
    return { success: true };
  } catch (error) {
    console.error('💥 Error in clearAllNotifications:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Clear only read notifications for the current user
 */
export const clearReadNotifications = async (userId) => {
  try {
    console.log('🗑️ Clearing read notifications for user:', userId);
    
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .eq('is_read', true);
    
    if (error) {
      console.error('❌ Error clearing read notifications:', error);
      throw error;
    }
    
    console.log('✅ Successfully cleared read notifications');
    return { success: true };
  } catch (error) {
    console.error('💥 Error in clearReadNotifications:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Mark all notifications as read for the current user
 */
export const markAllAsRead = async (userId) => {
  try {
    console.log('📖 Marking all notifications as read for user:', userId);
    
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    
    if (error) {
      console.error('❌ Error marking notifications as read:', error);
      throw error;
    }
    
    console.log('✅ Successfully marked all notifications as read');
    return { success: true };
  } catch (error) {
    console.error('💥 Error in markAllAsRead:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Auto-cleanup old notifications (run periodically)
 * Deletes notifications older than specified days
 */
export const autoCleanupOldNotifications = async (daysOld = 30) => {
  try {
    console.log(`🧹 Auto-cleaning notifications older than ${daysOld} days`);
    
    const { error } = await supabase
      .from('notifications')
      .delete()
      .lt('created_at', new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString());
    
    if (error) {
      console.error('❌ Error in auto-cleanup:', error);
      throw error;
    }
    
    console.log('✅ Successfully completed auto-cleanup');
    return { success: true };
  } catch (error) {
    console.error('💥 Error in autoCleanupOldNotifications:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get notification statistics for a user
 */
export const getNotificationStats = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('id, is_read, created_at')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    const total = data.length;
    const unread = data.filter(n => !n.is_read).length;
    const read = total - unread;
    
    // Group by last 7 days
    const recent = data.filter(n => 
      new Date(n.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;
    
    return {
      success: true,
      stats: { total, unread, read, recent }
    };
  } catch (error) {
    console.error('💥 Error getting notification stats:', error);
    return { success: false, error: error.message };
  }
};