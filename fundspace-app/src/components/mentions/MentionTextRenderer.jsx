// src/components/mentions/MentionTextRenderer.jsx
import React from 'react';

// Utility functions (you can also put these in a separate utils file)
const parseMentions = (text) => {
  // Regex to find @mentions in text - matches @[displayName](id:type)
  const mentionRegex = /@\[([^\]]+)\]\(([^:]+):([^)]+)\)/g;
  const mentions = [];
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    const [fullMatch, displayName, id, type] = match;
    mentions.push({
      fullMatch,
      displayName,
      id,
      type, // 'user' or 'organization'
      start: match.index,
      end: match.index + fullMatch.length
    });
  }

  return mentions;
};

const renderMentionsInText = (text) => {
  if (!text) return text;
  
  const mentionRegex = /@\[([^\]]+)\]\(([^:]+):([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    const [fullMatch, displayName, id, type] = match;
    
    // Add text before mention
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    
    // Add mention as clickable element
    parts.push({
      type: 'mention',
      displayName,
      id,
      entityType: type,
      key: `mention-${id}-${match.index}`
    });
    
    lastIndex = match.index + fullMatch.length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  
  return parts;
};

export default function MentionTextRenderer({ text, onMentionClick }) {
  const parts = renderMentionsInText(text);
  
  if (typeof parts === 'string') {
    return <span>{parts}</span>;
  }
  
  return (
    <span>
      {parts.map((part, index) => {
        if (typeof part === 'string') {
          return <span key={index}>{part}</span>;
        } else if (part.type === 'mention') {
          return (
            <span
              key={part.key}
              className="inline-flex items-center px-1 py-0.5 rounded text-blue-600 bg-blue-50 hover:bg-blue-100 cursor-pointer font-medium"
              onClick={() => onMentionClick && onMentionClick(part)}
            >
              @{part.displayName}
            </span>
          );
        }
        return null;
      })}
    </span>
  );
}