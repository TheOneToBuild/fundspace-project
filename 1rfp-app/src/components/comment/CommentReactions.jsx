// src/components/comment/CommentReactions.jsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import Avatar from '../Avatar';
import { reactions } from './constants';

export default function CommentReactions({ 
    comment, 
    currentUserProfile, 
    isOrganizationPost, 
    onOpenReactionsModal 
}) {
    const [selectedReaction, setSelectedReaction] = useState(null);
    const [reactionSummary, setReactionSummary] = useState([]);
    const [totalLikes, setTotalLikes] = useState(comment.likes_count || 0);
    const [showReactionPicker, setShowReactionPicker] = useState(false);
    const [showReactorsPreview, setShowReactorsPreview] = useState(false);
    const [reactors, setReactors] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    
    const reactionTimeoutRef = useRef(null);
    const reactorsTimeoutRef = useRef(null);

    const commentReactionsTable = isOrganizationPost ? 'organization_post_comment_likes' : 'post_comment_likes';

    // Load user's reaction and reaction summary
    useEffect(() => {
        let isMounted = true;
        
        const loadReactions = async () => {
            if (!comment?.id) return;

            try {
                // Load user's reaction if user is logged in
                if (currentUserProfile?.id) {
                    const { data: userReaction, error: userReactionError } = await supabase
                        .from(commentReactionsTable)
                        .select('reaction_type')
                        .eq('comment_id', comment.id)
                        .eq('user_id', currentUserProfile.id)
                        .maybeSingle(); // Use maybeSingle instead of single to avoid PGRST116 error
                    
                    if (userReactionError) {
                        console.error('Error loading user reaction:', userReactionError);
                    }
                    
                    if (isMounted) {
                        setSelectedReaction(userReaction?.reaction_type || null);
                    }
                }

                // Load reaction summary
                const { data: reactionData, error: reactionError } = await supabase
                    .from(commentReactionsTable)
                    .select('reaction_type')
                    .eq('comment_id', comment.id);

                if (reactionError) {
                    console.error('Error loading reactions:', reactionError);
                } else if (reactionData && isMounted) {
                    const counts = {};
                    reactionData.forEach(like => {
                        const type = like.reaction_type || 'like';
                        counts[type] = (counts[type] || 0) + 1;
                    });

                    const summary = Object.entries(counts).map(([type, count]) => ({ type, count }));
                    setReactionSummary(summary);
                    setTotalLikes(reactionData.length);
                }
            } catch (error) {
                console.error('Error loading comment reactions:', error);
            }
        };

        loadReactions();

        return () => {
            isMounted = false;
        };
    }, [comment?.id, currentUserProfile?.id, commentReactionsTable]);

    const handleReaction = async (reactionType) => {
        if (!currentUserProfile?.id || !comment?.id || isLoading) return;

        setIsLoading(true);

        try {
            if (selectedReaction === reactionType) {
                // Remove reaction
                const { error } = await supabase
                    .from(commentReactionsTable)
                    .delete()
                    .eq('comment_id', comment.id)
                    .eq('user_id', currentUserProfile.id);

                if (error) throw error;
                
                setSelectedReaction(null);
                setTotalLikes(prev => Math.max(0, prev - 1));
                
                // Update reaction summary
                setReactionSummary(prev => {
                    return prev.map(r => 
                        r.type === reactionType ? { ...r, count: Math.max(0, r.count - 1) } : r
                    ).filter(r => r.count > 0);
                });
            } else {
                // Add or update reaction using the correct conflict resolution
                const { error } = await supabase
                    .from(commentReactionsTable)
                    .upsert({
                        comment_id: comment.id,
                        user_id: currentUserProfile.id,
                        reaction_type: reactionType
                    }, {
                        onConflict: 'comment_id,user_id'
                    });

                if (error) throw error;
                
                // Update local state optimistically
                const wasFirstReaction = !selectedReaction;
                const previousReaction = selectedReaction;
                setSelectedReaction(reactionType);
                
                if (wasFirstReaction) {
                    setTotalLikes(prev => prev + 1);
                    // Update reaction summary
                    setReactionSummary(prev => {
                        const existing = prev.find(r => r.type === reactionType);
                        if (existing) {
                            return prev.map(r => r.type === reactionType ? { ...r, count: r.count + 1 } : r);
                        } else {
                            return [...prev, { type: reactionType, count: 1 }];
                        }
                    });
                } else if (previousReaction !== reactionType) {
                    // Update reaction summary for changed reaction
                    setReactionSummary(prev => {
                        return prev.map(r => {
                            if (r.type === previousReaction) {
                                return { ...r, count: Math.max(0, r.count - 1) };
                            } else if (r.type === reactionType) {
                                return { ...r, count: r.count + 1 };
                            }
                            return r;
                        }).filter(r => r.count > 0);
                    });
                }
            }
            
            setShowReactionPicker(false);
        } catch (error) {
            console.error('Error handling comment reaction:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReactionMouseEnter = () => {
        clearTimeout(reactionTimeoutRef.current);
        setShowReactionPicker(true);
    };

    const handleReactionMouseLeave = () => {
        reactionTimeoutRef.current = setTimeout(() => setShowReactionPicker(false), 300);
    };

    const handleReactorsMouseEnter = async () => {
        clearTimeout(reactorsTimeoutRef.current);
        if (totalLikes > 0 && !isLoading) {
            try {
                // Use a simpler approach - get reactions and profiles separately
                const { data: reactionData } = await supabase
                    .from(commentReactionsTable)
                    .select('reaction_type, user_id')
                    .eq('comment_id', comment.id)
                    .limit(5);
                
                if (reactionData && reactionData.length > 0) {
                    // Get the user IDs
                    const userIds = reactionData.map(r => r.user_id);
                    
                    // Get profiles for those users
                    const { data: profileData } = await supabase
                        .from('profiles')
                        .select('id, full_name, avatar_url, organization_name')
                        .in('id', userIds);
                    
                    if (profileData) {
                        // Combine reaction data with profile data
                        const combinedData = reactionData.map(reaction => {
                            const profile = profileData.find(p => p.id === reaction.user_id);
                            return {
                                ...profile,
                                reaction_type: reaction.reaction_type,
                                profile_id: profile?.id,
                                user_id: reaction.user_id
                            };
                        });
                        
                        setReactors(combinedData);
                    }
                }
            } catch (error) {
                console.error('Error loading reactors:', error);
            }
            setShowReactorsPreview(true);
        }
    };

    const handleReactorsMouseLeave = () => {
        reactorsTimeoutRef.current = setTimeout(() => setShowReactorsPreview(false), 300);
    };

    const currentReaction = reactions.find(r => r.type === selectedReaction);
    const DefaultReactionIcon = reactions[0].Icon;

    return (
        <div className="flex items-center space-x-2">
            {/* Reaction Button */}
            <div
                className="relative"
                onMouseEnter={handleReactionMouseEnter}
                onMouseLeave={handleReactionMouseLeave}
            >
                <button
                    onClick={() => handleReaction('like')}
                    className="flex items-center space-x-1 text-xs text-slate-500 hover:text-blue-600 transition-colors px-2 py-1 rounded hover:bg-slate-100"
                    disabled={!currentUserProfile?.id || isLoading}
                >
                    {currentReaction ? (
                        <currentReaction.Icon size={14} className={`${currentReaction.color.replace('bg-', 'text-')} fill-current`} />
                    ) : (
                        <DefaultReactionIcon size={14} />
                    )}
                    <span>{currentReaction ? currentReaction.label : 'Like'}</span>
                </button>
                
                {/* Reaction Picker */}
                {showReactionPicker && (
                    <div 
                        className="absolute bottom-full mb-2 left-0 bg-white rounded-lg shadow-lg border p-2 flex space-x-1 z-30"
                        onMouseEnter={handleReactionMouseEnter}
                        onMouseLeave={handleReactionMouseLeave}
                    >
                        {reactions.map(reaction => (
                            <button
                                key={reaction.type}
                                onClick={() => handleReaction(reaction.type)}
                                className={`p-2 rounded-lg hover:bg-slate-100 transition-colors ${reaction.color} text-white hover:scale-110 transform transition-transform`}
                                title={reaction.label}
                                disabled={isLoading}
                            >
                                <reaction.Icon size={16} />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Reaction Summary */}
            {totalLikes > 0 && (
                <div 
                    className="relative flex items-center cursor-pointer"
                    onMouseEnter={handleReactorsMouseEnter}
                    onMouseLeave={handleReactorsMouseLeave}
                >
                    <div 
                        className="flex items-center -space-x-1 mr-1"
                        onClick={() => onOpenReactionsModal && onOpenReactionsModal(comment)}
                    >
                        {reactionSummary.sort((a, b) => b.count - a.count).slice(0, 3).map(({ type }) => {
                            const reaction = reactions.find(r => r.type === type);
                            if (!reaction) return null;
                            return (
                                <div key={type} className={`p-0.5 rounded-full ${reaction.color} border border-white`}>
                                    <reaction.Icon size={8} className="text-white" />
                                </div>
                            );
                        })}
                    </div>
                    <span 
                        className="text-xs text-slate-500 hover:underline"
                        onClick={() => onOpenReactionsModal && onOpenReactionsModal(comment)}
                    >
                        {totalLikes}
                    </span>

                    {/* Reactors Preview */}
                    {showReactorsPreview && totalLikes > 0 && (
                        <div className="absolute bottom-full mb-2 left-0 w-48 bg-white rounded-lg shadow-lg border z-20 p-2">
                            <div className="space-y-1">
                                {reactors.slice(0, 3).map((reactor, index) => (
                                    <div key={index} className="flex items-center space-x-2 text-xs">
                                        <Avatar src={reactor.avatar_url} fullName={reactor.full_name} size="xs" />
                                        <span className="font-medium text-slate-700 truncate">{reactor.full_name}</span>
                                        {reactor.reaction_type && (
                                            <div className="ml-auto">
                                                {(() => {
                                                    const reaction = reactions.find(r => r.type === reactor.reaction_type);
                                                    if (!reaction) return null;
                                                    return (
                                                        <div className={`p-0.5 rounded-full ${reaction.color}`}>
                                                            <reaction.Icon size={6} className="text-white" />
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {totalLikes > 3 && (
                                    <div 
                                        className="text-xs text-blue-600 pt-1 border-t cursor-pointer hover:underline"
                                        onClick={() => onOpenReactionsModal && onOpenReactionsModal(comment)}
                                    >
                                        Click to see all {totalLikes} reactions
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}