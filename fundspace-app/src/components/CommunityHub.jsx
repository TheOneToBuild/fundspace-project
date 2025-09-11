// src/components/CommunityHub.jsx
import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Globe, Building, MapPin, ChevronLeft, ChevronRight, Users, MessageCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import CreatePost from './CreatePost.jsx';
import PostCard from './PostCard.jsx';
import { rssNewsService as newsService } from '../services/rssNewsService.js';
import { addOrganizationEventListener } from '../utils/organizationEvents';
import { getOrganizationInfoForCommunity } from '../utils/membershipQueries.js';
import PropTypes from 'prop-types';

// Bay Area counties - this will eventually come from user profile
const BAY_AREA_COUNTIES = {
  'alameda': { name: 'Alameda County', icon: '🌉', color: 'blue' },
  'contra-costa': { name: 'Contra Costa County', icon: '🏔️', color: 'green' },
  'marin': { name: 'Marin County', icon: '🌲', color: 'emerald' },
  'napa': { name: 'Napa County', icon: '🍇', color: 'purple' },
  'san-francisco': { name: 'San Francisco County', icon: '🌁', color: 'indigo' },
  'san-mateo': { name: 'San Mateo County', icon: '🏖️', color: 'cyan' },
  'santa-clara': { name: 'Santa Clara County', icon: '💻', color: 'rose' },
  'solano': { name: 'Solano County', icon: '🌾', color: 'amber' },
  'sonoma': { name: 'Sonoma County', icon: '🍷', color: 'red' }
};

// Organization types from your existing structure
const ORGANIZATION_CHANNELS = {
  'nonprofit': { 
    name: 'Nonprofit Community', 
    icon: '🏛️', 
    color: 'rose',
    channelTag: '#nonprofit-community',
    dbChannel: 'nonprofit-community'
  },
  'foundation': { 
    name: 'Foundation Community', 
    icon: '💰',
    color: 'purple',
    channelTag: '#foundation-community',
    dbChannel: 'foundation-community'
  },
  'education': { 
    name: 'Education Community', 
    icon: '🎓',
    color: 'blue',
    channelTag: '#education-community',
    dbChannel: 'education-community'
  },
  'healthcare': { 
    name: 'Healthcare Community', 
    icon: '🏥',
    color: 'emerald',
    channelTag: '#healthcare-community',
    dbChannel: 'healthcare-community'
  },
  'government': { 
    name: 'Government Community', 
    icon: '🏛️',
    color: 'slate',
    channelTag: '#government-community',
    dbChannel: 'government-community'
  },
  'religious': { 
    name: 'Religious Community', 
    icon: '⛪',
    color: 'amber',
    channelTag: '#religious-community',
    dbChannel: 'religious-community'
  },
  'forprofit': { 
    name: 'Social Enterprise Community', 
    icon: '🏢',
    color: 'green',
    channelTag: '#social-enterprise-community',
    dbChannel: 'forprofit-community'
  }
};

// Helper functions
const getOrgBaseType = (organizationType) => {
  if (!organizationType) return null;
  return organizationType.split('.')[0].toLowerCase();
};

// News card component
const NewsCard = memo(({ title, category, timeAgo, image, url }) => {
  const handleClick = () => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      onClick={handleClick}
      className="w-80 h-80 bg-white rounded-xl overflow-hidden shadow-lg group cursor-pointer relative"
    >
      <img 
        src={image || '/api/placeholder/320/320'} 
        alt={title} 
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
      <div className="absolute top-3 left-3">
        <div className="flex items-center space-x-2">
          <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-full border border-white/30">
            {category}
          </span>
          <div className="flex items-center text-white/80 text-xs">
            <span className="w-1 h-1 bg-white/60 rounded-full mr-1"></span>
            <span>{timeAgo}</span>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="font-bold text-white text-lg leading-tight line-clamp-3 group-hover:text-blue-200 transition-colors">
          {title}
        </h3>
      </div>
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

// Trending news section
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
        setNews(Array.isArray(newsData) ? newsData.slice(0, 6) : []);
      } catch (error) {
        console.error('Error fetching news:', error);
        setNews([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [channelType]);

  const scrollNews = (direction) => {
    const container = document.getElementById('community-hub-news-scroll');
    if (container) {
      container.scrollBy({ left: direction === 'left' ? -320 : 320, behavior: 'smooth' });
    }
  };

  if (loading || !news.length) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-800">Trending News</h2>
        <div className="flex space-x-2">
          <button onClick={() => scrollNews('left')} className="p-2 bg-white border rounded-lg hover:bg-slate-50">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => scrollNews('right')} className="p-2 bg-white border rounded-lg hover:bg-slate-50">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div id="community-hub-news-scroll" className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4">
        {news.map(item => (
          <NewsCard 
            key={item.id} 
            title={item.title}
            category={item.category}
            timeAgo={item.timeAgo}
            image={item.image}
            url={item.url}
          />
        ))}
      </div>
    </div>
  );
};

TrendingNews.propTypes = { channelType: PropTypes.string };

// Empty state component
const EmptyState = ({ channelName, channelIcon }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
    <div className="text-6xl mb-4">💬</div>
    <h3 className="text-xl font-bold text-slate-800 mb-2">Start the Conversation</h3>
    <p className="text-slate-600 mb-4 max-w-md mx-auto">
      Be the first to share in {channelName}!
    </p>
    <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
      <span className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></span>
      Share your first post above!
    </div>
  </div>
);

EmptyState.propTypes = { 
  channelName: PropTypes.string.isRequired,
  channelIcon: PropTypes.string 
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
        description: 'Platform-wide community - connect with everyone',
        icon: Globe,
        color: 'blue',
        tag: '#hello-world',
        dbChannel: 'hello-world'
      },
      {
        id: 'hello-community',
        name: userOrgType && ORGANIZATION_CHANNELS[userOrgType] 
          ? `Hello ${ORGANIZATION_CHANNELS[userOrgType].name}` 
          : 'Hello Community',
        description: userOrgType && ORGANIZATION_CHANNELS[userOrgType]
          ? `Connect with other ${ORGANIZATION_CHANNELS[userOrgType].name.toLowerCase()}`
          : 'Connect with your organization community',
        icon: Building,
        color: userOrgType && ORGANIZATION_CHANNELS[userOrgType] 
          ? ORGANIZATION_CHANNELS[userOrgType].color 
          : 'rose',
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
        description: `Local community in ${BAY_AREA_COUNTIES[userCounty]?.name || 'your area'}`,
        icon: MapPin,
        color: BAY_AREA_COUNTIES[userCounty]?.color || 'green',
        tag: `#${userCounty}-county`,
        dbChannel: `hello-county-${userCounty}`,
        disabled: false // TODO: Will be enabled when county is added to profiles
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
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Community Hub</h1>
        <p className="text-slate-600">Connect, share, and discover across different communities</p>
      </div>

      {/* Channel Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1">
        <div className="grid grid-cols-3 gap-1">
          {channels.map((channel) => {
            const IconComponent = channel.icon;
            const isActive = activeChannel === channel.id;
            const isDisabled = channel.disabled;
            
            return (
              <button
                key={channel.id}
                onClick={() => handleChannelChange(channel.id)}
                disabled={isDisabled}
                className={`p-4 rounded-lg transition-all text-left ${
                  isDisabled 
                    ? 'opacity-50 cursor-not-allowed bg-slate-50' 
                    : isActive 
                      ? `bg-${channel.color}-50 border-${channel.color}-200 border` 
                      : 'hover:bg-slate-50 cursor-pointer'
                }`}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <IconComponent 
                    size={20} 
                    className={
                      isDisabled 
                        ? 'text-slate-400'
                        : isActive 
                          ? `text-${channel.color}-600` 
                          : 'text-slate-600'
                    } 
                  />
                  <h3 className={`font-semibold ${
                    isDisabled 
                      ? 'text-slate-400'
                      : isActive 
                        ? `text-${channel.color}-800` 
                        : 'text-slate-800'
                  }`}>
                    {channel.name}
                  </h3>
                </div>
                <p className={`text-sm ${
                  isDisabled 
                    ? 'text-slate-400'
                    : isActive 
                      ? `text-${channel.color}-600` 
                      : 'text-slate-600'
                }`}>
                  {channel.description}
                </p>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                  isDisabled
                    ? 'bg-slate-100 text-slate-400'
                    : isActive 
                      ? `bg-${channel.color}-100 text-${channel.color}-700 border border-${channel.color}-200` 
                      : 'bg-slate-100 text-slate-600'
                }`}>
                  {channel.tag}
                </div>
                {isDisabled && (
                  <p className="text-xs text-slate-400 mt-1">
                    {channel.id === 'hello-community' ? 'Join an organization to access' : 'Coming soon'}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* News Section */}
      <TrendingNews channelType={activeChannel} />

      {/* Active Channel Indicator */}
      {activeChannelConfig && !activeChannelConfig.disabled && (
        <div className="mb-6">
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-${activeChannelConfig.color}-50 text-${activeChannelConfig.color}-700 border border-${activeChannelConfig.color}-200`}>
            <activeChannelConfig.icon size={16} className="mr-2" />
            <span>{activeChannelConfig.tag}</span>
          </div>
        </div>
      )}

      {/* Create Post */}
      {activeChannelConfig && !activeChannelConfig.disabled && (
        <CreatePost 
          profile={profile}
          onNewPost={handleNewPost}
          channel={activeChannelConfig.dbChannel}
          organizationType={organizationInfo?.type}
        />
      )}

      {/* Posts Feed */}
      {activeChannelConfig && !activeChannelConfig.disabled ? (
        <div className="space-y-4">
          {loading && posts.length === 0 ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-pulse">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-slate-200 rounded mb-2 w-1/3"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded"></div>
                    <div className="h-4 bg-slate-200 rounded w-5/6"></div>
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
              channelIcon={activeChannelConfig.icon}
            />
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Channel Not Available</h3>
          <p className="text-slate-600 mb-4 max-w-md mx-auto">
            {activeChannelConfig?.id === 'hello-community' 
              ? 'Join an organization to access community-specific channels.'
              : 'This channel is coming soon.'}
          </p>
        </div>
      )}

      {/* Load more */}
      {hasMore && posts.length > 0 && (
        <div className="text-center">
          <button 
            onClick={() => {
              setPage(prev => prev + 1);
              fetchPosts(page + 1, activeChannelConfig);
            }}
            disabled={loading}
            className="px-6 py-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load More Posts'}
          </button>
        </div>
      )}
    </div>
  );
}