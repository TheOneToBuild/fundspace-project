import { useState, useEffect } from 'react';
import { DEMOGRAPHICS_DATA } from '../data/demographics/index.js';
import { BAY_AREA_COUNTIES } from '../data/locationData.js';
import { getLocationData } from '../../../utils/rpcClientFunctions';

export function useLocationData(selectedLocation, viewType) {
    const [locationData, setLocationData] = useState({
        organizations: [],
        grants: [],
        posts: [],
        stats: { totalOrgs: 0, totalGrants: 0, totalPosts: 0 },
        demographics: null
    });
    const [loading, setLoading] = useState(false);

    const fetchLocationData = async (location, type) => {
        if (!location) return;
        
        setLoading(true);
        try {
            let locationParam;
            let locationQuery;
            let demographics = null;

            if (location === 'bay-area') {
                locationParam = 'bay-area';
                locationQuery = '%';
                demographics = DEMOGRAPHICS_DATA['bay-area'];
            } else if (type === 'counties') {
                // Pass the slug directly as locationParam
                locationParam = location; // e.g., "santa-clara-county"
                locationQuery = `%${BAY_AREA_COUNTIES[location]?.name || location}%`;
                demographics = DEMOGRAPHICS_DATA[location];
            } else {
                // Cities
                locationParam = location;
                locationQuery = `%${location}%`;
                demographics = DEMOGRAPHICS_DATA[location];
                
                if (!demographics) {
                    const capitalizedLocation = location.charAt(0).toUpperCase() + location.slice(1);
                    demographics = DEMOGRAPHICS_DATA[capitalizedLocation];
                }
            }

            const data = await getLocationData(locationParam, locationQuery);

            const finalData = {
                organizations: data?.organizations || [],
                grants: data?.grants || [],
                posts: data?.posts || [],
                stats: data?.stats || {
                    totalOrgs: 0,
                    totalGrants: 0,
                    totalPosts: 0
                },
                demographics
            };
            
            setLocationData(finalData);

        } catch (error) {
            console.error('Error fetching location data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedLocation) {
            fetchLocationData(selectedLocation, viewType);
        }
    }, [selectedLocation, viewType]);

    return { locationData, loading };
}