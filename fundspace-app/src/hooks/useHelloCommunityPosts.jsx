import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { getFeedPostsComplete } from '../utils/rpcClientFunctions';

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

export const useHelloCommunityPosts = (organizationInfo, profile) => {
    const [helloCommunityPosts, setHelloCommunityPosts] = useState([]);

    useEffect(() => {
      const loadPosts = async () => {
        if (!organizationInfo?.type || !organizationInfo.id) {
          setHelloCommunityPosts([]);
          return;
        }
    
        try {
          const baseType = organizationInfo.type.split('.')[0];
          const channelInfo = ORGANIZATION_CHANNELS[baseType];
          
          if (!channelInfo) {
            setHelloCommunityPosts([]);
            return;
          }
    
          const result = await getFeedPostsComplete(channelInfo.dbChannel, profile?.id, 10, 0);
          
          if (result?.posts) {
            setHelloCommunityPosts(result.posts);
          } else {
            setHelloCommunityPosts([]);
          }
        } catch (error) {
          console.error('Error loading community posts:', error);
          setHelloCommunityPosts([]);
        }
      };
    
      loadPosts();
    }, [organizationInfo?.type, organizationInfo?.id, profile?.id]);

    return helloCommunityPosts;
};