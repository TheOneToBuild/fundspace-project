// src/components/CreatePost.jsx - Refactored Main Component
import React, { useState } from 'react';
import CompactPostBox from './CreatePost/CompactPostBox';
import CreatePostModal from './CreatePost/CreatePostModal';

export default function CreatePost({
  profile,
  onNewPost,
  channel = 'hello-world',
  placeholder = null,
  organizationId = null,
  organizationType = null,
  organization = null
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Check if this is an organization post
  const isOrganizationPost = channel === 'organization' && organizationId && organizationType;

  return (
    <>
      {/* Compact Post Box */}
      <CompactPostBox 
        profile={profile}
        organization={organization}
        isOrganizationPost={isOrganizationPost}
        onClick={handleOpenModal}
      />

      {/* Full Post Modal */}
      <CreatePostModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        profile={profile}
        onNewPost={onNewPost}
        channel={channel}
        placeholder={placeholder}
        organizationId={organizationId}
        organizationType={organizationType}
        organization={organization}
      />
    </>
  );
}