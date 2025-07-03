// src/components/DashboardHomePage.jsx
import React from 'react';
import { useOutletContext } from 'react-router-dom';
import WelcomeHeader from './WelcomeHeader.jsx';
import CreatePost from './CreatePost.jsx';
import PostCard from './PostCard.jsx';

export default function DashboardHomePage() {
  // All state and real-time logic is removed. We get everything from the context.
  const { profile, posts, handleNewPost, handleDeletePost } = useOutletContext();

  // Loading state can be inferred from whether posts exist
  const loading = !posts;

  return (
    <div className="space-y-6">
      <WelcomeHeader profile={profile} />
      <CreatePost profile={profile} onNewPost={handleNewPost} />
      
      {loading && <p className="text-center text-slate-500">Loading feed...</p>}
      
      {!loading && posts.length === 0 && (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
          <h3 className="text-xl font-semibold">Your Feed is Empty</h3>
          <p className="text-slate-500 mt-2">
            Create your first post or follow other members to see their updates here.
          </p>
        </div>
      )}

      {!loading && posts.length > 0 && (
        <div className="space-y-6">
          {posts.map(post => (
            <PostCard key={`post-${post.id}`} post={post} onDelete={handleDeletePost} />
          ))}
        </div>
      )}
    </div>
  );
}