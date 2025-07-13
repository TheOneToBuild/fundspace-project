// src/components/HelloCommunity.jsx
import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import PropTypes from 'prop-types';
import { ChevronLeft, ChevronRight, Clock, TrendingUp, ArrowRight, Users, MessageCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import CreatePost from './CreatePost.jsx';
import PostCard from './PostCard.jsx';
import { rssNewsService as newsService } from '../services/rssNewsService.js';

const NewsCard = memo(({ title, summary, timeAgo, image, url }) => {
  return (
    <div
      className="flex-shrink-0 w-80 bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => url && window.open(url, '_blank')}
    >
      <div className="h-40 bg-slate-100 flex items-center justify-center">
        {image ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : null}
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
});
NewsCard.displayName = 'NewsCard';
NewsCard.propTypes = { title: PropTypes.string.isRequired, summary: PropTypes.string.isRequired, timeAgo: PropTypes.string.isRequired, image: PropTypes.string, url: PropTypes.string };

const TrendingNews = ({ userRole }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userRole || (userRole !== 'Funder' && userRole !== 'Nonprofit')) {
      setNews([]);
      setLoading(false);
      return;
    }
    const fetchNews = async () => {
      setLoading(true);
      const newsData = userRole === 'Funder' ? await newsService.getFunderNews() : await newsService.getNonprofitNews();
      setNews(Array.isArray(newsData) ? newsData : []);
      setLoading(false);
    };
    fetchNews();
  }, [userRole]);

  const scrollNews = (direction) => {
    const container = document.getElementById('community-news-scroll');
    if (container) container.scrollBy({ left: direction === 'left' ? -320 : 320, behavior: 'smooth' });
  };
  
  const newsTitle = 'Trending Community News';
  if (loading) return null;
  if (!news.length) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-800">{newsTitle}</h2>
        <div className="flex space-x-2">
          <button onClick={() => scrollNews('left')} className="p-2 bg-white border rounded-lg hover:bg-slate-50"><ChevronLeft size={16} /></button>
          <button onClick={() => scrollNews('right')} className="p-2 bg-white border rounded-lg hover:bg-slate-50"><ChevronRight size={16} /></button>
        </div>
      </div>
      <div id="community-news-scroll" className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4">
        {news.map(item => <NewsCard key={item.id} {...item} />)}
      </div>
    </div>
  );
};
TrendingNews.propTypes = { userRole: PropTypes.oneOf(['Funder', 'Nonprofit', null]) };

const CommunityWelcomeSection = ({ userRole, onEnterCommunity, hasEnteredCommunity }) => {
    const getCommunityInfo = () => {
        if (userRole === 'Funder') return { icon: '🏦', title: 'Welcome to the Funder Community', description: 'Connect with fellow funders, share insights, and discuss philanthropic strategies in this dedicated space.', channelTag: '#funder-community', bgGradient: 'from-green-50 to-emerald-50', borderColor: 'border-green-200', buttonColor: 'bg-green-600 hover:bg-green-700', tagColor: 'bg-green-50 text-green-700 border-green-200' };
        if (userRole === 'Nonprofit') return { icon: '🌟', title: 'Welcome to the Nonprofit Community', description: 'Connect with other nonprofit organizations, share successes, and collaborate on making greater impact.', channelTag: '#nonprofit-community', bgGradient: 'from-purple-50 to-indigo-50', borderColor: 'border-purple-200', buttonColor: 'bg-purple-600 hover:bg-purple-700', tagColor: 'bg-purple-50 text-purple-700 border-purple-200' };
        return { icon: '👀', title: 'Community Discussions', description: 'This space is designed for funders and nonprofits to connect within their respective communities.', channelTag: '#community-space', bgGradient: 'from-gray-50 to-slate-50', borderColor: 'border-gray-200', buttonColor: 'bg-gray-600 hover:bg-gray-700', tagColor: 'bg-gray-50 text-gray-700 border-gray-200' };
    };

    const { icon, title, description, channelTag, bgGradient, borderColor, buttonColor, tagColor } = getCommunityInfo();
    const canPost = userRole === 'Funder' || userRole === 'Nonprofit';

    return (
        <div className={`bg-gradient-to-r ${bgGradient} border ${borderColor} rounded-xl p-6 mb-6`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4"><div className="text-4xl">{icon}</div>
                    <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                            <h2 className="text-xl font-bold text-slate-800">{title}</h2>
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${tagColor}`}><span>{channelTag}</span></div>
                        </div>
                        <p className="text-slate-600 mb-4 max-w-2xl">{description}</p>
                        {canPost && (<div className="flex items-center space-x-4"><div className="flex items-center space-x-2 text-sm text-slate-500"><Users size={16} /><span>Connect with peers</span></div><div className="flex items-center space-x-2 text-sm text-slate-500"><MessageCircle size={16} /><span>Share insights</span></div></div>)}
                    </div>
                </div>
                {canPost && !hasEnteredCommunity && (<button onClick={onEnterCommunity} className={`flex items-center space-x-2 px-6 py-3 ${buttonColor} text-white rounded-lg font-medium transition-colors shadow-sm`} aria-label="Enter Community"><span>Enter Community</span><ArrowRight size={18} /></button>)}
            </div>
        </div>
    );
};
CommunityWelcomeSection.propTypes = { userRole: PropTypes.oneOf(['Funder', 'Nonprofit', null]), onEnterCommunity: PropTypes.func.isRequired, hasEnteredCommunity: PropTypes.bool.isRequired };

const ChannelIdentifier = ({ userRole }) => {
  if (!userRole || (userRole !== 'Funder' && userRole !== 'Nonprofit')) return null;
  const roleInfo = userRole === 'Funder' ? { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: '🏦', tag: '#funder-community' } : { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: '🌟', tag: '#nonprofit-community' };
  return <div className="mb-6"><div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${roleInfo.bg} ${roleInfo.text} ${roleInfo.border}`}><span className="mr-2">{roleInfo.icon}</span><span>{roleInfo.tag}</span></div></div>;
};
ChannelIdentifier.propTypes = { userRole: PropTypes.oneOf(['Funder', 'Nonprofit', null]) };

const CommunityEmptyState = ({ userRole }) => {
    const getEmptyMessage = () => {
        if (userRole === 'Funder') return { icon: '💬', title: 'Start the Conversation', description: 'Be the first to share an insight, ask a question, or start a discussion with your fellow funders.' };
        if (userRole === 'Nonprofit') return { icon: '💬', title: 'Start the Conversation', description: 'Be the first to share a success story, ask for advice, or start a discussion with other nonprofits.' };
        return { icon: '👀', title: 'Community View Only', description: 'This space is designed for funders and nonprofits to connect. You can view posts but cannot participate in discussions.' };
    };
    const { icon, title, description } = getEmptyMessage();
    const canPost = userRole === 'Funder' || userRole === 'Nonprofit';
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
            <div className="text-6xl mb-4">{icon}</div><h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
            <p className="text-slate-600 mb-4 max-w-md mx-auto">{description}</p>
            {canPost && (<div className="inline-flex items-center px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium"><span className="w-2 h-2 bg-indigo-400 rounded-full mr-2 animate-pulse"></span>Share your first post above!</div>)}
        </div>
    );
};
CommunityEmptyState.propTypes = { userRole: PropTypes.oneOf(['Funder', 'Nonprofit', null]) };

const POSTS_PER_PAGE = 10;

function HelloCommunity() {
  const { profile } = useOutletContext();
  const [posts, setPosts] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [hasEnteredCommunity, setHasEnteredCommunity] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  const userRole = profile?.role;
  const canPost = userRole === 'Funder' || userRole === 'Nonprofit';

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
    if (profile?.id && userRole) {
      const storageKey = `community-entered-${profile.id}-${userRole}`;
      const hasEntered = localStorage.getItem(storageKey) === 'true';
      setHasEnteredCommunity(hasEntered);
      setShowWelcome(!hasEntered && canPost);
    }
  }, [profile?.id, userRole, canPost]);

  useEffect(() => {
    setPosts([]);
    setPage(0);
    setHasMore(true);
    setInitialLoading(true);
  }, [userRole]);

  useEffect(() => {
    const fetchCommunityPosts = async () => {
      if (!userRole || (userRole !== 'Funder' && userRole !== 'Nonprofit') || !hasMore) {
        setInitialLoading(false);
        return;
      }

      page === 0 ? setInitialLoading(true) : setIsPageLoading(true);

      const from = page * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;

      try {
        const { data: postsData, error: postsError } = await supabase.from('posts').select('*, profiles!posts_profile_id_fkey(*)').eq('channel', 'hello-community').eq('profiles.role', userRole).order('created_at', { ascending: false }).range(from, to);
        if (postsError) throw postsError;

        if (postsData && postsData.length > 0) {
          const postIds = postsData.map((post) => post.id);
          const { data: allReactions } = await supabase.from('post_likes').select('post_id, reaction_type').in('post_id', postIds);
          const { data: allComments } = await supabase.from('post_comments').select('post_id').in('post_id', postIds);

          const enrichedPosts = postsData.map((post) => {
            const reactionsForPost = allReactions?.filter(r => r.post_id === post.id) || [];
            const reactionSummary = reactionsForPost.reduce((acc, r) => {
                const type = r.reaction_type || 'like';
                acc[type] = (acc[type] || 0) + 1;
                return acc;
            }, {});
            return {
              ...post,
              likes_count: reactionsForPost.length,
              comments_count: allComments?.filter(c => c.post_id === post.id).length || 0,
              reactions: { summary: Object.entries(reactionSummary).map(([type, count]) => ({ type, count })), sample: [] }
            };
          });
          
          setPosts(prev => (page === 0 ? enrichedPosts : [...prev, ...enrichedPosts]));
          if (postsData.length < POSTS_PER_PAGE) setHasMore(false);

        } else {
          setHasMore(false);
        }
      } catch (error) {
        console.error('Error fetching community posts:', error);
      } finally {
        setInitialLoading(false);
        setIsPageLoading(false);
      }
    };
    
    fetchCommunityPosts();
  }, [userRole, page]);

  const handleNewPost = useCallback((newPostData) => {
    setPosts(prev => [{ ...newPostData, profiles: profile, reactions: { summary: [], sample: [] }, likes_count: 0, comments_count: 0 }, ...prev]);
  }, [profile]);

  const handleDeletePost = useCallback((deletedPostId) => {
    setPosts(prev => prev.filter((p) => p.id !== deletedPostId));
  }, []);

  const handleEnterCommunity = () => {
    if (profile?.id && userRole) {
      localStorage.setItem(`community-entered-${profile.id}-${userRole}`, 'true');
      setHasEnteredCommunity(true);
      setShowWelcome(false);
    }
  };

  return (
    <div className="space-y-6">
      <TrendingNews userRole={userRole} />
      {showWelcome && <CommunityWelcomeSection userRole={userRole} onEnterCommunity={handleEnterCommunity} hasEnteredCommunity={hasEnteredCommunity} />}
      {(hasEnteredCommunity || posts.length > 0 || !canPost) && (
        <>
          <ChannelIdentifier userRole={userRole} />
          {canPost && <CreatePost profile={profile} onNewPost={handleNewPost} channel="hello-community" />}
          <div className="space-y-6">
            {initialLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-pulse">
                    <div className="flex items-center space-x-3 mb-4"><div className="w-12 h-12 bg-slate-200 rounded-full"></div><div className="flex-1"><div className="h-4 bg-slate-200 rounded mb-2 w-1/3"></div><div className="h-3 bg-slate-200 rounded w-1/4"></div></div></div>
                    <div className="space-y-2"><div className="h-4 bg-slate-200 rounded"></div><div className="h-4 bg-slate-200 rounded w-5/6"></div></div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <CommunityEmptyState userRole={userRole} />
            ) : (
              posts.map((post) => <PostCard key={post.id} post={post} onDelete={handleDeletePost} />)
            )}
          </div>
          <div ref={loaderRef} className="h-10 text-center">
            {isPageLoading && <p className="text-slate-500">Loading more posts...</p>}
            {!isPageLoading && !hasMore && posts.length > 0 && <p className="text-slate-500">You've reached the end of the feed.</p>}
          </div>
        </>
      )}
    </div>
  );
}

export default HelloCommunity;