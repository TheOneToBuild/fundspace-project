import React, { useState, useEffect } from 'react';
import { MapPin, Building, DollarSign, MessageSquare, ArrowUpRight, Clock } from 'lucide-react';
import { BAY_AREA_COUNTIES } from '../data/locationData.js';
import { useDashboardStats } from '../hooks/useDashboardStats.js';
import StatsCards from './StatsCards.jsx';
import DemographicsSection from './DemographicsSection.jsx';
import DashboardBanner from './DashboardBanner.jsx';
import OrganizationCard from './OrganizationCard.jsx';
import GrantCard from './GrantCard.jsx';
import PostCard from './PostCard.jsx';
import TabNavigation from './TabNavigation.jsx';

const AnimationStyles = () => {
    React.useEffect(() => {
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
        
        return () => {
            document.head.removeChild(styleElement);
        };
    }, []);
    
    return null;
};

const OverviewGrid = ({ locationData, setActiveTab, isVisible }) => {
    const sections = [
        {
            title: 'Top Organizations',
            subtitle: 'Leading community impact',
            icon: Building,
            gradient: 'from-blue-400 to-blue-600',
            data: locationData?.organizations || [
                { id: 1, name: 'Bay Area Legal Aid', type: 'Legal Services', image_url: null },
                { id: 2, name: 'Silicon Valley Community Foundation', type: 'Foundation', image_url: null },
                { id: 3, name: 'Oakland Museum of California', type: 'Arts & Culture', image_url: null }
            ]
        },
        {
            title: 'Active Grants',
            subtitle: 'Available funding opportunities',
            icon: DollarSign,
            gradient: 'from-emerald-400 to-emerald-600',
            data: locationData?.grants || [
                { id: 1, title: 'Youth Education Initiative', amount: '$50,000', deadline: '2024-12-15' },
                { id: 2, title: 'Community Health Program', amount: '$25,000', deadline: '2024-11-30' },
                { id: 3, title: 'Environmental Conservation', amount: '$75,000', deadline: '2025-01-15' }
            ]
        },
        {
            title: 'Recent Posts',
            subtitle: 'Community updates',
            icon: MessageSquare,
            gradient: 'from-purple-400 to-purple-600',
            data: locationData?.posts || [
                { id: 1, content: 'Excited to announce our new partnership!', author: 'Bay Area Foundation', date: '2024-10-15' },
                { id: 2, content: 'Join us for our annual community gathering', author: 'Oakland Museum', date: '2024-10-14' },
                { id: 3, content: 'Thank you for your continued support', author: 'Legal Aid Society', date: '2024-10-13' }
            ]
        }
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {sections.map((section, sectionIndex) => (
                <div 
                    key={sectionIndex} 
                    className="bg-white rounded-3xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    style={{
                        animation: isVisible ? `slideInUp 0.6s ease-out ${sectionIndex * 0.2}s both` : 'none'
                    }}
                >
                    <div className="flex items-center gap-4 mb-6">
                        <div className={`w-12 h-12 bg-gradient-to-br ${section.gradient} rounded-2xl flex items-center justify-center shadow-lg`}>
                            <section.icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-lg">{section.title}</h3>
                            <p className="text-sm text-slate-600">{section.subtitle}</p>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        {section.data.slice(0, 3).map((item, index) => (
                            <div key={item.id} className="group">
                                {section.title === 'Top Organizations' && (
                                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
                                        <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center">
                                            <Building className="w-5 h-5 text-slate-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                                                {item.name}
                                            </p>
                                            <p className="text-xs text-slate-600">{item.type}</p>
                                        </div>
                                        <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                    </div>
                                )}
                                
                                {section.title === 'Active Grants' && (
                                    <div className="p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all cursor-pointer group">
                                        <div className="flex items-start justify-between mb-2">
                                            <p className="font-semibold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors line-clamp-1">
                                                {item.title}
                                            </p>
                                            <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                                                {item.amount}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-3 h-3 text-slate-400" />
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                                new Date(item.deadline) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
                                                    ? 'text-red-700 bg-red-50' 
                                                    : 'text-orange-700 bg-orange-50'
                                            }`}>
                                                {item.deadline}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                
                                {section.title === 'Recent Posts' && (
                                    <div className="p-3 rounded-xl hover:bg-purple-50/50 transition-colors cursor-pointer group">
                                        <p className="text-sm text-slate-700 mb-2 line-clamp-2 group-hover:text-purple-700 transition-colors">
                                            {item.content}
                                        </p>
                                        <div className="flex items-center justify-between text-xs text-slate-500">
                                            <span>{item.author}</span>
                                            <span>{item.date}</span>
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

const TabContent = ({ activeTab, locationData, isVisible, dashboardStats }) => {
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
                {locationData?.demographics && (
                    <DemographicsSection 
                        demographics={locationData.demographics}
                        isVisible={isVisible} // Changed
                    />
                )}
                <StatsCards 
                    stats={{
                        totalOrgs: dashboardStats.totalOrganizations,
                        totalGrants: locationData?.stats?.totalGrants ?? 0,
                        totalPosts: locationData?.stats?.totalPosts ?? 0
                    }} 
                    isVisible={isVisible} 
                />
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
                                bgColor="from-blue-100 to-blue-200"
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
}) {const [isDashboardVisible, setIsDashboardVisible] = useState(false);
const [isContentVisible, setIsContentVisible] = useState(false);
    const [previousLocation, setPreviousLocation] = useState(selectedLocation);
    const [previousTab, setPreviousTab] = useState(activeTab);
    
    const dashboardStats = useDashboardStats(selectedLocation);

    // Dashboard visibility - only changes with location
    useEffect(() => {
        if (selectedLocation !== previousLocation) {
            setIsDashboardVisible(false);
            const timer = setTimeout(() => {
                setIsDashboardVisible(true);
                setPreviousLocation(selectedLocation);
            }, 150);
            
            return () => clearTimeout(timer);
        } else if (!loading && locationData && !isDashboardVisible) {
            setIsDashboardVisible(true);
        }
    }, [selectedLocation, previousLocation, loading, locationData, isDashboardVisible]);

    // Content visibility - changes with tabs
    useEffect(() => {
        if (activeTab !== previousTab) {
            setIsContentVisible(false);
            const timer = setTimeout(() => {
                setIsContentVisible(true);
                setPreviousTab(activeTab);
            }, 100);
            
            return () => clearTimeout(timer);
        } else if (!isContentVisible) {
            setIsContentVisible(true);
        }
    }, [activeTab, previousTab, isContentVisible]);

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
            ? BAY_AREA_COUNTIES[selectedLocation]?.name || selectedLocation
            : selectedLocation;

    return (
        <>
            <AnimationStyles />
            
            <DashboardBanner 
                selectedLocation={selectedLocation}
                locationName={locationName}
                viewType={viewType}
                setViewType={setViewType}
                setSelectedLocation={setSelectedLocation}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                isVisible={isDashboardVisible}  // Use isDashboardVisible instead of isVisible
            />

            <TabNavigation 
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                stats={dashboardStats}
            />

            <TabContent 
                activeTab={activeTab} 
                locationData={locationData} 
                isVisible={isContentVisible}  // Use isContentVisible instead of isVisible
                dashboardStats={dashboardStats}
            />
        </>
    );
}