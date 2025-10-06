// src/components/post/ReactionsPreview.jsx
import React from 'react';
import Avatar from '../Avatar';
import { reactions } from './constants';

export default function ReactionsPreview({ reactors = [], likeCount, onViewAll }) {
    // Limit to maximum 6 reactors for preview
    const displayedReactors = reactors.slice(0, 6);
    const hasMore = likeCount > 6;

    return (
        <div 
            className="absolute left-0 bottom-full mb-2 bg-white rounded-lg shadow-lg border border-slate-200 p-3 z-10 min-w-[280px]"
            onMouseEnter={(e) => e.stopPropagation()}
        >
            <div className="space-y-2">
                {displayedReactors.map((reactor, index) => {
                    const reaction = reactions.find(r => r.type === reactor.reaction_type);
                    return (
                        <div key={index} className="flex items-center gap-2">
                            <Avatar 
                                src={reactor.avatar_url} 
                                fullName={reactor.full_name} 
                                size="sm" 
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 truncate">
                                    {reactor.full_name || 'Unknown User'}
                                </p>
                            </div>
                            {reaction && (
                                <div className={`p-0.5 rounded-full ${reaction.color}`}>
                                    <reaction.Icon size={10} className="text-white" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            
            {hasMore && (
                <button 
                    onClick={onViewAll}
                    className="mt-3 w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-1"
                >
                    View all {likeCount} reactions
                </button>
            )}
        </div>
    );
}