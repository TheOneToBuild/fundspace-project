// src/components/discover/components/LocationSelector.jsx
import React from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { BAY_AREA_COUNTIES, MAJOR_CITIES } from '../data/locationData.js';

export default function LocationSelector({ 
    viewType, 
    setViewType, 
    selectedLocation, 
    setSelectedLocation, 
    searchQuery, 
    setSearchQuery 
}) {
    // Determine if current selection is a county or city
    const isCountySelected = selectedLocation === 'bay-area' || Object.keys(BAY_AREA_COUNTIES).includes(selectedLocation);
    const selectedCounty = isCountySelected ? selectedLocation : 
        Object.keys(MAJOR_CITIES).find(county => MAJOR_CITIES[county].includes(selectedLocation));

    const getDisplayName = (location) => {
        if (location === 'bay-area') {
            return 'Bay Area (All Counties)';
        }
        if (Object.keys(BAY_AREA_COUNTIES).includes(location)) {
            return BAY_AREA_COUNTIES[location]?.name;
        }
        return location; // City name
    };

    const handleCountyChange = (countySlug) => {
        setSelectedLocation(countySlug);
        setViewType('counties'); // Set to counties when selecting a county
    };

    const handleCityChange = (city) => {
        setSelectedLocation(city);
        setViewType('cities'); // Set to cities when selecting a city
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-slate-900">Community:</span>
                </div>
                
                <div className="flex items-center gap-3 flex-1 flex-wrap">
                    {/* County Dropdown */}
                    <div className="relative min-w-48">
                        <select
                            value={selectedCounty || 'bay-area'}
                            onChange={(e) => handleCountyChange(e.target.value)}
                            className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
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

                    {/* City Dropdown - Only show if a specific county is selected */}
                    {selectedCounty && selectedCounty !== 'bay-area' && MAJOR_CITIES[selectedCounty] && (
                        <>
                            <span className="text-slate-400">→</span>
                            <div className="relative min-w-40">
                                <select
                                    value={!isCountySelected ? selectedLocation : ''}
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            handleCityChange(e.target.value);
                                        } else {
                                            handleCountyChange(selectedCounty);
                                        }
                                    }}
                                    className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                                >
                                    <option value="">All Cities</option>
                                    {MAJOR_CITIES[selectedCounty].map(city => (
                                        <option key={city} value={city}>
                                            {city}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                            </div>
                        </>
                    )}

                    {/* Selected Location Display */}
                    {selectedLocation && selectedLocation !== 'bay-area' && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm">
                            <span className="font-medium">
                                {getDisplayName(selectedLocation)}
                            </span>
                            <button
                                onClick={() => setSelectedLocation('bay-area')}
                                className="text-blue-500 hover:text-blue-700 ml-1"
                                title="Clear selection"
                            >
                                ×
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}