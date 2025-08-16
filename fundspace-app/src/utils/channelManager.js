// src/utils/channelManager.js - Global channel manager to prevent multiple subscriptions

class ChannelManager {
  constructor() {
    this.channels = new Map();
    this.cleanupTimeouts = new Map();
  }

  getOrCreateChannel(channelName, supabase, setupCallback) {
    // Cancel any pending cleanup for this channel
    if (this.cleanupTimeouts.has(channelName)) {
      clearTimeout(this.cleanupTimeouts.get(channelName));
      this.cleanupTimeouts.delete(channelName);
    }

    // Return existing channel if it exists
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName);
    }

    // Create new channel
    const channel = supabase.channel(channelName);
    setupCallback(channel);
    
    channel.subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        console.error(`Channel error for ${channelName}`);
        this.removeChannel(channelName, supabase);
      }
    });

    this.channels.set(channelName, channel);
    return channel;
  }

  removeChannel(channelName, supabase) {
    // Delay cleanup to prevent rapid subscribe/unsubscribe cycles
    const timeoutId = setTimeout(() => {
      const channel = this.channels.get(channelName);
      if (channel) {
        try {
          channel.unsubscribe();
        } catch (error) {
          console.warn(`Error unsubscribing ${channelName}:`, error);
        } finally {
          supabase.removeChannel(channel);
          this.channels.delete(channelName);
          this.cleanupTimeouts.delete(channelName);
        }
      }
    }, 1000); // 1 second delay

    this.cleanupTimeouts.set(channelName, timeoutId);
  }

  cleanup() {
    // Clean up all channels and timeouts
    this.cleanupTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    this.channels.clear();
    this.cleanupTimeouts.clear();
  }
}

// Export singleton instance
export const channelManager = new ChannelManager();