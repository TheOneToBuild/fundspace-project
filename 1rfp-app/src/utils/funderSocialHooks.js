// utils/funderSocialHooks.js - Custom hooks for funder social interactions
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Hook for managing funder follows
 * @param {number} funderId - The ID of the funder
 * @param {string} userId - The current user's ID
 */
export const useFunderFollow = (funderId, userId) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch initial follow status and count
  useEffect(() => {
    const fetchFollowData = async () => {
      if (!funderId) return;
      
      try {
        setLoading(true);
        
        // Get total followers count
        const { count: totalFollowers, error: countError } = await supabase
          .from('funder_follows')
          .select('*', { count: 'exact', head: true })
          .eq('funder_id', funderId);

        if (countError) throw countError;
        setFollowersCount(totalFollowers || 0);

        // Check if current user is following (only if logged in)
        if (userId) {
          const { data: followData, error: followError } = await supabase
            .from('funder_follows')
            .select('id')
            .eq('funder_id', funderId)
            .eq('user_id', userId)
            .single();

          if (followError && followError.code !== 'PGRST116') { // PGRST116 = no rows returned
            throw followError;
          }

          setIsFollowing(!!followData);
        }
      } catch (error) {
        console.error('Error fetching follow data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowData();
  }, [funderId, userId]);

  // Toggle follow status
  const toggleFollow = useCallback(async () => {
    if (!userId || !funderId) {
      console.warn('User must be logged in to follow funders');
      return;
    }

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('funder_follows')
          .delete()
          .eq('funder_id', funderId)
          .eq('user_id', userId);

        if (error) throw error;

        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
      } else {
        // Follow
        const { error } = await supabase
          .from('funder_follows')
          .insert({
            funder_id: funderId,
            user_id: userId
          });

        if (error) throw error;

        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      // You might want to show a toast notification here
    }
  }, [funderId, userId, isFollowing]);

  return {
    isFollowing,
    followersCount,
    loading,
    toggleFollow
  };
};

/**
 * Hook for managing funder bookmarks/likes
 * @param {number} funderId - The ID of the funder
 * @param {string} userId - The current user's ID
 */
export const useFunderBookmark = (funderId, userId) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarksCount, setBookmarksCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch initial bookmark status and count
  useEffect(() => {
    const fetchBookmarkData = async () => {
      if (!funderId) return;
      
      try {
        setLoading(true);
        
        // Get total bookmarks count (using as "likes")
        const { count: totalBookmarks, error: countError } = await supabase
          .from('funder_bookmarks')
          .select('*', { count: 'exact', head: true })
          .eq('funder_id', funderId);

        if (countError) throw countError;
        setBookmarksCount(totalBookmarks || 0);

        // Check if current user has bookmarked (only if logged in)
        if (userId) {
          const { data: bookmarkData, error: bookmarkError } = await supabase
            .from('funder_bookmarks')
            .select('id')
            .eq('funder_id', funderId)
            .eq('user_id', userId)
            .single();

          if (bookmarkError && bookmarkError.code !== 'PGRST116') {
            throw bookmarkError;
          }

          setIsBookmarked(!!bookmarkData);
        }
      } catch (error) {
        console.error('Error fetching bookmark data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarkData();
  }, [funderId, userId]);

  // Toggle bookmark status
  const toggleBookmark = useCallback(async () => {
    if (!userId || !funderId) {
      console.warn('User must be logged in to bookmark funders');
      return;
    }

    try {
      if (isBookmarked) {
        // Remove bookmark
        const { error } = await supabase
          .from('funder_bookmarks')
          .delete()
          .eq('funder_id', funderId)
          .eq('user_id', userId);

        if (error) throw error;

        setIsBookmarked(false);
        setBookmarksCount(prev => Math.max(0, prev - 1));
      } else {
        // Add bookmark
        const { error } = await supabase
          .from('funder_bookmarks')
          .insert({
            funder_id: funderId,
            user_id: userId
          });

        if (error) throw error;

        setIsBookmarked(true);
        setBookmarksCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      // You might want to show a toast notification here
    }
  }, [funderId, userId, isBookmarked]);

  return {
    isBookmarked,
    bookmarksCount,
    loading,
    toggleBookmark
  };
};

/**
 * Hook for managing organization post likes
 * @param {number} postId - The ID of the post
 * @param {string} userId - The current user's ID
 */
export const usePostLike = (postId, userId) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch initial like status and count
  useEffect(() => {
    const fetchLikeData = async () => {
      if (!postId) return;
      
      try {
        setLoading(true);
        
        // Get total likes count
        const { count: totalLikes, error: countError } = await supabase
          .from('post_likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', postId);

        if (countError) throw countError;
        setLikesCount(totalLikes || 0);

        // Check if current user has liked (only if logged in)
        if (userId) {
          const { data: likeData, error: likeError } = await supabase
            .from('post_likes')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', userId)
            .single();

          if (likeError && likeError.code !== 'PGRST116') {
            throw likeError;
          }

          setIsLiked(!!likeData);
        }
      } catch (error) {
        console.error('Error fetching like data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLikeData();
  }, [postId, userId]);

  // Toggle like status
  const toggleLike = useCallback(async () => {
    if (!userId || !postId) {
      console.warn('User must be logged in to like posts');
      return;
    }

    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);

        if (error) throw error;

        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        // Like
        const { error } = await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: userId,
            reaction_type: 'like'
          });

        if (error) throw error;

        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }

      // Also update the posts table likes_count if you want to maintain denormalized counts
      const { error: updateError } = await supabase
        .rpc('update_post_likes_count', { post_id: postId });

      if (updateError) {
        console.warn('Error updating post likes count:', updateError);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  }, [postId, userId, isLiked]);

  return {
    isLiked,
    likesCount,
    loading,
    toggleLike
  };
};

/**
 * Hook for fetching funder's followers list
 * @param {number} funderId - The ID of the funder
 */
export const useFunderFollowers = (funderId) => {
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFollowers = async () => {
      if (!funderId) return;
      
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('funder_follows')
          .select(`
            user_id,
            created_at,
            profiles:user_id (
              id,
              full_name,
              avatar_url,
              title,
              organization_name
            )
          `)
          .eq('funder_id', funderId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        setFollowers(data || []);
      } catch (error) {
        console.error('Error fetching followers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowers();
  }, [funderId]);

  return { followers, loading };
};