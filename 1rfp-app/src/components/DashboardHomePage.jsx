// src/components/DashboardHomePage.jsx
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ChevronLeft, ChevronRight, Clock, TrendingUp, ArrowRight, Users, MessageCircle, Globe } from 'lucide-react';
import PostCard from './PostCard.jsx';
import CreatePost from './CreatePost.jsx';
import { rssNewsService as newsService } from '../services/rssNewsService.js';
import PropTypes from 'prop-types';

const NewsCard = memo(({ title, summary, timeAgo, image, url }) => {
  return (
    <div 
      className="flex-shrink-0 w-80 bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => url && window.open(url, '_blank')}
    >
      <div className="h-40 bg-slate-100 flex items-center justify-center">
        {image && <img src={image} alt={title} className="w-full h-full object-cover" />}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-slate-800 text-sm line-clamp-2 mb-2">{title}</h3>
        <p className="text-slate-600 text-xs line-clamp-3 mb-3">{summary}</p>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center"><Clock size={12} className="mr-1" />{timeAgo}</div>
        </div>
      </div>
    </div>
  );
});
NewsCard.displayName = 'NewsCard';
NewsCard.propTypes = { title: PropTypes.string, summary: PropTypes.string, timeAgo: PropTypes.string, image: PropTypes.string, url: PropTypes.string };

const TrendingNewsSection = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const newsData = await newsService.getGlobalBreakingNews();
        setNews(Array.isArray(newsData) ? newsData : []);
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
          <button onClick={() => scrollNews('left')} className="p-2 bg-white border rounded-lg hover:bg-slate-50"><ChevronLeft size={16} /></button>
          <button onClick={() => scrollNews('right')} className="p-2 bg-white border rounded-lg hover:bg-slate-50"><ChevronRight size={16} /></button>
        </div>
      </div>
      <div id="news-scroll" className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4">
        {news.map(item => <NewsCard key={item.id} {...item} />)}
      </div>
    </div>
  );
};

const HelloWorldWelcomeSection = ({ onEnterWorld, hasEnteredWorld }) => (
    <div className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-4xl">🌍</div>
          <div>
            <div className="flex items-center space-x-3 mb-2">
                <h2 className="text-xl font-bold text-slate-800">Welcome to Hello World</h2>
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-sky-100 text-sky-800 border border-sky-200">
                    <span>#hello-world</span>
                </div>
            </div>
            <p className="text-slate-600 max-w-2xl mb-4">Connect with the entire community! Share updates, discover opportunities, and engage.</p>
            <div className="flex items-center space-x-4 text-sm text-slate-500">
                <div className="flex items-center space-x-2"><Users size={16} /><span>Open community</span></div>
                <div className="flex items-center space-x-2"><MessageCircle size={16} /><span>Share & discover</span></div>
                <div className="flex items-center space-x-2"><Globe size={16} /><span>All welcome</span></div>
            </div>
          </div>
        </div>
        {!hasEnteredWorld && (
          <button onClick={onEnterWorld} className="flex items-center space-x-2 px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors shadow-sm">
            <span>Join the Conversation</span><ArrowRight size={18} />
          </button>
        )}
      </div>
    </div>
);
HelloWorldWelcomeSection.propTypes = { onEnterWorld: PropTypes.func.isRequired, hasEnteredWorld: PropTypes.bool.isRequired };

const HelloWorldEmptyState = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
      <div className="text-6xl mb-4">💬</div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">Start the Global Conversation</h3>
      <p className="text-slate-600 max-w-md mx-auto">Be the first to share something! Your post will appear here.</p>
    </div>
);

const HelloWorldChannelIdentifier = () => (
    <div className="mb-6">
        <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-sky-50 text-sky-700 border border-sky-200">
            <span className="mr-2">🌍</span>
            <span>#hello-world</span>
        </div>
    </div>
);

const POSTS_PER_PAGE = 5;

export default function DashboardHomePage() {
  const { profile } = useOutletContext() || {};
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [hasEnteredWorld, setHasEnteredWorld] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

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
    if (profile?.id) {
      const storageKey = `hello-world-entered-${profile.id}`;
      const hasEntered = localStorage.getItem(storageKey) === 'true';
      setHasEnteredWorld(hasEntered);
      setShowWelcome(!hasEntered);
    }
  }, [profile?.id]);

  useEffect(() => {
    const fetchPosts = async () => {
        if (!hasMore) return;
        setIsLoading(true);
        
        try {
            const { data: newPosts, error: rpcError } = await supabase.rpc('get_ranked_feed', {
                page_number: page,
                page_size: POSTS_PER_PAGE
            });

            if (rpcError) throw rpcError;

            if (newPosts && newPosts.length > 0) {
                const postIds = newPosts.map(p => p.id);

                // --- START: RE-ADDED DATA ENRICHMENT LOGIC ---
                const { data: allReactions } = await supabase
                    .from('post_likes')
                    .select('post_id, reaction_type')
                    .in('post_id', postIds);

                const profilesById = (await supabase.from('profiles').select('*').in('id', newPosts.map(p => p.profile_id))).data.reduce((acc, p) => {
                    acc[p.id] = p;
                    return acc;
                }, {});
                
                const enrichedPosts = newPosts.map(post => {
                    const reactionsForPost = allReactions?.filter(r => r.post_id === post.id) || [];
                    const reactionSummary = reactionsForPost.reduce((acc, r) => {
                        const type = r.reaction_type || 'like';
                        acc[type] = (acc[type] || 0) + 1;
                        return acc;
                    }, {});

                    return {
                        ...post,
                        profiles: profilesById[post.profile_id],
                        reactions: {
                            summary: Object.entries(reactionSummary).map(([type, count]) => ({ type, count })),
                            sample: [] // Sample is fetched inside PostCard, so this is fine.
                        }
                    };
                });
                // --- END: RE-ADDED DATA ENRICHMENT LOGIC ---

                setPosts(prevPosts => (page === 0 ? enrichedPosts : [...prevPosts, ...enrichedPosts]));
                if (newPosts.length < POSTS_PER_PAGE) setHasMore(false);

            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Error fetching ranked posts:", error);
            setHasMore(false);
        } finally {
            setIsLoading(false);
        }
    };
    fetchPosts();
  }, [page]);
  
  useEffect(() => {
    const channel = supabase.channel('public:posts_feed_v2');
    
    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, async (payload) => { /* ... */ })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' }, (payload) => { /* ... */ })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'posts' }, (payload) => { /* ... */ })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleEnterWorld = () => { /* ... */ };
  const handleNewPost = (newPost) => { /* ... */ };
  const handleDeletePost = (postId) => { /* ... */ };

  return (
    <div className="space-y-6">
      <TrendingNewsSection />
      {showWelcome && <HelloWorldWelcomeSection onEnterWorld={handleEnterWorld} hasEnteredWorld={hasEnteredWorld}/>}
      {(hasEnteredWorld || posts.length > 0) && (
        <>
          <HelloWorldChannelIdentifier />
          <CreatePost profile={profile} onNewPost={handleNewPost} channel="hello-world" />
          {posts.length > 0 && (
            <div className="space-y-6">
              {posts.map(post => post.profiles && <PostCard key={`post-${post.id}`} post={post} onDelete={handleDeletePost} />)}
            </div>
          )}
          <div ref={loaderRef} className="h-10 text-center">
            {isLoading && <p className="text-slate-500">Loading...</p>}
            {!isLoading && !hasMore && posts.length > 0 && <p className="text-slate-500">You've reached the end.</p>}
          </div>
          {!isLoading && posts.length === 0 && <HelloWorldEmptyState />}
        </>
      )}
    </div>
  );
}