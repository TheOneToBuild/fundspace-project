// src/components/post/TagDisplay.jsx
import React from 'react';

export default function TagDisplay({ tags }) {
    let parsedTags = tags;

    if (typeof tags === 'string') {
        try {
            parsedTags = JSON.parse(tags);
        } catch (error) {
            console.error('Error parsing tags:', error);
            return null;
        }
    }

    if (!parsedTags || !Array.isArray(parsedTags) || parsedTags.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2 mb-3">
            {parsedTags.map(tag => (
                <div key={tag.id} className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${tag.color || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                    <span>{tag.label}</span>
                </div>
            ))}
        </div>
    );
};