import React, { useState, useEffect } from 'react';
import { MapPin, Building, DollarSign, MessageSquare, ArrowUpRight, Clock } from 'lucide-react';
import { BAY_AREA_COUNTIES } from '../data/locationData.js';
import { useDashboardStats } from '../hooks/useDashboardStats.js';
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
                        isVisible={isVisible}
                    />
                )}
            </div>
        );
    }

    if (activeTab === 'organizations') {
        const organizations = locationData?.organizations || [];
        
        if (organizations.length === 0) {
            return (
                <EmptyState 
                    icon={Building}
                    title="No organizations found"
                    description="We're still gathering data for this community. Check back soon!"
                    bgColor="from-blue-100 to-blue-200"
                />
            );
        }

        return (
            <div className="space-y-6">
                <p className="text-slate-600 text-center">
                    Showing {organizations.length} organizations in this community
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {organizations.map((organization, index) => (
                        <OrganizationCard 
                            key={organization.id || index}
                            organization={organization}
                            index={index}
                            isVisible={isVisible}
                        />
                    ))}
                </div>
            </div>
        );
    }

    if (activeTab === 'grants') {
        const grants = locationData?.grants || [];
        
        if (grants.length === 0) {
            return (
                <EmptyState 
                    icon={DollarSign}
                    title="No active grants found"
                    description="We're constantly updating our grant database. New opportunities may be available soon!"
                    bgColor="from-green-100 to-green-200"
                />
            );
        }

        return (
            <div className="space-y-6">
                <p className="text-slate-600 text-center">
                    Showing {grants.length} active grants for this community
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {grants.map((grant, index) => (
                        <GrantCard 
                            key={grant.id || index}
                            grant={grant}
                            index={index}
                            isVisible={isVisible}
                        />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <EmptyState 
            icon={MessageSquare}
            title="Coming Soon"
            description="This section is under development. Stay tuned for updates!"
            bgColor="from-purple-100 to-purple-200"
        />
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
}) {
    const [isDashboardVisible, setIsDashboardVisible] = useState(false);
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
            <div className="space-y-8">
                <DashboardBanner 
                    selectedLocation={selectedLocation}
                    setSelectedLocation={setSelectedLocation}
                    viewType={viewType}
                    setViewType={setViewType}
                    dashboardStats={dashboardStats}
                    isVisible={isDashboardVisible}
                />

                <TabContent 
                    activeTab={activeTab}
                    locationData={locationData}
                    isVisible={isContentVisible}
                    dashboardStats={dashboardStats}
                />
            </div>
        </>
    );
};