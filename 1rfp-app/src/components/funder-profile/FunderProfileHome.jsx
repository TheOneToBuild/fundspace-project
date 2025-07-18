// src/components/funder-profile/FunderProfileHome.jsx

import React, { useState } from 'react';
import { MessageSquare } from '../Icons.jsx';
import OrganizationPostCard from '../OrganizationPostCard.jsx';
import OrganizationPostDetailModal from '../OrganizationPostDetailModal.jsx';

export default function FunderProfileHome({ posts, onDelete, funder, currentUserId, currentUserProfile }) {
  const [selectedPost, setSelectedPost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenDetail = (post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedPost(null);
    setIsModalOpen(false);
  };

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
              <OrganizationPostCard 
                key={post.id} 
                post={post} 
                organization={funder}
                onDelete={onDelete}
                canEdit={false} // Public users cannot edit organization posts
                currentUserId={currentUserId}
                currentUserProfile={currentUserProfile}
                onOpenDetail={handleOpenDetail}
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

      {/* Detail Modal */}
      {isModalOpen && selectedPost && (
        <OrganizationPostDetailModal
          post={selectedPost}
          organization={funder}
          onClose={handleCloseModal}
          currentUserId={currentUserId}
          canEdit={false} // Public users cannot edit
        />
      )}
    </div>
  );
}