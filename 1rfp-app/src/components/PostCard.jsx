// src/components/PostCard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useOutletContext } from 'react-router-dom';
import { ThumbsUp, MessageSquare, Share2, MoreHorizontal, Trash2 } from 'lucide-react';
import CommentSection from './CommentSection.jsx';

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

export default function PostCard({ post, onDelete }) {
    const { profile: currentUserProfile } = useOutletContext();
    
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(post.likes_count || 0);
    const [showComments, setShowComments] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuRef]);

    useEffect(() => {
        const checkLikeStatus = async () => {
            if (!currentUserProfile) return;
            // FIXED: Use currentUserProfile.id which is the user's auth ID
            const { data } = await supabase
                .from('post_likes')
                .select('id', { count: 'exact' })
                .eq('post_id', post.id)
                .eq('user_id', currentUserProfile.id);
            
            if (data && data.length > 0) setIsLiked(true);
        };
        checkLikeStatus();
    }, [post.id, currentUserProfile]);

    const handleLikeClick = async () => {
        if (!currentUserProfile) return;
        
        const newLikedState = !isLiked;
        setIsLiked(newLikedState);
        setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);

        if (newLikedState) {
            // FIXED: Use currentUserProfile.id
            await supabase.from('post_likes').insert({ post_id: post.id, user_id: currentUserProfile.id });
        } else {
            // FIXED: Use currentUserProfile.id
            await supabase.from('post_likes').delete().match({ post_id: post.id, user_id: currentUserProfile.id });
        }
    };

    const handleDeletePost = async () => {
        setIsMenuOpen(false);
        const { error } = await supabase.from('posts').delete().eq('id', post.id);
        if (error) {
            console.error("Error deleting post:", error);
        } else {
            onDelete(post.id);
        }
    };

    if (!post || !post.profiles) return null;

    const { content, created_at, profiles: author } = post;
    const isAuthor = currentUserProfile?.id === author.id;

    const getInitials = (name) => {
        if (!name) return '?';
        const words = name.split(' ');
        if (words.length > 1 && words[1]) return (words[0][0] + words[1][0]).toUpperCase();
        return (words[0] || '').substring(0, 2).toUpperCase();
    };

    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg flex-shrink-0">
                        {getInitials(author.full_name)}
                    </div>
                    <div>
                        <p className="font-bold text-slate-800">{author.full_name}</p>
                        <p className="text-xs text-slate-500">{author.organization_name || author.role}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2 text-slate-500">
                    <span className="text-xs">{timeAgo(created_at)}</span>
                    {isAuthor && (
                        <div className="relative" ref={menuRef}>
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1.5 rounded-full hover:bg-slate-100">
                                <MoreHorizontal size={18} />
                            </button>
                            {isMenuOpen && (
                                <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg border z-10">
                                    <button onClick={handleDeletePost} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                        <Trash2 size={14} /> Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap mb-4">{content}</p>

            <div className="flex items-center space-x-4 text-sm text-slate-500 mb-2">
                {likeCount > 0 && <span><span className="font-semibold">{likeCount}</span> Likes</span>}
                {post.comments_count > 0 && <span><span className="font-semibold">{post.comments_count}</span> Comments</span>}
            </div>

            <div className="border-t border-slate-100 pt-2 flex justify-around">
                <button onClick={handleLikeClick} className={`flex items-center space-x-2 w-full justify-center py-2 rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium ${isLiked ? 'text-blue-600 font-semibold' : 'text-slate-600'}`}>
                    <ThumbsUp size={18} fill={isLiked ? 'currentColor' : 'none'} />
                    <span>Like</span>
                </button>
                <button onClick={() => setShowComments(!showComments)} className="flex items-center space-x-2 w-full justify-center py-2 rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium text-slate-600">
                    <MessageSquare size={18} />
                    <span>Comment</span>
                </button>
                <button className="flex items-center space-x-2 w-full justify-center py-2 rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium text-slate-600">
                    <Share2 size={18} />
                    <span>Share</span>
                </button>
            </div>

            {showComments && <CommentSection post={post} currentUserProfile={currentUserProfile} />}
        </div>
    );
}
