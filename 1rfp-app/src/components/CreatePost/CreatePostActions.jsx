// src/components/CreatePost/CreatePostActions.jsx
import React, { useRef } from 'react';
import { Camera, Smile, AtSign } from 'lucide-react';
import EmojiPicker from './EmojiPicker';
import TagSelector from './TagSelector';

export default function CreatePostActions({
  editor,
  fileInputRef,
  uploading,
  selectedImages,
  selectedTags,
  onTagToggle,
  onRemoveTag,
  showEmojiPicker,
  setShowEmojiPicker,
  showTagSelector,
  setShowTagSelector,
  onEmojiSelect,
  canSubmit,
  isLoading,
  onSubmit
}) {
  const tagSelectorRef = useRef(null);

  return (
    <div className="mt-4 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        {/* Mention button */}
        <button
          className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          onClick={() => editor?.chain().focus().insertContent('@').run()}
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
          
          <EmojiPicker
            isOpen={showEmojiPicker}
            onEmojiSelect={onEmojiSelect}
            onClose={() => setShowEmojiPicker(false)}
          />
        </div>

        {/* Tags button */}
        <div className="relative tag-selector-container" ref={tagSelectorRef}>
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

          <TagSelector
            selectedTags={selectedTags}
            onTagToggle={onTagToggle}
            onRemoveTag={onRemoveTag}
            isOpen={showTagSelector}
            onClose={() => setShowTagSelector(false)}
          />
        </div>
      </div>

      {/* Post button - moved to same line */}
      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        className="px-8 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
      >
        {uploading && (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        )}
        <span>{isLoading ? 'Posting...' : 'Post'}</span>
      </button>
    </div>
  );
}