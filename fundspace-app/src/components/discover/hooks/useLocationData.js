import { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { DEMOGRAPHICS_DATA } from '../data/demographics/index.js';
import { BAY_AREA_COUNTIES } from '../data/locationData.js';

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

            let orgsQuery = supabase
                .from('organizations')
                .select(`id, name, type, tagline, image_url, location, slug`)
                .limit(12);

            if (location !== 'bay-area') {
                orgsQuery = orgsQuery.ilike('location', locationQuery);
            }

            const { data: orgsData, error: orgsError } = await orgsQuery;

            const { data: grantsData, error: grantsError } = await supabase
                .from('grants')
                .select(`id, title, description, deadline, max_funding_amount, funding_amount_text, organization_id`)
                .limit(12);

            let postsQuery = supabase
                .from('posts')
                .select(`id, content, created_at, likes_count, comments_count, profiles:profile_id(id, full_name, avatar_url, organization_name)`)
                .order('created_at', { ascending: false })
                .limit(12);

            if (location !== 'bay-area') {
                postsQuery = postsQuery.or(`content.ilike.%${location}%,content.ilike.%${locationQuery}%`);
            }

            const { data: postsData, error: postsError } = await postsQuery;

            if (orgsError) console.error('Organizations query error:', orgsError);
            if (grantsError) console.error('Grants query error:', grantsError);
            if (postsError) console.error('Posts query error:', postsError);

            const finalData = {
                organizations: orgsData || [],
                grants: grantsData || [],
                posts: postsData || [],
                stats: {
                    totalOrgs: orgsData?.length || 0,
                    totalGrants: grantsData?.length || 0,
                    totalPosts: postsData?.length || 0
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