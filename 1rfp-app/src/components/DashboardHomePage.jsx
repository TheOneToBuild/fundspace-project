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

  if (loading) return null; // Don't show anything while loading
  if (news.length === 0) return null; // Don't show the section if there's no news

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
            <h2 className="text-xl font-bold text-slate-800">Welcome to Hello World</h2>
            <p className="text-slate-600 max-w-2xl">Connect with the entire community! Share updates, discover opportunities, and engage.</p>
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
        const from = page * POSTS_PER_PAGE;
        const to = from + POSTS_PER_PAGE - 1;

        const { data: newPosts, error } = await supabase.from('posts').select('*, profiles!posts_profile_id_fkey(*)').eq('channel', 'hello-world').order('created_at', { ascending: false }).range(from, to);

        if (error) console.error("Error fetching posts:", error);
        else {
            setPosts(prevPosts => (page === 0 ? newPosts : [...prevPosts, ...newPosts]));
            if (newPosts.length < POSTS_PER_PAGE) setHasMore(false);
        }
        setIsLoading(false);
    };
    fetchPosts();
  }, [page]);
  
  useEffect(() => {
    const channel = supabase.channel('public:posts');
    channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts', filter: 'channel=eq.hello-world' }, async (payload) => {
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', payload.new.profile_id).single();
        if (profileData) {
            const newPostWithProfile = { ...payload.new, profiles: profileData };
            setPosts(currentPosts => {
                if (currentPosts.some(p => p.id === newPostWithProfile.id)) return currentPosts;
                return [newPostWithProfile, ...currentPosts];
            });
        }
    }).subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const handleEnterWorld = () => {
    if (profile?.id) {
      localStorage.setItem(`hello-world-entered-${profile.id}`, 'true');
      setHasEnteredWorld(true);
      setShowWelcome(false);
    }
  };

  const handleNewPost = (newPost) => setPosts(p => [{ ...newPost, profiles: profile }, ...p]);
  const handleDeletePost = (postId) => setPosts(p => p.filter(post => post.id !== postId));

  return (
    <div className="space-y-6">
      <TrendingNewsSection />
      {showWelcome && <HelloWorldWelcomeSection onEnterWorld={handleEnterWorld} hasEnteredWorld={hasEnteredWorld}/>}
      {(hasEnteredWorld || posts.length > 0) && (
        <>
          <CreatePost profile={profile} onNewPost={handleNewPost} channel="hello-world" />
          {posts.length > 0 && (
            <div className="space-y-6">
              {posts.map(post => <PostCard key={`post-${post.id}`} post={post} onDelete={handleDeletePost} />)}
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