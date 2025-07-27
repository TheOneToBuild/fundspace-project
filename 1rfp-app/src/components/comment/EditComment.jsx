// src/components/comment/EditComment.jsx
import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Camera, X, Check, XIcon } from 'lucide-react';

// --- TIPTAP IMPORTS ---
import { useEditor, EditorContent, ReactRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';

// --- CUSTOM COMPONENT IMPORTS ---
import MentionList from '../mentions/MentionList';

export default function EditComment({ 
    comment, 
    isOrganizationPost, 
    onSave, 
    onCancel 
}) {
    const [editedImages, setEditedImages] = useState([]);
    const [newImages, setNewImages] = useState([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    const isComponentMounted = useRef(true);

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
                            if (!query || query.length < 2) {
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
                                .select('id, name, type, tagline, image_url')
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
                                id: `${org.type}-${org.id}`,
                                name: org.name,
                                type: 'organization',
                                avatar_url: org.image_url,
                                title: org.tagline,
                                organization_name: org.type === 'nonprofit' ? 'Nonprofit' : 'Funder',
                                role: org.type
                            }));

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
                                popup = tippy('body', { getReferenceClientRect: props.clientRect, appendTo: () => document.body, content: component.element, showOnCreate: true, interactive: true, trigger: 'manual', placement: 'bottom-start', duration: 0 });
                            },
                            onUpdate: props => { component.updateProps(props); popup[0].setProps({ getReferenceClientRect: props.clientRect }); },
                            onKeyDown: props => { if (props.event.key === 'Escape') { popup[0].hide(); return true; } return component.ref?.onKeyDown(props); },
                            onExit: () => { if (popup && popup[0]) popup[0].destroy(); if (component) component.destroy(); popup = null; component = null; },
                        };
                    },
                },
            }),
        ],
        content: comment.content || '', // Initialize with current comment content
        editorProps: {
            attributes: {
                class: 'prose-sm outline-none border border-slate-200 rounded-lg p-3 min-h-[3rem] focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-700 bg-white',
                style: 'resize: vertical; white-space: pre-wrap;'
            },
        },
    });

    // Effect to initialize state from comment
    useEffect(() => {
        isComponentMounted.current = true;
        // Initialize images if comment has them
        const displayImages = comment.image_urls || [];
        setEditedImages(displayImages);
        
        return () => { 
            isComponentMounted.current = false; 
        };
    }, [comment]);

    const removeImage = (imageUrl) => setEditedImages(prev => prev.filter(url => url !== imageUrl));
    const removeNewImage = (imageId) => setNewImages(prev => { 
        const updated = prev.filter(img => img.id !== imageId); 
        const removedImage = prev.find(img => img.id === imageId); 
        if (removedImage) URL.revokeObjectURL(removedImage.preview); 
        return updated; 
    });

    const handleImageSelect = (event) => { 
        const files = Array.from(event.target.files); 
        const maxImages = 1; // Limit comments to 1 image
        if (editedImages.length + newImages.length + files.length > maxImages) { 
            alert(`You can only have ${maxImages} image per comment.`); 
            return; 
        } 
        const validFiles = files.filter(file => file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024); 
        if (validFiles.length < files.length) alert('Some images were invalid (must be under 10MB).'); 
        if (validFiles.length > 0) { 
            const imageObjects = validFiles.map(file => ({ 
                file, 
                preview: URL.createObjectURL(file), 
                id: Math.random().toString(36).substr(2, 9) 
            })); 
            setNewImages(prev => [...prev, ...imageObjects]); 
        } 
    };

    const uploadNewImages = async () => { 
        if (newImages.length === 0) return []; 
        const uploadPromises = newImages.map(async (imageObj) => { 
            const fileExt = imageObj.file.name.split('.').pop(); 
            const fileName = `comment_${Math.random().toString(36).substring(2)}.${fileExt}`; 
            const { data, error } = await supabase.storage.from('comment-images').upload(fileName, imageObj.file); 
            if (error) throw error; 
            const { data: urlData } = supabase.storage.from('comment-images').getPublicUrl(fileName); 
            return urlData.publicUrl; 
        }); 
        return Promise.all(uploadPromises); 
    };

    const handleSave = async () => {
        if (!editor) return;
        setUploading(true);
        
        try {
            // Upload any new images
            let finalImageUrls = [...editedImages];
            if (newImages.length > 0) { 
                const uploadedUrls = await uploadNewImages(); 
                finalImageUrls = [...finalImageUrls, ...uploadedUrls]; 
            }
            
            // Get editor content
            const editorHtmlContent = editor.getHTML();
            
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
            
            // Prepare updated comment data - now using all available columns
            const updatedComment = { 
                content: editorHtmlContent.trim(),
                updated_at: new Date().toISOString(),
                image_urls: finalImageUrls.length > 0 ? finalImageUrls : null, 
                mentions: mentionsForStorage.length > 0 ? mentionsForStorage : null
            };
            
            onSave(updatedComment);
        } catch (error) { 
            console.error('Error saving comment:', error); 
            alert('Failed to save comment. Please try again.'); 
        } finally { 
            setUploading(false); 
        }
    };

    return (
        <div className="space-y-3 bg-white p-3 rounded-lg border border-slate-200">
            {/* Editor */}
            <div className="border border-slate-200 rounded-lg">
                <EditorContent editor={editor} />
            </div>

            {/* Images - Now enabled since database columns exist */}
            {(editedImages.length > 0 || newImages.length > 0) && (
                <div className="flex flex-wrap gap-2">
                    {editedImages.map((imageUrl, index) => (
                        <div key={`existing-${index}`} className="relative">
                            <img src={imageUrl} alt={`Existing ${index + 1}`} className="w-48 h-auto rounded-lg border border-slate-200" />
                            <button onClick={() => removeImage(imageUrl)} className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg">
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                    {newImages.map((imageObj) => (
                        <div key={`new-${imageObj.id}`} className="relative">
                            <img src={imageObj.preview} alt="New preview" className="w-48 h-auto rounded-lg border border-slate-200" />
                            <button onClick={() => removeNewImage(imageObj.id)} className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg">
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                {/* Image upload button - Now enabled */}
                <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="flex items-center space-x-2 px-3 py-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors text-sm" 
                    disabled={uploading}
                >
                    <Camera size={16} />
                    <span>Add Photos</span>
                </button>

                <div className="flex items-center space-x-2 ml-auto">
                    <button 
                        onClick={onCancel} 
                        disabled={uploading} 
                        className="px-3 py-1.5 text-slate-600 hover:text-slate-800 transition-colors text-sm disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave} 
                        disabled={uploading} 
                        className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        {uploading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Check size={16} className="mr-1" />
                                Save
                            </>
                        )}
                    </button>
                </div>
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
        </div>
    );
}