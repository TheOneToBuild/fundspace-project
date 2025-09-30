import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';
import { ChevronLeft, ChevronRight, Users, MessageCircle, Globe } from 'lucide-react';
import PostCard from './PostCard.jsx';
import CreatePost from './CreatePost.jsx';
import { rssNewsService as newsService } from '../services/rssNewsService.js';
import { addOrganizationEventListener } from '../utils/organizationEvents.js';
import { getOrganizationInfoForDashboard } from '../utils/membershipQueries.js';
import { realtimeManager } from '../utils/realtimeManager.js';
import { getDashboardData } from '../utils/rpcClientFunctions';
import PropTypes from 'prop-types';

const NewsCard = memo(({ title, timeAgo, image, url, category }) => {
  const handleClick = () => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };
  return (
    <div onClick={handleClick} className="relative w-80 h-80 bg-white rounded-xl overflow-hidden shadow-lg group cursor-pointer">
      {image ? (
        <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
          <Globe size={32} className="text-slate-400" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
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
  timeAgo: PropTypes.string.isRequired, 
  image: PropTypes.string, 
  url: PropTypes.string,
  category: PropTypes.string
};

const TrendingNewsSection = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const newsData = await newsService.getGlobalBreakingNews();
        setNews(Array.isArray(newsData) ? newsData.slice(0, 6) : []);
      } catch (error) {
        console.error("Failed to fetch news:", error);
        setNews([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  const scrollNews = (direction) => {
    const container = document.getElementById('news-scroll');
    if (container) {
      container.scrollBy({ left: direction === 'left' ? -320 : 320, behavior: 'smooth' });
    }
  };

  if (loading) return null;
  if (news.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-800">Trending World News</h2>
        <div className="flex space-x-2">
          <button onClick={() => scrollNews('left')} className="p-2 bg-white border rounded-lg hover:bg-slate-50">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => scrollNews('right')} className="p-2 bg-white border rounded-lg hover:bg-slate-50">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div id="news-scroll" className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4">
        {news.map(item => <NewsCard key={item.id} {...item} />)}
      </div>
    </div>
  );
};

const HelloWorldEmptyState = () => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
    <div className="text-6xl mb-4">💬</div>
    <h3 className="text-xl font-bold text-slate-800 mb-2">Start the Global Conversation</h3>
    <p className="text-slate-600 max-w-md mx-auto">Be the first to share something! Your post will appear here.</p>
  </div>
);

const POSTS_PER_PAGE = 5;

export default function HelloWorldChannel() {
  const { 
    profile,
    pageData,           
    postsLikesData,     
    handlePostLike,     
    handleNewPost: handleNewPostContext,  
    handleDeletePost: handleDeletePostContext  
  } = useOutletContext() || {};
  
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [organizationInfo, setOrganizationInfo] = useState(null);

  const enhancedPageData = React.useMemo(() => ({
    ...pageData,
    postLikes: postsLikesData || pageData?.postLikes || {},
    profiles: pageData?.profiles || {},
    orgMemberships: pageData?.orgMemberships || {},
    organizations: pageData?.organizations || {}
  }), [pageData, postsLikesData]);

  const observer = useRef();
  const loaderRef = useCallback(node => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoading, hasMore]);

  useEffect(() => {
    if (!profile?.id) return;
    const cleanup = addOrganizationEventListener('organizationChanged', (event) => {
      const { profileId, organization } = event.detail;
      if (profileId === profile.id) {
        if (organization) {
          setOrganizationInfo({
            id: organization.id,
            name: organization.name,
            type: organization.type,
            tagline: organization.tagline,
            image_url: organization.image_url,
            role: 'member'
          });
        } else {
          setOrganizationInfo(null);
        }
      }
    });
    return cleanup;
  }, [profile?.id]);

  useEffect(() => {
    const fetchOrganizationInfo = async () => {
      if (!profile?.id) return;
      try {
        const orgData = await getOrganizationInfoForDashboard(profile.id);
        setOrganizationInfo(orgData);
      } catch (err) {
        console.error('Error fetching organization info:', err);
        setOrganizationInfo(null);
      }
    };
    fetchOrganizationInfo();
  }, [profile?.id]);

  useEffect(() => {
  const fetchPosts = async () => {
    if (!hasMore) return;
    setIsLoading(true);
    try {
      // Always use RPC for all pages
      const dashboardData = await getDashboardData(profile?.id);
      const helloWorldPosts = dashboardData?.posts?.filter(post => post.channel === 'hello-world') || [];
      
      // Map to include profile data if available
      const enrichedPosts = helloWorldPosts.map(post => ({
        ...post,
        profiles: dashboardData?.profiles?.[post.profile_id] || post.profiles,
        reactions: { summary: [], sample: [] }
      }));
      
      if (page === 0) {
        setPosts(enrichedPosts);
      } else {
        // For pagination beyond what RPC returns, fall back to direct query
        if (enrichedPosts.length >= POSTS_PER_PAGE) {
          setPosts(prevPosts => [...prevPosts, ...enrichedPosts.slice(page * POSTS_PER_PAGE)]);
        } else {
          setHasMore(false);
        }
      }
      
      if (enrichedPosts.length < POSTS_PER_PAGE) setHasMore(false);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  };
  fetchPosts();
  }, [page, hasMore, profile?.id]);

  useEffect(() => {
    if (!profile) return;

    const subscription = realtimeManager.createSubscription(
      'hello-world',
      supabase,
      profile,
      {
        onPostInsert: async (payload) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', payload.new.profile_id)
            .single();
          if (profileData) {
            const newPostWithProfile = { 
              ...payload.new, 
              profiles: profileData, 
              reactions: { summary: [], sample: [] } 
            };
            setPosts(currentPosts => {
              if (currentPosts.some(p => p.id === newPostWithProfile.id)) return currentPosts;
              return [newPostWithProfile, ...currentPosts];
            });
          }
        },
        onPostDelete: (payload) => {
          setPosts(currentPosts => currentPosts.filter(p => p.id !== payload.old.id));
        },
        onPostUpdate: (payload) => {
          setPosts(currentPosts => currentPosts.map(p => 
            p.id === payload.new.id ? { ...p, ...payload.new } : p
          ));
        },
        onLikeChange: (payload) => {
          const postId = payload.new?.post_id || payload.old?.post_id;
          // The count is now updated via database triggers and re-fetched.
          // No client-side action needed here for counts.
        },
        onCommentChange: (payload) => {
          const postId = payload.new?.post_id || payload.old?.post_id;
          // The count is now updated via database triggers and re-fetched.
          // No client-side action needed here for counts.
        }
      }
    );
    return () => {
      realtimeManager.removeSubscription('hello-world', supabase);
    };
  }, [posts, profile?.id]);

  const handleNewPostLocal = useCallback((newPost) => {
    const postWithOrgInfo = { 
      ...newPost, 
      profiles: {
        ...profile,
        organization_name: organizationInfo?.name || profile?.organization_name,
        organization_type: organizationInfo?.type || profile?.organization_type,
      },
      likes_count: 0, 
      comments_count: 0, 
      reactions: { summary: [], sample: [] } 
    };
    setPosts(p => [postWithOrgInfo, ...p]);
    if (handleNewPostContext) {
      handleNewPostContext(newPost);
    }
  }, [profile, organizationInfo, handleNewPostContext]);
  
  const handleDeletePostLocal = useCallback((postId) => {
    setPosts(p => p.filter(post => post.id !== postId));
    if (handleDeletePostContext) {
      handleDeletePostContext(postId);
    }
  }, [handleDeletePostContext]);

  return (
    <div className="space-y-6">
      <TrendingNewsSection />
      <CreatePost 
        profile={profile} 
        onNewPost={handleNewPostLocal} 
        channel="hello-world" 
        organizationType={organizationInfo?.type} 
      />
      <div className="space-y-6">
        {posts.length === 0 && !isLoading ? (
          <HelloWorldEmptyState />
        ) : (
          <>
            {posts.filter(post => post.profiles).map(post => (
              <PostCard 
                key={post.id} 
                post={post} 
                onDelete={handleDeletePostLocal}
                pageData={enhancedPageData}
                postsLikesData={postsLikesData}
                onPostLike={handlePostLike}
                userReaction={enhancedPageData.postLikes?.[post.id]?.userReaction}
                batchedProfiles={enhancedPageData.profiles}
                batchedOrganizations={enhancedPageData.organizations}
              />
            ))}
            <div ref={loaderRef} className="h-10 text-center">
              {isLoading && <p className="text-slate-500">Loading...</p>}
              {!isLoading && !hasMore && posts.length > 0 && (
                <p className="text-slate-500">You've reached the end.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}