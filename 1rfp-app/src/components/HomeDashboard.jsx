import React, { useState, useEffect, memo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
    ChevronLeft, ChevronRight, Globe, Bookmark, Users, Heart, MessageCircle,
    Plus, ArrowRight, Bell
} from 'lucide-react';
import { rssNewsService as newsService } from '../services/rssNewsService.js';
import PropTypes from 'prop-types';

const NewsCard = memo(({ title, timeAgo, image, url, category }) => (
    <div
        className="flex-shrink-0 w-80 h-64 bg-white rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group relative"
        onClick={() => url && window.open(url, '_blank')}
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
));
NewsCard.displayName = 'NewsCard';
NewsCard.propTypes = {
    title: PropTypes.string.isRequired,
    timeAgo: PropTypes.string.isRequired,
    image: PropTypes.string,
    url: PropTypes.string,
    category: PropTypes.string
};

const TrendingPostCard = ({ post, onClick }) => {
    const formatTimeAgo = (dateString) => {
        const now = new Date();
        const postDate = new Date(dateString);
        const diffInHours = Math.floor((now - postDate) / (1000 * 60 * 60));
        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours}h ago`;
        return `${Math.floor(diffInHours / 24)}d ago`;
    };

    const extractContentAndImages = (content) => {
        if (!content) return { text: '', images: [] };
        const div = document.createElement('div');
        div.innerHTML = content;
        const imgElements = div.querySelectorAll('img');
        const images = Array.from(imgElements).map(img => img.src).filter(src => src);
        imgElements.forEach(img => img.remove());
        const text = div.textContent || div.innerText || '';
        return { text: text.trim(), images };
    };

    const { text: cleanedContent, images: contentImages } = extractContentAndImages(post.content);
    const allImages = [
        ...(post.images || []),
        ...contentImages,
        ...(post.image_urls || []),
        ...(post.attachments || []).filter(att => att.type === 'image').map(att => att.url)
    ];
    const hasImages = allImages.length > 0;

    return (
        <div
            className="flex-shrink-0 w-80 bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group"
            onClick={onClick}
        >
            {hasImages && (
                <div className="h-48 bg-slate-100 overflow-hidden relative">
                    <img
                        src={allImages[0]}
                        alt="User uploaded content"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={e => { e.target.style.display = 'none'; }}
                    />
                    {allImages.length > 1 && (
                        <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                            +{allImages.length - 1}
                        </div>
                    )}
                </div>
            )}
            <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                    <img
                        src={post.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.profiles?.full_name || 'User')}&background=6366f1&color=ffffff`}
                        alt={post.profiles?.full_name || 'User'}
                        className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 text-sm truncate">
                            {post.profiles?.full_name || 'Anonymous'}
                        </h4>
                        {post.profiles?.organization_name && (
                            <p className="text-xs text-slate-500 truncate">
                                {post.profiles.organization_name}
                            </p>
                        )}
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0">
                        {formatTimeAgo(post.created_at)}
                    </span>
                </div>
                <div className="mb-4">
                    <p className={`text-slate-700 text-sm leading-relaxed ${!hasImages ? 'line-clamp-[12]' : 'line-clamp-4'}`}>
                        {cleanedContent || 'No text content'}
                    </p>
                </div>
                <div className="flex items-center space-x-4 text-xs text-slate-500">
                    <div className="flex items-center space-x-1">
                        <Heart size={14} />
                        <span>{post.reactions?.summary?.reduce((total, r) => total + r.count, 0) || 0}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <MessageCircle size={14} />
                        <span>{post.comments_count || 0}</span>
                    </div>
                    <div className="ml-auto text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        View Post →
                    </div>
                </div>
            </div>
        </div>
    );
};
TrendingPostCard.propTypes = {
    post: PropTypes.object.isRequired,
    onClick: PropTypes.func.isRequired
};

const TrendingPostsSection = ({ posts, onViewMore, onPostClick }) => {
    const scrollPosts = (direction) => {
        const container = document.getElementById('trending-posts-scroll');
        if (container) {
            container.scrollBy({ left: direction === 'left' ? -320 : 320, behavior: 'smooth' });
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Trending from Hello World</h2>
                    <p className="text-sm text-slate-600 mt-1">Popular posts from the global community</p>
                </div>
                <div className="flex items-center space-x-2">
                    {posts && posts.length > 0 && (
                        <div className="flex space-x-2">
                            <button
                                onClick={() => scrollPosts('left')}
                                className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={() => scrollPosts('right')}
                                className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                    <button
                        onClick={onViewMore}
                        className="ml-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                        View More
                    </button>
                </div>
            </div>
            {posts && posts.length > 0 ? (
                <div id="trending-posts-scroll" className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4">
                    {posts.map(post => (
                        <TrendingPostCard
                            key={post.id}
                            post={post}
                            onClick={() => onPostClick(post)}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                    <MessageCircle size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-600 mb-2">No posts yet</h3>
                    <p className="text-slate-500 text-sm mb-4">Be the first to share something with the community!</p>
                    <button
                        onClick={onViewMore}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Start Conversation
                    </button>
                </div>
            )}
        </div>
    );
};
TrendingPostsSection.propTypes = {
    posts: PropTypes.array.isRequired,
    onViewMore: PropTypes.func.isRequired,
    onPostClick: PropTypes.func.isRequired
};

const StatsCard = ({ icon: Icon, title, value, subtitle, color, onClick }) => (
    <div
        className={`bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
    >
        <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${color}`}>
                <Icon size={24} className="text-white" />
            </div>
            {onClick && <ArrowRight size={16} className="text-slate-400" />}
        </div>
        <div>
            <h3 className="text-2xl font-bold text-slate-900 mb-1">{value}</h3>
            <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
    </div>
);
StatsCard.propTypes = {
    icon: PropTypes.elementType.isRequired,
    title: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    subtitle: PropTypes.string,
    color: PropTypes.string.isRequired,
    onClick: PropTypes.func
};

const QuickActions = ({ onAction }) => {
    const actions = [
        { id: 'save-grant', icon: Bookmark, label: 'Save Grant', color: 'bg-blue-500', action: () => onAction('grants') },
        { id: 'create-post', icon: Plus, label: 'Create Post', color: 'bg-green-500', action: () => onAction('hello-world') },
        { id: 'connect', icon: Users, label: 'Find People', color: 'bg-purple-500', action: () => onAction('members') },
        { id: 'notifications', icon: Bell, label: 'Notifications', color: 'bg-orange-500', action: () => onAction('notifications') }
    ];
    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
                {actions.map(action => (
                    <button
                        key={action.id}
                        onClick={action.action}
                        className="flex items-center p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200"
                    >
                        <div className={`p-2 rounded-md ${action.color} mr-3`}>
                            <action.icon size={16} className="text-white" />
                        </div>
                        <span className="text-sm font-medium text-slate-700">{action.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};
QuickActions.propTypes = {
    onAction: PropTypes.func.isRequired
};

export default function HomeDashboard() {
    const { profile } = useOutletContext() || {};
    const navigate = useNavigate();
    const [news, setNews] = useState([]);
    const [trendingPosts, setTrendingPosts] = useState([]);
    const [stats, setStats] = useState({
        savedGrants: 0,
        connections: 0,
        followers: 0,
        posts: 0
    });
    const [organizationInfo, setOrganizationInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const newsData = await newsService.getGlobalBreakingNews();
                setNews(Array.isArray(newsData) ? newsData.slice(0, 6) : []);
            } catch {
                setNews([]);
            }
        };
        fetchNews();
    }, []);

    useEffect(() => {
        const fetchTrendingPosts = async () => {
            try {
                const { data: postsData, error } = await supabase
                    .from('posts')
                    .select('*')
                    .eq('channel', 'hello-world')
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (error) throw error;

                if (postsData && postsData.length > 0) {
                    const profileIds = [...new Set(postsData.map(post => post.profile_id))];
                    const { data: profilesData } = await supabase
                        .from('profiles')
                        .select('id, full_name, avatar_url')
                        .in('id', profileIds);

                    const { data: membershipsData } = await supabase
                        .from('organization_memberships')
                        .select('profile_id, organizations!inner(name)')
                        .in('profile_id', profileIds)
                        .order('joined_at', { ascending: false });

                    const orgMap = {};
                    membershipsData?.forEach(membership => {
                        if (!orgMap[membership.profile_id]) {
                            orgMap[membership.profile_id] = membership.organizations.name;
                        }
                    });

                    const postIds = postsData.map(post => post.id);
                    const { data: reactionsData } = await supabase
                        .from('post_likes')
                        .select('post_id, reaction_type')
                        .in('post_id', postIds);

                    const enrichedPosts = postsData.map(post => {
                        const profile = profilesData?.find(p => p.id === post.profile_id);
                        const currentOrgName = orgMap[post.profile_id];
                        const postReactions = reactionsData?.filter(r => r.post_id === post.id) || [];
                        const reactionSummary = postReactions.reduce((acc, r) => {
                            const type = r.reaction_type || 'like';
                            acc[type] = (acc[type] || 0) + 1;
                            return acc;
                        }, {});
                        return {
                            ...post,
                            profiles: {
                                ...profile,
                                organization_name: currentOrgName
                            },
                            reactions: {
                                summary: Object.entries(reactionSummary).map(([type, count]) => ({ type, count }))
                            }
                        };
                    });
                    setTrendingPosts(enrichedPosts);
                } else {
                    setTrendingPosts([]);
                }
            } catch {
                setTrendingPosts([]);
            }
        };
        fetchTrendingPosts();
    }, []);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!profile?.id) return;
            setLoading(true);
            try {
                const { data: orgMembership } = await supabase
                    .from('organization_memberships')
                    .select('*, organizations!inner(id, name, type, tagline, image_url)')
                    .eq('profile_id', profile.id)
                    .order('joined_at', { ascending: false })
                    .limit(1);
                if (orgMembership && orgMembership.length > 0) {
                    setOrganizationInfo(orgMembership[0].organizations);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, [profile?.id]);

    const scrollNews = (direction) => {
        const container = document.getElementById('dashboard-news-scroll');
        if (container) {
            container.scrollBy({ left: direction === 'left' ? -320 : 320, behavior: 'smooth' });
        }
    };

    const handlePostClick = (post) => {
        navigate(`/profile/hello-world?highlight=${post.id}`);
    };

    const handleViewMorePosts = () => {
        navigate('/profile/hello-world');
    };

    const handleQuickAction = (action) => {
        const routes = {
            'grants': '/grants',
            'hello-world': '/profile/hello-world',
            'members': '/profile/members',
            'notifications': '/profile/notifications'
        };
        navigate(routes[action] || '/profile');
    };

    const handleStatsClick = (type) => {
        const routes = {
            'savedGrants': '/profile/saved-grants',
            'connections': '/profile/connections',
            'followers': '/profile/followers',
            'posts': '/profile/hello-world'
        };
        navigate(routes[type] || '/profile');
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-8 bg-slate-200 rounded w-1/3"></div>
                <div className="h-64 bg-slate-200 rounded"></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-32 bg-slate-200 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-1">
                            Welcome back, {profile?.full_name?.split(' ')[0] || 'there'}! 👋
                        </h1>
                        <p className="text-slate-600">
                            {organizationInfo
                                ? `${organizationInfo.name} • ${profile?.title || 'Team Member'}`
                                : 'Ready to discover new opportunities?'}
                        </p>
                    </div>
                    <div className="text-4xl">
                        {organizationInfo ? '🏢' : '🚀'}
                    </div>
                </div>
            </div>
            <TrendingPostsSection
                posts={trendingPosts}
                onViewMore={handleViewMorePosts}
                onPostClick={handlePostClick}
            />
            {news.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-800">Trending World News</h2>
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
                    <div id="dashboard-news-scroll" className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4">
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
            )}
        </div>
    );
}
