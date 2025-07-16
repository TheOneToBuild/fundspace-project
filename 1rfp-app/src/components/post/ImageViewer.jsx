// src/components/post/ImageViewer.jsx
import React, { useState, useEffect } from 'react';
import { ThumbsUp, MessageSquare, Share2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { timeAgo } from '../../utils/time';
import { reactions } from './constants';
import Avatar from '../Avatar';
import TagDisplay from './TagDisplay';
import CommentSection from '../CommentSection';
import ReactorsText from './ReactorsText';
import PostHeader from './PostHeader';

export default function ImageViewer({
    post,
    images,
    initialIndex,
    isOpen,
    onClose,
    onReaction,
    selectedReaction,
    currentUserProfile,
    likeCount,
    reactionSummary,
    commentCount,
    showImageSection = true,
    onCommentAdded,
    onCommentDeleted,
    reactors = [],
    onViewReactions
}) {
    const navigate = useNavigate();
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [showReactionPanel, setShowReactionPanel] = useState(false);

    useEffect(() => { setCurrentIndex(initialIndex); }, [initialIndex]);
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    // Process content to properly render mentions
    const processContentForDisplay = (htmlContent) => {
        if (!htmlContent) return '';
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        
        const allSpans = tempDiv.querySelectorAll('span');
        allSpans.forEach(span => {
            const hasDataType = span.dataset.type;
            const hasDataId = span.dataset.id;
            const hasMentionClass = span.classList.contains('mention');
            
            if ((hasDataType || hasDataId) && !hasMentionClass) {
                span.classList.add('mention');
            }
        });
        
        return tempDiv.innerHTML;
    };

    // Handle mention clicks
    const handleMentionClick = (e) => {
        const target = e.target;
        
        if (target.tagName === 'SPAN' && 
            (target.classList.contains('mention') || target.dataset.type)) {
            
            e.preventDefault();
            e.stopPropagation();
            
            const mentionId = target.dataset.id;
            const mentionType = target.dataset.type;

            if (!mentionId || !mentionType) {
                console.warn('Missing mention data for click navigation');
                return;
            }

            // Close the image viewer first
            onClose();

            // Navigate based on mention type
            if (mentionType === 'user') {
                navigate(`/profile/${mentionId}`);
            } else if (mentionType === 'organization') {
                const [orgType, orgId] = mentionId.split('-');
                if (orgId) {
                    if (orgType === 'nonprofit') {
                        navigate(`/nonprofits/${orgId}`);
                    } else if (orgType === 'funder') {
                        navigate(`/funders/${orgId}`);
                    }
                } else {
                    console.warn('Invalid organization ID format:', mentionId);
                }
            }
        }
    };

    if (!isOpen) return null;

    const nextImage = () => images.length > 1 && setCurrentIndex((p) => (p + 1) % images.length);
    const prevImage = () => images.length > 1 && setCurrentIndex((p) => (p - 1 + images.length) % images.length);
    const handleBackdropClick = (e) => (e.target === e.currentTarget) && onClose();
    const handleReaction = async (type) => { await onReaction(type); setShowReactionPanel(false); };
    
    const currentReaction = reactions.find(r => r.type === selectedReaction);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-6" onClick={handleBackdropClick}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex" onClick={e => e.stopPropagation()}>
                {/* Image Panel */}
                {showImageSection && (
                    <div className="flex-[2] bg-gradient-to-br from-rose-50 via-orange-50 to-yellow-50 relative flex items-center justify-center">
                        <img src={images[currentIndex]} alt={`Post content ${currentIndex + 1}`} className="max-w-full max-h-full object-contain" />
                        <button onClick={onClose} className="absolute top-4 right-4 bg-white/80 hover:bg-white text-black rounded-full p-2 z-10 shadow-lg"><X size={20} /></button>
                        {images.length > 1 && <>
                            <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black rounded-full p-2 z-10 shadow-lg"><ChevronLeft size={20} /></button>
                            <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black rounded-full p-2 z-10 shadow-lg"><ChevronRight size={20} /></button>
                            <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm font-medium">
                                {currentIndex + 1} / {images.length}
                            </div>
                        </>}
                    </div>
                )}
                {/* Details Panel */}
                <div className="bg-white flex flex-col flex-1 min-w-[420px] max-w-[480px]">
                    <div className="p-6 border-b">
                        <PostHeader author={post.profiles} createdAt={post.created_at} isAuthor={currentUserProfile?.id === post.profiles?.id} />
                    </div>
                    {post.content && (
                        <div className="px-6 py-4 border-b">
                            <div 
                                className="text-gray-800 leading-relaxed text-base"
                                onClick={handleMentionClick}
                                dangerouslySetInnerHTML={{ 
                                    __html: processContentForDisplay(post.content) 
                                }}
                            />
                        </div>
                    )}
                    {post.tags?.length > 0 && <div className="px-6 py-3 border-b"><TagDisplay tags={post.tags} /></div>}
                    <div className="px-6 py-4 border-b">
                        <div className="flex items-center justify-between">
                             <div className="flex items-center">
                                {likeCount > 0 && (
                                    <div className="flex items-center -space-x-1 mr-2">
                                        {(reactionSummary || []).sort((a, b) => b.count - a.count).slice(0, 3).map(({ type }) => {
                                            const reaction = reactions.find(r => r.type === type);
                                            if (!reaction) return null;
                                            return <div key={type} className={`p-0.5 rounded-full ${reaction.color} border-2 border-white`}><reaction.Icon size={12} className="text-white" /></div>;
                                        })}
                                    </div>
                                )}
                                <ReactorsText likeCount={likeCount} reactors={reactors} onViewReactions={onViewReactions} />
                            </div>
                            {commentCount > 0 && <span className="text-gray-600 text-sm hover:underline cursor-pointer">{commentCount} {commentCount === 1 ? 'comment' : 'comments'}</span>}
                        </div>
                    </div>
                    <div className="px-6 py-3 border-b flex items-center space-x-1">
                        <div className="relative flex-1">
                            <button onClick={() => setShowReactionPanel(!showReactionPanel)} className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg hover:bg-gray-100 ${currentReaction ? currentReaction.color.replace('bg-', 'text-') : 'text-gray-600'}`}>
                                {currentReaction ? <currentReaction.Icon size={20} /> : <ThumbsUp size={20} />}
                                <span className="font-medium text-sm">{currentReaction ? currentReaction.label : 'Like'}</span>
                            </button>
                            {showReactionPanel && <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-lg border p-2 flex space-x-1">
                                {reactions.map(({ type, Icon, color, label }) => <button key={type} onClick={() => handleReaction(type)} className={`p-2 rounded-full hover:scale-110 ${color}`} title={label}><Icon size={16} className="text-white" /></button>)}
                            </div>}
                        </div>
                        <button className="flex-1 flex items-center justify-center space-x-2 text-gray-600 hover:bg-gray-100 py-3 px-4 rounded-lg"><MessageSquare size={20} /><span className="font-medium text-sm">Comment</span></button>
                        <button className="flex-1 flex items-center justify-center space-x-2 text-gray-600 hover:bg-gray-100 py-3 px-4 rounded-lg"><Share2 size={20} /><span className="font-medium text-sm">Share</span></button>
                    </div>
                    <div className="p-6 flex-1 overflow-y-auto">
                        <CommentSection post={post} currentUserProfile={currentUserProfile} onCommentAdded={onCommentAdded} onCommentDeleted={onCommentDeleted} compact={true} />
                    </div>
                </div>
            </div>
        </div>
    );
};