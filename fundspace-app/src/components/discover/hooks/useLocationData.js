// src/components/discover/hooks/useLocationData.js
import { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { BAY_AREA_COUNTIES } from '../data/locationData.js';
// Import our new FIPS code data
import { COUNTY_FIPS_CODES, STATE_FIPS_CODE } from '../data/fipsData.js';

// --- Helper Function to Fetch and Format Census Data ---
async function fetchDemographics(location, type) {
    // For city-level data, the API is more complex. We'll focus on county data for now.
    // If a city is selected, we will show data for its parent county.
    const countySlug = type === 'counties' 
        ? location
        : Object.keys(BAY_AREA_COUNTIES).find(slug => BAY_AREA_COUNTIES[slug].name.includes(location));

    const countyFips = COUNTY_FIPS_CODES[countySlug];
    if (!countyFips) return null; // No FIPS code found

    // Best Practice: Store your key in an environment variable!
    // For Vite/Create-React-App, create a file named .env.local in your project root
    // and add the line: VITE_CENSUS_API_KEY="YOUR_NEW_KEY"
    const apiKey = import.meta.env.VITE_CENSUS_API_KEY || 'YOUR_API_KEY';

    // Census variable IDs for the data we need
    const variables = {
        population: 'DP05_0001E',
        medianIncome: 'DP03_0062E',
        povertyRate: 'DP03_0119PE',
        unemploymentRate: 'DP03_0009PE'
    };
    
    const varString = Object.values(variables).join(',');
    const url = `https://api.census.gov/data/2022/acs/acs5/profile?get=NAME,${varString}&for=county:${countyFips}&in=state:${STATE_FIPS_CODE}&key=${apiKey}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Census API request failed');
        
        const data = await response.json();
        
        // The API returns an array of arrays, e.g., [["NAME", "DP05_0001E", ...], ["Napa County, California", "136203", ...]]
        const headers = data[0];
        const values = data[1];

        // Create a mapping from variable ID back to our keys
        const keysByVarId = Object.entries(variables).reduce((acc, [key, id]) => {
            acc[id] = key;
            return acc;
        }, {});
        
        const demographics = {};
        headers.forEach((header, index) => {
            const key = keysByVarId[header];
            if (key) {
                const value = parseFloat(values[index]);
                // Format the data to match what DemographicsSection expects
                if (key === 'population') demographics[key] = value.toLocaleString();
                if (key === 'medianIncome') demographics[key] = `$${value.toLocaleString()}`;
                if (key === 'povertyRate' || key === 'unemploymentRate') demographics[key] = `${value.toFixed(1)}%`;
            }
        });

        return demographics;

    } catch (error) {
        console.error("Error fetching census data:", error);
        return null; // Return null on error
    }
}


// --- Main Hook ---
export function useLocationData(selectedLocation, viewType) {
    const [locationData, setLocationData] = useState({
        organizations: [],
        grants: [],
        posts: [],
        stats: { totalOrgs: 0, totalGrants: 0, totalPosts: 0 },
        demographics: null
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchAllData = async () => {
            if (!selectedLocation) return;
            
            setLoading(true);
            try {
                let locationQuery = `%${BAY_AREA_COUNTIES[selectedLocation]?.name || selectedLocation}%`;
                let demographicsData = null;

                // --- DATA FETCHING LOGIC ---
                if (selectedLocation === 'bay-area') {
                    locationQuery = '%Bay Area%,%California%';
                    // Use a static summary for the entire Bay Area
                    demographicsData = {
                        population: '7.7M',
                        medianIncome: '$126,200',
                        povertyRate: '8.1%',
                        unemploymentRate: '3.5%',
                    };
                } else {
                    // Fetch live demographic data from the Census API
                    demographicsData = await fetchDemographics(selectedLocation, viewType);
                }

                // Fetch Supabase data in parallel
                const [orgsResult, grantsResult, postsResult] = await Promise.all([
                    supabase.from('organizations').select(`id, name, type, tagline, image_url, location, slug`).ilike('location', locationQuery).limit(12),
                    supabase.from('grants').select(`id, title, description, deadline, max_funding_amount, funding_amount_text, organization_id`).limit(12),
                    supabase.from('posts').select(`id, content, created_at, likes_count, comments_count, profiles:profile_id(id, full_name, avatar_url, organization_name)`).order('created_at', { ascending: false }).limit(12)
                ]);

                setLocationData({
                    organizations: orgsResult.data || [],
                    grants: grantsResult.data || [],
                    posts: postsResult.data || [],
                    stats: {
                        totalOrgs: orgsResult.data?.length || 0,
                        totalGrants: grantsResult.data?.length || 0,
                        totalPosts: postsResult.data?.length || 0
                    },
                    demographics: demographicsData
                });

            } catch (error) {
                console.error('Error fetching location data:', error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchAllData();
    }, [selectedLocation, viewType]);

    return { locationData, loading };
}