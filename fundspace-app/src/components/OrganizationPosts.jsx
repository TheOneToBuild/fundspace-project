// src/components/OrganizationPosts.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { MessageSquare, AlertTriangle } from 'lucide-react';
import CreatePost from './CreatePost.jsx';
import OrganizationPostCard from './OrganizationPostCard.jsx';
import OrganizationPostDetailModal from './OrganizationPostDetailModal.jsx';
import { hasPermission, PERMISSIONS } from '../utils/permissions.js';

export default function OrganizationPosts({ 
  organization, 
  organizationType, 
  userRole, 
  isOmegaAdmin, 
  profile,
  className = '' // Added to allow custom styling from parent
}) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Only super_admins and omega_admins can create/edit/delete posts
  // Regular admins and members can only view and interact
  const canCreatePosts = hasPermission(userRole, PERMISSIONS.EDIT_ORGANIZATION, isOmegaAdmin);
  const canEditPosts = hasPermission(userRole, PERMISSIONS.EDIT_ORGANIZATION, isOmegaAdmin);
  const canInteractWithPosts = hasPermission(userRole, PERMISSIONS.VIEW_ORGANIZATION, isOmegaAdmin);

  const fetchOrganizationPosts = useCallback(async () => {
    if (!organization?.id) return;
    
    try {
      setLoading(true);
      setError('');
      
      const { data: postsData, error: postsError } = await supabase
        .from('organization_posts')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('organization_type', organizationType)
        .order('created_at', { ascending: false })
        .limit(20);

      if (postsError) throw postsError;
      setPosts(postsData || []);
    } catch (err) {
      console.error('Error fetching organization posts:', err);
      setError('Failed to load organization posts');
    } finally {
      setLoading(false);
    }
  }, [organization?.id, organizationType]);

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
        setPosts(currentPosts => [payload.new, ...currentPosts]);
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'organization_posts',
        filter: `organization_id=eq.${organization.id}`
      }, (payload) => {
        setPosts(currentPosts => currentPosts.map(p => 
          p.id === payload.new.id ? { ...p, ...payload.new } : p
        ));
      })
      .on('postgres_changes', { 
        event: 'DELETE', 
        schema: 'public', 
        table: 'organization_posts',
        filter: `organization_id=eq.${organization.id}`
      }, (payload) => {
        setPosts(currentPosts => currentPosts.filter(p => p.id !== payload.old.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organization?.id]);

  const handleNewPost = useCallback((newPostData) => {
    // For organization posts, we don't need to attach profile info
    // since the post belongs to the organization
    const postWithMetadata = { 
      ...newPostData, 
      likes_count: 0,
      comments_count: 0,
    };
    setPosts(prev => [postWithMetadata, ...prev]);
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
      
      setPosts(prev => prev.filter(post => post.id !== postId));
    } catch (err) {
      console.error('Error deleting post:', err);
      setError('Failed to delete post');
    }
  }, [canEditPosts, organization?.id]);

  const handleOpenDetail = useCallback((post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedPost(null);
    setIsModalOpen(false);
  }, []);

  if (loading) {
    return (
      <div className={`p-6 rounded-xl shadow-sm border border-slate-200 ${className}`}>
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
    <div className={`space-y-6 ${className}`}>
      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center">
          <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0"/>
          <span>{error}</span>
        </div>
      )}

      {canCreatePosts && (
        <CreatePost 
          profile={profile} 
          onNewPost={handleNewPost}
          channel="organization"
          placeholder={`Share an update for ${organization.name}...`}
          organizationId={organization.id}
          organizationType={organizationType}
          organization={organization}
          className="p-6 rounded-xl shadow-sm border border-slate-200" // Match OrganizationPostCard styling
        />
      )}

      {canInteractWithPosts && posts.length > 0 ? (
        <div className="space-y-6">
          {posts.map((post) => (
            <OrganizationPostCard 
              key={post.id} 
              post={post} 
              organization={organization}
              onDelete={canEditPosts ? handleDeletePost : null}
              canEdit={canEditPosts}
              currentUserId={profile?.id}
              onOpenDetail={handleOpenDetail}
              currentUserProfile={profile}
            />
          ))}
        </div>
      ) : canInteractWithPosts ? (
        <div className="p-12 rounded-xl shadow-sm border border-slate-200 text-center">
          <MessageSquare className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No Updates Yet</h3>
          <p className="text-slate-600">
            {canCreatePosts 
              ? `Be the first to share an update for ${organization.name}!`
              : `No updates have been shared by ${organization.name} yet.`
            }
          </p>
        </div>
      ) : (
        <div className="p-12 rounded-xl shadow-sm border border-slate-200 text-center">
          <MessageSquare className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Access Restricted</h3>
          <p className="text-slate-600">
            You don't have permission to view organization updates.
          </p>
        </div>
      )}

      {/* Organization Post Detail Modal */}
      <OrganizationPostDetailModal
        post={selectedPost}
        organization={organization}
        isOpen={isModalOpen}
        onClose={handleCloseDetail}
        currentUserId={profile?.id}
      />
    </div>
  );
}