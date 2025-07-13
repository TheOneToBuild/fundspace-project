// src/components/PostCard.jsx
import React, { useState, useEffect, memo, lazy, Suspense } from 'react';
import { supabase } from '../supabaseClient';
import { useOutletContext } from 'react-router-dom';

// Import components that are always visible
import PostHeader from './post/PostHeader';
import PostBody from './post/PostBody';
import PostActions from './post/PostActions';
import EditPost from './post/EditPost';
import CommentSection from './CommentSection';
import ReactorsText from './post/ReactorsText';
import ReactionsPreview from './post/ReactionsPreview';
import { reactions } from './post/constants';

// Lazily import components that are only shown after user interaction
const ReactionsModal = lazy(() => import('./post/ReactionsModal'));
const ImageViewer = lazy(() => import('./post/ImageViewer'));


function PostCard({ post, onDelete, disabled = false }) {
    const { profile: currentUserProfile } = useOutletContext();
    const [likeCount, setLikeCount] = useState(post.likes_count || 0);
    const [commentCount, setCommentCount] = useState(post.comments_count || 0);
    const [selectedReaction, setSelectedReaction] = useState(null);
    const [reactors, setReactors] = useState([]);
    const [reactionSummary, setReactionSummary] = useState(post.reactions?.summary || []);

    const [isEditing, setIsEditing] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [showReactionsModal, setShowReactionsModal] = useState(false);
    const [showReactorsPreview, setShowReactorsPreview] = useState(false);
    const reactorsTimeoutRef = React.useRef(null);

    const { content, created_at, profiles: author, image_url, image_urls, tags } = post;
    const isAuthor = currentUserProfile?.id === author?.id;
    const displayImages = image_urls && image_urls.length > 0 ? image_urls : (image_url ? [image_url] : []);

    // --- DATA FETCHING AND STATE SYNC ---
    useEffect(() => {
        setCommentCount(post.comments_count || 0);
        setLikeCount(post.likes_count || 0);
        setReactionSummary(post.reactions?.summary || []);
    }, [post]);
    
    useEffect(() => {
        const fetchReactors = async () => {
            if (likeCount <= 0 || !post?.id) {
                setReactors([]);
                return;
            }
            try {
                const { data: likesData } = await supabase.from('post_likes').select('user_id, reaction_type, created_at').eq('post_id', post.id).order('created_at', { ascending: false });
                if (likesData && likesData.length > 0) {
                    const userIds = likesData.map(like => like.user_id);
                    const { data: profilesData } = await supabase.from('profiles').select('id, full_name, avatar_url, title, organization_name, role').in('id', userIds);
                    const transformedReactors = likesData.map(like => {
                        const profile = profilesData?.find(p => p.id === like.user_id);
                        return { user_id: like.user_id, profile_id: profile?.id, full_name: profile?.full_name, avatar_url: profile?.avatar_url, title: profile?.title, organization_name: profile?.organization_name, role: profile?.role, reaction_type: like.reaction_type, created_at: like.created_at };
                    }).filter(reactor => reactor.full_name);
                    setReactors(transformedReactors);
                } else {
                    setReactors([]);
                }
            } catch (error) {
                console.error('Error in fetchReactors:', error);
                setReactors([]);
            }
        };
        fetchReactors();
    }, [post.id, likeCount]);

    useEffect(() => {
        const checkReactionStatus = async () => {
            if (!currentUserProfile || !post?.id) return;
            const { data } = await supabase.from('post_likes').select('reaction_type').eq('post_id', post.id).eq('user_id', currentUserProfile.id).maybeSingle();
            setSelectedReaction(data?.reaction_type || null);
        };
        checkReactionStatus();
    }, [post.id, currentUserProfile]);

    // --- HANDLER FUNCTIONS ---
    const refreshPostData = async () => {
        if (!post?.id) return;
        try {
            const { data: likesData, error: likesError } = await supabase.from('post_likes').select('user_id, reaction_type').eq('post_id', post.id);
            if (likesError) throw likesError;

            const summary = {};
            likesData.forEach(like => {
                const type = like.reaction_type || 'like';
                summary[type] = (summary[type] || 0) + 1;
            });
            setLikeCount(likesData.length);
            setReactionSummary(Object.entries(summary).map(([type, count]) => ({ type, count })));
        } catch (error) {
            console.error('Failed to refresh post data:', error);
        }
    };

    const handleReaction = async (reactionType) => {
        if (!currentUserProfile || !post?.id || disabled) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: existingReaction } = await supabase.from('post_likes').select('id').eq('post_id', post.id).eq('user_id', user.id).maybeSingle();
        if (existingReaction && selectedReaction === reactionType) {
            await supabase.from('post_likes').delete().eq('id', existingReaction.id);
            setSelectedReaction(null);
        } else {
            await supabase.from('post_likes').upsert({ post_id: post.id, user_id: user.id, reaction_type: reactionType }, { onConflict: 'post_id,user_id' });
            setSelectedReaction(reactionType);
        }
        await refreshPostData();
    };

    const handleEditPost = async (editData) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || user.id !== post.user_id) return;

        const updateData = {
            content: editData.content.trim(),
            tags: editData.tags.length > 0 ? JSON.stringify(editData.tags) : null,
            image_urls: editData.images.length > 0 ? editData.images : null,
            image_url: editData.images.length === 1 ? editData.images[0] : null,
        };

        const { error } = await supabase.from('posts').update(updateData).eq('id', post.id);
        if (error) {
            alert('Failed to update post. Please try again.');
        } else {
            post.content = updateData.content;
            post.tags = editData.tags;
            post.image_urls = updateData.image_urls;
            post.image_url = updateData.image_url;
            setIsEditing(false);
        }
    };

    const handleDeletePost = async () => {
        const { error } = await supabase.from('posts').delete().eq('id', post.id);
        if (error) {
            alert("Failed to delete post.");
        } else if (onDelete) {
            onDelete(post.id);
        }
    };

    const handleImageClick = (index) => {
        setSelectedImageIndex(index);
        setIsImageModalOpen(true);
    };

    const handleReactorsEnter = () => {
        clearTimeout(reactorsTimeoutRef.current);
        setShowReactorsPreview(true);
    };

    const handleReactorsLeave = () => {
        reactorsTimeoutRef.current = setTimeout(() => { setShowReactorsPreview(false); }, 300);
    };

    if (!post || !author) return null;

    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <PostHeader author={author} createdAt={created_at} isAuthor={isAuthor} onEdit={() => setIsEditing(true)} onDelete={handleDeletePost} />

            {isEditing ? (
                <EditPost post={post} onSave={handleEditPost} onCancel={() => setIsEditing(false)} />
            ) : (
                <PostBody content={content} images={displayImages} tags={tags} onImageClick={handleImageClick} />
            )}

            <div className="flex items-center justify-between text-sm text-slate-500 my-2 min-h-[20px]">
                <div className="relative" onMouseEnter={handleReactorsEnter} onMouseLeave={handleReactorsLeave}>
                    {likeCount > 0 && (
                         <div className="flex items-center cursor-pointer">
                            <div className="flex items-center -space-x-1">
                                {(reactionSummary || []).sort((a, b) => b.count - a.count).slice(0, 3).map(({ type }) => {
                                    const reaction = reactions.find(r => r.type === type);
                                    if (!reaction) return null;
                                    return <div key={type} className={`p-0.5 rounded-full ${reaction.color} border-2 border-white`}><reaction.Icon size={12} className="text-white" /></div>;
                                })}
                            </div>
                            <ReactorsText likeCount={likeCount} reactors={reactors} onViewReactions={() => setShowReactionsModal(true)} />
                        </div>
                    )}
                    {showReactorsPreview && likeCount > 0 && (
                        <ReactionsPreview reactors={reactors} likeCount={likeCount} onViewAll={() => { setShowReactorsPreview(false); setShowReactionsModal(true); }} />
                    )}
                </div>
                {commentCount > 0 && (
                    <span className="cursor-pointer hover:underline" onClick={() => setShowComments(!showComments)}>
                        {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
                    </span>
                )}
            </div>

            {!isEditing && (
                <PostActions onReaction={handleReaction} onComment={() => setShowComments(!showComments)} onShare={() => alert('Share functionality not implemented yet.')} selectedReaction={selectedReaction} disabled={disabled} />
            )}

            {showComments && (
                <div className="mt-4 border-t pt-4 max-h-96 overflow-y-auto">
                    <CommentSection post={post} currentUserProfile={currentUserProfile} onCommentAdded={() => setCommentCount(prev => prev + 1)} onCommentDeleted={() => setCommentCount(prev => Math.max(0, prev - 1))} />
                </div>
            )}

            <Suspense fallback={null}>
                {showReactionsModal && (
                    <ReactionsModal isOpen={showReactionsModal} onClose={() => setShowReactionsModal(false)} reactors={reactors} likeCount={likeCount} reactionSummary={reactionSummary} />
                )}
                {isImageModalOpen && (
                    <ImageViewer post={post} images={displayImages} initialIndex={selectedImageIndex} isOpen={isImageModalOpen} onClose={() => setIsImageModalOpen(false)} onReaction={handleReaction} selectedReaction={selectedReaction} currentUserProfile={currentUserProfile} likeCount={likeCount} reactionSummary={reactionSummary} commentCount={commentCount} onCommentAdded={() => setCommentCount(prev => prev + 1)} onCommentDeleted={() => setCommentCount(prev => Math.max(0, prev - 1))} reactors={reactors} onViewReactions={() => setShowReactionsModal(true)} />
                )}
            </Suspense>
        </div>
    );
}

export default memo(PostCard);