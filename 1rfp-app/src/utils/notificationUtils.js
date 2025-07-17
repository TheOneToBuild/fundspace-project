// src/utils/notificationUtils.js - Fixed Version
import { supabase } from '../supabaseClient';

/**
 * Extract mentions directly from HTML content
 */
const extractMentionsFromHTML = (htmlContent) => {
  if (!htmlContent) return [];
  
  console.log('🔍 Extracting mentions from HTML:', htmlContent);
  
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  
  const mentionSpans = tempDiv.querySelectorAll('span.mention, span[data-type], span[data-id]');
  const mentions = [];
  
  mentionSpans.forEach(span => {
    const id = span.getAttribute('data-id');
    const label = span.getAttribute('data-label');
    const type = span.getAttribute('data-type');
    
    console.log('🔍 Found mention span:', { id, label, type, element: span });
    
    if (id && type) {
      mentions.push({
        id,
        displayName: label || span.textContent.replace('@', ''),
        type
      });
    }
  });
  
  console.log('✅ Extracted mentions:', mentions);
  return mentions;
};

/**
 * Create notifications for mentioned users and organization members
 */
export const createMentionNotifications = async (postId, mentions, actorId) => {
  try {
    console.log('🔔 Creating mention notifications for post:', postId);
    console.log('📋 Mentions to process:', mentions);
    console.log('👤 Actor ID:', actorId);
    
    if (!mentions || mentions.length === 0) {
      console.log('ℹ️ No mentions to process');
      return { success: true, count: 0 };
    }
    
    const notifications = [];
    const processedUserIds = new Set();
    
    for (const mention of mentions) {
      console.log(`🔄 Processing mention:`, mention);
      
      if (mention.type === 'user') {
        const mentionedUserId = mention.id;
        
        if (mentionedUserId === actorId) {
          console.log('⏭️ Skipping self-mention notification');
          continue;
        }
        
        if (processedUserIds.has(mentionedUserId)) {
          console.log('⏭️ Skipping duplicate user mention notification');
          continue;
        }
        
        processedUserIds.add(mentionedUserId);
        
        // Verify the user exists
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('id', mentionedUserId)
          .single();
          
        if (profileError || !profileData) {
          console.error('❌ Could not find mentioned user profile:', mentionedUserId, profileError);
          continue;
        }
        
        console.log('✅ Found user profile:', profileData);
        
        notifications.push({
          user_id: mentionedUserId,
          actor_id: actorId,
          type: 'mention',
          post_id: postId,
          is_read: false
        });
        
        console.log('✅ Prepared user mention notification for:', mentionedUserId);
        
      } else if (mention.type === 'organization') {
        const [orgType, orgId] = mention.id.split('-');
        
        if (!orgId) {
          console.warn('⚠️ Invalid organization mention format:', mention.id);
          continue;
        }
        
        console.log(`🏢 Processing organization mention: ${orgType}-${orgId}`);
        
        // Get organization members
        const { data: members, error: membersError } = await supabase
          .from('organization_memberships')
          .select(`
            profile_id,
            profiles!organization_memberships_profile_id_fkey(
              id,
              full_name,
              email_alerts_enabled
            )
          `)
          .eq('organization_id', parseInt(orgId))
          .eq('organization_type', orgType);
        
        if (membersError) {
          console.error('❌ Error fetching organization members:', membersError);
          continue;
        }
        
        if (!members || members.length === 0) {
          console.log('ℹ️ No members found for organization:', mention.id);
          continue;
        }
        
        console.log(`👥 Found ${members.length} members for ${orgType}-${orgId}:`, members);
        
        for (const member of members) {
          const memberId = member.profile_id;
          
          if (memberId === actorId) {
            console.log('⏭️ Skipping organization mention notification for actor');
            continue;
          }
          
          if (processedUserIds.has(memberId)) {
            console.log('⏭️ Skipping duplicate organization member notification');
            continue;
          }
          
          processedUserIds.add(memberId);
          
          notifications.push({
            user_id: memberId,
            actor_id: actorId,
            type: 'organization_mention',
            post_id: postId,
            is_read: false
          });
          
          console.log('✅ Prepared organization mention notification for:', memberId);
        }
      }
    }
    
    console.log('📝 Final notifications to insert:', notifications);
    
    // Insert notifications
    if (notifications.length > 0) {
      const { data: insertedNotifications, error: insertError } = await supabase
        .from('notifications')
        .insert(notifications)
        .select();
      
      if (insertError) {
        console.error('❌ Error inserting mention notifications:', insertError);
        console.error('❌ Full error details:', insertError);
        throw insertError;
      }
      
      console.log(`🎉 Successfully created ${notifications.length} mention notifications:`, insertedNotifications);
    } else {
      console.log('ℹ️ No mention notifications to create');
    }
    
    return { success: true, count: notifications.length };
    
  } catch (error) {
    console.error('💥 Error creating mention notifications:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Extract mentions from post content and create notifications
 */
export const processMentionsForNotifications = async (postId, content, actorId) => {
  try {
    console.log('🔍 Processing mentions for notifications...');
    console.log('📄 Post ID:', postId);
    console.log('📝 Content:', content);
    console.log('👤 Actor ID:', actorId);
    
    // Extract mentions from HTML content
    const mentions = extractMentionsFromHTML(content);
    
    if (mentions.length === 0) {
      console.log('ℹ️ No mentions found in post content');
      return { success: true, count: 0 };
    }
    
    console.log(`📝 Found ${mentions.length} mentions in post:`, mentions);
    
    // Create notifications
    return await createMentionNotifications(postId, mentions, actorId);
    
  } catch (error) {
    console.error('💥 Error processing mentions for notifications:', error);
    return { success: false, error: error.message };
  }
};