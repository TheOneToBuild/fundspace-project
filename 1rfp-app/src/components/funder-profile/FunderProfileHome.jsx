// src/components/funder-profile/FunderProfileHome.jsx

import React from 'react';
import PostCard from '../PostCard.jsx';
import { MessageSquare } from '../Icons.jsx';

// MODIFIED: Accept 'funder' as a prop
export default function FunderProfileHome({ posts, onDelete, funder }) {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare className="text-blue-500" />
            Latest Updates
        </h3>

        {posts && posts.length > 0 ? (
            <div className="space-y-6">
                {posts.map(post => (
                    <PostCard 
                        key={post.id} 
                        post={post} 
                        onDelete={onDelete}
                        // MODIFIED: Add these two new props
                        showOrganizationAsAuthor={true}
                        organization={funder}
                    />
                ))}
            </div>
        ) : (
            <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200">
              <MessageSquare className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Updates Yet</h3>
              <p className="text-slate-600">This funder hasn't shared any updates yet. Check back soon!</p>
            </div>
        )}
      </div>
    </div>
  );
}