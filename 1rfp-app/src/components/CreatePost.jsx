// src/components/CreatePost.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Camera, X, Smile, AtSign } from 'lucide-react';
import Avatar from './Avatar.jsx';
import { processMentionsForNotifications } from '../utils/notificationUtils';

// --- TIPTAP IMPORTS ---
import { useEditor, EditorContent, ReactRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';

// Import your custom MentionList component
import MentionList from './mentions/MentionList';

export default function CreatePost({
  profile,
  onNewPost,
  channel = 'hello-world',
  placeholder = null,
  organizationId = null,
  organizationType = null,
  organization = null // Pass full organization object for display
}) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedImages, setSelectedImages] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    // --- State to explicitly track if editor content is empty ---
    const [isEditorContentEmpty, setIsEditorContentEmpty] = useState(true);

    // Tag states
    const [selectedTags, setSelectedTags] = useState([]);
    const [showTagSelector, setShowTagSelector] = useState(false);
    const [customTagInput, setCustomTagInput] = useState('');

    const fileInputRef = useRef(null);

    const emojis = [
        '😊', '😂', '❤️', '👍', '🎉', '🔥', '💡', '🚀',
        '💯', '⭐', '🌟', '💪', '🙌', '👏', '🎯', '💝'
    ];

    // Check if this is an organization post
    const isOrganizationPost = channel === 'organization' && organizationId && organizationType;

    // Determine which table to use
    const postsTable = isOrganizationPost ? 'organization_posts' : 'posts';

    const availableTags = [
        { id: 'education', label: 'Education', color: 'bg-blue-100 text-blue-800 border-blue-200' },
        { id: 'health', label: 'Health', color: 'bg-green-100 text-green-800 border-green-200' },
        { id: 'environment', label: 'Environment', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
        { id: 'arts', label: 'Arts & Culture', color: 'bg-purple-100 text-purple-800 border-purple-200' },
        { id: 'social', label: 'Social Services', color: 'bg-pink-100 text-pink-800 border-pink-200' },
        { id: 'community', label: 'Community', color: 'bg-orange-100 text-orange-800 border-orange-200' },
        { id: 'youth', label: 'Youth Development', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
        { id: 'housing', label: 'Housing', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
        { id: 'advocacy', label: 'Advocacy', color: 'bg-red-100 text-red-800 border-red-200' },
        { id: 'research', label: 'Research', color: 'bg-gray-100 text-gray-800 border-gray-200' }
    ];

    const getRandomTagColor = () => {
        const colors = [
            'bg-blue-100 text-blue-800 border-blue-200',
            'bg-green-100 text-green-800 border-green-200',
            'bg-purple-100 text-purple-800 border-purple-200',
            'bg-pink-100 text-pink-800 border-pink-200',
            'bg-orange-100 text-orange-800 border-orange-200',
            'bg-indigo-100 text-indigo-800 border-indigo-200',
            'bg-yellow-100 text-yellow-800 border-yellow-200',
            'bg-red-100 text-red-800 border-red-200'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    };

    const handleTagToggle = (tagId) => {
        if (selectedTags.length >= 6 && !selectedTags.some(tag => tag.id === tagId)) {
            return;
        }
        
        setSelectedTags(prev => {
            const existingTag = prev.find(tag => tag.id === tagId);
            if (existingTag) {
                return prev.filter(tag => tag.id !== tagId);
            } else {
                const availableTag = availableTags.find(tag => tag.id === tagId);
                return [...prev, availableTag];
            }
        });
    };

    const addCustomTag = () => {
        if (!customTagInput.trim() || selectedTags.length >= 6) return;
        
        const customTag = {
            id: `custom-${Date.now()}`,
            label: customTagInput.trim(),
            color: getRandomTagColor(),
            isCustom: true
        };
        
        setSelectedTags(prev => [...prev, customTag]);
        setCustomTagInput('');
    };

    const removeTag = (tagId) => {
        setSelectedTags(prev => prev.filter(tag => tag.id !== tagId));
    };

    // --- TIPTAP EDITOR HOOK WITH ENHANCED MENTION EXTENSION ---
    const editor = useEditor({
        extensions: [
            StarterKit,
            Mention.extend({
                name: 'mention',
                
                // Properly extend the addAttributes method to include 'type'
                addAttributes() {
                    return {
                        ...this.parent?.(),  // Keep the parent attributes (id, label)
                        type: {
                            default: null,
                            parseHTML: element => element.getAttribute('data-type'),
                            renderHTML: attributes => {
                                if (!attributes.type) return {};
                                return { 'data-type': attributes.type };
                            },
                        },
                    };
                },
                
                // Enhanced renderHTML to ensure all mentions get proper classes and attributes
                renderHTML({ node, HTMLAttributes }) {
                    const { id, label, type } = node.attrs;
                    return [
                        'span',
                        {
                            ...HTMLAttributes,
                            class: 'mention', // Ensure all mentions get the 'mention' class
                            'data-id': id,
                            'data-label': label,
                            'data-type': type,
                        },
                        `@${label}`,
                    ];
                },
                
                // Enhanced parseHTML to read our custom attributes
                parseHTML() {
                    return [
                        {
                            tag: 'span[data-type][data-id]',
                            getAttrs: element => {
                                return {
                                    id: element.getAttribute('data-id'),
                                    label: element.getAttribute('data-label'),
                                    type: element.getAttribute('data-type'),
                                };
                            },
                        },
                        // Also handle spans with just the mention class
                        {
                            tag: 'span.mention',
                            getAttrs: element => {
                                return {
                                    id: element.getAttribute('data-id'),
                                    label: element.getAttribute('data-label'),
                                    type: element.getAttribute('data-type'),
                                };
                            },
                        },
                    ];
                },
            }).configure({
                suggestion: {
                    items: async ({ query }) => {
                        try {
                            const { data, error } = await supabase.rpc('search_mentionable_entities', {
                                search_query: query,
                                limit_count: 10
                            });
                            if (error) {
                                console.error('Error searching mentions:', error);
                                return [];
                            }
                            
                            return data?.map(item => ({
                                id: item.id,
                                name: item.name,
                                type: item.type,
                                avatar_url: item.avatar_url,
                                title: item.title,
                                organization_name: item.organization_name,
                                role: item.role
                            })) || [];
                        } catch (err) {
                            console.error('Exception during mention search:', err);
                            return [];
                        }
                    },
                    render: () => {
                        let component;
                        let popup;

                        return {
                            onStart: props => {
                                component = new ReactRenderer(MentionList, {
                                    props,
                                    editor: props.editor,
                                });

                                popup = tippy('body', {
                                    getReferenceClientRect: props.clientRect,
                                    appendTo: () => document.body,
                                    content: component.element,
                                    showOnCreate: true,
                                    interactive: true,
                                    trigger: 'manual',
                                    placement: 'bottom-start',
                                    duration: 0,
                                });
                            },
                            onUpdate(props) {
                                component.updateProps(props);
                                popup[0].setProps({
                                    getReferenceClientRect: props.clientRect,
                                });
                            },
                            onKeyDown(props) {
                                if (props.event.key === 'Escape') {
                                    popup[0].hide();
                                    return true;
                                }
                                return component.ref?.onKeyDown(props);
                            },
                            onExit() {
                                if (popup && popup[0]) {
                                    popup[0].destroy();
                                }
                                if (component) {
                                    component.destroy();
                                }
                                // Clear references
                                popup = null;
                                component = null;
                            },
                        };
                    },
                },
            }),
        ],
        content: '<p></p>',
        onUpdate: ({ editor }) => {
            const textContent = editor.getText();
            setIsEditorContentEmpty(textContent.trim() === '');
        },
        editorProps: {
            attributes: {
                class: 'prose-sm outline-none border border-slate-200 rounded-lg p-3 pr-24 min-h-[7.5rem] focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-700',
                style: 'resize: vertical; white-space: pre-wrap;'
            },
        },
        placeholder: placeholder || `What's on your mind, ${profile?.full_name?.split(' ')[0] || 'there'}?`,
    });

    const editorRef = useRef(editor);
    useEffect(() => {
        editorRef.current = editor;
    }, [editor]);

    const insertAtSymbol = useCallback(() => {
        if (editorRef.current) {
            editorRef.current.commands.insertContent('@');
            editorRef.current.commands.focus();
        }
    }, []);

    const handleEmojiSelect = useCallback((emoji) => {
        if (editorRef.current) {
            editorRef.current.commands.insertContent(emoji);
            editorRef.current.commands.focus();
        }
        setShowEmojiPicker(false);
    }, []);

    // --- IMAGE RELATED FUNCTIONS ---
    const processFiles = (files) => {
        const maxImages = 6;
        
        if (selectedImages.length + files.length > maxImages) {
            setError(`You can only upload up to ${maxImages} images per post.`);
            return;
        }

        const validFiles = files.filter(file => {
            const isValidType = file.type.startsWith('image/');
            const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
            
            if (!isValidType) {
                setError('Please select only image files.');
                return false;
            }
            if (!isValidSize) {
                setError('Images must be less than 10MB.');
                return false;
            }
            return true;
        });

        if (validFiles.length > 0) {
            setError('');
            const newImages = validFiles.map(file => ({
                file,
                preview: URL.createObjectURL(file),
                id: Math.random().toString(36).substr(2, 9)
            }));
            setSelectedImages(prev => [...prev, ...newImages]);
        }
    };

    const handleImageSelect = (event) => {
        const files = Array.from(event.target.files);
        processFiles(files);
    };

    const removeImage = (imageId) => {
        setSelectedImages(prev => {
            const updated = prev.filter(img => img.id !== imageId);
            const removedImage = prev.find(img => img.id === imageId);
            if (removedImage) {
                URL.revokeObjectURL(removedImage.preview);
            }
            return updated;
        });
    };

    const uploadImages = async (images) => {
        const uploadPromises = images.map(async (imageObj) => {
            const fileExt = imageObj.file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
            const filePath = `post-images/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('post-images')
                .upload(filePath, imageObj.file);

            if (uploadError) {
                console.error('Error uploading image:', uploadError);
                throw uploadError;
            }

            const { data } = supabase.storage
                .from('post-images')
                .getPublicUrl(filePath);

            return data.publicUrl;
        });

        return Promise.all(uploadPromises);
    };

    // --- CREATE MENTION RECORDS FOR DATABASE ---
    const createMentionRecords = async (postId, mentions) => {
        const mentionTable = isOrganizationPost ? 'organization_post_mentions' : 'post_mentions';
        const postIdField = isOrganizationPost ? 'organization_post_id' : 'post_id';
        
        try {
            const mentionRecords = mentions.map(mention => {
                const record = {
                    [postIdField]: postId,
                    mention_type: mention.type
                };

                if (mention.type === 'user') {
                    record.mentioned_profile_id = mention.id;
                } else if (mention.type === 'organization') {
                    const [orgType, orgId] = mention.id.split('-');
                    record.mentioned_organization_id = parseInt(orgId);
                    record.mentioned_organization_type = orgType;
                }

                return record;
            });

            const { error } = await supabase
                .from(mentionTable)
                .insert(mentionRecords);

            if (error) {
                console.error('Error creating mention records:', error);
            }
        } catch (error) {
            console.error('Error processing mentions:', error);
        }
    };

    // --- MAIN SUBMIT HANDLER ---
    const handlePostSubmit = async () => {
        if (!editor || (isEditorContentEmpty && selectedImages.length === 0) || !profile) return;

        setIsLoading(true);
        setUploading(true);
        setError('');

        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setError('You must be logged in to post.');
                return;
            }

            let imageUrls = [];
            
            if (selectedImages.length > 0) {
                imageUrls = await uploadImages(selectedImages);
            }

            // Get HTML content from Tiptap
            const editorHtmlContent = editor.getHTML();

            // Extract mentions from Tiptap JSON for database storage
            const mentionsForStorage = [];
            const editorJsonContent = editor.getJSON();

            if (editorJsonContent?.content) {
                editorJsonContent.content.forEach((node) => {
                    if (node.content) {
                        node.content.forEach((inlineNode) => {
                            if (inlineNode.type === 'mention' && inlineNode.attrs) {
                                const { id, label, type } = inlineNode.attrs;
                                if (id && label && type) {
                                    mentionsForStorage.push({
                                        displayName: label,
                                        id: id,
                                        type: type
                                    });
                                }
                            }
                        });
                    }
                });
            }

            // Prepare post data based on post type
            let postData;
            
            if (isOrganizationPost) {
                // Organization post data
                postData = {
                    content: editorHtmlContent.trim() || '',
                    organization_id: organizationId,
                    organization_type: organizationType,
                    created_by_user_id: user.id,
                    image_urls: imageUrls.length > 0 ? imageUrls : null,
                    tags: selectedTags.length > 0 ? JSON.stringify(selectedTags) : null,
                    mentions: mentionsForStorage.length > 0 ? JSON.stringify(mentionsForStorage) : null,
                };
            } else {
                // Regular post data
                postData = {
                    content: editorHtmlContent.trim() || '',
                    user_id: user.id,
                    profile_id: profile.id,
                    image_urls: imageUrls.length > 0 ? imageUrls : null,
                    image_url: imageUrls.length === 1 ? imageUrls[0] : null,
                    tags: selectedTags.length > 0 ? JSON.stringify(selectedTags) : null,
                    channel: channel,
                    mentions: mentionsForStorage.length > 0 ? JSON.stringify(mentionsForStorage) : null,
                };
            }

            const { data: newPost, error: postError } = await supabase
                .from(postsTable)
                .insert(postData)
                .select()
                .single();

            if (postError) {
                setError('Failed to create post. Please try again.');
                console.error('Post creation error:', postError);
                return;
            }

            // UPDATED: Create mention records and notifications for BOTH post types
            if (mentionsForStorage.length > 0) {
                await createMentionRecords(newPost.id, mentionsForStorage);
                
                // CREATE MENTION NOTIFICATIONS - Now works for both regular and organization posts
                console.log('🔔 Creating mention notifications for', isOrganizationPost ? 'organization' : 'regular', 'post...');
                const notificationResult = await processMentionsForNotifications(
                    newPost.id, 
                    editorHtmlContent, 
                    profile.id,
                    isOrganizationPost  // Pass the post type flag - THIS IS THE KEY CHANGE
                );
                
                if (notificationResult.success) {
                    console.log(`✅ Created ${notificationResult.count} mention notifications for ${isOrganizationPost ? 'organization' : 'regular'} post`);
                } else {
                    console.error('❌ Failed to create mention notifications:', notificationResult.error);
                }
            }

            // Clean up
            selectedImages.forEach(img => URL.revokeObjectURL(img.preview));
            
            editor.commands.setContent('<p></p>');
            setSelectedImages([]);
            setSelectedTags([]);
            setIsEditorContentEmpty(true);

            if (onNewPost && typeof onNewPost === 'function') {
                onNewPost(newPost);
            }

        } catch (error) {
            console.error('Error creating post:', error);
            setError('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
            setUploading(false);
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            selectedImages.forEach(img => URL.revokeObjectURL(img.preview));
        };
    }, [selectedImages]);

    if (!editor) {
        return null;
    }

    const defaultPlaceholder = isOrganizationPost 
        ? `Share an update for ${organization?.name || 'your organization'}...`
        : `What's on your mind, ${profile?.full_name?.split(' ')[0] || 'there'}?`;

    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                    {isOrganizationPost && organization ? (
                        // Show organization avatar for org posts
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            {organization.logo_url || organization.image_url ? (
                                <img 
                                    src={organization.logo_url || organization.image_url} 
                                    alt={organization.name}
                                    className="w-12 h-12 rounded-full object-cover"
                                />
                            ) : (
                                <span className="text-white font-bold text-lg">
                                    {organization.name?.charAt(0)?.toUpperCase()}
                                </span>
                            )}
                        </div>
                    ) : (
                        // Show user avatar for regular posts
                        <Avatar src={profile?.avatar_url} fullName={profile?.full_name} size="md" />
                    )}
                </div>
                
                <div className="flex-1">
                    {isOrganizationPost && organization && (
                        <div className="mb-3">
                            <p className="font-medium text-slate-900">{organization.name}</p>
                        </div>
                    )}
                    
                    <div className="relative">
                        {/* TIPTAP EDITOR */}
                        <EditorContent editor={editor} />

                        <div className="absolute bottom-3 right-3 flex items-center space-x-3 z-10">
                            <button
                                onClick={insertAtSymbol}
                                className="p-1 text-slate-400 hover:text-blue-500 transition-colors"
                                type="button"
                                title="Mention someone"
                            >
                                <AtSign size={20} />
                            </button>

                            <button
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className="p-1 text-slate-400 hover:text-yellow-500 transition-colors"
                                type="button"
                            >
                                <Smile size={20} />
                            </button>
                        </div>

                        {showEmojiPicker && (
                            <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg border p-3 z-50 max-w-xs">
                                <div className="grid grid-cols-8 gap-1">
                                    {emojis.map((emoji, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleEmojiSelect(emoji)}
                                            className="text-lg hover:bg-gray-100 rounded p-1 transition-colors"
                                            type="button"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {selectedImages.length > 0 && (
                        <div className="mt-3">
                            <div className="grid grid-cols-3 gap-2">
                                {selectedImages.map((image, index) => (
                                    <div key={image.id} className="relative group">
                                        <img
                                            src={image.preview}
                                            alt={`Upload preview ${index + 1}`}
                                            className="w-full h-32 object-cover rounded-lg"
                                        />
                                        <button
                                            onClick={() => removeImage(image.id)}
                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            disabled={isLoading}
                                            type="button"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {selectedTags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {selectedTags.map(tag => (
                                <div key={tag.id} className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${tag.color} group`}>
                                    <span>{tag.label}</span>
                                    <button
                                        onClick={() => removeTag(tag.id)}
                                        className="ml-2 p-0.5 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
                                        type="button"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {error && (
                        <div className="mt-2 text-red-600 text-sm bg-red-50 p-2 rounded">{error}</div>
                    )}

                    <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center space-x-4">
                            {selectedImages.length < 6 && (
                                <>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        id="imageUpload"
                                        multiple
                                        accept="image/*"
                                        onChange={handleImageSelect}
                                        className="hidden"
                                        disabled={isLoading}
                                    />
                                    <label
                                        htmlFor="imageUpload"
                                        className="flex items-center space-x-2 text-slate-600 hover:text-blue-600 cursor-pointer transition-colors py-1"
                                    >
                                        <Camera size={20} />
                                        <span className="text-sm font-medium">
                                            {selectedImages.length > 0 ? 'Add More' : 'Photos'}
                                        </span>
                                    </label>
                                </>
                            )}
                            
                            <div className="relative">
                                <button
                                    onClick={() => setShowTagSelector(!showTagSelector)}
                                    className="flex items-center space-x-2 text-slate-600 hover:text-blue-600 cursor-pointer transition-colors py-1"
                                    type="button"
                                >
                                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">#</span>
                                    </div>
                                    <span className="text-sm font-medium">Tags</span>
                                </button>

                                {showTagSelector && (
                                    <div className="absolute top-full mt-2 bg-white rounded-lg shadow-lg border p-4 z-50 w-96">
                                        <p className="text-sm font-medium text-slate-700 mb-3">Add tags to categorize your post (max 6)</p>
                                        
                                        <div className="mb-4">
                                            <div className="flex space-x-2">
                                                <input
                                                    type="text"
                                                    value={customTagInput}
                                                    onChange={(e) => setCustomTagInput(e.target.value)}
                                                    placeholder="Create custom tag..."
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    onKeyPress={(e) => e.key === 'Enter' && addCustomTag()}
                                                    maxLength={20}
                                                    disabled={selectedTags.length >= 6}
                                                />
                                                <button
                                                    onClick={addCustomTag}
                                                    disabled={!customTagInput.trim() || selectedTags.length >= 6}
                                                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    type="button"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 mb-4">
                                            {availableTags.map(tag => (
                                                <button
                                                    key={tag.id}
                                                    onClick={() => handleTagToggle(tag.id)}
                                                    disabled={selectedTags.length >= 6 && !selectedTags.some(t => t.id === tag.id)}
                                                    className={`text-left px-3 py-2 rounded-lg text-sm font-medium border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                                        selectedTags.some(t => t.id === tag.id)
                                                            ? tag.color + ' ring-2 ring-blue-300'
                                                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                                                    }`}
                                                    type="button"
                                                >
                                                    {tag.label}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-500">{selectedTags.length}/6 tags selected</span>
                                            <button
                                                onClick={() => setShowTagSelector(false)}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                                type="button"
                                            >
                                                Done
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {selectedImages.length > 0 && (
                                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                                    {selectedImages.length}/6 photos
                                </span>
                            )}
                            {selectedTags.length > 0 && (
                                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                                    {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                        
                        <button
                            onClick={handlePostSubmit}
                            disabled={isLoading || (isEditorContentEmpty && selectedImages.length === 0)}
                            className={`
                                bg-blue-600 text-white px-6 py-2 rounded-lg font-medium
                                hover:bg-blue-700 transition-colors shadow-sm
                                disabled:opacity-50 disabled:cursor-not-allowed
                            `}
                            type="button"
                        >
                            {uploading ? 'Uploading...' : isLoading ? 'Posting...' : 'Post'}
                        </button>
                    </div>
                    
                    <div className="mt-2 text-xs text-slate-500">
                        💡 Type @ to mention users or organizations
                    </div>
                </div>
            </div>
        </div>
    );
}