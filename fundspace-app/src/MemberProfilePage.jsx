// MemberProfilePage.jsx - Updated to use PublicPageLayout
import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import PublicPageLayout from './components/PublicPageLayout.jsx';
import { useMemberProfile } from './hooks/useMemberProfile';
import MemberProfileHeader from './components/member-profile/MemberProfileHeader';
import MemberProfileActivity from './components/member-profile/MemberProfileActivity';
import MemberProfilePhotos from './components/member-profile/MemberProfilePhotos';
import MemberProfileConnections from './components/member-profile/MemberProfileConnections';
import MemberProfileExperience from './components/member-profile/MemberProfileExperience';

export default function MemberProfilePage() {
    const { memberId, profileId } = useParams();
    const { profile: currentUserProfile } = useOutletContext();
    
    const memberIdToUse = memberId || profileId;
    
    const {
        member,
        posts,
        loading,
        error,
        isFollowing,
        followingInProgress,
        handleFollow,
        handleUnfollow,
        isCurrentUser,
        refreshMemberData
    } = useMemberProfile(memberIdToUse, currentUserProfile);

    // Tab state management
    const [activeTab, setActiveTab] = useState('activity');

    // REMOVED: Direct LayoutContext usage - now using PublicPageLayout
    // useEffect(() => {
    //     setPageBgColor('bg-[#faf7f4]');
    //     return () => setPageBgColor('bg-transparent');
    // }, [setPageBgColor]);

    // Expose refresh function globally for organization changes
    useEffect(() => {
        window.refreshMemberProfile = refreshMemberData;
        return () => {
            delete window.refreshMemberProfile;
        };
    }, [refreshMemberData]);

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

    if (!member) {
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

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'activity':
                return (
                    <MemberProfileActivity 
                        member={member}
                        posts={posts}
                        isCurrentUser={isCurrentUser}
                        currentUserProfile={currentUserProfile}
                        refreshData={refreshMemberData}
                    />
                );
            case 'experience':
                return (
                    <MemberProfileExperience 
                        member={member}
                        isCurrentUser={isCurrentUser}
                        refreshData={refreshMemberData}
                    />
                );
            case 'photos':
                return (
                    <MemberProfilePhotos 
                        member={member}
                        isCurrentUser={isCurrentUser}
                    />
                );
            case 'network':
                return (
                    <MemberProfileConnections 
                        member={member}
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
                    member={member}
                    isFollowing={isFollowing}
                    followingInProgress={followingInProgress}
                    onFollow={handleFollow}
                    onUnfollow={handleUnfollow}
                    isCurrentUser={isCurrentUser}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    currentUserProfile={currentUserProfile}
                />
                
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {renderActiveTab()}
                </div>
            </div>
        </PublicPageLayout>
    );
}