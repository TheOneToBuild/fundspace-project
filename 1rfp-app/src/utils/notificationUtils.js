// src/utils/notificationUtils.js

import { supabase } from '../supabaseClient';

/**
 * Extracts user and organization mentions from HTML content.
 * @param {string} htmlContent - The HTML content of the post.
 * @returns {Array<Object>} An array of mention objects, each with id, displayName, and type.
 */
const extractMentionsFromHTML = (htmlContent) => {
  if (!htmlContent) {
    return [];
  }

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;

  const mentionNodes = tempDiv.querySelectorAll('span.mention[data-id][data-type]');

  return Array.from(mentionNodes).map(node => ({
    id: node.getAttribute('data-id'),
    displayName: node.getAttribute('data-label') || node.textContent.replace('@', ''),
    type: node.getAttribute('data-type'),
  }));
};

/**
 * Creates notification records in the database for mentioned users.
 * @param {string} postId - The ID of the post containing the mentions.
 * @param {Array<Object>} mentions - An array of mention objects from extractMentionsFromHTML.
 * @param {string} actorId - The ID of the user who created the post.
 * @returns {Promise<{success: boolean, count: number, error?: string}>} An object indicating success and the number of notifications created.
 */
export const createMentionNotifications = async (postId, mentions, actorId) => {
  if (!mentions?.length) {
    return { success: true, count: 0 };
  }

  try {
    const processedUserIds = new Set([actorId]);
    const notificationPromises = [];

    // Process user mentions first to populate processedUserIds
    const userMentions = mentions.filter(m => m.type === 'user');
    for (const mention of userMentions) {
      if (!processedUserIds.has(mention.id)) {
        processedUserIds.add(mention.id);
        notificationPromises.push({
          user_id: mention.id,
          actor_id: actorId,
          type: 'mention',
          post_id: postId,
          is_read: false,
        });
      }
    }

    // Process organization mentions
    const organizationMentions = mentions.filter(m => m.type === 'organization');
    if (organizationMentions.length > 0) {
      const orgMemberQueries = organizationMentions.map(mention => {
        const [orgType, orgId] = mention.id.split('-');
        return supabase
          .from('organization_memberships')
          .select('profile_id')
          .eq('organization_id', parseInt(orgId))
          .eq('organization_type', orgType);
      });

      const results = await Promise.all(orgMemberQueries);

      results.forEach(result => {
        if (result.data) {
          result.data.forEach(member => {
            if (!processedUserIds.has(member.profile_id)) {
              processedUserIds.add(member.profile_id);
              notificationPromises.push({
                user_id: member.profile_id,
                actor_id: actorId,
                type: 'organization_mention',
                post_id: postId,
                is_read: false,
              });
            }
          });
        }
      });
    }

    if (notificationPromises.length > 0) {
      const { error } = await supabase.from('notifications').insert(notificationPromises);
      if (error) throw error;
    }

    return { success: true, count: notificationPromises.length };

  } catch (error) {
    console.error('Error creating mention notifications:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Processes a post's content to find mentions and create notifications.
 * @param {string} postId - The ID of the post.
 * @param {string} content - The HTML content of the post.
 * @param {string} actorId - The ID of the user who created the post.
 * @returns {Promise<{success: boolean, count: number, error?: string}>} An object indicating success and count of created notifications.
 */
export const processMentionsForNotifications = async (postId, content, actorId) => {
  try {
    const mentions = extractMentionsFromHTML(content);
    if (mentions.length === 0) {
      return { success: true, count: 0 };
    }
    return await createMentionNotifications(postId, mentions, actorId);
  } catch (error) {
    console.error('Error processing mentions for notifications:', error);
    return { success: false, error: error.message };
  }
};