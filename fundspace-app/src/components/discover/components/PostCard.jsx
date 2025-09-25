// src/components/discover/components/PostCard.jsx - Enhanced to use pageData while keeping original design
import React from 'react';
import { Users, Heart, MessageSquare } from 'lucide-react';

export default function PostCard({ post, pageData }) {
    // Use pageData for enhanced profile info if available
    const authorProfile = pageData?.profiles?.[post.profiles?.id] || post.profiles;
    const orgMembership = pageData?.orgMemberships?.[post.profiles?.id];
    
    // Enhanced author data with batched info
    const displayAuthor = {
        ...authorProfile,
        organization_name: orgMembership?.organization?.name || authorProfile?.organization_name,
        organization_type: orgMembership?.organization?.type || authorProfile?.organization_type
    };

    // Use batched likes data if available
    const displayLikesCount = pageData?.postLikes?.[post.id]?.likes_count ?? post.likes_count ?? 0;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start space-x-3 mb-3">
                <div className="w-10 h-10 bg-slate-100 rounded-full overflow-hidden">
                    {displayAuthor?.avatar_url ? (
                        <img src={displayAuthor.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <Users className="w-6 h-6 text-slate-400 m-2" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{displayAuthor?.full_name}</p>
                    <p className="text-xs text-slate-500">{displayAuthor?.organization_name}</p>
                </div>
                <span className="text-xs text-slate-500">
                    {new Date(post.created_at).toLocaleDateString()}
                </span>
            </div>
            
            <p className="text-slate-700 text-sm line-clamp-3 mb-3">{post.content}</p>
            
            <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    {displayLikesCount}
                </span>
                <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {post.comments_count || 0}
                </span>
            </div>
        </div>
    );
}