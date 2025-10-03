import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { supabase } from '../supabaseClient';
import { getPostCommentsWithReactions } from '../utils/rpcClientFunctions';
import CommentCard from './comment/CommentCard';
import CommentForm from './comment/CommentForm';

const ReactionsModal = lazy(() => import("./post/ReactionsModal"));

export default function CommentSection({ 
    post, 
    currentUserProfile, 
    onCommentAdded, 
    onCommentDeleted,
    showCommentForm = true,
    compact = false,
    organization = null
}) {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeReactionsModal, setActiveReactionsModal] = useState(null);
    const [modalReactors, setModalReactors] = useState([]);
    const [modalReactionSummary, setModalReactionSummary] = useState([]);
    const [modalLikeCount, setModalLikeCount] = useState(0);

    const isOrganizationPost = post._isOrganizationPost;
    const commentsTable = isOrganizationPost ? 'organization_post_comments' : 'post_comments';
    const postIdField = isOrganizationPost ? 'organization_post_id' : 'post_id';

    const fetchComments = useCallback(async () => {
        if (!post?.id || !currentUserProfile?.id) return;
        setLoading(true);
        try {
            const result = await getPostCommentsWithReactions(
                post.id, 
                currentUserProfile.id, 
                isOrganizationPost
            );
            setComments(result.comments || []);
        } catch (error) {
            console.error("Error fetching comments:", error);
        } finally {
            setLoading(false);
        }
    }, [post?.id, currentUserProfile?.id, isOrganizationPost]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const handleOpenReactionsModal = async (comment) => {
        const commentReactionsTable = isOrganizationPost ? 'organization_post_comment_likes' : 'post_comment_likes';
        
        try {
            const { data: reactionData } = await supabase
                .from(commentReactionsTable)
                .select('reaction_type, user_id')
                .eq('comment_id', comment.id);
            
            if (reactionData && reactionData.length > 0) {
                const userIds = reactionData.map(r => r.user_id);
                
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url, organization_name')
                    .in('id', userIds);
                
                if (profileData) {
                    const combinedData = reactionData.map(reaction => {
                        const profile = profileData.find(p => p.id === reaction.user_id);
                        return {
                            ...profile,
                            reaction_type: reaction.reaction_type,
                            profile_id: profile?.id,
                            user_id: reaction.user_id
                        };
                    });
                    
                    const counts = {};
                    reactionData.forEach(like => {
                        const type = like.reaction_type || 'like';
                        counts[type] = (counts[type] || 0) + 1;
                    });

                    const summary = Object.entries(counts).map(([type, count]) => ({ type, count }));
                    
                    setModalReactors(combinedData);
                    setModalReactionSummary(summary);
                    setModalLikeCount(reactionData.length);
                    setActiveReactionsModal(comment);
                }
            }
        } catch (error) {
            console.error('Error loading comment reactions:', error);
        }
    };

    const handleCommentAdded = useCallback((newComment) => {
        if (isOrganizationPost && organization && newComment.profiles) {
            newComment.profiles.organization_name = organization.name;
        }
        
        setComments(currentComments => [...currentComments, newComment]);
        
        if (isOrganizationPost) {
            supabase.rpc('update_organization_post_comments_count', { 
                post_id: post.id 
            }).catch(err => console.warn('Failed to update comment count:', err));
        }
        
        if (onCommentAdded) {
            onCommentAdded();
        }
    }, [isOrganizationPost, post.id, onCommentAdded, organization]);

    const handleDeleteComment = async (commentId) => {
        setComments(currentComments => currentComments.filter(c => c.id !== commentId));

        const { error } = await supabase
            .from(commentsTable)
            .delete()
            .eq('id', commentId);

        if (error) {
            console.error("Error deleting comment:", error);
            fetchComments();
        } else {
            if (isOrganizationPost) {
                await supabase.rpc('update_organization_post_comments_count', { 
                    post_id: post.id 
                });
            }
            
            if (onCommentDeleted) {
                onCommentDeleted();
            }
        }
    };

    const handleEditComment = (comment) => {
        console.log('Edit comment:', comment);
    };

    const handleReplyToComment = (comment) => {
        console.log('Reply to comment:', comment);
    };

    return (
        <div className={`pt-4 mt-2 space-y-4 ${compact ? 'max-h-96 overflow-y-auto' : ''}`}>
            {showCommentForm && (
                <CommentForm
                    post={post}
                    currentUserProfile={currentUserProfile}
                    onCommentAdded={handleCommentAdded}
                    organization={organization}
                />
            )}

            <div className="space-y-4">
                {loading && <p className="text-sm text-slate-500">Loading comments...</p>}
                
                {comments.map(comment => (
                    <CommentCard
                        key={comment.id}
                        comment={comment}
                        currentUserProfile={currentUserProfile}
                        isOrganizationPost={isOrganizationPost}
                        onEdit={handleEditComment}
                        onDelete={handleDeleteComment}
                        onReply={handleReplyToComment}
                        onOpenReactionsModal={handleOpenReactionsModal}
                        showActions={true}
                        showReply={false}
                    />
                ))}
                
                {!loading && comments.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4">
                        No comments yet. Be the first to leave a comment!
                    </p>
                )}
            </div>

            {activeReactionsModal && (
                <Suspense fallback={<div>Loading reactions...</div>}>
                    <ReactionsModal
                        isOpen={!!activeReactionsModal}
                        onClose={() => setActiveReactionsModal(null)}
                        reactions={modalReactors}
                        summary={modalReactionSummary}
                        likeCount={modalLikeCount}
                    />
                </Suspense>
            )}
        </div>
    );
}