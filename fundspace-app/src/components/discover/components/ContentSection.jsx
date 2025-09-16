// src/components/discover/components/ContentSection.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Building, DollarSign, MessageSquare } from 'lucide-react';
import { BAY_AREA_COUNTIES } from '../data/locationData.js';
import DemographicsSection from './DemographicsSection.jsx';
import StatsCards from './StatsCards.jsx';
import OrganizationCard from './OrganizationCard.jsx';
import GrantCard from './GrantCard.jsx';
import PostCard from './PostCard.jsx';

export default function ContentSection({ 
    selectedLocation, 
    viewType, 
    locationData, 
    loading, 
    activeTab, 
    setActiveTab 
}) {
    if (!selectedLocation) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <MapPin className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">Select a Community</h3>
                <p className="text-slate-600">Choose a county or city above to explore local organizations, grants, and community activity.</p>
            </div>
        );
    }

    const locationName = selectedLocation === 'bay-area' 
        ? 'Bay Area Communities'
        : viewType === 'counties' 
            ? BAY_AREA_COUNTIES[selectedLocation]?.name 
            : selectedLocation;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">{locationName}</h2>
                        <p className="text-slate-600">Community impact dashboard</p>
                    </div>
                    
                    {/* Tab Navigation */}
                    <div className="flex bg-slate-100 rounded-lg p-1">
                        {[
                            { id: 'overview', label: 'Overview' },
                            { id: 'organizations', label: 'Organizations' },
                            { id: 'grants', label: 'Grants' },
                            { id: 'posts', label: 'Posts' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    activeTab === tab.id 
                                        ? 'bg-white text-blue-600 shadow-sm' 
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-slate-600">Loading community data...</p>
                </div>
            ) : (
                <>
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <DemographicsSection demographics={locationData.demographics} />
                            <StatsCards stats={locationData.stats} />
                            
                            {/* Quick Overview Grid */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-slate-900">Top Organizations</h3>
                                        <Link 
                                            to="#"
                                            onClick={() => setActiveTab('organizations')}
                                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                        >
                                            View all →
                                        </Link>
                                    </div>
                                    <div className="space-y-3">
                                        {locationData.organizations.slice(0, 3).map((org) => (
                                            <div key={org.id} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                                                <div className="w-8 h-8 bg-slate-200 rounded overflow-hidden">
                                                    {org.image_url ? (
                                                        <img src={org.image_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Building className="w-4 h-4 text-slate-400 m-2" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-slate-900 truncate">{org.name}</p>
                                                    <p className="text-xs text-slate-500">{org.type}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-slate-900">Recent Grants</h3>
                                        <Link 
                                            to="#"
                                            onClick={() => setActiveTab('grants')}
                                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                        >
                                            View all →
                                        </Link>
                                    </div>
                                    <div className="space-y-3">
                                        {locationData.grants.slice(0, 3).map((grant) => (
                                            <div key={grant.id} className="p-3 bg-slate-50 rounded-lg">
                                                <p className="text-sm font-medium text-slate-900 line-clamp-1">{grant.title}</p>
                                                <p className="text-xs text-slate-500 mt-1">{grant.funding_amount_text}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'organizations' && (
                        <div className="space-y-4">
                            {locationData.organizations.length > 0 ? (
                                locationData.organizations.map((org) => (
                                    <OrganizationCard key={org.id} org={org} />
                                ))
                            ) : (
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                                    <Building className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-slate-900 mb-2">No organizations found</h3>
                                    <p className="text-slate-600">No organizations are currently listed for this location.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'grants' && (
                        <div className="space-y-4">
                            {locationData.grants.length > 0 ? (
                                locationData.grants.map((grant) => (
                                    <GrantCard key={grant.id} grant={grant} />
                                ))
                            ) : (
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                                    <DollarSign className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-slate-900 mb-2">No grants found</h3>
                                    <p className="text-slate-600">No grants are currently available for this location.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'posts' && (
                        <div className="space-y-4">
                            {locationData.posts.length > 0 ? (
                                locationData.posts.map((post) => (
                                    <PostCard key={post.id} post={post} />
                                ))
                            ) : (
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                                    <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-slate-900 mb-2">No posts found</h3>
                                    <p className="text-slate-600">No community posts mention this location yet.</p>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}