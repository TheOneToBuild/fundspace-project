// src/components/post/ImageViewer.jsx - Fixed white dots issue
import React, { useState, useEffect } from 'react';
import { ThumbsUp, MessageSquare, Share2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
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

    // Function to get organization slug from ID
    const getOrganizationSlug = async (orgType, orgId) => {
        try {
            const tableName = orgType === 'nonprofit' ? 'nonprofits' : 'funders';
            const { data, error } = await supabase
                .from(tableName)
                .select('slug')
                .eq('id', parseInt(orgId))
                .single();

            if (error) {
                console.error(`❌ Error fetching ${orgType} slug:`, error);
                return null;
            }

            console.log(`✅ Found ${orgType} slug:`, data?.slug);
            return data?.slug;
        } catch (error) {
            console.error(`💥 Exception fetching ${orgType} slug:`, error);
            return null;
        }
    };

    // FIXED: Process content to properly render mentions and remove white dots
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
            
            // CRITICAL FIX: Clean up any extra whitespace or invisible characters
            if (span.textContent) {
                span.textContent = span.textContent.trim();
            }
        });
        
        // CRITICAL FIX: Clean the entire content to remove problematic whitespace
        let cleanedHTML = tempDiv.innerHTML;
        
        // Remove zero-width spaces and other problematic characters that cause white dots
        cleanedHTML = cleanedHTML
            .replace(/\u200B/g, '') // Remove zero-width spaces
            .replace(/\u00A0/g, ' ') // Replace non-breaking spaces with regular spaces
            .replace(/\u2002/g, ' ') // Replace en spaces
            .replace(/\u2003/g, ' ') // Replace em spaces
            .replace(/\s+/g, ' ')    // Normalize multiple spaces to single space
            .trim();                 // Remove leading/trailing whitespace
        
        return cleanedHTML;
    };

    const handleMentionClick = async (e) => {
        const target = e.target;
        
        if (target.tagName === 'SPAN' && 
            (target.classList.contains('mention') || target.dataset.type)) {
            
            e.preventDefault();
            e.stopPropagation();
            
            const mentionId = target.dataset.id;
            const mentionType = target.dataset.type;
            const mentionLabel = target.dataset.label;

            if (!mentionId || !mentionType) {
                console.warn('⚠️ ImageViewer: Incomplete mention data:', { mentionId, mentionType, mentionLabel });
                return;
            }

            console.log('🔍 ImageViewer: Processing mention click:', { mentionId, mentionType, mentionLabel });

            try {
                if (mentionType === 'user') {
                    console.log('👤 ImageViewer: Navigating to user profile:', mentionId);
                    navigate(`/profile/members/${mentionId}`);
                } else if (mentionType === 'organization') {
                    console.log('🏢 ImageViewer: Processing organization mention:', mentionId);
                    
                    if (mentionId.includes('-')) {
                        const [orgType, orgId] = mentionId.split('-');
                        console.log('🔄 ImageViewer: Old format detected:', { orgType, orgId });
                        
                        if (orgId) {
                            const slug = await getOrganizationSlug(orgType, orgId);
                            if (slug) {
                                console.log('✅ ImageViewer: Found slug, navigating:', slug);
                                navigate(`/organizations/${slug}`);
                            } else {
                                console.warn('⚠️ ImageViewer: No slug found, trying fallback navigation');
                                const fallbackPath = orgType === 'nonprofit' ? `/nonprofits/${orgId}` : `/funders/${orgId}`;
                                console.log(`🔄 Trying fallback navigation: ${fallbackPath}`);
                                navigate(fallbackPath);
                            }
                        }
                    } else {
                        console.log('✨ New format detected, navigating to slug:', mentionId);
                        navigate(`/organizations/${mentionId}`);
                    }
                }
            } catch (error) {
                console.error('💥 Error during mention navigation:', error);
            }
        }
    };

    const nextImage = () => {
        setCurrentIndex(prev => (prev + 1) % images.length);
    };

    const prevImage = () => {
        setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
    };

    const currentReaction = selectedReaction ? reactions.find(r => r.type === selectedReaction) : null;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="max-w-7xl mx-auto flex bg-white rounded-lg overflow-hidden shadow-2xl" style={{ maxHeight: '90vh', width: '90vw' }}>
                {showImageSection && images.length > 0 && (
                    <div className="flex-1 bg-black flex items-center justify-center relative">
                        <img src={images[currentIndex]} alt={`Image ${currentIndex + 1}`} className="max-w-full max-h-full object-contain" />
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
                            <style>
                                {`
                                .image-viewer-content .mention {
                                    background-color: #e0e7ff;
                                    color: #3730a3;
                                    padding: 1px 4px;
                                    border-radius: 4px;
                                    font-weight: 500;
                                    text-decoration: none;
                                    cursor: pointer;
                                    transition: all 0.2s ease;
                                }
                                .image-viewer-content .mention:hover {
                                    background-color: #c7d2fe;
                                    text-decoration: underline;
                                }
                                .image-viewer-content p {
                                    margin: 0;
                                    line-height: 1.4;
                                }
                                `}
                            </style>
                            <div 
                                className="text-gray-800 leading-relaxed text-base image-viewer-content"
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
                            {showReactionPanel && (
                                <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border p-2 flex space-x-1 z-10">
                                    {reactions.map(reaction => (
                                        <button key={reaction.type} onClick={() => { onReaction(reaction.type); setShowReactionPanel(false); }} className={`p-2 rounded-lg hover:bg-gray-100 ${reaction.color}`}>
                                            <reaction.Icon size={24} className="text-white" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button className="flex items-center justify-center space-x-2 py-3 px-4 rounded-lg hover:bg-gray-100 text-gray-600">
                            <MessageSquare size={20} />
                            <span className="font-medium text-sm">Comment</span>
                        </button>
                        <button className="flex items-center justify-center space-x-2 py-3 px-4 rounded-lg hover:bg-gray-100 text-gray-600">
                            <Share2 size={20} />
                            <span className="font-medium text-sm">Share</span>
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <CommentSection post={post} currentUserProfile={currentUserProfile} onCommentAdded={onCommentAdded} onCommentDeleted={onCommentDeleted} showCommentForm={true} />
                    </div>
                </div>
            </div>
        </div>
    );
}