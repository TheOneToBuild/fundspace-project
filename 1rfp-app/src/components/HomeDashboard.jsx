import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { rssNewsService as newsService } from '../services/rssNewsService.js';

// ADD THESE IMPORTS
import { realtimeManager } from '../utils/realtimeManager.js';
import { getChannelInfo } from '../utils/channelUtils.js';

// Import all the smaller components
import WelcomeBanner from './dashboard/WelcomeBanner.jsx';
import ConnectionsAvatars from './dashboard/ConnectionsAvatars.jsx';
import TrendingPostsSection from './dashboard/TrendingPostsSection.jsx';
import HelloCommunitySection from './dashboard/HelloCommunitySection.jsx';
import TrendingGrantsSection from './dashboard/TrendingGrantsSection.jsx';
import NewsCarousel from './dashboard/NewsCarousel.jsx';
import PostDetailModal from './dashboard/PostDetailModal.jsx';
import GrantDetailModal from '../GrantDetailModal.jsx';
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

// UPDATED: useTrendingPosts hook with new channel manager
const useTrendingPosts = () => {
    const [trendingPosts, setTrendingPosts] = useState([]);
    const { profile } = useOutletContext() || {};

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

        // UPDATED: Use the new realtime manager with your channel system
        if (profile) {
            const subscription = realtimeManager.createSubscription(
                'hello-world', 
                supabase, 
                profile,
                {
                    onLikeChange: async (payload) => {
                        const { new: newRecord, old: oldRecord } = payload;
                        const affectedPostId = newRecord?.post_id || oldRecord?.post_id;
                        
                        if (!affectedPostId) return;
                        
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
                            console.warn('Error updating post reactions:', error);
                        }
                    }
                }
            );
        }

        // UPDATED: Clean removal using the manager
        return () => {
            if (profile) {
                realtimeManager.removeSubscription('hello-world', supabase);
            }
        };
    }, [profile?.id]);

    return trendingPosts;
};

const useTrendingGrants = () => {
    const [trendingGrants, setTrendingGrants] = useState([]);

    useEffect(() => {
        const fetchTrendingGrants = async () => {
            try {
                let grantsData, grantsError;
                
                const { data: grantsWithOrgs, error: orgsError } = await supabase
                    .from('grants')
                    .select(`
                        *,
                        organizations!inner (
                            id,
                            name,
                            image_url,
                            banner_image_url,
                            slug
                        )
                    `)
                    .limit(15);
                
                if (orgsError) {
                    const { data: grantsOnly, error: grantsOnlyError } = await supabase
                        .from('grants')
                        .select('*')
                        .limit(15);
                    grantsData = grantsOnly;
                    grantsError = grantsOnlyError;
                } else {
                    grantsData = grantsWithOrgs;
                    grantsError = orgsError;
                }

                if (grantsError || !grantsData || grantsData.length === 0) {
                    setTrendingGrants([]);
                    return;
                }

                const processedGrants = grantsData.map(grant => ({
                    id: grant.id,
                    title: grant.title || 'Untitled Grant',
                    description: grant.description || 'No description available',
                    foundation_name: grant.organizations?.name || grant.foundation_name || grant.funder_name || grant.organization_name || 'Unknown Foundation',
                    funder_name: grant.organizations?.name || grant.funder_name || grant.foundation_name || grant.organization_name || 'Unknown Foundation',
                    funding_amount_text: grant.funding_amount_text || grant.amount || 'Amount varies',
                    max_funding_amount: grant.max_funding_amount || grant.funding_amount || null,
                    due_date: grant.due_date || grant.deadline || null,
                    deadline: grant.deadline || grant.due_date || null,
                    location: grant.location || grant.geographic_focus || 'Location varies',
                    grant_type: grant.grant_type || grant.type || null,
                    created_at: grant.created_at,
                    save_count: 0,
                    application_url: grant.application_url || grant.url || grant.website_url || '#',
                    url: grant.url || grant.application_url || grant.website_url || '#',
                    eligible_organization_types: grant.eligible_organization_types || grant.taxonomy_codes || [],
                    organization: {
                        name: grant.organizations?.name || grant.foundation_name || grant.funder_name || grant.organization_name || 'Unknown Foundation',
                        image_url: grant.organizations?.image_url || grant.funder_logo_url || null,
                        banner_image_url: grant.organizations?.banner_image_url || null
                    },
                    funder_logo_url: grant.funder_logo_url || grant.organizations?.image_url || null
                }));

                try {
                    const grantIds = processedGrants.map(grant => grant.id);
                    const { data: bookmarksData, error: bookmarksError } = await supabase
                        .from('saved_grants')
                        .select('grant_id')
                        .in('grant_id', grantIds);

                    if (!bookmarksError && bookmarksData) {
                        const bookmarkCounts = {};
                        bookmarksData.forEach(bookmark => {
                            bookmarkCounts[bookmark.grant_id] = (bookmarkCounts[bookmark.grant_id] || 0) + 1;
                        });

                        processedGrants.forEach(grant => {
                            grant.save_count = bookmarkCounts[grant.id] || 0;
                        });

                        processedGrants.sort((a, b) => {
                            if (b.save_count !== a.save_count) {
                                return b.save_count - a.save_count;
                            }
                            return new Date(b.created_at) - new Date(a.created_at);
                        });
                    }
                } catch {
                    processedGrants.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                }

                setTrendingGrants(processedGrants.slice(0, 10));
            } catch {
                setTrendingGrants([]);
            }
        };

        fetchTrendingGrants();
    }, []);

    return { trendingGrants, setTrendingGrants };
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
    const [selectedGrant, setSelectedGrant] = useState(null);
    const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
    const [savedGrantIds, setSavedGrantIds] = useState(new Set());

    const { organizationInfo, stats, loading } = useUserData(profile);
    const news = useNews();
    const trendingPosts = useTrendingPosts();
    const { trendingGrants, setTrendingGrants } = useTrendingGrants();
    const helloCommunityPosts = useHelloCommunityPosts(organizationInfo);

    useEffect(() => {
        const fetchSavedGrants = async () => {
            if (!profile?.id) return;
            
            try {
                const { data: savedData, error } = await supabase
                    .from('saved_grants')
                    .select('grant_id')
                    .eq('user_id', profile.id);
                    
                if (error) throw error;
                setSavedGrantIds(new Set(savedData.map(g => g.grant_id)));
            } catch {
                // Handle error silently
            }
        };
        
        fetchSavedGrants();
    }, [profile?.id]);

    const handlePostClick = (post) => {
        setSelectedPost(post);
        setIsPostModalOpen(true);
    };

    const handleGrantClick = (grant) => {
        setSelectedGrant(grant);
        setIsGrantModalOpen(true);
    };

    const handleCloseGrantModal = () => {
        setIsGrantModalOpen(false);
        setSelectedGrant(null);
    };

    const handleSaveGrant = async (grantId) => {
        if (!profile?.id) return;
        
        try {
            setSavedGrantIds(prev => new Set(prev).add(grantId));
            setTrendingGrants(prev => prev.map(grant => 
                grant.id === grantId 
                    ? { ...grant, save_count: (grant.save_count || 0) + 1 }
                    : grant
            ));
            
            const { error } = await supabase
                .from('saved_grants')
                .insert({ 
                    user_id: profile.id, 
                    grant_id: grantId 
                });
                
            if (error) {
                setSavedGrantIds(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(grantId);
                    return newSet;
                });
                setTrendingGrants(prev => prev.map(grant => 
                    grant.id === grantId 
                        ? { ...grant, save_count: Math.max((grant.save_count || 1) - 1, 0) }
                        : grant
                ));
            }
        } catch {
            setSavedGrantIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(grantId);
                return newSet;
            });
            setTrendingGrants(prev => prev.map(grant => 
                grant.id === grantId 
                    ? { ...grant, save_count: Math.max((grant.save_count || 1) - 1, 0) }
                    : grant
            ));
        }
    };

    const handleUnsaveGrant = async (grantId) => {
        if (!profile?.id) return;
        
        try {
            setSavedGrantIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(grantId);
                return newSet;
            });
            
            setTrendingGrants(prev => prev.map(grant => 
                grant.id === grantId 
                    ? { ...grant, save_count: Math.max((grant.save_count || 1) - 1, 0) }
                    : grant
            ));
            
            const { error } = await supabase
                .from('saved_grants')
                .delete()
                .eq('user_id', profile.id)
                .eq('grant_id', grantId);
                
            if (error) {
                setSavedGrantIds(prev => new Set(prev).add(grantId));
                setTrendingGrants(prev => prev.map(grant => 
                    grant.id === grantId 
                        ? { ...grant, save_count: (grant.save_count || 0) + 1 }
                        : grant
                ));
            }
        } catch {
            setSavedGrantIds(prev => new Set(prev).add(grantId));
            setTrendingGrants(prev => prev.map(grant => 
                grant.id === grantId 
                    ? { ...grant, save_count: (grant.save_count || 0) + 1 }
                    : grant
            ));
        }
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
            
            <TrendingGrantsSection 
                currentUserProfile={profile} 
                onOpenGrantModal={handleGrantClick}
                trendingGrants={trendingGrants}
                onSaveGrant={handleSaveGrant}
                onUnsaveGrant={handleUnsaveGrant}
                savedGrantIds={savedGrantIds}
            />
            
            <PostDetailModal 
                post={selectedPost}
                isOpen={isPostModalOpen}
                onClose={() => {
                    setIsPostModalOpen(false);
                    setSelectedPost(null);
                }}
                currentUserProfile={profile}
            />

            <GrantDetailModal
                grant={selectedGrant}
                isOpen={isGrantModalOpen}
                onClose={handleCloseGrantModal}
                session={{ user: profile }}
                isSaved={selectedGrant ? savedGrantIds.has(selectedGrant.id) : false}
                onSave={handleSaveGrant}
                onUnsave={handleUnsaveGrant}
            />
        </div>
    );
}