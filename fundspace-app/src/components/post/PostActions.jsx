// src/components/post/PostActions.jsx - Fixed to prevent duplicate reaction calls
import React, { useState, useRef, useCallback } from 'react';
import { MessageSquare, Share2 } from 'lucide-react';
import { reactions } from './constants';

export default function PostActions({ 
    onReaction, 
    onComment, 
    onShare, 
    selectedReaction, 
    disabled = false,
    postId // Add postId to track which post this is for
}) {
    const [isReactionPanelOpen, setReactionPanelOpen] = useState(false);
    const [isProcessingReaction, setIsProcessingReaction] = useState(false);
    const reactionTimeoutRef = useRef(null);
    const processingTimeoutRef = useRef(null);
    const reactionDebounceRef = useRef(null);

    // Prevent duplicate reaction calls with debouncing
    const handleReactionClick = useCallback(async (reactionType) => {
        if (disabled || isProcessingReaction) return;
        
        // Clear any pending debounced calls
        if (reactionDebounceRef.current) {
            clearTimeout(reactionDebounceRef.current);
        }
        
        // Debounce rapid clicks
        reactionDebounceRef.current = setTimeout(async () => {
            // Set processing state to prevent duplicate clicks
            setIsProcessingReaction(true);
            
            try {
                await onReaction(reactionType);
            } catch (error) {
                console.error('Error in reaction:', error);
            } finally {
                // Clear processing state after a delay
                processingTimeoutRef.current = setTimeout(() => {
                    setIsProcessingReaction(false);
                }, 500);
            }
        }, 200); // 200ms debounce
    }, [onReaction, disabled, isProcessingReaction]);

    const handleReactionMouseEnter = useCallback(() => {
        if (disabled || isProcessingReaction) return;
        clearTimeout(reactionTimeoutRef.current);
        setReactionPanelOpen(true);
    }, [disabled, isProcessingReaction]);

    const handleReactionMouseLeave = useCallback(() => {
        reactionTimeoutRef.current = setTimeout(() => {
            setReactionPanelOpen(false);
        }, 300);
    }, []);

    const handleQuickReaction = useCallback(() => {
        handleReactionClick('like');
    }, [handleReactionClick]);

    // Cleanup timeouts on unmount
    React.useEffect(() => {
        return () => {
            clearTimeout(reactionTimeoutRef.current);
            clearTimeout(processingTimeoutRef.current);
            clearTimeout(reactionDebounceRef.current);
        };
    }, []);

    const currentReaction = reactions.find(r => r.type === selectedReaction);
    const DefaultReactionIcon = reactions[0].Icon;

    return (
        <div className="border-t pt-3 flex items-center justify-between">
            <div className="relative">
                {/* Main reaction button */}
                <div
                    className={`flex items-center space-x-2 cursor-pointer hover:bg-slate-100 rounded-lg px-3 py-2 transition-colors ${
                        isProcessingReaction ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    onMouseEnter={handleReactionMouseEnter}
                    onMouseLeave={handleReactionMouseLeave}
                    onClick={handleQuickReaction}
                >
                    {currentReaction ? (
                        <currentReaction.Icon 
                            size={18} 
                            className={`${currentReaction.color.replace('bg-', 'text-')} fill-current`} 
                        />
                    ) : (
                        <DefaultReactionIcon size={18} className="text-slate-500" />
                    )}
                    <span className={`text-sm font-medium ${
                        currentReaction 
                            ? currentReaction.color.replace('bg-', 'text-') 
                            : 'text-slate-600'
                    }`}>
                        {currentReaction ? currentReaction.label : 'Like'}
                    </span>
                </div>

                {/* Reaction picker panel */}
                {isReactionPanelOpen && !disabled && !isProcessingReaction && (
                    <div
                        className="absolute bottom-full mb-2 bg-white border rounded-lg shadow-lg px-3 py-2 flex space-x-2 z-30"
                        onMouseEnter={handleReactionMouseEnter}
                        onMouseLeave={handleReactionMouseLeave}
                    >
                        {reactions.map(({ type, Icon, color, label }) => (
                            <button
                                key={type}
                                onClick={() => handleReactionClick(type)}
                                disabled={isProcessingReaction}
                                className={`p-2 rounded-full hover:scale-110 transition-transform ${color} ${
                                    isProcessingReaction ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                                title={label}
                            >
                                <Icon size={16} className="text-white" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Comment button */}
            <button
                onClick={() => !disabled && onComment()}
                className="flex items-center space-x-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg px-3 py-2 transition-colors"
                disabled={disabled}
            >
                <MessageSquare size={18} />
                <span className="text-sm font-medium">Comment</span>
            </button>

            {/* Share button */}
            <button
                onClick={onShare}
                className="flex items-center space-x-2 text-slate-600 hover:text-green-600 hover:bg-slate-100 rounded-lg px-3 py-2 transition-colors"
            >
                <Share2 size={18} />
                <span className="text-sm font-medium">Share</span>
            </button>
        </div>
    );
}