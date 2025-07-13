import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { MessageSquare, TrendingUp, Calendar, AlertTriangle } from 'lucide-react';
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

  // Check if user can create posts (super_admin or admin only)
  const canCreatePosts = hasPermission(userRole, PERMISSIONS.MANAGE_MEMBERS, isOmegaAdmin) || 
                         hasPermission(userRole, PERMISSIONS.EDIT_ORGANIZATION, isOmegaAdmin);

  // Fetch organization posts
  const fetchOrganizationPosts = useCallback(async () => {
    if (!organization?.id) return;

    try {
      setLoading(true);
      setError('');

      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_profile_id_fkey(
            id,
            full_name,
            avatar_url,
            role,
            title,
            organization_name
          )
        `)
        .eq('organization_id', organization.id)
        .eq('organization_type', organizationType)
        .eq('channel', 'organization')
        .order('created_at', { ascending: false })
        .limit(20);

      if (postsError) {
        console.error('Error fetching organization posts:', postsError);
        setError('Failed to load organization posts');
        return;
      }

      // Process posts with reactions data
      const postsWithReactions = await Promise.all(
        (postsData || []).map(async (post) => {
          const { data: reactionData } = await supabase
            .from('post_likes')
            .select('reaction_type')
            .eq('post_id', post.id);

          const counts = {};
          reactionData?.forEach(like => {
            if (like.reaction_type) {
              counts[like.reaction_type] = (counts[like.reaction_type] || 0) + 1;
            }
          });

          const reactionSummary = Object.entries(counts).map(([type, count]) => ({ type, count }));

          const { count: likesCount } = await supabase
            .from('post_likes')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);

          const { count: commentsCount } = await supabase
            .from('post_comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);

          return {
            ...post,
            likes_count: likesCount || 0,
            comments_count: commentsCount || 0,
            reactions: { summary: reactionSummary, sample: [] }
          };
        })
      );

      setPosts(postsWithReactions);
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

  // Handle new post creation
  const handleNewPost = useCallback(async (postData) => {
    if (!canCreatePosts || !organization?.id || !profile) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to post.');
        return;
      }

      // Upload images if any
      let imageUrls = [];
      if (postData.image_urls && postData.image_urls.length > 0) {
        // Images are already uploaded by CreatePost, just use them
        imageUrls = postData.image_urls;
      }

      // Create the post with organization data
      const { data: newPost, error: postError } = await supabase
        .from('posts')
        .insert({
          ...postData,
          organization_id: organization.id,
          organization_type: organizationType,
          channel: 'organization',
        })
        .select(`
          *,
          profiles!posts_profile_id_fkey(
            id,
            full_name,
            avatar_url,
            role,
            title,
            organization_name
          )
        `)
        .single();

      if (postError) {
        setError('Failed to create post. Please try again.');
        console.error('Post creation error:', postError);
        return;
      }

      // Add the new post to the beginning of the posts array
      setPosts(prev => [{
        ...newPost,
        likes_count: 0,
        comments_count: 0,
        reactions: { summary: [], sample: [] }
      }, ...prev]);

      return newPost;
    } catch (error) {
      console.error('Error creating organization post:', error);
      setError('Something went wrong. Please try again.');
    }
  }, [canCreatePosts, organization?.id, organizationType, profile]);

  // Handle post deletion
  const handleDeletePost = useCallback(async (postId) => {
    if (!canCreatePosts) return;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('organization_id', organization.id);

      if (error) {
        console.error('Error deleting post:', error);
        setError('Failed to delete post');
        return;
      }

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
      {/* Section Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare className="text-blue-500" />
            Organization Updates
          </h3>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Calendar size={16} />
            <span>{posts.length} update{posts.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center">
            <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0"/>
            <span>{error}</span>
          </div>
        )}

        {/* Create Post Section (only for admins) */}
        {canCreatePosts && (
          <div className="mb-6">
            <CreatePost 
              profile={profile} 
              onNewPost={handleNewPost}
              channel="organization"
              placeholder={`Share an update about ${organization.name}...`}
            />
          </div>
        )}

        {/* No Permission Message */}
        {!canCreatePosts && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              Only organization admins can create posts. Contact your organization admin to share updates.
            </p>
          </div>
        )}
      </div>

      {/* Posts Feed */}
      {posts.length > 0 ? (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard 
              key={post.id} 
              post={post} 
              onDelete={canCreatePosts ? handleDeletePost : null}
              showOrganizationBadge={false} // Don't show org badge since we're already in org context
            />
          ))}
          
          {/* Load More Button */}
          {posts.length >= 20 && (
            <div className="text-center py-6">
              <button 
                onClick={() => {
                  // Implement pagination here if needed
                  console.log('Load more posts...');
                }}
                className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Load More Updates
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center">
          <MessageSquare className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No Updates Yet</h3>
          <p className="text-slate-600 mb-4">
            {canCreatePosts 
              ? `Be the first to share an update about ${organization.name}!`
              : `No updates have been shared by ${organization.name} yet.`
            }
          </p>
          {canCreatePosts && (
            <div className="text-sm text-slate-500">
              Use the post composer above to share news, announcements, or celebrate achievements.
            </div>
          )}
        </div>
      )}
    </div>
  );
}