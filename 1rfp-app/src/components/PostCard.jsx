// src/components/PostCard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useOutletContext } from 'react-router-dom';
import { ThumbsUp, Heart, Lightbulb, PartyPopper, Share2, MoreHorizontal, Trash2, MessageSquare, X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import CommentSection from './CommentSection.jsx';
import Avatar from './Avatar.jsx';

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

const ReactorsText = ({ likeCount, sample }) => {
    if (!likeCount || likeCount < 1) return null;
    const firstName = sample?.[0]?.split(' ')?.[0];

    let output;
    if (likeCount === 1 && firstName) {
        output = firstName;
    } else if (likeCount > 1 && firstName) {
        output = `${firstName} + ${likeCount - 1} others`;
    } else {
        output = likeCount;
    }

    return (
        <span className="ml-2 font-medium text-slate-600 hover:underline">
            {output}
        </span>
    );
};

// LinkedIn-Inspired Image Viewer Modal
const LinkedInImageViewer = ({ post, images, initialIndex, isOpen, onClose, onReaction, selectedReaction, currentUserProfile, likeCount, reactionSummary, commentCount }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [showReactionPanel, setShowReactionPanel] = useState(false);

    useEffect(() => {
        setCurrentIndex(initialIndex);
    }, [initialIndex]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const nextImage = () => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleReaction = async (reactionType) => {
        await onReaction(reactionType);
        setShowReactionPanel(false);
    };

    const currentReaction = reactions.find(r => r.type === selectedReaction);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-6" onClick={handleBackdropClick}>
            {/* LinkedIn-style Modal Container with proper padding */}
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex" onClick={e => e.stopPropagation()}>
                
                {/* Left Side - Image with gradient background instead of black */}
                <div className="flex-[2] bg-gradient-to-br from-rose-50 via-orange-50 to-yellow-50 relative flex items-center justify-center min-h-[600px]">
                    {/* Navigation arrows - LinkedIn style */}
                    {images.length > 1 && (
                        <>
                            <button
                                onClick={prevImage}
                                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white hover:bg-gray-100 text-black rounded-full p-2 transition-all z-10 shadow-lg"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                onClick={nextImage}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white hover:bg-gray-100 text-black rounded-full p-2 transition-all z-10 shadow-lg"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </>
                    )}
                    
                    {/* Close button - LinkedIn position */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 bg-white hover:bg-gray-100 text-black rounded-full p-2 transition-all z-10 shadow-lg"
                    >
                        <X size={20} />
                    </button>

                    {/* Image counter - LinkedIn style */}
                    {images.length > 1 && (
                        <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm font-medium">
                            {currentIndex + 1} / {images.length}
                        </div>
                    )}
                    
                    <img
                        src={images[currentIndex]}
                        alt={`Image ${currentIndex + 1}`}
                        className="max-w-full max-h-full object-contain"
                    />
                </div>

                {/* Right Side - Post Details & Comments with LinkedIn spacing */}
                <div className="flex-1 bg-white flex flex-col min-w-[420px] max-w-[480px]">
                    {/* Header with author info - LinkedIn style with padding */}
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-start space-x-3">
                            <Avatar src={post.profiles.avatar_url} fullName={post.profiles.full_name} size="md" />
                            <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                    <p className="font-semibold text-gray-900 text-base">{post.profiles.full_name}</p>
                                    <span className="text-gray-500">•</span>
                                    <span className="text-sm text-gray-500">{timeAgo(post.created_at)}</span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{post.profiles.organization_name || post.profiles.role}</p>
                            </div>
                        </div>
                    </div>

                    {/* Post content with proper spacing */}
                    {post.content && (
                        <div className="px-6 py-4 border-b border-gray-200">
                            <p className="text-gray-800 leading-relaxed text-base">{post.content}</p>
                        </div>
                    )}

                    {/* Reactions and comments count - LinkedIn style */}
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                {/* Reaction icons */}
                                <div className="flex items-center -space-x-1">
                                    {(reactionSummary || []).sort((a, b) => b.count - a.count).slice(0, 3).map(({ type }) => {
                                        const reaction = reactions.find(r => r.type === type);
                                        if (!reaction) return null;
                                        return (
                                            <div key={type} className={`p-1 rounded-full ${reaction.color} border-2 border-white shadow-sm`}>
                                                <reaction.Icon size={12} className="text-white" />
                                            </div>
                                        );
                                    })}
                                </div>
                                {likeCount > 0 && (
                                    <span className="text-gray-600 text-sm hover:underline cursor-pointer">
                                        {likeCount} {likeCount === 1 ? 'reaction' : 'reactions'}
                                    </span>
                                )}
                            </div>
                            <div className="text-gray-600 text-sm">
                                {commentCount > 0 && (
                                    <span className="hover:underline cursor-pointer">
                                        {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action buttons - LinkedIn style with proper spacing */}
                    <div className="px-6 py-3 border-b border-gray-200">
                        <div className="flex items-center space-x-1">
                            <div className="relative flex-1">
                                <button
                                    onClick={() => setShowReactionPanel(!showReactionPanel)}
                                    className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all hover:bg-gray-100 ${
                                        currentReaction 
                                            ? `${currentReaction.color.replace('bg-', 'text-')}` 
                                            : 'text-gray-600'
                                    }`}
                                >
                                    {currentReaction ? (
                                        <currentReaction.Icon size={20} />
                                    ) : (
                                        <ThumbsUp size={20} />
                                    )}
                                    <span className="text-sm font-medium">
                                        {currentReaction ? currentReaction.label : 'Like'}
                                    </span>
                                </button>

                                {showReactionPanel && (
                                    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border p-2 flex space-x-1">
                                        {reactions.map(({ type, Icon, color, label }) => (
                                            <button
                                                key={type}
                                                onClick={() => handleReaction(type)}
                                                className={`p-2 rounded-full hover:scale-110 transition-transform ${color}`}
                                                title={label}
                                            >
                                                <Icon size={16} className="text-white" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button className="flex-1 flex items-center justify-center space-x-2 text-gray-600 hover:bg-gray-100 py-3 px-4 rounded-lg transition-colors">
                                <MessageSquare size={20} />
                                <span className="text-sm font-medium">Comment</span>
                            </button>

                            <button className="flex-1 flex items-center justify-center space-x-2 text-gray-600 hover:bg-gray-100 py-3 px-4 rounded-lg transition-colors">
                                <Share2 size={20} />
                                <span className="text-sm font-medium">Share</span>
                            </button>
                        </div>
                    </div>

                    {/* Comments section with proper scrolling and padding */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-6">
                            <CommentSection 
                                post={post} 
                                currentUserProfile={currentUserProfile}
                                onCommentAdded={() => {}}
                                onCommentDeleted={() => {}}
                                compact={true}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Enhanced Image Mosaic Component with better randomization
const ImageMosaic = ({ images, onImageClick }) => {
    if (!images || images.length === 0) return null;

    // More varied mosaic layouts
    const getMosaicLayout = (count) => {
        const layouts = {
            1: [{ span: 'col-span-6 row-span-4', aspect: 'aspect-video' }],
            2: [
                { span: 'col-span-3 row-span-4', aspect: 'aspect-[3/4]' },
                { span: 'col-span-3 row-span-4', aspect: 'aspect-[3/4]' }
            ],
            3: [
                { span: 'col-span-4 row-span-4', aspect: 'aspect-square' },
                { span: 'col-span-2 row-span-2', aspect: 'aspect-square' },
                { span: 'col-span-2 row-span-2', aspect: 'aspect-square' }
            ],
            4: [
                { span: 'col-span-3 row-span-2', aspect: 'aspect-[3/2]' },
                { span: 'col-span-3 row-span-2', aspect: 'aspect-[3/2]' },
                { span: 'col-span-3 row-span-2', aspect: 'aspect-[3/2]' },
                { span: 'col-span-3 row-span-2', aspect: 'aspect-[3/2]' }
            ],
            5: [
                { span: 'col-span-3 row-span-3', aspect: 'aspect-square' },
                { span: 'col-span-3 row-span-3', aspect: 'aspect-square' },
                { span: 'col-span-2 row-span-2', aspect: 'aspect-square' },
                { span: 'col-span-2 row-span-2', aspect: 'aspect-square' },
                { span: 'col-span-2 row-span-2', aspect: 'aspect-square' }
            ],
            6: [
                { span: 'col-span-2 row-span-2', aspect: 'aspect-square' },
                { span: 'col-span-2 row-span-2', aspect: 'aspect-square' },
                { span: 'col-span-2 row-span-2', aspect: 'aspect-square' },
                { span: 'col-span-2 row-span-2', aspect: 'aspect-square' },
                { span: 'col-span-2 row-span-2', aspect: 'aspect-square' },
                { span: 'col-span-2 row-span-2', aspect: 'aspect-square' }
            ]
        };
        return layouts[count] || [];
    };

    const mosaicLayout = getMosaicLayout(images.length);

    return (
        <div className="mb-4 rounded-lg overflow-hidden">
            <div className="grid grid-cols-6 gap-2 auto-rows-fr">
                {images.slice(0, 6).map((imageUrl, index) => {
                    const layout = mosaicLayout[index] || { span: 'col-span-2 row-span-2', aspect: 'aspect-square' };
                    return (
                        <div 
                            key={index} 
                            className={`relative group cursor-pointer overflow-hidden rounded-lg ${layout.span}`}
                            onClick={() => onImageClick(index)}
                        >
                            <div className={`${layout.aspect} w-full`}>
                                <img
                                    src={imageUrl}
                                    alt={`Post image ${index + 1}`}
                                    className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
                                    onError={(e) => {
                                        console.error('Image failed to load:', imageUrl);
                                        e.target.style.display = 'none';
                                    }}
                                />
                            </div>
                            
                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                                <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" size={24} />
                            </div>
                            
                            {/* Show count overlay for last image if more than 6 images */}
                            {index === 5 && images.length > 6 && (
                                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                                    <span className="text-white font-bold text-xl">
                                        +{images.length - 6}
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
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
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(post.content || '');
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
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMenuOpen]);

    const handleReaction = async (reactionType) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
            if (selectedReaction === reactionType) {
                await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', user.id);
                setSelectedReaction(null);
                setLikeCount(prev => Math.max(0, prev - 1));
            } else {
                await supabase.from('post_likes').upsert({
                    post_id: post.id,
                    user_id: user.id,
                    reaction_type: reactionType
                });
                const wasNewReaction = !selectedReaction;
                setSelectedReaction(reactionType);
                if (wasNewReaction) {
                    setLikeCount(prev => prev + 1);
                }
            }
            await refreshPostData();
        } catch (error) {
            console.error('Error updating reaction:', error);
        }
        setReactionPanelOpen(false);
    };

    const handleEditPost = async () => {
        setIsMenuOpen(false);
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            console.error("No authenticated user found");
            return;
        }
        
        const { error } = await supabase
            .from('posts')
            .update({ content: editedContent.trim() })
            .eq('id', post.id)
            .eq('user_id', user.id);
        
        if (error) {
            console.error("Error updating post:", error);
        } else {
            setIsEditing(false);
            // Update the post content locally
            post.content = editedContent.trim();
        }
    };

    const handleCancelEdit = () => {
        setEditedContent(post.content || '');
        setIsEditing(false);
    };
    const handleDeletePost = async () => {
        setIsMenuOpen(false);
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            console.error("No authenticated user found");
            return;
        }
        
        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', post.id)
            .eq('user_id', user.id);
        
        if (error) {
            console.error("Error deleting post:", error);
        } else {
            if (onDelete) {
                onDelete(post.id);
            }
        }
    };

    const handleReactionMouseEnter = () => {
        clearTimeout(reactionTimeoutRef.current);
        setReactionPanelOpen(true);
    };

    const handleReactionMouseLeave = () => {
        reactionTimeoutRef.current = setTimeout(() => setReactionPanelOpen(false), 300);
    };
    
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

    const handleImageClick = (index) => {
        setSelectedImageIndex(index);
        setIsImageModalOpen(true);
    };
    
    if (!post || !post.profiles) return null;

    const { content, created_at, profiles: author, image_url, image_urls } = post;
    const isAuthor = currentUserProfile?.id === author.id;
    const currentReaction = reactions.find(r => r.type === selectedReaction);
    const DefaultReactionIcon = reactions[0].Icon;

    // Determine which images to display (prioritize image_urls array, fallback to single image_url)
    const displayImages = image_urls && image_urls.length > 0 ? image_urls : (image_url ? [image_url] : []);
    
    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <Avatar src={author.avatar_url} fullName={author.full_name} size="md" />
                    <div>
                        <p className="font-bold text-slate-800">{author.full_name}</p>
                        <p className="text-xs text-slate-500">{author.organization_name || author.role}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2 text-slate-500">
                    <span className="text-xs">{timeAgo(created_at)}</span>
                    {isAuthor && (
                        <div className="relative" ref={menuRef}>
                            <button onClick={() => setIsMenuOpen(c => !c)} className="p-1.5 rounded-full hover:bg-slate-100">
                                <MoreHorizontal size={18} />
                            </button>
                            {isMenuOpen && (
                                <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg border z-20">
                                    <button 
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            setIsEditing(true);
                                        }} 
                                        className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Edit
                                    </button>
                                    <button onClick={handleDeletePost} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                        <Trash2 size={14} /> Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {content && !isEditing && (
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap mb-4">{content}</p>
            )}

            {/* Edit Mode */}
            {isEditing && (
                <div className="mb-4">
                    <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="w-full p-3 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows="4"
                        placeholder="What's on your mind?"
                    />
                    <div className="flex items-center justify-end space-x-2 mt-3">
                        <button
                            onClick={handleCancelEdit}
                            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleEditPost}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Save
                        </button>
                    </div>
                </div>
            )}
            
            {/* Enhanced image mosaic display */}
            {displayImages.length > 0 && (
                <ImageMosaic 
                    images={displayImages} 
                    onImageClick={handleImageClick}
                />
            )}

            {/* LinkedIn-Inspired Image Viewer */}
            <LinkedInImageViewer
                post={post}
                images={displayImages}
                initialIndex={selectedImageIndex}
                isOpen={isImageModalOpen}
                onClose={() => setIsImageModalOpen(false)}
                onReaction={handleReaction}
                selectedReaction={selectedReaction}
                currentUserProfile={currentUserProfile}
                likeCount={likeCount}
                reactionSummary={reactionSummary}
                commentCount={commentCount}
            />
            
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
                                <div className="text-center text-slate-500 text-sm py-2">Loading...</div>
                            ) : (
                                <div className="space-y-1">
                                    {reactors.map((reactor, index) => (
                                        <div key={index} className="flex items-center space-x-2 p-1 rounded hover:bg-slate-50">
                                            <Avatar src={reactor.avatar_url} fullName={reactor.full_name} size="sm" />
                                            <span className="text-sm font-medium text-slate-700">{reactor.full_name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex items-center space-x-4">
                    {commentCount > 0 && (
                        <span className="cursor-pointer hover:underline" onClick={() => setShowComments(!showComments)}>
                            {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
                        </span>
                    )}
                </div>
            </div>

            <div className="border-t pt-3 flex items-center justify-between">
                <div className="relative">
                    <div 
                        className="flex items-center space-x-2 cursor-pointer hover:bg-slate-100 rounded-lg px-3 py-2 transition-colors"
                        onMouseEnter={handleReactionMouseEnter}
                        onMouseLeave={handleReactionMouseLeave}
                        onClick={() => handleReaction('like')}
                    >
                        {currentReaction ? (
                            <currentReaction.Icon size={18} className={`${currentReaction.color.replace('bg-', 'text-')} fill-current`} />
                        ) : (
                            <DefaultReactionIcon size={18} className="text-slate-500" />
                        )}
                        <span className={`text-sm font-medium ${currentReaction ? currentReaction.color.replace('bg-', 'text-') : 'text-slate-600'}`}>
                            {currentReaction ? currentReaction.label : 'Like'}
                        </span>
                    </div>
                    
                    {isReactionPanelOpen && (
                        <div 
                            className="absolute bottom-full mb-2 bg-white border rounded-lg shadow-lg px-3 py-2 flex space-x-2 z-30"
                            onMouseEnter={handleReactionMouseEnter}
                            onMouseLeave={handleReactionMouseLeave}
                        >
                            {reactions.map(({ type, Icon, color, label }) => (
                                <button
                                    key={type}
                                    onClick={() => handleReaction(type)}
                                    className={`p-2 rounded-full hover:scale-110 transition-transform ${color}`}
                                    title={label}
                                >
                                    <Icon size={16} className="text-white" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <button 
                    onClick={() => setShowComments(!showComments)}
                    className="flex items-center space-x-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg px-3 py-2 transition-colors"
                >
                    <MessageSquare size={18} />
                    <span className="text-sm font-medium">Comment</span>
                </button>

                <button className="flex items-center space-x-2 text-slate-600 hover:text-green-600 hover:bg-slate-100 rounded-lg px-3 py-2 transition-colors">
                    <Share2 size={18} />
                    <span className="text-sm font-medium">Share</span>
                </button>
            </div>

            {showComments && (
                <div className="mt-4 border-t pt-4">
                    <CommentSection 
                        post={post} 
                        currentUserProfile={currentUserProfile}
                        onCommentAdded={() => setCommentCount(prev => prev + 1)}
                        onCommentDeleted={() => setCommentCount(prev => Math.max(0, prev - 1))}
                    />
                </div>
            )}
        </div>
    );
}