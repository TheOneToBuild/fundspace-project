import React from 'react';
import { ChevronDown, BarChart3, Building, DollarSign, MessageSquare, MapPin, Users, FileText, Trophy } from 'lucide-react';
import { BAY_AREA_COUNTIES, MAJOR_CITIES } from '../data/locationData.js';
import { COMMUNITY_IMAGES, DEFAULT_COMMUNITY_IMAGE } from '../data/communityImages.js';
import { useDashboardStats } from '../hooks/useDashboardStats.js';
import AnimatedCounter from '../../AnimatedCounter.jsx';

export default function DashboardBanner({ 
    selectedLocation,
    locationName,
    viewType,
    setViewType,
    setSelectedLocation,
    searchQuery,
    setSearchQuery,
    isVisible 
}) {
    const dashboardStats = useDashboardStats(selectedLocation);
    const isCountySelected = selectedLocation === 'bay-area' || Object.keys(BAY_AREA_COUNTIES).includes(selectedLocation);
    const selectedCounty = isCountySelected ? 
        selectedLocation : 
        Object.keys(MAJOR_CITIES).find(county => MAJOR_CITIES[county].includes(selectedLocation));

    const getDisplayName = (location) => {
        if (location === 'bay-area') {
            return 'Bay Area (All Counties)';
        }
        if (Object.keys(BAY_AREA_COUNTIES).includes(location)) {
            return BAY_AREA_COUNTIES[location]?.name;
        }
        return location;
    };

    const handleCountyChange = (countySlug) => {
        setSelectedLocation(countySlug);
        setViewType('counties');
    };

    const handleCityChange = (city) => {
        setSelectedLocation(city);
        setViewType('cities');
    };

    const communityImage = COMMUNITY_IMAGES[selectedLocation] || DEFAULT_COMMUNITY_IMAGE;

    const formatMonetaryValue = (value) => {
        if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
        if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
        return `$${value.toLocaleString()}`;
    };

    const formatRegularValue = (value) => {
        return value.toLocaleString();
    };

    const metricsData = [
        { 
            label: 'Total Funding', 
            value: dashboardStats.totalFunding,
            change: dashboardStats.changes.funding, 
            color: 'text-emerald-600',
            isMoney: true
        },
        { 
            label: 'Total Active Funds', 
            value: dashboardStats.totalActiveFunds, 
            change: dashboardStats.changes.activeFunds, 
            color: 'text-purple-600',
            isMoney: true
        },
        { 
            label: 'Total Organizations', 
            value: dashboardStats.totalOrganizations, 
            change: dashboardStats.changes.organizations, 
            color: 'text-blue-600',
            isMoney: false
        },
        { 
            label: 'Total Champions', 
            value: dashboardStats.totalChampions, 
            change: dashboardStats.changes.champions, 
            color: 'text-orange-600',
            isMoney: false
        }
    ];

    return (
        <div 
            className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden mb-8"
            style={{
                animation: isVisible ? 'slideInUp 0.6s ease-out both' : 'none'
            }}
        >
            <div className="p-8">
                <div className="flex items-start justify-between mb-8">
                    {/* Left side - Image and Title */}
                    <div className="flex items-center gap-6">
                        <div className="w-32 h-32 rounded-3xl shadow-lg relative overflow-hidden">
                            <img 
                                src={communityImage} 
                                alt={locationName}
                                className="w-full h-full object-cover rounded-3xl"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextElementSibling.style.display = 'flex';
                                }}
                            />
                            <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center absolute inset-0 hidden">
                                <span className="text-white font-bold text-5xl relative z-10">🏞️</span>
                                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-slate-900 mb-2">{locationName}</h1>
                            <p className="text-slate-600 text-lg">Community impact dashboard</p>
                            <div className="flex items-center gap-4 mt-4">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full">
                                    <div className={`w-2 h-2 rounded-full ${dashboardStats.loading ? 'bg-yellow-500 animate-pulse' : 'bg-blue-500 animate-pulse'}`} />
                                    <span className="text-xs font-medium text-blue-700">
                                        {dashboardStats.loading ? 'Loading...' : 'Live Data'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full">
                                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                                    <span className="text-xs font-medium text-green-700">Updated Today</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right side - Community Selector (always shows both dropdowns with fixed width) */}
                    <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-slate-900">Community:</span>
                        <div className="relative w-52">
                            <select
                                value={selectedCounty || 'bay-area'}
                                onChange={(e) => handleCountyChange(e.target.value)}
                                className="w-full pl-3 pr-10 py-2.5 border-2 border-blue-500 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none font-medium"
                            >
                                <option value="bay-area">Bay Area (All Counties)</option>
                                {Object.entries(BAY_AREA_COUNTIES).map(([slug, county]) => (
                                    <option key={slug} value={slug}>
                                        {county.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                        </div>
                        <div className="relative w-44">
                            {selectedCounty && selectedCounty !== 'bay-area' && MAJOR_CITIES[selectedCounty] ? (
                                <>
                                    <select
                                        value={!isCountySelected ? selectedLocation : ''}
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                handleCityChange(e.target.value);
                                            } else {
                                                handleCountyChange(selectedCounty);
                                            }
                                        }}
                                        className="w-full pl-3 pr-10 py-2.5 border-2 border-blue-500 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none font-medium"
                                    >
                                        <option value="">All Cities</option>
                                        {MAJOR_CITIES[selectedCounty].map(city => (
                                            <option key={city} value={city}>
                                                {city}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                                </>
                            ) : (
                                <div className="w-full h-[42px]"></div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Metrics */}
                <div className="mt-8 pt-6 border-t border-slate-100">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {metricsData.map((metric, index) => {
                            return (
                                <div 
                                    key={index}
                                    className="text-center group"
                                    style={{
                                        animation: isVisible ? `slideInUp 0.4s ease-out ${0.1 + (index * 0.1)}s both` : 'none'
                                    }}
                                >
                                    <div className="relative">
                                        <div className="text-2xl font-bold mb-1 group-hover:scale-110 transition-transform duration-200 text-slate-900">
                                            {dashboardStats.loading ? (
                                                '...'
                                            ) : (
                                                <AnimatedCounter 
                                                    targetValue={metric.value}
                                                    duration={metric.isMoney ? 2000 : 1800}
                                                    formatValue={metric.isMoney ? formatMonetaryValue : formatRegularValue}
                                                    className="text-2xl font-bold"
                                                />
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-600 uppercase tracking-wide font-medium mb-2">
                                            {metric.label}
                                        </p>
                                        {metric.change !== '+0%' && !dashboardStats.loading && (
                                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-50 ${metric.color} text-xs font-medium`}>
                                                <span>↗</span>
                                                {metric.change}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}