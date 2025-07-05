// src/components/Avatar.jsx
import React from 'react';

const getInitials = (name) => {
    if (!name) return '?';
    const words = name.split(' ');
    if (words.length > 1 && words[1]) return (words[0][0] + words[1][0]).toUpperCase();
    if (words.length > 0 && words[0]) return words[0].substring(0, 2).toUpperCase();
    return '?';
};

export default function Avatar({ src, fullName, size = 'md' }) {
    const sizeClasses = {
        sm: 'w-9 h-9 text-xs',
        md: 'w-11 h-11 text-lg',
        lg: 'w-20 h-20 text-3xl',
    };

    if (src) {
        return (
            <img 
                src={src}
                alt={fullName || 'Profile Avatar'}
                className={`${sizeClasses[size]} rounded-full object-cover flex-shrink-0`}
            />
        );
    }
    
    // Fallback to initials
    return (
        <div className={`${sizeClasses[size]} rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold flex-shrink-0`}>
            {getInitials(fullName)}
        </div>
    );
};