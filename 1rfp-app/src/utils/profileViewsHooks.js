// utils/profileViewsHooks.js - Custom hooks for profile views tracking with privacy support
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

// Utility function to create a privacy-friendly hash
const createHash = async (input) => {
  if (!input) return null;
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
};

// Generate a session ID for tracking unique sessions
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('1rfp_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2);
    sessionStorage.setItem('1rfp_session_id', sessionId);
  }
  return sessionId;
};

/**
 * Hook to track profile views with privacy awareness
 * @param {number} funderId - The ID of the funder being viewed
 * @param {string} userId - The current user's ID (null for anonymous)
 */
export const useProfileViewTracking = (funderId, userId = null) => {
  const [viewRecorded, setViewRecorded] = useState(false);
  const [error, setError] = useState(null);

  const recordView = useCallback(async () => {
    if (!funderId || viewRecorded) return;

    try {
      // Get client info for tracking
      const userAgent = navigator.userAgent;
      const referrer = document.referrer || null;
      const sessionId = getSessionId();
      
      // Create privacy-friendly hashes for anonymous users
      const ipHash = await createHash(
        // We can't directly get IP, so use a combination of browser fingerprints
        userAgent + navigator.language + screen.width + screen.height
      );
      const userAgentHash = await createHash(userAgent);

      // Record the view using our privacy-aware function
      const { data, error } = await supabase.rpc('record_profile_view', {
        p_funder_id: funderId,
        p_viewer_id: userId,
        p_viewer_ip_hash: userId ? null : ipHash, // Only use IP hash for anonymous users
        p_user_agent_hash: userAgentHash,
        p_session_id: sessionId,
        p_referrer: referrer
      });

      if (error) {
        console.warn('Error recording profile view:', error);
        setError(error);
      } else {
        setViewRecorded(true);
        console.log('Profile view recorded:', data);
      }
    } catch (err) {
      console.warn('Error recording profile view:', err);
      setError(err);
    }
  }, [funderId, userId, viewRecorded]);

  // Record view when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      recordView();
    }, 1000); // Wait 1 second to ensure it's not a bot/quick bounce

    return () => clearTimeout(timer);
  }, [recordView]);

  return { viewRecorded, error };
};

/**
 * Hook to get profile view statistics for admins
 * @param {number} funderId - The ID of the funder
 * @param {number} daysBack - Number of days to look back (default: 30)
 */
export const useProfileViewStats = (funderId, daysBack = 30) => {
  const [stats, setStats] = useState({
    totalViews: 0,
    uniqueViewers: 0,
    dailyViews: {},
    topReferrers: {},
    loading: true,
    error: null
  });

  const fetchStats = useCallback(async () => {
    if (!funderId) return;

    try {
      setStats(prev => ({ ...prev, loading: true, error: null }));

      // Get basic stats first
      const { data: viewData, error: viewError } = await supabase
        .from('profile_views')
        .select('*')
        .eq('funder_id', funderId)
        .gte('view_timestamp', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString());

      if (viewError) throw viewError;

      // Calculate stats
      const totalViews = viewData?.length || 0;
      const uniqueViewers = new Set(
        viewData?.filter(v => v.viewer_id).map(v => v.viewer_id) || []
      ).size;

      // Group by date for daily views
      const dailyViews = {};
      viewData?.forEach(view => {
        const date = new Date(view.view_timestamp).toISOString().split('T')[0];
        dailyViews[date] = (dailyViews[date] || 0) + 1;
      });

      // Group by referrer
      const topReferrers = {};
      viewData?.forEach(view => {
        const referrer = view.referrer || 'Direct';
        topReferrers[referrer] = (topReferrers[referrer] || 0) + 1;
      });

      setStats({
        totalViews,
        uniqueViewers,
        dailyViews,
        topReferrers,
        loading: false,
        error: null
      });
    } catch (err) {
      console.error('Error fetching profile view stats:', err);
      setStats(prev => ({
        ...prev,
        loading: false,
        error: err.message
      }));
    }
  }, [funderId, daysBack]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { ...stats, refetch: fetchStats };
};

/**
 * Hook to get recent profile viewers for admin dashboard (privacy-aware)
 * @param {number} funderId - The ID of the funder
 * @param {number} limit - Number of recent viewers to fetch
 */
export const useRecentProfileViewers = (funderId, limit = 10) => {
  const [viewers, setViewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRecentViewers = useCallback(async () => {
    if (!funderId) return;

    try {
      setLoading(true);
      setError(null);

      // Use our privacy-aware function
      const { data, error } = await supabase.rpc('get_recent_profile_viewers', {
        p_funder_id: funderId,
        p_limit: limit
      });

      if (error) throw error;

      setViewers(data || []);
    } catch (err) {
      console.error('Error fetching recent viewers:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [funderId, limit]);

  useEffect(() => {
    fetchRecentViewers();
  }, [fetchRecentViewers]);

  return { viewers, loading, error, refetch: fetchRecentViewers };
};

/**
 * Hook to get view analytics with charts data
 * @param {number} funderId - The ID of the funder
 * @param {number} daysBack - Number of days to look back
 */
export const useViewAnalytics = (funderId, daysBack = 30) => {
  const { totalViews, uniqueViewers, dailyViews, topReferrers, loading, error } = useProfileViewStats(funderId, daysBack);
  
  // Transform daily views into chart-friendly format
  const chartData = Object.entries(dailyViews).map(([date, views]) => ({
    date,
    views: views || 0,
    formattedDate: new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  })).sort((a, b) => new Date(a.date) - new Date(b.date));

  // Transform referrers into chart-friendly format
  const referrerData = Object.entries(topReferrers).map(([referrer, count]) => ({
    referrer: referrer === 'Direct' ? 'Direct' : (
      referrer.startsWith('http') ? new URL(referrer).hostname : referrer
    ),
    count
  })).sort((a, b) => b.count - a.count);

  // Calculate trends
  const midpoint = Math.floor(chartData.length / 2);
  const firstHalf = chartData.slice(0, midpoint);
  const secondHalf = chartData.slice(midpoint);
  
  const firstHalfAvg = firstHalf.reduce((sum, day) => sum + day.views, 0) / (firstHalf.length || 1);
  const secondHalfAvg = secondHalf.reduce((sum, day) => sum + day.views, 0) / (secondHalf.length || 1);
  const trend = secondHalfAvg > firstHalfAvg ? 'up' : secondHalfAvg < firstHalfAvg ? 'down' : 'stable';
  const trendPercentage = firstHalfAvg > 0 ? Math.round(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100) : 0;

  return {
    totalViews,
    uniqueViewers,
    chartData,
    referrerData,
    trend,
    trendPercentage,
    loading,
    error
  };
};