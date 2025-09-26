// src/components/dashboard/PostDetailModal.jsx - OPTIMIZED: Use API optimizer
import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import apiRequestOptimizer from '../../utils/apiRequestOptimizer';
import PostBody from '../post/PostBody';
import PostActions from '../post/PostActions';
import CommentSection from '../CommentSection';
import { reactions } from '../post/constants';
import PropTypes from 'prop-types';

const PostDetailModal = ({ post, isOpen, onClose, currentUserProfile, pageData, postsLikesData, onPostLike }) => {
    // Use batched data first, then fallback
    const likesData = postsLikesData?.[post?.id] || pageData?.postLikes?.[post?.id];
    const profileData = pageData?.profiles?.[post?.profile_id || post?.profiles?.id] || post?.profiles;
    const orgMembership = pageData?.orgMemberships?.[post?.profile_id || post?.profiles?.id];

    const [likeCount, setLikeCount] = useState(() => {
        return likesData?.likes_count || post?.likes_count || 0;
    });
    const [commentCount, setCommentCount] = useState(post?.comments_count || 0);
    const [selectedReaction, setSelectedReaction] = useState(() => {
        return likesData?.userReaction || null;
    });
    const [reactors, setReactors] = useState(() => {
        return likesData?.reactors || [];
    });
    const [reactionSummary, setReactionSummary] = useState(() => {
        return likesData?.reaction_summary || post?.reactions?.summary || [];
    });
    const [showComments, setShowComments] = useState(false);
    const [showReactorsPreview, setShowReactorsPreview] = useState(false);
    const reactorsTimeoutRef = useRef(null);

    // Enhanced author with batched organization data
    const displayAuthor = React.useMemo(() => ({
        ...profileData,
        organization_name: orgMembership?.organization?.name || profileData?.organization_name,
        organization_type: orgMembership?.organization?.type || profileData?.organization_type,
        role: orgMembership?.role || profileData?.role
    }), [profileData, orgMembership]);

    // Update when batched data changes
    useEffect(() => {
        if (likesData?.likes_count !== undefined) {
            setLikeCount(likesData.likes_count);
        }
        if (likesData?.userReaction !== undefined) {
            setSelectedReaction(likesData.userReaction);
        }
        if (likesData?.reactors) {
            setReactors(likesData.reactors);
        }
        if (likesData?.reaction_summary) {
            setReactionSummary(likesData.reaction_summary);
        }
    }, [likesData]);

    // Update modal state when post prop changes
    useEffect(() => {
        if (post && !likesData) {
            setLikeCount(post.likes_count || 0);
            setCommentCount(post.comments_count || 0);
            setReactionSummary(post.reactions?.summary || []);
        }
    }, [post, likesData]);

    const formatTimeAgo = (dateString) => {
        const now = new Date();
        const postDate = new Date(dateString);
        const diffInHours = Math.floor((now - postDate) / (1000 * 60 * 60));
        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours}h ago`;
        return `${Math.floor(diffInHours / 24)}d ago`;
    };

    // OPTIMIZED: Use API optimizer for individual reaction status check
    useEffect(() => {
        if (selectedReaction !== null || !currentUserProfile || !post?.id || likesData?.userReaction !== undefined) return;
        
        const checkReactionStatus = async () => {
            try {
                // Use API optimizer instead of direct Supabase call
                const result = await apiRequestOptimizer.optimizeSupabaseQuery(
                    null,
                    'user_post_reaction_status',
                    { postId: post.id, userId: currentUserProfile.id }
                );
                
                setSelectedReaction(result?.userReaction || null);
            } catch (error) {
                console.error('Error in checkReactionStatus:', error);
                setSelectedReaction(null);
            }
        };
        
        if (isOpen && post) {
            checkReactionStatus();
        }
    }, [currentUserProfile, post?.id, isOpen, selectedReaction, likesData]);

    // OPTIMIZED: Use API optimizer for fetching reactors
    useEffect(() => {
        if (reactors.length > 0 || !post?.id || likesData?.reactors) return;
        
        const fetchReactors = async () => {
            if (likeCount <= 0) {
                setReactors([]);
                return;
            }
            try {
                // Use API optimizer instead of individual post_likes query
                const result = await apiRequestOptimizer.optimizeSupabaseQuery(
                    null,
                    'post_likes_single',
                    { postId: post.id }
                );
                
                setReactors(result.data || []);
            } catch (error) {
                console.error('Error fetching reactors:', error);
                setReactors([]);
            }
        };
        
        if (isOpen && post) {
            fetchReactors();
        }
    }, [post?.id, likeCount, isOpen, reactors.length, likesData]);

    // Use centralized like handler if available
    const handleReaction = async (reactionType) => {
        if (!currentUserProfile || !post?.id) return;
        
        // Use centralized handler from ProfilePage if available
        if (onPostLike) {
            onPostLike(post.id, selectedReaction, selectedReaction === reactionType ? null : reactionType);
            setSelectedReaction(selectedReaction === reactionType ? null : reactionType);
            return;
        }
        
        // Fallback to individual handler (but still optimized)
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
                setSelectedReaction(null);
                setLikeCount(prev => Math.max(0, prev - 1));
            } else {
                // Add or update reaction
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

    if (!isOpen || !post) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-slate-800">Post</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X size={20} className="text-slate-600" />
                    </button>
                </div>
                
                <div className="p-6">
                    <div className="flex items-start space-x-3 mb-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200 flex-shrink-0">
                            {displayAuthor?.avatar_url ? (
                                <img 
                                    src={displayAuthor.avatar_url} 
                                    alt={displayAuthor.full_name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                    {displayAuthor?.full_name?.[0] || 'U'}
                                </div>
                            )}
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
                        imageUrls={post.image_urls}
                        tags={post.tags}
                    />

                    <div className="flex items-center justify-between text-sm text-slate-500 mb-4 pt-4 border-t border-slate-100">
                        <div 
                            className="relative"
                            onMouseEnter={handleReactorsEnter}
                            onMouseLeave={handleReactorsLeave}
                        >
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
                                    <span className="ml-2 text-sm text-slate-600">
                                        {likeCount} {likeCount === 1 ? 'reaction' : 'reactions'}
                                    </span>
                                </div>
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
                        {commentCount > 0 && (
                            <span 
                                className="cursor-pointer hover:underline"
                                onClick={() => setShowComments(!showComments)}
                            >
                                {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
                            </span>
                        )}
                    </div>

                    <PostActions 
                        onReaction={handleReaction}
                        onComment={() => setShowComments(!showComments)}
                        onShare={() => alert('Share functionality not implemented yet.')}
                        selectedReaction={selectedReaction}
                        disabled={false}
                    />

                    {showComments && (
                        <div className="mt-6 pt-6 border-t border-slate-200">
                            <CommentSection
                                postId={post.id}
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