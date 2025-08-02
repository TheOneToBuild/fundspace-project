// src/components/dashboard/TrendingPostsSection.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { ChevronLeft, ChevronRight, MessageCircle, Heart } from 'lucide-react';
import { renderMentionsInText } from '../../utils/mentionUtils';
import PropTypes from 'prop-types';

// Temporary inline TrendingPostCard component - move this to its own file later
const TrendingPostCard = ({ post, onClick }) => {
    const navigate = useNavigate();
    const [localLikes, setLocalLikes] = React.useState(post?.reactions?.summary?.reduce((total, r) => total + r.count, 0) || 0);
    const [localComments, setLocalComments] = React.useState(post?.comments_count || 0);

    // Update local state when post prop changes (from real-time updates)
    React.useEffect(() => {
        const newLikeCount = post?.reactions?.summary?.reduce((total, r) => total + r.count, 0) || 0;
        setLocalLikes(newLikeCount);
        setLocalComments(post?.comments_count || 0);
    }, [post?.reactions?.summary, post?.comments_count]);

    const formatTimeAgo = (dateString) => {
        const now = new Date();
        const postDate = new Date(dateString);
        const diffInHours = Math.floor((now - postDate) / (1000 * 60 * 60));
        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours}h ago`;
        return `${Math.floor(diffInHours / 24)}d ago`;
    };

    const handleMentionClick = async (mention, event) => {
        // Prevent the post click from firing when clicking a mention
        event?.stopPropagation();
        
        if (mention.entityType === 'user') {
            // Navigate to user profile page - use the members route pattern
            navigate(`/profile/members/${mention.id}`);
        } else if (mention.entityType === 'organization') {
            // For organizations, we need to get the slug from the database
            try {
                // Try to parse the old format first (type-id)
                let orgType, orgId;
                if (mention.id.includes('-')) {
                    [orgType, orgId] = mention.id.split('-');
                } else {
                    // If it's just a number, we need to look it up
                    orgId = mention.id;
                }
                
                if (orgId) {
                    // Fetch organization details to get the slug
                    const { data: orgData } = await supabase
                        .from('organizations')
                        .select('slug, type')
                        .eq('id', parseInt(orgId))
                        .single();
                    
                    if (orgData?.slug) {
                        navigate(`/organizations/${orgData.slug}`);
                    } else {
                        console.error('Could not find organization slug for ID:', orgId);
                    }
                } else {
                    console.error('Invalid organization mention ID format:', mention.id);
                }
            } catch (error) {
                console.error('Error navigating to organization:', error);
            }
        }
    };

    const renderTextWithMentions = (text, htmlContent) => {
        // Use the HTML content if available, otherwise fall back to text
        const contentToRender = htmlContent || text;
        if (!contentToRender) return 'No text content';
        
        // Check if we have HTML mentions
        if (htmlContent && htmlContent.includes('class="mention"')) {
            // Parse HTML mentions
            const div = document.createElement('div');
            div.innerHTML = htmlContent;
            
            const parts = [];
            const walkNode = (node) => {
                if (node.nodeType === Node.TEXT_NODE) {
                    if (node.textContent.trim()) {
                        parts.push(node.textContent);
                    }
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.classList.contains('mention') && node.hasAttribute('data-id')) {
                        // This is a mention span
                        parts.push({
                            type: 'mention',
                            id: node.getAttribute('data-id'),
                            displayName: node.getAttribute('data-label').trim(),
                            entityType: node.getAttribute('data-type'),
                            key: `mention-${node.getAttribute('data-id')}-${parts.length}`
                        });
                    } else {
                        // Regular element, process its children
                        for (const child of node.childNodes) {
                            walkNode(child);
                        }
                        // Add line break for certain elements
                        if (['BR', 'P', 'DIV'].includes(node.tagName)) {
                            parts.push(' ');
                        }
                    }
                }
            };
            
            // Process all child nodes
            for (const child of div.childNodes) {
                walkNode(child);
            }
            
            const filteredParts = parts.filter(part => {
                // Remove empty text parts
                if (typeof part === 'string') {
                    return part.trim().length > 0;
                }
                return true;
            });
            
            return filteredParts.map((part, index) => {
                if (typeof part === 'string') {
                    return part;
                } else if (part.type === 'mention') {
                    return (
                        <span
                            key={part.key || index}
                            className="inline-flex items-center px-1 py-0.5 rounded text-blue-600 bg-blue-50 hover:bg-blue-100 cursor-pointer font-medium transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleMentionClick(part, e);
                            }}
                        >
                            @{part.displayName}
                        </span>
                    );
                }
                return null;
            });
        } else {
            // Fallback to original text-based parsing using renderMentionsInText
            const parts = renderMentionsInText(text);
            
            if (typeof parts === 'string') {
                return parts;
            }
            
            return parts.map((part, index) => {
                if (typeof part === 'string') {
                    return part;
                } else if (part.type === 'mention') {
                    return (
                        <span
                            key={`fallback-mention-${index}`}
                            className="inline-flex items-center px-1 py-0.5 rounded text-blue-600 bg-blue-50 hover:bg-blue-100 cursor-pointer font-medium transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleMentionClick(part, e);
                            }}
                        >
                            @{part.displayName}
                        </span>
                    );
                }
                return null;
            });
        }
    };

    const extractContentAndImages = (content) => {
        if (!content) return { text: '', images: [] };
        const div = document.createElement('div');
        div.innerHTML = content;
        const imgElements = div.querySelectorAll('img');
        const images = Array.from(imgElements).map(img => img.src).filter(src => src);
        imgElements.forEach(img => img.remove());
        
        // Keep HTML content for mention processing
        const htmlText = div.innerHTML;
        // Also get plain text version
        let text = div.innerHTML;
        text = text.replace(/<[^>]*>/g, '').trim();
        
        return { text, htmlText, images };
    };

    const { text: cleanedContent, htmlText, images: contentImages } = extractContentAndImages(post.content);
    
    const allImages = [
        ...(post.images || []),
        ...contentImages,
        ...(post.image_urls || []),
        ...(post.attachments || []).filter(att => att.type === 'image').map(att => att.url)
    ];
    const hasImages = allImages.length > 0;

    return (
        <div
            className="flex-shrink-0 w-80 bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group"
            onClick={onClick}
        >
            {hasImages && (
                <div className="h-48 bg-slate-100 overflow-hidden relative">
                    <img
                        src={allImages[0]}
                        alt="User uploaded content"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={e => { e.target.style.display = 'none'; }}
                    />
                    {allImages.length > 1 && (
                        <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                            +{allImages.length - 1}
                        </div>
                    )}
                </div>
            )}
            <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                    <img
                        src={post.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.profiles?.full_name || 'User')}&background=6366f1&color=ffffff`}
                        alt={post.profiles?.full_name || 'User'}
                        className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 text-sm truncate">
                            {post.profiles?.full_name || 'Anonymous'}
                        </h4>
                        {post.profiles?.organization_name && (
                            <p className="text-xs text-slate-500 truncate">
                                {post.profiles.organization_name}
                            </p>
                        )}
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0">
                        {formatTimeAgo(post.created_at)}
                    </span>
                </div>
                <div className="mb-4">
                    <div className={`text-slate-700 text-sm leading-relaxed ${!hasImages ? 'line-clamp-[12]' : 'line-clamp-4'}`}>
                        {renderTextWithMentions(cleanedContent, htmlText)}
                    </div>
                </div>
                <div className="flex items-center space-x-4 text-xs text-slate-500">
                    <div className="flex items-center space-x-1">
                        <Heart size={14} />
                        <span>{localLikes}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <MessageCircle size={14} />
                        <span>{localComments}</span>
                    </div>
                    <div className="ml-auto text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        View Post →
                    </div>
                </div>
            </div>
        </div>
    );
};

const TrendingPostsSection = ({ posts, onViewMore, onPostClick }) => {
    const scrollPosts = (direction) => {
        const container = document.getElementById('trending-posts-scroll');
        if (container) {
            container.scrollBy({ left: direction === 'left' ? -320 : 320, behavior: 'smooth' });
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Trending from Hello World</h2>
                    <p className="text-sm text-slate-600 mt-1">Popular posts from the global community</p>
                </div>
                <div className="flex items-center space-x-2">
                    {posts && posts.length > 0 && (
                        <div className="flex space-x-2">
                            <button
                                onClick={() => scrollPosts('left')}
                                className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={() => scrollPosts('right')}
                                className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                    <button
                        onClick={onViewMore}
                        className="ml-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                        View More
                    </button>
                </div>
            </div>
            {posts && posts.length > 0 ? (
                <div id="trending-posts-scroll" className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4">
                    {posts.map(post => (
                        <TrendingPostCard
                            key={post.id}
                            post={post}
                            onClick={() => onPostClick(post)}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                    <MessageCircle size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-600 mb-2">No posts yet</h3>
                    <p className="text-slate-500 text-sm mb-4">Be the first to share something with the community!</p>
                    <button
                        onClick={onViewMore}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Start Conversation
                    </button>
                </div>
            )}
        </div>
    );
};

TrendingPostsSection.propTypes = {
    posts: PropTypes.array.isRequired,
    onViewMore: PropTypes.func.isRequired,
    onPostClick: PropTypes.func.isRequired
};

export default TrendingPostsSection;