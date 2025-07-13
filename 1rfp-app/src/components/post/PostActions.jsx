// src/components/post/PostActions.jsx
import React, { useState, useRef } from 'react';
import { MessageSquare, Share2 } from 'lucide-react';
import { reactions } from './constants';

export default function PostActions({ onReaction, onComment, onShare, selectedReaction, disabled = false }) {
    const [isReactionPanelOpen, setReactionPanelOpen] = useState(false);
    const reactionTimeoutRef = useRef(null);

    const handleReactionMouseEnter = () => {
        clearTimeout(reactionTimeoutRef.current);
        setReactionPanelOpen(true);
    };

    const handleReactionMouseLeave = () => {
        reactionTimeoutRef.current = setTimeout(() => setReactionPanelOpen(false), 300);
    };

    const currentReaction = reactions.find(r => r.type === selectedReaction);
    const DefaultReactionIcon = reactions[0].Icon;

    return (
        <div className="border-t pt-3 flex items-center justify-between">
            <div className="relative">
                <div
                    className="flex items-center space-x-2 cursor-pointer hover:bg-slate-100 rounded-lg px-3 py-2 transition-colors"
                    onMouseEnter={handleReactionMouseEnter}
                    onMouseLeave={handleReactionMouseLeave}
                    onClick={() => !disabled && onReaction('like')}
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
                {isReactionPanelOpen && !disabled && (
                    <div
                        className="absolute bottom-full mb-2 bg-white border rounded-lg shadow-lg px-3 py-2 flex space-x-2 z-30"
                        onMouseEnter={handleReactionMouseEnter}
                        onMouseLeave={handleReactionMouseLeave}
                    >
                        {reactions.map(({ type, Icon, color, label }) => (
                            <button
                                key={type}
                                onClick={() => onReaction(type)}
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
                onClick={() => !disabled && onComment()}
                className="flex items-center space-x-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg px-3 py-2 transition-colors"
                disabled={disabled}
            >
                <MessageSquare size={18} />
                <span className="text-sm font-medium">Comment</span>
            </button>
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