// src/components/dashboard/PostDetailModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import PostBody from '../post/PostBody';
import PostActions from '../post/PostActions';
import CommentSection from '../CommentSection';
import { reactions } from '../post/constants';
import PropTypes from 'prop-types';

const PostDetailModal = ({ post, isOpen, onClose, currentUserProfile }) => {
    const [likeCount, setLikeCount] = useState(post?.likes_count || 0);
    const [commentCount, setCommentCount] = useState(post?.comments_count || 0);
    const [selectedReaction, setSelectedReaction] = useState(null);
    const [reactors, setReactors] = useState([]);
    const [reactionSummary, setReactionSummary] = useState(post?.reactions?.summary || []);
    const [showComments, setShowComments] = useState(false);
    const [showReactorsPreview, setShowReactorsPreview] = useState(false);
    const reactorsTimeoutRef = useRef(null);

    // Update modal state when post prop changes (from real-time updates)
    useEffect(() => {
        if (post) {
            setLikeCount(post.likes_count || 0);
            setCommentCount(post.comments_count || 0);
            setReactionSummary(post.reactions?.summary || []);
        }
    }, [post]);

    const formatTimeAgo = (dateString) => {
        const now = new Date();
        const postDate = new Date(dateString);
        const diffInHours = Math.floor((now - postDate) / (1000 * 60 * 60));
        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours}h ago`;
        return `${Math.floor(diffInHours / 24)}d ago`;
    };

    // Check user's reaction status - FIXED
    useEffect(() => {
        const checkReactionStatus = async () => {
            if (!currentUserProfile || !post?.id) return;
            try {
                const { data, error } = await supabase
                    .from('post_likes')
                    .select('reaction_type')
                    .eq('post_id', post.id)
                    .eq('user_id', currentUserProfile.id)
                    .limit(1);  // Use limit instead of single()
                
                if (error) {
                    console.error('Error checking reaction status:', error);
                    setSelectedReaction(null);
                    return;
                }
                
                setSelectedReaction(data && data.length > 0 ? data[0].reaction_type : null);
            } catch (error) {
                console.error('Error in checkReactionStatus:', error);
                setSelectedReaction(null);
            }
        };
        
        if (isOpen && post) {
            checkReactionStatus();
        }
    }, [currentUserProfile, post?.id, isOpen]);

    // Fetch reactors - FIXED
    useEffect(() => {
        const fetchReactors = async () => {
            if (likeCount <= 0 || !post?.id) {
                setReactors([]);
                return;
            }
            try {
                const { data: likesData, error: likesError } = await supabase
                    .from('post_likes')
                    .select('user_id, reaction_type, created_at')
                    .eq('post_id', post.id)
                    .order('created_at', { ascending: false });

                if (likesError) {
                    console.error('Error fetching likes:', likesError);
                    setReactors([]);
                    return;
                }

                if (likesData && likesData.length > 0) {
                    const userIds = likesData.map(like => like.user_id);
                    const { data: profilesData, error: profilesError } = await supabase
                        .from('profiles')
                        .select('id, full_name, avatar_url, title, organization_name, role')
                        .in('id', userIds);

                    if (profilesError) {
                        console.error('Error fetching profiles:', profilesError);
                        setReactors([]);
                        return;
                    }

                    const transformedReactors = likesData.map(like => {
                        const profile = profilesData?.find(p => p.id === like.user_id);
                        return {
                            user_id: like.user_id,
                            profile_id: profile?.id,
                            full_name: profile?.full_name,
                            avatar_url: profile?.avatar_url,
                            title: profile?.title,
                            organization_name: profile?.organization_name,
                            role: profile?.role,
                            reaction_type: like.reaction_type,
                            created_at: like.created_at
                        };
                    }).filter(reactor => reactor.full_name);
                    setReactors(transformedReactors);
                } else {
                    setReactors([]);
                }
            } catch (error) {
                console.error('Error fetching reactors:', error);
                setReactors([]);
            }
        };
        
        if (isOpen && post) {
            fetchReactors();
        }
    }, [post?.id, likeCount, isOpen]);

    const handleReaction = async (reactionType) => {
        if (!currentUserProfile || !post?.id) return;
        
        try {
            if (selectedReaction === reactionType) {
                // Remove reaction
                const { error } = await supabase
                    .from('post_likes')
                    .delete()
                    .eq('post_id', post.id)
                    .eq('user_id', currentUserProfile.id);
                
                if (error) {
                    console.error('Error removing reaction:', error);
                    return;
                }
                
                setSelectedReaction(null);
                setLikeCount(prev => Math.max(0, prev - 1));
            } else {
                // Add or update reaction
                const { error } = await supabase
                    .from('post_likes')
                    .upsert({
                        post_id: post.id,
                        user_id: currentUserProfile.id,
                        reaction_type: reactionType
                    }, { onConflict: 'post_id,user_id' });
                
                if (error) {
                    console.error('Error adding reaction:', error);
                    return;
                }
                
                setSelectedReaction(reactionType);
                if (!selectedReaction) {
                    setLikeCount(prev => prev + 1);
                }
            }
        } catch (error) {
            console.error('Error handling reaction:', error);
        }
    };

    const handleReactorsEnter = () => {
        clearTimeout(reactorsTimeoutRef.current);
        setShowReactorsPreview(true);
    };

    const handleReactorsLeave = () => {
        reactorsTimeoutRef.current = setTimeout(() => {
            setShowReactorsPreview(false);
        }, 300);
    };

    const handleImageClick = (index) => {
        // Close modal and handle image viewing
        console.log('Image clicked:', index);
    };

    if (!isOpen || !post) return null;

    const displayImages = post.image_urls && post.image_urls.length > 0 ? post.image_urls : (post.image_url ? [post.image_url] : []);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <div className="flex items-center space-x-3">
                        <img
                            src={post.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.profiles?.full_name || 'User')}&background=6366f1&color=ffffff`}
                            alt={post.profiles?.full_name || 'User'}
                            className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                            <h3 className="font-semibold text-slate-900">
                                {post.profiles?.full_name || 'Anonymous'}
                            </h3>
                            {post.profiles?.organization_name && (
                                <p className="text-sm text-slate-500">
                                    {post.profiles.organization_name}
                                </p>
                            )}
                            <p className="text-xs text-slate-400">
                                {formatTimeAgo(post.created_at)}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 max-h-[calc(90vh-180px)] overflow-y-auto">
                    {/* Post Body using the same component as PostCard */}
                    <PostBody 
                        content={post.content || ''}
                        images={displayImages}
                        tags={post.tags}
                        onImageClick={handleImageClick}
                    />

                    {/* Reaction Summary and Comment Count */}
                    <div className="flex items-center justify-between text-sm text-slate-500 my-4 min-h-[20px]">
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
                                        {reactors.slice(0, 3).map(reactor => reactor.full_name).join(', ')}
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

                    {/* Post Actions */}
                    <PostActions 
                        onReaction={handleReaction}
                        onComment={() => setShowComments(!showComments)}
                        onShare={() => alert('Share functionality not implemented yet.')}
                        selectedReaction={selectedReaction}
                        disabled={false}
                    />

                    {/* Comments Section */}
                    {showComments && (
                        <div className="mt-4 border-t pt-4 max-h-96 overflow-y-auto">
                            <CommentSection 
                                post={post}
                                currentUserProfile={currentUserProfile}
                                onCommentAdded={() => setCommentCount(prev => prev + 1)}
                                onCommentDeleted={() => setCommentCount(prev => Math.max(0, prev - 1))}
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
    currentUserProfile: PropTypes.object
};

export default PostDetailModal;