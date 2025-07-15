// Enhanced PostBody component with fixed navigation
import React from 'react';
import { useNavigate } from 'react-router-dom';
import ImageMosaic from './ImageMosaic';
import TagDisplay from './TagDisplay';

export default function PostBody({ content, images, tags, onImageClick }) {
    const navigate = useNavigate();
    const MAX_CHARS = 300;
    const shouldTruncate = content && content.length > MAX_CHARS;

    const handleMentionClick = (mention) => {
        // Navigate to user or organization profile with correct routes
        if (mention.entityType === 'user') {
            // For users, navigate to member profile page within the profile section
            navigate(`/profile/members/${mention.id}`);
        } else if (mention.entityType === 'organization') {
            // Parse organization ID from format like "funder-123" or "nonprofit-456"
            const [orgType, orgId] = mention.id.split('-');
            if (orgType === 'nonprofit') {
                // Navigate to nonprofit profile page using the orgId as slug
                navigate(`/nonprofits/${orgId}`);
            } else if (orgType === 'funder') {
                // Navigate to funder profile page using the orgId as slug
                navigate(`/funders/${orgId}`);
            }
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
            
            // Add text before mention
            if (match.index > lastIndex) {
                parts.push(text.slice(lastIndex, match.index));
            }
            
            // Add mention as clickable element
            parts.push({
                type: 'mention',
                displayName,
                id,
                entityType: type,
                key: `mention-${id}-${match.index}`
            });
            
            lastIndex = match.index + fullMatch.length;
        }
        
        // Add remaining text
        if (lastIndex < text.length) {
            parts.push(text.slice(lastIndex));
        }
        
        return (
            <span>
                {parts.map((part, index) => {
                    if (typeof part === 'string') {
                        return <span key={index}>{part}</span>;
                    } else if (part.type === 'mention') {
                        return (
                            <span
                                key={part.key}
                                className="inline-flex items-center px-1 py-0.5 rounded text-blue-600 bg-blue-50 hover:bg-blue-100 cursor-pointer font-medium transition-colors"
                                onClick={() => handleMentionClick(part)}
                                title={`Go to ${part.displayName}'s profile`}
                            >
                                @{part.displayName}
                            </span>
                        );
                    }
                    return null;
                })}
            </span>
        );
    };

    return (
        <div className="mb-4">
            {content && (
                <div className="mb-4">
                    <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {shouldTruncate ? (
                            <>
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
        </div>
    );
}