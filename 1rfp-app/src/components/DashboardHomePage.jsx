// src/components/DashboardHomePage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Clock, TrendingUp, ArrowRight, Users, MessageCircle, Globe } from 'lucide-react';
import PostCard from './PostCard.jsx';
import CreatePost from './CreatePost.jsx';
import { rssNewsService as newsService } from '../services/rssNewsService.js';

// Fallback logic has been removed.

const NewsCard = ({ title, summary, category, timeAgo, image, url }) => {
  return (
    <div 
      className="flex-shrink-0 w-80 bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => url && window.open(url, '_blank')}
    >
      <div className="h-40 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center relative">
        {/* Conditionally render the image only if it exists */}
        {image ? (
          <img 
            src={image}
            alt={title} 
            className="w-full h-full object-cover"
          />
        ) : (
          // If no image, a neutral background is shown by the parent div.
          null
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-slate-800 text-sm line-clamp-2 mb-2">{title}</h3>
        <p className="text-slate-600 text-xs line-clamp-3 mb-3">{summary}</p>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center">
            <Clock size={12} className="mr-1" />
            {timeAgo}
          </div>
          <div className="flex items-center">
            <TrendingUp size={12} className="mr-1" />
            Trending
          </div>
        </div>
      </div>
    </div>
  );
};

// ... (The rest of the file is identical to the last version you provided)
const TrendingNewsSection = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);
        const newsData = await newsService.getGlobalBreakingNews();
        setNews(Array.isArray(newsData) ? newsData : []);
      } catch (err) {
        console.error('Error fetching news:', err);
        setError('Failed to load news');
        const fallbackNews = await newsService.getFallbackGlobalBreakingNews();
        setNews(Array.isArray(fallbackNews) ? fallbackNews : []);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const scrollNews = (direction) => {
    const container = document.getElementById('news-scroll');
    const scrollAmount = 320;
    const maxScroll = container.scrollWidth - container.clientWidth;
    if (direction === 'left') {
      container.scrollLeft = Math.max(0, container.scrollLeft - scrollAmount);
    } else {
      container.scrollLeft = Math.min(maxScroll, container.scrollLeft + scrollAmount);
    }
  };

  if (loading) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-800">Global Breaking News</h2>
        </div>
        <div className="flex space-x-4 overflow-hidden">
          {[...Array(10)].map((_, i) => (
            <div key={`skeleton-${i}`} className="flex-shrink-0 w-80 bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse">
              <div className="h-40 bg-slate-200"></div>
              <div className="p-4">
                <div className="h-4 bg-slate-200 rounded mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-3/4 mb-3"></div>
                <div className="flex justify-between">
                  <div className="h-3 bg-slate-200 rounded w-16"></div>
                  <div className="h-3 bg-slate-200 rounded w-20"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <h2 className="text-xl font-bold text-slate-800">Global Breaking News</h2>
          {error && (
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
              Using local news
            </span>
          )}
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => scrollNews('left')}
            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            onClick={() => scrollNews('right')}
            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      
      <div 
        id="news-scroll"
        className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4"
        style={{ scrollBehavior: 'smooth' }}
      >
        {news.map(newsItem => (
          <NewsCard key={newsItem.id} {...newsItem} />
        ))}
      </div>
    </div>
  );
};

const HelloWorldWelcomeSection = ({ onEnterWorld, hasEnteredWorld, profile }) => {
  return (
    <div className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-4xl">🌍</div>
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h2 className="text-xl font-bold text-slate-800">Welcome to Hello World</h2>
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border bg-sky-50 text-sky-700 border-sky-200">
                <span>#hello-world</span>
              </div>
            </div>
            <p className="text-slate-600 mb-4 max-w-2xl">
              Connect with the entire community! Share updates, discover opportunities, and engage with funders, nonprofits, and community members in this open space.
            </p>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-slate-500">
                <Users size={16} />
                <span>Open community</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-slate-500">
                <MessageCircle size={16} />
                <span>Share & discover</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-slate-500">
                <Globe size={16} />
                <span>All welcome</span>
              </div>
            </div>
          </div>
        </div>
        
        {!hasEnteredWorld && (
          <button
            onClick={onEnterWorld}
            className="flex items-center space-x-2 px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors shadow-sm"
          >
            <span>Join the Conversation</span>
            <ArrowRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

const HelloWorldEmptyState = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
      <div className="text-6xl mb-4">💬</div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">Start the Global Conversation</h3>
      <p className="text-slate-600 mb-4 max-w-md mx-auto">
        Be the first to share something with the entire community! Ask questions, share insights, or announce opportunities.
      </p>
      <div className="inline-flex items-center px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium">
        <span className="w-2 h-2 bg-indigo-400 rounded-full mr-2 animate-pulse"></span>
        Share your first post above to get things started!
      </div>
    </div>
  );
};

export default function DashboardHomePage() {
  const { profile, posts, handleNewPost, handleDeletePost } = useOutletContext() || {};
  const [hasEnteredWorld, setHasEnteredWorld] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      const storageKey = `hello-world-entered-${profile.id}`;
      const hasEntered = localStorage.getItem(storageKey) === 'true';
      setHasEnteredWorld(hasEntered);
      setShowWelcome(!hasEntered);
    } else {
      setHasEnteredWorld(false);
      setShowWelcome(false);
    }
  }, [profile?.id]);

  const handleEnterWorld = () => {
    if (profile?.id) {
      const storageKey = `hello-world-entered-${profile.id}`;
      localStorage.setItem(storageKey, 'true');
      setHasEnteredWorld(true);
      setShowWelcome(false);
    }
  };

  const loading = !posts && !profile;

  return (
    <div className="space-y-6">
      <TrendingNewsSection />

      {showWelcome && (
        <HelloWorldWelcomeSection 
          onEnterWorld={handleEnterWorld}
          hasEnteredWorld={hasEnteredWorld}
          profile={profile}
        />
      )}

      {(hasEnteredWorld || (posts && posts.length > 0)) && (
        <>
          <div className="mb-6">
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-sky-50 text-sky-700 border border-sky-200">
              <span className="mr-2">🌍</span>
              <span>#hello-world</span>
            </div>
          </div>

          <CreatePost 
            profile={profile} 
            onNewPost={handleNewPost} 
            channel="hello-world"
          />

          {loading && <p className="text-center text-slate-500">Loading feed...</p>}
          
          {!loading && (!posts || posts.length === 0) && (
            <HelloWorldEmptyState />
          )}

          {!loading && posts && posts.length > 0 && (
            <div className="space-y-6">
              {posts.map(post => (
                <PostCard key={`post-${post.id}`} post={post} onDelete={handleDeletePost} />
              ))}
            </div>
          )}

          {posts && posts.length > 0 && !loading && (
            <div className="text-center py-8">
              <button className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-medium">
                Load More Posts
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}