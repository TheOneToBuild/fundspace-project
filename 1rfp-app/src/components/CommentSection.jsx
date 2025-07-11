// Updated CommentSection.jsx with Avatar components
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Send, Trash2 } from 'lucide-react';
import Avatar from './Avatar.jsx'; // Import the Avatar component

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

    // Fetches comments when the component mounts
    const fetchComments = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('post_comments')
            .select(`
                *, 
                profiles(
                    id, 
                    full_name, 
                    role, 
                    avatar_url,
                    organization_name
                )
            `) // Include avatar_url in the fetch
            .eq('post_id', post.id)
            .order('created_at', { ascending: true });
        
        if (error) {
            console.error("Error fetching comments:", error);
        } else {
            setComments(data || []);
        }
        setLoading(false);
    }, [post.id]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    // Handles submitting a new comment
    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !currentUserProfile) return;

        const content = newComment.trim();
        setNewComment(''); // Clear input for better UX

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Insert the new comment and select it back to get the full object
        const { data: createdComment, error } = await supabase
            .from('post_comments')
            .insert({
                content: content,
                post_id: post.id,
                profile_id: currentUserProfile.id,
                user_id: user.id
            })
            .select()
            .single();

        if (error) {
            console.error("Error posting comment:", error);
            setNewComment(content); // Restore input if submission fails
        } else {
            // Optimistically update the UI with the new comment
            const commentWithProfile = { ...createdComment, profiles: currentUserProfile };
            setComments(currentComments => [...currentComments, commentWithProfile]);
            
            // Notify the parent component that a comment was added
            if (onCommentAdded) {
                onCommentAdded();
            }
        }
    };
    
    // Handles deleting a comment
    const handleDeleteComment = async (commentId) => {
        // Optimistically remove the comment from the UI
        setComments(currentComments => currentComments.filter(c => c.id !== commentId));

        const { error } = await supabase
            .from('post_comments')
            .delete()
            .eq('id', commentId);

        if (error) {
            console.error("Error deleting comment:", error);
            fetchComments(); // Re-fetch comments to correct the UI if delete fails
        } else {
            // Notify the parent component that a comment was deleted
            if (onCommentDeleted) {
                onCommentDeleted();
            }
        }
    };

    return (
        <div className="pt-4 mt-2 space-y-4">
            {/* New Comment Form */}
            <form onSubmit={handleCommentSubmit} className="flex items-start space-x-3">
                {/* Replace initials div with Avatar component */}
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
                        className="w-full p-2 pr-10 bg-slate-100 rounded-lg border-slate-200 focus:ring-2 focus:ring-blue-500 placeholder-slate-500 transition-all text-sm"
                        rows="1"
                    />
                    <button 
                        type="submit" 
                        disabled={!newComment.trim()} 
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-600 disabled:text-slate-400 rounded-full hover:bg-blue-100 disabled:hover:bg-transparent"
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
                        {/* Replace initials div with Avatar component */}
                        <Avatar 
                            src={comment.profiles?.avatar_url} 
                            fullName={comment.profiles?.full_name} 
                            size="sm" 
                        />
                        <div className="flex-1 bg-slate-100 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center space-x-2">
                                    <span className="font-semibold text-slate-900 text-sm">
                                        {comment.profiles?.full_name || 'Unknown User'}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                        {timeAgo(comment.created_at)}
                                    </span>
                                </div>
                                {/* Show delete button only for the comment author */}
                                {comment.profile_id === currentUserProfile?.id && (
                                    <button
                                        onClick={() => handleDeleteComment(comment.id)}
                                        className="text-slate-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors"
                                        title="Delete comment"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                            <p className="text-sm text-slate-700">{comment.content}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}