import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { getDashboardData } from '../utils/rpcClientFunctions';
import { rssNewsService as newsService } from '../services/rssNewsService.js';
import { getOrganizationInfoForDashboard } from '../utils/membershipQueries.js';

import WelcomeBanner from './dashboard/WelcomeBanner.jsx';
import ConnectionsAvatars from './dashboard/ConnectionsAvatars.jsx';
import TrendingPostsSection from './dashboard/TrendingPostsSection.jsx';
import HelloCommunitySection from './dashboard/HelloCommunitySection.jsx';
import TrendingGrantsSection from './dashboard/TrendingGrantsSection.jsx';
import NewsCarousel from './dashboard/NewsCarousel.jsx';
import PostDetailModal from './dashboard/PostDetailModal.jsx';
import GrantDetailModal from '../GrantDetailModal.jsx';

import { useHelloCommunityPosts } from '../hooks/useHelloCommunityPosts.jsx';

const useNews = () => {
    const [news, setNews] = useState([]);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const newsData = await newsService.getGlobalBreakingNews();
                setNews(Array.isArray(newsData) ? newsData.slice(0, 12) : []);
            } catch {
                setNews([]);
            }
        };
        fetchNews();
    }, []);

    return news;
};

const useOptimizedTrendingPosts = (dashboardData) => {
    return dashboardData?.posts || [];
};

const useTrendingGrants = (dashboardData) => {
    const [trendingGrants, setTrendingGrants] = useState([]);

    useEffect(() => {
        if (dashboardData?.recent_grants) {
            const processedGrants = dashboardData.recent_grants.map(grant => ({
                id: grant.id,
                title: grant.title || 'Untitled Grant',
                description: grant.description || 'No description available',
                foundation_name: grant.organization?.name || 'Unknown Foundation',
                funder_name: grant.organization?.name || 'Unknown Foundation',
                funding_amount_text: grant.funding_amount_text || 'Amount varies',
                max_funding_amount: grant.max_funding_amount || null,
                due_date: grant.deadline || null,
                deadline: grant.deadline || null,
                location: 'Location varies',
                grant_type: grant.grant_type || null,
                created_at: grant.date_added || new Date().toISOString(),
                save_count: grant.save_count || 0,
                application_url: grant.application_url || '#',
                url: grant.application_url || '#',
                eligible_organization_types: grant.eligible_organization_types || [],
                organization: {
                    name: grant.organization?.name || 'Unknown Foundation',
                    image_url: grant.organization?.logo_url || null,
                    banner_image_url: null
                },
                funder_logo_url: grant.organization?.logo_url || null,
                is_saved: grant.is_saved || false
            }));

            setTrendingGrants(processedGrants);
        }
    }, [dashboardData]);

    return { trendingGrants, setTrendingGrants };
};

const useUserData = (profile) => {
    const [organizationInfo, setOrganizationInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const refreshOrganizationData = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    useEffect(() => {
        const fetchUserData = async () => {
            if (!profile?.id) return;
            setLoading(true);
            try {
                const orgData = await getOrganizationInfoForDashboard(profile.id);
                setOrganizationInfo(orgData);
            } catch (err) {
                console.error('Error fetching user organization data:', err);
                setOrganizationInfo(null);
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, [profile?.id, refreshTrigger]);

    return { organizationInfo, loading, refreshOrganizationData };
};

const useDashboardData = (profile) => {
    const [dashboardData, setDashboardData] = useState(null);
    const [rpcLoading, setRpcLoading] = useState(false);

    useEffect(() => {
        const loadDashboardData = async () => {
            if (!profile?.id) return;

            setRpcLoading(true);
            try {
                console.log('Loading dashboard with single RPC call...');
                
                const data = await getDashboardData(profile.id);
                
                setDashboardData(data);
                
                console.log('Dashboard RPC loaded:', {
                    posts: data?.posts?.length || 0,
                    grants: data?.recent_grants?.length || 0,
                    organizations: data?.trending_organizations?.length || 0
                });
                
            } catch (error) {
                console.error('Error loading dashboard RPC:', error);
            } finally {
                setRpcLoading(false);
            }
        };

        loadDashboardData();
    }, [profile?.id]);

    return { dashboardData, rpcLoading };
};

export default function HomeDashboard() {
    const { 
        profile,
        pageData,
        postsLikesData,
        handlePostLike,
        handleSaveGrant,
        handleUnsaveGrant,
        savedGrants
    } = useOutletContext() || {};
    
    const navigate = useNavigate();
    
    const [selectedPost, setSelectedPost] = useState(null);
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [selectedGrant, setSelectedGrant] = useState(null);
    const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);

    const { dashboardData, rpcLoading } = useDashboardData(profile);
    
    const { organizationInfo, loading, refreshOrganizationData } = useUserData(profile);
    const news = useNews();
    
    const trendingPosts = useOptimizedTrendingPosts(dashboardData);
    const { trendingGrants, setTrendingGrants } = useTrendingGrants(dashboardData);
    const helloCommunityPosts = useHelloCommunityPosts(organizationInfo);

    const enhancedPageData = React.useMemo(() => {
        const rpcPageData = {
            profiles: {},
            postLikes: {},
            organizations: {},
            orgMemberships: {}
        };

        if (dashboardData?.posts) {
            dashboardData.posts.forEach(post => {
                if (post.profile) {
                    rpcPageData.profiles[post.profile.id] = post.profile;
                }
                rpcPageData.postLikes[post.id] = { 
                    isLiked: post.is_liked,
                    likesCount: post.likes_count 
                };
            });
        }

        if (dashboardData?.trending_organizations) {
            dashboardData.trending_organizations.forEach(org => {
                rpcPageData.organizations[org.id] = org;
            });
        }

        return {
            ...pageData,
            ...rpcPageData,
            postLikes: { ...rpcPageData.postLikes, ...(postsLikesData || pageData?.postLikes || {}) },
            profiles: { ...rpcPageData.profiles, ...(pageData?.profiles || {}) },
            orgMemberships: pageData?.orgMemberships || {},
            organizations: { ...rpcPageData.organizations, ...(pageData?.organizations || {}) }
        };
    }, [pageData, postsLikesData, dashboardData]);

    const savedGrantIds = React.useMemo(() => {
        const rpcSavedIds = new Set(
            (dashboardData?.recent_grants || [])
                .filter(g => g.is_saved)
                .map(g => g.id)
        );
        const contextSavedIds = new Set(savedGrants?.map(g => g.id) || []);
        
        return new Set([...rpcSavedIds, ...contextSavedIds]);
    }, [savedGrants, dashboardData]);

    useEffect(() => {
        window.refreshDashboardOrganizationData = refreshOrganizationData;
        return () => {
            delete window.refreshDashboardOrganizationData;
        };
    }, [refreshOrganizationData]);

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

    const handleSaveGrantLocal = async (grantId) => {
        if (!profile?.id) return;
        
        try {
            setTrendingGrants(prev => prev.map(grant => 
                grant.id === grantId 
                    ? { ...grant, save_count: (grant.save_count || 0) + 1, is_saved: true }
                    : grant
            ));
            
            if (handleSaveGrant) {
                await handleSaveGrant(grantId);
            } else {
                const { error } = await supabase
                    .from('saved_grants')
                    .insert({ 
                        user_id: profile.id, 
                        grant_id: grantId 
                    });
                    
                if (error) {
                    setTrendingGrants(prev => prev.map(grant => 
                        grant.id === grantId 
                            ? { ...grant, save_count: Math.max((grant.save_count || 1) - 1, 0), is_saved: false }
                            : grant
                    ));
                }
            }
        } catch {
            setTrendingGrants(prev => prev.map(grant => 
                grant.id === grantId 
                    ? { ...grant, save_count: Math.max((grant.save_count || 1) - 1, 0), is_saved: false }
                    : grant
            ));
        }
    };

    const handleUnsaveGrantLocal = async (grantId) => {
        if (!profile?.id) return;
        
        try {
            setTrendingGrants(prev => prev.map(grant => 
                grant.id === grantId 
                    ? { ...grant, save_count: Math.max((grant.save_count || 1) - 1, 0), is_saved: false }
                    : grant
            ));
            
            if (handleUnsaveGrant) {
                await handleUnsaveGrant(grantId);
            } else {
                const { error } = await supabase
                    .from('saved_grants')
                    .delete()
                    .eq('user_id', profile.id)
                    .eq('grant_id', grantId);
                    
                if (error) {
                    setTrendingGrants(prev => prev.map(grant => 
                        grant.id === grantId 
                            ? { ...grant, save_count: (grant.save_count || 0) + 1, is_saved: true }
                            : grant
                    ));
                }
            }
        } catch {
            setTrendingGrants(prev => prev.map(grant => 
                grant.id === grantId 
                    ? { ...grant, save_count: (grant.save_count || 0) + 1, is_saved: true }
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

    if (loading || rpcLoading) {
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
            {process.env.NODE_ENV === 'development' && dashboardData && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="text-green-800 font-semibold mb-2">RPC Optimization Active</h3>
                    <p className="text-green-600 text-sm">
                        Dashboard loaded with 1 RPC call instead of 15+ individual API calls.
                        Posts: {dashboardData.posts?.length || 0}, Grants: {dashboardData.recent_grants?.length || 0}, 
                        Organizations: {dashboardData.trending_organizations?.length || 0}
                    </p>
                </div>
            )}

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
                pageData={enhancedPageData}
                postsLikesData={enhancedPageData.postLikes}
                onPostLike={handlePostLike}
            />
            
            <HelloCommunitySection
                posts={helloCommunityPosts}
                onViewMore={handleViewMoreCommunity}
                onPostClick={handlePostClick}
                organizationInfo={organizationInfo}
                pageData={enhancedPageData}
                postsLikesData={enhancedPageData.postLikes}
                onPostLike={handlePostLike}
            />
            
            <TrendingGrantsSection 
                currentUserProfile={profile} 
                onOpenGrantModal={handleGrantClick}
                trendingGrants={trendingGrants}
                onSaveGrant={handleSaveGrantLocal}
                onUnsaveGrant={handleUnsaveGrantLocal}
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
                pageData={enhancedPageData}
                postsLikesData={enhancedPageData.postLikes}
                onPostLike={handlePostLike}
            />

            <GrantDetailModal
                grant={selectedGrant}
                isOpen={isGrantModalOpen}
                onClose={handleCloseGrantModal}
                session={{ user: profile }}
                isSaved={selectedGrant ? savedGrantIds.has(selectedGrant.id) : false}
                onSave={handleSaveGrantLocal}
                onUnsave={handleUnsaveGrantLocal}
            />
        </div>
    );
}