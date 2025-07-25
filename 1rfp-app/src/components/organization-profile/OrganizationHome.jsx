// src/components/organization-profile/OrganizationHome.jsx
// Extract shared social feed logic from FunderProfileHome and NonprofitProfilePage

import React, { useState } from 'react';
import { MessageSquare, Plus } from 'lucide-react';
import OrganizationPostCard from '../OrganizationPostCard.jsx';
import OrganizationPostDetailModal from '../OrganizationPostDetailModal.jsx';
import CreatePost from '../CreatePost.jsx';
import { hasPermission, PERMISSIONS } from '../../utils/organizationPermissions.js';

const OrganizationHome = ({ 
  organization, 
  organizationPosts, 
  session, 
  onPostDelete,
  userMembership // Pass user's membership info if they're a member
}) => {
  const [selectedPost, setSelectedPost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check if user can create posts (must be a member with edit permissions)
  const canCreatePosts = userMembership && hasPermission(
    userMembership.role, 
    PERMISSIONS.EDIT_ORGANIZATION, 
    session?.user?.is_omega_admin
  );

  // Check if user can edit/delete posts
  const canEditPosts = canCreatePosts;

  const handleOpenDetail = (post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const handleCloseDetail = () => {
    setSelectedPost(null);
    setIsModalOpen(false);
  };

  const handleNewPost = (newPost) => {
    // This would be handled by parent component's state management
    console.log('New post created:', newPost);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Create Post Section - Only show if user can post */}
      {canCreatePosts && (
        <CreatePost 
          profile={session?.user} 
          onNewPost={handleNewPost}
          channel="organization"
          placeholder={`Share an update for ${organization.name}...`}
          organizationId={organization.id}
          organizationType={organization.type}
          organization={organization}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"
        />
      )}

      {/* Posts Feed */}
      {organizationPosts && organizationPosts.length > 0 ? (
        <div className="space-y-6">
          {organizationPosts.map((post) => (
            <OrganizationPostCard 
              key={post.id} 
              post={post} 
              organization={organization}
              onDelete={canEditPosts ? onPostDelete : null}
              canEdit={canEditPosts}
              currentUserId={session?.user?.id}
              onOpenDetail={handleOpenDetail}
              currentUserProfile={session?.user}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center">
          <MessageSquare className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No Updates Yet</h3>
          <p className="text-slate-600">
            {canCreatePosts 
              ? `Be the first to share an update for ${organization.name}!`
              : `No updates have been shared by ${organization.name} yet.`
            }
          </p>
          {canCreatePosts && (
            <button className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus size={16} className="mr-2" />
              Create First Post
            </button>
          )}
        </div>
      )}

      {/* Post Detail Modal */}
      {isModalOpen && (
        <OrganizationPostDetailModal
          post={selectedPost}
          organization={organization}
          onClose={handleCloseDetail}
          currentUserId={session?.user?.id}
          canEdit={canEditPosts}
        />
      )}
    </div>
  );
};

export default OrganizationHome;