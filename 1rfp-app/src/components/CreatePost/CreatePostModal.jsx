// src/components/CreatePost/CreatePostModal.jsx
import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import Avatar from '../Avatar';
import PostEditor from './PostEditor';
import CreatePostActions from './CreatePostActions';
import ImageUpload from './ImageUpload';
import TagSelector from './TagSelector';
import { usePostEditor } from './hooks/usePostEditor';
import { useImageUpload } from './hooks/useImageUpload';
import { usePostSubmission } from './hooks/usePostSubmission';
import { generatePlaceholder } from './utils/postDataHelpers';
import { AVAILABLE_TAGS } from './utils/constants';
import { getRandomTagColor } from './utils/postDataHelpers';

export default function CreatePostModal({ 
  isOpen, 
  onClose, 
  profile, 
  onNewPost, 
  channel, 
  placeholder, 
  organizationId, 
  organizationType, 
  organization 
}) {
  // State management
  const [isEditorContentEmpty, setIsEditorContentEmpty] = useState(true);
  const [selectedTags, setSelectedTags] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTagSelector, setShowTagSelector] = useState(false);

  // Refs
  const fileInputRef = useRef(null);

  // Custom hooks
  const {
    selectedImages,
    uploading,
    addImages,
    removeImage,
    uploadImages,  
    clearImages
  } = useImageUpload();

  const { isLoading, error, submitPost, setError } = usePostSubmission();

  // Check if this is an organization post
  const isOrganizationPost = channel === 'organization' && organizationId && organizationType;

  // Generate the placeholder text
  const placeholderText = placeholder || generatePlaceholder(isOrganizationPost, organization, profile);

  // Initialize editor
  const editor = usePostEditor(placeholderText, profile, setIsEditorContentEmpty);

  // Tag management
  const handleTagToggle = (tagId, customTag = null) => {
    if (selectedTags.length >= 6 && !selectedTags.some(tag => tag.id === tagId)) {
      return;
    }
    
    setSelectedTags(prev => {
      const existingTag = prev.find(tag => tag.id === tagId);
      if (existingTag) {
        return prev.filter(tag => tag.id !== tagId);
      } else {
        const tagToAdd = customTag || AVAILABLE_TAGS.find(tag => tag.id === tagId);
        return [...prev, tagToAdd];
      }
    });
  };

  const removeTag = (tagId) => {
    setSelectedTags(prev => prev.filter(tag => tag.id !== tagId));
  };

  // Emoji handling
  const handleEmojiSelect = (emoji) => {
    editor?.chain().focus().insertContent(emoji).run();
    setShowEmojiPicker(false);
  };

  // Check if we can submit - need content OR images
  const canSubmit = !isLoading && !uploading && (!isEditorContentEmpty || selectedImages.length > 0);

  // Handle form submission
  const handleSubmit = async () => {
    if (!canSubmit || !profile || !editor) return;

    const editorTextContent = editor.getText().trim();
    if (!editorTextContent && selectedImages.length === 0) {
      return;
    }

    try {
      // Upload images first
      const imageUrls = await uploadImages();

      // Submit post
      await submitPost({
        editor,
        profile,
        selectedTags,
        imageUrls,
        channel,
        organizationId,
        organizationType,
        isOrganizationPost,
        onSuccess: (newPost) => {
          // Clean up and close modal
          clearImages();
          editor.commands.setContent('<p></p>');
          setSelectedTags([]);
          setIsEditorContentEmpty(true);
          setShowEmojiPicker(false);
          setShowTagSelector(false);

          if (onNewPost && typeof onNewPost === 'function') {
            onNewPost(newPost);
          }

          // Close modal
          onClose();
        }
      });
    } catch (error) {
      console.error('Error in handleSubmit:', error);
    }
  };

  // Handle modal close with cleanup
  const handleClose = () => {
    // Clean up state
    clearImages();
    setSelectedTags([]);
    setShowEmojiPicker(false);
    setShowTagSelector(false);
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
      if (showTagSelector && !event.target.closest('.tag-selector-container')) {
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
              {/* Post Editor */}
              <PostEditor
                placeholderText={placeholderText}
                profile={profile}
                onUpdate={setIsEditorContentEmpty}
                editor={editor}
              />

              {/* Error message */}
              {error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                  {error}
                </div>
              )}

              {/* Selected tags */}
              <TagSelector
                selectedTags={selectedTags}
                onTagToggle={handleTagToggle}
                onRemoveTag={removeTag}
                isOpen={false} // Always show selected tags
              />

              {/* Image previews */}
              <ImageUpload
                selectedImages={selectedImages}
                onImageSelect={addImages}
                onRemoveImage={removeImage}
                fileInputRef={fileInputRef}
                uploading={uploading}
              />

              {/* Action buttons */}
              <CreatePostActions
                editor={editor}
                fileInputRef={fileInputRef}
                uploading={uploading}
                selectedImages={selectedImages}
                selectedTags={selectedTags}
                onTagToggle={handleTagToggle}
                onRemoveTag={removeTag}
                showEmojiPicker={showEmojiPicker}
                setShowEmojiPicker={setShowEmojiPicker}
                showTagSelector={showTagSelector}
                setShowTagSelector={setShowTagSelector}
                onEmojiSelect={handleEmojiSelect}
                canSubmit={canSubmit}
                isLoading={isLoading}
                onSubmit={handleSubmit}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}