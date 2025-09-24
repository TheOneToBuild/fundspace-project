// PostCard.jsx - Complete Optimized Version with Global Data Manager
import React, { useState, useEffect, useMemo, memo, lazy, Suspense, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useOutletContext } from 'react-router-dom';
import { addOrganizationEventListener } from '../utils/organizationEvents';
import globalDataManager from '../utils/globalDataManager';
import PostHeader from './post/PostHeader';
import PostBody from './post/PostBody';
import PostActions from './post/PostActions';
import EditPost from './post/EditPost';
import CommentSection from './CommentSection';
import ReactorsText from './post/ReactorsText';
import ReactionsPreview from './post/ReactionsPreview';
import { reactions } from './post/constants';

const ReactionsModal = lazy(() => import('./post/ReactionsModal'));
const ImageViewer = lazy(() => import('./post/ImageViewer'));

function PostCard({ 
  post, 
  onDelete, 
  disabled = false, 
  showOrganizationAsAuthor = false, 
  organization,
  pageData // NEW: Page-level batched data
}) {
  const { profile: currentUserProfile } = useOutletContext();
  
  // Use batched data if available, otherwise fall back to individual loading
  const [likeCount, setLikeCount] = useState(() => {
    if (pageData?.postLikes?.[post.id]) {
      return pageData.postLikes[post.id].likes_count;
    }
    return post.likes_count || 0;
  });
  
  const [commentCount, setCommentCount] = useState(post.comments_count || 0);
  const [selectedReaction, setSelectedReaction] = useState(null);
  
  const [reactors, setReactors] = useState(() => {
    if (pageData?.postLikes?.[post.id]) {
      return pageData.postLikes[post.id].reactors || [];
    }
    return [];
  });
  
  const [reactionSummary, setReactionSummary] = useState(() => {
    if (pageData?.postLikes?.[post.id]) {
      return pageData.postLikes[post.id].reaction_summary;
    }
    return post.reactions?.summary || [];
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showReactionsModal, setShowReactionsModal] = useState(false);
  const [showReactorsPreview, setShowReactorsPreview] = useState(false);
  const [isProcessingReaction, setIsProcessingReaction] = useState(false);
  
  const reactorsTimeoutRef = useRef(null);
  const reactionDebounceRef = useRef(null);
  const mountedRef = useRef(true);

  const { content, created_at, profiles: individualAuthor, image_url, image_urls, tags } = post;
  const parsedTags = tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [];
  const isAuthor = currentUserProfile?.id === individualAuthor?.id;
  const displayImages = image_urls && image_urls.length > 0 ? image_urls : (image_url ? [image_url] : []);

  // Enhanced author with batched data
  const displayAuthor = useMemo(() => {
    if (showOrganizationAsAuthor && organization) {
      return {
        full_name: organization.name,
        avatar_url: organization.logo_url,
        organization_name: organization.funder_type?.name || 'Funder'
      };
    }
    
    let author = { ...individualAuthor };
    
    // Use batched profile data if available
    if (pageData?.profiles?.[author.id]) {
      author = { ...author, ...pageData.profiles[author.id] };
    }
    
    // Use batched organization membership if available
    if (pageData?.orgMemberships?.[author.id]) {
      const membership = pageData.orgMemberships[author.id];
      author.organization_name = membership.organization?.name || author.organization_name;
      author.organization_type = membership.organization?.type || author.organization_type;
      author.role = membership.role || author.role;
      if (membership.role && !author.title) {
        author.title = membership.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
    }
    
    return author;
  }, [showOrganizationAsAuthor, organization, individualAuthor, pageData]);

  // Load post data only if not provided by pageData
  useEffect(() => {
    const loadPostData = async () => {
      // Skip if we have pageData or if component unmounted
      if (!mountedRef.current || pageData?.postLikes?.[post.id] || !post.id) return;
      
      try {
        // Use global data manager for batched loading
        const postData = await globalDataManager.getPostLikesForPost(post.id);
        
        if (!mountedRef.current) return;
        
        setLikeCount(postData.likes_count);
        setReactionSummary(postData.reaction_summary);
        setReactors(postData.reactors);
      } catch (error) {
        console.error('Error loading post data:', error);
      }
    };

    loadPostData();
  }, [post.id, pageData]);

  // Check user's reaction status
  useEffect(() => {
    const checkReactionStatus = async () => {
      if (!currentUserProfile?.id || !post.id) return;
      
      try {
        const { data, error } = await supabase
          .from('post_likes')
          .select('reaction_type')
          .eq('post_id', post.id)
          .eq('user_id', currentUserProfile.id)
          .maybeSingle();

        if (!error && mountedRef.current) {
          setSelectedReaction(data?.reaction_type || null);
        }
      } catch (error) {
        console.error('Error checking reaction status:', error);
      }
    };

    checkReactionStatus();
  }, [post.id, currentUserProfile?.id]);

  // Organization change listener (only for authors)
  useEffect(() => {
    if (!isAuthor || !currentUserProfile?.id) return;
    
    const cleanup = addOrganizationEventListener('organizationChanged', (event) => {
      const { profileId, organization } = event.detail;
      if (profileId === currentUserProfile.id && mountedRef.current) {
        // Update will be handled by displayAuthor memo
      }
    });

    return cleanup;
  }, [isAuthor, currentUserProfile?.id]);

  // Handle reaction with debouncing and proper state management
  const handleReaction = useCallback(async (reactionType) => {
    if (!currentUserProfile || !post?.id || disabled || isProcessingReaction) return;
    
    // Clear any pending debounced calls
    if (reactionDebounceRef.current) {
      clearTimeout(reactionDebounceRef.current);
    }
    
    // Debounce rapid clicks
    reactionDebounceRef.current = setTimeout(async () => {
      if (!mountedRef.current) return;
      
      setIsProcessingReaction(true);
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: existingReaction } = await supabase
          .from('post_likes')
          .select('id, reaction_type')
          .eq('post_id', post.id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (existingReaction && selectedReaction === reactionType) {
          // Remove reaction
          await supabase.from('post_likes').delete().eq('id', existingReaction.id);
          if (mountedRef.current) {
            setSelectedReaction(null);
            setLikeCount(prev => Math.max(0, prev - 1));
          }
        } else {
          // Add or update reaction
          await supabase
            .from('post_likes')
            .upsert({ 
              post_id: post.id, 
              user_id: user.id, 
              reaction_type: reactionType 
            }, { onConflict: 'post_id,user_id' });
          
          if (mountedRef.current) {
            setSelectedReaction(reactionType);
            if (!existingReaction) {
              setLikeCount(prev => prev + 1);
            }
          }
        }

        // Clear cached data to force refresh on next load
        globalDataManager.clearCache(`post-likes-batch`);
        
      } catch (error) {
        console.error('Error handling reaction:', error);
      } finally {
        if (mountedRef.current) {
          setTimeout(() => {
            setIsProcessingReaction(false);
          }, 500);
        }
      }
    }, 200); // 200ms debounce
  }, [currentUserProfile, post?.id, disabled, selectedReaction, isProcessingReaction]);

  const handleEditPost = async (editData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== post.user_id) return;

    const content = editData.content || '';
    const imageUrls = editData.image_urls || [];
    const tags = editData.tags ? JSON.parse(editData.tags) : [];
    const mentions = editData.mentions ? JSON.parse(editData.mentions) : [];

    const updateData = {
      content: content.trim(),
      tags: tags.length > 0 ? JSON.stringify(tags) : null,
      image_urls: imageUrls.length > 0 ? imageUrls : null,
      image_url: imageUrls.length === 1 ? imageUrls[0] : null,
      mentions: mentions.length > 0 ? JSON.stringify(mentions) : null,
    };

    const { data: updatedPost, error } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', post.id)
      .select()
      .single();

    if (error) {
      alert('Failed to update post. Please try again.');
      console.error("Post update error:", error);
    } else {
      Object.assign(post, {
        content: updatedPost.content,
        tags: updatedPost.tags ? JSON.parse(updatedPost.tags) : [],
        image_urls: updatedPost.image_urls,
        image_url: updatedPost.image_url,
        mentions: updatedPost.mentions ? JSON.parse(updatedPost.mentions) : []
      });
      setIsEditing(false);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    const { error } = await supabase.from('posts').delete().eq('id', post.id);
    if (error) {
      alert("Failed to delete post.");
    } else if (onDelete) {
      onDelete(post.id);
    }
  };

  const handleImageClick = (index) => {
    setSelectedImageIndex(index);
    setIsImageModalOpen(true);
  };

  const handleReactorsEnter = () => {
    if (reactorsTimeoutRef.current) {
      clearTimeout(reactorsTimeoutRef.current);
    }
    setShowReactorsPreview(true);
  };

  const handleReactorsLeave = () => {
    reactorsTimeoutRef.current = setTimeout(() => {
      setShowReactorsPreview(false);
    }, 300);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (reactorsTimeoutRef.current) {
        clearTimeout(reactorsTimeoutRef.current);
      }
      if (reactionDebounceRef.current) {
        clearTimeout(reactionDebounceRef.current);
      }
    };
  }, []);

  if (!post || !displayAuthor) return null;

  return (
    <div className="post-card bg-white p-5 rounded-xl shadow-sm border border-slate-200 transition-all duration-300" data-post-id={post.id}>
      <PostHeader 
        author={displayAuthor} 
        createdAt={created_at} 
        isAuthor={isAuthor} 
        onEdit={() => setIsEditing(true)} 
        onDelete={handleDeletePost} 
      />
      
      {isEditing ? (
        <EditPost 
          post={post} 
          onSave={handleEditPost} 
          onCancel={() => setIsEditing(false)} 
        />
      ) : (
        <PostBody 
          content={content} 
          images={displayImages} 
          tags={parsedTags}
          onImageClick={handleImageClick} 
        />
      )}
      
      <div className="flex items-center justify-between text-sm text-slate-500 my-2 min-h-[20px]">
        <div className="relative" onMouseEnter={handleReactorsEnter} onMouseLeave={handleReactorsLeave}>
          {likeCount > 0 && (
            <div className="flex items-center cursor-pointer">
              <div className="flex items-center -space-x-1">
                {(reactionSummary || []).sort((a, b) => b.count - a.count).slice(0, 3).map(({ type }) => {
                  const reaction = reactions.find(r => r.type === type);
                  if (!reaction) return null;
                  return (
                    <div key={type} className={`p-0.5 rounded-full ${reaction.color} border-2 border-white`}>
                      <reaction.Icon size={12} className="text-white" />
                    </div>
                  );
                })}
              </div>
              <ReactorsText 
                likeCount={likeCount} 
                reactors={reactors} 
                onViewReactions={() => setShowReactionsModal(true)} 
              />
            </div>
          )}
          {showReactorsPreview && likeCount > 0 && (
            <ReactionsPreview 
              reactors={reactors} 
              likeCount={likeCount} 
              onViewAll={() => { 
                setShowReactorsPreview(false); 
                setShowReactionsModal(true); 
              }} 
            />
          )}
        </div>
        {commentCount > 0 && (
          <span 
            className="cursor-pointer hover:underline" 
            onClick={() => setShowComments(!showComments)}
          >
            {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
          </span>
        )}
      </div>
      
      {!isEditing && (
        <PostActions 
          onReaction={handleReaction} 
          onComment={() => setShowComments(!showComments)} 
          onShare={() => alert('Share functionality not implemented yet.')} 
          selectedReaction={selectedReaction} 
          disabled={disabled || isProcessingReaction}
          postId={post.id}
        />
      )}
      
      {showComments && (
        <div className="mt-4 border-t pt-4 max-h-96 overflow-y-auto">
          <CommentSection 
            post={post} 
            currentUserProfile={currentUserProfile} 
            onCommentAdded={() => setCommentCount(prev => prev + 1)} 
            onCommentDeleted={() => setCommentCount(prev => Math.max(0, prev - 1))} 
          />
        </div>
      )}
      
      <Suspense fallback={null}>
        {showReactionsModal && (
          <ReactionsModal 
            isOpen={showReactionsModal} 
            onClose={() => setShowReactionsModal(false)} 
            reactors={reactors} 
            likeCount={likeCount} 
            reactionSummary={reactionSummary} 
          />
        )}
        
        {isImageModalOpen && (
          <ImageViewer 
            post={post} 
            images={displayImages} 
            initialIndex={selectedImageIndex} 
            isOpen={isImageModalOpen} 
            onClose={() => setIsImageModalOpen(false)} 
            onReaction={handleReaction} 
            selectedReaction={selectedReaction} 
            currentUserProfile={currentUserProfile} 
            likeCount={likeCount} 
            reactionSummary={reactionSummary} 
            commentCount={commentCount} 
            onCommentAdded={() => setCommentCount(prev => prev + 1)} 
            onCommentDeleted={() => setCommentCount(prev => Math.max(0, prev - 1))} 
            reactors={reactors} 
            onViewReactions={() => setShowReactionsModal(true)} 
          />
        )}
      </Suspense>
    </div>
  );
}

export default memo(PostCard);