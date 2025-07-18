// src/components/OrganizationPostCard.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useOutletContext } from 'react-router-dom';  // Add this import
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Import the same components used by PostCard
import PostActions from './post/PostActions';
import ReactorsText from './post/ReactorsText';
import ReactionsPreview from './post/ReactionsPreview';
import CommentSection from './CommentSection';
import EditPost from './post/EditPost';
import ImageMosaic from './post/ImageMosaic';
import { reactions } from './post/constants';

export default function OrganizationPostCard({ 
  post, 
  organization, 
  onDelete, 
  canEdit,
  currentUserId,
  onOpenDetail,
  currentUserProfile
}) {
  // FALLBACK: Use useOutletContext if currentUserProfile is not passed
  const outletContext = useOutletContext();
  const finalUserProfile = currentUserProfile || outletContext?.profile;

  const [selectedReaction, setSelectedReaction] = useState(null);
  const [reactionSummary, setReactionSummary] = useState([]);
  const [totalLikes, setTotalLikes] = useState(post?.likes_count || 0);
  const [commentsCount, setCommentsCount] = useState(post?.comments_count || 0);
  const [showMenu, setShowMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [reactors, setReactors] = useState([]);
  const [showReactorsPreview, setShowReactorsPreview] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const reactorsTimeoutRef = React.useRef(null);

  // Anyone with currentUserId can interact (like/comment)
  const canInteract = !!currentUserId;

  // Load user's reaction and reaction summary
  useEffect(() => {
    const loadReactions = async () => {
      if (!post?.id) return;
      
      try {
        // Get user's current reaction
        if (currentUserId) {
          const { data: userReaction } = await supabase
            .from('organization_post_likes')
            .select('reaction_type')
            .eq('organization_post_id', post.id)
            .eq('user_id', currentUserId)
            .single();
          
          setSelectedReaction(userReaction?.reaction_type || null);
        }

        // Get reaction summary and reactors (same as PostCard)
        const { data: reactionData } = await supabase
          .from('organization_post_likes')
          .select('reaction_type, user_id, created_at')
          .eq('organization_post_id', post.id)
          .order('created_at', { ascending: false });

        if (reactionData && reactionData.length > 0) {
          // Count reactions by type
          const counts = {};
          reactionData.forEach(like => {
            const type = like.reaction_type || 'like';
            counts[type] = (counts[type] || 0) + 1;
          });

          const summary = Object.entries(counts).map(([type, count]) => ({ type, count }));
          setReactionSummary(summary);
          setTotalLikes(reactionData.length);

          // Get profiles for reactors (matching PostCard format)
          const userIds = reactionData.map(like => like.user_id);
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, title, organization_name, role')
            .in('id', userIds);

          const transformedReactors = reactionData.map(like => {
            const profile = profilesData?.find(p => p.id === like.user_id);
            return {
              user_id: like.user_id,
              profile_id: profile?.id,
              full_name: profile?.full_name,
              avatar_url: profile?.avatar_url,
              title: profile?.title,
              organization_name: profile?.organization_name,
              role: profile?.role,
              reaction_type: like.reaction_type,
              created_at: like.created_at
            };
          }).filter(reactor => reactor.full_name);
          
          setReactors(transformedReactors);
        } else {
          setReactors([]);
        }
      } catch (error) {
        console.error('Error loading reactions:', error);
      }
    };

    loadReactions();
  }, [post?.id, currentUserId]);

  const refreshPostData = async () => {
    if (!post?.id) return;
    try {
      const { data: likesData, error: likesError } = await supabase
        .from('organization_post_likes')
        .select('user_id, reaction_type')
        .eq('organization_post_id', post.id);
      if (likesError) throw likesError;

      const summary = {};
      likesData.forEach(like => {
        const type = like.reaction_type || 'like';
        summary[type] = (summary[type] || 0) + 1;
      });
      setTotalLikes(likesData.length);
      setReactionSummary(Object.entries(summary).map(([type, count]) => ({ type, count })));
    } catch (error) {
      console.error('Failed to refresh post data:', error);
    }
  };

  const handleReaction = async (reactionType) => {
    if (!canInteract || !post?.id) return;

    try {
      const { data: existingReaction } = await supabase
        .from('organization_post_likes')
        .select('id')
        .eq('organization_post_id', post.id)
        .eq('user_id', currentUserId)
        .maybeSingle();

      if (existingReaction && selectedReaction === reactionType) {
        // Remove reaction if clicking the same one
        await supabase
          .from('organization_post_likes')
          .delete()
          .eq('id', existingReaction.id);
        setSelectedReaction(null);
      } else {
        // Add or update reaction
        await supabase
          .from('organization_post_likes')
          .upsert({
            organization_post_id: post.id,
            user_id: currentUserId,
            reaction_type: reactionType
          }, { onConflict: 'organization_post_id,user_id' });
        setSelectedReaction(reactionType);
      }

      // Refresh reaction data
      await refreshPostData();
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  const toggleComments = () => {
    setShowComments(!showComments);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      onDelete(post.id);
    }
    setShowMenu(false);
  };

  // Add edit functionality for organization posts
  const handleEditPost = async (editData) => {
    try {
      const updateData = {
        content: editData.content.trim(),
        tags: editData.tags.length > 0 ? JSON.stringify(editData.tags) : null,
        image_urls: editData.images.length > 0 ? editData.images : null,
      };

      const { data: updatedPost, error } = await supabase
        .from('organization_posts')
        .update(updateData)
        .eq('id', post.id)
        .select()
        .single();
      
      if (error) {
        alert('Failed to update post. Please try again.');
        console.error("Post update error:", error);
      } else {
        // Update the local post data
        post.content = updatedPost.content;
        post.tags = updatedPost.tags;
        post.image_urls = updatedPost.image_urls;
        
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating organization post:', error);
      alert('Failed to update post. Please try again.');
    }
  };

  // Add image click handler for modal
  const handleImageClick = (index) => {
    // TODO: Implement image viewer modal
    console.log('Image clicked:', index);
  };

  const handleReactorsEnter = () => {
    clearTimeout(reactorsTimeoutRef.current);
    setShowReactorsPreview(true);
  };

  const handleReactorsLeave = () => {
    reactorsTimeoutRef.current = setTimeout(() => { 
      setShowReactorsPreview(false); 
    }, 300);
  };

  // Parse images from image_urls array
  const images = post?.image_urls || [];
  const organizationAvatar = organization?.logo_url || organization?.image_url;

  if (!post || !organization) return null;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      {/* Header - Organization info and timestamp */}
      <div className="flex items-start space-x-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          {organizationAvatar ? (
            <img 
              src={organizationAvatar} 
              alt={organization.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <span className="text-white font-bold text-lg">
              {organization.name?.charAt(0)?.toUpperCase()}
            </span>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 truncate">
                {organization.name}
              </h3>
              <p className="text-sm text-slate-500">
                {post?.created_at ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true }) : ''}
              </p>
            </div>
            
            {canEdit && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <MoreHorizontal size={20} />
                </button>
                
                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-2 min-w-[120px] z-10">
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                    >
                      <Edit size={16} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={handleDelete}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <Trash2 size={16} />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content - Clickable to open modal ONLY when not editing */}
      {isEditing ? (
        <EditPost 
          post={post} 
          onSave={handleEditPost} 
          onCancel={() => setIsEditing(false)} 
        />
      ) : (
        <div 
          className="cursor-pointer"
          onClick={() => onOpenDetail && onOpenDetail(post)}
        >
          {/* Post text content */}
          <div 
            className="text-slate-800 mb-4"
            dangerouslySetInnerHTML={{ __html: post?.content || '' }}
          />

          {/* Images - FIXED: Use ImageMosaic component like PostCard */}
          {images.length > 0 && (
            <ImageMosaic 
              images={images} 
              onImageClick={handleImageClick}
            />
          )}

          {/* Tags */}
          {post?.tags && JSON.parse(post.tags).length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {JSON.parse(post.tags).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                >
                  #{tag.label || tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reaction Summary and Comment Count - SAME as PostCard */}
      <div className="flex items-center justify-between text-sm text-slate-500 my-2 min-h-[20px]">
        <div 
          className="relative" 
          onMouseEnter={handleReactorsEnter} 
          onMouseLeave={handleReactorsLeave}
        >
          {totalLikes > 0 && (
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
                likeCount={totalLikes} 
                reactors={reactors} 
                onViewReactions={() => {/* TODO: Add reactions modal */}} 
              />
            </div>
          )}
          {showReactorsPreview && totalLikes > 0 && (
            <ReactionsPreview 
              reactors={reactors} 
              likeCount={totalLikes} 
              onViewAll={() => { 
                setShowReactorsPreview(false); 
                // TODO: setShowReactionsModal(true); 
              }} 
            />
          )}
        </div>
        {commentsCount > 0 && (
          <span 
            className="cursor-pointer hover:underline" 
            onClick={toggleComments}
          >
            {commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}
          </span>
        )}
      </div>

      {/* Actions Bar - Using PostActions component - ONLY show when not editing */}
      {!isEditing && (
        <PostActions 
          onReaction={handleReaction}
          onComment={toggleComments}
          onShare={() => alert('Share functionality not implemented yet.')}
          selectedReaction={selectedReaction}
          disabled={!canInteract}
        />
      )}

      {/* Comments Section - Using the same CommentSection component as PostCard - ONLY show when not editing */}
      {showComments && !isEditing && (
        <div className="mt-4 border-t pt-4 max-h-96 overflow-y-auto">
          <CommentSection 
            post={{
              ...post,
              // Transform to use organization_post_comments table
              id: post.id,
              _isOrganizationPost: true // Flag to identify organization posts
            }}
            currentUserProfile={finalUserProfile}  // Use the final resolved profile
            onCommentAdded={() => setCommentsCount(prev => prev + 1)}
            onCommentDeleted={() => setCommentsCount(prev => Math.max(0, prev - 1))}
          />
        </div>
      )}
    </div>
  );
}