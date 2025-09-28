import { getChannelFilterForPosts, getUserChannelAccess, getChannelInfo } from './channelUtils.js';

class RealtimeManager {
  constructor() {
    this.activeSubscriptions = new Map();
    this.cleanupTimeouts = new Map();
    this.debugMode = false;
  }

  createSubscription(channelName, supabase, userProfile, callbacks) {
    const accessibleChannels = getUserChannelAccess(userProfile);
    const channelInfo = getChannelInfo(channelName, userProfile);
    
    if (!channelInfo) {
      if (this.debugMode) {
        console.warn(`Channel ${channelName} not found or not accessible`);
      }
      return null;
    }

    if (this.cleanupTimeouts.has(channelName)) {
      clearTimeout(this.cleanupTimeouts.get(channelName));
      this.cleanupTimeouts.delete(channelName);
    }

    if (this.activeSubscriptions.has(channelName)) {
      return this.activeSubscriptions.get(channelName);
    }

    const channel = supabase.channel(`realtime:${channelName}`);
    const filter = getChannelFilterForPosts(channelName);
    
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

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
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

  subscribeToPosts(channelName, supabase, filter = null, callbacks = {}) {
    if (this.cleanupTimeouts.has(channelName)) {
      clearTimeout(this.cleanupTimeouts.get(channelName));
      this.cleanupTimeouts.delete(channelName);
    }

    if (this.activeSubscriptions.has(channelName)) {
      return this.activeSubscriptions.get(channelName);
    }

    const channel = supabase.channel(channelName);

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

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
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

  subscribeToOrganizationPosts(channelName, supabase, organizationId, callbacks = {}) {
    if (this.cleanupTimeouts.has(channelName)) {
      clearTimeout(this.cleanupTimeouts.get(channelName));
      this.cleanupTimeouts.delete(channelName);
    }

    if (this.activeSubscriptions.has(channelName)) {
      return this.activeSubscriptions.get(channelName);
    }

    const channel = supabase.channel(channelName);

    if (callbacks.onPostInsert) {
      channel.on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'organization_posts',
        filter: `organization_id=eq.${organizationId}`
      }, callbacks.onPostInsert);
    }

    if (callbacks.onPostUpdate) {
      channel.on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'organization_posts',
        filter: `organization_id=eq.${organizationId}`
      }, callbacks.onPostUpdate);
    }

    if (callbacks.onPostDelete) {
      channel.on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'organization_posts',
        filter: `organization_id=eq.${organizationId}`
      }, callbacks.onPostDelete);
    }

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        if (this.debugMode) {
          console.log(`✅ Subscribed to organization posts ${channelName}`);
        }
      } else if (status === 'CHANNEL_ERROR') {
        if (this.debugMode) {
          console.error(`❌ Channel error for organization posts ${channelName}`);
        }
        this.removeSubscription(channelName, supabase);
      }
    });

    this.activeSubscriptions.set(channelName, channel);
    return channel;
  }

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
          try {
            supabase.removeChannel(channel);
          } catch (error) {
            if (this.debugMode && !error.message?.includes('WebSocket')) {
              console.warn(`⚠️ Error removing channel ${channelName}:`, error);
            }
          }
          this.activeSubscriptions.delete(channelName);
          this.cleanupTimeouts.delete(channelName);
          if (this.debugMode) {
            console.log(`🗑️ Removed channel ${channelName}`);
          }
        }
      }
    }, 1000);

    this.cleanupTimeouts.set(channelName, timeoutId);
  }

  getActiveCount() {
    return this.activeSubscriptions.size;
  }

  setDebugMode(enabled) {
    this.debugMode = enabled;
  }

  getActiveChannels() {
    return Array.from(this.activeSubscriptions.keys());
  }

  cleanup(supabase) {
    this.cleanupTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    this.activeSubscriptions.forEach((channel, name) => {
      try {
        channel.unsubscribe();
      } catch (error) {
        if (this.debugMode && !error.message?.includes('WebSocket')) {
          console.warn(`Error cleaning up ${name}:`, error);
        }
      } finally {
        try {
          supabase.removeChannel(channel);
        } catch (error) {
        }
      }
    });
    this.activeSubscriptions.clear();
    this.cleanupTimeouts.clear();
    
    if (this.debugMode) {
      console.log('🧹 All realtime subscriptions cleaned up');
    }
  }
}

export const realtimeManager = new RealtimeManager();