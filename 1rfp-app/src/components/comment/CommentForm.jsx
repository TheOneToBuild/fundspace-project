// src/components/comment/CommentForm.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Camera, X } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import Avatar from '../Avatar';

// --- TIPTAP IMPORTS ---
import { useEditor, EditorContent, ReactRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';

// --- CUSTOM COMPONENT IMPORTS ---
import MentionList from '../mentions/MentionList';

export default function CommentForm({ 
    post, 
    currentUserProfile, 
    onCommentAdded,
    placeholder = "Write a comment...",
    autoFocus = false
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [images, setImages] = useState([]);
    const navigate = useNavigate();

    // Determine post type and table names
    const isOrganizationPost = post._isOrganizationPost;
    const commentsTable = isOrganizationPost ? 'organization_post_comments' : 'post_comments';
    const postIdField = isOrganizationPost ? 'organization_post_id' : 'post_id';

    // Track if editor has content (including mentions)
    const [hasContent, setHasContent] = useState(false);

    // --- TIPTAP EDITOR HOOK ---
    const editor = useEditor({
        extensions: [
            StarterKit,
            Mention.extend({
                name: 'mention',
                addAttributes() {
                    return {
                        ...this.parent?.(),
                        type: {
                            default: null,
                            parseHTML: e => e.getAttribute('data-type'),
                            renderHTML: a => a.type ? { 'data-type': a.type } : {}
                        }
                    };
                },
                renderHTML({ node, HTMLAttributes }) {
                    const { id, label, type } = node.attrs;
                    return ['span', { ...HTMLAttributes, class: 'mention', 'data-id': id, 'data-label': label, 'data-type': type }, `@${label}`];
                },
                parseHTML() {
                    return [{ tag: 'span[data-type][data-id]', getAttrs: e => ({ id: e.getAttribute('data-id'), label: e.getAttribute('data-label'), type: e.getAttribute('data-type') }) }];
                },
            }).configure({
                suggestion: {
                    items: async ({ query }) => {
                        try {
                            if (!query || query.length === 0) {
                                // Show following/followers when no query
                                if (!currentUserProfile?.id) return [];
                                
                                try {
                                    // Get people the current user is following
                                    const { data: following } = await supabase
                                        .from('followers')
                                        .select(`
                                            following_id,
                                            profiles!followers_following_id_fkey(
                                                id, 
                                                full_name, 
                                                title, 
                                                organization_name, 
                                                avatar_url, 
                                                role
                                            )
                                        `)
                                        .eq('follower_id', currentUserProfile.id)
                                        .limit(8);

                                    // Get people following the current user
                                    const { data: followers } = await supabase
                                        .from('followers')
                                        .select(`
                                            follower_id,
                                            profiles!followers_follower_id_fkey(
                                                id, 
                                                full_name, 
                                                title, 
                                                organization_name, 
                                                avatar_url, 
                                                role
                                            )
                                        `)
                                        .eq('following_id', currentUserProfile.id)
                                        .limit(8);

                                    // Combine and deduplicate
                                    const allConnections = new Map();
                                    
                                    if (following) {
                                        following.forEach(f => {
                                            if (f.profiles) {
                                                allConnections.set(f.profiles.id, {
                                                    id: f.profiles.id,
                                                    name: f.profiles.full_name,
                                                    type: 'user',
                                                    avatar_url: f.profiles.avatar_url,
                                                    title: f.profiles.title,
                                                    organization_name: f.profiles.organization_name,
                                                    role: f.profiles.role
                                                });
                                            }
                                        });
                                    }

                                    if (followers) {
                                        followers.forEach(f => {
                                            if (f.profiles && !allConnections.has(f.profiles.id)) {
                                                allConnections.set(f.profiles.id, {
                                                    id: f.profiles.id,
                                                    name: f.profiles.full_name,
                                                    type: 'user',
                                                    avatar_url: f.profiles.avatar_url,
                                                    title: f.profiles.title,
                                                    organization_name: f.profiles.organization_name,
                                                    role: f.profiles.role
                                                });
                                            }
                                        });
                                    }

                                    return Array.from(allConnections.values()).slice(0, 8);
                                } catch (error) {
                                    console.error('Error fetching connections for mentions:', error);
                                    return [];
                                }
                            }

                            if (query.length < 2) {
                                return [];
                            }

                            const searchPattern = `%${query.trim()}%`;
                            
                            // Search users/profiles
                            const { data: profiles, error: profilesError } = await supabase
                                .from('profiles')
                                .select('id, full_name, title, organization_name, avatar_url, role')
                                .or(`full_name.ilike.${searchPattern},title.ilike.${searchPattern},organization_name.ilike.${searchPattern}`)
                                .limit(5);

                            if (profilesError) {
                                console.error('Error searching profiles:', profilesError);
                            }

                            // Search organizations
                            const { data: organizations, error: orgsError } = await supabase
                                .from('organizations')
                                .select('id, name, type, tagline, image_url, slug')
                                .ilike('name', searchPattern)
                                .limit(5);

                            if (orgsError) {
                                console.error('Error searching organizations:', orgsError);
                            }

                            // Format results
                            const userResults = (profiles || []).map(profile => ({
                                id: profile.id,
                                name: profile.full_name,
                                type: 'user',
                                avatar_url: profile.avatar_url,
                                title: profile.title,
                                organization_name: profile.organization_name,
                                role: profile.role
                            }));

                            const orgResults = (organizations || []).map(org => ({
                                // FIXED: Use consistent ID format - prefer slug if available, fallback to type-id format
                                id: org.slug || `${org.type}-${org.id}`,
                                name: org.name,
                                type: 'organization',
                                avatar_url: org.image_url,
                                title: org.tagline,
                                organization_name: org.type === 'nonprofit' ? 'Nonprofit' : 'Funder',
                                role: org.type,
                                // Store additional metadata for navigation
                                _orgType: org.type,
                                _orgId: org.id,
                                _slug: org.slug
                            }));

                            console.log('🔍 CommentForm: Mention search results:', {
                                query,
                                userResults: userResults.length,
                                orgResults: orgResults.length,
                                organizations: orgResults.map(org => ({ 
                                    name: org.name, 
                                    id: org.id, 
                                    slug: org._slug,
                                    type: org._orgType 
                                }))
                            });

                            return [...userResults, ...orgResults];
                        } catch (err) {
                            console.error('Exception during mention search:', err);
                            return [];
                        }
                    },
                    render: () => {
                        let component, popup;
                        return {
                            onStart: props => {
                                component = new ReactRenderer(MentionList, { props, editor: props.editor });
                                popup = tippy('body', { 
                                    getReferenceClientRect: props.clientRect, 
                                    appendTo: () => document.body, 
                                    content: component.element, 
                                    showOnCreate: true, 
                                    interactive: true, 
                                    trigger: 'manual', 
                                    placement: 'bottom-start', 
                                    duration: 0,
                                    zIndex: 9999,
                                    maxWidth: 300,
                                    theme: 'light-border'
                                });
                            },
                            onUpdate: props => { component.updateProps(props); popup[0].setProps({ getReferenceClientRect: props.clientRect }); },
                            onKeyDown: props => { if (props.event.key === 'Escape') { popup[0].hide(); return true; } return component.ref?.onKeyDown(props); },
                            onExit: () => { if (popup && popup[0]) popup[0].destroy(); if (component) component.destroy(); popup = null; component = null; },
                        };
                    },
                },
            }),
        ],
        content: '', // Start with empty content
        editorProps: {
            attributes: {
                class: 'prose-sm outline-none text-sm',
                style: 'white-space: pre-wrap;'
            },
        },
        onUpdate: ({ editor }) => {
            // Check if editor has content (text or mentions)
            const hasText = editor.getText().trim().length > 0;
            const hasMentions = editor.getJSON().content?.some(node => 
                node.content?.some(child => child.type === 'mention')
            );
            setHasContent(hasText || hasMentions);
        }
    });

    // Add placeholder functionality
    useEffect(() => {
        if (editor && placeholder) {
            editor.extensionManager.extensions.forEach(extension => {
                if (extension.name === 'document') {
                    extension.options.content = {
                        type: 'doc',
                        content: [
                            {
                                type: 'paragraph',
                                attrs: { 'data-placeholder': placeholder }
                            }
                        ]
                    };
                }
            });
        }
    }, [editor, placeholder]);

    // Handle profile navigation
    const handleProfileClick = (e, profileId) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (profileId) {
            navigate(`/profile/members/${profileId}`);
        }
    };

    // Handle image selection - limit to 1 image
    const handleImageSelect = (event) => {
        const files = Array.from(event.target.files);
        const maxImages = 1; // Limit comments to 1 image
        
        if (images.length + files.length > maxImages) {
            alert(`You can only add ${maxImages} image per comment.`);
            return;
        }

        const validFiles = files.filter(file => 
            file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024
        );

        if (validFiles.length < files.length) {
            alert('Some images were invalid (must be under 10MB).');
        }

        if (validFiles.length > 0) {
            const imageObjects = validFiles.map(file => ({
                file,
                preview: URL.createObjectURL(file),
                id: Math.random().toString(36).substr(2, 9)
            }));
            setImages(prev => [...prev, ...imageObjects]);
        }
    };

    // Remove image
    const removeImage = (imageId) => {
        setImages(prev => {
            const updated = prev.filter(img => img.id !== imageId);
            const removedImage = prev.find(img => img.id === imageId);
            if (removedImage) {
                URL.revokeObjectURL(removedImage.preview);
            }
            return updated;
        });
    };

    // Upload images to storage
    const uploadImages = async () => {
        if (images.length === 0) return [];

        const uploadPromises = images.map(async (imageObj) => {
            const fileExt = imageObj.file.name.split('.').pop();
            const fileName = `comment_${Math.random().toString(36).substring(2)}.${fileExt}`;
            
            const { data, error } = await supabase.storage
                .from('comment-images')
                .upload(fileName, imageObj.file);

            if (error) throw error;

            const { data: urlData } = supabase.storage
                .from('comment-images')
                .getPublicUrl(fileName);

            return urlData.publicUrl;
        });

        return Promise.all(uploadPromises);
    };

    // Handle comment submission
    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        
        if (!editor) return;
        
        const editorHtmlContent = editor.getHTML();
        const editorTextContent = editor.getText().trim();
        
        // Allow submission if there's text OR images
        if (!editorTextContent && images.length === 0) {
            return;
        }
        
        if (!currentUserProfile) {
            return;
        }

        setIsSubmitting(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.error('No authenticated user found');
                return;
            }

            // Upload images if any
            let imageUrls = [];
            if (images.length > 0) {
                imageUrls = await uploadImages();
            }

            // Extract mentions for storage
            const mentionsForStorage = []; 
            const editorJsonContent = editor.getJSON();
            if (editorJsonContent?.content) { 
                editorJsonContent.content.forEach((node) => { 
                    if (node.content) { 
                        node.content.forEach((inlineNode) => { 
                            if (inlineNode.type === 'mention' && inlineNode.attrs) { 
                                const { id, label, type } = inlineNode.attrs; 
                                if (id && label && type) { 
                                    mentionsForStorage.push({ displayName: label, id: id, type: type }); 
                                } 
                            } 
                        }); 
                    } 
                }); 
            }

            console.log('💾 CommentForm: Saving comment with mentions:', mentionsForStorage);

            // Prepare comment data
            const commentData = {
                content: editorHtmlContent || '', // Use HTML content from editor
                profile_id: currentUserProfile.id,
                user_id: user.id,
                image_urls: imageUrls.length > 0 ? imageUrls : null,
                mentions: mentionsForStorage.length > 0 ? mentionsForStorage : null
            };
            
            // Add the appropriate post ID field
            commentData[postIdField] = post.id;

            // Insert the new comment
            const { data: createdComment, error } = await supabase
                .from(commentsTable)
                .insert(commentData)
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
                console.error("Error posting comment:", error);
                alert(`Failed to post comment: ${error.message}`);
                return;
            }

            console.log('Comment created successfully:', createdComment);

            // Clear form
            editor.commands.clearContent();
            setImages([]);
            setHasContent(false); // Reset content state
            
            // Update the post's comment count for organization posts
            if (isOrganizationPost) {
                try {
                    await supabase.rpc('update_organization_post_comments_count', { 
                        post_id: post.id 
                    });
                } catch (rpcError) {
                    console.warn('Failed to update comment count:', rpcError);
                }
            }
            
            // Notify parent component
            if (onCommentAdded) {
                onCommentAdded(createdComment);
            }

        } catch (error) {
            console.error("Unexpected error posting comment:", error);
            alert('Failed to post comment. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleCommentSubmit} className="space-y-3">
            {/* Main input area */}
            <div className="flex items-start space-x-3">
                <div
                    onClick={(e) => handleProfileClick(e, currentUserProfile?.id)}
                    className="cursor-pointer"
                >
                    <Avatar 
                        src={currentUserProfile?.avatar_url} 
                        fullName={currentUserProfile?.full_name} 
                        size="sm" 
                    />
                </div>
                
                <div className="flex-1 relative">
                    {/* TipTap Editor instead of textarea */}
                    <div className="relative">
                        <div className="w-full p-2 pr-20 bg-slate-100 rounded-lg border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 transition-all text-sm min-h-[40px] max-h-32 overflow-y-auto">
                            <style>
                                {`
                                .comment-editor .ProseMirror {
                                    outline: none;
                                    border: none;
                                    padding: 0;
                                    margin: 0;
                                    background: transparent;
                                    min-height: 20px;
                                }
                                .comment-editor .mention {
                                    background-color: #e0e7ff;
                                    color: #3730a3;
                                    padding: 1px 4px;
                                    border-radius: 4px;
                                    font-weight: 500;
                                    text-decoration: none;
                                    cursor: pointer;
                                }
                                .comment-editor .mention:hover {
                                    background-color: #c7d2fe;
                                }
                                .comment-editor p {
                                    margin: 0;
                                    line-height: 1.4;
                                }
                                .comment-editor .ProseMirror-focused {
                                    outline: none;
                                }
                                `}
                            </style>
                            <EditorContent 
                                editor={editor}
                                className="comment-editor"
                                placeholder={placeholder}
                            />
                            {/* Placeholder when editor is empty */}
                            {editor && editor.isEmpty && (
                                <div className="absolute top-2 left-2 text-slate-500 pointer-events-none text-sm">
                                    {placeholder}
                                </div>
                            )}
                        </div>
                        
                        <div className="absolute top-0 right-2 h-full flex items-center space-x-1">
                            {/* Camera icon button */}
                            <button
                                type="button"
                                onClick={() => document.getElementById(`comment-images-${post.id}`)?.click()}
                                className="p-1.5 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-200 transition-colors"
                                disabled={isSubmitting}
                                title="Add photos"
                            >
                                <Camera size={18} />
                            </button>
                            
                            {/* Submit button */}
                            <button 
                                type="submit" 
                                disabled={(!hasContent && images.length === 0) || isSubmitting} 
                                className="p-1.5 text-blue-600 disabled:text-slate-400 rounded-full hover:bg-blue-100 disabled:hover:bg-transparent transition-colors"
                                onMouseDown={(e) => e.preventDefault()} // Prevent focus issues
                            >
                                {isSubmitting ? (
                                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Send size={18} />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Image preview - Now shows single image larger */}
            {images.length > 0 && (
                <div className="ml-11">
                    {images.map((imageObj) => (
                        <div key={imageObj.id} className="relative inline-block">
                            <img 
                                src={imageObj.preview} 
                                alt="Comment preview" 
                                className="w-48 h-auto rounded-lg border border-slate-200" 
                            />
                            <button
                                type="button"
                                onClick={() => removeImage(imageObj.id)}
                                className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Hidden file input for images */}
            <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
                id={`comment-images-${post.id}`}
                disabled={isSubmitting}
            />
        </form>
    );
}