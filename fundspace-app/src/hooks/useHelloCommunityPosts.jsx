// src/hooks/useHelloCommunityPosts.jsx - CORRECTED: Fully batched version
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

// Organization channel configuration
const ORGANIZATION_CHANNELS = {
  'nonprofit': { dbChannel: 'nonprofit-community' },
  'foundation': { dbChannel: 'foundation-community' },
  'education': { dbChannel: 'education-community' },
  'healthcare': { dbChannel: 'healthcare-community' },
  'government': { dbChannel: 'government-community' },
  'religious': { dbChannel: 'religious-community' },
  'forprofit': { dbChannel: 'forprofit-community' }
};

const getOrgBaseType = (organizationType) => {
  if (!organizationType) return null;
  return organizationType.split('.')[0].toLowerCase();
};

const getChannelInfo = (channelType) => {
  return channelType && ORGANIZATION_CHANNELS[channelType] ? ORGANIZATION_CHANNELS[channelType] : null;
};

export const useHelloCommunityPosts = (organizationInfo) => {
    const [helloCommunityPosts, setHelloCommunityPosts] = useState([]);

    useEffect(() => {
        const fetchHelloCommunityPosts = async () => {
            // Return early if no organization info
            if (!organizationInfo?.type) {
                setHelloCommunityPosts([]);
                return;
            }

            try {
                const userOrgType = getOrgBaseType(organizationInfo.type);
                const channelInfo = getChannelInfo(userOrgType);
                
                if (!channelInfo) {
                    setHelloCommunityPosts([]);
                    return;
                }

                const dbChannel = channelInfo.dbChannel;

                // First try the RPC function like HelloCommunity does
                try {
                    const { data: rpcData, error: rpcError } = await supabase.rpc('get_community_posts_by_org_type', {
                        user_org_type: userOrgType, 
                        page_offset: 0, 
                        page_size: 10
                    });

                    if (!rpcError && rpcData && rpcData.length > 0) {
                        const transformedPosts = rpcData.map(post => ({
                            ...post,
                            profiles: {
                                id: post.profile_id,
                                full_name: post.profile_full_name,
                                avatar_url: post.profile_avatar_url,
                                title: post.profile_title,
                                organization_name: post.profile_organization_name,
                                role: post.profile_role
                            }
                        }));

                        // FIXED: Single batched query for all additional data
                        const profileIds = [...new Set(transformedPosts.map(post => post.profile_id))];
                        const postIds = transformedPosts.map(post => post.id);

                        const [membershipsData, reactionsData] = await Promise.all([
                            supabase
                                .from('organization_memberships')
                                .select('profile_id, organizations!inner(name)')
                                .in('profile_id', profileIds)
                                .order('joined_at', { ascending: false }),
                            supabase
                                .from('post_likes')
                                .select('post_id, reaction_type')
                                .in('post_id', postIds)
                        ]);

                        // Create lookup maps
                        const orgMap = {};
                        membershipsData.data?.forEach(membership => {
                            if (!orgMap[membership.profile_id]) {
                                orgMap[membership.profile_id] = membership.organizations.name;
                            }
                        });

                        const reactionsMap = {};
                        reactionsData.data?.forEach(reaction => {
                            if (!reactionsMap[reaction.post_id]) {
                                reactionsMap[reaction.post_id] = [];
                            }
                            reactionsMap[reaction.post_id].push(reaction);
                        });

                        const enrichedPosts = transformedPosts.map(post => {
                            const currentOrgName = orgMap[post.profile_id];
                            const postReactions = reactionsMap[post.id] || [];
                            const reactionSummary = postReactions.reduce((acc, r) => {
                                const type = r.reaction_type || 'like';
                                acc[type] = (acc[type] || 0) + 1;
                                return acc;
                            }, {});
                            return {
                                ...post,
                                profiles: {
                                    ...post.profiles,
                                    organization_name: currentOrgName || post.profiles.organization_name
                                },
                                reactions: {
                                    summary: Object.entries(reactionSummary).map(([type, count]) => ({ type, count }))
                                }
                            };
                        });
                        setHelloCommunityPosts(enrichedPosts);
                        return;
                    }
                } catch (rpcError) {
                    console.warn('⚠️ RPC function failed, falling back to direct query:', rpcError);
                }

                // FIXED: Fallback with complete batching instead of sequential queries
                const { data: postsData, error: postsError } = await supabase
                    .from('posts')
                    .select('*')
                    .eq('channel', dbChannel)
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (postsError) throw postsError;

                if (postsData && postsData.length > 0) {
                    // FIXED: Single parallel batch for all related data
                    const profileIds = [...new Set(postsData.map(post => post.profile_id))];
                    const postIds = postsData.map(post => post.id);

                    const [profilesResult, membershipsResult, reactionsResult] = await Promise.all([
                        supabase
                            .from('profiles')
                            .select('id, full_name, avatar_url, title, organization_name, role, organization_type')
                            .in('id', profileIds),
                        supabase
                            .from('organization_memberships')
                            .select('profile_id, organizations!inner(name)')
                            .in('profile_id', profileIds)
                            .order('joined_at', { ascending: false }),
                        supabase
                            .from('post_likes')
                            .select('post_id, reaction_type')
                            .in('post_id', postIds)
                    ]);

                    // Create efficient lookup maps
                    const profilesMap = {};
                    profilesResult.data?.forEach(profile => {
                        profilesMap[profile.id] = profile;
                    });

                    const orgMap = {};
                    membershipsResult.data?.forEach(membership => {
                        if (!orgMap[membership.profile_id]) {
                            orgMap[membership.profile_id] = membership.organizations.name;
                        }
                    });

                    const reactionsMap = {};
                    reactionsResult.data?.forEach(reaction => {
                        if (!reactionsMap[reaction.post_id]) {
                            reactionsMap[reaction.post_id] = [];
                        }
                        reactionsMap[reaction.post_id].push(reaction);
                    });

                    // Single pass enrichment
                    const enrichedPosts = postsData.map(post => {
                        const profile = profilesMap[post.profile_id];
                        const currentOrgName = orgMap[post.profile_id];
                        const postReactions = reactionsMap[post.id] || [];
                        const reactionSummary = postReactions.reduce((acc, r) => {
                            const type = r.reaction_type || 'like';
                            acc[type] = (acc[type] || 0) + 1;
                            return acc;
                        }, {});
                        return {
                            ...post,
                            profiles: {
                                ...profile,
                                organization_name: currentOrgName || profile?.organization_name
                            },
                            reactions: {
                                summary: Object.entries(reactionSummary).map(([type, count]) => ({ type, count }))
                            }
                        };
                    });
                    
                    setHelloCommunityPosts(enrichedPosts);
                } else {
                    setHelloCommunityPosts([]);
                }
            } catch (error) {
                console.error('Error fetching Hello Community posts:', error);
                setHelloCommunityPosts([]);
            }
        };

        fetchHelloCommunityPosts();

        // Set up real-time subscription only if we have valid organization info
        if (organizationInfo?.type && helloCommunityPosts.length > 0) {
            const userOrgType = getOrgBaseType(organizationInfo.type);
            const channelInfo = getChannelInfo(userOrgType);
            
            if (channelInfo) {
                const dbChannel = channelInfo.dbChannel;
                const channel = supabase.channel(`dashboard-community-posts-${dbChannel}`);
                
                channel
                    .on('postgres_changes', { 
                        event: '*', 
                        schema: 'public', 
                        table: 'post_likes',
                        filter: `post_id.in.(${helloCommunityPosts.map(p => p.id).join(',')})`
                    }, async (payload) => {
                        const { eventType, new: newRecord, old: oldRecord } = payload;
                        const affectedPostId = newRecord?.post_id || oldRecord?.post_id;
                        
                        if (!affectedPostId) return;
                        
                        // Check if this reaction is for one of our community posts
                        const affectedPost = helloCommunityPosts.find(post => post.id === affectedPostId);
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
                            
                            // Update the specific post in our community posts
                            setHelloCommunityPosts(currentPosts => 
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
                            console.error('Error updating community post reactions:', error);
                        }
                    })
                    .subscribe();

                return () => {
                    supabase.removeChannel(channel);
                };
            }
        }
    }, [organizationInfo?.type, organizationInfo?.id]); // Only depend on the type and id

    return helloCommunityPosts;
};