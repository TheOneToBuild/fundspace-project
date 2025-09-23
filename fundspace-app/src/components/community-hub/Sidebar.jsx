// src/components/community-hub/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { TrendingUp, MessageCircle, Heart, Clock } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import PropTypes from 'prop-types';

const TrendingPosts = ({ activeChannelConfig, organizationInfo, onTrendingPostClick, posts }) => {
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeChannelConfig && !activeChannelConfig.disabled) {
      fetchTrendingPosts();
    } else {
      setTrendingPosts([]);
      setLoading(false);
    }
  }, [activeChannelConfig?.dbChannel, organizationInfo]);

  const fetchTrendingPosts = async () => {
    setLoading(true);
    try {
      const channelFilter = activeChannelConfig.dbChannel;

      // Calculate trending score using engagement metrics from the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: fetchedPosts, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          likes_count,
          comments_count,
          profiles:profile_id(
            id,
            full_name,
            avatar_url,
            organization_name
          )
        `)
        .eq('channel', channelFilter)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Calculate trending score for each post
      const postsWithTrendingScore = fetchedPosts?.map(post => {
        const hoursOld = (new Date() - new Date(post.created_at)) / (1000 * 60 * 60);
        const ageWeight = Math.max(0.1, 1 - (hoursOld / 168)); // Decay over 7 days
        
        // Trending score: weighted combination of likes, comments, and recency
        const trendingScore = (
          (post.likes_count * 1.0) + 
          (post.comments_count * 2.0) + // Comments are worth more
          (ageWeight * 10) // Recent posts get boost
        ) / Math.max(1, hoursOld * 0.1); // Divide by age factor

        return {
          ...post,
          trendingScore,
          hoursOld: Math.floor(hoursOld),
          engagement: post.likes_count + post.comments_count
        };
      }) || [];

      // Sort by trending score and take top 3
      const topTrending = postsWithTrendingScore
        .sort((a, b) => b.trendingScore - a.trendingScore)
        .slice(0, 3);

      setTrendingPosts(topTrending);
    } catch (error) {
      console.error('Error fetching trending posts:', error);
      setTrendingPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const truncateContent = (content, maxLength = 60) => {
    if (!content) return '';
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  };

  const getTimeAgo = (hoursOld) => {
    if (hoursOld < 1) return 'Just now';
    if (hoursOld < 24) return `${hoursOld}h ago`;
    const days = Math.floor(hoursOld / 24);
    return `${days}d ago`;
  };

  const getEngagementGrowth = (engagement, hoursOld) => {
    // Simple growth calculation based on engagement vs age
    const baselineEngagement = Math.max(1, hoursOld * 0.5);
    const growthRate = ((engagement - baselineEngagement) / baselineEngagement) * 100;
    return Math.max(0, Math.min(999, Math.round(growthRate)));
  };

  const handlePostClick = (postId) => {
    // Check if post is in current visible posts, if not, we can't scroll to it
    const isPostVisible = posts.some(post => post.id === postId);
    if (isPostVisible) {
      onTrendingPostClick(postId);
    } else {
      // Could implement a "Load more to see this post" feature here
      console.log('Post not currently visible in feed');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-slate-200 rounded mb-2"></div>
            <div className="h-3 bg-slate-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-slate-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (trendingPosts.length === 0) {
    return (
      <div className="text-center py-6 text-slate-500">
        <TrendingUp size={24} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">No trending posts yet</p>
        <p className="text-xs">Be the first to create engaging content!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {trendingPosts.map((post, index) => {
        const growthRate = getEngagementGrowth(post.engagement, post.hoursOld);
        const isHot = growthRate > 50;
        const isPostVisible = posts.some(p => p.id === post.id);
        
        return (
          <div 
            key={post.id} 
            className={`group cursor-pointer hover:bg-slate-50 rounded-lg p-3 transition-colors ${
              isPostVisible ? '' : 'opacity-60'
            }`}
            onClick={() => handlePostClick(post.id)}
          >
            <div className={`border-l-4 pl-3 ${
              index === 0 ? 'border-green-500' : 
              index === 1 ? 'border-blue-500' : 
              'border-purple-500'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-5 h-5 rounded-full bg-slate-300 flex-shrink-0">
                      {post.profiles?.avatar_url ? (
                        <img 
                          src={post.profiles.avatar_url} 
                          alt={post.profiles.full_name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-slate-400"></div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-900 truncate">
                        {post.profiles?.full_name || 'Anonymous'}
                      </p>
                    </div>
                  </div>
                  
                  <h4 className="font-medium text-sm text-slate-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {truncateContent(post.content)}
                  </h4>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs text-slate-500">
                      <div className="flex items-center space-x-1">
                        <Heart size={10} />
                        <span>{post.likes_count}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageCircle size={10} />
                        <span>{post.comments_count}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock size={10} />
                        <span>{getTimeAgo(post.hoursOld)}</span>
                      </div>
                    </div>
                    
                    <div className={`text-xs font-semibold flex items-center space-x-1 ${
                      index === 0 ? 'text-green-600' : 
                      index === 1 ? 'text-blue-600' : 
                      'text-purple-600'
                    }`}>
                      {isHot && (
                        <span className="text-orange-500">🔥</span>
                      )}
                      <span>+{growthRate}%</span>
                    </div>
                  </div>
                  
                  {!isPostVisible && (
                    <p className="text-xs text-slate-400 mt-1">Load more posts to view</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

TrendingPosts.propTypes = {
  activeChannelConfig: PropTypes.object,
  organizationInfo: PropTypes.object,
  onTrendingPostClick: PropTypes.func.isRequired,
  posts: PropTypes.array.isRequired
};

const Sidebar = ({ activeChannel, activeChannelConfig, organizationInfo, onTrendingPostClick, posts }) => {
  return (
    <div className="lg:col-span-3 space-y-6">
      {/* Trending Posts Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-4">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <TrendingUp size={16} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">Trending Posts</h3>
            <p className="text-xs text-slate-500">Most engaging content this week</p>
          </div>
        </div>
        <TrendingPosts 
          activeChannelConfig={activeChannelConfig}
          organizationInfo={organizationInfo}
          onTrendingPostClick={onTrendingPostClick}
          posts={posts}
        />
      </div>

      {/* Community Guidelines */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-4">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm">📋</span>
          </div>
          <h3 className="font-bold text-base text-slate-900">Community Guidelines</h3>
        </div>
        <ul className="space-y-2 text-sm text-slate-600">
          <li className="flex items-start space-x-2">
            <span className="text-green-500 mt-0.5 text-xs">✓</span>
            <span>Be respectful and professional</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-green-500 mt-0.5 text-xs">✓</span>
            <span>Share relevant content and insights</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-green-500 mt-0.5 text-xs">✓</span>
            <span>Support fellow community members</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-green-500 mt-0.5 text-xs">✓</span>
            <span>Keep discussions constructive</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

Sidebar.propTypes = {
  activeChannel: PropTypes.string.isRequired,
  activeChannelConfig: PropTypes.object,
  organizationInfo: PropTypes.object,
  onTrendingPostClick: PropTypes.func.isRequired,
  posts: PropTypes.array.isRequired
};

export default Sidebar;