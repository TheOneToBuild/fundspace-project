// src/components/post/PostBody.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import ImageMosaic from './ImageMosaic';
import TagDisplay from './TagDisplay';
import MentionHoverCard from './MentionHoverCard';

export default function PostBody({ content, images, tags, onImageClick }) {
    const navigate = useNavigate();
    const MAX_CHARS = 300;

    // Enhanced shouldTruncate logic - don't truncate content with mentions
    const containsMentions = content && content.includes('<span') && content.includes('data-type');
    const shouldTruncate = content && content.length > MAX_CHARS && !content.includes('<img') && !containsMentions;

    // Hover state
    const [hoveredMention, setHoveredMention] = useState(null);
    const [hoverPosition, setHoverPosition] = useState(null);
    
    const hideTimeoutRef = useRef(null);
    const postBodyRef = useRef(null);
    const isHoveringRef = useRef(false);

    // Function to get organization slug from ID
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
                console.warn('⚠️ Missing mention data for click navigation');
                return;
            }

            console.log(`🔗 PostBody: Navigating to mention:`, {
                mentionId,
                mentionType,
                mentionLabel
            });

            try {
                // Navigate based on mention type
                if (mentionType === 'user') {
                    console.log(`👤 Navigating to user profile: /profile/members/${mentionId}`);
                    navigate(`/profile/members/${mentionId}`);
                } else if (mentionType === 'organization') {
                    const [orgType, orgId] = mentionId.split('-');
                    
                    if (!orgId) {
                        console.warn('⚠️ Invalid organization ID format:', mentionId);
                        return;
                    }

                    console.log(`🏢 Organization navigation:`, { mentionId, orgType, orgId });

                    // Get the organization slug from the database
                    const slug = await getOrganizationSlug(orgType, orgId);
                    
                    if (slug) {
                        if (orgType === 'nonprofit') {
                            console.log(`🏛️ Navigating to nonprofit: /nonprofits/${slug}`);
                            navigate(`/nonprofits/${slug}`);
                        } else if (orgType === 'funder') {
                            console.log(`💰 Navigating to funder: /funders/${slug}`);
                            navigate(`/funders/${slug}`);
                        }
                    } else {
                        console.error(`❌ Could not find slug for ${orgType} with ID ${orgId}`);
                        // Fallback: try to navigate anyway (might show "not found" page)
                        const fallbackPath = orgType === 'nonprofit' ? `/nonprofits/${orgId}` : `/funders/${orgId}`;
                        console.log(`🔄 Trying fallback navigation: ${fallbackPath}`);
                        navigate(fallbackPath);
                    }
                }
            } catch (error) {
                console.error('💥 Error during mention navigation:', error);
            }
        }
    };

    const processContentForDisplay = (htmlContent) => {
        if (!htmlContent) return '';
        
        // Create a temporary div to parse and modify HTML
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
        });
        
        return tempDiv.innerHTML;
    };

    const showHoverCard = (mention, position) => {
        // Clear any existing timeout
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }

        setHoveredMention(mention);
        setHoverPosition(position);
    };

    const hideHoverCard = () => {
        hideTimeoutRef.current = setTimeout(() => {
            if (!isHoveringRef.current) {
                setHoveredMention(null);
                setHoverPosition(null);
            }
        }, 100);
    };

    const forceHideHoverCard = () => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }
        setHoveredMention(null);
        setHoverPosition(null);
        isHoveringRef.current = false;
    };

    // Enhanced hover implementation
    useEffect(() => {
        const currentPostBodyRef = postBodyRef.current;
        if (!currentPostBodyRef) return;

        const handleMouseMove = (e) => {
            const target = e.target;
            
            // Check if we're over a mention
            if (target.tagName === 'SPAN' && 
                (target.classList.contains('mention') || target.dataset.type)) {
                
                isHoveringRef.current = true;
                
                const mentionId = target.dataset.id;
                const mentionLabel = target.dataset.label;
                const mentionType = target.dataset.type;

                if (!mentionId || !mentionType) return;

                // Only update if this is a different mention
                const isSameMention = hoveredMention && 
                    hoveredMention.id === mentionId && 
                    hoveredMention.entityType === mentionType;

                if (!isSameMention) {
                    const mention = {
                        id: mentionId,
                        displayName: mentionLabel,
                        entityType: mentionType
                    };

                    const rect = target.getBoundingClientRect();
                    const position = {
                        top: rect.bottom + window.scrollY + 8,
                        left: rect.left + window.scrollX
                    };

                    showHoverCard(mention, position);
                }
            } else {
                // Not over a mention
                isHoveringRef.current = false;
                
                // Check if we're over the hover card itself
                const isOverHoverCard = target.closest('.mention-hover-card-wrapper');
                
                if (!isOverHoverCard) {
                    hideHoverCard();
                }
            }
        };

        currentPostBodyRef.addEventListener('mousemove', handleMouseMove);

        return () => {
            currentPostBodyRef.removeEventListener('mousemove', handleMouseMove);
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
            }
        };
    }, [hoveredMention]);

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
                        {shouldTruncate ? (
                            renderTruncatedContent(content)
                        ) : (
                            <div 
                                dangerouslySetInnerHTML={{ 
                                    __html: processContentForDisplay(content) 
                                }} 
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

            {/* Hover card */}
            {hoveredMention && hoverPosition && (
                <div
                    className="mention-hover-card-wrapper"
                    style={{
                        position: 'absolute',
                        top: hoverPosition.top,
                        left: hoverPosition.left,
                        zIndex: 10000,
                        pointerEvents: 'auto'
                    }}
                    onMouseEnter={() => {
                        isHoveringRef.current = true;
                        if (hideTimeoutRef.current) {
                            clearTimeout(hideTimeoutRef.current);
                            hideTimeoutRef.current = null;
                        }
                    }}
                    onMouseLeave={() => {
                        isHoveringRef.current = false;
                        forceHideHoverCard();
                    }}
                >
                    <MentionHoverCard
                        mention={hoveredMention}
                        position={{ top: 0, left: 0 }}
                    />
                </div>
            )}
        </div>
    );
}