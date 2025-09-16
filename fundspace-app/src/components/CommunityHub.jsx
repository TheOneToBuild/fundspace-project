// src/components/CommunityHub.jsx
import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Globe, Building, MapPin, ChevronLeft, ChevronRight, Users, MessageCircle, Sparkles, TrendingUp, ArrowRight } from 'lucide-react';
import { supabase } from '../supabaseClient';
import CreatePost from './CreatePost.jsx';
import PostCard from './PostCard.jsx';
import { rssNewsService as newsService } from '../services/rssNewsService.js';
import { addOrganizationEventListener } from '../utils/organizationEvents';
import { getOrganizationInfoForCommunity } from '../utils/membershipQueries.js';
import PropTypes from 'prop-types';

// Bay Area counties - this will eventually come from user profile
const BAY_AREA_COUNTIES = {
  'alameda': { name: 'Alameda County', icon: '🌉', color: 'blue', gradient: 'from-blue-500 to-cyan-600' },
  'contra-costa': { name: 'Contra Costa County', icon: '🏔️', color: 'green', gradient: 'from-green-500 to-emerald-600' },
  'marin': { name: 'Marin County', icon: '🌲', color: 'emerald', gradient: 'from-emerald-500 to-teal-600' },
  'napa': { name: 'Napa County', icon: '🍇', color: 'purple', gradient: 'from-purple-500 to-violet-600' },
  'san-francisco': { name: 'San Francisco County', icon: '🌁', color: 'indigo', gradient: 'from-indigo-500 to-purple-600' },
  'san-mateo': { name: 'San Mateo County', icon: '🏖️', color: 'cyan', gradient: 'from-cyan-500 to-blue-600' },
  'santa-clara': { name: 'Santa Clara County', icon: '💻', color: 'rose', gradient: 'from-rose-500 to-pink-600' },
  'solano': { name: 'Solano County', icon: '🌾', color: 'amber', gradient: 'from-amber-500 to-orange-600' },
  'sonoma': { name: 'Sonoma County', icon: '🍷', color: 'red', gradient: 'from-red-500 to-rose-600' }
};

// Organization types from your existing structure
const ORGANIZATION_CHANNELS = {
  'nonprofit': { 
    name: 'Nonprofit Community', 
    icon: '🏛️', 
    color: 'rose',
    gradient: 'from-rose-500 to-pink-600',
    channelTag: '#nonprofit-community',
    dbChannel: 'nonprofit-community'
  },
  'foundation': { 
    name: 'Foundation Community', 
    icon: '💰',
    color: 'purple',
    gradient: 'from-purple-500 to-violet-600',
    channelTag: '#foundation-community',
    dbChannel: 'foundation-community'
  },
  'education': { 
    name: 'Education Community', 
    icon: '🎓',
    color: 'blue',
    gradient: 'from-blue-500 to-indigo-600',
    channelTag: '#education-community',
    dbChannel: 'education-community'
  },
  'healthcare': { 
    name: 'Healthcare Community', 
    icon: '🏥',
    color: 'emerald',
    gradient: 'from-emerald-500 to-teal-600',
    channelTag: '#healthcare-community',
    dbChannel: 'healthcare-community'
  },
  'government': { 
    name: 'Government Community', 
    icon: '🏛️',
    color: 'slate',
    gradient: 'from-slate-500 to-gray-600',
    channelTag: '#government-community',
    dbChannel: 'government-community'
  },
  'religious': { 
    name: 'Religious Community', 
    icon: '⛪',
    color: 'amber',
    gradient: 'from-amber-500 to-yellow-600',
    channelTag: '#religious-community',
    dbChannel: 'religious-community'
  },
  'forprofit': { 
    name: 'Social Enterprise Community', 
    icon: '🏢',
    color: 'green',
    gradient: 'from-green-500 to-emerald-600',
    channelTag: '#social-enterprise-community',
    dbChannel: 'forprofit-community'
  }
};

// Helper functions
const getOrgBaseType = (organizationType) => {
  if (!organizationType) return null;
  return organizationType.split('.')[0].toLowerCase();
};

// Enhanced news card component - exact same as profile page
const NewsCard = memo(({ title, category, timeAgo, image, url }) => {
  const handleClick = () => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      onClick={handleClick}
      className="w-64 h-64 bg-white rounded-xl overflow-hidden shadow-lg group cursor-pointer relative"
    >
      {image ? (
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
          <Globe size={32} className="text-slate-400" />
        </div>
      )}
      
      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
      
      {/* Source Tag - Top Left */}
      <div className="absolute top-3 left-3">
        <div className="flex items-center space-x-2">
          <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-full border border-white/30">
            {category || 'News'}
          </span>
          <div className="flex items-center text-white/80 text-xs">
            <span className="w-1 h-1 bg-white/60 rounded-full mr-1"></span>
            <span>{timeAgo}</span>
          </div>
        </div>
      </div>
      
      {/* Title Overlay - Bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="font-bold text-white text-lg leading-tight line-clamp-3 group-hover:text-blue-200 transition-colors">
          {title}
        </h3>
      </div>
      
      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/10 transition-colors duration-200"></div>
    </div>
  );
});

NewsCard.displayName = 'NewsCard';
NewsCard.propTypes = { 
  title: PropTypes.string.isRequired, 
  category: PropTypes.string.isRequired,
  timeAgo: PropTypes.string.isRequired, 
  image: PropTypes.string, 
  url: PropTypes.string
};

// Enhanced trending news section - exact match to profile page
const TrendingNews = ({ channelType }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        let newsData;
        if (channelType === 'hello-world') {
          newsData = await newsService.getGlobalBreakingNews();
        } else if (channelType === 'hello-community') {
          newsData = await newsService.getNonprofitNews();
        } else {
          newsData = await newsService.getGlobalBreakingNews();
        }
        setNews(Array.isArray(newsData) ? newsData.slice(0, 9) : []);
      } catch (error) {
        console.error('Error fetching news:', error);
        setNews([]);
      } finally {
        setLoading(false);
      }
    };
    
    if (channelType) {
      fetchNews();
    }
  }, [channelType]);

  const scrollNews = (direction) => {
    const container = document.getElementById('community-hub-news-scroll');
    if (container) {
      const scrollAmount = 280; // Width of card (256px) + gap (24px)
      container.scrollBy({ 
        left: direction === 'left' ? -scrollAmount : scrollAmount, 
        behavior: 'smooth' 
      });
    }
  };

  if (loading || !news.length) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-800">Trending World News</h2>
        <div className="flex space-x-2">
          <button onClick={() => scrollNews('left')} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => scrollNews('right')} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div 
        id="community-hub-news-scroll" 
        className="flex space-x-6 overflow-x-auto scrollbar-hide pb-4 w-full"
        style={{ scrollBehavior: 'smooth' }}
      >
        {news.map(item => (
          <div key={item.id} className="flex-shrink-0">
            <NewsCard 
              title={item.title}
              category={item.category}
              timeAgo={item.timeAgo}
              image={item.image}
              url={item.url}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

TrendingNews.propTypes = { channelType: PropTypes.string };

// Enhanced empty state component
const EmptyState = ({ channelName, channelConfig }) => (
  <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-12 text-center relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-white to-blue-50/30"></div>
    <div className="relative">
      <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
        <MessageCircle size={32} className="text-white" />
      </div>
      <h3 className="text-2xl font-bold text-slate-900 mb-3">Start the Conversation</h3>
      <p className="text-slate-600 mb-8 max-w-md mx-auto leading-relaxed">
        Be the first to share something amazing in <span className="font-semibold text-slate-800">{channelName}</span>!
      </p>
      <div className={`inline-flex items-center px-6 py-3 bg-gradient-to-r ${channelConfig?.gradient || 'from-blue-500 to-purple-600'} text-white rounded-xl font-semibold shadow-lg`}>
        <span className="w-2 h-2 bg-white/60 rounded-full mr-3 animate-pulse"></span>
        Share your first post above
      </div>
    </div>
  </div>
);

EmptyState.propTypes = { 
  channelName: PropTypes.string.isRequired,
  channelConfig: PropTypes.object 
};

const POSTS_PER_PAGE = 10;

export default function CommunityHub() {
  const { profile } = useOutletContext();
  const [activeChannel, setActiveChannel] = useState('hello-world');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [organizationInfo, setOrganizationInfo] = useState(null);

  // Mock county for now - will come from profile later
  const userCounty = 'santa-clara';

  // Set up organization listener
  useEffect(() => {
    if (!profile?.id) return;
    
    const cleanup = addOrganizationEventListener('organizationChanged', (event) => {
      const { profileId, organization } = event.detail;
      if (profileId === profile.id) {
        setOrganizationInfo(organization ? {
          id: organization.id,
          name: organization.name,
          type: organization.type,
          tagline: organization.tagline,
          image_url: organization.image_url,
          role: 'member'
        } : null);
      }
    });

    return cleanup;
  }, [profile?.id]);

  // Fetch organization info
  useEffect(() => {
    const fetchOrganizationInfo = async () => {
      if (!profile?.id) return;
      
      try {
        const orgData = await getOrganizationInfoForCommunity(profile.id);
        setOrganizationInfo(orgData);
      } catch (err) {
        console.error('Error fetching organization info:', err);
        setOrganizationInfo(null);
      }
    };
    
    fetchOrganizationInfo();
  }, [profile?.id]);

  // Get channel configuration
  const getChannelConfig = () => {
    const userOrgType = organizationInfo ? getOrgBaseType(organizationInfo.type) : null;
    
    const channels = [
      {
        id: 'hello-world',
        name: 'Hello World',
        shortName: 'World',
        description: 'Platform-wide community - connect with everyone',
        icon: Globe,
        color: 'blue',
        gradient: 'from-blue-500 to-indigo-600',
        tag: '#hello-world',
        dbChannel: 'hello-world'
      },
      {
        id: 'hello-community',
        name: userOrgType && ORGANIZATION_CHANNELS[userOrgType] 
          ? `Hello ${ORGANIZATION_CHANNELS[userOrgType].name}` 
          : 'Hello Community',
        shortName: userOrgType && ORGANIZATION_CHANNELS[userOrgType]
          ? ORGANIZATION_CHANNELS[userOrgType].name.split(' ')[0]
          : 'Community',
        description: userOrgType && ORGANIZATION_CHANNELS[userOrgType]
          ? `Connect with other ${ORGANIZATION_CHANNELS[userOrgType].name.toLowerCase()}`
          : 'Connect with your organization community',
        icon: Building,
        color: userOrgType && ORGANIZATION_CHANNELS[userOrgType] 
          ? ORGANIZATION_CHANNELS[userOrgType].color 
          : 'rose',
        gradient: userOrgType && ORGANIZATION_CHANNELS[userOrgType]
          ? ORGANIZATION_CHANNELS[userOrgType].gradient
          : 'from-rose-500 to-pink-600',
        tag: userOrgType && ORGANIZATION_CHANNELS[userOrgType]
          ? ORGANIZATION_CHANNELS[userOrgType].channelTag
          : '#community',
        dbChannel: userOrgType && ORGANIZATION_CHANNELS[userOrgType]
          ? ORGANIZATION_CHANNELS[userOrgType].dbChannel
          : 'hello-community',
        disabled: !organizationInfo
      },
      {
        id: 'hello-county',
        name: `Hello ${BAY_AREA_COUNTIES[userCounty]?.name || 'County'}`,
        shortName: BAY_AREA_COUNTIES[userCounty]?.name || 'County',
        description: `Local community in ${BAY_AREA_COUNTIES[userCounty]?.name || 'your area'}`,
        icon: MapPin,
        color: BAY_AREA_COUNTIES[userCounty]?.color || 'green',
        gradient: BAY_AREA_COUNTIES[userCounty]?.gradient || 'from-green-500 to-emerald-600',
        tag: `#${userCounty}-county`,
        dbChannel: `hello-county-${userCounty}`,
        disabled: true // Enable when county is added to profiles
      }
    ];

    return channels;
  };

  const channels = getChannelConfig();
  const activeChannelConfig = channels.find(c => c.id === activeChannel);

  // Reset posts when channel changes
  useEffect(() => {
    setPosts([]);
    setPage(0);
    setHasMore(true);
    setLoading(true);
    fetchPosts(0, activeChannelConfig);
  }, [activeChannel, activeChannelConfig?.dbChannel]);

  // Fetch posts function
  const fetchPosts = async (pageNum, channelConfig) => {
    if (!channelConfig || channelConfig.disabled) {
      setLoading(false);
      return;
    }

    try {
      let postsData;
      
      if (channelConfig.id === 'hello-world') {
        // Use existing hello-world logic
        const { data, error } = await supabase
          .from('posts')
          .select(`*, profiles:profile_id(id, full_name, avatar_url, title, organization_name, role, organization_type)`)
          .eq('channel', 'hello-world')
          .order('created_at', { ascending: false })
          .range(pageNum * POSTS_PER_PAGE, (pageNum + 1) * POSTS_PER_PAGE - 1);
        
        if (error) throw error;
        postsData = data;
      } else if (channelConfig.id === 'hello-community') {
        // Use existing community logic
        const userOrgType = getOrgBaseType(organizationInfo?.type);
        if (!userOrgType) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('posts')
          .select(`*, profiles:profile_id(id, full_name, avatar_url, title, organization_name, role, organization_type)`)
          .eq('channel', channelConfig.dbChannel)
          .order('created_at', { ascending: false })
          .range(pageNum * POSTS_PER_PAGE, (pageNum + 1) * POSTS_PER_PAGE - 1);
        
        if (error) throw error;
        postsData = data;
      } else {
        // County posts - for now return empty (to be implemented)
        postsData = [];
      }

      if (postsData && postsData.length > 0) {
        // Add reaction data
        const postIds = postsData.map(post => post.id);
        const { data: allReactions } = await supabase
          .from('post_likes')
          .select('post_id, reaction_type')
          .in('post_id', postIds);

        const enrichedPosts = postsData.map(post => {
          const reactionsForPost = allReactions?.filter(r => r.post_id === post.id) || [];
          const reactionSummary = reactionsForPost.reduce((acc, r) => {
            const type = r.reaction_type || 'like';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          }, {});
          return {
            ...post,
            reactions: {
              summary: Object.entries(reactionSummary).map(([type, count]) => ({ type, count })),
              sample: []
            }
          };
        });

        setPosts(prev => pageNum === 0 ? enrichedPosts : [...prev, ...enrichedPosts]);
        if (enrichedPosts.length < POSTS_PER_PAGE) setHasMore(false);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle new post
  const handleNewPost = useCallback((newPostData) => {
    const postWithOrgInfo = {
      ...newPostData,
      profiles: {
        ...profile,
        organization_name: organizationInfo?.name || profile?.organization_name,
        organization_type: organizationInfo?.type || profile?.organization_type,
      },
      reactions: { summary: [], sample: [] },
      likes_count: 0,
      comments_count: 0
    };
    setPosts(prev => [postWithOrgInfo, ...prev]);
  }, [profile, organizationInfo]);

  // Handle delete post
  const handleDeletePost = useCallback((deletedPostId) => {
    setPosts(prev => prev.filter(p => p.id !== deletedPostId));
  }, []);

  // Channel change handler
  const handleChannelChange = (channelId) => {
    const channel = channels.find(c => c.id === channelId);
    if (channel && !channel.disabled) {
      setActiveChannel(channelId);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* News Section */}
        <TrendingNews channelType={activeChannel} />

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Community Selector (3 columns wide) */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-4 sticky top-24">
              <h3 className="font-bold text-base text-slate-900 mb-4">Communities</h3>
              <div className="space-y-2">
                {channels.map((channel) => {
                  const IconComponent = channel.icon;
                  const isActive = activeChannel === channel.id;
                  const isDisabled = channel.disabled;
                  
                  return (
                    <button
                      key={channel.id}
                      onClick={() => handleChannelChange(channel.id)}
                      disabled={isDisabled}
                      className={`w-full p-3 rounded-lg transition-all duration-300 text-left group ${
                        isDisabled 
                          ? 'opacity-40 cursor-not-allowed bg-slate-50' 
                          : isActive 
                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-sm' 
                            : 'bg-slate-50 hover:bg-slate-100 border-2 border-transparent hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                          isActive 
                            ? `bg-gradient-to-r ${channel.gradient}` 
                            : 'bg-white shadow-sm'
                        }`}>
                          <IconComponent 
                            size={16} 
                            className={isActive ? 'text-white' : 'text-slate-600'} 
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-medium text-sm truncate ${
                            isDisabled 
                              ? 'text-slate-400'
                              : isActive 
                                ? 'text-slate-900' 
                                : 'text-slate-700'
                          }`}>
                            {channel.shortName}
                          </h4>
                          <p className={`text-xs mt-0.5 ${
                            isDisabled 
                              ? 'text-slate-400'
                              : isActive 
                                ? 'text-slate-600' 
                                : 'text-slate-500'
                          }`}>
                            {channel.memberCount} members
                          </p>
                        </div>
                        {isDisabled && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                            {channel.id === 'hello-community' ? 'Join' : 'Soon'}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Middle Column - Posts Feed (6 columns wide) */}
          <div className="lg:col-span-6 space-y-6">
            {activeChannelConfig && !activeChannelConfig.disabled ? (
              <>
                {/* Create Post */}
                <CreatePost 
                  profile={profile}
                  onNewPost={handleNewPost}
                  channel={activeChannelConfig.dbChannel}
                  organizationType={organizationInfo?.type}
                />

                {/* Posts Feed */}
                <div className="space-y-6">
                  {loading && posts.length === 0 ? (
                    <div className="space-y-6">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 animate-pulse">
                          <div className="flex items-center space-x-4 mb-6">
                            <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                            <div className="flex-1">
                              <div className="h-4 bg-slate-200 rounded mb-2 w-1/3"></div>
                              <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="h-4 bg-slate-200 rounded"></div>
                            <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : posts.length > 0 ? (
                    posts.map(post => (
                      <PostCard key={post.id} post={post} onDelete={handleDeletePost} />
                    ))
                  ) : (
                    <EmptyState 
                      channelName={activeChannelConfig.name}
                      channelConfig={activeChannelConfig}
                    />
                  )}
                </div>

                {/* Load more */}
                {hasMore && posts.length > 0 && (
                  <div className="text-center">
                    <button 
                      onClick={() => {
                        setPage(prev => prev + 1);
                        fetchPosts(page + 1, activeChannelConfig);
                      }}
                      disabled={loading}
                      className="px-8 py-4 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-slate-300 rounded-2xl font-semibold text-slate-700 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="flex items-center space-x-3">
                          <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
                          <span>Loading amazing content...</span>
                        </div>
                      ) : (
                        'Load More Posts'
                      )}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/60 p-12 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-white to-red-50/30"></div>
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-r from-red-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-3xl">🔒</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Channel Not Available</h3>
                  <p className="text-slate-600 mb-8 max-w-md mx-auto leading-relaxed">
                    {activeChannelConfig?.id === 'hello-community' 
                      ? 'Join an organization to unlock community-specific channels and connect with your peers.'
                      : 'This exciting channel is coming soon! We\'re working hard to bring you amazing local community features.'}
                  </p>
                  {activeChannelConfig?.id === 'hello-community' && (
                    <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
                      Join an Organization
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Trending/Sidebar (3 columns wide) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Trending Posts Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                  <TrendingUp size={20} className="text-white" />
                </div>
                <h3 className="font-bold text-lg text-slate-900">Trending Posts</h3>
              </div>
              <div className="space-y-4">
                <div className="border-l-4 border-green-500 pl-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-slate-900 mb-1">Community Fundraising Events</h4>
                      <p className="text-xs text-slate-600 mb-2">Members are sharing upcoming charity drives and volunteer opportunities</p>
                      <div className="flex items-center space-x-2 text-xs text-slate-500">
                        <span>127 posts</span>
                        <span>•</span>
                        <span>2 hours ago</span>
                      </div>
                    </div>
                    <div className="text-green-600 text-sm font-semibold">+32%</div>
                  </div>
                </div>
                
                <div className="border-l-4 border-blue-500 pl-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-slate-900 mb-1">Grant Application Tips</h4>
                      <p className="text-xs text-slate-600 mb-2">Organizations sharing successful grant writing strategies</p>
                      <div className="flex items-center space-x-2 text-xs text-slate-500">
                        <span>89 posts</span>
                        <span>•</span>
                        <span>4 hours ago</span>
                      </div>
                    </div>
                    <div className="text-blue-600 text-sm font-semibold">+18%</div>
                  </div>
                </div>
                
                <div className="border-l-4 border-purple-500 pl-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-slate-900 mb-1">Collaboration Opportunities</h4>
                      <p className="text-xs text-slate-600 mb-2">Cross-sector partnerships and joint initiatives trending</p>
                      <div className="flex items-center space-x-2 text-xs text-slate-500">
                        <span>63 posts</span>
                        <span>•</span>
                        <span>6 hours ago</span>
                      </div>
                    </div>
                    <div className="text-purple-600 text-sm font-semibold">+24%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Community Guidelines */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-pink-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg">📋</span>
                </div>
                <h3 className="font-bold text-lg text-slate-900">Community Guidelines</h3>
              </div>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-start space-x-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Be respectful and professional</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Share relevant content and insights</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Support fellow community members</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Keep discussions constructive</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}