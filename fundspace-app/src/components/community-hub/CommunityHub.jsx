// src/components/community-hub/CommunityHub.jsx - Optimized with Page Data Loader
import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Globe, Building, MapPin } from 'lucide-react';
import CreatePost from '../CreatePost.jsx';
import PostCard from '../PostCard.jsx';
import TrendingNews from './TrendingNews';
import EmptyState from './EmptyState';
import Sidebar from './Sidebar';
import { useCommunityData } from './useCommunityData';
import { usePageDataLoader } from '../../hooks/usePageDataLoader';
import { BAY_AREA_COUNTIES, ORGANIZATION_CHANNELS, getOrgBaseType } from './constants';

export default function CommunityHub() {
  const { profile } = useOutletContext();
  const [activeChannel, setActiveChannel] = useState('hello-world');
  
  const {
    posts,
    loading,
    page,
    hasMore,
    organizationInfo,
    fetchPosts,
    handleNewPost,
    handleDeletePost,
    resetPosts,
    setPage
  } = useCommunityData(profile);

  // ✅ NEW: Add page data loader for batched API calls
  const { pageData, loadPostsPageData, clearPageData } = usePageDataLoader();

  // Mock county for now
  const userCounty = 'santa-clara';

  // Get channel configuration
  const getChannelConfig = () => {
    const userOrgType = organizationInfo ? getOrgBaseType(organizationInfo.type) : null;
    
    const channels = [
      {
        id: 'hello-world',
        name: 'Hello Platform-Wide',
        shortName: 'Platform-Wide',
        description: 'Platform-wide community - connect with everyone',
        icon: Globe,
        color: 'blue',
        gradient: 'from-blue-500 to-indigo-600',
        tag: '#hello-world',
        dbChannel: 'hello-world'
      },
      {
        id: 'hello-community',
        name: userOrgType && ORGANIZATION_CHANNELS[userOrgType] 
          ? `Hello ${ORGANIZATION_CHANNELS[userOrgType].name}` 
          : 'Hello Community-Wide',
        shortName: 'Community-Wide',
        description: userOrgType && ORGANIZATION_CHANNELS[userOrgType]
          ? `Connect with other ${ORGANIZATION_CHANNELS[userOrgType].name.toLowerCase()}`
          : 'Connect with your organization community',
        icon: Building,
        color: userOrgType && ORGANIZATION_CHANNELS[userOrgType] 
          ? ORGANIZATION_CHANNELS[userOrgType].color 
          : 'rose',
        gradient: userOrgType && ORGANIZATION_CHANNELS[userOrgType]
          ? ORGANIZATION_CHANNELS[userOrgType].gradient
          : 'from-rose-500 to-pink-600',
        tag: userOrgType && ORGANIZATION_CHANNELS[userOrgType]
          ? ORGANIZATION_CHANNELS[userOrgType].channelTag
          : '#community',
        dbChannel: userOrgType && ORGANIZATION_CHANNELS[userOrgType]
          ? ORGANIZATION_CHANNELS[userOrgType].dbChannel
          : 'hello-community',
        disabled: !organizationInfo
      },
      {
        id: 'hello-county',
        name: `Hello ${BAY_AREA_COUNTIES[userCounty]?.name || 'County'}`,
        shortName: BAY_AREA_COUNTIES[userCounty]?.name || 'County',
        description: `Local community in ${BAY_AREA_COUNTIES[userCounty]?.name || 'your area'}`,
        icon: MapPin,
        color: BAY_AREA_COUNTIES[userCounty]?.color || 'green',
        gradient: BAY_AREA_COUNTIES[userCounty]?.gradient || 'from-green-500 to-emerald-600',
        tag: `#${userCounty}-county`,
        dbChannel: `hello-county-${userCounty}`,
        disabled: true
      }
    ];

    return channels;
  };

  const channels = getChannelConfig();
  const activeChannelConfig = channels.find(c => c.id === activeChannel);

  // ✅ NEW: Load batched data whenever posts change
  useEffect(() => {
    if (posts.length > 0) {
      loadPostsPageData(posts);
    }
  }, [posts, loadPostsPageData]);

  // Reset posts when channel changes
  useEffect(() => {
    // ✅ NEW: Clear page data when changing channels
    clearPageData();
    resetPosts();
    fetchPosts(0, activeChannelConfig);
  }, [activeChannel, activeChannelConfig?.dbChannel, clearPageData]);

  // Channel change handler
  const handleChannelChange = (channelId) => {
    const channel = channels.find(c => c.id === channelId);
    if (channel && !channel.disabled) {
      setActiveChannel(channelId);
    }
  };

  // Handle clicking on trending post to scroll to it
  const handleTrendingPostClick = (postId) => {
    const postElement = document.getElementById(`post-${postId}`);
    if (postElement) {
      postElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      // Add highlight effect
      postElement.classList.add('ring-2', 'ring-blue-300', 'ring-opacity-50');
      setTimeout(() => {
        postElement.classList.remove('ring-2', 'ring-blue-300', 'ring-opacity-50');
      }, 3000);
    }
  };

  // ✅ NEW: Enhanced load more that triggers data loading
  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchPosts(nextPage, activeChannelConfig);
    // Data will be automatically loaded by the useEffect above when posts change
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* News Section */}
        <TrendingNews channelType={activeChannel} />

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Community Selector */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-4 sticky top-24">
              <h3 className="font-bold text-base text-slate-900 mb-4">Communities</h3>
              <div className="space-y-2">
                {channels.map((channel) => {
                  const IconComponent = channel.icon;
                  const isActive = activeChannel === channel.id;
                  const isDisabled = channel.disabled;
                  
                  return (
                    <button
                      key={channel.id}
                      onClick={() => handleChannelChange(channel.id)}
                      disabled={isDisabled}
                      className={`w-full p-3 rounded-lg transition-all duration-300 text-left group ${
                        isDisabled 
                          ? 'opacity-40 cursor-not-allowed bg-slate-50' 
                          : isActive 
                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-sm' 
                            : 'bg-slate-50 hover:bg-slate-100 border-2 border-transparent hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                          isActive 
                            ? `bg-gradient-to-r ${channel.gradient}` 
                            : 'bg-white shadow-sm'
                        }`}>
                          <IconComponent 
                            size={16} 
                            className={isActive ? 'text-white' : 'text-slate-600'} 
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-medium text-sm truncate ${
                            isDisabled 
                              ? 'text-slate-400'
                              : isActive 
                                ? 'text-slate-900' 
                                : 'text-slate-700'
                          }`}>
                            {channel.shortName}
                          </h4>
                        </div>
                        {isDisabled && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                            {channel.id === 'hello-community' ? 'Join' : 'Soon'}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Middle Column - Posts Feed */}
          <div className="lg:col-span-6 space-y-6">
            {activeChannelConfig && !activeChannelConfig.disabled ? (
              <>
                {/* Create Post */}
                <CreatePost 
                  profile={profile}
                  onNewPost={handleNewPost}
                  channel={activeChannelConfig.dbChannel}
                  organizationType={organizationInfo?.type}
                />

                {/* Posts Feed */}
                <div className="space-y-6">
                  {loading && posts.length === 0 ? (
                    <div className="space-y-6">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 animate-pulse">
                          <div className="flex items-center space-x-4 mb-6">
                            <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                            <div className="flex-1">
                              <div className="h-4 bg-slate-200 rounded mb-2 w-1/3"></div>
                              <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="h-4 bg-slate-200 rounded"></div>
                            <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : posts.length > 0 ? (
                    posts.map(post => (
                      <div key={post.id} id={`post-${post.id}`} className="transition-all duration-300">
                        {/* ✅ NEW: Pass pageData to PostCard */}
                        <PostCard 
                          post={post} 
                          onDelete={handleDeletePost}
                          pageData={pageData}
                        />
                      </div>
                    ))
                  ) : (
                    <EmptyState 
                      channelName={activeChannelConfig.name}
                      channelConfig={activeChannelConfig}
                    />
                  )}
                </div>

                {/* Load more */}
                {hasMore && posts.length > 0 && (
                  <div className="text-center">
                    <button 
                      onClick={handleLoadMore}
                      disabled={loading}
                      className="px-8 py-4 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-slate-300 rounded-2xl font-semibold text-slate-700 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="flex items-center space-x-3">
                          <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
                          <span>Loading amazing content...</span>
                        </div>
                      ) : (
                        'Load More Posts'
                      )}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/60 p-12 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-white to-red-50/30"></div>
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-r from-red-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-3xl">🔒</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Channel Not Available</h3>
                  <p className="text-slate-600 mb-8 max-w-md mx-auto leading-relaxed">
                    {activeChannelConfig?.id === 'hello-community' 
                      ? 'Join an organization to unlock community-specific channels and connect with your peers.'
                      : 'This exciting channel is coming soon! We\'re working hard to bring you amazing local community features.'}
                  </p>
                  <div className="space-y-3">
                    <button 
                      onClick={() => setActiveChannel('hello-world')}
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
                    >
                      Explore Platform-Wide Channel
                    </button>
                    {activeChannelConfig?.id === 'hello-community' && (
                      <p className="text-sm text-slate-500">
                        Complete your organization profile to unlock community features
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <Sidebar
            activeChannel={activeChannel}
            activeChannelConfig={activeChannelConfig}
            organizationInfo={organizationInfo}
            onTrendingPostClick={handleTrendingPostClick}
            posts={posts}
          />
        </div>
      </div>
    </div>
  );
}