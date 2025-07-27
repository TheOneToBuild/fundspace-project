// src/components/comment/CommentCard.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import Avatar from '../Avatar';
import CommentReactions from './CommentReactions';
import CommentActions from './CommentActions';
import EditComment from './EditComment';
import { timeAgo } from './constants';

export default function CommentCard({ 
    comment, 
    currentUserProfile, 
    isOrganizationPost,
    onEdit,
    onDelete,
    onReply,
    onOpenReactionsModal,
    showActions = true,
    showReply = false
}) {
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);

    // Function to get organization slug from ID (same as PostBody.jsx)
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

    // Handle profile navigation
    const handleProfileClick = (e, profileId) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (profileId) {
            navigate(`/profile/members/${profileId}`);
        }
    };

    const handleEdit = (comment) => {
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
    };

    const handleSaveEdit = async (updatedCommentData) => {
        try {
            // Determine the correct table
            const commentsTable = isOrganizationPost ? 'organization_post_comments' : 'post_comments';
            
            // Get current user for verification
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('You must be logged in to edit comments.');
                return;
            }

            // Only allow users to edit their own comments
            if (comment.user_id !== user.id) {
                alert('You can only edit your own comments.');
                return;
            }
            
            console.log('Updating comment with data:', updatedCommentData);
            console.log('Comment ID:', comment.id);
            console.log('Table:', commentsTable);
            
            // Update the comment in the database
            const { data, error } = await supabase
                .from(commentsTable)
                .update(updatedCommentData)
                .eq('id', comment.id)
                .eq('user_id', user.id) // Double-check user ownership
                .select(`
                    *,
                    profiles(
                        id, 
                        full_name, 
                        role, 
                        avatar_url,
                        organization_name
                    )
                `)
                .single();

            if (error) {
                console.error('Error updating comment:', error);
                console.error('Error details:', {
                    code: error.code,
                    message: error.message,
                    details: error.details,
                    hint: error.hint
                });
                alert(`Failed to update comment: ${error.message}`);
                return;
            }

            console.log('Comment updated successfully:', data);
            
            // Update local comment state
            Object.assign(comment, data);
            
            // Exit edit mode
            setIsEditing(false);
            
            // Notify parent if needed
            if (onEdit) {
                onEdit(data);
            }

        } catch (error) {
            console.error('Error saving comment edit:', error);
            alert('Failed to save comment. Please try again.');
        }
    };

    const handleDelete = (commentId) => {
        // Remove the confirmation dialog - delete immediately
        if (onDelete) onDelete(commentId);
    };

    const handleMentionClick = async (e) => {
        // Check if the clicked element is a mention
        if (e.target.classList.contains('mention')) {
            e.preventDefault();
            e.stopPropagation();
            
            const mentionId = e.target.getAttribute('data-id');
            const mentionType = e.target.getAttribute('data-type');
            
            console.log('🔗 CommentCard: Mention clicked:', { mentionId, mentionType });
            
            if (mentionType === 'user' && mentionId) {
                // Navigate directly to user profile
                console.log(`👤 Navigating to user profile: /profile/members/${mentionId}`);
                navigate(`/profile/members/${mentionId}`);
            } else if (mentionType === 'organization' && mentionId) {
                console.log('🏢 Organization mention ID:', mentionId);
                
                // Check if mentionId is in old format (type-id)
                if (mentionId.includes('-') && /^\w+-\d+$/.test(mentionId)) {
                    // Old format: type-id, extract the ID and look up the slug
                    const [orgType, orgId] = mentionId.split('-');
                    console.log('📄 Old format detected, looking up slug for:', { orgType, orgId });
                    
                    try {
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
                            const fallbackPath = orgType === 'nonprofit' ? 
                                `/nonprofits/${orgId}` : `/funders/${orgId}`;
                            console.log(`🔄 Trying fallback navigation: ${fallbackPath}`);
                            navigate(fallbackPath);
                        }
                    } catch (error) {
                        console.error('💥 Error during organization navigation:', error);
                    }
                } else {
                    // New format: slug, navigate directly to organization page using slug
                    console.log('✨ New format detected, navigating to slug:', mentionId);
                    navigate(`/organizations/${mentionId}`);
                }
            }
        }
    };

    // Check if comment was edited
    const wasEdited = comment.updated_at && comment.updated_at !== comment.created_at;

    // If editing, show the EditComment component
    if (isEditing) {
        return (
            <div className="flex items-start space-x-3">
                {/* Avatar */}
                <div
                    onClick={(e) => handleProfileClick(e, comment.profiles?.id)}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                >
                    <Avatar 
                        src={comment.profiles?.avatar_url} 
                        fullName={comment.profiles?.full_name} 
                        size="sm" 
                    />
                </div>

                {/* Edit Comment Form */}
                <div className="flex-1 min-w-0">
                    <EditComment
                        comment={comment}
                        isOrganizationPost={isOrganizationPost}
                        onSave={handleSaveEdit}
                        onCancel={handleCancelEdit}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-start space-x-3">
            {/* Avatar */}
            <div
                onClick={(e) => handleProfileClick(e, comment.profiles?.id)}
                className="cursor-pointer hover:opacity-80 transition-opacity"
            >
                <Avatar 
                    src={comment.profiles?.avatar_url} 
                    fullName={comment.profiles?.full_name} 
                    size="sm" 
                />
            </div>

            {/* Comment Content */}
            <div className="flex-1 min-w-0">
                {/* Comment Bubble */}
                <div className="bg-slate-100 rounded-lg p-3">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={(e) => handleProfileClick(e, comment.profiles?.id)}
                                className="font-medium text-slate-900 text-sm hover:text-blue-600 transition-colors cursor-pointer"
                            >
                                {comment.profiles?.full_name}
                            </button>
                            {comment.profiles?.organization_name && (
                                <span className="text-xs text-slate-500">
                                    • {comment.profiles.organization_name}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="text-slate-700 text-sm leading-relaxed">
                        <style>
                            {`
                            .comment-content .mention {
                                background-color: #e0e7ff;
                                color: #3730a3;
                                padding: 1px 4px;
                                border-radius: 4px;
                                font-weight: 500;
                                text-decoration: none;
                                cursor: pointer;
                                transition: all 0.2s ease;
                            }
                            .comment-content .mention:hover {
                                background-color: #c7d2fe;
                                text-decoration: underline;
                            }
                            .comment-content p {
                                margin: 0;
                                line-height: 1.4;
                            }
                            `}
                        </style>
                        {/* Render HTML content safely with mention styling */}
                        <div 
                            dangerouslySetInnerHTML={{ 
                                __html: comment.content || comment.content 
                            }}
                            className="comment-content"
                            onClick={handleMentionClick}
                        />
                    </div>

                    {/* Images if any */}
                    {comment.image_urls && comment.image_urls.length > 0 && (
                        <div className="mt-3">
                            {comment.image_urls.map((imageUrl, index) => (
                                <img 
                                    key={index}
                                    src={imageUrl} 
                                    alt={`Comment image ${index + 1}`}
                                    className="w-full max-w-sm h-auto rounded-lg border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => {
                                        // TODO: Open image viewer modal
                                        window.open(imageUrl, '_blank');
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer with timestamp, reactions, and actions */}
                <div className="mt-1 ml-2 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <span className="text-xs text-slate-500">
                            {timeAgo(comment.created_at)}
                            {wasEdited && (
                                <span className="ml-1 text-slate-400">
                                    (edited)
                                </span>
                            )}
                        </span>
                        
                        {/* Reactions */}
                        <CommentReactions 
                            comment={comment} 
                            currentUserProfile={currentUserProfile}
                            isOrganizationPost={isOrganizationPost}
                            onOpenReactionsModal={onOpenReactionsModal}
                        />
                    </div>

                    {/* Actions */}
                    {showActions && (
                        <CommentActions
                            comment={comment}
                            currentUserProfile={currentUserProfile}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onReply={onReply}
                            showReply={showReply}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}