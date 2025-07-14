import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ImageMosaic from './ImageMosaic';
import TagDisplay from './TagDisplay';
import MentionHoverCard from './MentionHoverCard';

export default function PostBody({ content, images, tags, onImageClick }) {
    const navigate = useNavigate();
    const [hoveredMention, setHoveredMention] = useState(null);
    const [mentionPosition, setMentionPosition] = useState(null);
    const hoverTimeoutRef = useRef(null);
    const mentionRefs = useRef({});

    const MAX_CHARS = 300;
    const shouldTruncate = content && content.length > MAX_CHARS;

    const handleMentionEnter = (mention, key) => {
        clearTimeout(hoverTimeoutRef.current);
        const ref = mentionRefs.current[key];
        if (ref) {
            const rect = ref.getBoundingClientRect();
            setMentionPosition({ top: rect.bottom + window.scrollY + 5, left: rect.left + window.scrollX });
            setHoveredMention(mention);
        }
    };
    
    const handleMentionLeave = () => {
        hoverTimeoutRef.current = setTimeout(() => {
            setHoveredMention(null);
        }, 300);
    };

    const handleMentionClick = (mention) => {
        if (mention.entityType === 'user') {
            navigate(`/profile/${mention.id}`);
        } else if (mention.entityType === 'organization') {
            const [orgType, orgId] = mention.id.split('-');
            const path = orgType === 'nonprofit' ? `/nonprofits/${orgId}` : `/funders/${orgId}`;
            navigate(path);
        }
    };

    const renderTextWithMentions = (text) => {
        if (!text) return null;
        
        const mentionRegex = /@\[([^\]]+)\]\(([^:]+):([^)]+)\)/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = mentionRegex.exec(text)) !== null) {
            const [fullMatch, displayName, id, type] = match;
            if (match.index > lastIndex) {
                parts.push(text.slice(lastIndex, match.index));
            }
            parts.push({
                type: 'mention',
                displayName,
                id,
                entityType: type,
                key: `mention-${id}-${match.index}`
            });
            lastIndex = match.index + fullMatch.length;
        }

        if (lastIndex < text.length) {
            parts.push(text.slice(lastIndex));
        }
        
        return (
            <span>
                {parts.map((part, index) => {
                    if (typeof part === 'string') {
                        return <span key={index}>{part}</span>;
                    } 
                    return (
                        <span
                            key={part.key}
                            ref={el => (mentionRefs.current[part.key] = el)}
                            onMouseEnter={() => handleMentionEnter(part, part.key)}
                            onMouseLeave={handleMentionLeave}
                            onClick={() => handleMentionClick(part)}
                            className="inline-flex items-center px-1 py-0.5 rounded text-blue-600 bg-blue-50 hover:bg-blue-100 cursor-pointer font-medium transition-colors"
                            title={`View profile for ${part.displayName}`}
                        >
                            @{part.displayName}
                        </span>
                    );
                })}
            </span>
        );
    };

    return (
        <div className="mb-4" onMouseLeave={handleMentionLeave}>
            {content && (
                <div className="mb-4">
                    <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {shouldTruncate ? (
                            <>
                                {/* This line has been corrected from MAX_chars to MAX_CHARS */}
                                {renderTextWithMentions(`${content.substring(0, MAX_CHARS).replace(/\s+\S*$/, '')}...`)}
                                {' '}
                                <button 
                                    onClick={() => onImageClick && onImageClick(0)} 
                                    className="text-blue-600 hover:text-blue-700 text-sm font-medium inline"
                                >
                                    View more
                                </button>
                            </>
                        ) : (
                            renderTextWithMentions(content)
                        )}
                    </div>
                </div>
            )}
            {images && images.length > 0 && (
                <ImageMosaic images={images} onImageClick={onImageClick} />
            )}
            {tags && (
                <TagDisplay tags={tags} />
            )}
            
            {hoveredMention && (
                 <MentionHoverCard 
                    mention={hoveredMention} 
                    position={mentionPosition} 
                />
            )}
        </div>
    );
}