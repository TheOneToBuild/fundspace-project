// src/components/HomeDashboard.jsx - Complete version with all sections
import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { rssNewsService as newsService } from '../services/rssNewsService.js';

// Import all the smaller components
import WelcomeBanner from './dashboard/WelcomeBanner.jsx';
import ConnectionsAvatars from './dashboard/ConnectionsAvatars.jsx';
import TrendingPostsSection from './dashboard/TrendingPostsSection.jsx';
import HelloCommunitySection from './dashboard/HelloCommunitySection.jsx';
import TrendingGrantsSection from './dashboard/TrendingGrantsSection.jsx';
import NewsCarousel from './dashboard/NewsCarousel.jsx';
import PostDetailModal from './dashboard/PostDetailModal.jsx';
import QuickActions from './dashboard/QuickActions.jsx';
import StatsCard from './dashboard/StatsCard.jsx';

// Import the custom hook
import { useHelloCommunityPosts } from '../hooks/useHelloCommunityPosts.jsx';

// Custom hooks for data fetching
const useNews = () => {
    const [news, setNews] = useState([]);

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

    return news;
};

const useTrendingPosts = () => {
    const [trendingPosts, setTrendingPosts] = useState([]);

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

        // Set up real-time subscription for post reactions
        const channel = supabase.channel('trending-posts-reactions');
        
        channel
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'post_likes' 
            }, async (payload) => {
                const { eventType, new: newRecord, old: oldRecord } = payload;
                const affectedPostId = newRecord?.post_id || oldRecord?.post_id;
                
                if (!affectedPostId) return;
                
                // Check if this reaction is for one of our trending posts
                const affectedPost = trendingPosts.find(post => post.id === affectedPostId);
                if (!affectedPost) return;
                
                // Refetch reactions for this specific post
                try {
                    const { data: reactionsData } = await supabase
                        .from('post_likes')
                        .select('reaction_type')
                        .eq('post_id', affectedPostId);
                    
                    const reactionSummary = (reactionsData || []).reduce((acc, r) => {
                        const type = r.reaction_type || 'like';
                        acc[type] = (acc[type] || 0) + 1;
                        return acc;
                    }, {});
                    
                    const totalLikes = Object.values(reactionSummary).reduce((sum, count) => sum + count, 0);
                    
                    // Update the specific post in our trending posts
                    setTrendingPosts(currentPosts => 
                        currentPosts.map(post => 
                            post.id === affectedPostId 
                                ? {
                                    ...post,
                                    likes_count: totalLikes,
                                    reactions: {
                                        summary: Object.entries(reactionSummary).map(([type, count]) => ({ type, count }))
                                    }
                                }
                                : post
                        )
                    );
                } catch (error) {
                    console.error('Error updating post reactions:', error);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return trendingPosts;
};

const useUserData = (profile) => {
    const [organizationInfo, setOrganizationInfo] = useState(null);
    const [stats, setStats] = useState({
        savedGrants: 0,
        connections: 0,
        followers: 0,
        posts: 0
    });
    const [loading, setLoading] = useState(true);

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

    return { organizationInfo, stats, loading };
};

export default function HomeDashboard() {
    const { profile } = useOutletContext() || {};
    const navigate = useNavigate();
    const [selectedPost, setSelectedPost] = useState(null);
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);

    // First get user data including organization info
    const { organizationInfo, stats, loading } = useUserData(profile);
    
    // Then use hooks that depend on organization info
    const news = useNews();
    const trendingPosts = useTrendingPosts();
    const helloCommunityPosts = useHelloCommunityPosts(organizationInfo);

    const handlePostClick = (post) => {
        setSelectedPost(post);
        setIsPostModalOpen(true);
    };

    const handleViewMorePosts = () => {
        navigate('/profile/hello-world');
    };

    const handleViewMoreCommunity = () => {
        navigate('/profile/hello-community');
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
            <WelcomeBanner 
                profile={profile} 
                organizationInfo={organizationInfo} 
            />
            
            <ConnectionsAvatars currentUserProfile={profile} />
            
            <NewsCarousel news={news} />
            
            <TrendingPostsSection
                posts={trendingPosts}
                onViewMore={handleViewMorePosts}
                onPostClick={handlePostClick}
            />
            
            <HelloCommunitySection
                posts={helloCommunityPosts}
                onViewMore={handleViewMoreCommunity}
                onPostClick={handlePostClick}
                organizationInfo={organizationInfo}
            />
            
            <TrendingGrantsSection currentUserProfile={profile} />
            
            <PostDetailModal 
                post={selectedPost}
                isOpen={isPostModalOpen}
                onClose={() => {
                    setIsPostModalOpen(false);
                    setSelectedPost(null);
                }}
                currentUserProfile={profile}
            />
        </div>
    );
}