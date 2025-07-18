// ExploreMembersPage.jsx - Updated with Follow Notifications (Fixed)
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { UserPlus, UserCheck, MapPin, Building, User } from 'lucide-react';
import { followUser, unfollowUser, checkFollowStatus } from './utils/followUtils';

export default function ExploreMembersPage() {
    const { profile: currentUserProfile } = useOutletContext();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [followedIds, setFollowedIds] = useState(new Set());
    const [followingInProgress, setFollowingInProgress] = useState(new Set());

    // Fixed fetchMembers function using direct queries instead of RPC
    const fetchMembers = useCallback(async () => {
        try {
            setLoading(true);
            
            let query = supabase
                .from('profiles')
                .select('*');

            // Exclude current user if logged in
            if (currentUserProfile?.id) {
                query = query.neq('id', currentUserProfile.id);
            }

            // Apply search filter
            if (searchTerm.trim()) {
                const searchPattern = `%${searchTerm.trim()}%`;
                query = query.or(`full_name.ilike.${searchPattern},title.ilike.${searchPattern},organization_name.ilike.${searchPattern}`);
            }

            // Apply role filter
            if (roleFilter !== 'all') {
                query = query.eq('role', roleFilter);
            }

            // Order by creation date, most recent first
            const { data, error } = await query.order('updated_at', { ascending: false, nullsLast: true });

            if (error) {
                console.error('Error fetching members:', error);
                setMembers([]);
                return;
            }

            setMembers(data || []);
        } catch (error) {
            console.error('Error in fetchMembers:', error);
            setMembers([]);
        } finally {
            setLoading(false);
        }
    }, [searchTerm, roleFilter, currentUserProfile?.id]);

    const fetchFollowedUsers = useCallback(async () => {
        if (!currentUserProfile?.id) return;

        try {
            const { data, error } = await supabase
                .from('followers')
                .select('following_id')
                .eq('follower_id', currentUserProfile.id);

            if (error) {
                console.error('Error fetching followed users:', error);
                return;
            }

            const followedSet = new Set(data.map(f => f.following_id));
            setFollowedIds(followedSet);
        } catch (error) {
            console.error('Error in fetchFollowedUsers:', error);
        }
    }, [currentUserProfile?.id]);

    useEffect(() => {
        // Debounce the search to avoid too many API calls
        const timer = setTimeout(() => {
            fetchMembers();
        }, 300);

        return () => clearTimeout(timer);
    }, [fetchMembers]);

    useEffect(() => {
        if (currentUserProfile) {
            fetchFollowedUsers();
        }
    }, [currentUserProfile, fetchFollowedUsers]);

    const handleFollow = async (profileIdToFollow) => {
        if (!currentUserProfile || followingInProgress.has(profileIdToFollow)) return;
        
        // Optimistic update
        setFollowedIds(prev => new Set(prev).add(profileIdToFollow));
        setFollowingInProgress(prev => new Set(prev).add(profileIdToFollow));

        try {
            const result = await followUser(currentUserProfile.id, profileIdToFollow);
            
            if (!result.success) {
                console.error('Error following user:', result.error);
                // Revert optimistic update
                setFollowedIds(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(profileIdToFollow);
                    return newSet;
                });
            }
        } catch (error) {
            console.error('Error in handleFollow:', error);
            // Revert optimistic update
            setFollowedIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(profileIdToFollow);
                return newSet;
            });
        } finally {
            setFollowingInProgress(prev => {
                const newSet = new Set(prev);
                newSet.delete(profileIdToFollow);
                return newSet;
            });
        }
    };

    const handleUnfollow = async (profileIdToUnfollow) => {
        if (!currentUserProfile || followingInProgress.has(profileIdToUnfollow)) return;
        
        // Optimistic update
        setFollowedIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(profileIdToUnfollow);
            return newSet;
        });
        setFollowingInProgress(prev => new Set(prev).add(profileIdToUnfollow));

        try {
            const result = await unfollowUser(currentUserProfile.id, profileIdToUnfollow);
            
            if (!result.success) {
                console.error('Error unfollowing user:', result.error);
                // Revert optimistic update
                setFollowedIds(prev => new Set(prev).add(profileIdToUnfollow));
            }
        } catch (error) {
            console.error('Error in handleUnfollow:', error);
            // Revert optimistic update
            setFollowedIds(prev => new Set(prev).add(profileIdToUnfollow));
        } finally {
            setFollowingInProgress(prev => {
                const newSet = new Set(prev);
                newSet.delete(profileIdToUnfollow);
                return newSet;
            });
        }
    };

    const MemberCard = ({ member }) => {
        const isFollowing = followedIds.has(member.id);
        const isFollowingInProgress = followingInProgress.has(member.id);

        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-grow">
                        <div className="flex-shrink-0">
                            {member.avatar_url ? (
                                <img 
                                    src={member.avatar_url} 
                                    alt={member.full_name}
                                    className="w-12 h-12 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                                    <User className="w-6 h-6 text-slate-400" />
                                </div>
                            )}
                        </div>
                        
                        <div className="flex-grow min-w-0">
                            <Link 
                                to={`/profile/members/${member.id}`}
                                className="block group"
                            >
                                <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                                    {member.full_name}
                                </h3>
                            </Link>
                            
                            {member.title && (
                                <p className="text-sm text-slate-600 mt-1">{member.title}</p>
                            )}
                            
                            {member.organization_name && (
                                <div className="flex items-center text-sm text-slate-500 mt-1">
                                    <Building className="w-4 h-4 mr-1" />
                                    {member.organization_name}
                                </div>
                            )}
                            
                            {member.location && (
                                <div className="flex items-center text-sm text-slate-500 mt-1">
                                    <MapPin className="w-4 h-4 mr-1" />
                                    {member.location}
                                </div>
                            )}

                            {member.bio && (
                                <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                                    {member.bio}
                                </p>
                            )}

                            {member.role && (
                                <div className="mt-2">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                        {member.role}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {currentUserProfile && member.id !== currentUserProfile.id && (
                        <div className="flex-shrink-0 ml-4">
                            {isFollowing ? (
                                <button
                                    onClick={() => handleUnfollow(member.id)}
                                    disabled={isFollowingInProgress}
                                    className="inline-flex items-center px-3 py-2 text-sm font-medium bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <UserCheck className="w-4 h-4 mr-1" />
                                    {isFollowingInProgress ? 'Updating...' : 'Following'}
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleFollow(member.id)}
                                    disabled={isFollowingInProgress}
                                    className="inline-flex items-center px-3 py-2 text-sm font-medium bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <UserPlus className="w-4 h-4 mr-1" />
                                    {isFollowingInProgress ? 'Following...' : 'Follow'}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Explore Community Members</h1>
                <p className="text-slate-600 mt-2">
                    Connect with nonprofit leaders, funders, and changemakers in our community.
                </p>
            </div>

            {/* Search and Filter Controls */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-grow">
                        <input
                            type="text"
                            placeholder="Search by name, title, or organization..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div className="flex-shrink-0">
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">All Roles</option>
                            <option value="Nonprofit">Nonprofits</option>
                            <option value="Funder">Funders</option>
                            <option value="Community member">Community Members</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Members Grid */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-slate-600 mt-2">Loading community members...</p>
                </div>
            ) : members.length > 0 ? (
                <div className="space-y-4">
                    {members.map(member => (
                        <MemberCard key={member.id} member={member} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <User className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No members found</h3>
                    <p className="text-slate-600">
                        {searchTerm ? 'Try adjusting your search terms.' : 'No community members to display yet.'}
                    </p>
                </div>
            )}
        </div>
    );
}