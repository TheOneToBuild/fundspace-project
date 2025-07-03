// src/components/CommentSection.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Send } from 'lucide-react';

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

const getInitials = (name) => {
    if (!name) return '?';
    const words = name.split(' ');
    if (words.length > 1 && words[1]) return (words[0][0] + words[1][0]).toUpperCase();
    return (words[0] || '').substring(0, 2).toUpperCase();
};

export default function CommentSection({ post, currentUserProfile }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchComments = useCallback(async () => {
        const { data, error } = await supabase
            .from('post_comments')
            .select('*, profiles(full_name, role)')
            .eq('post_id', post.id)
            .order('created_at', { ascending: true });
        
        if (error) console.error("Error fetching comments:", error);
        else setComments(data);
        setLoading(false);
    }, [post.id]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !currentUserProfile) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('post_comments')
            .insert({
                content: newComment.trim(),
                post_id: post.id,
                profile_id: currentUserProfile.id,
                user_id: user.id
            });

        if (error) {
            console.error("Error posting comment:", error);
        } else {
            setNewComment('');
            fetchComments(); // Refetch comments to show the new one
        }
    };

    return (
        <div className="pt-4 mt-2 space-y-4">
            {/* New Comment Form */}
            <form onSubmit={handleCommentSubmit} className="flex items-start space-x-3">
                <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {getInitials(currentUserProfile?.full_name)}
                </div>
                <div className="flex-1 relative">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="w-full p-2 pr-10 bg-slate-100 rounded-lg border-slate-200 focus:ring-2 focus:ring-blue-500 placeholder-slate-500 transition-all text-sm"
                        rows="1"
                    />
                    <button type="submit" disabled={!newComment.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-600 disabled:text-slate-400 rounded-full hover:bg-blue-100 disabled:hover:bg-transparent">
                        <Send size={18} />
                    </button>
                </div>
            </form>

            {/* Comments List */}
            <div className="space-y-4">
                {loading && <p className="text-sm text-slate-500">Loading comments...</p>}
                {comments.map(comment => (
                    <div key={comment.id} className="flex items-start space-x-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {getInitials(comment.profiles.full_name)}
                        </div>
                        <div className="flex-1 bg-slate-50 p-3 rounded-lg">
                            <div className="flex items-baseline justify-between">
                                <p className="font-semibold text-sm text-slate-800">{comment.profiles.full_name}</p>
                                <p className="text-xs text-slate-400">{timeAgo(comment.created_at)}</p>
                            </div>
                            <p className="text-sm text-slate-700 mt-1">{comment.content}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
