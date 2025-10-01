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
            let locationQuery;
            let demographics = null;

            if (location === 'bay-area') {
                locationQuery = '%Bay Area%,%California%';
                demographics = DEMOGRAPHICS_DATA['bay-area'];
            } else {
                locationQuery = type === 'counties' 
                    ? `%${BAY_AREA_COUNTIES[location]?.name || location}%`
                    : `%${location}%`;
                
                demographics = DEMOGRAPHICS_DATA[location];
                
                if (!demographics && type === 'cities') {
                    const capitalizedLocation = location.charAt(0).toUpperCase() + location.slice(1);
                    demographics = DEMOGRAPHICS_DATA[capitalizedLocation];
                }
            }

            // Single RPC call instead of 3 REST queries
            const data = await getLocationData(location, locationQuery);

            const finalData = {
                organizations: data.organizations || [],
                grants: data.grants || [],
                posts: data.posts || [],
                stats: data.stats || {
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