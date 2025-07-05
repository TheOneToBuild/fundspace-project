import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { Link, useOutletContext } from 'react-router-dom';
import { UserPlus, UserCheck } from 'lucide-react';
import Avatar from './components/Avatar.jsx';
import { Search } from './components/Icons.jsx';

const MemberCard = ({ member, currentUserId, isFollowing, onFollow, onUnfollow }) => {
    const handleFollowClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        isFollowing ? onUnfollow(member.id) : onFollow(member.id);
    };

    return (
        <div className="bg-white p-5 rounded-xl border border-slate-200 hover:shadow-lg hover:-translate-y-1 transition-all flex items-center justify-between gap-4">
            <Link to={`/profile/members/${member.id}`} className="flex items-center space-x-4 flex-grow min-w-0">
                <Avatar src={member.avatar_url} fullName={member.full_name} size="lg" />
                <div className="min-w-0">
                    <p className="font-bold text-lg text-slate-800 truncate">{member.full_name}</p>
                    <p className="text-sm text-slate-500 truncate">{member.organization_name || member.role}</p>
                </div>
            </Link>
            
            {member.id !== currentUserId && (
                <button
                    onClick={handleFollowClick}
                    className={`flex-shrink-0 inline-flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-lg transition-colors ${
                        isFollowing
                            ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                            : 'bg-blue-600 text-white border-transparent hover:bg-blue-700'
                    }`}
                >
                    {isFollowing ? <UserCheck size={16} className="mr-2" /> : <UserPlus size={16} className="mr-2" />}
                    {isFollowing ? 'Following' : 'Follow'}
                </button>
            )}
        </div>
    );
};

export default function ExploreMembersPage() {
    const { profile: currentUserProfile } = useOutletContext();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [followedIds, setFollowedIds] = useState(new Set());

    const fetchFollowedUsers = useCallback(async () => {
        if (!currentUserProfile) return;
        const { data, error } = await supabase
            .from('followers')
            .select('following_id')
            .eq('follower_id', currentUserProfile.id);

        if (error) {
            console.error('Error fetching followed users:', error);
        } else {
            setFollowedIds(new Set(data.map(item => item.following_id)));
        }
    }, [currentUserProfile]);

    useEffect(() => {
        const fetchMembers = async () => {
            setLoading(true);
            const { data, error } = await supabase.rpc('search_profiles', {
                search_term: searchTerm,
                filter_role: roleFilter
            });
            
            if (error) console.error('Error searching profiles:', error);
            else setMembers(data.filter(m => m.id !== currentUserProfile.id));
            setLoading(false);
        };

        const timer = setTimeout(fetchMembers, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, roleFilter, currentUserProfile.id]);

    useEffect(() => {
        if (currentUserProfile) {
            fetchFollowedUsers();
        }
    }, [currentUserProfile, fetchFollowedUsers]);

    const handleFollow = async (profileIdToFollow) => {
        if (!currentUserProfile) return;
        setFollowedIds(prev => new Set(prev).add(profileIdToFollow));

        const { error } = await supabase
            .from('followers')
            .insert({ 
                follower_id: currentUserProfile.id, 
                following_id: profileIdToFollow 
            });

        if (error) {
            console.error('Error following user:', error);
            setFollowedIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(profileIdToFollow);
                return newSet;
            });
        }
    };

    const handleUnfollow = async (profileIdToUnfollow) => {
        if (!currentUserProfile) return;
        setFollowedIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(profileIdToUnfollow);
            return newSet;
        });

        const { error } = await supabase
            .from('followers')
            .delete()
            .match({ 
                follower_id: currentUserProfile.id, 
                following_id: profileIdToUnfollow 
            });

        if (error) {
            console.error('Error unfollowing user:', error);
            setFollowedIds(prev => new Set(prev).add(profileIdToUnfollow));
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-2xl font-bold text-slate-800 mb-1">Explore Members</h2>
                <p className="text-slate-500 mb-6">Discover and connect with funders and nonprofits.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                        type="text"
                        placeholder="Search by name or organization..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="md:col-span-2 w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Roles</option>
                        <option value="Nonprofit">Nonprofits</option>
                        <option value="Funder">Funders</option>
                        <option value="Community member">Community Members</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <p className="text-center text-slate-500 py-16">Loading members...</p>
            ) : (
                <div className="space-y-4">
                    {members.map(member => (
                        <MemberCard 
                            key={member.id} 
                            member={member} 
                            currentUserId={currentUserProfile?.id}
                            isFollowing={followedIds.has(member.id)}
                            onFollow={handleFollow}
                            onUnfollow={handleUnfollow}
                        />
                    ))}
                    { !loading && members.length === 0 && (
                        <div className="text-center bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                            <p className="text-slate-500">No members found. Try adjusting your search.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}