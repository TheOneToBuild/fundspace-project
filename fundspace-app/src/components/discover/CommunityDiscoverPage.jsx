// src/components/discover/CommunityDiscoverPage.jsx
import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import PublicPageLayout from '../PublicPageLayout.jsx';
import ContentSection from './components/ContentSection.jsx';
import { useLocationData } from './hooks/useLocationData.js';

export default function CommunityDiscoverPage() {
    const { profile: currentUserProfile } = useOutletContext();
    const [viewType, setViewType] = useState('counties'); // 'counties' or 'cities'
    const [selectedLocation, setSelectedLocation] = useState('bay-area'); // Default to Bay Area wide
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'organizations', 'grants', 'posts'
    
    const { locationData, loading } = useLocationData(selectedLocation, viewType);

    return (
        <PublicPageLayout bgColor="bg-[#faf7f4]">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
                <ContentSection 
                    selectedLocation={selectedLocation}
                    viewType={viewType}
                    setViewType={setViewType}
                    setSelectedLocation={setSelectedLocation}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    locationData={locationData}
                    loading={loading}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                />
            </div>
        </PublicPageLayout>
    );
}