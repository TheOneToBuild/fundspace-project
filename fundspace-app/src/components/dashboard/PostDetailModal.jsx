import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import PostBody from '../post/PostBody';
import PostActions from '../post/PostActions';
import CommentSection from '../CommentSection';
import { reactions } from '../post/constants';
import PropTypes from 'prop-types';

const PostDetailModal = ({ post, isOpen, onClose, currentUserProfile, pageData, postsLikesData, onPostLike }) => {
    const reactorsTimeoutRef = useRef(null);

    const displayAuthor = useMemo(() => {
        const postAuthor = post?.profile || post?.profiles || post?.author || post?.user;
        const authorId = postAuthor?.id || post?.profile_id || post?.user_id;
        
        if (!authorId) return postAuthor || { full_name: 'Unknown User' };
        
        const enhancedProfile = pageData?.profiles?.[authorId];
        const orgMembership = pageData?.orgMemberships?.[authorId];
        
        return {
            ...postAuthor,
            ...enhancedProfile,
            organization_name: orgMembership?.organization?.name || 
                              enhancedProfile?.organization_name || 
                              postAuthor?.organization_name,
            organization_type: orgMembership?.organization?.type || 
                              enhancedProfile?.organization_type || 
                              postAuthor?.organization_type,
            role: orgMembership?.role || enhancedProfile?.role || postAuthor?.role
        };
    }, [post, pageData]);

    const likesData = useMemo(() => 
        postsLikesData?.[post?.id] || pageData?.postLikes?.[post?.id], 
        [postsLikesData, pageData, post?.id]
    );

    const allImages = useMemo(() => {
        if (!post) return [];
        
        const extractContentImages = (content) => {
            if (!content) return [];
            const div = document.createElement('div');
            div.innerHTML = content;
            const imgElements = div.querySelectorAll('img');
            return Array.from(imgElements).map(img => img.src).filter(Boolean);
        };

        const contentImages = extractContentImages(post.content);
        
        return [
            ...(post.images || []),
            ...contentImages,
            ...(post.image_urls || []),
            ...(post.attachments || []).filter(att => att.type === 'image').map(att => att.url)
        ].filter(Boolean);
    }, [post]);

    const [likeCount, setLikeCount] = useState(() => 
        likesData?.likes_count || post?.likes_count || 0
    );
    const [commentCount, setCommentCount] = useState(post?.comments_count || 0);
    const [selectedReaction, setSelectedReaction] = useState(() => 
        likesData?.userReaction || null
    );
    const [reactors, setReactors] = useState(() => 
        likesData?.reactors || []
    );
    const [reactionSummary, setReactionSummary] = useState(() => 
        likesData?.reaction_summary || post?.reactions?.summary || []
    );
    const [showComments, setShowComments] = useState(false);
    const [showReactorsPreview, setShowReactorsPreview] = useState(false);
    const [showReactionPicker, setShowReactionPicker] = useState(false);

    useEffect(() => {
        if (post && isOpen) {
            // Reset counts when modal opens with fresh post data
            setLikeCount(likesData?.likes_count || post?.likes_count || 0);
            setCommentCount(post?.comments_count || 0);
            setSelectedReaction(likesData?.userReaction || null);
            setReactors(likesData?.reactors || []);
            setReactionSummary(likesData?.reaction_summary || post?.reactions?.summary || []);
        }
    }, [post, isOpen, likesData]);

    useEffect(() => {
        if (likesData?.likes_count !== undefined) setLikeCount(likesData.likes_count);
        if (likesData?.userReaction !== undefined) setSelectedReaction(likesData.userReaction);
        if (likesData?.reactors) setReactors(likesData.reactors);
        if (likesData?.reaction_summary) setReactionSummary(likesData.reaction_summary);
    }, [likesData]);

    const formatTimeAgo = useCallback((dateString) => {
        const now = new Date();
        const postDate = new Date(dateString);
        const diffInHours = Math.floor((now - postDate) / (1000 * 60 * 60));
        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours}h ago`;
        return `${Math.floor(diffInHours / 24)}d ago`;
    }, []);

    const handleReaction = useCallback(async (reactionType) => {
        if (!currentUserProfile || !post?.id) return;
        
        if (onPostLike) {
            const newReaction = selectedReaction === reactionType ? null : reactionType;
            onPostLike(post.id, selectedReaction, newReaction);
            setSelectedReaction(newReaction);
            return;
        }
        
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
                await supabase.from('post_likes').delete().eq('id', existingReaction.id);
                setSelectedReaction(null);
                setLikeCount(prev => Math.max(0, prev - 1));
            } else {
                await supabase
                    .from('post_likes')
                    .upsert({ 
                        post_id: post.id,
                        user_id: user.id,
                        reaction_type: reactionType 
                    });
                
                const prevReaction = selectedReaction;
                setSelectedReaction(reactionType);
                
                if (!prevReaction) {
                    setLikeCount(prev => prev + 1);
                }
            }
        } catch (error) {
            console.error('Error handling reaction:', error);
        }
    }, [currentUserProfile, post?.id, selectedReaction, onPostLike]);

    const handleReactorsEnter = useCallback(() => {
        if (reactorsTimeoutRef.current) {
            clearTimeout(reactorsTimeoutRef.current);
        }
        setShowReactorsPreview(true);
    }, []);

    const handleReactorsLeave = useCallback(() => {
        reactorsTimeoutRef.current = setTimeout(() => {
            setShowReactorsPreview(false);
        }, 300);
    }, []);

    const handleBackdropClick = useCallback((event) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    }, [onClose]);

    const handleImageClick = useCallback((index) => {}, []);

    const handleLikeClick = useCallback(() => {
        // Toggle reaction picker or directly like
        if (selectedReaction) {
            // If already reacted, remove reaction
            handleReaction(selectedReaction);
        } else {
            // Show picker to choose reaction type
            setShowReactionPicker(prev => !prev);
        }
    }, [selectedReaction, handleReaction]);

    const toggleComments = useCallback(() => {
        setShowComments(prev => !prev);
    }, []);

    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen, onClose]);

    useEffect(() => {
        return () => {
            if (reactorsTimeoutRef.current) {
                clearTimeout(reactorsTimeoutRef.current);
            }
        };
    }, []);

    if (!isOpen || !post) return null;

    const postWithMetadata = {
        ...post,
        _isOrganizationPost: false
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={handleBackdropClick}>
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex justify-end items-center">
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                        aria-label="Close modal"
                    >
                        <X size={20} className="text-slate-600" />
                    </button>
                </div>
                
                <div className="p-6">
                    <div className="flex items-start space-x-3 mb-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200 flex-shrink-0">
                            <img 
                                src={displayAuthor?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayAuthor?.full_name || 'User')}&background=6366f1&color=ffffff`}
                                alt={displayAuthor?.full_name || 'User'}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                                <h3 className="font-medium text-slate-900 truncate">
                                    {displayAuthor?.full_name || 'Unknown User'}
                                </h3>
                                <span className="text-slate-400">•</span>
                                <span className="text-sm text-slate-500">
                                    {formatTimeAgo(post.created_at)}
                                </span>
                            </div>
                            {displayAuthor?.title && (
                                <p className="text-sm text-slate-600">{displayAuthor.title}</p>
                            )}
                            {displayAuthor?.organization_name && (
                                <p className="text-sm text-slate-500">{displayAuthor.organization_name}</p>
                            )}
                        </div>
                    </div>

                    <PostBody 
                        content={post.content}
                        images={allImages}
                        tags={post.tags}
                        onImageClick={handleImageClick}
                    />

                    <div className="flex items-center justify-between text-sm text-slate-500 mb-4 pt-3 border-t border-slate-100">
                        <div 
                            className="relative"
                            onMouseEnter={handleReactorsEnter}
                            onMouseLeave={handleReactorsLeave}
                        >
                            {likeCount > 0 ? (
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
                                    <span className="ml-2 text-sm text-slate-600">
                                        {likeCount} {likeCount === 1 ? 'reaction' : 'reactions'}
                                    </span>
                                </div>
                            ) : (
                                <span className="text-slate-400">No reactions yet</span>
                            )}
                            {showReactorsPreview && likeCount > 0 && (
                                <div className="absolute top-full left-0 mt-2 p-3 bg-white rounded-lg shadow-lg border border-slate-200 z-10">
                                    <div className="text-xs text-slate-600">
                                        {reactors.slice(0, 3).map(reactor => reactor.profile?.full_name || reactor.full_name).join(', ')}
                                        {reactors.length > 3 && ` and ${reactors.length - 3} others`}
                                    </div>
                                </div>
                            )}
                        </div>
                        {commentCount > 0 ? (
                            <span 
                                className="cursor-pointer hover:underline"
                                onClick={toggleComments}
                            >
                                {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
                            </span>
                        ) : (
                            <span className="text-slate-400">No comments yet</span>
                        )}
                    </div>

                    <div className="mb-4">
                        <PostActions 
                            onReaction={handleReaction}
                            onComment={toggleComments}
                            onShare={() => alert('Share functionality not implemented yet.')}
                            selectedReaction={selectedReaction}
                            disabled={false}
                        />
                    </div>

                    {showComments && (
                        <div className="mt-6 pt-6 border-t border-slate-200">
                            <CommentSection
                                post={postWithMetadata}
                                currentUserProfile={currentUserProfile}
                                onCommentCountChange={setCommentCount}
                                pageData={pageData}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

PostDetailModal.propTypes = {
    post: PropTypes.object,
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    currentUserProfile: PropTypes.object,
    pageData: PropTypes.object,
    postsLikesData: PropTypes.object,
    onPostLike: PropTypes.func
};

export default PostDetailModal;