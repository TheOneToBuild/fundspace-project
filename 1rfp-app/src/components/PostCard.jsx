// src/components/PostCard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useOutletContext } from 'react-router-dom';
import { ThumbsUp, Heart, Lightbulb, PartyPopper, Share2, MoreHorizontal, Trash2, MessageSquare } from 'lucide-react';
import CommentSection from './CommentSection.jsx';

// --- UI CONFIGURATION FOR REACTIONS ---
const reactions = [
    { type: 'like', Icon: ThumbsUp, color: 'bg-blue-500', label: 'Like' },
    { type: 'love', Icon: Heart, color: 'bg-red-500', label: 'Love' },
    { type: 'celebrate', Icon: PartyPopper, color: 'bg-green-500', label: 'Celebrate' },
    { type: 'insightful', Icon: Lightbulb, color: 'bg-yellow-500', label: 'Insightful' },
];

const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    // ... (timeAgo function remains the same)
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

export default function PostCard({ post, onDelete }) {
    const { profile: currentUserProfile } = useOutletContext();
    
    // --- STATE MANAGEMENT ---
    const [selectedReaction, setSelectedReaction] = useState(null);
    const [likeCount, setLikeCount] = useState(post.likes_count || 0);
    const [commentCount, setCommentCount] = useState(post.comments_count || 0);
    const [reactionSummary, setReactionSummary] = useState(post.reactions || []);
    const [showComments, setShowComments] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isReactionPanelOpen, setReactionPanelOpen] = useState(false);
    const menuRef = useRef(null);
    const reactionTimeoutRef = useRef(null);
    
    // ... (useEffect hooks remain mostly the same)
    useEffect(() => {
        setCommentCount(post.comments_count || 0);
        setLikeCount(post.likes_count || 0);
        setReactionSummary(post.reactions || []);
    }, [post.comments_count, post.likes_count, post.reactions]);

    useEffect(() => {
        const checkReactionStatus = async () => {
            if (!currentUserProfile) return;
            const { data } = await supabase.from('post_likes').select('reaction_type').eq('post_id', post.id).eq('user_id', currentUserProfile.id).single();
            if (data) setSelectedReaction(data.reaction_type);
            else setSelectedReaction(null);
        };
        checkReactionStatus();
    }, [post.id, currentUserProfile]);
    
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) setIsMenuOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleReaction = async (reactionType) => {
        // ... (handleReaction function remains the same)
        if (!currentUserProfile) return;
        if (reactionType === selectedReaction) {
            setSelectedReaction(null);
            setLikeCount(prev => prev - 1);
            await supabase.from('post_likes').delete().match({ post_id: post.id, user_id: currentUserProfile.id });
        } else {
            if (!selectedReaction) setLikeCount(prev => prev + 1);
            setSelectedReaction(reactionType);
            await supabase.from('post_likes').upsert({ post_id: post.id, user_id: currentUserProfile.id, reaction_type: reactionType }, { onConflict: 'post_id, user_id' });
        }
        setReactionPanelOpen(false);
    };

    const handleDeletePost = async () => {
        setIsMenuOpen(false);
        const { error } = await supabase.from('posts').delete().eq('id', post.id);
        if (error) console.error("Error deleting post:", error);
        else onDelete(post.id);
    };

    const handleMouseEnter = () => {
        clearTimeout(reactionTimeoutRef.current);
        setReactionPanelOpen(true);
    };

    const handleMouseLeave = () => {
        reactionTimeoutRef.current = setTimeout(() => setReactionPanelOpen(false), 300);
    };
    
    if (!post || !post.profiles) return null;

    const { content, created_at, profiles: author } = post;
    const isAuthor = currentUserProfile?.id === author.id;
    const currentReaction = reactions.find(r => r.type === selectedReaction);
    const DefaultReactionIcon = reactions[0].Icon;
    
    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            {/* ... Post Header ... */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg flex-shrink-0">{getInitials(author.full_name)}</div>
                    <div>
                        <p className="font-bold text-slate-800">{author.full_name}</p>
                        <p className="text-xs text-slate-500">{author.organization_name || author.role}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2 text-slate-500">
                    <span className="text-xs">{timeAgo(created_at)}</span>
                    {isAuthor && (
                        <div className="relative" ref={menuRef}><button onClick={() => setIsMenuOpen(c => !c)} className="p-1.5 rounded-full hover:bg-slate-100"><MoreHorizontal size={18} /></button>
                            {isMenuOpen && <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg border z-20"><button onClick={handleDeletePost} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"><Trash2 size={14} /> Delete</button></div>}
                        </div>
                    )}
                </div>
            </div>

            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap mb-4">{content}</p>
            
            {/* --- MODIFICATION: Updated Counts Display --- */}
            <div className="flex items-center justify-between text-sm text-slate-500 mb-2">
                <div className="flex items-center">
                    {likeCount > 0 && (
                        <>
                            <div className="flex items-center -space-x-1">
                                {reactionSummary
                                    .sort((a, b) => b.count - a.count) // Show most popular reactions first
                                    .slice(0, 3) // Show top 3
                                    .map(({ type }) => {
                                        const reaction = reactions.find(r => r.type === type);
                                        if (!reaction) return null;
                                        return (
                                            <div key={type} className={`p-0.5 rounded-full ${reaction.color} border-2 border-white`}>
                                                <reaction.Icon size={12} className="text-white" />
                                            </div>
                                        );
                                    })}
                            </div>
                            <span className="ml-2 font-medium text-slate-600">{likeCount}</span>
                        </>
                    )}
                </div>
                {commentCount > 0 && <span onClick={() => setShowComments(c => !c)} className="cursor-pointer hover:underline">{commentCount} Comments</span>}
            </div>

            {/* ... ACTION BUTTONS & REACTION PANEL ... */}
            <div className="border-t border-slate-100 pt-2 flex justify-around">
                 <div className="relative w-full" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                    {isReactionPanelOpen && <div className="absolute bottom-full mb-2 w-full flex justify-center"><div className="flex items-center gap-2 bg-white rounded-full shadow-lg border p-1.5">{reactions.map(({ type, Icon, color }) => (<button key={type} onClick={() => handleReaction(type)} className={`p-1.5 rounded-full transition-transform duration-150 hover:scale-125 text-white ${color}`}><Icon size={22} /></button>))}</div></div>}
                    <button onClick={() => handleReaction(selectedReaction || 'like')} className={`flex items-center space-x-2 w-full justify-center py-2 rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium ${currentReaction ? `${reactions.find(r=>r.type===selectedReaction)?.color.replace('bg-','text-')} font-semibold` : 'text-slate-600'}`}>
                        {currentReaction ? <currentReaction.Icon size={18} /> : <DefaultReactionIcon size={18} />}
                        <span>{currentReaction ? currentReaction.label : 'Like'}</span>
                    </button>
                </div>
                <button onClick={() => setShowComments(c => !c)} className={`flex items-center space-x-2 w-full justify-center py-2 rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium ${showComments ? 'text-blue-600 font-semibold' : 'text-slate-600'}`}>
                    <MessageSquare size={18} /><span>Comment</span>
                </button>
                <button className="flex items-center space-x-2 w-full justify-center py-2 rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium text-slate-600">
                    <Share2 size={18} /><span>Share</span>
                </button>
            </div>
            
            {showComments && <CommentSection post={post} currentUserProfile={currentUserProfile} />}
        </div>
    );
}