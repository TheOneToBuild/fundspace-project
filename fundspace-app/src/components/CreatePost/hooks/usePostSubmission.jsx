// src/components/CreatePost/hooks/usePostSubmission.jsx
import { useState } from 'react';
import { supabase } from '../../../supabaseClient';
import { extractMentionsFromEditor, getDbChannelFromOrgType } from '../utils/postDataHelpers';
import { processMentionsForNotifications } from '../../../utils/notificationUtils';

export const usePostSubmission = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const submitPost = async ({
    editor,
    profile,
    selectedTags,
    imageUrls,
    channel,
    organizationId,
    organizationType,
    isOrganizationPost,
    onSuccess
  }) => {
    if (!profile) {
      setError('You must be logged in to post.');
      return;
    }

    const editorTextContent = editor.getText().trim();
    if (!editorTextContent && imageUrls.length === 0) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to post.');
        return;
      }

      // Get HTML content from Tiptap
      const editorHtmlContent = editor.getHTML();

      // Extract mentions from Tiptap JSON for database storage
      const mentionsForStorage = extractMentionsFromEditor(editor.getJSON());

      // Prepare post data based on post type
      let postData;
      const postsTable = isOrganizationPost ? 'organization_posts' : 'posts';
      
      if (isOrganizationPost) {
        // Organization post data
        postData = {
          content: editorHtmlContent.trim() || '',
          organization_id: organizationId,
          organization_type: organizationType,
          created_by_user_id: user.id,
          image_urls: imageUrls.length > 0 ? imageUrls : null,
          tags: selectedTags.length > 0 ? JSON.stringify(selectedTags) : null,
          mentions: mentionsForStorage.length > 0 ? JSON.stringify(mentionsForStorage) : null,
        };
      } else {
        // Regular post data with proper channel
        let finalChannel = channel;
        if (channel !== 'hello-world' && organizationType) {
          finalChannel = getDbChannelFromOrgType(organizationType);
        }
        
        postData = {
          content: editorHtmlContent.trim() || '',
          user_id: user.id,
          profile_id: profile.id,
          image_urls: imageUrls.length > 0 ? imageUrls : null,
          image_url: imageUrls.length === 1 ? imageUrls[0] : null,
          tags: selectedTags.length > 0 ? JSON.stringify(selectedTags) : null,
          channel: finalChannel,
          mentions: mentionsForStorage.length > 0 ? JSON.stringify(mentionsForStorage) : null,
          organization_type: organizationType || profile?.organization_type || null
        };
      }

      const { data: newPost, error: postError } = await supabase
        .from(postsTable)
        .insert(postData)
        .select()
        .single();

      if (postError) {
        setError('Failed to create post. Please try again.');
        console.error('Post creation error:', postError);
        return;
      }

      // Process mentions for notifications
      if (mentionsForStorage.length > 0) {
        const notificationResult = await processMentionsForNotifications(
          newPost.id, 
          editorHtmlContent, 
          profile.id,
          isOrganizationPost
        );
        
        if (notificationResult.success) {
          console.log('✅ Mention notifications created successfully');
        } else {
          console.error('❌ Failed to create mention notifications:', notificationResult.error);
        }
      }

      // Call success callback
      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess(newPost);
      }

    } catch (error) {
      console.error('Error creating post:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    submitPost,
    setError
  };
};