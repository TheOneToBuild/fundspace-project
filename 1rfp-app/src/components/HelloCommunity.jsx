// src/components/HelloCommunity.jsx
import React, { useState, useEffect, useCallback, memo } from 'react';
import { useOutletContext } from 'react-router-dom';
import PropTypes from 'prop-types';
import { ChevronLeft, ChevronRight, Clock, TrendingUp, ArrowRight, Users, MessageCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import CreatePost from './CreatePost.jsx';
import PostCard from './PostCard.jsx';
import { rssNewsService as newsService } from '../services/rssNewsService.js';

// Fallback logic has been removed.

const NewsCard = memo(({ title, summary, category, timeAgo, image, url }) => {
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
});

NewsCard.propTypes = {
  title: PropTypes.string.isRequired,
  summary: PropTypes.string.isRequired,
  category: PropTypes.string.isRequired,
  timeAgo: PropTypes.string.isRequired,
  image: PropTypes.string,
  url: PropTypes.string
};

// ... (The rest of the file is identical to the last version you provided)
const TrendingNews = ({ userRole }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      if (!userRole || (userRole !== 'Funder' && userRole !== 'Nonprofit')) {
        setNews([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        let newsData;
        if (userRole === 'Funder') {
          newsData = await newsService.getFunderNews();
        } else {
          newsData = await newsService.getNonprofitNews();
        }

        setNews(newsData);
      } catch (err) {
        console.error('Error fetching community news:', err);
        setError('Failed to load news');
        let fallbackNews;
        if (userRole === 'Funder') {
          fallbackNews = await newsService.getFallbackFunderNews();
        } else {
          fallbackNews = await newsService.getFallbackNonprofitNews();
        }
        setNews(fallbackNews);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [userRole]);

  const scrollNews = (direction) => {
    const container = document.getElementById('community-news-scroll');
    if (container) {
      const scrollAmount = 320;
      container.scrollLeft += direction === 'left' ? -scrollAmount : scrollAmount;
    }
  };

  if (!userRole || (userRole !== 'Funder' && userRole !== 'Nonprofit')) {
    return null;
  }

  const newsTitle = userRole === 'Funder' ? 'Philanthropy News' : 'Nonprofit News';

  if (loading) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-800">{newsTitle}</h2>
        </div>
        <div className="flex space-x-4 overflow-hidden">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-80 bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse"
            >
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

  if (news.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <h2 className="text-xl font-bold text-slate-800">{newsTitle}</h2>
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
            aria-label="Scroll left"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => scrollNews('right')}
            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div
        id="community-news-scroll"
        className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4"
        style={{ scrollBehavior: 'smooth' }}
      >
        {news.map((newsItem) => (
          <NewsCard key={newsItem.id} {...newsItem} />
        ))}
      </div>
    </div>
  );
};

TrendingNews.propTypes = {
  userRole: PropTypes.oneOf(['Funder', 'Nonprofit', null])
};

const CommunityWelcomeSection = ({ userRole, onEnterCommunity, hasEnteredCommunity }) => {
  const getCommunityInfo = () => {
    if (userRole === 'Funder') {
      return {
        icon: '🏦',
        title: 'Welcome to the Funder Community',
        description: 'Connect with fellow funders, share insights, and discuss philanthropic strategies in this dedicated space.',
        channelTag: '#funder-community',
        bgGradient: 'from-green-50 to-emerald-50',
        borderColor: 'border-green-200',
        buttonColor: 'bg-green-600 hover:bg-green-700',
        tagColor: 'bg-green-50 text-green-700 border-green-200'
      };
    } else if (userRole === 'Nonprofit') {
      return {
        icon: '🌟',
        title: 'Welcome to the Nonprofit Community',
        description: 'Connect with other nonprofit organizations, share successes, and collaborate on making greater impact.',
        channelTag: '#nonprofit-community',
        bgGradient: 'from-purple-50 to-indigo-50',
        borderColor: 'border-purple-200',
        buttonColor: 'bg-purple-600 hover:bg-purple-700',
        tagColor: 'bg-purple-50 text-purple-700 border-purple-200'
      };
    } else {
      return {
        icon: '👀',
        title: 'Community Discussions',
        description: 'This space is designed for funders and nonprofits to connect within their respective communities.',
        channelTag: '#community-space',
        bgGradient: 'from-gray-50 to-slate-50',
        borderColor: 'border-gray-200',
        buttonColor: 'bg-gray-600 hover:bg-gray-700',
        tagColor: 'bg-gray-50 text-gray-700 border-gray-200'
      };
    }
  };

  const { icon, title, description, channelTag, bgGradient, borderColor, buttonColor, tagColor } = getCommunityInfo();
  const canPost = userRole === 'Funder' || userRole === 'Nonprofit';

  return (
    <div className={`bg-gradient-to-r ${bgGradient} border ${borderColor} rounded-xl p-6 mb-6`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-4xl">{icon}</div>
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h2 className="text-xl font-bold text-slate-800">{title}</h2>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${tagColor}`}>
                <span>{channelTag}</span>
              </div>
            </div>
            <p className="text-slate-600 mb-4 max-w-2xl">{description}</p>

            {canPost && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-slate-500">
                  <Users size={16} />
                  <span>Connect with peers</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-slate-500">
                  <MessageCircle size={16} />
                  <span>Share insights</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {canPost && !hasEnteredCommunity && (
          <button
            onClick={onEnterCommunity}
            className={`flex items-center space-x-2 px-6 py-3 ${buttonColor} text-white rounded-lg font-medium transition-colors shadow-sm`}
            aria-label="Enter Community"
          >
            <span>Enter Community</span>
            <ArrowRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

CommunityWelcomeSection.propTypes = {
  userRole: PropTypes.oneOf(['Funder', 'Nonprofit', null]),
  onEnterCommunity: PropTypes.func.isRequired,
  hasEnteredCommunity: PropTypes.bool.isRequired
};

const ChannelIdentifier = ({ userRole }) => {
  if (!userRole || (userRole !== 'Funder' && userRole !== 'Nonprofit')) {
    return null;
  }

  return (
    <div className="mb-6">
      <div
        className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
          userRole === 'Funder'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-purple-50 text-purple-700 border border-purple-200'
        }`}
      >
        <span className="mr-2">{userRole === 'Funder' ? '🏦' : '🌟'}</span>
        <span>#{userRole === 'Funder' ? 'funder-community' : 'nonprofit-community'}</span>
      </div>
    </div>
  );
};

ChannelIdentifier.propTypes = {
  userRole: PropTypes.oneOf(['Funder', 'Nonprofit', null])
};

const CommunityEmptyState = ({ userRole }) => {
  const getEmptyMessage = () => {
    if (userRole === 'Funder') {
      return {
        icon: '💬',
        title: 'Start the Conversation',
        description: 'Be the first to share an insight, ask a question, or start a discussion with your fellow funders.'
      };
    } else if (userRole === 'Nonprofit') {
      return {
        icon: '💬',
        title: 'Start the Conversation',
        description: 'Be the first to share a success story, ask for advice, or start a discussion with other nonprofits.'
      };
    } else {
      return {
        icon: '👀',
        title: 'Community View Only',
        description:
          'This space is designed for funders and nonprofits to connect within their respective communities. You can view posts but cannot participate in discussions.'
      };
    }
  };

  const { icon, title, description } = getEmptyMessage();
  const canPost = userRole === 'Funder' || userRole === 'Nonprofit';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-600 mb-4 max-w-md mx-auto">{description}</p>
      {canPost && (
        <div className="inline-flex items-center px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium">
          <span className="w-2 h-2 bg-indigo-400 rounded-full mr-2 animate-pulse"></span>
          Share your first post above to get the discussion started!
        </div>
      )}
    </div>
  );
};

CommunityEmptyState.propTypes = {
  userRole: PropTypes.oneOf(['Funder', 'Nonprofit', null])
};

function HelloCommunity() {
  const { profile } = useOutletContext();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasEnteredCommunity, setHasEnteredCommunity] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  const userRole = profile?.role;
  const canPost = userRole === 'Funder' || userRole === 'Nonprofit';

  useEffect(() => {
    if (profile?.id && userRole) {
      const storageKey = `community-entered-${profile.id}-${userRole}`;
      const hasEntered = localStorage.getItem(storageKey) === 'true';
      setHasEnteredCommunity(hasEntered);
      setShowWelcome(!hasEntered && canPost);
    }
  }, [profile?.id, userRole]);

  const fetchCommunityPosts = useCallback(async () => {
    if (!userRole || (userRole !== 'Funder' && userRole !== 'Nonprofit')) {
      setPosts([]);
      return;
    }

    try {
      setLoading(true);
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(
          `
          *,
          profiles!posts_profile_id_fkey(
            id,
            full_name,
            avatar_url,
            role,
            title,
            organization_name
          )
        `
        )
        .eq('channel', 'hello-community')
        .eq('profiles.role', userRole)
        .order('created_at', { ascending: false })
        .limit(20);

      if (postsError) {
        console.error('Error fetching community posts:', postsError);
        setPosts([]);
        return;
      }

      if (postsData && postsData.length > 0) {
        const postIds = postsData.map((post) => post.id);

        const { data: allReactions } = await supabase
          .from('post_likes')
          .select('post_id, reaction_type')
          .in('post_id', postIds);

        const { data: allComments } = await supabase
          .from('post_comments')
          .select('post_id')
          .in('post_id', postIds);

        const reactionCounts = {};
        const reactionSummaries = {};

        if (allReactions) {
          allReactions.forEach((reaction) => {
            const postId = reaction.post_id;
            reactionCounts[postId] = (reactionCounts[postId] || 0) + 1;
            if (!reactionSummaries[postId]) {
              reactionSummaries[postId] = {};
            }
            const type = reaction.reaction_type || 'like';
            reactionSummaries[postId][type] = (reactionSummaries[postId][type] || 0) + 1;
          });
        }

        const commentCounts = {};
        if (allComments) {
          allComments.forEach((comment) => {
            const postId = comment.post_id;
            commentCounts[postId] = (commentCounts[postId] || 0) + 1;
          });
        }

        const enrichedPosts = postsData.map((post) => ({
          ...post,
          likes_count: reactionCounts[post.id] || 0,
          comments_count: commentCounts[post.id] || 0,
          reactions: {
            summary: Object.entries(reactionSummaries[post.id] || {}).map(([type, count]) => ({
              type,
              count
            })),
            sample: []
          }
        }));

        setPosts(enrichedPosts);
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error('Error in fetchCommunityPosts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [userRole]);

  useEffect(() => {
    fetchCommunityPosts();
  }, [fetchCommunityPosts]);

  const handleNewPost = useCallback(
    (newPostData) => {
      const postWithProfile = {
        ...newPostData,
        profiles: profile,
        reactions: { summary: [], sample: [] },
        likes_count: 0,
        comments_count: 0
      };

      setPosts((prev) => [postWithProfile, ...prev]);
    },
    [profile]
  );

  const handleDeletePost = useCallback((deletedPostId) => {
    setPosts((prev) => prev.filter((p) => p.id !== deletedPostId));
  }, []);

  const handleEnterCommunity = () => {
    if (profile?.id && userRole) {
      const storageKey = `community-entered-${profile.id}-${userRole}`;
      localStorage.setItem(storageKey, 'true');
      setHasEnteredCommunity(true);
      setShowWelcome(false);
    }
  };

  return (
    <div className="space-y-6">
      <TrendingNews userRole={userRole} />

      {showWelcome && (
        <CommunityWelcomeSection
          userRole={userRole}
          onEnterCommunity={handleEnterCommunity}
          hasEnteredCommunity={hasEnteredCommunity}
        />
      )}

      {(hasEnteredCommunity || posts.length > 0 || !canPost) && (
        <>
          <ChannelIdentifier userRole={userRole} />

          {canPost && (
            <CreatePost profile={profile} onNewPost={handleNewPost} channel="hello-community" />
          )}

          <div className="space-y-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-pulse"
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-slate-200 rounded mb-2"></div>
                        <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-200 rounded"></div>
                      <div className="h-4 bg-slate-200 rounded"></div>
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <CommunityEmptyState userRole={userRole} />
            ) : (
              posts.map((post) => <PostCard key={post.id} post={post} onDelete={handleDeletePost} />)
            )}
          </div>

          {posts.length > 0 && !loading && (
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

export default HelloCommunity;