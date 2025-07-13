// src/components/post/PostBody.jsx
import React from 'react'; // Removed useState as it's no longer needed
import ImageMosaic from './ImageMosaic';
import TagDisplay from './TagDisplay';

export default function PostBody({ content, images, tags, onImageClick }) {
    // The `isExpanded` state has been removed.
    const MAX_CHARS = 300;
    const shouldTruncate = content && content.length > MAX_CHARS;

    return (
        <div className="mb-4">
            {content && (
                <div className="mb-4">
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {/* Always show truncated text if it's long enough */}
                        {shouldTruncate ? `${content.substring(0, MAX_CHARS).replace(/\s+\S*$/, '')}... ` : content}
                        
                        {/* The "View more" button now triggers the full-screen modal */}
                        {shouldTruncate && (
                            <button 
                                onClick={() => onImageClick(0)} 
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium inline"
                            >
                                View more
                            </button>
                        )}
                    </p>
                    {/* The "View less" button has been removed */}
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