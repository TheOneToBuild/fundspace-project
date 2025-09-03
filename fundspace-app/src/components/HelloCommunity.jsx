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

// Organization channel configuration - now maps to actual database channels
const ORGANIZATION_CHANNELS = {
  'nonprofit': { 
    name: 'Nonprofit Community', 
    icon: '🏛️', 
    bgGradient: 'from-rose-50 to-pink-50',
    borderColor: 'border-rose-200',
    buttonColor: 'bg-rose-600 hover:bg-rose-700',
    tagColor: 'bg-rose-50 text-rose-700 border-rose-200',
    channelTag: '#nonprofit-community',
    dbChannel: 'nonprofit-community'
  },
  'foundation': { 
    name: 'Foundation Community', 
    icon: '💰',
    bgGradient: 'from-purple-50 to-indigo-50',
    borderColor: 'border-purple-200',
    buttonColor: 'bg-purple-600 hover:bg-purple-700',
    tagColor: 'bg-purple-50 text-purple-700 border-purple-200',
    channelTag: '#foundation-community',
    dbChannel: 'foundation-community'
  },
  'education': { 
    name: 'Education Community', 
    icon: '🎓',
    bgGradient: 'from-blue-50 to-indigo-50',
    borderColor: 'border-blue-200',
    buttonColor: 'bg-blue-600 hover:bg-blue-700',
    tagColor: 'bg-blue-50 text-blue-700 border-blue-200',
    channelTag: '#education-community',
    dbChannel: 'education-community'
  },
  'healthcare': { 
    name: 'Healthcare Community', 
    icon: '🏥',
    bgGradient: 'from-emerald-50 to-green-50',
    borderColor: 'border-emerald-200',
    buttonColor: 'bg-emerald-600 hover:bg-emerald-700',
    tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    channelTag: '#healthcare-community',
    dbChannel: 'healthcare-community'
  },
  'government': { 
    name: 'Government Community', 
    icon: '🏛️',
    bgGradient: 'from-slate-50 to-gray-50',
    borderColor: 'border-slate-200',
    buttonColor: 'bg-slate-600 hover:bg-slate-700',
    tagColor: 'bg-slate-50 text-slate-700 border-slate-200',
    channelTag: '#government-community',
    dbChannel: 'government-community'
  },
  'religious': { 
    name: 'Religious Community', 
    icon: '⛪',
    bgGradient: 'from-amber-50 to-yellow-50',
    borderColor: 'border-amber-200',
    buttonColor: 'bg-amber-600 hover:bg-amber-700',
    tagColor: 'bg-amber-50 text-amber-700 border-amber-200',
    channelTag: '#religious-community',
    dbChannel: 'religious-community'
  },
  'forprofit': { 
    name: 'Social Enterprise Community', 
    icon: '🏢',
    bgGradient: 'from-green-50 to-emerald-50',
    borderColor: 'border-green-200',
    buttonColor: 'bg-green-600 hover:bg-green-700',
    tagColor: 'bg-green-50 text-green-700 border-green-200',
    channelTag: '#social-enterprise-community',
    dbChannel: 'forprofit-community'
  }
};

// Helper functions
const getOrgBaseType = (organizationType) => {
  if (!organizationType) return null;
  return organizationType.split('.')[0].toLowerCase();
};

const getChannelInfo = (channelType) => {
  return channelType && ORGANIZATION_CHANNELS[channelType] ? ORGANIZATION_CHANNELS[channelType] : null;
};

const getNewsServiceForChannel = (channelType) => {
  const newsMap = {
    'nonprofit': 'getNonprofitNews',
    'foundation': 'getFunderNews',
    'education': 'getNonprofitNews',
    'healthcare': 'getNonprofitNews',
    'government': 'getNonprofitNews',
    'religious': 'getNonprofitNews',
    'forprofit': 'getFunderNews'
  };
  const method = newsMap[channelType] || 'getNonprofitNews';
  if (!newsService[method]) {
    console.error(`News method ${method} not found, using getGlobalBreakingNews`);
    return 'getGlobalBreakingNews';
  }
  return method;
};

const NewsCard = memo(({ title, summary, timeAgo, image, url, category }) => {
  const handleClick = () => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      onClick={handleClick}
      className="w-80 h-80 bg-white rounded-xl overflow-hidden shadow-lg group cursor-pointer relative"
    >
      {/* Full Background Image */}
      {image ? (
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
          <MessageCircle size={32} className="text-slate-400" />
        </div>
      )}
      
      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
      
      {/* Source Tag - Top Left */}
      <div className="absolute top-3 left-3">
        <div className="flex items-center space-x-2">
          <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-full border border-white/30">
            {category || 'Community'}
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
  summary: PropTypes.string, // Made optional since we're not using it in the overlay design
  timeAgo: PropTypes.string.isRequired, 
  image: PropTypes.string, 
  url: PropTypes.string,
  category: PropTypes.string
};

const TrendingNews = ({ channelType }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const newsMethod = getNewsServiceForChannel(channelType);
        const newsData = await newsService[newsMethod]();
        setNews(Array.isArray(newsData) ? newsData : []);
      } catch (error) {
        console.error('Error fetching news:', error);
        setNews([]);
      } finally {
        setLoading(false);
      }
    };
    if (channelType) {
      fetchNews();
    } else {
      setLoading(false);
    }
  }, [channelType]);

  const scrollNews = (direction) => {
    const container = document.getElementById('community-news-scroll');
    if (container) container.scrollBy({ left: direction === 'left' ? -320 : 320, behavior: 'smooth' });
  };

  if (loading || !news.length) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-800">Trending Community News</h2>
        <div className="flex space-x-2">
          <button onClick={() => scrollNews('left')} className="p-2 bg-white border rounded-lg hover:bg-slate-50">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => scrollNews('right')} className="p-2 bg-white border rounded-lg hover:bg-slate-50">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div id="community-news-scroll" className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4">
        {news.map(item => (
          <NewsCard 
            key={item.id} 
            title={item.title} 
            timeAgo={item.timeAgo} 
            image={item.image} 
            url={item.url} 
            category={item.category} 
          />
        ))}
      </div>
    </div>
  );
};
TrendingNews.propTypes = { channelType: PropTypes.string };

const ChannelIdentifier = ({ channelInfo }) => {
  if (!channelInfo) return null;
  return (
    <div className="mb-6">
      <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${channelInfo.tagColor}`}>
        <span className="mr-2">{channelInfo.icon}</span>
        <span>{channelInfo.channelTag}</span>
      </div>
    </div>
  );
};
ChannelIdentifier.propTypes = { channelInfo: PropTypes.object };

const JoinOrganizationPrompt = () => {
  const navigate = useNavigate();
  const handleJoinOrganization = () => navigate('/profile/my-organization');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center mb-6">
      <div className="text-6xl mb-4">👋</div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">Welcome to Hello Community</h3>
      <p className="text-slate-600 mb-6 max-w-md mx-auto">To see posts and connect with your community, you'll need to join an organization first.</p>
      <button onClick={handleJoinOrganization} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors">Join an Organization</button>
      <p className="text-xs text-slate-500 mt-4">You'll be able to connect with peers in your organization type's community</p>
    </div>
  );
};

const CommunityEmptyState = ({ channelInfo }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
      <div className="text-6xl mb-4">💬</div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">Start the Conversation</h3>
      <p className="text-slate-600 mb-4 max-w-md mx-auto">Be the first to share in the {channelInfo?.name || 'community'}!</p>
      <div className="inline-flex items-center px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium">
        <span className="w-2 h-2 bg-indigo-400 rounded-full mr-2 animate-pulse"></span>
        Share your first post above!
      </div>
    </div>
  );
};
CommunityEmptyState.propTypes = { channelInfo: PropTypes.object };

const POSTS_PER_PAGE = 10;

function HelloCommunity() {
  const { profile } = useOutletContext();
  const [posts, setPosts] = useState([]);
  const [initialLoading, setInitialLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [organizationInfo, setOrganizationInfo] = useState(null);
  
  const observer = useRef();
  const loaderRef = useCallback(node => {
    if (isPageLoading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [isPageLoading, hasMore]);

  useEffect(() => {
    if (!profile?.id) return;
    const cleanup = addOrganizationEventListener('organizationChanged', (event) => {
      const { profileId, organization } = event.detail;
      if (profileId === profile.id) {
        if (organization) {
          setOrganizationInfo({
            id: organization.id, name: organization.name, type: organization.type,
            tagline: organization.tagline, image_url: organization.image_url, role: 'member'
          });
        } else {
          setOrganizationInfo(null);
          setPosts([]); setPage(0); setHasMore(true);
        }
      }
    });

    const handleStorageChange = (e) => {
      if (e.key === 'orgChangeEvent' && e.newValue) {
        try {
          const message = JSON.parse(e.newValue);
          if (message.profileId === profile.id) {
            if (message.organization) {
              setOrganizationInfo({
                id: message.organization.id, name: message.organization.name, type: message.organization.type,
                tagline: message.organization.tagline, image_url: message.organization.image_url, role: 'member'
              });
            } else {
              setOrganizationInfo(null);
              setPosts([]); setPage(0); setHasMore(true);
            }
          }
        } catch (error) {
          console.error('❌ HelloCommunity: Failed to parse cross-tab message:', error);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      cleanup();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [profile?.id]);

  // FIXED: Replace problematic query with safe function
  useEffect(() => {
    const fetchOrganizationInfo = async () => {
      if (!profile?.id) return;
      
      try {
        const orgData = await getOrganizationInfoForCommunity(profile.id);
        setOrganizationInfo(orgData);
      } catch (err) {
        console.error('❌ HelloCommunity: Error fetching organization info:', err);
        setOrganizationInfo(null);
      }
    };
    
    fetchOrganizationInfo();
  }, [profile?.id]);

  const userOrgType = getOrgBaseType(organizationInfo?.type);
  const channelInfo = getChannelInfo(userOrgType);
  const canPost = !!organizationInfo && !!userOrgType && !!channelInfo;
  const dbChannel = channelInfo?.dbChannel;

  useEffect(() => {
    if (userOrgType && dbChannel) {
      setPosts([]); setPage(0); setHasMore(true); setInitialLoading(true);
    }
  }, [userOrgType, dbChannel]);

  useEffect(() => {
    const fetchCommunityPosts = async () => {
      if (!hasMore || !userOrgType || !dbChannel) {
        setInitialLoading(false);
        return;
      }
      page === 0 ? setInitialLoading(true) : setIsPageLoading(true);

      try {
        try {
          const { data: rpcData, error: rpcError } = await supabase.rpc('get_community_posts_by_org_type', {
              user_org_type: userOrgType, page_offset: page * POSTS_PER_PAGE, page_size: POSTS_PER_PAGE
            });

          if (!rpcError && rpcData) {
            const transformedPosts = rpcData.map(post => ({ ...post,
              profiles: {
                id: post.profile_id, full_name: post.profile_full_name, avatar_url: post.profile_avatar_url,
                title: post.profile_title, organization_name: post.profile_organization_name, role: post.profile_role
              }
            }));
            if (transformedPosts.length > 0) {
              const postIds = transformedPosts.map(post => post.id);
              const { data: allReactions } = await supabase.from('post_likes').select('post_id, reaction_type').in('post_id', postIds);
              const enrichedPosts = transformedPosts.map(post => {
                const reactionsForPost = allReactions?.filter(r => r.post_id === post.id) || [];
                const reactionSummary = reactionsForPost.reduce((acc, r) => { 
                  const type = r.reaction_type || 'like'; 
                  acc[type] = (acc[type] || 0) + 1; 
                  return acc; 
                }, {});
                return { ...post, reactions: { summary: Object.entries(reactionSummary).map(([type, count]) => ({ type, count })), sample: [] } };
              });
              setPosts(prev => (page === 0 ? enrichedPosts : [...prev, ...enrichedPosts]));
              if (enrichedPosts.length < POSTS_PER_PAGE) setHasMore(false);
            } else {
              setHasMore(false);
            }
            return;
          }
        } catch (rpcError) {
          console.warn('⚠️ HelloCommunity: RPC function failed, falling back to direct query:', rpcError);
        }

        const { data: postsData, error: postsError } = await supabase.from('posts')
          .select(`*, profiles:profile_id(id, full_name, avatar_url, title, organization_name, role, organization_type)`)
          .eq('channel', dbChannel).order('created_at', { ascending: false }).range(page * POSTS_PER_PAGE, (page + 1) * POSTS_PER_PAGE - 1);

        if (postsError) throw postsError;

        if (postsData && postsData.length > 0) {
          const postIds = postsData.map(post => post.id);
          const { data: allReactions } = await supabase.from('post_likes').select('post_id, reaction_type').in('post_id', postIds);
          const enrichedPosts = postsData.map(post => {
            const reactionsForPost = allReactions?.filter(r => r.post_id === post.id) || [];
            const reactionSummary = reactionsForPost.reduce((acc, r) => { 
              const type = r.reaction_type || 'like'; 
              acc[type] = (acc[type] || 0) + 1; 
              return acc; 
            }, {});
            return { ...post, reactions: { summary: Object.entries(reactionSummary).map(([type, count]) => ({ type, count })), sample: [] } };
          });
          setPosts(prev => (page === 0 ? enrichedPosts : [...prev, ...enrichedPosts]));
          if (enrichedPosts.length < POSTS_PER_PAGE) setHasMore(false);
        } else {
          setHasMore(false);
        }
      } catch (error) {
        console.error('❌ HelloCommunity: Error fetching community posts:', error);
      } finally {
        setInitialLoading(false);
        setIsPageLoading(false);
      }
    };
    fetchCommunityPosts();
  }, [userOrgType, dbChannel, page, hasMore]);

  const handleNewPost = useCallback((newPostData) => {
    const postWithOrgInfo = { ...newPostData, 
      profiles: { ...profile,
        organization_name: organizationInfo?.name || profile?.organization_name,
        organization_type: organizationInfo?.type || profile?.organization_type,
      },
      reactions: { summary: [], sample: [] }, likes_count: 0, comments_count: 0 
    };
    setPosts(prev => [postWithOrgInfo, ...prev]);
  }, [profile, organizationInfo]);

  const handleDeletePost = useCallback((deletedPostId) => {
    setPosts(prev => prev.filter((p) => p.id !== deletedPostId));
  }, []);

  useEffect(() => {
    if (!dbChannel) return;
    const channel = supabase.channel(`public:org_community:${dbChannel}`);
    
    const handlePostInsert = async (payload) => {
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', payload.new.profile_id).single();
      if (profileData) {
        const newPostWithProfile = { ...payload.new, profiles: profileData, reactions: { summary: [], sample: [] } };
        setPosts(currentPosts => {
          if (currentPosts.some(p => p.id === newPostWithProfile.id)) return currentPosts;
          return [newPostWithProfile, ...currentPosts];
        });
      }
    };

    const handlePostUpdate = (payload) => setPosts(currentPosts => currentPosts.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p));
    const handlePostDelete = (payload) => setPosts(currentPosts => currentPosts.filter(p => p.id !== payload.old.id));

    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts', filter: `channel=eq.${dbChannel}` }, handlePostInsert)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'posts', filter: `channel=eq.${dbChannel}` }, handlePostUpdate)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts', filter: `channel=eq.${dbChannel}` }, handlePostDelete)
      .subscribe();

    return () => { 
      if (channel) {
        channel.unsubscribe();
        supabase.removeChannel(channel); 
      }
    };
  }, [dbChannel]);

  if (!organizationInfo || !userOrgType) {
    return (
      <div className="space-y-6"><JoinOrganizationPrompt /></div>
    );
  }

  return (
    <div className="space-y-6">
      <TrendingNews channelType={userOrgType} />
      <ChannelIdentifier channelInfo={channelInfo} />
      {canPost && (<CreatePost profile={profile} onNewPost={handleNewPost} channel={dbChannel} organizationType={userOrgType} />)}
      <div className="space-y-6">
        {initialLoading ? (
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
        ) : posts.length === 0 ? (
          <CommunityEmptyState channelInfo={channelInfo} />
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} onDelete={handleDeletePost} />
          ))
        )}
      </div>
      <div ref={loaderRef} className="h-10 text-center">
        {isPageLoading && <p className="text-slate-500">Loading more posts...</p>}
        {!isPageLoading && !hasMore && posts.length > 0 && (
          <p className="text-slate-500">You've reached the end of the feed.</p>
        )}
      </div>
    </div>
  );
}

export default HelloCommunity;