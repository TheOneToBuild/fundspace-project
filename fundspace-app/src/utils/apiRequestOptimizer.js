// src/utils/apiRequestOptimizer.js - FIXED VERSION - Properly handles async optimization
import globalDataManager from './globalDataManager';

class ApiRequestOptimizer {
  constructor() {
    this.interceptedCalls = new Set();
    this.debug = false;
  }

  // Intercept Supabase queries and redirect to batched versions
  async optimizeSupabaseQuery(originalQuery, queryType, params) {
    const queryKey = `${queryType}-${JSON.stringify(params)}`;
    
    if (this.debug) {
      console.log(`[API Optimizer] Intercepting ${queryType}:`, params);
    }

    // Prevent duplicate optimization
    if (this.interceptedCalls.has(queryKey)) {
      if (originalQuery) {
        return await originalQuery; // Let it proceed normally
      }
      return { data: [], error: null };
    }

    this.interceptedCalls.add(queryKey);

    // Clean up after 1 second
    setTimeout(() => {
      this.interceptedCalls.delete(queryKey);
    }, 1000);

    try {
      switch (queryType) {
        case 'post_likes_single':
          return await this.optimizePostLikes(params);
        
        case 'profiles_single':
          return await this.optimizeProfiles(params);
        
        case 'org_membership_single':
          return await this.optimizeOrgMembership(params);
        
        case 'post_comments_single':
          return await this.optimizePostComments(params);
        
        case 'user_connections_single':
          return await this.optimizeUserConnections(params);
        
        case 'user_connections_status':
          return await this.optimizeConnectionStatus(params);
        
        case 'followers_single':
          return await this.optimizeFollowers(params);
        
        case 'following_single':
          return await this.optimizeFollowing(params);
        
        case 'connection_statuses_batch':
          return await this.optimizeConnectionStatusesBatch(params);
        
        case 'user_post_reaction_status':
          return await this.optimizeUserPostReactionStatus(params);
        
        case 'organizations_single':
          return await this.optimizeOrganizations(params);
          
        case 'organization_memberships_single':
          return await this.optimizeOrgMemberships(params);
          
        case 'organization_post_likes_single':
          return await this.optimizeOrgPostLikes(params);
          
        case 'organization_posts_single':
          return await this.optimizeOrgPosts(params);
        
        case 'grants_single':
          return await this.optimizeGrants(params);
          
        case 'saved_grants_single':
          return await this.optimizeSavedGrants(params);
          
        case 'notifications_single':
          return await this.optimizeNotifications(params);
        
        default:
          if (originalQuery) {
            return await originalQuery; // Let unoptimized calls proceed
          }
          return { data: [], error: null };
      }
    } catch (error) {
      console.error(`[API Optimizer] Error in ${queryType}:`, error);
      // Fallback to original query if optimization fails
      if (originalQuery) {
        try {
          return await originalQuery;
        } catch (fallbackError) {
          return { data: [], error: fallbackError };
        }
      }
      return { data: [], error };
    }
  }

  // Organization optimization methods
  async optimizeOrganizations(params) {
    const { orgIds } = params;
    
    if (this.debug) {
      console.log(`[API Optimizer] Redirecting organizations to batch for:`, orgIds);
    }
    
    const orgsData = await globalDataManager.getOrganizations(orgIds || []);
    return {
      data: Object.values(orgsData),
      error: null
    };
  }

  async optimizeOrgMemberships(params) {
    const { userIds } = params;
    
    if (this.debug) {
      console.log(`[API Optimizer] Redirecting org memberships to batch for users:`, userIds);
    }
    
    const membershipsData = await globalDataManager.getOrganizationMemberships(userIds || []);
    return {
      data: Object.values(membershipsData).flat(),
      error: null  
    };
  }

  async optimizeOrgPostLikes(params) {
    const { postIds } = params;
    
    if (this.debug) {
      console.log(`[API Optimizer] Redirecting org post likes to batch for posts:`, postIds);
    }
    
    const likesData = await globalDataManager.getPostLikesForPosts(postIds || []);
    return {
      data: Object.values(likesData).flat(),
      error: null
    };
  }

  async optimizeOrgPosts(params) {
    const { orgIds } = params;
    
    if (this.debug) {
      console.log(`[API Optimizer] Redirecting org posts to batch for orgs:`, orgIds);
    }
    
    const postsData = await globalDataManager.getPostsForOrganizations(orgIds || []);
    return {
      data: Object.values(postsData).flat(),
      error: null
    };
  }

  async optimizeGrants(params) {
    const { grantIds } = params;
    
    if (this.debug) {
      console.log(`[API Optimizer] Redirecting grants to batch for:`, grantIds);
    }
    
    const grantsData = await globalDataManager.getGrants(grantIds || []);
    return {
      data: Object.values(grantsData),
      error: null
    };
  }

  async optimizeSavedGrants(params) {
    const { userId } = params;
    
    if (this.debug) {
      console.log(`[API Optimizer] Redirecting saved grants to batch for user:`, userId);
    }
    
    if (!userId) {
      return { data: [], error: null };
    }
    
    const savedGrantsData = await globalDataManager.getSavedGrants([userId]);
    return {
      data: savedGrantsData[userId] || [],
      error: null
    };
  }

  async optimizeNotifications(params) {
    const { userId } = params;
    
    if (this.debug) {
      console.log(`[API Optimizer] Redirecting notifications to batch for user:`, userId);
    }
    
    if (!userId) {
      return { data: [], error: null };
    }
    
    const notificationsData = await globalDataManager.getNotifications([userId]);
    return {
      data: notificationsData[userId] || [],
      error: null
    };
  }

  // Existing optimization methods
  async optimizePostLikes(params) {
    const { postId } = params;
    
    if (this.debug) {
      console.log(`[API Optimizer] Redirecting post_likes to batch for post ${postId}`);
    }
    
    const likesData = await globalDataManager.getPostLikesForPost(postId);
    return {
      data: likesData.reactors || [],
      error: null,
      count: likesData.likes_count || 0
    };
  }

  async optimizeProfiles(params) {
    const { userIds } = params;
    
    if (this.debug) {
      console.log(`[API Optimizer] Redirecting profiles to batch for users:`, userIds);
    }
    
    const profilesData = await globalDataManager.getProfiles(userIds || []);
    return {
      data: Object.values(profilesData),
      error: null
    };
  }

  async optimizeOrgMembership(params) {
    const { userId } = params;
    
    if (this.debug) {
      console.log(`[API Optimizer] Redirecting org membership to batch for user ${userId}`);
    }
    
    if (!userId) {
      return { data: [], error: null };
    }
    
    const membershipData = await globalDataManager.getOrganizationMembership(userId);
    return {
      data: membershipData ? [membershipData] : [],
      error: null
    };
  }

  async optimizePostComments(params) {
    const { postId } = params;
    
    if (this.debug) {
      console.log(`[API Optimizer] Redirecting post_comments to batch for post ${postId}`);
    }
    
    const commentsData = await globalDataManager.getCommentsForPost(postId);
    return {
      data: commentsData,
      error: null
    };
  }

  async optimizeUserConnections(params) {
    const { userId, status } = params;
    
    if (this.debug) {
      console.log(`[API Optimizer] Redirecting user_connections to batch for user ${userId}`);
    }
    
    if (!userId) {
      return { data: [], error: null };
    }
    
    const connectionsData = await globalDataManager.getUserConnections([userId], status);
    return {
      data: connectionsData[userId] || [],
      error: null
    };
  }

  async optimizeConnectionStatus(params) {
    const { currentUserId, targetUserId } = params;
    
    if (this.debug) {
      console.log(`[API Optimizer] Redirecting connection status check to batch for ${currentUserId} -> ${targetUserId}`);
    }
    
    const statusData = await globalDataManager.getConnectionStatus(currentUserId, targetUserId);
    return {
      status: statusData.status || 'none',
      isRequester: statusData.isRequester || false,
      error: null
    };
  }

  async optimizeFollowers(params) {
    const { userId } = params;
    
    if (this.debug) {
      console.log(`[API Optimizer] Redirecting followers to batch for user ${userId}`);
    }
    
    if (!userId) {
      return { data: [], error: null };
    }
    
    const followersData = await globalDataManager.getFollowers([userId]);
    return {
      data: followersData[userId] || [],
      error: null
    };
  }

  async optimizeFollowing(params) {
    const { userId } = params;
    
    if (this.debug) {
      console.log(`[API Optimizer] Redirecting following to batch for user ${userId}`);
    }
    
    if (!userId) {
      return { data: [], error: null };
    }
    
    const followingData = await globalDataManager.getFollowing([userId]);
    return {
      data: followingData[userId] || [],
      error: null
    };
  }

  async optimizeUserPostReactionStatus(params) {
    const { postId, userId } = params;
    
    if (this.debug) {
      console.log(`[API Optimizer] Redirecting user post reaction status to batch for post ${postId}`);
    }
    
    const likesData = await globalDataManager.getPostLikesForPost(postId);
    const userReactor = likesData.reactors?.find(reactor => reactor.user_id === userId);
    
    return {
      userReaction: userReactor?.reaction_type || null,
      error: null
    };
  }

  async optimizeConnectionStatusesBatch(params) {
    const { currentUserId, targetUserIds } = params;
    
    if (this.debug) {
      console.log(`[API Optimizer] Batch connection status check for ${targetUserIds?.length || 0} users`);
    }
    
    if (!currentUserId || !targetUserIds || targetUserIds.length === 0) {
      return { data: {}, error: null };
    }
    
    const statusesData = await globalDataManager.getBatchConnectionStatuses(currentUserId, targetUserIds);
    return {
      data: statusesData,
      error: null
    };
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

// FIXED: Properly handle async optimization
export function optimizedSupabaseQuery(queryBuilder, queryType, params = {}) {
  const shouldOptimize = [
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
    'organizations_single',
    'organization_memberships_single', 
    'organization_post_likes_single',
    'organization_posts_single',
    'grants_single',
    'saved_grants_single',
    'notifications_single'
  ].includes(queryType);

  if (shouldOptimize) {
    // Return the optimization promise directly - do NOT execute original query
    return apiRequestOptimizer.optimizeSupabaseQuery(null, queryType, params);
  }
  
  // Only execute original query if not optimized
  return queryBuilder;
}

export default apiRequestOptimizer;