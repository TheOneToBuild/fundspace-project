// src/utils/apiRequestOptimizer.js - Enhanced with user connections and followers optimization
import globalDataManager from './globalDataManager';

class ApiRequestOptimizer {
  constructor() {
    this.interceptedCalls = new Set();
    this.debug = false; // Set to true for debugging
  }

  // Intercept Supabase queries and redirect to batched versions
  optimizeSupabaseQuery(originalQuery, queryType, params) {
    const queryKey = `${queryType}-${JSON.stringify(params)}`;
    
    if (this.debug) {
      console.log(`[API Optimizer] Intercepting ${queryType}:`, params);
    }

    // Prevent duplicate optimization
    if (this.interceptedCalls.has(queryKey)) {
      return originalQuery; // Let it proceed normally
    }

    this.interceptedCalls.add(queryKey);

    // Clean up after 1 second
    setTimeout(() => {
      this.interceptedCalls.delete(queryKey);
    }, 1000);

    switch (queryType) {
      case 'post_likes_single':
        return this.optimizePostLikes(params);
      
      case 'profiles_single':
        return this.optimizeProfiles(params);
      
      case 'org_membership_single':
        return this.optimizeOrgMembership(params);
      
      case 'post_comments_single':
        return this.optimizePostComments(params);
      
      // NEW: User connections optimization
      case 'user_connections_single':
        return this.optimizeUserConnections(params);
      
      case 'user_connections_status':
        return this.optimizeConnectionStatus(params);
      
      // NEW: Followers/Following optimization
      case 'followers_single':
        return this.optimizeFollowers(params);
      
      case 'following_single':
        return this.optimizeFollowing(params);
      
      // NEW: Batch connection statuses
      case 'connection_statuses_batch':
        return this.optimizeConnectionStatusesBatch(params);
      
      // NEW: User post reaction status
      case 'user_post_reaction_status':
        return this.optimizeUserPostReactionStatus(params);
      
      default:
        return originalQuery; // Let unoptimized calls proceed
    }
  }

  // Optimize individual post likes calls
  async optimizePostLikes(params) {
    const { postId } = params;
    
    if (this.debug) {
      console.log(`[API Optimizer] Redirecting post_likes to batch for post ${postId}`);
    }
    
    try {
      const likesData = await globalDataManager.getPostLikesForPost(postId);
      
      // Return in the format the original query expected
      return {
        data: likesData.reactors || [],
        error: null,
        count: likesData.likes_count || 0
      };
    } catch (error) {
      console.error('API Optimizer: Post likes optimization failed:', error);
      throw error;
    }
  }

  // Optimize individual profiles calls
  async optimizeProfiles(params) {
    const { userIds } = params;
    
    if (this.debug) {
      console.log(`[API Optimizer] Redirecting profiles to batch for users:`, userIds);
    }
    
    try {
      const profilesData = await globalDataManager.getProfiles(userIds);
      
      // Return in the format the original query expected
      return {
        data: Object.values(profilesData),
        error: null
      };
    } catch (error) {
      console.error('API Optimizer: Profiles optimization failed:', error);
      throw error;
    }
  }

  // Optimize individual organization membership calls
  async optimizeOrgMembership(params) {
    const { userId } = params;
    
    if (this.debug) {
      console.log(`[API Optimizer] Redirecting org membership to batch for user ${userId}`);
    }
    
    try {
      const membershipData = await globalDataManager.getOrganizationMembership(userId);
      
      // Return in the format the original query expected
      return {
        data: membershipData ? [membershipData] : [],
        error: null
      };
    } catch (error) {
      console.error('API Optimizer: Org membership optimization failed:', error);
      throw error;
    }
  }

  // Optimize individual post comments calls
  async optimizePostComments(params) {
    const { postId } = params;
    
    if (this.debug) {
      console.log(`[API Optimizer] Redirecting post_comments to batch for post ${postId}`);
    }
    
    try {
      const commentsData = await globalDataManager.getCommentsForPost(postId);
      
      // Return in the format the original query expected
      return {
        data: commentsData,
        error: null
      };
    } catch (error) {
      console.error('API Optimizer: Comments optimization failed:', error);
      throw error;
    }
  }

  // NEW: Optimize individual user connections calls
  async optimizeUserConnections(params) {
    const { userId, status } = params;
    
    if (this.debug) {
      console.log(`[API Optimizer] Redirecting user_connections to batch for user ${userId}`);
    }
    
    try {
      const connectionsData = await globalDataManager.getUserConnections([userId], status);
      
      // Return in the format the original query expected
      return {
        data: connectionsData[userId] || [],
        error: null
      };
    } catch (error) {
      console.error('API Optimizer: User connections optimization failed:', error);
      throw error;
    }
  }

  // NEW: Optimize connection status checks (biggest performance issue)
  async optimizeConnectionStatus(params) {
    const { currentUserId, targetUserId } = params;
    
    if (this.debug) {
      console.log(`[API Optimizer] Redirecting connection status check to batch for ${currentUserId} -> ${targetUserId}`);
    }
    
    try {
      const statusData = await globalDataManager.getConnectionStatus(currentUserId, targetUserId);
      
      // Return in the format getConnectionStatus() expects
      return {
        status: statusData.status || 'none',
        isRequester: statusData.isRequester || false,
        error: null
      };
    } catch (error) {
      console.error('API Optimizer: Connection status optimization failed:', error);
      throw error;
    }
  }

  // NEW: Optimize followers queries
  async optimizeFollowers(params) {
    const { userId } = params;
    
    if (this.debug) {
      console.log(`[API Optimizer] Redirecting followers to batch for user ${userId}`);
    }
    
    try {
      const followersData = await globalDataManager.getFollowers([userId]);
      
      // Return in the format the original query expected
      return {
        data: followersData[userId] || [],
        error: null
      };
    } catch (error) {
      console.error('API Optimizer: Followers optimization failed:', error);
      throw error;
    }
  }

  // NEW: Optimize following queries
  async optimizeFollowing(params) {
    const { userId } = params;
    
    if (this.debug) {
      console.log(`[API Optimizer] Redirecting following to batch for user ${userId}`);
    }
    
    try {
      const followingData = await globalDataManager.getFollowing([userId]);
      
      // Return in the format the original query expected
      return {
        data: followingData[userId] || [],
        error: null
      };
    } catch (error) {
      console.error('API Optimizer: Following optimization failed:', error);
      throw error;
    }
  }

  // NEW: Optimize user post reaction status check
  async optimizeUserPostReactionStatus(params) {
    const { postId, userId } = params;
    
    if (this.debug) {
      console.log(`[API Optimizer] Redirecting user post reaction status to batch for post ${postId}`);
    }
    
    try {
      // Use the existing post likes batch system
      const likesData = await globalDataManager.getPostLikesForPost(postId);
      
      // Find user's reaction in the reactors
      const userReactor = likesData.reactors?.find(reactor => reactor.user_id === userId);
      
      return {
        userReaction: userReactor?.reaction_type || null,
        error: null
      };
    } catch (error) {
      console.error('API Optimizer: User post reaction status optimization failed:', error);
      throw error;
    }
  }

  // NEW: Batch connection statuses (for connection lists)
  async optimizeConnectionStatusesBatch(params) {
    const { currentUserId, targetUserIds } = params;
    
    if (this.debug) {
      console.log(`[API Optimizer] Batch connection status check for ${targetUserIds.length} users`);
    }
    
    try {
      const statusesData = await globalDataManager.getBatchConnectionStatuses(currentUserId, targetUserIds);
      
      // Return in the format expected by components
      return {
        data: statusesData,
        error: null
      };
    } catch (error) {
      console.error('API Optimizer: Batch connection statuses optimization failed:', error);
      throw error;
    }
  }

  // Enable debug mode
  enableDebug() {
    this.debug = true;
    console.log('[API Optimizer] Debug mode enabled');
  }

  // Disable debug mode
  disableDebug() {
    this.debug = false;
  }

  // Get optimization statistics
  getStats() {
    return {
      interceptedCalls: this.interceptedCalls.size,
      debugMode: this.debug
    };
  }
}

// Create singleton instance
const apiRequestOptimizer = new ApiRequestOptimizer();

// Enhanced helper function with new optimization types
export function optimizedSupabaseQuery(queryBuilder, queryType, params = {}) {
  // Check if this query should be optimized
  const shouldOptimize = [
    'post_likes_single',
    'profiles_single', 
    'org_membership_single',
    'post_comments_single',
    // NEW optimization types
    'user_connections_single',
    'user_connections_status', 
    'followers_single',
    'following_single',
    'connection_statuses_batch',
    'user_post_reaction_status'
  ].includes(queryType);

  if (shouldOptimize) {
    return apiRequestOptimizer.optimizeSupabaseQuery(queryBuilder, queryType, params);
  }
  
  // Let unoptimized queries proceed normally
  return queryBuilder;
}

export default apiRequestOptimizer;