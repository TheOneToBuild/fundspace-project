// src/utils/globalDataManager.js - Centralized request batching and caching
import { supabase } from '../supabaseClient';

class GlobalDataManager {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.batchQueues = {
      postLikes: new Map(),
      profiles: new Map(),
      orgMemberships: new Map()
    };
    this.batchTimeouts = {};
    
    // Cache TTL (30 seconds)
    this.CACHE_TTL = 30000;
    
    // Batch delay (100ms to collect multiple requests)
    this.BATCH_DELAY = 100;
  }

  // Generic cache management
  getCacheKey(type, params) {
    return `${type}-${JSON.stringify(params)}`;
  }

  isCacheValid(cacheItem) {
    return cacheItem && (Date.now() - cacheItem.timestamp) < this.CACHE_TTL;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  getCache(key) {
    const cacheItem = this.cache.get(key);
    return this.isCacheValid(cacheItem) ? cacheItem.data : null;
  }

  // Batch post likes loading
  async getPostLikes(postIds) {
    const cacheKey = this.getCacheKey('post-likes-batch', postIds.sort());
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    // Deduplicate request
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    const promise = this._fetchPostLikes(postIds);
    this.pendingRequests.set(cacheKey, promise);

    try {
      const result = await promise;
      this.setCache(cacheKey, result);
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  async _fetchPostLikes(postIds) {
    try {
      const { data: likesData, error } = await supabase
        .from('post_likes')
        .select('post_id, user_id, reaction_type, created_at')
        .in('post_id', postIds);

      if (error) throw error;

      // Group likes by post_id
      const likesByPost = {};
      const userIds = new Set();

      likesData?.forEach(like => {
        if (!likesByPost[like.post_id]) {
          likesByPost[like.post_id] = [];
        }
        likesByPost[like.post_id].push(like);
        userIds.add(like.user_id);
      });

      // Fetch user profiles for all reactors
      let profilesData = [];
      if (userIds.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, title, organization_name')
          .in('id', Array.from(userIds));
        profilesData = profiles || [];
      }

      // Create profiles map
      const profilesMap = {};
      profilesData.forEach(profile => {
        profilesMap[profile.id] = profile;
      });

      // Process likes with profile data
      const result = {};
      postIds.forEach(postId => {
        const postLikes = likesByPost[postId] || [];
        
        // Calculate reaction summary
        const reactionCounts = {};
        postLikes.forEach(like => {
          const type = like.reaction_type || 'like';
          reactionCounts[type] = (reactionCounts[type] || 0) + 1;
        });

        // Create reactors with profile info
        const reactors = postLikes.map(like => ({
          user_id: like.user_id,
          reaction_type: like.reaction_type,
          created_at: like.created_at,
          profile: profilesMap[like.user_id] || {
            id: like.user_id,
            full_name: 'Unknown User'
          }
        }));

        result[postId] = {
          likes_count: postLikes.length,
          reaction_summary: Object.entries(reactionCounts).map(([type, count]) => ({ type, count })),
          reactors: reactors.slice(0, 20) // Limit reactors shown
        };
      });

      return result;
    } catch (error) {
      console.error('Error fetching batch post likes:', error);
      return {};
    }
  }

  // Batch profile loading
  async getProfiles(userIds) {
    const uniqueIds = [...new Set(userIds)];
    const cacheKey = this.getCacheKey('profiles-batch', uniqueIds.sort());
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    const promise = this._fetchProfiles(uniqueIds);
    this.pendingRequests.set(cacheKey, promise);

    try {
      const result = await promise;
      this.setCache(cacheKey, result);
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  async _fetchProfiles(userIds) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, title, organization_name, organization_type, role')
        .in('id', userIds);

      if (error) throw error;

      const profilesMap = {};
      data?.forEach(profile => {
        profilesMap[profile.id] = profile;
      });

      return profilesMap;
    } catch (error) {
      console.error('Error fetching batch profiles:', error);
      return {};
    }
  }

  // Batch organization membership loading
  async getOrganizationMemberships(userIds) {
    const uniqueIds = [...new Set(userIds)];
    const cacheKey = this.getCacheKey('org-memberships-batch', uniqueIds.sort());
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    const promise = this._fetchOrgMemberships(uniqueIds);
    this.pendingRequests.set(cacheKey, promise);

    try {
      const result = await promise;
      this.setCache(cacheKey, result);
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  async _fetchOrgMemberships(userIds) {
    try {
      // Try batch RPC call first
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_batch_user_organization_memberships', { user_ids: userIds });

      if (!rpcError && rpcData) {
        const membershipsMap = {};
        rpcData.forEach(membership => {
          membershipsMap[membership.profile_id] = {
            organization: {
              id: membership.organization_id,
              name: membership.organization_name,
              type: membership.organization_type,
              image_url: membership.organization_image_url
            },
            role: membership.role,
            membership_type: membership.membership_type
          };
        });
        return membershipsMap;
      }

      // Fallback to individual queries
      const { data: memberships, error } = await supabase
        .from('organization_memberships')
        .select('profile_id, organization_id, role, organization_type')
        .in('profile_id', userIds)
        .eq('is_public', true);

      if (error) throw error;

      const orgIds = [...new Set(memberships?.map(m => m.organization_id) || [])];
      let orgsData = [];
      
      if (orgIds.length > 0) {
        const { data: orgs } = await supabase
          .from('organizations')
          .select('id, name, type, image_url')
          .in('id', orgIds);
        orgsData = orgs || [];
      }

      const orgsMap = {};
      orgsData.forEach(org => {
        orgsMap[org.id] = org;
      });

      const membershipsMap = {};
      memberships?.forEach(membership => {
        const org = orgsMap[membership.organization_id];
        if (org) {
          membershipsMap[membership.profile_id] = {
            organization: org,
            role: membership.role,
            organization_type: membership.organization_type
          };
        }
      });

      return membershipsMap;
    } catch (error) {
      console.error('Error fetching batch org memberships:', error);
      return {};
    }
  }

  // Single post likes (with batching)
  async getPostLikesForPost(postId) {
    return new Promise((resolve) => {
      // Add to batch queue
      this.batchQueues.postLikes.set(postId, resolve);

      // Clear existing timeout
      if (this.batchTimeouts.postLikes) {
        clearTimeout(this.batchTimeouts.postLikes);
      }

      // Set new timeout to process batch
      this.batchTimeouts.postLikes = setTimeout(async () => {
        const postIds = Array.from(this.batchQueues.postLikes.keys());
        const resolvers = Array.from(this.batchQueues.postLikes.values());
        this.batchQueues.postLikes.clear();

        try {
          const batchResult = await this.getPostLikes(postIds);
          
          resolvers.forEach((resolver, index) => {
            const postId = postIds[index];
            resolver(batchResult[postId] || {
              likes_count: 0,
              reaction_summary: [],
              reactors: []
            });
          });
        } catch (error) {
          console.error('Batch post likes error:', error);
          resolvers.forEach(resolver => resolver({
            likes_count: 0,
            reaction_summary: [],
            reactors: []
          }));
        }
      }, this.BATCH_DELAY);
    });
  }

  // Single organization membership (with batching)
  async getOrganizationMembership(userId) {
    return new Promise((resolve) => {
      this.batchQueues.orgMemberships.set(userId, resolve);

      if (this.batchTimeouts.orgMemberships) {
        clearTimeout(this.batchTimeouts.orgMemberships);
      }

      this.batchTimeouts.orgMemberships = setTimeout(async () => {
        const userIds = Array.from(this.batchQueues.orgMemberships.keys());
        const resolvers = Array.from(this.batchQueues.orgMemberships.values());
        this.batchQueues.orgMemberships.clear();

        try {
          const batchResult = await this.getOrganizationMemberships(userIds);
          
          resolvers.forEach((resolver, index) => {
            const userId = userIds[index];
            resolver(batchResult[userId] || null);
          });
        } catch (error) {
          console.error('Batch org membership error:', error);
          resolvers.forEach(resolver => resolver(null));
        }
      }, this.BATCH_DELAY);
    });
  }

  // Batch comment loading
  async getPostComments(postIds) {
    const cacheKey = this.getCacheKey('post-comments-batch', postIds.sort());
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    const promise = this._fetchPostComments(postIds);
    this.pendingRequests.set(cacheKey, promise);

    try {
      const result = await promise;
      this.setCache(cacheKey, result);
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  async _fetchPostComments(postIds) {
    try {
      const { data: commentsData, error } = await supabase
        .from('post_comments')
        .select(`
          id, post_id, content, created_at, likes_count, image_urls,
          profiles:profile_id(id, full_name, avatar_url)
        `)
        .in('post_id', postIds)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group comments by post_id
      const commentsByPost = {};
      postIds.forEach(postId => {
        commentsByPost[postId] = [];
      });

      commentsData?.forEach(comment => {
        if (commentsByPost[comment.post_id]) {
          commentsByPost[comment.post_id].push(comment);
        }
      });

      return commentsByPost;
    } catch (error) {
      console.error('Error fetching batch comments:', error);
      return {};
    }
  }

  // Single post comments (with batching)
  async getCommentsForPost(postId) {
    return new Promise((resolve) => {
      if (!this.batchQueues.comments) {
        this.batchQueues.comments = new Map();
      }
      
      this.batchQueues.comments.set(postId, resolve);

      if (this.batchTimeouts.comments) {
        clearTimeout(this.batchTimeouts.comments);
      }

      this.batchTimeouts.comments = setTimeout(async () => {
        const postIds = Array.from(this.batchQueues.comments.keys());
        const resolvers = Array.from(this.batchQueues.comments.values());
        this.batchQueues.comments.clear();

        try {
          const batchResult = await this.getPostComments(postIds);
          
          resolvers.forEach((resolver, index) => {
            const postId = postIds[index];
            resolver(batchResult[postId] || []);
          });
        } catch (error) {
          console.error('Batch comments error:', error);
          resolvers.forEach(resolver => resolver([]));
        }
      }, this.BATCH_DELAY);
    });
  }

  // Clear cache
  clearCache(prefix) {
    if (prefix) {
      for (const [key] of this.cache) {
        if (key.startsWith(prefix)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  // Periodic cache cleanup
  startCacheCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.cache) {
        if ((now - value.timestamp) > this.CACHE_TTL) {
          this.cache.delete(key);
        }
      }
    }, this.CACHE_TTL);
  }
}

// Create singleton instance
const globalDataManager = new GlobalDataManager();

// Start cleanup
globalDataManager.startCacheCleanup();

export default globalDataManager;