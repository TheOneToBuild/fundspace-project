// src/components/discover/components/ContentSection.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Building, DollarSign, MessageSquare, BarChart3, ArrowUpRight, Clock, Star } from 'lucide-react';
import { BAY_AREA_COUNTIES } from '../data/locationData.js';
import StatsCards from './StatsCards.jsx';
import DemographicsSection from './DemographicsSection.jsx';
import InsightsCards from './InsightsCards.jsx';
import QuickActionsPanel from './QuickActionsPanel.jsx';
import DashboardBanner from './DashboardBanner.jsx';
import OrganizationCard from './OrganizationCard.jsx';
import GrantCard from './GrantCard.jsx';
import PostCard from './PostCard.jsx';

// Animation Styles Component
const AnimationStyles = () => {
    React.useEffect(() => {
        // Inject CSS styles into the document head
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            @keyframes slideInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @keyframes slideInRight {
                from {
                    opacity: 0;
                    transform: translateX(15px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            @keyframes growUp {
                from {
                    height: 0;
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }
            
            @keyframes fadeIn {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }
            
            * {
                animation-fill-mode: both;
            }
        `;
        
        document.head.appendChild(styleElement);
        
        // Cleanup function to remove styles when component unmounts
        return () => {
            document.head.removeChild(styleElement);
        };
    }, []);
    
    return null;
};

// Header Component - REMOVED (replaced by DashboardBanner)

// Overview Grid Component
const OverviewGrid = ({ locationData, setActiveTab, isVisible }) => {
    const sections = [
        {
            title: 'Top Organizations',
            subtitle: 'Leading community impact',
            icon: Building,
            gradient: 'from-blue-400 to-blue-600',
            data: locationData?.organizations || [
                { id: 1, name: 'Bay Area Legal Aid', type: 'Legal Services', image_url: null },
                { id: 2, name: 'San Francisco Bay Restoration Authority', type: 'Environmental', image_url: null },
                { id: 3, name: 'Silicon Valley Social Venture Fund', type: 'Fundraising', image_url: null }
            ],
            linkAction: () => setActiveTab('organizations'),
            type: 'organizations'
        },
        {
            title: 'Recent Grants',
            subtitle: 'Latest funding opportunities',
            icon: DollarSign,
            gradient: 'from-emerald-400 to-emerald-600',
            data: [
                { title: 'Community Grants & Investment Program', amount: '$1,000-$40,000', deadline: '3 days left', urgent: true },
                { title: 'Joint Institute for Wood Products Innovation Grant', amount: '$5,000-$450,000', deadline: '1 week left', urgent: false },
                { title: 'Household Hazardous Waste Grant', amount: '$500,000', deadline: '2 weeks left', urgent: false }
            ],
            linkAction: () => setActiveTab('grants'),
            type: 'grants'
        }
    ];

    return (
        <div className="grid md:grid-cols-2 gap-8">
            {sections.map((section, sectionIndex) => (
                <div 
                    key={sectionIndex}
                    className="bg-white rounded-3xl shadow-lg border border-slate-200 p-8"
                    style={{
                        animation: isVisible ? `slideInUp 0.6s ease-out ${1.0 + (sectionIndex * 0.2)}s both` : 'none'
                    }}
                >
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 bg-gradient-to-br ${section.gradient} rounded-2xl flex items-center justify-center`}>
                                <section.icon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">{section.title}</h3>
                                <p className="text-sm text-slate-600">{section.subtitle}</p>
                            </div>
                        </div>
                        <Link 
                            to="#"
                            onClick={section.linkAction}
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-semibold group"
                        >
                            View all
                            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </Link>
                    </div>
                    
                    <div className="space-y-4">
                        {section.data.slice(0, 3).map((item, itemIndex) => (
                            <div 
                                key={itemIndex}
                                className="flex items-center gap-5 p-5 rounded-2xl hover:bg-slate-50 transition-all duration-300 group cursor-pointer"
                                style={{
                                    animation: isVisible ? `slideInRight 0.4s ease-out ${1.2 + (sectionIndex * 0.2) + (itemIndex * 0.1)}s both` : 'none'
                                }}
                            >
                                {section.type === 'organizations' ? (
                                    <>
                                        <div className="relative">
                                            <div className="w-14 h-14 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center">
                                                {item.image_url ? (
                                                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover rounded-2xl" />
                                                ) : (
                                                    <Building className="w-7 h-7 text-slate-500" />
                                                )}
                                            </div>
                                            <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center ${
                                                itemIndex === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' : 
                                                itemIndex === 1 ? 'bg-gradient-to-r from-emerald-400 to-teal-400' : 
                                                'bg-gradient-to-r from-blue-400 to-indigo-400'
                                            }`}>
                                                <Star className="w-3 h-3 text-white" />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors text-lg">{item.name}</p>
                                            <p className="text-sm text-slate-600">{item.type}</p>
                                        </div>
                                        <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                                    </>
                                ) : (
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-3">
                                            <h4 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 text-base flex-1">{item.title}</h4>
                                            <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors flex-shrink-0 ml-3" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-base font-bold text-emerald-600">{item.amount}</span>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-slate-400" />
                                                <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                                                    item.urgent 
                                                        ? 'text-red-700 bg-red-50' 
                                                        : 'text-orange-700 bg-orange-50'
                                                }`}>
                                                    {item.deadline}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

// Tab Content Component
const TabContent = ({ activeTab, locationData, isVisible }) => {
    const EmptyState = ({ icon: Icon, title, description, bgColor }) => (
        <div className="text-center py-16">
            <div className={`w-24 h-24 bg-gradient-to-br ${bgColor} rounded-full mx-auto mb-6 flex items-center justify-center`}>
                <Icon className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">{title}</h3>
            <p className="text-slate-600">{description}</p>
        </div>
    );

    if (activeTab === 'overview') {
        return (
            <div className="space-y-8">
                <DemographicsSection demographics={locationData?.demographics} isVisible={isVisible} />
                <StatsCards stats={locationData?.stats} isVisible={isVisible} />
                <InsightsCards isVisible={isVisible} />
                <QuickActionsPanel isVisible={isVisible} />
                <OverviewGrid locationData={locationData} setActiveTab={() => {}} isVisible={isVisible} />
            </div>
        );
    }

    return (
        <div 
            className="bg-white rounded-3xl shadow-lg border border-slate-200 p-8"
            style={{
                animation: isVisible ? 'fadeIn 0.6s ease-out both' : 'none'
            }}
        >
            <div className="space-y-6">
                {activeTab === 'organizations' && (
                    <>
                        {(locationData?.organizations || []).map((org, index) => (
                            <div
                                key={org.id}
                                style={{
                                    animation: isVisible ? `slideInUp 0.4s ease-out ${index * 0.1}s both` : 'none'
                                }}
                            >
                                <OrganizationCard organization={org} />
                            </div>
                        ))}
                        {(!locationData?.organizations || locationData.organizations.length === 0) && (
                            <EmptyState 
                                icon={Building}
                                title="No organizations found"
                                description="There are no organizations in this area yet."
                                bgColor="from-slate-100 to-slate-200"
                            />
                        )}
                    </>
                )}

                {activeTab === 'grants' && (
                    <>
                        {(locationData?.grants || []).map((grant, index) => (
                            <div
                                key={grant.id}
                                style={{
                                    animation: isVisible ? `slideInUp 0.4s ease-out ${index * 0.1}s both` : 'none'
                                }}
                            >
                                <GrantCard grant={grant} />
                            </div>
                        ))}
                        {(!locationData?.grants || locationData.grants.length === 0) && (
                            <EmptyState 
                                icon={DollarSign}
                                title="No grants found"
                                description="There are no active grants in this area yet."
                                bgColor="from-emerald-100 to-emerald-200"
                            />
                        )}
                    </>
                )}

                {activeTab === 'posts' && (
                    <>
                        {(locationData?.posts || []).map((post, index) => (
                            <div
                                key={post.id}
                                style={{
                                    animation: isVisible ? `slideInUp 0.4s ease-out ${index * 0.1}s both` : 'none'
                                }}
                            >
                                <PostCard post={post} />
                            </div>
                        ))}
                        {(!locationData?.posts || locationData.posts.length === 0) && (
                            <EmptyState 
                                icon={MessageSquare}
                                title="No posts found"
                                description="There are no community posts in this area yet."
                                bgColor="from-purple-100 to-purple-200"
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

// Main ContentSection Component
export default function ContentSection({ 
    selectedLocation, 
    viewType,
    setViewType,
    setSelectedLocation,
    searchQuery,
    setSearchQuery,
    locationData, 
    loading, 
    activeTab, 
    setActiveTab 
}) {
    const [isVisible, setIsVisible] = useState(false);
    const [previousLocation, setPreviousLocation] = useState(selectedLocation);
    const [previousTab, setPreviousTab] = useState(activeTab);

    // Handle location changes - seamless animation
    useEffect(() => {
        if (selectedLocation !== previousLocation) {
            setIsVisible(false);
            // Only reset when location actually changes
            const timer = setTimeout(() => {
                setIsVisible(true);
                setPreviousLocation(selectedLocation);
            }, 150);
            
            return () => clearTimeout(timer);
        } else if (!loading && locationData && !isVisible) {
            // Initial load or data ready
            setIsVisible(true);
        }
    }, [selectedLocation, previousLocation, loading, locationData, isVisible]);

    // Handle tab switching - immediate smooth transition
    useEffect(() => {
        if (activeTab !== previousTab) {
            setIsVisible(false);
            const timer = setTimeout(() => {
                setIsVisible(true);
                setPreviousTab(activeTab);
            }, 100);
            
            return () => clearTimeout(timer);
        }
    }, [activeTab, previousTab]);

    // No location selected state
    if (!selectedLocation) {
        return (
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl shadow-lg border border-slate-200 p-16 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <MapPin className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Select a Community</h3>
                <p className="text-slate-600 text-lg">Choose a county or city above to explore local organizations, grants, and community activity.</p>
            </div>
        );
    }

    const locationName = selectedLocation === 'bay-area' 
        ? 'Bay Area Communities'
        : viewType === 'counties' 
            ? BAY_AREA_COUNTIES[selectedLocation]?.name 
            : selectedLocation;

    return (
        <>
            <AnimationStyles />
            <div className="space-y-8">
                <DashboardBanner 
                    selectedLocation={selectedLocation}
                    locationName={locationName}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    viewType={viewType}
                    setViewType={setViewType}
                    setSelectedLocation={setSelectedLocation}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    isVisible={isVisible}
                />

                {loading ? (
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl shadow-lg border border-slate-200 p-16 text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-400 border-t-transparent mb-6"></div>
                        <p className="text-slate-600 text-lg">Loading community data...</p>
                    </div>
                ) : (
                    <TabContent 
                        activeTab={activeTab}
                        locationData={locationData}
                        isVisible={isVisible}
                    />
                )}
            </div>
        </>
    );
}