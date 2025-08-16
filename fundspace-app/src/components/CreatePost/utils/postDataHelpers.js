// src/components/CreatePost/utils/postDataHelpers.js
import { ORGANIZATION_CHANNELS, TAG_COLORS } from './constants';

// Helper function to get database channel from organization type
export const getDbChannelFromOrgType = (orgType) => {
  if (!orgType) return 'hello-community';
  const baseType = orgType.split('.')[0].toLowerCase();
  return ORGANIZATION_CHANNELS[baseType] || 'hello-community';
};

// Get random color for custom tags
export const getRandomTagColor = () => {
  return TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
};

// Extract mentions from TipTap JSON for database storage
export const extractMentionsFromEditor = (editorJsonContent) => {
  const mentionsForStorage = [];
  
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
  
  return mentionsForStorage;
};

// Generate placeholder text
export const generatePlaceholder = (isOrganizationPost, organization, profile) => {
  if (isOrganizationPost) {
    return `Share an update for ${organization?.name || 'your organization'}...`;
  }
  return `What's on your mind, ${profile?.full_name?.split(' ')[0] || 'there'}?`;
};