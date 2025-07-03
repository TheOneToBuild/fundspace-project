// src/components/CreatePost.jsx
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Camera, Video, Smile } from 'lucide-react';

// --- MODIFIED: Added onNewPost to the props ---
export default function CreatePost({ profile, onNewPost }) {
    const [postText, setPostText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const getInitials = (name) => {
        if (!name) return '?';
        const words = name.split(' ');
        if (words.length > 1 && words[1]) return (words[0][0] + words[1][0]).toUpperCase();
        if (words.length > 0 && words[0]) return words[0].substring(0, 2).toUpperCase();
        return '?';
    };

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

        // --- MODIFIED: Added .select() to get the new post data back ---
        const { data: newPost, error: postError } = await supabase
            .from('posts')
            .insert({
                content: postText.trim(),
                user_id: user.id,
                profile_id: profile.id
            })
            .select()
            .single(); // Use .single() to get the object directly

        if (postError) {
            setError('Failed to create post. Please try again.');
            console.error('Error creating post:', postError);
        } else {
            // --- MODIFIED: Call the onNewPost function from the parent ---
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
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {getInitials(profile?.full_name)}
                </div>
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