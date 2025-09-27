import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { useOutletContext, useLocation, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { ChevronLeft, ChevronRight, Clock, TrendingUp, ArrowRight, Users, MessageCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import CreatePost from './CreatePost.jsx';
import PostCard from './PostCard.jsx';
import { rssNewsService as newsService } from '../services/rssNewsService.js';
import { addOrganizationEventListener } from '../utils/organizationEvents';
import { getOrganizationInfoForCommunity } from '../utils/membershipQueries.js';
import { usePageDataLoader } from '../hooks/usePageDataLoader';
import { getDashboardData } from '../utils/rpcClientFunctions';

const ORGANIZATION_CHANNELS = {
  'nonprofit': { 
    name: 'Nonprofit Community', 
    icon: '🏛️', 
    bgGradient: 'from-rose-50 to-pink-50',
    borderColor: 'border-rose-200',
    buttonColor: 'bg-rose-600 hover:bg-rose-700',
    tagColor: 'bg-rose-50 text-rose-700 border-rose-200',
    channelTag: '#nonprofit-community',
    dbChannel: 'nonprofit-community',
    color: 'rose',
    gradient: 'from-rose-500 to-pink-600'
  },
  'foundation': { 
    name: 'Foundation Community', 
    icon: '💰',
    bgGradient: 'from-purple-50 to-indigo-50',
    borderColor: 'border-purple-200',
    buttonColor: 'bg-purple-600 hover:bg-purple-700',
    tagColor: 'bg-purple-50 text-purple-700 border-purple-200',
    channelTag: '#foundation-community',
    dbChannel: 'foundation-community',
    color: 'purple',
    gradient: 'from-purple-500 to-indigo-600'
  },
  'education': { 
    name: 'Education Community', 
    icon: '🎓',
    bgGradient: 'from-blue-50 to-indigo-50',
    borderColor: 'border-blue-200',
    buttonColor: 'bg-blue-600 hover:bg-blue-700',
    tagColor: 'bg-blue-50 text-blue-700 border-blue-200',
    channelTag: '#education-community',
    dbChannel: 'education-community',
    color: 'blue',
    gradient: 'from-blue-500 to-indigo-600'
  },
  'healthcare': { 
    name: 'Healthcare Community', 
    icon: '🏥',
    bgGradient: 'from-emerald-50 to-green-50',
    borderColor: 'border-emerald-200',
    buttonColor: 'bg-emerald-600 hover:bg-emerald-700',
    tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    channelTag: '#healthcare-community',
    dbChannel: 'healthcare-community',
    color: 'emerald',
    gradient: 'from-emerald-500 to-green-600'
  },
  'government': { 
    name: 'Government Community', 
    icon: '🏛️',
    bgGradient: 'from-gray-50 to-slate-50',
    borderColor: 'border-gray-200',
    buttonColor: 'bg-gray-600 hover:bg-gray-700',
    tagColor: 'bg-gray-50 text-gray-700 border-gray-200',
    channelTag: '#government-community',
    dbChannel: 'government-community',
    color: 'gray',
    gradient: 'from-gray-500 to-slate-600'
  }
};

const NewsCard = memo(({ title, timeAgo, image, url, category }) => {
  const handleClick = () => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };
  return (
    <div onClick={handleClick} className="relative w-80 h-80 bg-white rounded-xl overflow-hidden shadow-lg group cursor-pointer">
      {image ? (
        <img src={image} alt="" className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
      ) : (
        <div className="w-full h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
          <TrendingUp className="w-12 h-12 text-white opacity-80" />
        </div>
      )}
      <div className="absolute top-3 right-3">
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-white/90 text-slate-700">
          {category}
        </span>
      </div>
      <div className="p-6">
        <h3 className="font-semibold text-slate-900 text-lg line-clamp-2 group-hover:text-blue-600 transition-colors mb-3">
          {title}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-slate-500 text-sm flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            {timeAgo}
          </span>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </div>
  );
});

NewsCard.displayName = 'NewsCard';

export default function HelloCommunity() {
  const { profile } = useOutletContext();
  const location = useLocation();
  const navigate = useNavigate();
  
  const { pageData, loadPostsPageData, clearPageData } = usePageDataLoader();
  
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [organizationInfo, setOrganizationInfo] = useState(null);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const [news, setNews] = useState([]);
  const [isLoadingNews, setIsLoadingNews] = useState(true);
  const [postsLikesData, setPostsLikesData] = useState({});
  const isMountedRef = useRef(true);

  const currentChannel = location.pathname.includes('/hello-community') ? 'community' : 'hello-world';

  const getOrgType = (orgType) => {
    if (!orgType) return null;
    const baseType = orgType.split('.')[0];
    return ORGANIZATION_CHANNELS[baseType] ? baseType : null;
  };

  const organizationType = getOrgType(organizationInfo?.type);
  const channelConfig = organizationType ? ORGANIZATION_CHANNELS[organizationType] : null;

  const batchLoadPostLikes = useCallback(async (postIds, userId) => {
    if (!postIds.length || !userId) return {};
    try {
      const dashboardData = await getDashboardData(userId);
      const likesLookup = {};
      postIds.forEach(postId => {
        likesLookup[postId] = { userReaction: null };
      });
      if (dashboardData?.post_likes) {
        dashboardData.post_likes.forEach(like => {
          if (postIds.includes(like.post_id) && like.user_id === userId) {
            likesLookup[like.post_id].userReaction = like.reaction_type;
          }
        });
      }
      return likesLookup;
    } catch (error) {
      console.error('Error in batchLoadPostLikes:', error);
      return {};
    }
  }, []);

  const handlePostLike = useCallback(async (postId, currentReaction, newReaction) => {
    if (!profile?.id) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      if (currentReaction && currentReaction === newReaction) {
        await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
      } else {
        await supabase.from('post_likes').upsert({
          post_id: postId,
          user_id: user.id,
          reaction_type: newReaction
        }, { onConflict: 'post_id,user_id' });
      }
      setPostsLikesData(prev => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          userReaction: newReaction === currentReaction ? null : newReaction
        }
      }));
    } catch (error) {
      console.error('Error handling post reaction:', error);
    }
  }, [profile?.id]);

  useEffect(() => {
    const fetchOrganizationInfo = async () => {
      if (!profile?.id) return;
      try {
        const info = await getOrganizationInfoForCommunity(profile.id);
        if (isMountedRef.current) {
          setOrganizationInfo(info);
        }
      } catch (error) {
        console.error('Error fetching organization info:', error);
      }
    };
    fetchOrganizationInfo();
  }, [profile?.id]);

  const fetchPosts = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const dashboardData = await getDashboardData(profile.id);
      let postsData = [];
      if (currentChannel === 'community' && channelConfig) {
        postsData = dashboardData?.posts?.filter(post => post.channel === channelConfig.dbChannel) || [];
      } else {
        postsData = dashboardData?.posts?.filter(post => post.channel === 'hello-world') || [];
      }
      if (isMountedRef.current) {
        setPosts(postsData);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [profile?.id, currentChannel, channelConfig]);

  const loadAllPostData = useCallback(async () => {
    if (posts.length === 0 || !profile?.id) return;
    const postIds = posts.map(p => p.id);
    const [generalPageData, userLikesData] = await Promise.all([
      loadPostsPageData(posts),
      batchLoadPostLikes(postIds, profile.id)
    ]);
    setPostsLikesData(userLikesData);
  }, [posts, profile?.id, loadPostsPageData, batchLoadPostLikes]);

  useEffect(() => {
    loadAllPostData();
  }, [loadAllPostData]);

  useEffect(() => {
    return () => {
      clearPageData();
      setPostsLikesData({});
    };
  }, [clearPageData, currentChannel]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    const loadNews = async () => {
      setIsLoadingNews(true);
      try {
        const newsData = await newsService.getLatestNews();
        if (isMountedRef.current) {
          setNews(newsData.slice(0, 10));
        }
      } catch (error) {
        console.error('Error loading news:', error);
      } finally {
        if (isMountedRef.current) {
          setIsLoadingNews(false);
        }
      }
    };
    loadNews();
  }, []);

  const nextNews = useCallback(() => {
    if (news.length > 0) {
      setCurrentNewsIndex((prev) => (prev + 1) % Math.max(1, news.length - 2));
    }
  }, [news.length]);

  const prevNews = useCallback(() => {
    if (news.length > 0) {
      setCurrentNewsIndex((prev) => (prev - 1 + Math.max(1, news.length - 2)) % Math.max(1, news.length - 2));
    }
  }, [news.length]);

  useEffect(() => {
    if (news.length <= 3) return;
    const interval = setInterval(nextNews, 8000);
    return () => clearInterval(interval);
  }, [nextNews, news.length]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleNewPost = useCallback(async (newPost) => {
    if (newPost && isMountedRef.current) {
      setPosts(prevPosts => [newPost, ...prevPosts]);
      setTimeout(() => {
        if (isMountedRef.current) {
          loadAllPostData();
        }
      }, 100);
    }
  }, [loadAllPostData]);

  const handleDeletePost = useCallback(async (deletedPostId) => {
    if (isMountedRef.current) {
      setPosts(prevPosts => prevPosts.filter(post => post.id !== deletedPostId));
      clearPageData();
      setPostsLikesData(prev => {
        const updated = { ...prev };
        delete updated[deletedPostId];
        return updated;
      });
    }
  }, [clearPageData]);

  const getChannelInfo = () => {
    if (currentChannel === 'community' && channelConfig) {
      return {
        title: channelConfig.name,
        description: `Connect and collaborate with other ${channelConfig.name.toLowerCase()}`,
        gradient: channelConfig.gradient,
        color: channelConfig.color,
        icon: channelConfig.icon,
        tag: channelConfig.channelTag
      };
    }
    return {
      title: 'Hello Platform-Wide',
      description: 'Connect and collaborate with the entire Fundspace community',
      gradient: 'from-blue-500 to-indigo-600',
      color: 'blue',
      icon: '🌍',
      tag: '#hello-world'
    };
  };

  const channelInfo = getChannelInfo();

  if (loading && posts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-slate-600">Loading community...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className={`bg-gradient-to-r ${channelInfo.gradient} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center text-white">
            <div className="text-6xl mb-4">{channelInfo.icon}</div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{channelInfo.title}</h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">{channelInfo.description}</p>
            <div className="mt-6">
              <span className="inline-block px-4 py-2 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm">
                {channelInfo.tag}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <CreatePost 
                profile={profile}
                onNewPost={handleNewPost}
                channel={currentChannel === 'community' && channelConfig ? channelConfig.dbChannel : 'hello-world'}
                organizationType={organizationInfo?.type}
                placeholder={`What would you like to share with the ${currentChannel === 'community' && channelConfig ? channelConfig.name.toLowerCase() : 'community'}?`}
              />
            </div>
            <div className="space-y-6">
              {posts.length > 0 ? (
                posts.map(post => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    pageData={pageData} 
                    postsLikesData={postsLikesData}
                    onPostLike={handlePostLike}
                    userReaction={postsLikesData[post.id]?.userReaction}
                    onDelete={handleDeletePost}
                    disabled={loading}
                    batchedProfiles={pageData?.profiles}
                    batchedOrganizations={pageData?.organizations}
                  />
                ))
              ) : (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
                  <div className="text-6xl mb-4">{channelInfo.icon}</div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    No posts yet in {channelInfo.title}
                  </h3>
                  <p className="text-slate-600 mb-6">
                    Be the first to share something with the community!
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-600" />
                Community Activity
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 text-sm">Posts Today</span>
                  <span className="font-medium text-slate-900">
                    {posts.filter(post => {
                      const today = new Date();
                      const postDate = new Date(post.created_at);
                      return postDate.toDateString() === today.toDateString();
                    }).length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 text-sm">Total Posts</span>
                  <span className="font-medium text-slate-900">{posts.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 text-sm">Active Members</span>
                  <span className="font-medium text-slate-900">
                    {new Set(posts.map(post => post.profiles?.id)).size}
                  </span>
                </div>
              </div>
            </div>
            {!isLoadingNews && news.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-orange-600" />
                  Trending News
                </h3>
                {news.length > 3 ? (
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <button 
                        onClick={prevNews}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                        disabled={news.length <= 3}
                      >
                        <ChevronLeft className="w-4 h-4 text-slate-600" />
                      </button>
                      <span className="text-xs text-slate-500">
                        {currentNewsIndex + 1} - {Math.min(currentNewsIndex + 3, news.length)} of {news.length}
                      </span>
                      <button 
                        onClick={nextNews}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                        disabled={news.length <= 3}
                      >
                        <ChevronRight className="w-4 h-4 text-slate-600" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      {news.slice(currentNewsIndex, currentNewsIndex + 3).map((article, index) => (
                        <div 
                          key={index}
                          onClick={() => article.url && window.open(article.url, '_blank', 'noopener,noreferrer')}
                          className="cursor-pointer hover:bg-slate-50 p-3 rounded-lg transition-colors border border-slate-100"
                        >
                          <h4 className="text-sm font-medium text-slate-900 line-clamp-2 mb-1">
                            {article.title}
                          </h4>
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>{article.category}</span>
                            <span>{article.timeAgo}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {news.slice(0, 3).map((article, index) => (
                      <div 
                        key={index}
                        onClick={() => article.url && window.open(article.url, '_blank', 'noopener,noreferrer')}
                        className="cursor-pointer hover:bg-slate-50 p-3 rounded-lg transition-colors border border-slate-100"
                      >
                        <h4 className="text-sm font-medium text-slate-900 line-clamp-2 mb-1">
                          {article.title}
                        </h4>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>{article.category}</span>
                          <span>{article.timeAgo}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className={`bg-gradient-to-br ${channelConfig?.bgGradient || 'from-blue-50 to-indigo-50'} rounded-xl border ${channelConfig?.borderColor || 'border-blue-200'} p-6`}>
              <h3 className="font-semibold text-slate-900 mb-3">About {channelInfo.title}</h3>
              <p className="text-slate-700 text-sm leading-relaxed mb-4">{channelInfo.description}</p>
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 ${channelConfig?.tagColor || 'bg-blue-50 text-blue-700 border-blue-200'} text-xs font-medium rounded-full border`}>
                  {channelInfo.tag}
                </span>
                <MessageCircle className={`w-4 h-4 text-${channelConfig?.color || 'blue'}-600`} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}