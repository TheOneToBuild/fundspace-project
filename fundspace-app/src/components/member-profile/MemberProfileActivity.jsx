// components/member-profile/MemberProfileActivity.jsx - Updated with transparent background
import React from 'react';
import PostCard from '../PostCard';

const MemberProfileActivity = ({ member, posts, loading }) => {
    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-8 py-8">
                <div className="animate-pulse space-y-6">
                    <div className="space-y-4">
                        <div className="h-32 bg-slate-200 rounded"></div>
                        <div className="h-32 bg-slate-200 rounded"></div>
                        <div className="h-32 bg-slate-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-8 py-8">
            {posts && posts.length > 0 ? (
                <div className="space-y-6">
                    {posts.map(post => (
                        <PostCard key={post.id} post={post} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <span className="text-2xl">📝</span>
                    </div>
                    <h4 className="text-lg font-medium text-slate-600 mb-2">No Activity Yet</h4>
                    <p className="text-slate-500">
                        {member?.full_name?.split(' ')[0]} hasn't posted anything yet. Check back later for updates!
                    </p>
                </div>
            )}
        </div>
    );
};

export default MemberProfileActivity;