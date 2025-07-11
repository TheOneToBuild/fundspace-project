// src/components/HelloCommunity.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Clock, TrendingUp, ArrowRight, Users, MessageCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import CreatePost from './CreatePost.jsx';
import PostCard from './PostCard.jsx';

const NewsCard = ({ title, summary, category, timeAgo, image }) => (
    <div className="flex-shrink-0 w-80 bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
        <div className="h-40 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center relative">
            <img src={image} alt={title} className="w-full h-full object-cover" />
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded-full text-xs font-medium text-slate-700">
                {category}
            </div>
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

const TrendingNews = ({ userRole }) => {
    const [news, setNews] = useState([]);

    // Mock news data - loads instantly without any delay
    const mockNews = {
        Funder: [
            {
                id: 1,
                title: "MacKenzie Scott Announces $2.15B in New Giving",
                summary: "Focus on equity and community-led organizations continues with latest philanthropic distribution targeting underserved communities nationwide.",
                category: "Philanthropy",
                timeAgo: "2 hours ago",
                image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=200&fit=crop"
            },
            {
                id: 2,
                title: "Foundation Trends: Impact Investing Reaches Record High",
                summary: "New report shows 40% increase in foundation impact investing commitments this year, with climate and social justice leading sectors.",
                category: "Breaking News",
                timeAgo: "4 hours ago",
                image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=200&fit=crop"
            },
            {
                id: 3,
                title: "DAF Giving Surpasses $50B Milestone",
                summary: "Donor-advised funds continue to grow as preferred vehicle for strategic philanthropy, with tech entrepreneurs leading adoption.",
                category: "Philanthropy",
                timeAgo: "6 hours ago",
                image: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=400&h=200&fit=crop"
            },
            {
                id: 4,
                title: "Giving Tuesday Sets New Global Record",
                summary: "International day of giving generates $3.1B in donations across 80+ countries, demonstrating sustained philanthropic momentum.",
                category: "Philanthropy",
                timeAgo: "1 day ago",
                image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=200&fit=crop"
            },
            {
                id: 5,
                title: "Corporate Foundation Pledges Hit $15B",
                summary: "Major corporations announce unprecedented foundation commitments focused on climate action and social equity initiatives.",
                category: "Breaking News",
                timeAgo: "2 days ago",
                image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=200&fit=crop"
            },
            {
                id: 6,
                title: "Family Foundation Leadership Trends",
                summary: "Next-generation philanthropists bring fresh approaches to family foundation governance and strategic giving priorities.",
                category: "Philanthropy",
                timeAgo: "1 week ago",
                image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400&h=200&fit=crop"
            }
        ],
        Nonprofit: [
            {
                id: 1,
                title: "Federal Funding Opportunities Expanded for Community Organizations",
                summary: "New ARPA allocations prioritize grassroots nonprofits serving underrepresented communities with streamlined application processes.",
                category: "Breaking News",
                timeAgo: "1 hour ago",
                image: "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=400&h=200&fit=crop"
            },
            {
                id: 2,
                title: "Study: Nonprofit Collaboration Increases Program Effectiveness by 35%",
                summary: "Research highlights benefits of cross-sector partnerships in achieving mission goals and maximizing community impact through shared resources.",
                category: "Nonprofit",
                timeAgo: "3 hours ago",
                image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=200&fit=crop"
            },
            {
                id: 3,
                title: "Digital Fundraising Tools See 60% Adoption Increase",
                summary: "Small nonprofits embrace technology to diversify revenue streams and reach new donors through innovative online platforms.",
                category: "Nonprofit",
                timeAgo: "5 hours ago",
                image: "https://images.unsplash.com/photo-1556157382-97eda2d62296?w=400&h=200&fit=crop"
            },
            {
                id: 4,
                title: "Volunteer Engagement Reaches Pre-Pandemic Levels",
                summary: "Community organizations report strongest volunteer participation since 2019, driven by renewed civic engagement across all demographics.",
                category: "Community",
                timeAgo: "1 day ago",
                image: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400&h=200&fit=crop"
            },
            {
                id: 5,
                title: "Nonprofit Sector Shows Record Growth",
                summary: "IRS data reveals 4.2% increase in new nonprofit registrations, with environmental and social justice organizations leading expansion.",
                category: "Breaking News",
                timeAgo: "2 days ago",
                image: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=400&h=200&fit=crop"
            },
            {
                id: 6,
                title: "Board Diversity Initiative Shows Results",
                summary: "National survey reveals significant improvements in nonprofit board composition, with 40% increase in diverse leadership representation.",
                category: "Nonprofit",
                timeAgo: "1 week ago",
                image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=200&fit=crop"
            }
        ]
    };

    useEffect(() => {
        const newsData = mockNews[userRole] || [];
        setNews(newsData);
    }, [userRole]);

    const scrollNews = (direction) => {
        const container = document.getElementById('community-news-scroll');
        const scrollAmount = 320; // Card width + gap
        if (direction === 'left') {
            container.scrollLeft -= scrollAmount;
        } else {
            container.scrollLeft += scrollAmount;
        }
    };

    if (!userRole || (userRole !== 'Funder' && userRole !== 'Nonprofit') || news.length === 0) {
        return null;
    }

    const newsTitle = userRole === 'Funder' ? 'Philanthropy News' : 'Nonprofit News';

    return (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-800">{newsTitle}</h2>
                <div className="flex space-x-2">
                    <button 
                        onClick={() => scrollNews('left')}
                        className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button 
                        onClick={() => scrollNews('right')}
                        className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
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
                {news.map(newsItem => (
                    <NewsCard key={newsItem.id} {...newsItem} />
                ))}
            </div>
        </div>
    );
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
                    >
                        <span>Enter Community</span>
                        <ArrowRight size={18} />
                    </button>
                )}
            </div>
        </div>
    );
};

const ChannelIdentifier = ({ userRole }) => {
    if (!userRole || (userRole !== 'Funder' && userRole !== 'Nonprofit')) {
        return null;
    }

    return (
        <div className="mb-6">
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                userRole === 'Funder' 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-purple-50 text-purple-700 border border-purple-200'
            }`}>
                <span className="mr-2">
                    {userRole === 'Funder' ? '🏦' : '🌟'}
                </span>
                <span>
                    #{userRole === 'Funder' ? 'funder-community' : 'nonprofit-community'}
                </span>
            </div>
        </div>
    );
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
                description: 'This space is designed for funders and nonprofits to connect within their respective communities. You can view posts but cannot participate in discussions.'
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

export default function HelloCommunity() {
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
    }, [profile?.id, userRole, canPost]);

    const fetchCommunityPosts = useCallback(async () => {
        if (!userRole || (userRole !== 'Funder' && userRole !== 'Nonprofit')) {
            setPosts([]);
            return;
        }

        try {
            const { data: postsData, error: postsError } = await supabase
                .from('posts')
                .select(`
                    *,
                    profiles!posts_profile_id_fkey(
                        id,
                        full_name,
                        avatar_url,
                        role,
                        title,
                        organization_name
                    )
                `)
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
                const postIds = postsData.map(post => post.id);
                
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
                    allReactions.forEach(reaction => {
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
                    allComments.forEach(comment => {
                        const postId = comment.post_id;
                        commentCounts[postId] = (commentCounts[postId] || 0) + 1;
                    });
                }

                const enrichedPosts = postsData.map(post => ({
                    ...post,
                    likes_count: reactionCounts[post.id] || 0,
                    comments_count: commentCounts[post.id] || 0,
                    reactions: {
                        summary: Object.entries(reactionSummaries[post.id] || {}).map(([type, count]) => ({ type, count })),
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

    // Fetch posts immediately without delay
    useEffect(() => {
        fetchCommunityPosts();
    }, [fetchCommunityPosts]);

    const handleNewPost = useCallback((newPostData) => {
        const postWithProfile = {
            ...newPostData,
            profiles: profile,
            reactions: { summary: [], sample: [] },
            likes_count: 0,
            comments_count: 0
        };
        
        setPosts(prev => [postWithProfile, ...prev]);
    }, [profile]);

    const handleDeletePost = useCallback((deletedPostId) => {
        setPosts(prev => prev.filter(p => p.id !== deletedPostId));
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
                        <CreatePost 
                            profile={profile} 
                            onNewPost={handleNewPost}
                            channel="hello-community"
                        />
                    )}
                    
                    <div className="space-y-6">
                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-pulse">
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
                            posts.map(post => (
                                <PostCard 
                                    key={post.id} 
                                    post={post} 
                                    onDelete={handleDeletePost}
                                />
                            ))
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