import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

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
                            },
                            reactions: {
                                summary: post.reaction_summary || []
                            }
                        }));

                        setHelloCommunityPosts(transformedPosts);
                        return;
                    }
                } catch (rpcError) {
                    console.warn('RPC function failed, falling back to direct query:', rpcError);
                }

                const dbChannel = channelInfo.dbChannel;
                
                const { data: postsData, error: postsError } = await supabase
                    .from('posts')
                    .select(`
                        *,
                        profiles!inner (
                            id,
                            full_name,
                            avatar_url,
                            title,
                            organization_name,
                            role,
                            organization_type
                        )
                    `)
                    .eq('channel', dbChannel)
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (postsError) throw postsError;

                if (postsData && postsData.length > 0) {
                    const postIds = postsData.map(post => post.id);

                    const { data: reactionsData } = await supabase
                        .from('post_likes')
                        .select('post_id, reaction_type')
                        .in('post_id', postIds);

                    const reactionsMap = {};
                    reactionsData?.forEach(reaction => {
                        if (!reactionsMap[reaction.post_id]) {
                            reactionsMap[reaction.post_id] = [];
                        }
                        reactionsMap[reaction.post_id].push(reaction);
                    });

                    const enrichedPosts = postsData.map(post => {
                        const postReactions = reactionsMap[post.id] || [];
                        const reactionSummary = postReactions.reduce((acc, r) => {
                            const type = r.reaction_type || 'like';
                            acc[type] = (acc[type] || 0) + 1;
                            return acc;
                        }, {});
                        
                        return {
                            ...post,
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
                        
                        const affectedPost = helloCommunityPosts.find(post => post.id === affectedPostId);
                        if (!affectedPost) return;
                        
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
    }, [organizationInfo?.type, organizationInfo?.id]);

    return helloCommunityPosts;
};