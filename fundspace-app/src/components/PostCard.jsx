import React, { useState, useEffect, useMemo, memo, lazy, Suspense, useCallback, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { togglePostLike } from '../utils/rpcClientFunctions';
import { supabase } from '../supabaseClient';
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
  
  const [firstReactorName, setFirstReactorName] = useState(null);
  const reactorsTimeoutRef = useRef(null);

  useEffect(() => {
    if (userReaction !== undefined) {
      setSelectedReaction(userReaction);
    }
  }, [userReaction]);

  useEffect(() => {
    const fetchFirstReactor = async () => {
      if (likeCount > 0 && (!reactors || reactors.length === 0)) {
        try {
          // First get the user_id from post_likes
          const { data: likeData } = await supabase
            .from('post_likes')
            .select('user_id')
            .eq('post_id', post.id)
            .limit(1)
            .single();
          
          if (likeData?.user_id) {
            // Then get the profile
            const { data: profileData } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', likeData.user_id)
              .single();
            
            if (profileData?.full_name) {
              setFirstReactorName(profileData.full_name);
            }
          }
        } catch (error) {
          console.error('Error fetching first reactor:', error);
        }
      }
    };
  
    fetchFirstReactor();
  }, [likeCount, post.id, reactors]);

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
    if (likeCount > 0) {
      try {
        const { data: likesData } = await supabase
          .from('post_likes')
          .select('user_id, reaction_type')
          .eq('post_id', post.id);

        if (likesData && likesData.length > 0) {
          const userIds = [...new Set(likesData.map(l => l.user_id))];
          
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, organization_name')
            .in('id', userIds);

          const freshReactors = likesData.map(like => {
            const profile = profilesData?.find(p => p.id === like.user_id);
            return {
              user_id: like.user_id,
              reaction_type: like.reaction_type,
              full_name: profile?.full_name,
              avatar_url: profile?.avatar_url,
              organization_name: profile?.organization_name
            };
          });

          const counts = {};
          likesData.forEach(like => {
            const type = like.reaction_type || 'like';
            counts[type] = (counts[type] || 0) + 1;
          });

          const freshSummary = Object.entries(counts).map(([type, count]) => ({ type, count }));

          setReactors(freshReactors);
          setReactionSummary(freshSummary);
        }
      } catch (error) {
        console.error('Error fetching reactors:', error);
      }

      setShowReactionsModal(true);
    }
  }, [likeCount, post.id]);

  const handleReaction = useCallback(async (reactionType) => {
    if (!currentUserProfile?.id || !post?.id || disabled || isProcessingReaction) return;

    if (onPostLike) {
      const newReaction = selectedReaction === reactionType ? null : reactionType;
      onPostLike(post.id, selectedReaction, newReaction);
      // The parent component will manage the state update via props.
      return;
    }

    setIsProcessingReaction(true);

    try {
      const result = await togglePostLike(post.id, currentUserProfile.id, reactionType);

      if (result) {
        // Update state with returned values
        setSelectedReaction(result.user_reaction || null);
        setLikeCount(result.total_count || 0);
        setReactionSummary(result.reaction_summary || []);

        // IMPORTANT: Clear reactors so they get refetched with new data
        setReactors([]);
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
    } finally {
      if (mountedRef.current) {
        setIsProcessingReaction(false);
      }
    }
  }, [currentUserProfile?.id, post?.id, disabled, selectedReaction, isProcessingReaction, onPostLike]);

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
    
    // If we don't have reactors data yet, fetch it
    if (likeCount > 0 && (!reactors || reactors.length === 0)) {
      try {
        const { data: likesData } = await supabase
          .from('post_likes')
          .select('user_id, reaction_type')
          .eq('post_id', post.id)
          .limit(5); // Get first 5 for preview
        
        if (likesData && likesData.length > 0) {
          const userIds = likesData.map(l => l.user_id);
          
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, organization_name')
            .in('id', userIds);
          
          const fetchedReactors = likesData.map(like => {
            const profile = profilesData?.find(p => p.id === like.user_id);
            return {
              user_id: like.user_id,
              reaction_type: like.reaction_type,
              full_name: profile?.full_name,
              avatar_url: profile?.avatar_url,
              organization_name: profile?.organization_name
            };
          });
          
          setReactors(fetchedReactors);
        }
      } catch (error) {
        console.error('Error fetching reactors:', error);
      }
    }
    
    setShowReactorsPreview(true);
  }, [likeCount, post.id, reactors]);

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
            <div className="flex items-center cursor-pointer" onClick={handleOpenReactionsModal}>
              <div className="flex items-center -space-x-1 mr-2">
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
              {/* Always show formatted text */}
              {reactors && reactors.length > 0 ? (
                <span className="text-sm hover:underline">
                  {reactors[0].full_name || 'Someone'}
                  {likeCount > 1 && ` + ${likeCount - 1} other${likeCount - 1 === 1 ? '' : 's'}`}
                </span>
              ) : firstReactorName ? (
                <span className="text-sm hover:underline">
                  {firstReactorName}
                  {likeCount > 1 && ` + ${likeCount - 1} other${likeCount - 1 === 1 ? '' : 's'}`}
                </span>
              ) : (
                <span className="text-sm hover:underline">
                  {likeCount} reaction{likeCount === 1 ? '' : 's'}
                </span>
              )}
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