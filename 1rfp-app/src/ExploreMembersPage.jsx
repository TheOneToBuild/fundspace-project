// src/pages/ExploreMembersPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { UserPlus, UserCheck, User, Search, BadgeCheck, Users, Heart } from 'lucide-react';
import { followUser, unfollowUser } from './utils/followUtils';
import Avatar from './components/Avatar.jsx';

// Simplified MemberCard without the avatar ring/icon overlay
const MemberCard = ({ member, currentUserId, isFollowing, isUpdating, onFollowToggle }) => {
    
    const handleButtonClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onFollowToggle(member.id, isFollowing);
    };

    return (
        <Link 
            to={`/profile/members/${member.id}`}
            className="group text-center flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
        >
            <div className="flex-grow">
                <Avatar 
                    src={member.avatar_url} 
                    fullName={member.full_name} 
                    size="2xl"
                    className="mx-auto"
                />
                <h3 className="text-md font-semibold text-slate-800 group-hover:text-blue-600 transition-colors mt-4 truncate">
                    {member.full_name}
                    {member.is_omega_admin && <BadgeCheck className="inline-block w-5 h-5 ml-1 text-blue-500" title="Verified Admin" />}
                </h3>
                {member.title && (
                    <p className="text-sm text-slate-600 mt-1 truncate" title={member.title}>{member.title}</p>
                )}
                {member.organization_name && (
                    <p className="text-sm text-slate-500 truncate" title={member.organization_name}>{member.organization_name}</p>
                )}
                
                {(member.mutualsCount > 0 || (member.sharedInterests && member.sharedInterests.length > 0)) && (
                    <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1.5">
                        {member.mutualsCount > 0 && (
                            <div className="flex items-center justify-center">
                                <Users className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                                <span>{member.mutualsCount} mutual connection{member.mutualsCount !== 1 ? 's' : ''}</span>
                            </div>
                        )}
                        {member.sharedInterests && member.sharedInterests.length > 0 && (
                            <div className="flex items-center justify-center">
                                <Heart className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                                <span className="truncate">Also interested in {member.sharedInterests[0]}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div className="mt-5 flex-shrink-0">
                 {currentUserId && member.id !== currentUserId && (
                    <button
                        onClick={handleButtonClick}
                        disabled={isUpdating}
                        className={`w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            isFollowing 
                                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                    >
                        {isFollowing ? <UserCheck className="w-4 h-4 mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                        <span>{isUpdating ? 'Updating...' : (isFollowing ? 'Following' : 'Follow')}</span>
                    </button>
                 )}
            </div>
        </Link>
    );
};

export default function ExploreMembersPage() {
    const { profile: currentUserProfile } = useOutletContext();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all'); // State for the filter dropdown
    const [followedIds, setFollowedIds] = useState(null);
    const [followingInProgress, setFollowingInProgress] = useState(new Set());

    useEffect(() => {
        if (currentUserProfile?.id) {
            supabase
                .from('followers')
                .select('following_id')
                .eq('follower_id', currentUserProfile.id)
                .then(({ data, error }) => {
                    if (error) {
                        console.error('Error fetching followed users:', error);
                        setFollowedIds(new Set());
                    } else {
                        setFollowedIds(new Set(data.map(f => f.following_id)));
                    }
                });
        } else if (currentUserProfile === null) {
            setFollowedIds(new Set());
        }
    }, [currentUserProfile]);
    
    useEffect(() => {
        if (followedIds === null) {
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                let query = supabase.from('profiles').select('*');
                if (currentUserProfile?.id) {
                    query = query.neq('id', currentUserProfile.id);
                }
                if (searchTerm.trim()) {
                    const searchPattern = `%${searchTerm.trim()}%`;
                    query = query.or(`full_name.ilike.${searchPattern},title.ilike.${searchPattern},organization_name.ilike.${searchPattern}`);
                }
                // Apply the role filter to the query
                if (roleFilter !== 'all') {
                    query = query.eq('organization_type', roleFilter);
                }

                const { data, error } = await query.order('updated_at', { ascending: false, nullsLast: true });
                if (error) throw error;

                if (data && data.length > 0 && currentUserProfile?.id) {
                    const memberIds = data.map(m => m.id);
                    const { data: memberFollowsData, error: memberFollowsError } = await supabase
                        .from('followers')
                        .select('follower_id, following_id')
                        .in('follower_id', memberIds);

                    if (memberFollowsError) throw memberFollowsError;

                    const memberFollowsMap = new Map();
                    for (const follow of memberFollowsData) {
                        if (!memberFollowsMap.has(follow.follower_id)) {
                            memberFollowsMap.set(follow.follower_id, new Set());
                        }
                        memberFollowsMap.get(follow.follower_id).add(follow.following_id);
                    }
                    
                    const currentUserInterests = new Set(currentUserProfile.interests || []);
                    const membersWithContext = data.map(member => {
                        const memberFollowingSet = memberFollowsMap.get(member.id) || new Set();
                        const mutuals = new Set([...followedIds].filter(id => memberFollowingSet.has(id)));
                        const sharedInterests = (member.interests || []).filter(interest => currentUserInterests.has(interest));
                        return { ...member, mutualsCount: mutuals.size, sharedInterests };
                    });
                    setMembers(membersWithContext);
                } else {
                    setMembers(data || []);
                }
            } catch (error) {
                console.error('Error fetching members:', error);
                setMembers([]);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, roleFilter, followedIds, currentUserProfile]);


    const handleFollowToggle = async (targetId, isCurrentlyFollowing) => {
        if (!currentUserProfile?.id || followingInProgress.has(targetId)) return;

        const originalFollowedIds = new Set(followedIds);
        setFollowingInProgress(prev => new Set(prev).add(targetId));

        setFollowedIds(prev => {
            const newSet = new Set(prev);
            if (isCurrentlyFollowing) newSet.delete(targetId); else newSet.add(targetId);
            return newSet;
        });

        try {
            const action = isCurrentlyFollowing ? unfollowUser : followUser;
            const { success, error } = await action(currentUserProfile.id, targetId);
            if (!success) {
                console.error('Failed to update follow status:', error);
                setFollowedIds(originalFollowedIds);
            }
        } catch (error) {
            console.error('Error toggling follow status:', error);
            setFollowedIds(originalFollowedIds);
        } finally {
            setFollowingInProgress(prev => {
                const newSet = new Set(prev);
                newSet.delete(targetId);
                return newSet;
            });
        }
    };

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Your Community Constellation 🔭</h1>
                <p className="text-slate-600 mt-3 max-w-2xl mx-auto text-lg">
                    Discover the bright stars—nonprofit leaders, funders, and changemakers—lighting up our universe.
                </p>
            </div>

            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative flex-grow w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Discover changemakers by name, title, or organization..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    />
                </div>
                <div className="flex-shrink-0 w-full sm:w-auto">
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="w-full h-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                        <option value="all">All Types</option>
                        <option value="nonprofit">Nonprofit</option>
                        <option value="foundation">Foundation</option>
                        <option value="government">Government</option>
                        <option value="education">Education</option>
                        <option value="healthcare">Healthcare</option>
                        <option value="for-profit">For-Profit</option>
                        <option value="religious">Religious</option>
                        <option value="international">International</option>
                        <option value="community-member">Community Member</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-slate-600 mt-2">Discovering amazing people...</p>
                </div>
            ) : members.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {members.map(member => (
                        <MemberCard 
                            key={member.id} 
                            member={member}
                            currentUserId={currentUserProfile?.id}
                            isFollowing={followedIds.has(member.id)}
                            isUpdating={followingInProgress.has(member.id)}
                            onFollowToggle={handleFollowToggle}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <User className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-800 mb-2">No Members Found</h3>
                    <p className="text-slate-500 max-w-md mx-auto">
                        {searchTerm || roleFilter !== 'all' ? 'No members match your current filters. Try a different search!' : 'It looks like our constellation is still growing. Be the first star!'}
                    </p>
                </div>
            )}
        </div>
    );
}