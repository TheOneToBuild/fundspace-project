// src/utils/globalDataManager.js - COMPLETE VERSION with all missing methods and notifications fix
import { supabase } from '../supabaseClient';

class GlobalDataManager {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.batchQueues = {
      postLikes: new Map(),
      profiles: new Map(),
      orgMemberships: new Map(),
      comments: new Map(),
      // NEW batch queues
      userConnections: new Map(),
      connectionStatuses: new Map(),
      followers: new Map(),
      following: new Map()
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
        .select('id, full_name, avatar_url, title, organization_name, organization_type, role, location') // ✅ Removed email
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

  // Batch organizations loading
  async getOrganizations(orgIds, orgType = null) {
    const uniqueIds = [...new Set(orgIds.filter(Boolean))];
    if (uniqueIds.length === 0) {
      // Handle case where no specific IDs provided - get recent organizations
      return this._fetchRecentOrganizations(orgType);
    }

    const cacheKey = this.getCacheKey('organizations-batch', { orgIds: uniqueIds.sort(), orgType });
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    const promise = this._fetchOrganizations(uniqueIds, orgType);
    this.pendingRequests.set(cacheKey, promise);

    try {
      const result = await promise;
      this.setCache(cacheKey, result);
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  async _fetchOrganizations(orgIds, orgType) {
    try {
      let query = supabase
        .from('organizations')
        .select('id, name, slug, type, image_url, banner_image_url, tagline, description, website_url, location')
        .in('id', orgIds);

      if (orgType) {
        query = query.eq('type', orgType);
      }

      const { data, error } = await query;
      if (error) throw error;

      const orgsMap = {};
      data?.forEach(org => {
        orgsMap[org.id] = org;
      });

      return orgsMap;
    } catch (error) {
      console.error('Error fetching batch organizations:', error);
      return {};
    }
  }

  async _fetchRecentOrganizations(orgType) {
    try {
      let query = supabase
        .from('organizations')
        .select('id, name, slug, type, image_url, banner_image_url, tagline, description, website_url, location')
        .order('id', { ascending: false })
        .limit(100);

      if (orgType) {
        query = query.eq('type', orgType);
      }

      const { data, error } = await query;
      if (error) throw error;

      const orgsMap = {};
      data?.forEach(org => {
        orgsMap[org.id] = org;
      });

      return orgsMap;
    } catch (error) {
      console.error('Error fetching recent organizations:', error);
      return {};
    }
  }

  // Batch grants loading
  async getGrants(grantIds) {
    const uniqueIds = [...new Set(grantIds.filter(Boolean))];
    if (uniqueIds.length === 0) {
      // Handle case where no specific IDs provided - get recent grants
      return this._fetchRecentGrants();
    }

    const cacheKey = this.getCacheKey('grants-batch', uniqueIds.sort());
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    const promise = this._fetchGrants(uniqueIds);
    this.pendingRequests.set(cacheKey, promise);

    try {
      const result = await promise;
      this.setCache(cacheKey, result);
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  async _fetchGrants(grantIds) {
    try {
      const { data, error } = await supabase
        .from('grants')
        .select('*')
        .in('id', grantIds)
        .order('id', { ascending: false });

      if (error) throw error;

      const grantsMap = {};
      data?.forEach(grant => {
        grantsMap[grant.id] = grant;
      });

      return grantsMap;
    } catch (error) {
      console.error('Error fetching batch grants:', error);
      return {};
    }
  }

  async _fetchRecentGrants() {
    try {
      const { data, error } = await supabase
        .from('grants')
        .select('*')
        .order('id', { ascending: false })
        .limit(100);

      if (error) throw error;

      const grantsMap = {};
      data?.forEach(grant => {
        grantsMap[grant.id] = grant;
      });

      return grantsMap;
    } catch (error) {
      console.error('Error fetching recent grants:', error);
      return {};
    }
  }

  // Batch saved grants loading
  async getSavedGrants(userIds) {
    const uniqueIds = [...new Set(userIds.filter(Boolean))];
    const cacheKey = this.getCacheKey('saved-grants-batch', uniqueIds.sort());
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    const promise = this._fetchSavedGrants(uniqueIds);
    this.pendingRequests.set(cacheKey, promise);

    try {
      const result = await promise;
      this.setCache(cacheKey, result);
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  async _fetchSavedGrants(userIds) {
    try {
      const { data, error } = await supabase
        .from('saved_grants')
        .select('id, user_id, grant_id, created_at')
        .in('user_id', userIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group saved grants by user_id
      const savedByUser = {};
      userIds.forEach(userId => {
        savedByUser[userId] = [];
      });

      data?.forEach(saved => {
        if (savedByUser[saved.user_id]) {
          savedByUser[saved.user_id].push(saved);
        }
      });

      return savedByUser;
    } catch (error) {
      console.error('Error fetching batch saved grants:', error);
      return {};
    }
  }

  // FIXED: Batch notifications loading - Use correct column name
  async getNotifications(userIds) {
    const uniqueIds = [...new Set(userIds.filter(Boolean))];
    const cacheKey = this.getCacheKey('notifications-batch', uniqueIds.sort());
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    const promise = this._fetchNotifications(uniqueIds);
    this.pendingRequests.set(cacheKey, promise);

    try {
      const result = await promise;
      this.setCache(cacheKey, result);
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  async _fetchNotifications(userIds) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, user_id, type, is_read, created_at') // ✅ Removed content - doesn't exist
        .in('user_id', userIds)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Group notifications by user_id
      const notificationsByUser = {};
      userIds.forEach(userId => {
        notificationsByUser[userId] = [];
      });

      data?.forEach(notification => {
        if (notificationsByUser[notification.user_id]) {
          notificationsByUser[notification.user_id].push(notification);
        }
      });

      return notificationsByUser;
    } catch (error) {
      console.error('Error fetching batch notifications:', error);
      return {};
    }
  }

  // Batch posts for organizations loading
  async getPostsForOrganizations(orgIds) {
    const uniqueIds = [...new Set(orgIds.filter(Boolean))];
    const cacheKey = this.getCacheKey('org-posts-batch', uniqueIds.sort());
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    const promise = this._fetchPostsForOrganizations(uniqueIds);
    this.pendingRequests.set(cacheKey, promise);

    try {
      const result = await promise;
      this.setCache(cacheKey, result);
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  async _fetchPostsForOrganizations(orgIds) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id, organization_id, profile_id, content, created_at, channel, likes_count, comments_count,
          profiles:profile_id(id, full_name, avatar_url, title, organization_name)
        `)
        .in('organization_id', orgIds)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Group posts by organization_id
      const postsByOrg = {};
      orgIds.forEach(orgId => {
        postsByOrg[orgId] = [];
      });

      data?.forEach(post => {
        if (postsByOrg[post.organization_id]) {
          postsByOrg[post.organization_id].push(post);
        }
      });

      return postsByOrg;
    } catch (error) {
      console.error('Error fetching batch organization posts:', error);
      return {};
    }
  }

  // Batch post likes for multiple posts
  async getPostLikesForPosts(postIds) {
    const uniqueIds = [...new Set(postIds.filter(Boolean))];
    // This just delegates to the existing getPostLikes method
    return this.getPostLikes(uniqueIds);
  }

  // Batch user connections loading
  async getUserConnections(userIds, status = null) {
    const uniqueIds = [...new Set(userIds)];
    const cacheKey = this.getCacheKey('user-connections-batch', { userIds: uniqueIds.sort(), status });
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    const promise = this._fetchUserConnections(uniqueIds, status);
    this.pendingRequests.set(cacheKey, promise);

    try {
      const result = await promise;
      this.setCache(cacheKey, result);
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  async _fetchUserConnections(userIds, status) {
    try {
      let query = supabase
        .from('user_connections')
        .select('id, requester_id, recipient_id, status, created_at, updated_at')
        .order('created_at', { ascending: false });

      // Build OR conditions for all users
      const orConditions = userIds.flatMap(userId => [
        `requester_id.eq.${userId}`,
        `recipient_id.eq.${userId}`
      ]).join(',');

      query = query.or(orConditions);

      if (status) {
        query = query.eq('status', status);
      }

      const { data: connectionsData, error } = await query;

      if (error) throw error;

      // Group connections by user
      const connectionsByUser = {};
      userIds.forEach(userId => {
        connectionsByUser[userId] = [];
      });

      connectionsData?.forEach(conn => {
        // Add to requester's connections
        if (connectionsByUser[conn.requester_id]) {
          connectionsByUser[conn.requester_id].push({
            ...conn,
            other_user_id: conn.recipient_id
          });
        }
        
        // Add to recipient's connections
        if (connectionsByUser[conn.recipient_id]) {
          connectionsByUser[conn.recipient_id].push({
            ...conn,
            other_user_id: conn.requester_id
          });
        }
      });

      return connectionsByUser;
    } catch (error) {
      console.error('Error fetching batch user connections:', error);
      return {};
    }
  }

  // Batch connection status checks (major performance improvement)
  async getBatchConnectionStatuses(currentUserId, targetUserIds) {
    const uniqueIds = [...new Set(targetUserIds)];
    const cacheKey = this.getCacheKey('connection-statuses-batch', { currentUserId, targetUserIds: uniqueIds.sort() });
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    const promise = this._fetchBatchConnectionStatuses(currentUserId, uniqueIds);
    this.pendingRequests.set(cacheKey, promise);

    try {
      const result = await promise;
      this.setCache(cacheKey, result);
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  async _fetchBatchConnectionStatuses(currentUserId, targetUserIds) {
    try {
      // Build OR conditions for all target users
      const orConditions = targetUserIds.flatMap(targetId => [
        `and(requester_id.eq.${currentUserId},recipient_id.eq.${targetId})`,
        `and(requester_id.eq.${targetId},recipient_id.eq.${currentUserId})`
      ]).join(',');

      const { data: connectionsData, error } = await supabase
        .from('user_connections')
        .select('requester_id, recipient_id, status')
        .or(orConditions);

      if (error) throw error;

      // Process results
      const statusMap = {};
      targetUserIds.forEach(targetId => {
        statusMap[targetId] = { status: 'none', isRequester: false };
      });

      connectionsData?.forEach(conn => {
        let targetId;
        let isRequester;
        
        if (conn.requester_id === currentUserId) {
          targetId = conn.recipient_id;
          isRequester = true;
        } else {
          targetId = conn.requester_id;
          isRequester = false;
        }
        
        if (statusMap[targetId]) {
          statusMap[targetId] = {
            status: conn.status,
            isRequester
          };
        }
      });

      return statusMap;
    } catch (error) {
      console.error('Error fetching batch connection statuses:', error);
      return {};
    }
  }

  // Single connection status (with batching)
  async getConnectionStatus(currentUserId, targetUserId) {
    return new Promise((resolve) => {
      const key = `${currentUserId}-${targetUserId}`;
      this.batchQueues.connectionStatuses.set(key, { resolve, currentUserId, targetUserId });

      if (this.batchTimeouts.connectionStatuses) {
        clearTimeout(this.batchTimeouts.connectionStatuses);
      }

      this.batchTimeouts.connectionStatuses = setTimeout(async () => {
        const requests = Array.from(this.batchQueues.connectionStatuses.values());
        this.batchQueues.connectionStatuses.clear();

        // Group requests by currentUserId for more efficient batching
        const requestsByUser = {};
        requests.forEach(req => {
          if (!requestsByUser[req.currentUserId]) {
            requestsByUser[req.currentUserId] = [];
          }
          requestsByUser[req.currentUserId].push(req);
        });

        // Process each user's requests
        for (const [currentUserId, userRequests] of Object.entries(requestsByUser)) {
          try {
            const targetUserIds = userRequests.map(req => req.targetUserId);
            const batchResult = await this.getBatchConnectionStatuses(currentUserId, targetUserIds);
            
            userRequests.forEach(req => {
              const status = batchResult[req.targetUserId] || { status: 'none', isRequester: false };
              req.resolve(status);
            });
          } catch (error) {
            console.error('Batch connection status error:', error);
            userRequests.forEach(req => req.resolve({ status: 'none', isRequester: false }));
          }
        }
      }, this.BATCH_DELAY);
    });
  }

  // Batch followers loading
  async getFollowers(userIds) {
    const uniqueIds = [...new Set(userIds)];
    const cacheKey = this.getCacheKey('followers-batch', uniqueIds.sort());
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    const promise = this._fetchFollowers(uniqueIds);
    this.pendingRequests.set(cacheKey, promise);

    try {
      const result = await promise;
      this.setCache(cacheKey, result);
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  async _fetchFollowers(userIds) {
    try {
      const { data: followersData, error } = await supabase
        .from('followers')
        .select(`
          id, follower_id, following_id, created_at,
          follower:follower_id(id, full_name, avatar_url, title, organization_name)
        `)
        .in('following_id', userIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group followers by following_id
      const followersByUser = {};
      userIds.forEach(userId => {
        followersByUser[userId] = [];
      });

      followersData?.forEach(follow => {
        if (followersByUser[follow.following_id]) {
          followersByUser[follow.following_id].push(follow);
        }
      });

      return followersByUser;
    } catch (error) {
      console.error('Error fetching batch followers:', error);
      return {};
    }
  }

  // Batch following loading
  async getFollowing(userIds) {
    const uniqueIds = [...new Set(userIds)];
    const cacheKey = this.getCacheKey('following-batch', uniqueIds.sort());
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    const promise = this._fetchFollowing(uniqueIds);
    this.pendingRequests.set(cacheKey, promise);

    try {
      const result = await promise;
      this.setCache(cacheKey, result);
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  async _fetchFollowing(userIds) {
    try {
      const { data: followingData, error } = await supabase
        .from('followers')
        .select(`
          id, follower_id, following_id, created_at,
          following:following_id(id, full_name, avatar_url, title, organization_name)
        `)
        .in('follower_id', userIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group following by follower_id
      const followingByUser = {};
      userIds.forEach(userId => {
        followingByUser[userId] = [];
      });

      followingData?.forEach(follow => {
        if (followingByUser[follow.follower_id]) {
          followingByUser[follow.follower_id].push(follow);
        }
      });

      return followingByUser;
    } catch (error) {
      console.error('Error fetching batch following:', error);
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
      // Direct queries approach - no RPC needed
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

  // Single post comments (with batching)
  async getCommentsForPost(postId) {
    return new Promise((resolve) => {
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