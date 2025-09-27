// src/components/HomeDashboard.jsx - FULLY OPTIMIZED: All direct queries wrapped with optimizer
import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { optimizedSupabaseQuery } from '../utils/apiRequestOptimizer'; // ✅ CRITICAL IMPORT
import { rssNewsService as newsService } from '../services/rssNewsService.js';
import { getOrganizationInfoForDashboard } from '../utils/membershipQueries.js';
import globalDataManager from '../utils/globalDataManager';

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

// OPTIMIZED: Use globalDataManager for trending posts
const useOptimizedTrendingPosts = () => {
    const [trendingPosts, setTrendingPosts] = useState([]);

    useEffect(() => {
        const fetchTrendingPosts = async () => {
            try {
                const postsData = await globalDataManager.getPostsByChannel('hello-world', 10);
                setTrendingPosts(postsData);
            } catch {
                setTrendingPosts([]);
            }
        };

        fetchTrendingPosts();
    }, []);

    return trendingPosts;
};

// ✅ OPTIMIZED: Wrap all direct grants and organizations queries
const useTrendingGrants = () => {
    const [trendingGrants, setTrendingGrants] = useState([]);

    useEffect(() => {
        const fetchTrendingGrants = async () => {
            try {
                // ✅ BEFORE (Direct query causing 3+ grants API calls):
                // const { data: grantsData, error: grantsError } = await supabase
                //     .from('grants')
                //     .select('*')
                //     .order('id', { ascending: false })
                //     .limit(15);

                // ✅ AFTER (Optimized grants query):
                const optimizedGrantsQuery = optimizedSupabaseQuery(
                    supabase
                        .from('grants')
                        .select('*')
                        .order('id', { ascending: false })
                        .limit(15),
                    'grants_single',
                    { grantIds: [] }
                );
                
                const { data: grantsData, error: grantsError } = await optimizedGrantsQuery;
                
                if (grantsError) {
                    console.error('Error fetching grants:', grantsError);
                    setTrendingGrants([]);
                    return;
                }

                if (!grantsData || grantsData.length === 0) {
                    setTrendingGrants([]);
                    return;
                }

                const orgIds = [...new Set(grantsData.map(g => g.organization_id).filter(Boolean))];
                
                let orgsData = [];
                if (orgIds.length > 0) {
                    // ✅ BEFORE (Direct organizations query):
                    // const { data: organizationsData } = await supabase
                    //     .from('organizations')
                    //     .select('id, name, image_url, banner_image_url, slug')
                    //     .in('id', orgIds);

                    // ✅ AFTER (Optimized organizations query):
                    const optimizedOrgsQuery = optimizedSupabaseQuery(
                        supabase
                            .from('organizations')
                            .select('id, name, image_url, banner_image_url, slug')
                            .in('id', orgIds),
                        'organizations_single',
                        { orgIds }
                    );
                    
                    const { data: organizationsData } = await optimizedOrgsQuery;
                    orgsData = organizationsData || [];
                }

                const processedGrants = grantsData.map(grant => {
                    const orgData = orgsData.find(o => o.id === grant.organization_id);
                    
                    return {
                        id: grant.id,
                        title: grant.title || 'Untitled Grant',
                        description: grant.description || 'No description available',
                        foundation_name: orgData?.name || grant.foundation_name || grant.funder_name || grant.organization_name || 'Unknown Foundation',
                        funder_name: orgData?.name || grant.funder_name || grant.foundation_name || grant.organization_name || 'Unknown Foundation',
                        funding_amount_text: grant.funding_amount_text || grant.amount || 'Amount varies',
                        max_funding_amount: grant.max_funding_amount || grant.funding_amount || null,
                        due_date: grant.due_date || grant.deadline || null,
                        deadline: grant.deadline || grant.due_date || null,
                        location: grant.location || grant.geographic_focus || 'Location varies',
                        grant_type: grant.grant_type || grant.type || null,
                        created_at: grant.date_added || grant.last_updated || new Date().toISOString(),
                        save_count: 0,
                        application_url: grant.application_url || grant.url || grant.website_url || '#',
                        url: grant.url || grant.application_url || grant.website_url || '#',
                        eligible_organization_types: grant.eligible_organization_types || grant.taxonomy_codes || [],
                        organization: {
                            name: orgData?.name || grant.foundation_name || grant.funder_name || grant.organization_name || 'Unknown Foundation',
                            image_url: orgData?.image_url || grant.funder_logo_url || null,
                            banner_image_url: orgData?.banner_image_url || null
                        },
                        funder_logo_url: grant.funder_logo_url || orgData?.image_url || null
                    };
                });

                try {
                    const grantIds = processedGrants.map(grant => grant.id);
                    
                    // ✅ BEFORE (Direct saved_grants query):
                    // const { data: bookmarksData, error: bookmarksError } = await supabase
                    //     .from('saved_grants')
                    //     .select('grant_id')
                    //     .in('grant_id', grantIds);

                    // ✅ AFTER (Optimized saved_grants query):
                    const optimizedSavedQuery = optimizedSupabaseQuery(
                        supabase
                            .from('saved_grants')
                            .select('grant_id')
                            .in('grant_id', grantIds),
                        'saved_grants_single',
                        { userId: null, grantIds } // No specific user, just getting counts
                    );
                    
                    const { data: bookmarksData, error: bookmarksError } = await optimizedSavedQuery;

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
                            return b.id - a.id;
                        });
                    }
                } catch {
                    processedGrants.sort((a, b) => b.id - a.id);
                }

                setTrendingGrants(processedGrants.slice(0, 10));
            } catch (error) {
                console.error('Error fetching trending grants:', error);
                setTrendingGrants([]);
            }
        };

        fetchTrendingGrants();
    }, []);

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

export default function HomeDashboard() {
    const { 
        profile,
        // CRITICAL: Get batched data from ProfilePage context
        pageData,           // Batched profiles, likes, organizations  
        postsLikesData,     // Batched post likes data
        handlePostLike,     // Centralized like handler
        handleSaveGrant,    // From ProfilePage
        handleUnsaveGrant,  // From ProfilePage
        savedGrants         // From ProfilePage
    } = useOutletContext() || {};
    
    const navigate = useNavigate();
    
    const [selectedPost, setSelectedPost] = useState(null);
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [selectedGrant, setSelectedGrant] = useState(null);
    const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);

    const { organizationInfo, loading, refreshOrganizationData } = useUserData(profile);
    const news = useNews();
    const trendingPosts = useOptimizedTrendingPosts();
    const { trendingGrants, setTrendingGrants } = useTrendingGrants();
    const helloCommunityPosts = useHelloCommunityPosts(organizationInfo);

    // CRITICAL: Create enhanced pageData with all batched info
    const enhancedPageData = React.useMemo(() => ({
        ...pageData,
        postLikes: postsLikesData || pageData?.postLikes || {},
        profiles: pageData?.profiles || {},
        orgMemberships: pageData?.orgMemberships || {},
        organizations: pageData?.organizations || {}
    }), [pageData, postsLikesData]);

    const savedGrantIds = React.useMemo(() => {
        return new Set(savedGrants?.map(g => g.id) || []);
    }, [savedGrants]);

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
                    ? { ...grant, save_count: (grant.save_count || 0) + 1 }
                    : grant
            ));
            
            // Use ProfilePage handler if available
            if (handleSaveGrant) {
                await handleSaveGrant(grantId);
            } else {
                // Direct mutation (doesn't need optimization wrapper)
                const { error } = await supabase
                    .from('saved_grants')
                    .insert({ 
                        user_id: profile.id, 
                        grant_id: grantId 
                    });
                    
                if (error) {
                    setTrendingGrants(prev => prev.map(grant => 
                        grant.id === grantId 
                            ? { ...grant, save_count: Math.max((grant.save_count || 1) - 1, 0) }
                            : grant
                    ));
                }
            }
        } catch {
            setTrendingGrants(prev => prev.map(grant => 
                grant.id === grantId 
                    ? { ...grant, save_count: Math.max((grant.save_count || 1) - 1, 0) }
                    : grant
            ));
        }
    };

    const handleUnsaveGrantLocal = async (grantId) => {
        if (!profile?.id) return;
        
        try {
            setTrendingGrants(prev => prev.map(grant => 
                grant.id === grantId 
                    ? { ...grant, save_count: Math.max((grant.save_count || 1) - 1, 0) }
                    : grant
            ));
            
            // Use ProfilePage handler if available
            if (handleUnsaveGrant) {
                await handleUnsaveGrant(grantId);
            } else {
                // Direct mutation (doesn't need optimization wrapper)
                const { error } = await supabase
                    .from('saved_grants')
                    .delete()
                    .eq('user_id', profile.id)
                    .eq('grant_id', grantId);
                    
                if (error) {
                    setTrendingGrants(prev => prev.map(grant => 
                        grant.id === grantId 
                            ? { ...grant, save_count: (grant.save_count || 0) + 1 }
                            : grant
                    ));
                }
            }
        } catch {
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
            
            {/* CRITICAL: Pass enhancedPageData to ALL child components */}
            <TrendingPostsSection
                posts={trendingPosts}
                onViewMore={handleViewMorePosts}
                onPostClick={handlePostClick}
                pageData={enhancedPageData}
                postsLikesData={postsLikesData}
                onPostLike={handlePostLike}
            />
            
            <HelloCommunitySection
                posts={helloCommunityPosts}
                onViewMore={handleViewMoreCommunity}
                onPostClick={handlePostClick}
                organizationInfo={organizationInfo}
                pageData={enhancedPageData}
                postsLikesData={postsLikesData}
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
                postsLikesData={postsLikesData}
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