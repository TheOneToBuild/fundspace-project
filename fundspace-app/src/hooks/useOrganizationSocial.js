// src/hooks/useOrganizationSocial.js - FIXED to use session user ID

import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.js';

export const useOrganizationSocial = (organizationId, sessionUserId) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarksCount, setBookmarksCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) return;

    const loadSocialData = async () => {
      try {
        // Get follower count
        const { count: followCount, error: followCountError } = await supabase
          .from('organization_follows')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId);

        if (followCountError) {
          console.warn('Error fetching follower count:', followCountError);
        } else {
          setFollowersCount(followCount || 0);
        }

        // Get bookmark count
        const { count: bookmarkCount, error: bookmarkCountError } = await supabase
          .from('organization_bookmarks')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId);

        if (bookmarkCountError) {
          console.warn('Error fetching bookmark count:', bookmarkCountError);
        } else {
          setBookmarksCount(bookmarkCount || 0);
        }

        // Check user's relationship if logged in (using session user ID)
        if (sessionUserId) {
          const [followRes, bookmarkRes] = await Promise.all([
            supabase
              .from('organization_follows')
              .select('id')
              .eq('organization_id', organizationId)
              .eq('user_id', sessionUserId)
              .maybeSingle(), // Use maybeSingle() to avoid errors when no data found
            supabase
              .from('organization_bookmarks')
              .select('id')
              .eq('organization_id', organizationId)
              .eq('user_id', sessionUserId)
              .maybeSingle() // Use maybeSingle() to avoid errors when no data found
          ]);

          // Only log errors if they're not "no rows" errors
          if (followRes.error && followRes.error.code !== 'PGRST116') {
            console.warn('Error checking follow status:', followRes.error);
          } else {
            setIsFollowing(!!followRes.data);
          }

          if (bookmarkRes.error && bookmarkRes.error.code !== 'PGRST116') {
            console.warn('Error checking bookmark status:', bookmarkRes.error);
          } else {
            setIsBookmarked(!!bookmarkRes.data);
          }
        }
      } catch (error) {
        console.error('Error loading social data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSocialData();
  }, [organizationId, sessionUserId]);

  const toggleFollow = async () => {
    if (!sessionUserId || !organizationId) {
      console.warn('Cannot toggle follow: missing user ID or organization ID');
      return;
    }

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('organization_follows')
          .delete()
          .eq('organization_id', organizationId)
          .eq('user_id', sessionUserId);

        if (error) {
          console.error('Error unfollowing:', error);
        } else {
          setIsFollowing(false);
          setFollowersCount(prev => Math.max(0, prev - 1));
        }
      } else {
        const { error } = await supabase
          .from('organization_follows')
          .insert({
            organization_id: organizationId,
            user_id: sessionUserId
          });

        if (error) {
          console.error('Error following:', error);
        } else {
          setIsFollowing(true);
          setFollowersCount(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const toggleBookmark = async () => {
    if (!sessionUserId || !organizationId) {
      console.warn('Cannot toggle bookmark: missing user ID or organization ID');
      return;
    }

    try {
      if (isBookmarked) {
        const { error } = await supabase
          .from('organization_bookmarks')
          .delete()
          .eq('organization_id', organizationId)
          .eq('user_id', sessionUserId);

        if (error) {
          console.error('Error removing bookmark:', error);
        } else {
          setIsBookmarked(false);
          setBookmarksCount(prev => Math.max(0, prev - 1));
        }
      } else {
        const { error } = await supabase
          .from('organization_bookmarks')
          .insert({
            organization_id: organizationId,
            user_id: sessionUserId
          });

        if (error) {
          console.error('Error adding bookmark:', error);
        } else {
          setIsBookmarked(true);
          setBookmarksCount(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  return {
    isFollowing,
    followersCount,
    isBookmarked,
    bookmarksCount,
    loading,
    toggleFollow,
    toggleBookmark
  };
};