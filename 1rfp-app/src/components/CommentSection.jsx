// src/components/CommentSection.jsx - Enhanced to support organization posts
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Send, Trash2 } from 'lucide-react';
import Avatar from './Avatar.jsx';

// Helper functions
const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y";
    interval = seconds / 2592000;
    if (interval > 1) return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m";
    return Math.floor(seconds) + "s";
};

export default function CommentSection({ post, currentUserProfile, onCommentAdded, onCommentDeleted }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);

    // Determine if this is an organization post
    const isOrganizationPost = post._isOrganizationPost;
    const commentsTable = isOrganizationPost ? 'organization_post_comments' : 'post_comments';
    const postIdField = isOrganizationPost ? 'organization_post_id' : 'post_id';

    // Fetches comments when the component mounts
    const fetchComments = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from(commentsTable)
            .select(`
                *, 
                profiles(
                    id, 
                    full_name, 
                    role, 
                    avatar_url,
                    organization_name
                )
            `)
            .eq(postIdField, post.id)
            .order('created_at', { ascending: true });
        
        if (error) {
            console.error("Error fetching comments:", error);
        } else {
            setComments(data || []);
        }
        setLoading(false);
    }, [post.id, commentsTable, postIdField]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    // Handles submitting a new comment
    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !currentUserProfile) return;

        const content = newComment.trim();
        setNewComment(''); // Clear input for better UX

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.error('No authenticated user found');
                setNewComment(content); // Restore input
                return;
            }

            // Prepare comment data based on post type
            const commentData = {
                content: content,
                profile_id: currentUserProfile.id,
                user_id: user.id
            };
            
            // Add the appropriate post ID field
            commentData[postIdField] = post.id;

            console.log('Submitting comment:', {
                table: commentsTable,
                data: commentData,
                postType: isOrganizationPost ? 'organization' : 'regular'
            });

            // Insert the new comment and select it back to get the full object
            const { data: createdComment, error } = await supabase
                .from(commentsTable)
                .insert(commentData)
                .select(`
                    *,
                    profiles(
                        id, 
                        full_name, 
                        role, 
                        avatar_url,
                        organization_name
                    )
                `)
                .single();

            if (error) {
                console.error("Error posting comment:", error);
                setNewComment(content); // Restore input if submission fails
                alert(`Failed to post comment: ${error.message}`);
                return;
            }

            console.log('Comment created successfully:', createdComment);

            // Optimistically update the UI with the new comment
            setComments(currentComments => [...currentComments, createdComment]);
            
            // Update the post's comment count
            if (isOrganizationPost) {
                try {
                    await supabase.rpc('update_organization_post_comments_count', { 
                        post_id: post.id 
                    });
                } catch (rpcError) {
                    console.warn('Failed to update comment count:', rpcError);
                }
            }
            
            // Notify the parent component that a comment was added
            if (onCommentAdded) {
                onCommentAdded();
            }

        } catch (error) {
            console.error("Unexpected error posting comment:", error);
            setNewComment(content); // Restore input
            alert('Failed to post comment. Please try again.');
        }
    };
    
    // Handles deleting a comment
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
            // Update the post's comment count
            if (isOrganizationPost) {
                await supabase.rpc('update_organization_post_comments_count', { 
                    post_id: post.id 
                });
            }
            
            // Notify the parent component that a comment was deleted
            if (onCommentDeleted) {
                onCommentDeleted();
            }
        }
    };

    return (
        <div className="pt-4 mt-2 space-y-4">
            {/* New Comment Form - FIXED: Added user avatar */}
            <form onSubmit={handleCommentSubmit} className="flex items-start space-x-3">
                <Avatar 
                    src={currentUserProfile?.avatar_url} 
                    fullName={currentUserProfile?.full_name} 
                    size="sm" 
                />
                <div className="flex-1 relative">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="w-full p-2 pr-10 bg-slate-100 rounded-lg border-slate-200 focus:ring-2 focus:ring-blue-500 placeholder-slate-500 transition-all text-sm resize-none"
                        rows="1"
                        style={{ minHeight: '40px' }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleCommentSubmit(e);
                            }
                        }}
                    />
                    <button 
                        type="submit" 
                        disabled={!newComment.trim()} 
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-600 disabled:text-slate-400 rounded-full hover:bg-blue-100 disabled:hover:bg-transparent transition-colors"
                        onClick={(e) => {
                            e.preventDefault();
                            handleCommentSubmit(e);
                        }}
                    >
                        <Send size={18} />
                    </button>
                </div>
            </form>

            {/* Comments List */}
            <div className="space-y-4">
                {loading && <p className="text-sm text-slate-500">Loading comments...</p>}
                {comments.map(comment => (
                    <div key={comment.id} className="flex items-start space-x-3">
                        <Avatar 
                            src={comment.profiles?.avatar_url} 
                            fullName={comment.profiles?.full_name} 
                            size="sm" 
                        />
                        <div className="flex-1 min-w-0">
                            <div className="bg-slate-100 rounded-lg p-3">
                                <div className="flex items-start justify-between mb-1">
                                    <div className="flex items-center space-x-2">
                                        <span className="font-medium text-slate-900 text-sm">
                                            {comment.profiles?.full_name}
                                        </span>
                                        {comment.profiles?.organization_name && (
                                            <span className="text-xs text-slate-500">
                                                • {comment.profiles.organization_name}
                                            </span>
                                        )}
                                    </div>
                                    {(currentUserProfile?.id === comment.profile_id) && (
                                        <button
                                            onClick={() => handleDeleteComment(comment.id)}
                                            className="text-slate-400 hover:text-red-500 p-1"
                                            title="Delete comment"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                                <p className="text-slate-700 text-sm leading-relaxed">
                                    {comment.content}
                                </p>
                            </div>
                            <div className="mt-1 ml-2">
                                <span className="text-xs text-slate-500">
                                    {timeAgo(comment.created_at)}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
                {!loading && comments.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4">
                        No comments yet. Be the first to comment!
                    </p>
                )}
            </div>
        </div>
    );
}