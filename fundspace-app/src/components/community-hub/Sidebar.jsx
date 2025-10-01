import React, { useState, useEffect } from 'react';
import { TrendingUp, MessageCircle, Heart } from 'lucide-react';
import { getCommunityPosts } from '../../utils/rpcClientFunctions';
import PropTypes from 'prop-types';
import { supabase } from '../../supabaseClient';

const TrendingPosts = ({ activeChannelConfig, onTrendingPostClick, posts }) => {
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeChannelConfig && !activeChannelConfig.disabled) {
      fetchTrendingPosts();
    } else {
      setTrendingPosts([]);
      setLoading(false);
    }
  }, [activeChannelConfig?.dbChannel]);

  const fetchTrendingPosts = async () => {
    setLoading(true);
    try {
      const channelFilter = activeChannelConfig.dbChannel;
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Use RPC function
      const result = await getCommunityPosts(channelFilter, 100, null);
      const fetchedPosts = (result?.posts || []).filter(post => 
        new Date(post.created_at) >= sevenDaysAgo
      );

      const postsWithTrendingScore = fetchedPosts.map(post => {
        const hoursOld = (new Date() - new Date(post.created_at)) / (1000 * 60 * 60);
        const daysOld = hoursOld / 24;
        const ageWeight = Math.max(0.05, Math.exp(-daysOld * 0.3));
        const engagementScore = (post.comments_count * 3.0) + (post.likes_count * 1.0);
        const trendingScore = engagementScore * ageWeight * 100;
        const totalEngagement = post.likes_count + post.comments_count;
        const expectedEngagement = Math.max(0.1, daysOld * 0.8);
        const growthRate = Math.round(((totalEngagement - expectedEngagement) / expectedEngagement) * 100);

        return {
          ...post,
          trendingScore,
          hoursOld: Math.floor(hoursOld),
          engagement: totalEngagement,
          growthRate: Math.max(0, Math.min(999, growthRate))
        };
      }) || [];

      const topTrending = postsWithTrendingScore
        .filter(post => post.engagement > 0)
        .sort((a, b) => b.trendingScore - a.trendingScore)
        .slice(0, 6);

      setTrendingPosts(topTrending);
    } catch (error) {
      console.error('Error fetching trending posts:', error);
      setTrendingPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const truncateContent = (content, maxLength = 50) => {
    if (!content) return '';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    const cleanText = plainText.replace(/\s+/g, ' ').trim();
    
    if (cleanText.length > maxLength) {
      const truncated = cleanText.substring(0, maxLength);
      const lastSpaceIndex = truncated.lastIndexOf(' ');
      if (lastSpaceIndex > 0 && lastSpaceIndex > maxLength * 0.7) {
        return truncated.substring(0, lastSpaceIndex) + '...';
      }
      return truncated + '...';
    }
    return cleanText;
  };

  const getTimeAgo = (hoursOld) => {
    if (hoursOld < 1) return 'Just now';
    if (hoursOld < 24) return `${Math.floor(hoursOld)}h ago`;
    const days = Math.floor(hoursOld / 24);
    if (days === 1) return '1d ago';
    return `${days}d ago`;
  };

  const handlePostClick = (postId, event) => {
    event.stopPropagation();
    const isPostVisible = posts.some(post => post.id === postId);
    if (isPostVisible) {
      onTrendingPostClick(postId);
    } else {
      console.log(`Trending post ${postId} not visible, requesting navigation`);
      onTrendingPostClick(postId);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
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
    <div className="space-y-2">
      {trendingPosts.map((post, index) => {
        const isPostVisible = posts.some(p => p.id === post.id);
        const isHot = post.growthRate > 100;
        
        return (
          <div 
            key={post.id} 
            className={`group cursor-pointer hover:bg-slate-50 rounded-lg p-3 transition-all duration-200 hover:shadow-sm border border-transparent hover:border-slate-200 ${
              !isPostVisible ? 'opacity-75' : ''
            }`}
            onClick={(e) => handlePostClick(post.id, e)}
          >
            <div className={`border-l-3 pl-3 ${
              index === 0 ? 'border-emerald-500' : 
              index === 1 ? 'border-blue-500' : 
              index === 2 ? 'border-purple-500' :
              index === 3 ? 'border-orange-500' :
              index === 4 ? 'border-pink-500' :
              'border-indigo-500'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-4 h-4 rounded-full bg-slate-300 flex-shrink-0">
                      {post.profiles?.avatar_url ? (
                        <img 
                          src={post.profiles.avatar_url} 
                          alt="Profile" 
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-700 truncate">
                        {post.profiles?.full_name || 'Anonymous'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {getTimeAgo(post.hoursOld)}
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-600 leading-relaxed mb-2 line-clamp-2">
                    {truncateContent(post.content, 65)}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 text-xs text-slate-500">
                      <div className="flex items-center space-x-1">
                        <Heart size={11} className="text-red-400" />
                        <span>{post.likes_count}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageCircle size={11} className="text-blue-400" />
                        <span>{post.comments_count}</span>
                      </div>
                    </div>
                    
                    <div className={`text-xs font-medium flex items-center space-x-1 px-2 py-1 rounded-full ${
                      isHot ? 'bg-orange-100 text-orange-700' : 
                      index === 0 ? 'bg-emerald-100 text-emerald-700' : 
                      index === 1 ? 'bg-blue-100 text-blue-700' : 
                      index === 2 ? 'bg-purple-100 text-purple-700' :
                      index === 3 ? 'bg-orange-100 text-orange-700' :
                      index === 4 ? 'bg-pink-100 text-pink-700' :
                      'bg-indigo-100 text-indigo-700'
                    }`}>
                      {isHot && (
                        <span className="text-orange-500 text-xs">🔥</span>
                      )}
                      <span>+{post.growthRate}%</span>
                    </div>
                  </div>
                  
                  {!isPostVisible && (
                    <p className="text-xs text-slate-400 mt-1 italic">
                      📍 Scroll to find this post
                    </p>
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
  onTrendingPostClick: PropTypes.func.isRequired,
  posts: PropTypes.array.isRequired
};

const Sidebar = ({ activeChannel, activeChannelConfig, onTrendingPostClick, posts }) => {
  return (
    <div className="lg:col-span-3 space-y-6">
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
          onTrendingPostClick={onTrendingPostClick}
          posts={posts}
        />
      </div>

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
  onTrendingPostClick: PropTypes.func.isRequired,
  posts: PropTypes.array.isRequired
};

export default Sidebar;