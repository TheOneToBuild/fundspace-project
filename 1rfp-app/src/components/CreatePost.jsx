// src/components/CreatePost.jsx - Compact Version with Modal Expansion
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Camera, X, Smile, AtSign } from 'lucide-react';
import Avatar from './Avatar.jsx';
import { processMentionsForNotifications } from '../utils/notificationUtils';

// --- TIPTAP IMPORTS ---
import { useEditor, EditorContent, ReactRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import Placeholder from '@tiptap/extension-placeholder';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';

// Import your custom MentionList component
import MentionList from './mentions/MentionList';

// Organization channel mapping - matches database constraint
const ORGANIZATION_CHANNELS = {
  'nonprofit': 'nonprofit-community',
  'foundation': 'foundation-community',
  'education': 'education-community',
  'healthcare': 'healthcare-community',
  'government': 'government-community',
  'religious': 'religious-community',
  'forprofit': 'forprofit-community'
};

// Helper function to get database channel from organization type
const getDbChannelFromOrgType = (orgType) => {
  if (!orgType) return 'hello-community';
  const baseType = orgType.split('.')[0].toLowerCase();
  return ORGANIZATION_CHANNELS[baseType] || 'hello-community';
};

// Compact Post Box Component
const CompactPostBox = ({ profile, organization, isOrganizationPost, onClick }) => {
  const defaultPlaceholder = isOrganizationPost 
    ? `Share an update for ${organization?.name || 'your organization'}...`
    : `What's on your mind, ${profile?.full_name?.split(' ')[0] || 'there'}?`;

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          {isOrganizationPost && organization ? (
            <Avatar 
              src={organization.image_url} 
              fullName={organization.name} 
              size="md" 
            />
          ) : (
            <Avatar 
              src={profile?.avatar_url} 
              fullName={profile?.full_name} 
              size="md" 
            />
          )}
        </div>
        
        <div 
          onClick={onClick}
          className="flex-1 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer rounded-full px-4 py-3 border border-slate-200"
        >
          <span className="text-slate-500 text-sm">
            {defaultPlaceholder}
          </span>
        </div>

        <button
          onClick={onClick}
          className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 transition-colors"
        >
          Post
        </button>
      </div>
    </div>
  );
};

// Full Post Modal Component  
const PostModal = ({ 
  isOpen, 
  onClose, 
  profile, 
  onNewPost, 
  channel, 
  placeholder, 
  organizationId, 
  organizationType, 
  organization 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isEditorContentEmpty, setIsEditorContentEmpty] = useState(true);
  const [selectedTags, setSelectedTags] = useState([]);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [customTagInput, setCustomTagInput] = useState('');

  const fileInputRef = useRef(null);
  const tagSelectorRef = useRef(null);

  const emojis = [
    '😊', '😂', '❤️', '👍', '🎉', '🔥', '💡', '🚀',
    '💯', '⭐', '🌟', '💪', '🙌', '👏', '🎯', '💝'
  ];

  // Check if this is an organization post
  const isOrganizationPost = channel === 'organization' && organizationId && organizationType;

  // Determine which table to use
  const postsTable = isOrganizationPost ? 'organization_posts' : 'posts';

  // Generate the placeholder text
  const defaultPlaceholder = isOrganizationPost 
    ? `Share an update for ${organization?.name || 'your organization'}...`
    : `What's on your mind, ${profile?.full_name?.split(' ')[0] || 'there'}?`;
  
  const placeholderText = placeholder || defaultPlaceholder;

  // TIPTAP EDITOR HOOK
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: placeholderText,
        showOnlyWhenEditable: true,
        showOnlyCurrent: false,
        includeChildren: true,
      }),
      // MENTION EXTENSION with following/followers
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
          return [
            {
              tag: 'span[data-type][data-id]',
              getAttrs: element => ({
                id: element.getAttribute('data-id'),
                label: element.getAttribute('data-label'),
                type: element.getAttribute('data-type'),
              }),
            },
            {
              tag: 'span.mention',
              getAttrs: element => ({
                id: element.getAttribute('data-id'),
                label: element.getAttribute('data-label'),
                type: element.getAttribute('data-type'),
              }),
            },
          ];
        },
      }).configure({
        suggestion: {
          items: async ({ query }) => {
            try {
              if (!query || query.length === 0) {
                if (!profile?.id) return [];
                try {
                  const { data: following } = await supabase
                    .from('followers')
                    .select(`
                      following_id,
                      profiles!followers_following_id_fkey(id, full_name, title, organization_name, avatar_url, role)
                    `)
                    .eq('follower_id', profile.id)
                    .limit(5);

                  return (following || []).map(f => ({
                    id: f.profiles.id,
                    name: f.profiles.full_name,
                    type: 'user',
                    avatar_url: f.profiles.avatar_url,
                    title: f.profiles.title,
                    organization_name: f.profiles.organization_name,
                    role: f.profiles.role
                  }));
                } catch (err) {
                  console.error('Error fetching following for mention suggestions:', err);
                  return [];
                }
              }

              if (query.length < 2) return [];

              const searchPattern = `%${query.trim()}%`;
              
              const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, full_name, title, organization_name, avatar_url, role')
                .or(`full_name.ilike.${searchPattern},title.ilike.${searchPattern},organization_name.ilike.${searchPattern}`)
                .limit(5);

              if (profilesError) {
                console.error('Error searching profiles:', profilesError);
              }

              const { data: organizations, error: orgsError } = await supabase
                .from('organizations')
                .select('id, name, type, tagline, image_url, slug')
                .ilike('name', searchPattern)
                .limit(5);

              if (orgsError) {
                console.error('Error searching organizations:', orgsError);
              }

              const userResults = (profiles || []).map(profile => ({
                id: profile.id,
                name: profile.full_name,
                type: 'user',
                avatar_url: profile.avatar_url,
                title: profile.title,
                organization_name: profile.organization_name,
                role: profile.role
              }));

              const orgResults = (organizations || []).map(org => {
                const mentionId = `${org.type}-${org.id}`;
                const getOrgTypeLabel = (type) => {
                  const typeLabels = {
                    'nonprofit': 'Nonprofit',
                    'funder': 'Funder', 
                    'foundation': 'Foundation',
                    'education': 'Education',
                    'healthcare': 'Healthcare',
                    'government': 'Government',
                    'religious': 'Religious',
                    'forprofit': 'For-Profit'
                  };
                  return typeLabels[type] || 'Organization';
                };

                return {
                  id: mentionId,
                  name: org.name,
                  type: 'organization',
                  avatar_url: org.image_url,
                  title: org.tagline || `${getOrgTypeLabel(org.type)} Organization`,
                  organization_name: getOrgTypeLabel(org.type),
                  role: org.type,
                  _orgType: org.type,
                  _orgId: org.id,
                  _slug: org.slug
                };
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
                  maxWidth: 400,
                  theme: 'light-border'
                });
              },
              onUpdate: props => { 
                component.updateProps(props); 
                popup[0].setProps({ getReferenceClientRect: props.clientRect }); 
              },
              onKeyDown: props => { 
                if (props.event.key === 'Escape') { 
                  popup[0].hide(); 
                  return true; 
                } 
                return component.ref?.onKeyDown(props); 
              },
              onExit: () => { 
                if (popup && popup[0]) popup[0].destroy(); 
                if (component) component.destroy(); 
                popup = null; 
                component = null; 
              },
            };
          },
        },
      }),
    ],
    content: '<p></p>',
    editorProps: {
      attributes: {
        class: 'prose-sm outline-none text-slate-700 placeholder:text-slate-400 bg-white',
        style: 'line-height: 1.5; min-height: 120px; white-space: pre-wrap;'
      },
    },
    onUpdate: ({ editor }) => {
      const isEmpty = editor.isEmpty;
      setIsEditorContentEmpty(isEmpty);
    }
  });

  // Available tags for selection
  const availableTags = [
    { id: 'announcement', label: 'Announcement', color: 'bg-blue-100 text-blue-800' },
    { id: 'funding', label: 'Funding', color: 'bg-green-100 text-green-800' },
    { id: 'program', label: 'Program', color: 'bg-purple-100 text-purple-800' },
    { id: 'partnership', label: 'Partnership', color: 'bg-indigo-100 text-indigo-800' },
    { id: 'impact', label: 'Impact', color: 'bg-orange-100 text-orange-800' },
    { id: 'research', label: 'Research', color: 'bg-teal-100 text-teal-800' },
    { id: 'education', label: 'Education', color: 'bg-red-100 text-red-800' },
    { id: 'healthcare', label: 'Healthcare', color: 'bg-pink-100 text-pink-800' },
    { id: 'environment', label: 'Environment', color: 'bg-emerald-100 text-emerald-800' },
    { id: 'community', label: 'Community', color: 'bg-yellow-100 text-yellow-800' }
  ];

  const getRandomTagColor = () => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-purple-100 text-purple-800',
      'bg-indigo-100 text-indigo-800',
      'bg-orange-100 text-orange-800',
      'bg-teal-100 text-teal-800',
      'bg-red-100 text-red-800',
      'bg-pink-100 text-pink-800'
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

  // Upload images to Supabase storage
  const uploadImages = async (imageObjs) => {
    const uploadPromises = imageObjs.map(async (imageObj) => {
      const fileExt = imageObj.file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('post-images')
        .upload(fileName, imageObj.file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('post-images')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    });

    return Promise.all(uploadPromises);
  };

  const handleImageSelect = (event) => {
    const files = Array.from(event.target.files);
    const maxImages = 6;
    
    if (selectedImages.length + files.length > maxImages) {
      alert(`You can only add up to ${maxImages} images per post.`);
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
      setSelectedImages(prev => [...prev, ...imageObjects]);
    }
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

  const handleEmojiSelect = (emoji) => {
    editor.chain().focus().insertContent(emoji).run();
    setShowEmojiPicker(false);
  };

  // Check if we can submit - need content OR images
  const canSubmit = !isLoading && !uploading && (!isEditorContentEmpty || selectedImages.length > 0);

  const handleSubmit = async () => {
    if (!canSubmit || !profile) return;

    const editorTextContent = editor.getText().trim();
    if (!editorTextContent && selectedImages.length === 0) {
      return;
    }

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
        // Regular post data with proper channel
        let finalChannel = channel;
        if (channel !== 'hello-world' && organizationType) {
          finalChannel = getDbChannelFromOrgType(organizationType);
        }
        
        postData = {
          content: editorHtmlContent.trim() || '',
          user_id: user.id,
          profile_id: profile.id,
          image_urls: imageUrls.length > 0 ? imageUrls : null,
          image_url: imageUrls.length === 1 ? imageUrls[0] : null,
          tags: selectedTags.length > 0 ? JSON.stringify(selectedTags) : null,
          channel: finalChannel,
          mentions: mentionsForStorage.length > 0 ? JSON.stringify(mentionsForStorage) : null,
          organization_type: organizationType || profile?.organization_type || null
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

      if (mentionsForStorage.length > 0) {
        const notificationResult = await processMentionsForNotifications(
          newPost.id, 
          editorHtmlContent, 
          profile.id,
          isOrganizationPost
        );
        
        if (notificationResult.success) {
          console.log('✅ Mention notifications created successfully');
        } else {
          console.error('❌ Failed to create mention notifications:', notificationResult.error);
        }
      }

      // Clean up and close modal
      selectedImages.forEach(img => URL.revokeObjectURL(img.preview));
      
      editor.commands.setContent('<p></p>');
      setSelectedImages([]);
      setSelectedTags([]);
      setIsEditorContentEmpty(true);
      setShowEmojiPicker(false);
      setShowTagSelector(false);
      setCustomTagInput('');

      if (onNewPost && typeof onNewPost === 'function') {
        onNewPost(newPost);
      }

      // Close modal
      onClose();

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
  }, []);

  // Handle modal close with cleanup
  const handleClose = () => {
    // Clean up state
    selectedImages.forEach(img => URL.revokeObjectURL(img.preview));
    setSelectedImages([]);
    setSelectedTags([]);
    setShowEmojiPicker(false);
    setShowTagSelector(false);
    setCustomTagInput('');
    setError('');
    if (editor) {
      editor.commands.setContent('<p></p>');
    }
    onClose();
  };

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close emoji picker
      if (showEmojiPicker && !event.target.closest('.emoji-picker-container')) {
        setShowEmojiPicker(false);
      }
      
      // Close tag selector
      if (showTagSelector && tagSelectorRef.current && !tagSelectorRef.current.contains(event.target)) {
        setShowTagSelector(false);
      }
    };

    if (showEmojiPicker || showTagSelector) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker, showTagSelector]);

  if (!isOpen || !editor) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[98vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">
            {isOrganizationPost ? `Post as ${organization?.name}` : 'Create Post'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 max-h-[calc(98vh-120px)] overflow-y-auto">
          <div className="flex items-start space-x-3 mb-4">
            <div className="flex-shrink-0">
              {isOrganizationPost && organization ? (
                <Avatar 
                  src={organization.image_url} 
                  fullName={organization.name} 
                  size="md" 
                />
              ) : (
                <Avatar 
                  src={profile?.avatar_url} 
                  fullName={profile?.full_name} 
                  size="md" 
                />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              {/* TipTap Editor */}
              <div className="relative">
                <div className="w-full p-4 bg-slate-50 rounded-lg border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                  <style>
                    {`
                    .post-modal-editor .ProseMirror {
                      outline: none;
                      border: none;
                      padding: 0;
                      margin: 0;
                      background: transparent;
                      min-height: 180px;
                    }
                    .post-modal-editor .mention {
                      background-color: #e0e7ff;
                      color: #3730a3;
                      padding: 1px 4px;
                      border-radius: 4px;
                      font-weight: 500;
                      text-decoration: none;
                      cursor: pointer;
                    }
                    .post-modal-editor .mention:hover {
                      background-color: #c7d2fe;
                    }
                    .post-modal-editor p {
                      margin: 0;
                      line-height: 1.5;
                    }
                    .post-modal-editor .ProseMirror-focused {
                      outline: none;
                    }
                    .post-modal-editor .is-editor-empty:first-child::before {
                      color: #9ca3af;
                      content: attr(data-placeholder);
                      float: left;
                      height: 0;
                      pointer-events: none;
                    }
                    `}
                  </style>
                  <EditorContent 
                    editor={editor}
                    className="post-modal-editor"
                  />
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                  {error}
                </div>
              )}

              {/* Selected tags */}
              {selectedTags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedTags.map(tag => (
                    <span
                      key={tag.id}
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${tag.color} border`}
                    >
                      {tag.label}
                      <button
                        onClick={() => removeTag(tag.id)}
                        className="ml-1 text-current hover:text-red-600"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Image previews */}
              {selectedImages.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedImages.map((image) => (
                    <div key={image.id} className="relative">
                      <img 
                        src={image.preview} 
                        alt="Selected" 
                        className="w-full h-32 object-cover rounded-lg border border-slate-200" 
                      />
                      <button
                        onClick={() => removeImage(image.id)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {/* Mention button */}
                  <button
                    className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    onClick={() => editor.chain().focus().insertContent('@').run()}
                  >
                    <AtSign size={18} />
                    <span className="text-sm">Mention</span>
                  </button>

                  {/* Photos button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || selectedImages.length >= 6}
                    className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Camera size={18} />
                    <span className="text-sm">Photos</span>
                  </button>

                  {/* Emoji button */}
                  <div className="relative emoji-picker-container">
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Smile size={18} />
                      <span className="text-sm">Emoji</span>
                    </button>
                    
                    {showEmojiPicker && (
                      <div className="absolute top-full mt-2 bg-white border border-slate-200 rounded-lg shadow-lg p-3 z-10">
                        <div className="grid grid-cols-8 gap-1">
                          {emojis.map((emoji, index) => (
                            <button
                              key={index}
                              onClick={() => handleEmojiSelect(emoji)}
                              className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded transition-colors"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tags button */}
                  <div className="relative" ref={tagSelectorRef}>
                    <button
                      onClick={() => setShowTagSelector(!showTagSelector)}
                      className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                        #
                      </div>
                      <span className="text-sm">Tags</span>
                      {selectedTags.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {selectedTags.length}
                        </span>
                      )}
                    </button>

                    {showTagSelector && (
                      <div className="absolute bottom-full mb-2 bg-white border border-slate-200 rounded-lg shadow-lg p-4 z-10 w-96 max-h-80 overflow-y-auto">
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-slate-800 mb-2">Select Tags ({selectedTags.length}/6)</h4>
                          <div className="flex flex-wrap gap-2">
                            {availableTags.map(tag => (
                              <button
                                key={tag.id}
                                onClick={() => handleTagToggle(tag.id)}
                                className={`px-2 py-1 rounded-full text-xs font-medium border transition-colors ${
                                  selectedTags.some(t => t.id === tag.id)
                                    ? tag.color
                                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                                }`}
                              >
                                {tag.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        {selectedTags.length < 6 && (
                          <div>
                            <h4 className="text-sm font-medium text-slate-800 mb-2">Add Custom Tag</h4>
                            <div className="flex space-x-2">
                              <input
                                type="text"
                                value={customTagInput}
                                onChange={(e) => setCustomTagInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && addCustomTag()}
                                placeholder="Tag name"
                                className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                maxLength={20}
                              />
                              <button
                                onClick={addCustomTag}
                                disabled={!customTagInput.trim()}
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Post button */}
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="px-8 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {uploading && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>{isLoading ? 'Posting...' : 'Post'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageSelect}
          className="hidden"
        />
      </div>
    </div>
  );
};

// Main Component
export default function CreatePost({
  profile,
  onNewPost,
  channel = 'hello-world',
  placeholder = null,
  organizationId = null,
  organizationType = null,
  organization = null
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Check if this is an organization post
  const isOrganizationPost = channel === 'organization' && organizationId && organizationType;

  return (
    <>
      {/* Compact Post Box */}
      <CompactPostBox 
        profile={profile}
        organization={organization}
        isOrganizationPost={isOrganizationPost}
        onClick={handleOpenModal}
      />

      {/* Full Post Modal */}
      <PostModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        profile={profile}
        onNewPost={onNewPost}
        channel={channel}
        placeholder={placeholder}
        organizationId={organizationId}
        organizationType={organizationType}
        organization={organization}
      />
    </>
  );
}