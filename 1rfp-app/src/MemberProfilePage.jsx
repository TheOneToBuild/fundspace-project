// src/MemberProfilePage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { supabase } from './supabaseClient';
import PostCard from './components/PostCard.jsx';
import { UserPlus, UserCheck, Mail, Briefcase } from 'lucide-react';

// A component for the profile header card
const MemberProfileHeader = ({ member, isFollowing, onFollow, onUnfollow, isCurrentUser }) => {
    const getInitials = (name) => {
        if (!name) return '?';
        const words = name.split(' ');
        if (words.length > 1 && words[1]) return (words[0][0] + words[1][0]).toUpperCase();
        return (words[0] || '').substring(0, 2).toUpperCase();
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start sm:space-x-6">
                <div className="w-24 h-24 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-4xl flex-shrink-0 ring-4 ring-indigo-200 mb-4 sm:mb-0">
                    {getInitials(member.full_name)}
                </div>
                <div className="flex-grow text-center sm:text-left">
                    <h2 className="text-3xl font-bold text-slate-800">{member.full_name}</h2>
                    <p className="text-md text-slate-500 mt-1">{member.title || member.role}</p>
                    {member.organization_name && (
                        <p className="text-md text-slate-600 font-medium flex items-center justify-center sm:justify-start mt-1">
                            <Briefcase size={16} className="mr-2" />
                            {member.organization_name}
                        </p>
                    )}
                </div>
                {!isCurrentUser && (
                    <div className="flex-shrink-0 mt-4 sm:mt-0">
                        <button
                            onClick={() => isFollowing ? onUnfollow(member.id) : onFollow(member.id)}
                            className={`w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 border text-sm font-semibold rounded-lg transition-colors ${
                                isFollowing
                                    ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                                    : 'bg-blue-600 text-white border-transparent hover:bg-blue-700'
                            }`}
                        >
                            {isFollowing ? <UserCheck size={18} className="mr-2" /> : <UserPlus size={18} className="mr-2" />}
                            {isFollowing ? 'Following' : 'Follow'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};


export default function MemberProfilePage() {
    const { profileId } = useParams();
    const { profile: currentUserProfile } = useOutletContext();
    
    const [member, setMember] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [error, setError] = useState('');

    const fetchMemberData = useCallback(async () => {
        setLoading(true);
        setError('');

        // Fetch the profile of the member being viewed
        const { data: memberData, error: memberError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', profileId)
            .single();

        if (memberError || !memberData) {
            setError('Could not find this member.');
            console.error('Error fetching member profile:', memberError);
            setLoading(false);
            return;
        }
        setMember(memberData);

        // Fetch the posts made by this member
        const { data: postsData, error: postsError } = await supabase
            .from('posts')
            .select('*, profiles (*)') // Also get author info
            .eq('profile_id', profileId)
            .order('created_at', { ascending: false });

        if (postsError) {
            setError('Could not fetch member posts.');
            console.error('Error fetching posts:', postsError);
        } else {
            setPosts(postsData);
        }

        setLoading(false);
    }, [profileId]);

    const checkFollowingStatus = useCallback(async () => {
        if (!currentUserProfile || !member) return;

        const { data, error } = await supabase
            .from('followers')
            .select('*')
            .eq('follower_id', currentUserProfile.id)
            .eq('following_id', member.id)
            .single();
        
        if (error && error.code !== 'PGRST116') { // Ignore 'exact one row' error
            console.error("Error checking follow status:", error);
        }
        setIsFollowing(!!data);

    }, [currentUserProfile, member]);

    useEffect(() => {
        fetchMemberData();
    }, [fetchMemberData]);

    useEffect(() => {
        checkFollowingStatus();
    }, [checkFollowingStatus]);

    const handleFollow = async (profileIdToFollow) => {
        setIsFollowing(true);
        const { error } = await supabase
            .from('followers')
            .insert({ follower_id: currentUserProfile.id, following_id: profileIdToFollow });
        if (error) {
            console.error('Error following user:', error);
            setIsFollowing(false); // Revert on error
        }
    };

    const handleUnfollow = async (profileIdToUnfollow) => {
        setIsFollowing(false);
        const { error } = await supabase
            .from('followers')
            .delete()
            .match({ follower_id: currentUserProfile.id, following_id: profileIdToUnfollow });
        if (error) {
            console.error('Error unfollowing user:', error);
            setIsFollowing(true); // Revert on error
        }
    };

    if (loading) {
        return <div className="text-center p-10">Loading profile...</div>;
    }

    if (error) {
        return <div className="text-center p-10 text-red-500">{error}</div>;
    }

    return (
        <div className="space-y-6">
            <MemberProfileHeader 
                member={member}
                isFollowing={isFollowing}
                onFollow={handleFollow}
                onUnfollow={handleUnfollow}
                isCurrentUser={currentUserProfile?.id === member?.id}
            />
            
            <h3 className="text-xl font-bold text-slate-800 border-b pb-2">
                {member.full_name.split(' ')[0]}'s Activity
            </h3>

            {posts.length > 0 ? (
                <div className="space-y-6">
                    {posts.map(post => (
                        <PostCard key={post.id} post={post} />
                    ))}
                </div>
            ) : (
                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
                    <p className="text-slate-500">This member hasn't posted anything yet.</p>
                </div>
            )}
        </div>
    );
}
