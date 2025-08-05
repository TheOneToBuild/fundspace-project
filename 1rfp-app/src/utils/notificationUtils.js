import { supabase } from '../supabaseClient';

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

export const createMentionNotifications = async (postId, mentions, actorId, isOrganizationPost = false) => {
  if (!mentions?.length) {
    return { success: true, count: 0 };
  }

  try {
    const processedUserIds = new Set([actorId]);
    const notificationPromises = [];

    const userMentions = mentions.filter(m => m.type === 'user');
    for (const mention of userMentions) {
      if (!processedUserIds.has(mention.id)) {
        processedUserIds.add(mention.id);

        const notificationData = {
          user_id: mention.id,
          actor_id: actorId,
          type: 'mention',
          is_read: false,
        };

        if (isOrganizationPost) {
          notificationData.organization_post_id = postId;
        } else {
          notificationData.post_id = postId;
        }

        notificationPromises.push(notificationData);
      }
    }

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

              const notificationData = {
                user_id: member.profile_id,
                actor_id: actorId,
                type: 'organization_mention',
                is_read: false,
              };

              if (isOrganizationPost) {
                notificationData.organization_post_id = postId;
              } else {
                notificationData.post_id = postId;
              }

              notificationPromises.push(notificationData);
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

export const processMentionsForNotifications = async (postId, content, actorId, isOrganizationPost = false) => {
  try {
    const mentions = extractMentionsFromHTML(content);
    if (mentions.length === 0) {
      return { success: true, count: 0 };
    }
    return await createMentionNotifications(postId, mentions, actorId, isOrganizationPost);
  } catch (error) {
    console.error('Error processing mentions for notifications:', error);
    return { success: false, error: error.message };
  }
};
