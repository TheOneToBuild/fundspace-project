// src/components/OrganizationPosts.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { MessageSquare, AlertTriangle } from 'lucide-react';
import CreatePost from './CreatePost.jsx';
import PostCard from './PostCard.jsx';
import { hasPermission, PERMISSIONS } from '../utils/permissions.js';

export default function OrganizationPosts({ 
  organization, 
  organizationType, 
  userRole, 
  isOmegaAdmin, 
  profile 
}) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const canCreatePosts = hasPermission(userRole, PERMISSIONS.MANAGE_MEMBERS, isOmegaAdmin) || 
                         hasPermission(userRole, PERMISSIONS.EDIT_ORGANIZATION, isOmegaAdmin);

  const fetchOrganizationPosts = useCallback(async () => {
    if (!organization?.id) return;
    try {
      setLoading(true);
      setError('');
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`*, profiles!posts_profile_id_fkey(*)`)
        .eq('organization_id', organization.id)
        .eq('organization_type', organizationType)
        .eq('channel', 'organization')
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

  const handleNewPost = useCallback((newPostData) => {
    const postWithProfile = { 
        ...newPostData, 
        profiles: profile,
        likes_count: 0,
        comments_count: 0,
        reactions: { summary: [], sample: [] }
    };
    setPosts(prev => [postWithProfile, ...prev]);
  }, [profile]);


  const handleDeletePost = useCallback(async (postId) => {
    if (!canCreatePosts) return;
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('organization_id', organization.id);
      if (error) throw error;
      setPosts(prev => prev.filter(post => post.id !== postId));
    } catch (err) {
      console.error('Error deleting post:', err);
      setError('Failed to delete post');
    }
  }, [canCreatePosts, organization?.id]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
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
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare className="text-blue-500" />
            Organization Updates
          </h3>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center">
            <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0"/>
            <span>{error}</span>
          </div>
        )}

        {canCreatePosts && (
          <div className="mb-6">
            <CreatePost 
              profile={profile} 
              onNewPost={handleNewPost}
              channel="organization"
              placeholder={`Share an update for ${organization.name}...`}
              // MODIFIED: Pass the organization details down to CreatePost
              organizationId={organization.id}
              organizationType={organizationType}
            />
          </div>
        )}

        {!canCreatePosts && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              Only organization admins can create posts. Contact your organization admin to share updates.
            </p>
          </div>
        )}
      </div>

      {posts.length > 0 ? (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard 
              key={post.id} 
              post={post} 
              onDelete={canCreatePosts ? handleDeletePost : null}
              showOrganizationAsAuthor={true}
              organization={organization}
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
        </div>
      )}
    </div>
  );
}