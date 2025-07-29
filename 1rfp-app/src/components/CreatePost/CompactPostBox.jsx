// src/components/CreatePost/CompactPostBox.jsx
import React from 'react';
import Avatar from '../Avatar';
import { generatePlaceholder } from './utils/postDataHelpers';

export default function CompactPostBox({ 
  profile, 
  organization, 
  isOrganizationPost, 
  onClick 
}) {
  const placeholderText = generatePlaceholder(isOrganizationPost, organization, profile);

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
            {placeholderText}
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
}