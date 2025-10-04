import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import PublicPageLayout from './components/PublicPageLayout.jsx';
import { supabase } from './supabaseClient';
import { getUserProfileComplete, getUserExperiencesComplete } from './utils/rpcClientFunctions';
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
    const [experiences, setExperiences] = useState([]);
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
      // Fetch profile and experiences in parallel
      const [profileData, experiencesResult] = await Promise.all([
        getUserProfileComplete(memberIdToUse, currentUserProfile?.id),
        getUserExperiencesComplete(memberIdToUse)
      ]);

      if (!profileData) {
        setError('Member not found');
        return;
      }

      // The RPC returns posts, connections, followers, following already
      // We just need to ensure posts have the profile data attached
      const enrichedPosts = (profileData.posts || []).map(post => ({
        ...post,
        profiles: {
          id: profileData.id,
          full_name: profileData.full_name,
          avatar_url: profileData.avatar_url,
          title: profileData.title,
          organization_name: profileData.organization_name,
          role: profileData.role
        }
      }));

      // Enrich connections/followers/following with profile data
      const enrichedConnections = (profileData.connections || []).map(conn => ({
        ...conn,
        user: conn.profile || { // RPC may return it as 'profile'
          id: conn.user_id,
          full_name: conn.full_name,
          avatar_url: conn.avatar_url,
          title: conn.title,
          organization_name: conn.organization_name,
          location: conn.location
        }
      }));

      const enrichedFollowers = (profileData.followers || []).map(f => ({
        ...f,
        profile: f.profile || {
          id: f.follower_id,
          full_name: f.full_name,
          avatar_url: f.avatar_url,
          title: f.title,
          organization_name: f.organization_name,
          location: f.location
        }
      }));

      const enrichedFollowing = (profileData.following || []).map(f => ({
        ...f,
        profile: f.profile || {
          id: f.following_id,
          full_name: f.full_name,
          avatar_url: f.avatar_url,
          title: f.title,
          organization_name: f.organization_name,
          location: f.location
        }
      }));

      setMemberData({ 
        ...profileData,
        posts: enrichedPosts,
        connections: enrichedConnections,
        followers: enrichedFollowers,
        following: enrichedFollowing
      });
      
      setExperiences(experiencesResult.experiences || []);

    } catch (error) {
      console.error('Error loading member data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

    const handleFollow = async (profileIdToFollow) => {  // ✅ Accept parameter
        if (!currentUserProfile?.id || followingInProgress) return;
        
        setFollowingInProgress(true);
        try {
            const result = await followUser(currentUserProfile.id, profileIdToFollow || memberIdToUse);
            if (result.success) {
                setIsFollowing(true);
            }
        } catch (error) {
            console.error('Error following user:', error);
        } finally {
            setFollowingInProgress(false);
        }
    };

    const handleUnfollow = async (profileIdToUnfollow) => {  // ✅ Accept parameter
        if (!currentUserProfile?.id || followingInProgress) return;
        
        setFollowingInProgress(true);
        try {
            const result = await unfollowUser(currentUserProfile.id, profileIdToUnfollow || memberIdToUse);
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
                        experiences={experiences}
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
                        connections={memberData.connections || []}
                        followers={memberData.followers || []}
                        following={memberData.following || []}
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