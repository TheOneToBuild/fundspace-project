import React, { useState, useEffect, useMemo, memo, lazy, Suspense, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useOutletContext } from 'react-router-dom';
import { addOrganizationEventListener } from '../utils/organizationEvents';
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
  pageData,
  postsLikesData,
  onPostLike,
  userReaction,
  batchedProfiles,
  batchedOrganizations
}) {
  const { profile: currentUserProfile } = useOutletContext();
  
  const initialLikeCount = postsLikesData?.[post.id]?.userReaction ? 
    Object.values(postsLikesData[post.id].reaction_summary || {}).reduce((sum, count) => sum + count, 0) :
    pageData?.postLikes?.[post.id]?.likes_count || post.likes_count || 0;
    
  const initialReactors = postsLikesData?.[post.id]?.reactors || 
    pageData?.postLikes?.[post.id]?.reactors || 
    [];
    
  const initialReactionSummary = postsLikesData?.[post.id]?.reaction_summary || 
    pageData?.postLikes?.[post.id]?.reaction_summary || 
    post.reactions?.summary || 
    [];

  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [commentCount, setCommentCount] = useState(post.comments_count || 0);
  const [selectedReaction, setSelectedReaction] = useState(
    userReaction || 
    postsLikesData?.[post.id]?.userReaction || 
    null
  );
  const [reactors, setReactors] = useState(initialReactors);
  const [reactionSummary, setReactionSummary] = useState(initialReactionSummary);
  
  const [isEditing, setIsEditing] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showReactionsModal, setShowReactionsModal] = useState(false);
  const [showReactorsPreview, setShowReactorsPreview] = useState(false);
  const [isProcessingReaction, setIsProcessingReaction] = useState(false);
  
  const reactorsTimeoutRef = useRef(null);

  useEffect(() => {
    if (userReaction !== undefined) {
      setSelectedReaction(userReaction);
    }
  }, [userReaction]);

  useEffect(() => {
    // Fetch reactor preview data when post loads if there are reactions
    const fetchReactorPreview = async () => {
      if (likeCount > 0 && (!reactors || reactors.length === 0)) {
        try {
          const { data, error } = await supabase
            .rpc('get_post_reactors', { post_id: post.id })
            .limit(3); // Only get first 3 for preview
          
          if (error) throw error;
          
          if (data && data.length > 0) {
            const formattedReactors = data.map(reactor => ({
              profile_id: reactor.user_id,
              user_id: reactor.user_id,
              full_name: reactor.full_name,
              avatar_url: reactor.avatar_url,
              reaction_type: reactor.reaction_type,
              organization_name: reactor.organization_name || ''
            }));
            
            setReactors(formattedReactors);
          }
        } catch (error) {
          console.error('Error fetching reactor preview:', error);
        }
      }
    };
  
    fetchReactorPreview();
  }, [likeCount, post.id]); // Only depend on likeCount and post.id

  const reactionDebounceRef = useRef(null);
  const mountedRef = useRef(true);

  const { content, created_at, profiles: individualAuthor, image_url, image_urls, tags } = post;
  const parsedTags = tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [];
  const isAuthor = currentUserProfile?.id === individualAuthor?.id;
  const displayImages = image_urls && image_urls.length > 0 ? image_urls : (image_url ? [image_url] : []);

  const displayAuthor = useMemo(() => {
    if (showOrganizationAsAuthor && organization) {
      return {
        full_name: organization.name,
        avatar_url: organization.logo_url,
        organization_name: organization.funder_type?.name || 'Funder'
      };
    }
    
    let author = { ...individualAuthor };
    
    if (batchedProfiles?.[author.id]) {
      author = { ...author, ...batchedProfiles[author.id] };
    } else if (pageData?.profiles?.[author.id]) {
      author = { ...author, ...pageData.profiles[author.id] };
    }
    
    if (batchedOrganizations?.[author.id]) {
      const orgInfo = batchedOrganizations[author.id];
      author.organization_name = orgInfo.name || author.organization_name;
      author.organization_type = orgInfo.type || author.organization_type;
    } else if (pageData?.orgMemberships?.[author.id]) {
      const membership = pageData.orgMemberships[author.id];
      author.organization_name = membership.organization?.name || author.organization_name;
      author.organization_type = membership.organization?.type || author.organization_type;
      author.role = membership.role || author.role;
      if (membership.role && !author.title) {
        author.title = membership.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
    }
    
    return author;
  }, [showOrganizationAsAuthor, organization, individualAuthor, batchedProfiles, pageData, batchedOrganizations]);

  const handleOpenReactionsModal = useCallback(async () => {
    if (likeCount === 0) return;
    
    // If we already have reactors (from hover), just open the modal
    if (reactors && reactors.length > 0) {
      setShowReactionsModal(true);
      return;
    }
    
    // Otherwise fetch them first
    try {
      const { data, error } = await supabase
        .rpc('get_post_reactors', { post_id: post.id });
      
      if (error) throw error;
      
      const formattedReactors = data.map(reactor => ({
        profile_id: reactor.user_id,
        user_id: reactor.user_id,
        full_name: reactor.full_name,
        avatar_url: reactor.avatar_url,
        reaction_type: reactor.reaction_type,
        organization_name: reactor.organization_name || ''
      }));
      
      setReactors(formattedReactors);
      setShowReactionsModal(true);
    } catch (error) {
      console.error('Error fetching reactors:', error);
    }
  }, [post.id, likeCount, reactors]);

  const handleReaction = useCallback(async (reactionType) => {
    if (!currentUserProfile || !post?.id || disabled || isProcessingReaction) return;
    
    if (onPostLike) {
      onPostLike(post.id, selectedReaction, selectedReaction === reactionType ? null : reactionType);
      setSelectedReaction(selectedReaction === reactionType ? null : reactionType);
      return;
    }
    
    if (reactionDebounceRef.current) {
      clearTimeout(reactionDebounceRef.current);
    }
    
    reactionDebounceRef.current = setTimeout(async () => {
      if (!mountedRef.current) return;
      
      setIsProcessingReaction(true);
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const existingReaction = selectedReaction ? { reaction_type: selectedReaction } : null;
        if (selectedReaction === reactionType) {
          await supabase.from('post_likes').delete().eq('id', existingReaction.id);
          if (mountedRef.current) {
            setSelectedReaction(null);
            setLikeCount(prev => Math.max(0, prev - 1));
          }
        } else {
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
        
      } catch (error) {
        console.error('Error handling reaction:', error);
      } finally {
        if (mountedRef.current) {
          setTimeout(() => {
            setIsProcessingReaction(false);
          }, 500);
        }
      }
    }, 200);
  }, [currentUserProfile, post?.id, disabled, selectedReaction, isProcessingReaction, onPostLike]);

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

  const handleReactorsEnter = useCallback(async () => {
    if (reactorsTimeoutRef.current) {
      clearTimeout(reactorsTimeoutRef.current);
    }
    
    // Only fetch all reactors if we're about to show preview and don't have full list
    if (likeCount > 0 && reactors.length < likeCount) {
      try {
        const { data, error } = await supabase
          .rpc('get_post_reactors', { post_id: post.id });
        
        if (error) throw error;
        
        const formattedReactors = data.map(reactor => ({
          profile_id: reactor.user_id,
          user_id: reactor.user_id,
          full_name: reactor.full_name,
          avatar_url: reactor.avatar_url,
          reaction_type: reactor.reaction_type,
          organization_name: reactor.organization_name || ''
        }));
        
        setReactors(formattedReactors);
      } catch (error) {
        console.error('Error fetching reactors:', error);
      }
    }
    
    setShowReactorsPreview(true);
  }, [likeCount, reactors.length, post.id]);

  const handleReactorsLeave = () => {
    reactorsTimeoutRef.current = setTimeout(() => {
      setShowReactorsPreview(false);
    }, 300);
  };

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
                onViewReactions={handleOpenReactionsModal} 
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