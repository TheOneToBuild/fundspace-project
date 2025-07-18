// src/components/OrganizationPostDetailModal.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { X, ThumbsUp, Heart, Lightbulb, PartyPopper, MessageCircle, Share2, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const reactions = [
  { type: 'like', Icon: ThumbsUp, color: 'bg-blue-500', label: 'Like' },
  { type: 'love', Icon: Heart, color: 'bg-red-500', label: 'Love' },
  { type: 'celebrate', Icon: PartyPopper, color: 'bg-green-500', label: 'Celebrate' },
  { type: 'insightful', Icon: Lightbulb, color: 'bg-yellow-500', label: 'Insightful' },
];

export default function OrganizationPostDetailModal({ post, organization, onClose, currentUserId, canEdit }) {
  // Early return if post is null
  if (!post) {
    return null;
  }

  const [selectedReaction, setSelectedReaction] = useState(null);
  const [reactionSummary, setReactionSummary] = useState([]);
  const [totalLikes, setTotalLikes] = useState(post?.likes_count || 0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const canInteract = !!currentUserId;
  const images = post?.image_urls || [];
  const organizationAvatar = organization?.logo_url || organization?.image_url;

  // Load reactions and comments
  useEffect(() => {
    const loadData = async () => {
      if (!post?.id) return;

      try {
        // Load user's reaction
        if (currentUserId) {
          const { data: userReaction } = await supabase
            .from('organization_post_likes')
            .select('reaction_type')
            .eq('organization_post_id', post.id)
            .eq('user_id', currentUserId)
            .single();
          
          setSelectedReaction(userReaction?.reaction_type || null);
        }

        // Load reaction summary
        const { data: reactionData } = await supabase
          .from('organization_post_likes')
          .select('reaction_type')
          .eq('organization_post_id', post.id);

        if (reactionData) {
          const counts = {};
          reactionData.forEach(like => {
            const type = like.reaction_type || 'like';
            counts[type] = (counts[type] || 0) + 1;
          });

          const summary = Object.entries(counts).map(([type, count]) => ({ type, count }));
          setReactionSummary(summary);
          setTotalLikes(reactionData.length);
        }

        // Load comments
        const { data: commentsData, error: commentsError } = await supabase
          .from('organization_post_comments')
          .select(`
            *,
            profiles:profile_id (
              id,
              full_name,
              avatar_url
            )
          `)
          .eq('organization_post_id', post.id)
          .order('created_at', { ascending: true });

        if (commentsError) throw commentsError;
        setComments(commentsData || []);

      } catch (error) {
        console.error('Error loading modal data:', error);
      }
    };

    loadData();
  }, [post?.id, currentUserId]);

  const handleReaction = async (reactionType) => {
    if (!canInteract || !post?.id) return;

    try {
      if (selectedReaction === reactionType) {
        // Remove reaction
        const { error } = await supabase
          .from('organization_post_likes')
          .delete()
          .eq('organization_post_id', post.id)
          .eq('user_id', currentUserId);

        if (error) throw error;
        setSelectedReaction(null);
      } else {
        // Add or update reaction
        const { error } = await supabase
          .from('organization_post_likes')
          .upsert({
            organization_post_id: post.id,
            user_id: currentUserId,
            reaction_type: reactionType
          });

        if (error) throw error;
        setSelectedReaction(reactionType);
      }

      // Update likes count
      await supabase.rpc('update_organization_post_likes_count', { 
        post_id: post.id 
      });

      // Reload reaction summary
      const { data: reactionData } = await supabase
        .from('organization_post_likes')
        .select('reaction_type')
        .eq('organization_post_id', post.id);

      if (reactionData) {
        const counts = {};
        reactionData.forEach(like => {
          const type = like.reaction_type || 'like';
          counts[type] = (counts[type] || 0) + 1;
        });

        const summary = Object.entries(counts).map(([type, count]) => ({ type, count }));
        setReactionSummary(summary);
        setTotalLikes(reactionData.length);
      }

      setShowReactionPicker(false);
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !canInteract || !post?.id) return;

    try {
      setSubmittingComment(true);
      
      const { data, error } = await supabase
        .from('organization_post_comments')
        .insert({
          organization_post_id: post.id,
          user_id: currentUserId,
          profile_id: currentUserId,
          content: newComment.trim()
        })
        .select(`
          *,
          profiles:profile_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      setComments(prev => [...prev, data]);
      setNewComment('');

      await supabase.rpc('update_organization_post_comments_count', { 
        post_id: post.id 
      });

    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const primaryReaction = selectedReaction 
    ? reactions.find(r => r.type === selectedReaction)
    : reactions[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex">
        {/* Left side - Images */}
        {images.length > 0 && (
          <div className="flex-1 bg-slate-900 relative flex items-center justify-center">
            <img
              src={images[currentImageIndex]}
              alt={`Post image ${currentImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
            
            {/* Image navigation */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all"
                >
                  ←
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all"
                >
                  →
                </button>
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded-full">
                  {currentImageIndex + 1} of {images.length}
                </div>
              </>
            )}
          </div>
        )}

        {/* Right side - Post details and comments */}
        <div className={`${images.length > 0 ? 'w-96' : 'flex-1'} flex flex-col`}>
          {/* Header */}
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                {organizationAvatar ? (
                  <img 
                    src={organizationAvatar} 
                    alt={organization.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold">
                    {organization.name?.charAt(0)?.toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{organization?.name || 'Organization'}</h3>
                <p className="text-sm text-slate-500">
                  {post?.created_at ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true }) : ''}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Post content */}
          <div className="p-6 border-b border-slate-200">
            <div 
              className="text-slate-800 mb-4"
              dangerouslySetInnerHTML={{ __html: post?.content || '' }}
            />

            {/* Tags */}
            {post?.tags && JSON.parse(post.tags).length > 0 && (
              <div className="flex flex-wrap gap-2">
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

          {/* Reaction summary */}
          {totalLikes > 0 && (
            <div className="px-6 py-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <div className="flex items-center -space-x-1">
                  {reactionSummary.sort((a, b) => b.count - a.count).slice(0, 3).map(({ type }) => {
                    const reaction = reactions.find(r => r.type === type);
                    if (!reaction) return null;
                    return (
                      <div key={type} className={`p-0.5 rounded-full ${reaction.color} border-2 border-white`}>
                        <reaction.Icon size={12} className="text-white" />
                      </div>
                    );
                  })}
                </div>
                <span className="text-sm text-slate-600">
                  {totalLikes} {totalLikes === 1 ? 'reaction' : 'reactions'}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            {/* Reaction Button with Picker */}
            <div className="relative">
              <button
                onClick={() => canInteract ? handleReaction('like') : null}
                onMouseEnter={() => canInteract && setShowReactionPicker(true)}
                onMouseLeave={() => setShowReactionPicker(false)}
                disabled={!canInteract}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  selectedReaction 
                    ? `${reactions.find(r => r.type === selectedReaction)?.color.replace('bg-', 'text-').replace('-500', '-600')} bg-${reactions.find(r => r.type === selectedReaction)?.color.split('-')[1]}-50` 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'
                } ${!canInteract ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <primaryReaction.Icon 
                  size={18} 
                  className={selectedReaction === primaryReaction.type ? 'fill-current' : ''} 
                />
                <span className="text-sm">{selectedReaction ? primaryReaction.label : 'Like'}</span>
              </button>

              {/* Reaction Picker */}
              {showReactionPicker && canInteract && (
                <div 
                  className="absolute bottom-full left-0 mb-2 bg-white border border-slate-200 rounded-lg shadow-lg p-2 flex space-x-1 z-10"
                  onMouseEnter={() => setShowReactionPicker(true)}
                  onMouseLeave={() => setShowReactionPicker(false)}
                >
                  {reactions.map((reaction) => (
                    <button
                      key={reaction.type}
                      onClick={() => handleReaction(reaction.type)}
                      className={`p-2 rounded-lg transition-all hover:scale-110 ${reaction.color} hover:shadow-md`}
                      title={reaction.label}
                    >
                      <reaction.Icon size={16} className="text-white" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button className="flex items-center space-x-2 px-3 py-2 text-slate-500 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors">
              <MessageCircle size={18} />
              <span className="text-sm">Comment</span>
            </button>

            <button className="flex items-center space-x-2 px-3 py-2 text-slate-500 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors">
              <Share2 size={18} />
              <span className="text-sm">Share</span>
            </button>
          </div>

          {/* Comments section */}
          <div className="flex-1 overflow-y-auto">
            {comments.length > 0 && (
              <div className="p-6 space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      {comment.profiles?.avatar_url ? (
                        <img 
                          src={comment.profiles.avatar_url} 
                          alt={comment.profiles.full_name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-medium text-sm">
                          {comment.profiles?.full_name?.charAt(0)?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-slate-900">
                          {comment.profiles?.full_name}
                        </p>
                        <span className="text-xs text-slate-500">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 mt-1">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comment form */}
          {canInteract ? (
            <div className="p-6 border-t border-slate-200">
              <form onSubmit={handleSubmitComment} className="flex space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-medium text-sm">U</span>
                </div>
                <div className="flex-1 flex space-x-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim() || submittingComment}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="p-6 border-t border-slate-200 text-center">
              <p className="text-slate-500 text-sm">
                <a href="/login" className="text-blue-600 hover:underline">Log in</a> to react and comment on this post
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}