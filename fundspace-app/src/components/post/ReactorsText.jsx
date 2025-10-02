// src/components/post/ReactorsText.jsx
import React from 'react';

export default function ReactorsText({ likeCount, reactors, onViewReactions }) {
    if (!likeCount || likeCount < 1) return null;

    // Only show names if we have reactor data loaded
    const hasReactorData = reactors && reactors.length > 0;
    
    let displayText;
    
    if (hasReactorData && reactors.length > 0) {
        const firstName = reactors[0]?.full_name?.split(' ')?.[0];
        
        if (likeCount === 1 && firstName) {
            displayText = firstName;
        } else if (likeCount === 2 && firstName) {
            displayText = `${firstName} + 1 other`;
        } else if (likeCount > 2 && firstName) {
            displayText = `${firstName} + ${likeCount - 1} others`;
        } else {
            // Fallback if we don't have name data
            displayText = `${likeCount} ${likeCount === 1 ? 'reaction' : 'reactions'}`;
        }
    } else {
        // Default format when we don't have reactor details yet
        displayText = `${likeCount} ${likeCount === 1 ? 'reaction' : 'reactions'}`;
    }

    return (
        <span
            className="ml-2 font-medium text-slate-600 hover:underline cursor-pointer"
            onClick={onViewReactions}
        >
            {displayText}
        </span>
    );
}