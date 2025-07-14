// src/utils/mentionUtils.js
// Utility functions for handling mentions in posts

/**
 * Extract mentions from post text for storage in database
 * @param {string} text - The post text containing mentions
 * @returns {Array} Array of mention objects
 */
export const extractMentionsForStorage = (text) => {
  if (!text) return [];
  
  // Regex to find @mentions in text - matches @[displayName](id:type)
  const mentionRegex = /@\[([^\]]+)\]\(([^:]+):([^)]+)\)/g;
  const mentions = [];
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    const [fullMatch, displayName, id, type] = match;
    mentions.push({
      displayName,
      id,
      type, // 'user' or 'organization'
      fullMatch,
      start: match.index,
      end: match.index + fullMatch.length
    });
  }

  return mentions;
};

/**
 * Parse mentions from stored text for rendering
 * @param {string} text - The post text containing mentions
 * @returns {Array} Array of parsed mentions
 */
export const parseMentions = (text) => {
  if (!text) return [];
  
  const mentionRegex = /@\[([^\]]+)\]\(([^:]+):([^)]+)\)/g;
  const mentions = [];
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    const [fullMatch, displayName, id, type] = match;
    mentions.push({
      fullMatch,
      displayName,
      id,
      type,
      start: match.index,
      end: match.index + fullMatch.length
    });
  }

  return mentions;
};

/**
 * Replace mention syntax with clickable elements for display
 * @param {string} text - The post text containing mentions
 * @returns {Array} Array of text parts and mention objects
 */
export const renderMentionsInText = (text) => {
  if (!text) return [text];
  
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
    
    // Add mention as object
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
  
  return parts.length > 0 ? parts : [text];
};

/**
 * Create a mention string for inserting into post text
 * @param {Object} mention - The mention object from dropdown selection
 * @returns {string} Formatted mention string
 */
export const createMentionString = (mention) => {
  return `@[${mention.name}](${mention.id}:${mention.type})`;
};

/**
 * Clean display text by removing mention syntax
 * @param {string} text - Text with mention syntax
 * @returns {string} Clean text for display
 */
export const cleanMentionSyntax = (text) => {
  if (!text) return '';
  
  // Replace @[displayName](id:type) with just @displayName
  return text.replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1');
};

/**
 * Extract mentioned user IDs for notifications
 * @param {string} text - Post text with mentions
 * @returns {Array} Array of user IDs that were mentioned
 */
export const extractMentionedUserIds = (text) => {
  const mentions = extractMentionsForStorage(text);
  return mentions
    .filter(mention => mention.type === 'user')
    .map(mention => mention.id);
};

/**
 * Extract mentioned organizations for notifications
 * @param {string} text - Post text with mentions
 * @returns {Array} Array of organization objects that were mentioned
 */
export const extractMentionedOrganizations = (text) => {
  const mentions = extractMentionsForStorage(text);
  return mentions
    .filter(mention => mention.type === 'organization')
    .map(mention => {
      const [orgType, orgId] = mention.id.split('-');
      return {
        id: parseInt(orgId),
        type: orgType, // 'nonprofit' or 'funder'
        displayName: mention.displayName
      };
    });
};