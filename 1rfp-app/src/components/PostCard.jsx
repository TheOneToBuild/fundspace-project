// src/components/PostCard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useOutletContext } from 'react-router-dom';
import { ThumbsUp, Heart, Lightbulb, PartyPopper, Share2, MoreHorizontal, Trash2, MessageSquare } from 'lucide-react';
import CommentSection from './CommentSection.jsx';

const reactions = [
    { type: 'like', Icon: ThumbsUp, color: 'bg-blue-500', label: 'Like' },
    { type: 'love', Icon: Heart, color: 'bg-red-500', label: 'Love' },
    { type: 'celebrate', Icon: PartyPopper, color: 'bg-green-500', label: 'Celebrate' },
    { type: 'insightful', Icon: Lightbulb, color: 'bg-yellow-500', label: 'Insightful' },
];

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

const ReactorsText = ({ likeCount, sample }) => {
    if (!likeCount) return null;
    if (!sample || sample.length === 0) {
        return <span className="ml-2 font-medium text-slate-600 hover:underline">{likeCount}</span>;
    }
    
    const firstName = sample[0].split(' ')[0];

    if (likeCount === 1) {
        return <span className="ml-2 font-medium text-slate-600 hover:underline">{firstName}</span>;
    }
    
    return (
        <span className="ml-2 font-medium text-slate-600 hover:underline">
            {firstName} and {likeCount - 1} others
        </span>
    );
};

export default function PostCard({ post, onDelete }) {
    const { profile: currentUserProfile } = useOutletContext();
    
    const [selectedReaction, setSelectedReaction] = useState(null);
    const [likeCount, setLikeCount] = useState(post.likes_count || 0);
    const [commentCount, setCommentCount] = useState(post.comments_count || 0);
    const [reactionSummary, setReactionSummary] = useState(post.reactions?.summary || []);
    const [reactionSample, setReactionSample] = useState(post.reactions?.sample || []);
    const [showComments, setShowComments] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isReactionPanelOpen, setReactionPanelOpen] = useState(false);
    const menuRef = useRef(null);
    const reactionTimeoutRef = useRef(null);
    const [showReactors, setShowReactors] = useState(false);
    const [reactors, setReactors] = useState([]);
    const [loadingReactors, setLoadingReactors] = useState(false);
    const reactorsTimeoutRef = useRef(null);

    const refreshPostData = async () => {
        const { data: refreshedPost, error } = await supabase.rpc('get_single_post', { p_post_id: post.id }).single();
        if (error) {
            console.error("Failed to refresh post data:", error);
        } else if (refreshedPost) {
            setLikeCount(refreshedPost.likes_count || 0);
            setReactionSummary(refreshedPost.reactions?.summary || []);
            setReactionSample(refreshedPost.reactions?.sample || []);
        }
    };

    useEffect(() => {
        setCommentCount(post.comments_count || 0);
        setLikeCount(post.likes_count || 0);
        setReactionSummary(post.reactions?.summary || []);
        setReactionSample(post.reactions?.sample || []);
    }, [post]);

    useEffect(() => {
        const checkReactionStatus = async () => {
            if (!currentUserProfile) return;
            const { data } = await supabase.from('post_likes').select('reaction_type').eq('post_id', post.id).eq('user_id', currentUserProfile.id).maybeSingle();
            if (data) setSelectedReaction(data.reaction_type);
            else setSelectedReaction(null);
        };
        checkReactionStatus();
    }, [post.id, currentUserProfile]);
    
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) setIsMenuOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleReaction = async (reactionType) => {
        if (!currentUserProfile) return;
        setReactionPanelOpen(false);

        if (reactionType === selectedReaction) {
            setSelectedReaction(null);
            setLikeCount(prev => prev - 1);
            await supabase.from('post_likes').delete().match({ post_id: post.id, user_id: currentUserProfile.id });
        } else {
            if (!selectedReaction) setLikeCount(prev => prev + 1);
            setSelectedReaction(reactionType);
            await supabase.from('post_likes').upsert({ post_id: post.id, user_id: currentUserProfile.id, reaction_type: reactionType }, { onConflict: 'post_id, user_id' });
        }
        
        await refreshPostData();
    };

    const handleCommentAdded = () => setCommentCount(current => current + 1);
    const handleCommentDeleted = () => setCommentCount(current => current - 1);

    const handleDeletePost = async () => {
        setIsMenuOpen(false);
        const { error } = await supabase.from('posts').delete().eq('id', post.id);
        if (error) console.error("Error deleting post:", error);
        else onDelete(post.id);
    };

    const handleReactionPanelEnter = () => { clearTimeout(reactionTimeoutRef.current); setReactionPanelOpen(true); };
    const handleReactionPanelLeave = () => { reactionTimeoutRef.current = setTimeout(() => setReactionPanelOpen(false), 300); };
    
    const handleReactorsEnter = async () => {
        clearTimeout(reactorsTimeoutRef.current);
        setShowReactors(true);
        if (reactors.length === 0) {
            setLoadingReactors(true);
            const { data, error } = await supabase.rpc('get_post_reactors', { p_post_id: post.id });
            if (error) console.error("Error fetching reactors:", error);
            else setReactors(data);
            setLoadingReactors(false);
        }
    };

    const handleReactorsLeave = () => {
        reactorsTimeoutRef.current = setTimeout(() => {
            setShowReactors(false);
        }, 300);
    };
    
    if (!post || !post.profiles) return null;

    const { content, created_at, profiles: author } = post;
    const isAuthor = currentUserProfile?.id === author.id;
    const currentReaction = reactions.find(r => r.type === selectedReaction);
    const DefaultReactionIcon = reactions[0].Icon;
    
    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
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
                        <div className="relative" ref={menuRef}>
                            <button onClick={() => setIsMenuOpen(c => !c)} className="p-1.5 rounded-full hover:bg-slate-100"><MoreHorizontal size={18} /></button>
                            {isMenuOpen && (
                                <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg border z-20">
                                    <button onClick={handleDeletePost} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"><Trash2 size={14} /> Delete</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap mb-4">{content}</p>
            
            <div className="flex items-center justify-between text-sm text-slate-500 mb-2 min-h-[20px]">
                <div className="relative" onMouseEnter={handleReactorsEnter} onMouseLeave={handleReactorsLeave}>
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
                            <ReactorsText likeCount={likeCount} sample={reactionSample} />
                        </div>
                    )}
                    {showReactors && likeCount > 0 && (
                        <div className="absolute bottom-full mb-2 w-60 bg-white rounded-lg shadow-lg border z-20 p-2 max-h-48 overflow-y-auto">
                            {loadingReactors ? (
                                <p className="text-xs text-slate-500 px-2 py-1">Loading...</p>
                            ) : (
                                <ul className="space-y-1">
                                    {reactors.map((reactor, index) => {
                                        const reaction = reactions.find(r => r.type === reactor.reaction_type);
                                        return (
                                            <li key={index} className="flex items-center justify-between text-sm px-2 py-1">
                                                <span>{reactor.full_name}</span>
                                                {reaction && (
                                                    <div className={`p-0.5 rounded-full ${reaction.color}`}>
                                                        <reaction.Icon size={14} className="text-white" />
                                                    </div>
                                                )}
                                            </li>
                                        )
                                    })}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
                {commentCount > 0 && <span onClick={() => setShowComments(c => !c)} className="cursor-pointer hover:underline">{commentCount} {commentCount === 1 ? 'Comment' : 'Comments'}</span>}
            </div>

            <div className="border-t border-slate-100 pt-2 flex justify-around">
                 <div className="relative w-full" onMouseEnter={handleReactionPanelEnter} onMouseLeave={handleReactionPanelLeave}>
                    {isReactionPanelOpen && (
                        <div className="absolute bottom-full mb-2 w-full flex justify-center">
                            <div className="flex items-center gap-2 bg-white rounded-full shadow-lg border p-1.5">{reactions.map(({ type, Icon, color }) => (<button key={type} onClick={() => handleReaction(type)} className={`p-1.5 rounded-full transition-transform duration-150 hover:scale-125 text-white ${color}`}><Icon size={22} /></button>))}</div>
                        </div>
                    )}
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
            
            {showComments && (
                <CommentSection 
                    post={post} 
                    currentUserProfile={currentUserProfile} 
                    onCommentAdded={handleCommentAdded}
                    onCommentDeleted={handleCommentDeleted}
                />
            )}
        </div>
    );
}