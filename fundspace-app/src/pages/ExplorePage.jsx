// fundspace-app/src/pages/ExplorePage.jsx
import React, { useState } from 'react';
import { Search, MapPin, Filter } from 'lucide-react';
import ExploreGrantsTab from '../components/explore/ExploreGrantsTab.jsx';
import ExploreRequestsTab from '../components/explore/ExploreRequestsTab.jsx';
import ExploreWinsTab from '../components/explore/ExploreWinsTab.jsx';

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState('organizations');
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');

  const tabs = [
    { id: 'organizations', label: 'Organizations' },
    { id: 'grants', label: 'Available Grants' },
    { id: 'requests', label: 'Requests for Funds' },
    { id: 'wins', label: 'Recent Fund Wins' }
  ];

  const handleSearch = () => {
    // Pass search params to active tab component
    console.log('Searching:', { searchQuery, location, category, activeTab });
  };

  const renderTabContent = () => {
    const searchParams = { searchQuery, location, category };
    
    switch (activeTab) {
      case 'organizations':
        return <ExploreOrganizationsTab searchParams={searchParams} />;
      case 'grants':
        return <ExploreGrantsTab searchParams={searchParams} />;
      case 'requests':
        return <ExploreRequestsTab searchParams={searchParams} />;
      case 'wins':
        return <ExploreWinsTab searchParams={searchParams} />;
      default:
        return <ExploreOrganizationsTab searchParams={searchParams} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#faf7f4]">
      {/* Hero Section with Search */}
      <div className="bg-[#faf7f4] pt-12 pb-8">
        <div className="max-w-5xl mx-auto px-6">
          <h1 className="text-4xl font-bold text-gray-900 text-center mb-3">
            Explore Funding Opportunities
          </h1>
          <p className="text-lg text-gray-600 text-center mb-10">
            Discover organizations, grants, and funding opportunities that match your mission
          </p>

          {/* Search Bar with Integrated Tabs */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Search Input Row */}
            <div className="flex items-center gap-3 p-3 border-b border-gray-200">
              <div className="flex-1 flex items-center gap-3 px-4 py-2">
                <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search for organizations, grants, or opportunities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full outline-none text-gray-900 placeholder-gray-400 bg-transparent"
                />
              </div>
              
              <div className="flex items-center gap-3 px-4 py-2 border-l border-gray-200">
                <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-32 outline-none text-gray-900 placeholder-gray-400 bg-transparent"
                />
              </div>
              
              <div className="flex items-center gap-3 px-4 py-2 border-l border-gray-200">
                <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="outline-none text-gray-900 cursor-pointer bg-transparent pr-2"
                >
                  <option value="">Category</option>
                  <option value="education">Education</option>
                  <option value="health">Health</option>
                  <option value="environment">Environment</option>
                  <option value="arts">Arts & Culture</option>
                  <option value="community">Community</option>
                </select>
              </div>
              
              <button 
                onClick={handleSearch}
                className="bg-gray-900 text-white px-8 py-3 rounded-xl hover:bg-gray-800 transition-colors font-medium"
              >
                Search
              </button>
            </div>

            {/* Tabs Row - Integrated */}
            <div className="flex gap-0 bg-gray-50">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-6 py-4 font-medium transition-all relative ${
                    activeTab === tab.id
                      ? 'text-gray-900 bg-white'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {renderTabContent()}
      </div>
    </div>
  );
}