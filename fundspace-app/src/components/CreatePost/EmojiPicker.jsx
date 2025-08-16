// src/components/CreatePost/EmojiPicker.jsx
import React from 'react';
import { EMOJIS } from './utils/constants';

export default function EmojiPicker({ 
  isOpen, 
  onEmojiSelect, 
  onClose 
}) {
  if (!isOpen) return null;

  return (
    <div className="absolute bottom-full mb-2 bg-white border border-slate-200 rounded-lg shadow-lg p-4 z-10 w-80">
      <div className="grid grid-cols-8 gap-3">
        {EMOJIS.map((emoji, index) => (
          <button
            key={index}
            onClick={() => onEmojiSelect(emoji)}
            className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-lg transition-colors text-lg"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}