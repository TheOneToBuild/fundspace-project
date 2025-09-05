// MemberProfilePage.jsx - Updated with refresh capability
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { LayoutContext } from './App.jsx';
import { useMemberProfile } from './hooks/useMemberProfile';
import MemberProfileHeader from './components/member-profile/MemberProfileHeader';
import MemberProfileActivity from './components/member-profile/MemberProfileActivity';

export default function MemberProfilePage() {
    const { memberId, profileId } = useParams();
    const { profile: currentUserProfile } = useOutletContext();
    const { setPageBgColor } = useContext(LayoutContext);
    
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

    // Set the light beige background color
    useEffect(() => {
        setPageBgColor('bg-[#faf7f4]');
        return () => setPageBgColor('bg-white');
    }, [setPageBgColor]);

    // Expose refresh function globally for organization changes
    useEffect(() => {
        window.refreshMemberProfileData = refreshMemberData;
        return () => {
            delete window.refreshMemberProfileData;
        };
    }, [refreshMemberData]);

    // Handle tab changes from header stats clicks
    const handleTabChange = (tabName) => {
        setActiveTab(tabName);
    };

    if (loading) {
        return (
            <div className="min-h-screen">
                <div className="text-center p-10">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-slate-600 mt-2">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen">
                <div className="text-center p-10">
                    <div className="text-red-500 text-lg font-medium mb-2">Error</div>
                    <p className="text-slate-600">{error}</p>
                </div>
            </div>
        );
    }

    if (!member) {
        return (
            <div className="min-h-screen">
                <div className="text-center p-10">
                    <div className="text-slate-500 text-lg font-medium mb-2">Member Not Found</div>
                    <p className="text-slate-600">The member you're looking for doesn't exist.</p>
                </div>
            </div>
        );
    }

    // Tab configuration
    const tabs = [
        { id: 'activity', label: 'Activity', icon: '📝' },
        { id: 'connections', label: 'Connections', icon: '🤝' },
        { id: 'followers', label: 'Followers', icon: '👥' },
        { id: 'following', label: 'Following', icon: '👤' }
    ];

    // Render tab content
    const renderTabContent = () => {
        switch (activeTab) {
            case 'activity':
                return (
                    <MemberProfileActivity 
                        member={member}
                        posts={posts}
                        loading={false}
                    />
                );
            case 'connections':
                return (
                    <div className="max-w-7xl mx-auto px-8 py-8">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h3 className="text-xl font-bold text-slate-800 mb-6">
                                {member.full_name.split(' ')[0]}'s Connections
                            </h3>
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                                    <span className="text-2xl">🤝</span>
                                </div>
                                <p className="text-slate-500">Connections feature coming soon!</p>
                            </div>
                        </div>
                    </div>
                );
            case 'followers':
                return (
                    <div className="max-w-7xl mx-auto px-8 py-8">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h3 className="text-xl font-bold text-slate-800 mb-6">
                                {member.full_name.split(' ')[0]}'s Followers
                            </h3>
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                                    <span className="text-2xl">👥</span>
                                </div>
                                <p className="text-slate-500">Followers feature coming soon!</p>
                            </div>
                        </div>
                    </div>
                );
            case 'following':
                return (
                    <div className="max-w-7xl mx-auto px-8 py-8">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h3 className="text-xl font-bold text-slate-800 mb-6">
                                Who {member.full_name.split(' ')[0]} Follows
                            </h3>
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                                    <span className="text-2xl">👤</span>
                                </div>
                                <p className="text-slate-500">Following feature coming soon!</p>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen">
            <MemberProfileHeader 
                member={member}
                isFollowing={isFollowing}
                onFollow={handleFollow}
                onUnfollow={handleUnfollow}
                isCurrentUser={isCurrentUser}
                followingInProgress={followingInProgress}
                currentUserId={currentUserProfile?.id}
                onTabChange={handleTabChange}
                activeTab={activeTab}
            />
            
            {/* Tab Content - No separate tab navigation needed */}
            <div className="pb-8">
                {renderTabContent()}
            </div>
        </div>
    );
}