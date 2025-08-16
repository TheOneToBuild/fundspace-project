// src/components/CommentSection.jsx - Fixed to show current organization context
import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { supabase } from '../supabaseClient';
import CommentCard from './comment/CommentCard';
import CommentForm from './comment/CommentForm';

// Lazy load the ReactionsModal
const ReactionsModal = lazy(() => import("./post/ReactionsModal"));

export default function CommentSection({ 
    post, 
    currentUserProfile, 
    onCommentAdded, 
    onCommentDeleted,
    showCommentForm = true,
    compact = false,
    organization = null // Pass the current organization context
}) {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeReactionsModal, setActiveReactionsModal] = useState(null);
    const [modalReactors, setModalReactors] = useState([]);
    const [modalReactionSummary, setModalReactionSummary] = useState([]);
    const [modalLikeCount, setModalLikeCount] = useState(0);

    // Determine if this is an organization post
    const isOrganizationPost = post._isOrganizationPost;
    const commentsTable = isOrganizationPost ? 'organization_post_comments' : 'post_comments';
    const postIdField = isOrganizationPost ? 'organization_post_id' : 'post_id';

    // Fetch comments from the appropriate table
    const fetchComments = useCallback(async () => {
        if (!post?.id) return;
        
        setLoading(true);
        try {
            // For organization posts, include all profile fields but we'll override organization_name in display
            const profileFields = 'id, full_name, avatar_url, organization_name';

            const { data, error } = await supabase
                .from(commentsTable)
                .select(`
                    *,
                    profiles:profile_id (${profileFields})
                `)
                .eq(postIdField, post.id)
                .order('created_at', { ascending: true });

            if (error) {
                console.error("Error fetching comments:", error);
                return;
            }

            // For organization posts, override the organization_name with current organization
            let processedComments = data || [];
            if (isOrganizationPost && organization) {
                processedComments = processedComments.map(comment => ({
                    ...comment,
                    profiles: {
                        ...comment.profiles,
                        organization_name: organization.name // Override with current organization
                    }
                }));
            }

            setComments(processedComments);
        } catch (error) {
            console.error("Unexpected error fetching comments:", error);
        } finally {
            setLoading(false);
        }
    }, [post?.id, commentsTable, postIdField, isOrganizationPost, organization]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    // Handle opening reactions modal
    const handleOpenReactionsModal = async (comment) => {
        const commentReactionsTable = isOrganizationPost ? 'organization_post_comment_likes' : 'post_comment_likes';
        
        try {
            // Use a simpler approach - get reactions and profiles separately
            const { data: reactionData } = await supabase
                .from(commentReactionsTable)
                .select('reaction_type, user_id')
                .eq('comment_id', comment.id);
            
            if (reactionData && reactionData.length > 0) {
                // Get the user IDs
                const userIds = reactionData.map(r => r.user_id);
                
                // Get profiles for those users
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url, organization_name')
                    .in('id', userIds);
                
                if (profileData) {
                    // Combine reaction data with profile data
                    const combinedData = reactionData.map(reaction => {
                        const profile = profileData.find(p => p.id === reaction.user_id);
                        return {
                            ...profile,
                            reaction_type: reaction.reaction_type,
                            profile_id: profile?.id,
                            user_id: reaction.user_id
                        };
                    });
                    
                    // Calculate reaction summary
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

    // Handle comment submission
    const handleCommentAdded = useCallback((newComment) => {
        // For organization posts, override the organization_name with current organization
        if (isOrganizationPost && organization && newComment.profiles) {
            newComment.profiles.organization_name = organization.name;
        }
        
        setComments(currentComments => [...currentComments, newComment]);
        
        // Update the post's comment count for organization posts
        if (isOrganizationPost) {
            supabase.rpc('update_organization_post_comments_count', { 
                post_id: post.id 
            }).catch(err => console.warn('Failed to update comment count:', err));
        }
        
        // Notify parent component
        if (onCommentAdded) {
            onCommentAdded();
        }
    }, [isOrganizationPost, post.id, onCommentAdded, organization]);

    // Handle comment deletion
    const handleDeleteComment = async (commentId) => {
        // Optimistically remove the comment from the UI
        setComments(currentComments => currentComments.filter(c => c.id !== commentId));

        const { error } = await supabase
            .from(commentsTable)
            .delete()
            .eq('id', commentId);

        if (error) {
            console.error("Error deleting comment:", error);
            fetchComments(); // Re-fetch comments to correct the UI if delete fails
        } else {
            // Update the post's comment count for organization posts
            if (isOrganizationPost) {
                await supabase.rpc('update_organization_post_comments_count', { 
                    post_id: post.id 
                });
            }
            
            // Notify parent component
            if (onCommentDeleted) {
                onCommentDeleted();
            }
        }
    };

    // Handle comment editing (placeholder for future implementation)
    const handleEditComment = (comment) => {
        console.log('Edit comment:', comment);
        // TODO: Implement comment editing functionality
    };

    // Handle comment replies (placeholder for future implementation)
    const handleReplyToComment = (comment) => {
        console.log('Reply to comment:', comment);
        // TODO: Implement comment reply functionality
    };

    return (
        <div className={`pt-4 mt-2 space-y-4 ${compact ? 'max-h-96 overflow-y-auto' : ''}`}>
            {/* Comment Form */}
            {showCommentForm && (
                <CommentForm
                    post={post}
                    currentUserProfile={currentUserProfile}
                    onCommentAdded={handleCommentAdded}
                    organization={organization} // Pass organization context to form
                />
            )}

            {/* Comments List */}
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
                        showReply={false} // Can be enabled for threading later
                    />
                ))}
                
                {!loading && comments.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4">
                        No comments yet. Be the first to leave a comment!
                    </p>
                )}
            </div>

            {/* Reactions Modal */}
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