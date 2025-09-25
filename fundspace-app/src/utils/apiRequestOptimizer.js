// src/utils/apiRequestOptimizer.js - Intercepts and optimizes individual API calls
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

// Helper function to wrap Supabase queries
export function optimizedSupabaseQuery(queryBuilder, queryType, params = {}) {
  // Check if this query should be optimized
  const shouldOptimize = [
    'post_likes_single',
    'profiles_single', 
    'org_membership_single',
    'post_comments_single'
  ].includes(queryType);

  if (shouldOptimize) {
    return apiRequestOptimizer.optimizeSupabaseQuery(queryBuilder, queryType, params);
  }
  
  // Let unoptimized queries proceed normally
  return queryBuilder;
}

export default apiRequestOptimizer;