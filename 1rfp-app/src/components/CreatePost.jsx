import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Camera, Video, Smile } from 'lucide-react';
import Avatar from './Avatar.jsx'; // Import the new Avatar component

export default function CreatePost({ profile, onNewPost }) {
    const [postText, setPostText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // The getInitials function can now be removed from this file.

    const handlePostSubmit = async () => {
        if (!postText.trim() || !profile) return;

        setIsLoading(true);
        setError('');

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            setError('You must be logged in to post.');
            setIsLoading(false);
            return;
        }

        const { data: newPost, error: postError } = await supabase
            .from('posts')
            .insert({
                content: postText.trim(),
                user_id: user.id,
                profile_id: profile.id
            })
            .select()
            .single();

        if (postError) {
            setError('Failed to create post. Please try again.');
            console.error('Error creating post:', postError);
        } else {
            if (onNewPost && newPost) {
                onNewPost(newPost);
            }
            setPostText('');
        }
        setIsLoading(false);
    };

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
            <div className="flex items-start space-x-3">
                {/* MODIFIED: Use the Avatar component */}
                <Avatar src={profile?.avatar_url} fullName={profile?.full_name} size="md" />
                <div className="flex-1">
                    <textarea
                        placeholder={`What's on your mind, ${profile?.full_name?.split(' ')[0] || 'there'}?`}
                        value={postText}
                        onChange={(e) => setPostText(e.target.value)}
                        className="w-full p-3 bg-slate-50 rounded-lg border-slate-200 focus:ring-2 focus:ring-blue-500 placeholder-slate-500 transition-all"
                        rows="3"
                    />
                </div>
            </div>
            {error && <p className="text-red-500 text-sm mt-2 ml-12">{error}</p>}
            <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <button className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium text-slate-600">
                        <Video size={20} className="text-red-500" />
                        <span>Live video</span>
                    </button>
                    <button className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium text-slate-600">
                        <Camera size={20} className="text-green-500" />
                        <span>Photo/video</span>
                    </button>
                    <button className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium text-slate-600">
                        <Smile size={20} className="text-yellow-500" />
                        <span>Feeling/activity</span>
                    </button>
                </div>
                <button
                    onClick={handlePostSubmit}
                    disabled={isLoading || !postText.trim()}
                    className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                    {isLoading ? 'Posting...' : 'Post'}
                </button>
            </div>
        </div>
    );
}