// src/components/post/ReactorsText.jsx
import React from 'react';

export default function ReactorsText({ likeCount, reactors, onViewReactions }) {
    const actualCount = reactors?.length || 0;
    const displayCount = Math.max(likeCount, actualCount);

    if (!displayCount || displayCount < 1) return null;

    const firstName = reactors?.[0]?.full_name?.split(' ')?.[0];
    const hasMultiple = displayCount > 1;

    let displayText;
    if (displayCount === 1 && firstName) {
        displayText = firstName;
    } else if (displayCount === 2 && firstName) {
        displayText = `${firstName} + 1 other`;
    } else if (hasMultiple && firstName) {
        displayText = `${firstName} + ${displayCount - 1} others`;
    } else {
        displayText = `${displayCount} ${displayCount === 1 ? 'reaction' : 'reactions'}`;
    }

    return (
        <span
            className="ml-2 font-medium text-slate-600 hover:underline cursor-pointer"
            onClick={onViewReactions}
        >
            {displayText}
        </span>
    );
};