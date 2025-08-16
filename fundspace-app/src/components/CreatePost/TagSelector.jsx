// src/components/CreatePost/TagSelector.jsx
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { AVAILABLE_TAGS } from './utils/constants';
import { getRandomTagColor } from './utils/postDataHelpers';

export default function TagSelector({ 
  selectedTags, 
  onTagToggle, 
  onRemoveTag, 
  isOpen, 
  onClose 
}) {
  const [customTagInput, setCustomTagInput] = useState('');

  const handleTagToggle = (tagId) => {
    if (selectedTags.length >= 6 && !selectedTags.some(tag => tag.id === tagId)) {
      return;
    }
    
    const existingTag = selectedTags.find(tag => tag.id === tagId);
    if (existingTag) {
      onRemoveTag(tagId);
    } else {
      const availableTag = AVAILABLE_TAGS.find(tag => tag.id === tagId);
      if (availableTag) {
        onTagToggle(tagId, availableTag);
      }
    }
  };

  const addCustomTag = () => {
    if (!customTagInput.trim() || selectedTags.length >= 6) return;
    
    const customTag = {
      id: `custom-${Date.now()}`,
      label: customTagInput.trim(),
      color: getRandomTagColor(),
      isCustom: true
    };
    
    onTagToggle(customTag.id, customTag);
    setCustomTagInput('');
  };

  return (
    <>
      {/* Show selected tags */}
      {selectedTags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {selectedTags.map(tag => (
            <span
              key={tag.id}
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${tag.color} border`}
            >
              {tag.label}
              <button
                onClick={() => onRemoveTag(tag.id)}
                className="ml-1 text-current hover:text-red-600"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Show tag selector dropdown */}
      {isOpen && (
        <div className="absolute bottom-full mb-2 bg-white border border-slate-200 rounded-lg shadow-lg p-4 z-10 w-96 max-h-80 overflow-y-auto">
          <div className="mb-3">
            <h4 className="text-sm font-medium text-slate-800 mb-2">
              Select Tags ({selectedTags.length}/6)
            </h4>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map(tag => (
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
    </>
  );
}