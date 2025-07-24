// src/components/post/EditPost.jsx - FIXED VERSION
import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Camera, X } from 'lucide-react';

// --- TIPTAP IMPORTS ---
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

    // --- TIPTAP EDITOR HOOK WITH FIXED MENTION EXTENSION ---
    const editor = useEditor({
        extensions: [
            StarterKit,
            // FIXED MENTION EXTENSION - Direct database queries
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

                            // FIXED: Direct database queries instead of RPC function
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

                            // Format results to match expected structure
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
        const displayImages = post.image_urls && post.image_urls.length > 0 ? post.image_urls : [];
        setEditedImages(displayImages);
        const displayTags = post.tags ? (typeof post.tags === 'string' ? JSON.parse(post.tags) : post.tags) : [];
        setEditedTags(displayTags);
        return () => { isComponentMounted.current = false; };
    }, [post]);

    const predefinedTags = [
        { id: 'funding', label: 'Funding', color: 'bg-blue-100 text-blue-800 border-blue-200' },
        { id: 'collaboration', label: 'Collaboration', color: 'bg-green-100 text-green-800 border-green-200' },
        { id: 'volunteer', label: 'Volunteer', color: 'bg-purple-100 text-purple-800 border-purple-200' },
        { id: 'event', label: 'Event', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
        { id: 'announcement', label: 'Announcement', color: 'bg-red-100 text-red-800 border-red-200' },
        { id: 'grant', label: 'Grant', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
        { id: 'partnership', label: 'Partnership', color: 'bg-pink-100 text-pink-800 border-pink-200' },
        { id: 'success-story', label: 'Success Story', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    ];

    const getRandomTagColor = () => {
        const colors = [
            'bg-slate-100 text-slate-800 border-slate-200',
            'bg-gray-100 text-gray-800 border-gray-200',
            'bg-zinc-100 text-zinc-800 border-zinc-200',
            'bg-stone-100 text-stone-800 border-stone-200',
            'bg-orange-100 text-orange-800 border-orange-200',
            'bg-amber-100 text-amber-800 border-amber-200',
            'bg-lime-100 text-lime-800 border-lime-200',
            'bg-cyan-100 text-cyan-800 border-cyan-200',
            'bg-sky-100 text-sky-800 border-sky-200',
            'bg-violet-100 text-violet-800 border-violet-200',
            'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
            'bg-rose-100 text-rose-800 border-rose-200',
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    };

    const addTag = (tag) => { if (!editedTags.find(t => t.id === tag.id)) { setEditedTags(prev => [...prev, tag]); } setShowTagSelector(false); };
    const addCustomTag = () => { if (customTagInput.trim() && !editedTags.find(t => t.label.toLowerCase() === customTagInput.trim().toLowerCase())) { const customTag = { id: `custom-${Date.now()}`, label: customTagInput.trim(), color: getRandomTagColor(), isCustom: true }; setEditedTags(prev => [...prev, customTag]); setCustomTagInput(''); } };
    const removeTag = (tagId) => setEditedTags(prev => prev.filter(tag => tag.id !== tagId));
    const removeImage = (imageUrl) => setEditedImages(prev => prev.filter(url => url !== imageUrl));
    const removeNewImage = (imageId) => setNewImages(prev => { const updated = prev.filter(img => img.id !== imageId); const removedImage = prev.find(img => img.id === imageId); if (removedImage) URL.revokeObjectURL(removedImage.preview); return updated; });
    const handleImageSelect = (event) => { const files = Array.from(event.target.files); const maxImages = 6; if (editedImages.length + newImages.length + files.length > maxImages) { alert(`You can only have up to ${maxImages} images per post.`); return; } const validFiles = files.filter(file => file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024); if (validFiles.length < files.length) alert('Some images were invalid (must be under 10MB).'); if (validFiles.length > 0) { const imageObjects = validFiles.map(file => ({ file, preview: URL.createObjectURL(file), id: Math.random().toString(36).substr(2, 9) })); setNewImages(prev => [...prev, ...imageObjects]); } };
    const uploadNewImages = async () => { if (newImages.length === 0) return []; const uploadPromises = newImages.map(async (imageObj) => { const fileExt = imageObj.file.name.split('.').pop(); const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`; const { data, error } = await supabase.storage.from('post-images').upload(fileName, imageObj.file); if (error) throw error; const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(fileName); return urlData.publicUrl; }); return Promise.all(uploadPromises); };

    const handleSave = async () => {
        if (!editor) return;
        setUploading(true);
        try {
            let finalImageUrls = [...editedImages];
            if (newImages.length > 0) { const uploadedUrls = await uploadNewImages(); finalImageUrls = [...finalImageUrls, ...uploadedUrls]; }
            const editorHtmlContent = editor.getHTML();
            const mentionsForStorage = []; const editorJsonContent = editor.getJSON();
            if (editorJsonContent?.content) { editorJsonContent.content.forEach((node) => { if (node.content) { node.content.forEach((inlineNode) => { if (inlineNode.type === 'mention' && inlineNode.attrs) { const { id, label, type } = inlineNode.attrs; if (id && label && type) { mentionsForStorage.push({ displayName: label, id: id, type: type }); } } }); } }); }
            const updatedPost = { content: editorHtmlContent.trim(), image_urls: finalImageUrls.length > 0 ? finalImageUrls : null, tags: editedTags.length > 0 ? JSON.stringify(editedTags) : null, mentions: mentionsForStorage.length > 0 ? JSON.stringify(mentionsForStorage) : null, updated_at: new Date().toISOString() };
            onSave(updatedPost);
        } catch (error) { console.error('Error saving post:', error); alert('Failed to save post. Please try again.'); } finally { setUploading(false); }
    };

    return (
        <div className="space-y-4">
            <div className="border border-slate-200 rounded-lg p-4">
                <EditorContent editor={editor} />
            </div>

            {(editedImages.length > 0 || newImages.length > 0) && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {editedImages.map((imageUrl, index) => (
                        <div key={`existing-${index}`} className="relative">
                            <img src={imageUrl} alt={`Existing ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
                            <button onClick={() => removeImage(imageUrl)} className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"><X size={14} /></button>
                        </div>
                    ))}
                    {newImages.map((imageObj) => (
                        <div key={`new-${imageObj.id}`} className="relative">
                            <img src={imageObj.preview} alt="New preview" className="w-full h-32 object-cover rounded-lg" />
                            <button onClick={() => removeNewImage(imageObj.id)} className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"><X size={14} /></button>
                        </div>
                    ))}
                </div>
            )}

            {editedTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {editedTags.map(tag => (
                        <span key={tag.id} className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${tag.color}`}>
                            {tag.label}
                            <button onClick={() => removeTag(tag.id)} className="ml-2 hover:text-red-600 transition-colors"><X size={14} /></button>
                        </span>
                    ))}
                </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center space-x-2">
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center space-x-2 px-3 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors" disabled={uploading}>
                        <Camera size={18} />
                        <span className="text-sm">Add Photos</span>
                    </button>

                    <div className="relative">
                        <button onClick={() => setShowTagSelector(!showTagSelector)} className="flex items-center space-x-2 px-3 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors" disabled={uploading}>
                            <span className="text-sm">#</span>
                            <span className="text-sm">Tags</span>
                        </button>

                        {showTagSelector && (
                            <div className="absolute bottom-full left-0 mb-2 p-4 bg-white border border-slate-200 rounded-lg shadow-lg z-10 min-w-64">
                                <h4 className="font-medium text-slate-800 mb-3">Add Tags</h4>
                                <div className="space-y-2 mb-4">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider">Popular Tags</p>
                                    <div className="flex flex-wrap gap-2">
                                        {predefinedTags.map(tag => (
                                            <button key={tag.id} onClick={() => addTag(tag)} disabled={editedTags.find(t => t.id === tag.id)} className={`px-2 py-1 text-xs rounded-full border transition-colors ${editedTags.find(t => t.id === tag.id) ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : `${tag.color} hover:opacity-80 cursor-pointer`}`}>
                                                {tag.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="border-t border-slate-100 pt-3">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Custom Tag</p>
                                    <div className="flex space-x-2">
                                        <input type="text" value={customTagInput} onChange={(e) => setCustomTagInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addCustomTag()} placeholder="Enter tag name" className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                        <button onClick={addCustomTag} disabled={!customTagInput.trim()} className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">Add</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <button onClick={onCancel} disabled={uploading} className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors disabled:opacity-50">Cancel</button>
                    <button onClick={handleSave} disabled={uploading} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                        {uploading ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Saving...</>) : ('Save Changes')}
                    </button>
                </div>
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
        </div>
    );
}