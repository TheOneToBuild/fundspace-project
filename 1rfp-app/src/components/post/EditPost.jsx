// src/components/post/EditPost.jsx
import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Camera, X } from 'lucide-react';

// --- TIPTAP IMPORTS (from CreatePost.jsx) ---
import { useEditor, EditorContent, ReactRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';

// --- CUSTOM COMPONENT IMPORTS ---
import MentionList from '../mentions/MentionList';

export default function EditPost({ post, onSave, onCancel }) {
    const [editedTags, setEditedTags] = useState([]);
    const [editedImages, setEditedImages] = useState([]);
    const [showTagSelector, setShowTagSelector] = useState(false);
    const [customTagInput, setCustomTagInput] = useState('');
    const [newImages, setNewImages] = useState([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    const isComponentMounted = useRef(true);

    // --- TIPTAP EDITOR HOOK (replaces useState for content) ---
    const editor = useEditor({
        extensions: [
            StarterKit,
            // Copied Mention configuration from CreatePost.jsx to ensure consistency
            Mention.extend({
                name: 'mention',
                addAttributes() {
                    return { ...this.parent?.(), type: { default: null, parseHTML: e => e.getAttribute('data-type'), renderHTML: a => a.type ? { 'data-type': a.type } : {} } };
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
                            const { data, error } = await supabase.rpc('search_mentionable_entities', { search_query: query, limit_count: 10 });
                            if (error) { console.error('Error searching mentions:', error); return []; }
                            return data?.map(item => ({...item})) || [];
                        } catch (err) {
                            console.error('Exception during mention search:', err); return [];
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
        content: post.content || '', // Initialize editor with the post's current HTML content
        editorProps: {
            attributes: {
                class: 'prose-sm outline-none border border-slate-200 rounded-lg p-3 min-h-[7.5rem] focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-700',
                style: 'resize: vertical; white-space: pre-wrap;'
            },
        },
    });

    // Effect to initialize state from props
    useEffect(() => {
        isComponentMounted.current = true;
        const displayImages = post.image_urls && post.image_urls.length > 0 ? post.image_urls : (post.image_url ? [post.image_url] : []);
        setEditedImages(displayImages);
        let parsedTags = [];
        if (post.tags) {
            try { parsedTags = typeof post.tags === 'string' ? JSON.parse(post.tags) : post.tags; } catch (e) { console.error('Error parsing tags in EditPost:', e); }
        }
        setEditedTags(Array.isArray(parsedTags) ? parsedTags : []);
        return () => { isComponentMounted.current = false; };
    }, [post]);

    const availableTags = [ { id: 'education', label: 'Education', color: 'bg-blue-100 text-blue-800 border-blue-200' }, { id: 'health', label: 'Health', color: 'bg-green-100 text-green-800 border-green-200' }, { id: 'environment', label: 'Environment', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' }, { id: 'arts', label: 'Arts & Culture', color: 'bg-purple-100 text-purple-800 border-purple-200' }, { id: 'social', label: 'Social Services', color: 'bg-pink-100 text-pink-800 border-pink-200' }, { id: 'community', label: 'Community', color: 'bg-orange-100 text-orange-800 border-orange-200' }, { id: 'youth', label: 'Youth Development', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' }, { id: 'housing', label: 'Housing', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' }, { id: 'advocacy', label: 'Advocacy', color: 'bg-red-100 text-red-800 border-red-200' }, { id: 'research', label: 'Research', color: 'bg-gray-100 text-gray-800 border-gray-200' } ];
    const getRandomTagColor = () => { const colors = [ 'bg-blue-100 text-blue-800 border-blue-200', 'bg-green-100 text-green-800 border-green-200', 'bg-purple-100 text-purple-800 border-purple-200', 'bg-pink-100 text-pink-800 border-pink-200', 'bg-orange-100 text-orange-800 border-orange-200', 'bg-indigo-100 text-indigo-800 border-indigo-200', 'bg-yellow-100 text-yellow-800 border-yellow-200', 'bg-red-100 text-red-800 border-red-200' ]; return colors[Math.floor(Math.random() * colors.length)]; };
    const handleTagToggle = (tagId) => { if (editedTags.length >= 6 && !editedTags.some(tag => tag.id === tagId)) return; setEditedTags(prev => { const existingTag = prev.find(tag => tag.id === tagId); if (existingTag) return prev.filter(tag => tag.id !== tagId); const availableTag = availableTags.find(tag => tag.id === tagId); return [...prev, availableTag]; }); };
    const addCustomTag = () => { if (!customTagInput.trim() || editedTags.length >= 6) return; const customTag = { id: `custom-${Date.now()}`, label: customTagInput.trim(), color: getRandomTagColor(), isCustom: true }; setEditedTags(prev => [...prev, customTag]); setCustomTagInput(''); };
    const removeTag = (tagId) => setEditedTags(prev => prev.filter(tag => tag.id !== tagId));
    const removeImage = (imageUrl) => setEditedImages(prev => prev.filter(url => url !== imageUrl));
    const removeNewImage = (imageId) => setNewImages(prev => { const updated = prev.filter(img => img.id !== imageId); const removedImage = prev.find(img => img.id === imageId); if (removedImage) URL.revokeObjectURL(removedImage.preview); return updated; });
    const handleImageSelect = (event) => { const files = Array.from(event.target.files); const maxImages = 6; if (editedImages.length + newImages.length + files.length > maxImages) { alert(`You can only have up to ${maxImages} images per post.`); return; } const validFiles = files.filter(file => file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024); if (validFiles.length < files.length) alert('Some images were invalid (must be under 10MB).'); if (validFiles.length > 0) { const imageObjects = validFiles.map(file => ({ file, preview: URL.createObjectURL(file), id: Math.random().toString(36).substr(2, 9) })); setNewImages(prev => [...prev, ...imageObjects]); } };
    const uploadNewImages = async () => { if (newImages.length === 0) return []; const uploadPromises = newImages.map(async (imageObj) => { const fileExt = imageObj.file.name.split('.').pop(); const fileName = `${Math.random()}${fileExt}`; const filePath = `post-images/${fileName}`; const { error: uploadError } = await supabase.storage.from('post-images').upload(filePath, imageObj.file); if (uploadError) throw uploadError; const { data } = supabase.storage.from('post-images').getPublicUrl(filePath); return data.publicUrl; }); return Promise.all(uploadPromises); };

    // Updated save handler to get content and mentions from the editor
    const handleSave = async () => {
        if (!editor) return;
        setUploading(true);
        try {
            const newImageUrls = await uploadNewImages();
            const allImages = [...editedImages, ...newImageUrls];
            newImages.forEach(img => URL.revokeObjectURL(img.preview));
            const editorHtmlContent = editor.getHTML();
            const mentionsForStorage = [];
            const editorJsonContent = editor.getJSON();
            if (editorJsonContent?.content) {
                editorJsonContent.content.forEach(node => {
                    if (node.content) {
                        node.content.forEach(inlineNode => {
                            if (inlineNode.type === 'mention' && inlineNode.attrs) {
                                const { id, label, type } = inlineNode.attrs;
                                if (id && label && type) mentionsForStorage.push({ displayName: label, id, type });
                            }
                        });
                    }
                });
            }
            onSave({ content: editorHtmlContent, tags: editedTags, images: allImages, mentions: mentionsForStorage });
        } catch (error) {
            alert('Failed to save changes. Please try again.');
        } finally {
            if (isComponentMounted.current) setUploading(false);
        }
    };

    if (!editor) return null;

    return (
        <div className="space-y-4">
            {/* Replaced textarea with the Tiptap EditorContent component */}
            <EditorContent editor={editor} />

            {(editedImages.length > 0 || newImages.length > 0) && (
                 <div className="grid grid-cols-3 gap-2">
                    {editedImages.map((imageUrl, index) => (
                        <div key={index} className="relative group"><img src={imageUrl} alt={`Image ${index + 1}`} className="w-full h-24 object-cover rounded-lg" /><button onClick={() => removeImage(imageUrl)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100" type="button"><X size={12} /></button></div>
                    ))}
                    {newImages.map((image) => (
                        <div key={image.id} className="relative group"><img src={image.preview} alt="New upload" className="w-full h-24 object-cover rounded-lg" /><button onClick={() => removeNewImage(image.id)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100" type="button"><X size={12} /></button></div>
                    ))}
                </div>
            )}
            
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    {editedImages.length + newImages.length < 6 && (
                        <>
                            <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleImageSelect} className="hidden" id="imageEditUpload" />
                            <label htmlFor="imageEditUpload" className="flex items-center space-x-2 text-slate-600 hover:text-blue-600 cursor-pointer" type="button">
                                <Camera size={20} /><span className="text-sm font-medium">Add Images</span>
                            </label>
                        </>
                    )}
                    <div className="relative">
                        <button onClick={() => setShowTagSelector(!showTagSelector)} className="flex items-center space-x-2 text-slate-600 hover:text-blue-600 cursor-pointer" type="button">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center"><span className="text-white text-xs font-bold">#</span></div>
                            <span className="text-sm font-medium">Manage Tags</span>
                        </button>
                        {showTagSelector && (
                            <div className="absolute top-full mt-2 bg-white rounded-lg shadow-lg border p-4 z-50 w-96">
                                <p className="text-sm font-medium text-slate-700 mb-3">Manage tags ({editedTags.length}/6)</p>
                                <div className="flex space-x-2 mb-4">
                                    <input type="text" value={customTagInput} onChange={(e) => setCustomTagInput(e.target.value)} placeholder="Create custom tag..." className="flex-1 px-3 py-2 border rounded-lg text-sm" onKeyPress={(e) => e.key === 'Enter' && addCustomTag()} maxLength={20} disabled={editedTags.length >= 6} />
                                    <button onClick={addCustomTag} disabled={!customTagInput.trim() || editedTags.length >= 6} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">Add</button>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    {availableTags.map(tag => (
                                        <button key={tag.id} onClick={() => handleTagToggle(tag.id)} disabled={editedTags.length >= 6 && !editedTags.some(t => t.id === tag.id)} className={`text-left px-3 py-2 rounded-lg text-sm border disabled:opacity-50 ${editedTags.some(t => t.id === tag.id) ? tag.color + ' ring-2 ring-blue-400' : 'bg-gray-50 hover:bg-gray-100'}`} type="button">{tag.label}</button>
                                    ))}
                                </div>
                                <button onClick={() => setShowTagSelector(false)} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm" type="button">Done</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="flex items-center justify-end space-x-2 pt-3 border-t">
                <button onClick={onCancel} className="px-4 py-2 text-sm text-slate-600" disabled={uploading}>Cancel</button>
                <button onClick={handleSave} disabled={uploading} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">{uploading ? 'Saving...' : 'Save Changes'}</button>
            </div>
        </div>
    );
};