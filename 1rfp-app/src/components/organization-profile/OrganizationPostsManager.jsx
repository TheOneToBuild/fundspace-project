// src/components/organization-profile/OrganizationPostsManager.jsx - Dedicated component for organization posts
import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Plus, AlertTriangle, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient.js';
import OrganizationPostCard from '../OrganizationPostCard.jsx';
import OrganizationPostDetailModal from '../OrganizationPostDetailModal.jsx';
import CreatePost from '../CreatePost.jsx';
import { hasPermission, PERMISSIONS } from '../../utils/organizationPermissions.js';

const OrganizationPostsManager = ({ 
  organization, 
  session, 
  userMembership,
  currentUserProfile
}) => {
  const navigate = useNavigate();
  const [selectedPost, setSelectedPost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [organizationPosts, setOrganizationPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [newComment, setNewComment] = useState('');

  // Check if user can create posts (must be a member with edit permissions)
  const canCreatePosts = userMembership && hasPermission(
    userMembership.role, 
    PERMISSIONS.EDIT_ORGANIZATION, 
    session?.user?.is_omega_admin
  );

  // Check if user can edit/delete posts
  const canEditPosts = canCreatePosts;

  // Navigate to user profile
  const handleUserClick = (profileId) => {
    if (profileId) {
      navigate(`/profile/members/${profileId}`);
    }
  };

  // Fetch current user's profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!session?.user?.id) return;
      
      if (currentUserProfile) {
        setUserProfile(currentUserProfile);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', session.user.id)
          .maybeSingle();

        if (data && !error) {
          setUserProfile({
            ...data,
            avatar_url: data.avatar_url || session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
          });
        } else {
          setUserProfile({
            id: session.user.id,
            full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
            avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
          });
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    };

    fetchUserProfile();
  }, [session?.user?.id, currentUserProfile]);

  // Fetch organization posts
  const fetchOrganizationPosts = useCallback(async () => {
    if (!organization?.id) return;

    try {
      setLoading(true);
      setError('');
      
      const { data: postsData, error: postsError } = await supabase
        .from('organization_posts')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('organization_type', organization.type)
        .order('created_at', { ascending: false })
        .limit(20);

      if (postsError) throw postsError;
      setOrganizationPosts(postsData || []);
    } catch (err) {
      console.error('Error fetching organization posts:', err);
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [organization?.id, organization?.type]);

  useEffect(() => {
    fetchOrganizationPosts();
  }, [fetchOrganizationPosts]);

  // Set up real-time subscriptions for organization posts
  useEffect(() => {
    if (!organization?.id) return;

    const channel = supabase.channel(`organization_posts:${organization.id}`);
    
    channel
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'organization_posts',
        filter: `organization_id=eq.${organization.id}`
      }, (payload) => {
        setOrganizationPosts(currentPosts => [payload.new, ...currentPosts]);
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'organization_posts',
        filter: `organization_id=eq.${organization.id}`
      }, (payload) => {
        setOrganizationPosts(currentPosts => currentPosts.map(p => 
          p.id === payload.new.id ? { ...p, ...payload.new } : p
        ));
      })
      .on('postgres_changes', { 
        event: 'DELETE', 
        schema: 'public', 
        table: 'organization_posts',
        filter: `organization_id=eq.${organization.id}`
      }, (payload) => {
        setOrganizationPosts(currentPosts => currentPosts.filter(p => p.id !== payload.old.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organization?.id]);

  const handleOpenDetail = (post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const handleCloseDetail = () => {
    setSelectedPost(null);
    setIsModalOpen(false);
  };

  const handleNewPost = useCallback((newPostData) => {
    // Add the new post to the top of the list with initial counts
    const postWithMetadata = { 
      ...newPostData, 
      likes_count: 0,
      comments_count: 0,
    };
    setOrganizationPosts(prev => [postWithMetadata, ...prev]);
  }, []);

  const handleDeletePost = useCallback(async (postId) => {
    if (!canEditPosts) return;
    
    try {
      const { error } = await supabase
        .from('organization_posts')
        .delete()
        .eq('id', postId)
        .eq('organization_id', organization.id);
        
      if (error) throw error;
      
      setOrganizationPosts(prev => prev.filter(post => post.id !== postId));
    } catch (err) {
      console.error('Error deleting post:', err);
      setError('Failed to delete post');
    }
  }, [canEditPosts, organization?.id]);

  const handleCreateFirstPost = () => {
    // Trigger the CreatePost modal by focusing on it
    const createPostElement = document.querySelector('[data-create-post]');
    if (createPostElement) {
      createPostElement.click();
    }
  };

  // Handle adding comments (placeholder - this should integrate with your existing comment system)
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !session?.user) return;

    try {
      // This would integrate with your existing comment system
      // For now, just clear the form
      setNewComment('');
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-4 bg-slate-200 rounded"></div>
            <div className="h-4 bg-slate-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center">
          <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0"/>
          <span>{error}</span>
        </div>
      )}

      {/* Create Post Section - Only show if user can create posts */}
      {canCreatePosts && (
        <div data-create-post>
          <CreatePost 
            profile={currentUserProfile} 
            onNewPost={handleNewPost}
            channel="organization"
            placeholder={`Share an update for ${organization.name}...`}
            organizationId={organization.id}
            organizationType={organization.type}
            organization={organization}
          />
        </div>
      )}

      {/* Posts Feed */}
      {organizationPosts.length > 0 ? (
        <div className="space-y-6">
          {organizationPosts.map((post) => (
            <OrganizationPostCard 
              key={post.id} 
              post={post} 
              organization={organization}
              onDelete={canEditPosts ? handleDeletePost : null}
              canEdit={canEditPosts}
              currentUserId={session?.user?.id}
              onOpenDetail={handleOpenDetail}
              currentUserProfile={currentUserProfile}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center">
          <MessageSquare className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No Updates Yet</h3>
          <p className="text-slate-600 mb-6">
            {canCreatePosts 
              ? `Be the first to share an update for ${organization.name}!`
              : `No updates have been shared by ${organization.name} yet.`
            }
          </p>
          {canCreatePosts && (
            <button 
              onClick={handleCreateFirstPost}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
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

export default OrganizationPostsManager;