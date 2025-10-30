// src/components/portal/LandscapeDataTab.jsx
import React, { useState } from 'react';
import ContentSection from '../discover/components/ContentSection.jsx';
import { useLocationData } from '../discover/hooks/useLocationData.js';

export default function LandscapeDataTab() {
    const [viewType, setViewType] = useState('counties'); // 'counties' or 'cities'
    const [selectedLocation, setSelectedLocation] = useState('bay-area'); // Default to Bay Area wide
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('overview'); // Changed from 'organizations' to 'overview'
    
    const { locationData, loading } = useLocationData(selectedLocation, viewType);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Community Landscape Data</h2>
                <p className="text-slate-600">
                    Explore comprehensive data and insights about communities, organizations, and funding trends in your region.
                </p>
            </div>

            {/* Content Section */}
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
    );
}