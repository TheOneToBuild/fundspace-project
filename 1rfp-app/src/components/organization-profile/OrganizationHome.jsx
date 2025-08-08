// src/components/organization-profile/OrganizationHome.jsx - Updated from latest version (Photos Removed)
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
  userMembership,
  photos = [], // Keep for compatibility but don't display
  activeTab,
  setActiveTab
}) => {
  const [selectedPost, setSelectedPost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check permissions
  const canCreatePosts = userMembership && hasPermission(
    userMembership.role, 
    PERMISSIONS.EDIT_ORGANIZATION, 
    session?.user?.is_omega_admin
  );
  const canEditPosts = canCreatePosts;

  // Event handlers
  const handleOpenDetail = (post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const handleCloseDetail = () => {
    setSelectedPost(null);
    setIsModalOpen(false);
  };

  const handleNewPost = (newPost) => {
    console.log('New post created:', newPost);
  };

  const FocusAreaPill = ({ area }) => {
    const gradients = [
      'from-amber-100 to-orange-100 text-amber-700 border-orange-200', 
      'from-emerald-100 to-teal-100 text-emerald-700 border-teal-200', 
      'from-rose-100 to-pink-100 text-rose-700 border-rose-200', 
      'from-blue-100 to-indigo-100 text-blue-700 border-indigo-200'
    ];
    const gradient = gradients[area.length % gradients.length];
    return (
      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border bg-gradient-to-r ${gradient}`}>
        {area}
      </span>
    );
  };

  return (
    <div className="space-y-10">
      {/* Mission Section */}
      <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm grid md:grid-cols-2 gap-10 items-center">
        <div className="flex flex-col h-full">
          <h2 className="text-3xl font-black text-slate-900 mb-4">Our Mission ✨</h2>
          <p className="text-slate-700 leading-relaxed text-lg flex-grow">
            {organization.description || "Working to create positive impact in our community through strategic partnerships and innovative solutions."}
          </p>
          
          {/* Focus Areas */}
          {organization.focusAreas && organization.focusAreas.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-200">
              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Focus Areas</h4>
              <div className="flex flex-wrap gap-3">
                {organization.focusAreas.map((area) => (
                  <FocusAreaPill key={area} area={area} />
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Mission Image */}
        <img 
          src={organization.mission_image_url || 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&h=600&fit=crop'} 
          alt="Our Mission" 
          className="rounded-2xl object-cover w-full h-full max-h-[450px]" 
        />
      </div>

      {/* Photo Gallery section removed - Photos now only shown in dedicated Photos tab */}

      {/* Create Post Section */}
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
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">Recent Posts</h3>
            {organizationPosts.length > 3 && (
              <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                View All Posts
              </button>
            )}
          </div>
          
          <div className="space-y-6">
            {organizationPosts.slice(0, 3).map((post) => (
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