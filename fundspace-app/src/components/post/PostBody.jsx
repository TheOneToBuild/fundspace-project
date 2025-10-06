// src/components/post/PostBody.jsx - Fixed Organization Mention Navigation & White Dots
import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import ImageMosaic from './ImageMosaic';
import TagDisplay from './TagDisplay';

export default function PostBody({ content, images, tags, onImageClick, expanded = false }) {
    const navigate = useNavigate();
    const MAX_CHARS = 300;
    const postBodyRef = useRef(null);

    // Enhanced shouldTruncate logic - don't truncate if expanded prop is true or content has mentions
    const containsMentions = content && content.includes('<span') && content.includes('data-type');
    const shouldTruncate = !expanded && content && content.length > MAX_CHARS && !content.includes('<img') && !containsMentions;

    // Function to get organization slug from ID (same as CommentCard.jsx)
    const getOrganizationSlug = async (orgType, orgId) => {
        try {
            const tableName = orgType === 'nonprofit' ? 'nonprofits' : 'funders';
            const { data, error } = await supabase
                .from(tableName)
                .select('slug')
                .eq('id', parseInt(orgId))
                .single();

            if (error) {
                console.error(`❌ Error fetching ${orgType} slug:`, error);
                return null;
            }

            console.log(`✅ Found ${orgType} slug:`, data?.slug);
            return data?.slug;
        } catch (error) {
            console.error(`💥 Exception fetching ${orgType} slug:`, error);
            return null;
        }
    };

    const handleMentionClick = async (e) => {
        const target = e.target;
        
        // Check if clicked element is a mention
        if (target.tagName === 'SPAN' && 
            (target.classList.contains('mention') || target.dataset.type)) {
            
            e.preventDefault();
            e.stopPropagation();
            
            const mentionId = target.dataset.id;
            const mentionType = target.dataset.type;
            const mentionLabel = target.dataset.label;

            if (!mentionId || !mentionType) {
                console.warn('⚠️ PostBody: Incomplete mention data:', { mentionId, mentionType, mentionLabel });
                return;
            }

            console.log('🔍 PostBody: Processing mention click:', { mentionId, mentionType, mentionLabel });

            try {
                if (mentionType === 'user') {
                    console.log('👤 PostBody: Navigating to user profile:', mentionId);
                    navigate(`/profile/members/${mentionId}`);
                } else if (mentionType === 'organization') {
                    console.log('🏢 PostBody: Processing organization mention:', mentionId);
                    
                    // Check if mentionId contains a dash (old format: type-id)
                    if (mentionId.includes('-')) {
                        const [orgType, orgId] = mentionId.split('-');
                        console.log('🔄 PostBody: Old format detected:', { orgType, orgId });
                        
                        if (orgId) {
                            const slug = await getOrganizationSlug(orgType, orgId);
                            if (slug) {
                                console.log('✅ PostBody: Found slug, navigating:', slug);
                                navigate(`/organizations/${slug}`);
                            } else {
                                console.warn('⚠️ PostBody: No slug found, trying fallback navigation');
                                const fallbackPath = orgType === 'nonprofit' ? `/nonprofits/${orgId}` : `/funders/${orgId}`;
                                console.log(`🔄 Trying fallback navigation: ${fallbackPath}`);
                                navigate(fallbackPath);
                            }
                        } else {
                            console.error('❌ PostBody: Invalid orgId in mention:', mentionId);
                        }
                    } else {
                        // New format: slug, navigate directly to organization page using slug
                        console.log('✨ New format detected, navigating to slug:', mentionId);
                        navigate(`/organizations/${mentionId}`);
                    }
                }
            } catch (error) {
                console.error('💥 Error during mention navigation:', error);
            }
        }
    };

    // FIXED: processContentForDisplay function with white dots removal
    const processContentForDisplay = (htmlContent) => {
        if (!htmlContent) return '';
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        
        // Find all spans and ensure mentions have proper classes
        const allSpans = tempDiv.querySelectorAll('span');
        
        allSpans.forEach(span => {
            const hasDataType = span.dataset.type;
            const hasDataId = span.dataset.id;
            const hasMentionClass = span.classList.contains('mention');
            
            // If it looks like a mention, ensure it has the mention class
            if ((hasDataType || hasDataId) && !hasMentionClass) {
                span.classList.add('mention');
            }
            
            // CRITICAL FIX: Clean up any extra whitespace or invisible characters
            if (span.textContent) {
                span.textContent = span.textContent.trim();
            }
        });
        
        // CRITICAL FIX: Clean the entire content to remove problematic whitespace
        let cleanedHTML = tempDiv.innerHTML;
        
        // Remove zero-width spaces and other problematic characters that cause white dots
        cleanedHTML = cleanedHTML
            .replace(/\u200B/g, '') // Remove zero-width spaces
            .replace(/\u00A0/g, ' ') // Replace non-breaking spaces with regular spaces
            .replace(/\u2002/g, ' ') // Replace en spaces
            .replace(/\u2003/g, ' ') // Replace em spaces
            .replace(/\s+/g, ' ')    // Normalize multiple spaces to single space
            .trim();                 // Remove leading/trailing whitespace
        
        return cleanedHTML;
    };

    const renderTruncatedContent = (htmlContent) => {
        if (!htmlContent) return null;

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        let plainText = tempDiv.textContent || tempDiv.innerText || '';

        plainText = plainText.replace(/\s+/g, ' ').trim();

        if (plainText.length > MAX_CHARS) {
            const truncatedText = plainText.substring(0, MAX_CHARS).replace(/\s+\S*$/, '');
            return (
                <>
                    {truncatedText}...{' '}
                    <button
                        onClick={() => onImageClick && onImageClick(0)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium inline"
                    >
                        View more
                    </button>
                </>
            );
        }
        return plainText;
    };

    return (
        <div className="mb-4">
            {content && (
                <div className="mb-4">
                    <div
                        ref={postBodyRef}
                        className="text-slate-700 leading-relaxed whitespace-pre-wrap"
                        onClick={handleMentionClick}
                    >
                        <style>
                            {`
                            .post-content .mention {
                                background-color: #e0e7ff;
                                color: #3730a3;
                                padding: 1px 4px;
                                border-radius: 4px;
                                font-weight: 500;
                                text-decoration: none;
                                cursor: pointer;
                                transition: all 0.2s ease;
                            }
                            .post-content .mention:hover {
                                background-color: #c7d2fe;
                                text-decoration: underline;
                            }
                            .post-content p {
                                margin: 0;
                                line-height: 1.4;
                            }
                            `}
                        </style>
                        {shouldTruncate ? (
                            <div className="post-content">
                                {renderTruncatedContent(content)}
                            </div>
                        ) : (
                            <div 
                                dangerouslySetInnerHTML={{ 
                                    __html: processContentForDisplay(content) 
                                }} 
                                className="post-content"
                            />
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