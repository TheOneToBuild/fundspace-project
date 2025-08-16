// src/components/post/ReactionsPreview.jsx
import React from 'react';
import Avatar from '../Avatar';
import { reactions } from './constants';

export default function ReactionsPreview({ reactors, likeCount, onViewAll }) {
    const previewCount = Math.min(3, reactors.length);
    const previewReactors = reactors.slice(0, previewCount);
    const remainingCount = likeCount - previewCount;

    return (
        <div className="absolute bottom-full mb-2 w-64 bg-white rounded-lg shadow-lg border z-20 p-3">
            <div className="space-y-2">
                {previewReactors.map((reactor, index) => (
                    <div key={index} className="flex items-center space-x-2 hover:bg-gray-50 p-1 rounded cursor-pointer">
                        <Avatar src={reactor.avatar_url} fullName={reactor.full_name} size="sm" />
                        <span className="text-sm font-medium text-slate-700">{reactor.full_name}</span>
                        {reactor.reaction_type && (
                            <div className="ml-auto">
                                {(() => {
                                    const reaction = reactions.find(r => r.type === reactor.reaction_type);
                                    if (!reaction) return null;
                                    return (
                                        <div className={`p-0.5 rounded-full ${reaction.color}`}>
                                            <reaction.Icon size={10} className="text-white" />
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                ))}
                {remainingCount > 0 && (
                    <div className="pt-2 border-t">
                        <button
                            onClick={onViewAll}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                            View all {likeCount} reactions
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};