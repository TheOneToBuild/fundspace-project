import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import PublicPageLayout from './components/PublicPageLayout.jsx';
import { supabase } from './supabaseClient';
import { getUserProfileComplete } from './utils/rpcClientFunctions';
import { followUser, unfollowUser, checkFollowStatus } from './utils/followUtils';
import MemberProfileHeader from './components/member-profile/MemberProfileHeader';
import MemberProfileActivity from './components/member-profile/MemberProfileActivity';
import MemberProfilePhotos from './components/member-profile/MemberProfilePhotos';
import MemberProfileConnections from './components/member-profile/MemberProfileConnections';
import MemberProfileExperience from './components/member-profile/MemberProfileExperience';

export default function MemberProfilePage() {
    const { memberId, profileId } = useParams();
    const { profile: currentUserProfile } = useOutletContext();
    
    const memberIdToUse = memberId || profileId;
    
    const [memberData, setMemberData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followingInProgress, setFollowingInProgress] = useState(false);
    const [activeTab, setActiveTab] = useState('activity');

    useEffect(() => {
        loadMemberData();
    }, [memberIdToUse, currentUserProfile?.id]);

    const loadMemberData = async () => {
        if (!memberIdToUse) return;

        setLoading(true);
        try {
            const profileData = await getUserProfileComplete(memberIdToUse, currentUserProfile?.id);

            if (!profileData) {
                setError('Member not found');
                return;
            }

            // Fetch posts separately
            const { data: postsData } = await supabase
              .from('posts')
              .select('*')
              .eq('profile_id', memberIdToUse)
              .order('created_at', { ascending: false });

            // Fetch connections - just get the IDs first
            const { data: connectionsData } = await supabase
              .from('user_connections')
              .select('id, requester_id, recipient_id, status, created_at, updated_at')
              .or(`requester_id.eq.${memberIdToUse},recipient_id.eq.${memberIdToUse}`)
              .eq('status', 'accepted');

            // Get the user IDs from connections
            const connectionUserIds = connectionsData?.map(conn => 
              conn.requester_id === memberIdToUse ? conn.recipient_id : conn.requester_id
            ).filter(Boolean) || [];

            // Fetch profiles for those users
            let connectionProfiles = [];
            if (connectionUserIds.length > 0) {
              const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, title, organization_name, location')
                .in('id', connectionUserIds);
              connectionProfiles = profiles || [];
            }

            // Similarly for followers
            const { data: followersData } = await supabase
              .from('followers')
              .select('id, follower_id, created_at')
              .eq('following_id', memberIdToUse);

            const followerIds = followersData?.map(f => f.follower_id).filter(Boolean) || [];
            let followerProfiles = [];
            if (followerIds.length > 0) {
              const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, title, organization_name, location')
                .in('id', followerIds);
              followerProfiles = profiles || [];
            }

            // And following
            const { data: followingData } = await supabase
              .from('followers')
              .select('id, following_id, created_at')
              .eq('follower_id', memberIdToUse);

            const followingIds = followingData?.map(f => f.following_id).filter(Boolean) || [];
            let followingProfiles = [];
            if (followingIds.length > 0) {
              const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, title, organization_name, location')
                .in('id', followingIds);
              followingProfiles = profiles || [];
            }

            // Merge the data
            const connections = connectionsData?.map(conn => ({
              ...conn,
              user: connectionProfiles.find(p => p.id === (conn.requester_id === memberIdToUse ? conn.recipient_id : conn.requester_id))
            })) || [];

            const followers = followersData?.map(f => ({
              ...f,
              profile: followerProfiles.find(p => p.id === f.follower_id)
            })) || [];

            const following = followingData?.map(f => ({
              ...f,
              profile: followingProfiles.find(p => p.id === f.following_id)
            })) || [];

            const enrichedPosts = (postsData || []).map(post => ({
                ...post,
                profiles: {
                    id: profileData.id,
                    full_name: profileData.full_name,
                    avatar_url: profileData.avatar_url,
                    title: profileData.title,
                    organization_name: profileData.organization_name,
                }
            }));

            setMemberData({ 
              ...profileData, 
              posts: enrichedPosts,
              connections,
              followers,
              following
            });

        } catch (error) {
            console.error('Error loading member data:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async () => {
        if (!currentUserProfile?.id || followingInProgress) return;
        
        setFollowingInProgress(true);
        try {
            const result = await followUser(currentUserProfile.id, memberIdToUse);
            if (result.success) {
                setIsFollowing(true);
            }
        } catch (error) {
            console.error('Error following user:', error);
        } finally {
            setFollowingInProgress(false);
        }
    };

    const handleUnfollow = async () => {
        if (!currentUserProfile?.id || followingInProgress) return;
        
        setFollowingInProgress(true);
        try {
            const result = await unfollowUser(currentUserProfile.id, memberIdToUse);
            if (result.success) {
                setIsFollowing(false);
            }
        } catch (error) {
            console.error('Error unfollowing user:', error);
        } finally {
            setFollowingInProgress(false);
        }
    };

    const handleTabChange = (newTab) => {
        setActiveTab(newTab);
    };

    if (loading) {
        return (
            <PublicPageLayout bgColor="bg-[#faf7f4]">
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-slate-600">Loading profile...</p>
                    </div>
                </div>
            </PublicPageLayout>
        );
    }

    if (error) {
        return (
            <PublicPageLayout bgColor="bg-[#faf7f4]">
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-sm border border-red-200">
                        <p className="text-red-600 mb-4">{error}</p>
                        <button 
                            onClick={() => window.location.reload()} 
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </PublicPageLayout>
        );
    }

    if (!memberData) {
        return (
            <PublicPageLayout bgColor="bg-[#faf7f4]">
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-slate-600">Member not found</p>
                    </div>
                </div>
            </PublicPageLayout>
        );
    }

    const isCurrentUser = currentUserProfile?.id === memberIdToUse;

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'activity':
                return (
                    <MemberProfileActivity
                        member={memberData}
                        posts={memberData.posts || []}
                        loading={loading}
                        isCurrentUser={isCurrentUser}
                        currentUserProfile={currentUserProfile}
                        refreshData={loadMemberData}
                    />
                );
            case 'experience':
                return (
                    <MemberProfileExperience 
                        member={memberData}
                        loading={loading}
                        currentUserId={currentUserProfile?.id}
                        isCurrentUser={isCurrentUser}
                        refreshData={loadMemberData}
                    />
                );
            case 'photos':
                return (
                    <MemberProfilePhotos 
                        member={memberData}
                        posts={memberData.posts || []}
                        loading={loading}
                        isCurrentUser={isCurrentUser}
                    />
                );
            case 'connections':
                return (
                    <MemberProfileConnections 
                        member={memberData}
                        loading={loading}
                        currentUserId={currentUserProfile?.id}
                        isCurrentUser={isCurrentUser}
                        currentUserProfile={currentUserProfile}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <PublicPageLayout bgColor="bg-[#faf7f4]">
            <div className="min-h-screen">
                <MemberProfileHeader
                    member={memberData}
                    isFollowing={isFollowing}
                    followingInProgress={followingInProgress}
                    onFollow={handleFollow}
                    onUnfollow={handleUnfollow}
                    isCurrentUser={isCurrentUser}
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    currentUserId={currentUserProfile?.id}
                    currentUserProfile={currentUserProfile}
                />
                
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {renderActiveTab()}
                </div>
            </div>
        </PublicPageLayout>
    );
}