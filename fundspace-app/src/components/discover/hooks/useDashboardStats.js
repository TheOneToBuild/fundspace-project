// src/components/discover/hooks/useDashboardStats.js
import { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { BAY_AREA_COUNTIES, MAJOR_CITIES } from '../data/locationData.js';

export function useDashboardStats(selectedLocation) {
    const [stats, setStats] = useState({
        totalFunding: '$0',
        totalOrganizations: 0,
        totalActiveFunds: 0,
        totalChampions: 0,
        changes: {
            funding: '+0%',
            organizations: '+0%',
            activeFunds: '+0%',
            champions: '+0%'
        },
        loading: true
    });

    useEffect(() => {
        if (selectedLocation) {
            fetchDashboardStats();
        }
    }, [selectedLocation]);

    const fetchDashboardStats = async () => {
        try {
            setStats(prev => ({ ...prev, loading: true }));
            const locationFilters = buildLocationFilters(selectedLocation);
            
            const [
                fundingResult,
                organizationsResult,
                activeFundsResult,
                championsResult
            ] = await Promise.all([
                fetchTotalFunding(locationFilters),
                fetchTotalOrganizations(locationFilters),
                fetchTotalActiveFunds(locationFilters),
                fetchTotalChampions(locationFilters)
            ]);

            setStats({
                totalFunding: fundingResult.total,
                totalOrganizations: organizationsResult.total,
                totalActiveFunds: activeFundsResult.total,
                totalChampions: championsResult.total,
                changes: {
                    funding: `+${fundingResult.change}%`,
                    organizations: `+${organizationsResult.change}%`,
                    activeFunds: `+${activeFundsResult.change}%`,
                    champions: `+${championsResult.change}%`
                },
                loading: false
            });
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            setStats(prev => ({ ...prev, loading: false }));
        }
    };

    return stats;
}

function buildLocationFilters(selectedLocation) {
    if (!selectedLocation || selectedLocation === 'bay-area') {
        return {
            type: 'bay-area',
            counties: Object.values(BAY_AREA_COUNTIES).map(county => county.name),
            cities: []
        };
    }
    if (Object.keys(BAY_AREA_COUNTIES).includes(selectedLocation)) {
        const countyName = BAY_AREA_COUNTIES[selectedLocation].name;
        return { type: 'county', counties: [countyName], cities: MAJOR_CITIES[selectedLocation] || [] };
    }
    const county = Object.keys(MAJOR_CITIES).find(key => MAJOR_CITIES[key].includes(selectedLocation));
    return { type: 'city', counties: county ? [BAY_AREA_COUNTIES[county].name] : [], cities: [selectedLocation] };
}

async function fetchTotalOrganizations(locationFilters) {
    try {
        let query = supabase.from('organizations').select('id, location', { count: 'exact' });
        if (locationFilters.type !== 'bay-area') {
            const conditions = [
                ...locationFilters.counties.map(c => `location.ilike.%${c}%`),
                ...locationFilters.cities.map(c => `location.ilike.%${c}%`)
            ];
            if (conditions.length > 0) query = query.or(conditions.join(','));
        }
        const { data, count, error } = await query;
        if (error) throw error;

        if (locationFilters.type !== 'bay-area') {
            try {
                // --- CORRECTED QUERY BLOCK ---
                // We must tell Supabase to apply the filter to the 'locations' foreign table.
                const orFilter = locationFilters.counties.map(loc => `name.ilike.%${loc}%`).join(',');
                const { data: fundingLocationOrgs } = await supabase
                    .from('organization_funding_locations')
                    .select(`organization_id, locations!inner(name)`)
                    .or(orFilter, { foreignTable: 'locations' });
                // --- END OF CORRECTED BLOCK ---

                const directOrgs = new Set((data || []).map(org => org.id));
                const fundingOrgs = new Set((fundingLocationOrgs || []).map(item => item.organization_id));
                const totalUnique = new Set([...directOrgs, ...fundingOrgs]).size;
                return { total: totalUnique, change: Math.floor(Math.random() * 20) + 10 };
            } catch (fundingError) {
                console.error('Error fetching funding location orgs:', fundingError);
                return { total: count || 0, change: Math.floor(Math.random() * 20) + 10 };
            }
        }
        return { total: count || 0, change: Math.floor(Math.random() * 20) + 10 };
    } catch (error) {
        console.error('Error fetching organizations data:', error);
        return { total: 0, change: 0 };
    }
}

// Other functions (fetchTotalFunding, fetchTotalActiveFunds, etc.) remain the same
// but are included here for completeness of the file.

async function fetchTotalFunding(locationFilters) {
    try {
        const { data: allGrants, error } = await supabase
            .from('grants')
            .select(`max_funding_amount, funding_amount_text, organizations!inner(id, location, organization_funding_locations(locations(name)))`);
        if (error) throw error;

        let filteredGrants = allGrants || [];
        if (locationFilters.type !== 'bay-area') {
            filteredGrants = allGrants.filter(grant => {
                const org = grant.organizations;
                if (!org) return false;
                const orgLoc = org.location || '';
                const directMatch = locationFilters.counties.some(c => orgLoc.toLowerCase().includes(c.toLowerCase())) || locationFilters.cities.some(c => orgLoc.toLowerCase().includes(c.toLowerCase()));
                const fundingLocMatch = org.organization_funding_locations?.some(loc => locationFilters.counties.some(c => loc.locations?.name?.toLowerCase().includes(c.toLowerCase())) || locationFilters.cities.some(c => loc.locations?.name?.toLowerCase().includes(c.toLowerCase())));
                return directMatch || fundingLocMatch;
            });
        }
        
        let totalFunding = filteredGrants.reduce((sum, grant) => {
            if (grant.max_funding_amount) return sum + grant.max_funding_amount;
            return sum + parseFundingAmount(grant.funding_amount_text);
        }, 0);

        if (totalFunding === 0 && filteredGrants.length > 0) totalFunding = filteredGrants.length * 25000;
        
        return { total: totalFunding, change: Math.floor(Math.random() * 15) + 5 };
    } catch (error) {
        console.error('Error fetching funding data:', error);
        return { total: 0, change: 0 };
    }
}

function parseFundingAmount(text) {
    if (!text) return 0;
    const clean = text.toLowerCase().replace(/[,$]/g, '');
    const mMatch = clean.match(/(\d+(?:\.\d+)?)\s*m/);
    if (mMatch) return parseFloat(mMatch[1]) * 1000000;
    const kMatch = clean.match(/(\d+(?:\.\d+)?)\s*k/);
    if (kMatch) return parseFloat(kMatch[1]) * 1000;
    const numMatch = clean.match(/(\d+)/);
    if (numMatch) return parseFloat(numMatch[1]);
    return 0;
}

async function fetchTotalActiveFunds(locationFilters) {
    try {
        const currentDate = new Date().toISOString();
        const { data: allActive, error } = await supabase
            .from('grants')
            .select(`max_funding_amount, funding_amount_text, organizations!inner(id, location, organization_funding_locations(locations(name)))`)
            .gte('deadline', currentDate);
        if (error) throw error;
        
        let filteredGrants = allActive || [];
        if (locationFilters.type !== 'bay-area') {
             filteredGrants = allActive.filter(grant => {
                const org = grant.organizations;
                if (!org) return false;
                const orgLoc = org.location || '';
                const directMatch = locationFilters.counties.some(c => orgLoc.toLowerCase().includes(c.toLowerCase())) || locationFilters.cities.some(c => orgLoc.toLowerCase().includes(c.toLowerCase()));
                const fundingLocMatch = org.organization_funding_locations?.some(loc => locationFilters.counties.some(c => loc.locations?.name?.toLowerCase().includes(c.toLowerCase())) || locationFilters.cities.some(c => loc.locations?.name?.toLowerCase().includes(c.toLowerCase())));
                return directMatch || fundingLocMatch;
            });
        }

        let totalActive = filteredGrants.reduce((sum, grant) => {
            if (grant.max_funding_amount) return sum + grant.max_funding_amount;
            return sum + parseFundingAmount(grant.funding_amount_text);
        }, 0);

        if (totalActive === 0 && filteredGrants.length > 0) totalActive = filteredGrants.length * 25000;

        return { total: totalActive, change: Math.floor(Math.random() * 12) + 3 };
    } catch (error) {
        console.error('Error fetching active funds data:', error);
        return { total: 0, change: 0 };
    }
}

async function fetchTotalChampions(locationFilters) {
    try {
        let query = supabase.from('profiles').select('id', { count: 'exact', head: true }).not('location', 'is', null);
        if (locationFilters.type !== 'bay-area') {
            const conditions = [
                ...locationFilters.counties.map(c => `location.ilike.%${c}%`),
                ...locationFilters.cities.map(c => `location.ilike.%${c}%`)
            ];
            if (conditions.length > 0) query = query.or(conditions.join(','));
        }
        const { count, error } = await query;
        if (error) throw error;
        return { total: count || 0, change: Math.floor(Math.random() * 10) + 2 };
    } catch (error) {
        console.error('Error fetching champions data:', error);
        return { total: 0, change: 0 };
    }
}