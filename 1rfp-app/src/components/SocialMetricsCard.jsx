// components/SocialMetricsCard.jsx - Component to show social metrics on organization pages
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Eye, Heart, TrendingUp, Users, Calendar, ChevronDown } from 'lucide-react';
import { hasPermission, PERMISSIONS } from '../utils/permissions.js';
import { useProfileViewStats, useRecentProfileViewers } from '../utils/profileViewsHooks.js';

const SocialMetricsCard = ({ organization, organizationType, userRole, isOmegaAdmin }) => {
  const [metrics, setMetrics] = useState({
    followers: 0,
    likes: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30'); // days
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Use profile views data
  const { 
    totalViews: profileViews, 
    uniqueViewers,
    loading: viewsLoading 
  } = useProfileViewStats(organization?.id, parseInt(timeRange));

  const { 
    viewers: recentViewers, 
    loading: viewersLoading 
  } = useRecentProfileViewers(organization?.id, 5);

  // Check if user can view social metrics
  const canViewSocialMetrics = organizationType === 'funder' && 
    (hasPermission(userRole, PERMISSIONS.EDIT_ORGANIZATION, isOmegaAdmin) || 
     hasPermission(userRole, PERMISSIONS.MANAGE_MEMBERS, isOmegaAdmin));

  useEffect(() => {
    const fetchSocialMetrics = async () => {
      if (!organization?.id || !canViewSocialMetrics) return;
      
      try {
        setLoading(true);

        // Only fetch for funders (nonprofits don't have these social features yet)
        if (organizationType === 'funder') {
          // Get followers count (basic count only)
          const { count: followersCount, error: followersError } = await supabase
            .from('funder_follows')
            .select('*', { count: 'exact', head: true })
            .eq('funder_id', organization.id);

          // Get bookmarks/likes count (basic count only)
          const { count: likesCount, error: likesError } = await supabase
            .from('funder_bookmarks')
            .select('*', { count: 'exact', head: true })
            .eq('funder_id', organization.id);

          // Get recent activity without complex relationships - just basic data
          const { data: recentFollowIds, error: recentFollowError } = await supabase
            .from('funder_follows')
            .select('user_id, created_at')
            .eq('funder_id', organization.id)
            .gte('created_at', new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000).toISOString())
            .order('created_at', { ascending: false })
            .limit(5);

          const { data: recentBookmarkIds, error: recentBookmarkError } = await supabase
            .from('funder_bookmarks')
            .select('user_id, created_at')
            .eq('funder_id', organization.id)
            .gte('created_at', new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000).toISOString())
            .order('created_at', { ascending: false })
            .limit(5);

          // Log any errors but don't fail
          if (followersError) {
            console.warn('Could not fetch followers count:', followersError.message);
          }
          if (likesError) {
            console.warn('Could not fetch likes count:', likesError.message);
          }
          if (recentFollowError) {
            console.warn('Could not fetch recent followers:', recentFollowError.message);
          }
          if (recentBookmarkError) {
            console.warn('Could not fetch recent bookmarks:', recentBookmarkError.message);
          }

          // Combine all activity sources (simplified without profile details)
          const combinedActivity = [
            ...(recentFollowIds || []).map(item => ({
              type: 'follow',
              user: {
                full_name: 'Someone',
                organization_name: 'Unknown Organization',
                avatar_url: null
              },
              timestamp: item.created_at
            })),
            ...(recentBookmarkIds || []).map(item => ({
              type: 'bookmark',
              user: {
                full_name: 'Someone',
                organization_name: 'Unknown Organization',
                avatar_url: null
              },
              timestamp: item.created_at
            })),
            ...(recentViewers || []).map(item => ({
              type: 'view',
              user: {
                full_name: item.viewer_name,
                organization_name: item.viewer_organization,
                avatar_url: item.viewer_avatar
              },
              timestamp: item.view_timestamp,
              is_authenticated: item.is_authenticated
            }))
          ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

          setMetrics({
            followers: followersCount || 0,
            likes: likesCount || 0,
            recentActivity: combinedActivity
          });
        }
      } catch (error) {
        console.error('Error fetching social metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSocialMetrics();
  }, [organization?.id, organizationType, timeRange, canViewSocialMetrics, recentViewers]);

  // Don't show for nonprofits or users without permission
  if (!canViewSocialMetrics) {
    return null;
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'follow':
        return <Eye size={16} className="text-blue-500" />;
      case 'bookmark':
        return <Heart size={16} className="text-red-500" />;
      case 'view':
        return <TrendingUp size={16} className="text-green-500" />;
      default:
        return <TrendingUp size={16} className="text-green-500" />;
    }
  };

  const getActivityText = (activity) => {
    const userName = activity.user?.full_name || 'Someone';
    const userOrg = activity.user?.organization_name;
    const orgText = userOrg && userOrg !== 'Unknown' ? ` from ${userOrg}` : '';
    
    switch (activity.type) {
      case 'follow':
        return `${userName}${orgText} started following your organization`;
      case 'bookmark':
        return `${userName}${orgText} bookmarked your organization`;
      case 'view':
        if (activity.is_authenticated) {
          return `${userName}${orgText} viewed your profile`;
        } else {
          return 'Someone viewed your profile';
        }
      default:
        return `${userName} interacted with your profile`;
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="text-blue-500" />
          <h2 className="text-lg font-semibold text-slate-800">Social Engagement</h2>
        </div>
        <div className="flex items-center gap-3">
          {!isCollapsed && (
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="text-sm border border-slate-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            {isCollapsed ? 'Show' : 'Hide'}
            <ChevronDown 
              className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {(loading || viewsLoading || viewersLoading) ? (
            <div className="animate-pulse">
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-slate-200 rounded-lg"></div>
                ))}
              </div>
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-12 bg-slate-200 rounded-lg"></div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Metrics Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Followers</p>
                      <p className="text-2xl font-bold text-blue-700">{metrics.followers}</p>
                    </div>
                    <Eye className="text-blue-500" size={24} />
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    People following your updates
                  </p>
                </div>

                <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-600">Likes/Bookmarks</p>
                      <p className="text-2xl font-bold text-red-700">{metrics.likes}</p>
                    </div>
                    <Heart className="text-red-500" size={24} />
                  </div>
                  <p className="text-xs text-red-600 mt-1">
                    Users who bookmarked you
                  </p>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Profile Views</p>
                      <p className="text-2xl font-bold text-green-700">
                        {viewsLoading ? '...' : profileViews}
                      </p>
                    </div>
                    <TrendingUp className="text-green-500" size={24} />
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    Total views ({uniqueViewers} unique)
                  </p>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="text-md font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Calendar className="text-slate-500" size={18} />
                  Recent Activity ({timeRange} days)
                </h3>
                
                {metrics.recentActivity.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {metrics.recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                        <div className="flex-shrink-0 mt-1">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-700">
                            {getActivityText(activity)}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {formatDate(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Users className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm">No recent activity in the last {timeRange} days</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Activity will appear here when people follow, bookmark, or view your profile
                    </p>
                  </div>
                )}
              </div>

              {/* Tips for increasing engagement */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">💡 Tips to increase engagement:</h4>
                <ul className="text-xs text-slate-600 space-y-1">
                  <li>• Regularly update your organization's posts and announcements</li>
                  <li>• Share impact stories and success stories from your grantees</li>
                  <li>• Keep your grant opportunities current and well-detailed</li>
                  <li>• Engage with the nonprofit community through kudos and comments</li>
                </ul>
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <strong>View Analytics:</strong> View counts update as users visit your profile based on their privacy preferences.
                  </p>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default SocialMetricsCard;