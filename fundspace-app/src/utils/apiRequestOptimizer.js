// src/utils/apiRequestOptimizer.js - COMPLETE VERSION with Organization Support
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
      
      // User connections optimization
      case 'user_connections_single':
        return this.optimizeUserConnections(params);
      
      case 'user_connections_status':
        return this.optimizeConnectionStatus(params);
      
      // Followers/Following optimization
      case 'followers_single':
        return this.optimizeFollowers(params);
      
      case 'following_single':
        return this.optimizeFollowing(params);
      
      // Batch connection statuses
      case 'connection_statuses_batch':
        return this.optimizeConnectionStatusesBatch(params);
      
      // User post reaction status
      case 'user_post_reaction_status':
        return this.optimizeUserPostReactionStatus(params);
      
      // ✅ NEW: Organization optimization cases (MISSING FROM YOUR CODE)
      case 'organizations_single':
        return this.optimizeOrganizations(params);
        
      case 'organization_memberships_single':
        return this.optimizeOrgMemberships(params);
        
      case 'organization_post_likes_single':
        return this.optimizeOrgPostLikes(params);
        
      case 'organization_posts_single':
        return this.optimizeOrgPosts(params);
      
      // ✅ NEW: Additional missing optimizations  
      case 'grants_single':
        return this.optimizeGrants(params);
        
      case 'saved_grants_single':
        return this.optimizeSavedGrants(params);
        
      case 'notifications_single':
        return this.optimizeNotifications(params);
      
      default:
        return originalQuery; // Let unoptimized calls proceed
    }
  }

  // ✅ ADD MISSING ORGANIZATION OPTIMIZATION METHODS:

  // Optimize organization queries (addresses 11 org requests issue)
  async optimizeOrganizations(params) {
    const { orgIds, orgType } = params;
    
    if (this.debug) {
      console.log(`[API Optimizer] Redirecting organizations to batch for:`, orgIds);
    }
    
    try {
      const orgsData = await globalDataManager.getOrganizations(orgIds, orgType);
      
      return {
        data: Object.values(orgsData),
        error: null
      };
    } catch (error) {
      console.error('API Optimizer: Organizations optimization failed:', error);
      throw error;
    }
  }

  // Optimize organization membership queries  
  async optimizeOrgMemberships(params) {
    const { userIds } = params;
    
    if (this.debug) {
      console.log(`[API Optimizer] Redirecting org memberships to batch for users:`, userIds);
    }
    
    try {
      const membershipsData = await globalDataManager.getOrganizationMemberships(userIds);
      
      return {
        data: Object.values(membershipsData).flat(),
        error: null  
      };
    } catch (error) {
      console.error('API Optimizer: Org memberships optimization failed:', error);
      throw error;
    }
  }

  // Optimize organization post likes
  async optimizeOrgPostLikes(params) {
    const { postIds } = params;
    
    if (this.debug) {
      console.log(`[API Optimizer] Redirecting org post likes to batch for posts:`, postIds);
    }
    
    try {
      const likesData = await globalDataManager.getPostLikesForPosts(postIds);
      
      return {
        data: Object.values(likesData).flat(),
        error: null
      };
    } catch (error) {
      console.error('API Optimizer: Org post likes optimization failed:', error);  
      throw error;
    }
  }

  // Optimize organization posts
  async optimizeOrgPosts(params) {
    const { orgIds } = params;
    
    if (this.debug) {
      console.log(`[API Optimizer] Redirecting org posts to batch for orgs:`, orgIds);
    }
    
    try {
      const postsData = await globalDataManager.getPostsForOrganizations(orgIds);
      
      return {
        data: Object.values(postsData).flat(),
        error: null
      };
    } catch (error) {
      console.error('API Optimizer: Org posts optimization failed:', error);
      throw error;
    }
  }

  // Optimize grants queries
  async optimizeGrants(params) {
    const { grantIds } = params;
    
    if (this.debug) {
      console.log(`[API Optimizer] Redirecting grants to batch for:`, grantIds);
    }
    
    try {
      const grantsData = await globalDataManager.getGrants(grantIds);
      
      return {
        data: Object.values(grantsData),
        error: null
      };
    } catch (error) {
      console.error('API Optimizer: Grants optimization failed:', error);
      throw error;
    }
  }

  // Optimize saved grants queries
  async optimizeSavedGrants(params) {
    const { userId } = params;
    
    if (this.debug) {
      console.log(`[API Optimizer] Redirecting saved grants to batch for user:`, userId);
    }
    
    try {
      const savedGrantsData = await globalDataManager.getSavedGrants([userId]);
      
      return {
        data: savedGrantsData[userId] || [],
        error: null
      };
    } catch (error) {
      console.error('API Optimizer: Saved grants optimization failed:', error);
      throw error;
    }
  }

  // Optimize notifications queries
  async optimizeNotifications(params) {
    const { userId } = params;
    
    if (this.debug) {
      console.log(`[API Optimizer] Redirecting notifications to batch for user:`, userId);
    }
    
    try {
      const notificationsData = await globalDataManager.getNotifications([userId]);
      
      return {
        data: notificationsData[userId] || [],
        error: null
      };
    } catch (error) {
      console.error('API Optimizer: Notifications optimization failed:', error);
      throw error;
    }
  }

  // EXISTING METHODS (unchanged from your code):
  async optimizePostLikes(params) {
    const { postId } = params;
    
    if (this.debug) {
      console.log(`[API Optimizer] Redirecting post_likes to batch for post ${postId}`);
    }
    
    try {
      const likesData = await globalDataManager.getPostLikesForPost(postId);
      
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

  async optimizeProfiles(params) {
    const { userIds } = params;
    
    if (this.debug) {
      console.log(`[API Optimizer] Redirecting profiles to batch for users:`, userIds);
    }
    
    try {
      const profilesData = await globalDataManager.getProfiles(userIds);
      
      return {
        data: Object.values(profilesData),
        error: null
      };
    } catch (error) {
      console.error('API Optimizer: Profiles optimization failed:', error);
      throw error;
    }
  }

  async optimizeOrgMembership(params) {
    const { userId } = params;
    
    if (this.debug) {
      console.log(`[API Optimizer] Redirecting org membership to batch for user ${userId}`);
    }
    
    try {
      const membershipData = await globalDataManager.getOrganizationMembership(userId);
      
      return {
        data: membershipData ? [membershipData] : [],
        error: null
      };
    } catch (error) {
      console.error('API Optimizer: Org membership optimization failed:', error);
      throw error;
    }
  }

  async optimizePostComments(params) {
    const { postId } = params;
    
    if (this.debug) {
      console.log(`[API Optimizer] Redirecting post_comments to batch for post ${postId}`);
    }
    
    try {
      const commentsData = await globalDataManager.getCommentsForPost(postId);
      
      return {
        data: commentsData,
        error: null
      };
    } catch (error) {
      console.error('API Optimizer: Comments optimization failed:', error);
      throw error;
    }
  }

  async optimizeUserConnections(params) {
    const { userId, status } = params;
    
    if (this.debug) {
      console.log(`[API Optimizer] Redirecting user_connections to batch for user ${userId}`);
    }
    
    try {
      const connectionsData = await globalDataManager.getUserConnections([userId], status);
      
      return {
        data: connectionsData[userId] || [],
        error: null
      };
    } catch (error) {
      console.error('API Optimizer: User connections optimization failed:', error);
      throw error;
    }
  }

  async optimizeConnectionStatus(params) {
    const { currentUserId, targetUserId } = params;
    
    if (this.debug) {
      console.log(`[API Optimizer] Redirecting connection status check to batch for ${currentUserId} -> ${targetUserId}`);
    }
    
    try {
      const statusData = await globalDataManager.getConnectionStatus(currentUserId, targetUserId);
      
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

  async optimizeFollowers(params) {
    const { userId } = params;
    
    if (this.debug) {
      console.log(`[API Optimizer] Redirecting followers to batch for user ${userId}`);
    }
    
    try {
      const followersData = await globalDataManager.getFollowers([userId]);
      
      return {
        data: followersData[userId] || [],
        error: null
      };
    } catch (error) {
      console.error('API Optimizer: Followers optimization failed:', error);
      throw error;
    }
  }

  async optimizeFollowing(params) {
    const { userId } = params;
    
    if (this.debug) {
      console.log(`[API Optimizer] Redirecting following to batch for user ${userId}`);
    }
    
    try {
      const followingData = await globalDataManager.getFollowing([userId]);
      
      return {
        data: followingData[userId] || [],
        error: null
      };
    } catch (error) {
      console.error('API Optimizer: Following optimization failed:', error);
      throw error;
    }
  }

  async optimizeUserPostReactionStatus(params) {
    const { postId, userId } = params;
    
    if (this.debug) {
      console.log(`[API Optimizer] Redirecting user post reaction status to batch for post ${postId}`);
    }
    
    try {
      const likesData = await globalDataManager.getPostLikesForPost(postId);
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

  async optimizeConnectionStatusesBatch(params) {
    const { currentUserId, targetUserIds } = params;
    
    if (this.debug) {
      console.log(`[API Optimizer] Batch connection status check for ${targetUserIds.length} users`);
    }
    
    try {
      const statusesData = await globalDataManager.getBatchConnectionStatuses(currentUserId, targetUserIds);
      
      return {
        data: statusesData,
        error: null
      };
    } catch (error) {
      console.error('API Optimizer: Batch connection statuses optimization failed:', error);
      throw error;
    }
  }

  enableDebug() {
    this.debug = true;
    console.log('[API Optimizer] Debug mode enabled');
  }

  disableDebug() {
    this.debug = false;
  }

  getStats() {
    return {
      interceptedCalls: this.interceptedCalls.size,
      debugMode: this.debug
    };
  }
}

// Create singleton instance
const apiRequestOptimizer = new ApiRequestOptimizer();

// ✅ COMPLETE helper function with ALL optimization types
export function optimizedSupabaseQuery(queryBuilder, queryType, params = {}) {
  const shouldOptimize = [
    // Existing optimizations  
    'post_likes_single',
    'profiles_single', 
    'org_membership_single',
    'post_comments_single',
    'user_connections_single',
    'user_connections_status', 
    'followers_single',
    'following_single',
    'connection_statuses_batch',
    'user_post_reaction_status',
    
    // ✅ MISSING organization optimizations (fixes 11 org requests)
    'organizations_single',
    'organization_memberships_single', 
    'organization_post_likes_single',
    'organization_posts_single',
    
    // ✅ Additional missing optimizations
    'grants_single',
    'saved_grants_single',
    'notifications_single'
  ].includes(queryType);

  if (shouldOptimize) {
    return apiRequestOptimizer.optimizeSupabaseQuery(queryBuilder, queryType, params);
  }
  
  return queryBuilder;
}

export default apiRequestOptimizer;