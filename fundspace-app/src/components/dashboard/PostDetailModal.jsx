import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { togglePostLike } from '../../utils/rpcClientFunctions';
import PostBody from '../post/PostBody';
import PostActions from '../post/PostActions';
import CommentSection from '../CommentSection';
import { reactions } from '../post/constants';
import ReactorsText from '../post/ReactorsText';
import ReactionsPreview from '../post/ReactionsPreview';
import ReactionsModal from '../post/ReactionsModal';
import PropTypes from 'prop-types';

const PostDetailModal = ({ post, isOpen, onClose, currentUserProfile, pageData, postsLikesData, onPostLike }) => {
    const navigate = useNavigate();
    const reactorsTimeoutRef = useRef(null);

    const displayAuthor = useMemo(() => {
        const postAuthor = post?.profile || post?.profiles || post?.author || post?.user;
        const authorId = postAuthor?.id || post?.profile_id || post?.user_id;
        
        if (!authorId) return postAuthor || { full_name: 'Unknown User' };
        
        const enhancedProfile = pageData?.profiles?.[authorId];
        const orgMembership = pageData?.orgMemberships?.[authorId];
        
        return {
            ...postAuthor,
            ...enhancedProfile,
            organization_name: orgMembership?.organization?.name || 
                              enhancedProfile?.organization_name || 
                              postAuthor?.organization_name,
            organization_type: orgMembership?.organization?.type || 
                              enhancedProfile?.organization_type || 
                              postAuthor?.organization_type,
            role: orgMembership?.role || enhancedProfile?.role || postAuthor?.role
        };
    }, [post, pageData]);

    const likesData = useMemo(() => 
        postsLikesData?.[post?.id] || pageData?.postLikes?.[post?.id], 
        [postsLikesData, pageData, post?.id]
    );

    const allImages = useMemo(() => {
        if (!post) return [];
        
        const extractContentImages = (content) => {
            if (!content) return [];
            const div = document.createElement('div');
            div.innerHTML = content;
            const imgElements = div.querySelectorAll('img');
            return Array.from(imgElements).map(img => img.src).filter(Boolean);
        };

        const contentImages = extractContentImages(post.content);
        
        return [
            ...(post.images || []),
            ...contentImages,
            ...(post.image_urls || []),
            ...(post.attachments || []).filter(att => att.type === 'image').map(att => att.url)
        ].filter(Boolean);
    }, [post]);

    const [likeCount, setLikeCount] = useState(() => 
        likesData?.likes_count || post?.likes_count || 0
    );
    const [commentCount, setCommentCount] = useState(post?.comments_count || 0);
    const [selectedReaction, setSelectedReaction] = useState(() => 
        post?.user_reaction || likesData?.userReaction || null
    );
    const [reactors, setReactors] = useState(() => 
        likesData?.reactors || []
    );
    const [reactionSummary, setReactionSummary] = useState(() => 
        likesData?.reaction_summary || post?.reactions?.summary || []
    );
    const [showComments, setShowComments] = useState(false);
    const [showReactorsPreview, setShowReactorsPreview] = useState(false);
    const [showReactionPicker, setShowReactionPicker] = useState(false);
    const [showReactionsModal, setShowReactionsModal] = useState(false);
    const [expandedImage, setExpandedImage] = useState(null);

    useEffect(() => {
      if (post && isOpen) {
        // Fetch fresh comment count when modal opens
        const fetchCommentCount = async () => {
            const tableName = post._isOrganizationPost ? 'organization_post_comments' : 'post_comments';
            const postField = post._isOrganizationPost ? 'organization_post_id' : 'post_id';
            
            const { count } = await supabase
                .from(tableName)
                .select('*', { count: 'exact', head: true })
                .eq(postField, post.id);
            
            setCommentCount(count || 0);
        };
        fetchCommentCount();
      }
      const fetchReactionData = async () => {
        if (!currentUserProfile?.id || !post?.id || !isOpen) return;
    
        try {
          // Fetch user's reaction
          const { data: userReactionData } = await supabase
            .from('post_likes')
            .select('reaction_type')
            .eq('post_id', post.id)
            .eq('user_id', currentUserProfile.id)
            .maybeSingle();
          
          if (userReactionData?.reaction_type) {
            setSelectedReaction(userReactionData.reaction_type);
          }
    
          // Fetch all reactors and reaction summary
          const { data: likesData } = await supabase
            .from('post_likes')
            .select('user_id, reaction_type')
            .eq('post_id', post.id);
    
          if (likesData && likesData.length > 0) {
            const userIds = [...new Set(likesData.map(l => l.user_id))];
            
            const { data: profilesData } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url, organization_name')
              .in('id', userIds);
    
            const enrichedReactors = likesData.map(like => {
              const profile = profilesData?.find(p => p.id === like.user_id);
              return {
                user_id: like.user_id,
                reaction_type: like.reaction_type,
                full_name: profile?.full_name,
                avatar_url: profile?.avatar_url,
                organization_name: profile?.organization_name
              };
            });
    
            // Calculate reaction summary
            const counts = {};
            likesData.forEach(like => {
              const type = like.reaction_type || 'like';
              counts[type] = (counts[type] || 0) + 1;
            });
            const summary = Object.entries(counts).map(([type, count]) => ({ type, count }));
    
            setReactors(enrichedReactors);
            setReactionSummary(summary);
            setLikeCount(likesData.length);
          }
        } catch (error) {
          console.error('Error fetching reaction data:', error);
        }
      };
    
      if (isOpen) {
        fetchReactionData();
      }
    }, [isOpen, post, currentUserProfile?.id]);

    const handleProfileClick = () => {
        const authorId = displayAuthor?.id || post?.profile_id || post?.user_id;
        if (authorId) {
            navigate(`/profile/members/${authorId}`);
            onClose(); // Close modal after navigation
        }
    };

    const handleOrganizationClick = async () => {
        if (!displayAuthor?.organization_name) return;
        
        // Try to get organization slug
        try {
            const authorId = displayAuthor?.id || post?.profile_id || post?.user_id;
            
            // Check if we have organization info in pageData
            const orgInfo = pageData?.orgMemberships?.[authorId];
            if (orgInfo?.organization?.slug) {
                navigate(`/organizations/${orgInfo.organization.slug}`);
                onClose();
                return;
            }
            
            // Otherwise search for the organization
            const { data: orgData } = await supabase
                .from('organizations')
                .select('slug, type')
                .ilike('name', displayAuthor.organization_name)
                .limit(1)
                .single();
            
            if (orgData?.slug) {
                navigate(`/organizations/${orgData.slug}`);
                onClose();
            }
        } catch (error) {
            console.error('Error navigating to organization:', error);
        }
    };

    const formatTimeAgo = useCallback((dateString) => {
        const now = new Date();
        const postDate = new Date(dateString);
        const diffInHours = Math.floor((now - postDate) / (1000 * 60 * 60));
        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours}h ago`;
        return `${Math.floor(diffInHours / 24)}d ago`;
    }, []);

    const handleReaction = useCallback(async (reactionType) => {
        if (!currentUserProfile?.id || !post?.id) return;
        
        if (onPostLike) {
            const newReaction = selectedReaction === reactionType ? null : reactionType;
            onPostLike(post.id, selectedReaction, newReaction);
            setSelectedReaction(newReaction);
            return;
        }        
        
        const optimisticReaction = selectedReaction === reactionType ? null : reactionType;
        const originalReaction = selectedReaction;
        setSelectedReaction(optimisticReaction);

        try {
            await togglePostLike(post.id, currentUserProfile.id, reactionType);
        } catch (error) {
            console.error('Error handling reaction:', error);
            setSelectedReaction(originalReaction); // Revert on error
        }
    }, [currentUserProfile, post?.id, selectedReaction, onPostLike]);

    const handleReactorsEnter = useCallback(async () => {
        if (reactorsTimeoutRef.current) {
            clearTimeout(reactorsTimeoutRef.current);
        }
        
        // If we don't have reactors data yet, fetch it for the preview
        if (post?.id && likeCount > 0 && reactors.length === 0) {
            try {
                const { data: likesData } = await supabase
                    .from('post_likes')
                    .select('user_id, reaction_type')
                    .eq('post_id', post.id)
                    .limit(5);

                if (likesData && likesData.length > 0) {
                    const userIds = likesData.map(l => l.user_id);
                    
                    const { data: profilesData } = await supabase
                        .from('profiles')
                        .select('id, full_name, avatar_url, organization_name')
                        .in('id', userIds);

                    const enrichedReactors = likesData.map(like => {
                        const profile = profilesData?.find(p => p.id === like.user_id);
                        return {
                            user_id: like.user_id,
                            reaction_type: like.reaction_type,
                            full_name: profile?.full_name,
                            avatar_url: profile?.avatar_url,
                            organization_name: profile?.organization_name
                        };
                    });
                    setReactors(enrichedReactors);
                }
            } catch (error) {
                console.error("Error fetching reactors for preview:", error);
            }
        }

        setShowReactorsPreview(true);
    }, [post?.id, likeCount, reactors.length]);

    const handleReactorsLeave = useCallback(() => {
        reactorsTimeoutRef.current = setTimeout(() => {
            setShowReactorsPreview(false);
        }, 300);
    }, []);

    const handleOpenReactionsModal = useCallback(async () => {
        if (likeCount > 0) {
            // Fetch fresh reactor data
            const likesTable = post._isOrganizationPost 
                ? 'organization_post_likes' 
                : 'post_likes';
            const postField = post._isOrganizationPost 
                ? 'organization_post_id' 
                : 'post_id';
    
            try {
                const { data: likesData } = await supabase
                    .from(likesTable)
                    .select('user_id, reaction_type')
                    .eq(postField, post.id);
    
                if (likesData && likesData.length > 0) {
                    const userIds = [...new Set(likesData.map(l => l.user_id))];
                    
                    const { data: profilesData } = await supabase
                        .from('profiles')
                        .select('id, full_name, avatar_url, organization_name')
                        .in('id', userIds);
    
                    const freshReactors = likesData.map(like => {
                        const profile = profilesData?.find(p => p.id === like.user_id);
                        return {
                            user_id: like.user_id,
                            reaction_type: like.reaction_type,
                            full_name: profile?.full_name,
                            avatar_url: profile?.avatar_url,
                            organization_name: profile?.organization_name
                        };
                    });
    
                    const counts = {};
                    likesData.forEach(like => {
                        const type = like.reaction_type || 'like';
                        counts[type] = (counts[type] || 0) + 1;
                    });
    
                    const freshSummary = Object.entries(counts).map(([type, count]) => ({ type, count }));
    
                    setReactors(freshReactors);
                    setReactionSummary(freshSummary);
                }
            } catch (error) {
                console.error('Error fetching reactors:', error);
            }
    
            setShowReactionsModal(true);
        }
    }, [likeCount, post?.id, post?._isOrganizationPost]);

    const handleBackdropClick = useCallback((event) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    }, [onClose]);

    const handleImageClick = useCallback((index) => {
        setExpandedImage(allImages[index]);
    }, [allImages]);

    const closeExpandedImage = () => {
        setExpandedImage(null);
    };
    const handleLikeClick = useCallback(() => {
        // Toggle reaction picker or directly like
        if (selectedReaction) {
            // If already reacted, remove reaction
            handleReaction(selectedReaction);
        } else {
            // Show picker to choose reaction type
            setShowReactionPicker(prev => !prev);
        }
    }, [selectedReaction, handleReaction]);

    const toggleComments = useCallback(() => {
        setShowComments(prev => !prev);
    }, []);

    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                if (expandedImage) {
                    // If image is expanded, just close the image
                    closeExpandedImage();
                } else {
                    // Otherwise close the entire modal
                    onClose();
                }
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen, onClose, expandedImage]); // Add expandedImage to dependencies

    useEffect(() => {
        return () => {
            if (reactorsTimeoutRef.current) {
                clearTimeout(reactorsTimeoutRef.current);
            }
        };
    }, []);

    if (!isOpen || !post) return null;

    const postWithMetadata = {
        ...post,
        _isOrganizationPost: false
    };

    return (
        <>
            {/* Post Modal - hide when image is expanded */}
            {!expandedImage && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
                    onClick={handleBackdropClick}
                    style={{ margin: 0 }}
                >
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-slate-900">Post</h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                                aria-label="Close modal"
                            >
                                <X size={20} className="text-slate-600" />
                            </button>
                        </div>
                        
                        <div className="p-6">
                            <div className="flex items-start space-x-3 mb-4">
                                <div 
                                    className="w-12 h-12 rounded-full overflow-hidden bg-slate-200 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={handleProfileClick}
                                >
                                    <img 
                                        src={displayAuthor?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayAuthor?.full_name || 'User')}&background=6366f1&color=ffffff`}
                                        alt={displayAuthor?.full_name || 'User'}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2">
                                        <h3 
                                            className="font-medium text-slate-900 truncate hover:underline cursor-pointer"
                                            onClick={handleProfileClick}
                                        >
                                            {displayAuthor?.full_name || 'Unknown User'}
                                        </h3>
                                        <span className="text-slate-400">•</span>
                                        <span className="text-sm text-slate-500">
                                            {formatTimeAgo(post.created_at)}
                                        </span>
                                    </div>
                                    {displayAuthor?.organization_name && (
                                        <p 
                                            className="text-sm text-slate-500 hover:underline cursor-pointer"
                                            onClick={handleOrganizationClick}
                        >
                                            {displayAuthor.organization_name}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <PostBody 
                                content={post.content}
                                images={allImages}
                                tags={post.tags}
                                onImageClick={handleImageClick}
                                expanded={true}
                            />

                            <div className="flex items-center justify-between text-sm text-slate-500 mb-4 pt-3 border-t border-slate-100">
                                <div 
                                    className="relative"
                                    onMouseEnter={handleReactorsEnter}
                                    onMouseLeave={handleReactorsLeave}
                                >
                                    {likeCount > 0 ? (
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
                                            <ReactorsText 
                                                likeCount={likeCount} 
                                                reactors={reactors}
                                                onViewReactions={handleOpenReactionsModal}
                                            />
                                        </div>
                                    ) : (
                                        <span className="text-slate-400">No reactions yet</span>
                                    )}
                                    {showReactorsPreview && likeCount > 0 && (
                                        <ReactionsPreview 
                                            reactors={reactors}
                                            likeCount={likeCount}
                                            onViewAll={handleOpenReactionsModal}
                                        />
                                    )}
                                </div>
                                {commentCount > 0 ? (
                                    <span 
                                        className="cursor-pointer hover:underline"
                                        onClick={toggleComments}
                                    >
                                        {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
                                    </span>
                                ) : (
                                    <span className="text-slate-400">No comments yet</span>
                                )}
                            </div>

                            <div className="mb-4">
                                <PostActions 
                                    onReaction={handleReaction}
                                    onComment={toggleComments}
                                    onShare={() => alert('Share functionality not implemented yet.')}
                                    selectedReaction={selectedReaction}
                                    disabled={false}
                                />
                            </div>

                            {showComments && (
                                <div className="mt-6 pt-6 border-t border-slate-200">
                                    <CommentSection
                                        post={postWithMetadata}
                                        currentUserProfile={currentUserProfile}
                                        onCommentAdded={() => setCommentCount(prev => prev + 1)}
                                        onCommentDeleted={() => setCommentCount(prev => Math.max(0, prev - 1))}
                                        pageData={pageData}
                                    />
                                </div>
                            )}
                            {showReactionsModal && (
                                <ReactionsModal 
                                    isOpen={showReactionsModal} 
                                    onClose={() => setShowReactionsModal(false)} 
                                    reactors={reactors} 
                                    likeCount={likeCount} 
                                    reactionSummary={reactionSummary} 
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Simple Image Lightbox */}
            {expandedImage && (
                <div 
                    className="fixed bg-black bg-opacity-75 flex items-center justify-center p-4"
                    style={{ 
                        top: 0, 
                        left: 0, 
                        right: 0, 
                        bottom: 0, 
                        zIndex: 99999,
                        margin: 0 
                    }}
                    onClick={closeExpandedImage}
                >
                    <button
                        onClick={closeExpandedImage}
                        className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                    <img
                        src={expandedImage}
                        alt="Expanded view"
                        className="max-w-full max-h-full object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </>
    );
};

PostDetailModal.propTypes = {
    post: PropTypes.object,
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    currentUserProfile: PropTypes.object,
    pageData: PropTypes.object,
    postsLikesData: PropTypes.object,
    onPostLike: PropTypes.func
};

export default PostDetailModal;