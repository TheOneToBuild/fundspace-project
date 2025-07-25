// src/hooks/useOrganizationSocial.js

import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.js';

export const useOrganizationSocial = (organizationId, userId) => {
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
        const { count: followCount } = await supabase
          .from('organization_follows')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId);

        setFollowersCount(followCount || 0);

        // Get bookmark count
        const { count: bookmarkCount } = await supabase
          .from('organization_bookmarks')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId);

        setBookmarksCount(bookmarkCount || 0);

        // Check user's relationship if logged in
        if (userId) {
          const [followRes, bookmarkRes] = await Promise.all([
            supabase
              .from('organization_follows')
              .select('id')
              .eq('organization_id', organizationId)
              .eq('user_id', userId)
              .single(),
            supabase
              .from('organization_bookmarks')
              .select('id')
              .eq('organization_id', organizationId)
              .eq('user_id', userId)
              .single()
          ]);

          setIsFollowing(!!followRes.data);
          setIsBookmarked(!!bookmarkRes.data);
        }
      } catch (error) {
        console.error('Error loading social data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSocialData();
  }, [organizationId, userId]);

  const toggleFollow = async () => {
    if (!userId || !organizationId) return;

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('organization_follows')
          .delete()
          .eq('organization_id', organizationId)
          .eq('user_id', userId);

        if (!error) {
          setIsFollowing(false);
          setFollowersCount(prev => Math.max(0, prev - 1));
        }
      } else {
        const { error } = await supabase
          .from('organization_follows')
          .insert({
            organization_id: organizationId,
            user_id: userId
          });

        if (!error) {
          setIsFollowing(true);
          setFollowersCount(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const toggleBookmark = async () => {
    if (!userId || !organizationId) return;

    try {
      if (isBookmarked) {
        const { error } = await supabase
          .from('organization_bookmarks')
          .delete()
          .eq('organization_id', organizationId)
          .eq('user_id', userId);

        if (!error) {
          setIsBookmarked(false);
          setBookmarksCount(prev => Math.max(0, prev - 1));
        }
      } else {
        const { error } = await supabase
          .from('organization_bookmarks')
          .insert({
            organization_id: organizationId,
            user_id: userId
          });

        if (!error) {
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