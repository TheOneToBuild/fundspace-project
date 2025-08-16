// src/utils/realtimeManager.js - Enhanced with your channel system (Clean Version)
import { channelManager } from './channelManager.js';
import { getChannelFilterForPosts, getUserChannelAccess, getChannelInfo } from './channelUtils.js';

class RealtimeManager {
  constructor() {
    this.activeSubscriptions = new Map();
    this.cleanupTimeouts = new Map();
    this.debugMode = false; // Set to true if you want to see logs
  }

  // Create subscription with your channel system integration
  createSubscription(channelName, supabase, userProfile, callbacks) {
    // Use your channel access logic
    const accessibleChannels = getUserChannelAccess(userProfile);
    const channelInfo = getChannelInfo(channelName, userProfile);
    
    if (!channelInfo) {
      if (this.debugMode) {
        console.warn(`Channel ${channelName} not found or not accessible`);
      }
      return null;
    }

    // Cancel any pending cleanup
    if (this.cleanupTimeouts.has(channelName)) {
      clearTimeout(this.cleanupTimeouts.get(channelName));
      this.cleanupTimeouts.delete(channelName);
    }

    // Return existing subscription if it exists
    if (this.activeSubscriptions.has(channelName)) {
      return this.activeSubscriptions.get(channelName);
    }

    // Create new subscription with proper cleanup
    const channel = supabase.channel(`realtime:${channelName}`);
    
    // Apply your channel-specific filters
    const filter = getChannelFilterForPosts(channelName);
    
    // Set up event listeners based on your channel system
    if (callbacks.onPostInsert) {
      channel.on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'posts',
        filter: filter ? `channel=eq.${filter.channel}` : `channel=eq.${channelName}`
      }, callbacks.onPostInsert);
    }

    if (callbacks.onPostUpdate) {
      channel.on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'posts',
        filter: filter ? `channel=eq.${filter.channel}` : `channel=eq.${channelName}`
      }, callbacks.onPostUpdate);
    }

    if (callbacks.onPostDelete) {
      channel.on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'posts',
        filter: filter ? `channel=eq.${filter.channel}` : `channel=eq.${channelName}`
      }, callbacks.onPostDelete);
    }

    if (callbacks.onLikeChange) {
      channel.on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'post_likes'
      }, callbacks.onLikeChange);
    }

    if (callbacks.onCommentChange) {
      channel.on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'post_comments'
      }, callbacks.onCommentChange);
    }

    // Subscribe with error handling
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        // Clean subscription - no console logs
        if (this.debugMode) {
          console.log(`✅ Subscribed to ${channelName}`);
        }
      } else if (status === 'CHANNEL_ERROR') {
        if (this.debugMode) {
          console.error(`❌ Channel error for ${channelName}`);
        }
        this.removeSubscription(channelName, supabase);
      }
    });

    this.activeSubscriptions.set(channelName, channel);
    return channel;
  }

  // Safe removal with delay to prevent rapid cleanup cycles
  removeSubscription(channelName, supabase) {
    const timeoutId = setTimeout(() => {
      const channel = this.activeSubscriptions.get(channelName);
      if (channel) {
        try {
          channel.unsubscribe();
          if (this.debugMode) {
            console.log(`🔄 Unsubscribed from ${channelName}`);
          }
        } catch (error) {
          if (this.debugMode) {
            console.warn(`⚠️ Error unsubscribing ${channelName}:`, error);
          }
        } finally {
          supabase.removeChannel(channel);
          this.activeSubscriptions.delete(channelName);
          this.cleanupTimeouts.delete(channelName);
          if (this.debugMode) {
            console.log(`🗑️ Removed channel ${channelName}`);
          }
        }
      }
    }, 1000); // 1 second delay

    this.cleanupTimeouts.set(channelName, timeoutId);
  }

  // Get active subscription count for debugging
  getActiveCount() {
    return this.activeSubscriptions.size;
  }

  // Enable/disable debug logs
  setDebugMode(enabled) {
    this.debugMode = enabled;
  }

  // Get list of active channels (for debugging)
  getActiveChannels() {
    return Array.from(this.activeSubscriptions.keys());
  }

  // Force cleanup all (for app unmount)
  cleanup(supabase) {
    this.cleanupTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    this.activeSubscriptions.forEach((channel, name) => {
      try {
        channel.unsubscribe();
      } catch (error) {
        if (this.debugMode) {
          console.warn(`Error cleaning up ${name}:`, error);
        }
      } finally {
        supabase.removeChannel(channel);
      }
    });
    this.activeSubscriptions.clear();
    this.cleanupTimeouts.clear();
    
    if (this.debugMode) {
      console.log('🧹 All realtime subscriptions cleaned up');
    }
  }
}

// Export singleton
export const realtimeManager = new RealtimeManager();