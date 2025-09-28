export const extractMentionsForStorage = (text) => {
  if (!text) return [];
  
  const mentionRegex = /@\[([^\]]+)\]\(([^:]+):([^)]+)\)/g;
  const mentions = [];
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    const [fullMatch, displayName, id, type] = match;
    mentions.push({
      displayName,
      id,
      type,
      fullMatch,
      start: match.index,
      end: match.index + fullMatch.length
    });
  }

  return mentions;
};

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

export const renderMentionsInText = (text) => {
  if (!text) return [text];
  
  const mentionRegex = /@\[([^\]]+)\]\(([^:]+):([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    const [fullMatch, displayName, id, type] = match;
    
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    
    parts.push({
      type: 'mention',
      displayName,
      id,
      entityType: type,
      key: `mention-${id}-${match.index}`
    });
    
    lastIndex = match.index + fullMatch.length;
  }
  
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  
  return parts.length > 0 ? parts : [text];
};

export const createMentionString = (mention) => {
  return `@[${mention.name}](${mention.id}:${mention.type})`;
};

export const cleanMentionSyntax = (text) => {
  if (!text) return '';
  
  return text.replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1');
};

export const extractMentionedUserIds = (text) => {
  const mentions = extractMentionsForStorage(text);
  return mentions
    .filter(mention => mention.type === 'user')
    .map(mention => mention.id);
};

export const extractMentionedOrganizations = (text) => {
  const mentions = extractMentionsForStorage(text);
  return mentions
    .filter(mention => mention.type === 'organization')
    .map(mention => {
      const [orgType, orgId] = mention.id.split('-');
      return {
        id: parseInt(orgId),
        type: orgType,
        displayName: mention.displayName
      };
    });
};