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
        fetchDashboardStats();
    }, [selectedLocation]);

    const fetchDashboardStats = async () => {
        try {
            setStats(prev => ({ ...prev, loading: true }));

            // Build location filters based on selected location
            const locationFilters = buildLocationFilters(selectedLocation);
            
            // Fetch all stats in parallel
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

            // Format the funding amount
            const formattedFunding = formatFundingAmount(fundingResult.total);

            setStats({
                totalFunding: fundingResult.total, // Keep as number for AnimatedCounter
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

// Helper function to build location filters for queries
function buildLocationFilters(selectedLocation) {
    if (!selectedLocation || selectedLocation === 'bay-area') {
        // For Bay Area, include all counties
        return {
            type: 'bay-area',
            counties: Object.values(BAY_AREA_COUNTIES).map(county => county.name),
            cities: []
        };
    }

    // Check if it's a county
    if (Object.keys(BAY_AREA_COUNTIES).includes(selectedLocation)) {
        const countyName = BAY_AREA_COUNTIES[selectedLocation].name;
        return {
            type: 'county',
            counties: [countyName],
            cities: MAJOR_CITIES[selectedLocation] || []
        };
    }

    // It's a city
    const county = Object.keys(MAJOR_CITIES).find(countyKey => 
        MAJOR_CITIES[countyKey].includes(selectedLocation)
    );
    
    return {
        type: 'city',
        counties: county ? [BAY_AREA_COUNTIES[county].name] : [],
        cities: [selectedLocation]
    };
}

// Fetch total funding from grants in the specified locations
async function fetchTotalFunding(locationFilters) {
    try {
        // First, let's try a simpler approach - check if grants have location data directly
        // or use organization funding locations table
        let query = supabase
            .from('grants')
            .select(`
                max_funding_amount, 
                funding_amount_text, 
                organization_id,
                organizations!inner(
                    id,
                    location,
                    organization_funding_locations(
                        locations(name)
                    )
                )
            `);

        const { data: allGrants, error } = await query;
        if (error) throw error;

        let filteredGrants = allGrants || [];

        // Filter grants based on location if not bay-area
        if (locationFilters.type !== 'bay-area') {
            filteredGrants = allGrants?.filter(grant => {
                const org = grant.organizations;
                if (!org) return false;

                // Check organization's direct location field
                const orgLocation = org.location || '';
                
                // Check if organization location matches any of our target locations
                const matchesDirectLocation = 
                    locationFilters.counties.some(county => 
                        orgLocation.toLowerCase().includes(county.toLowerCase())
                    ) ||
                    locationFilters.cities.some(city => 
                        orgLocation.toLowerCase().includes(city.toLowerCase())
                    );

                // Also check funding locations table if available
                const matchesFundingLocations = org.organization_funding_locations?.some(loc => 
                    locationFilters.counties.some(county => 
                        loc.locations?.name?.toLowerCase().includes(county.toLowerCase())
                    ) ||
                    locationFilters.cities.some(city => 
                        loc.locations?.name?.toLowerCase().includes(city.toLowerCase())
                    )
                );

                return matchesDirectLocation || matchesFundingLocations;
            }) || [];
        }

        // Calculate total funding
        let totalFunding = 0;
        let grantCount = 0;

        filteredGrants.forEach(grant => {
            if (grant.max_funding_amount && grant.max_funding_amount > 0) {
                totalFunding += grant.max_funding_amount;
                grantCount++;
            } else if (grant.funding_amount_text) {
                // Try to parse funding amount from text
                const amount = parseFundingAmount(grant.funding_amount_text);
                if (amount > 0) {
                    totalFunding += amount;
                    grantCount++;
                }
            }
        });

        // If no funding found, let's also check for any grants without specific amounts
        if (totalFunding === 0 && filteredGrants.length > 0) {
            // Estimate based on average grant amount (use a reasonable default)
            totalFunding = filteredGrants.length * 25000; // $25K average per grant estimate
        }

        // Calculate a mock change percentage
        const change = Math.floor(Math.random() * 15) + 5; // Random 5-20% for demo

        console.log(`Found ${filteredGrants.length} grants in location, total funding: ${totalFunding}`);
        return { total: totalFunding, change, count: grantCount };

    } catch (error) {
        console.error('Error fetching funding data:', error);
        return { total: 0, change: 0 };
    }
}

// Helper function to parse funding amounts from text
function parseFundingAmount(text) {
    if (!text) return 0;
    
    const cleanText = text.toLowerCase().replace(/[,$]/g, '');
    
    // Look for patterns like "$50K", "$1M", "$10,000", etc.
    const patterns = [
        /(\d+(?:\.\d+)?)\s*m(?:illion)?/,
        /(\d+(?:\.\d+)?)\s*k(?:thousand)?/,
        /(\d+(?:,\d{3})*)/
    ];
    
    for (const pattern of patterns) {
        const match = cleanText.match(pattern);
        if (match) {
            const num = parseFloat(match[1].replace(/,/g, ''));
            if (cleanText.includes('m')) return num * 1000000;
            if (cleanText.includes('k')) return num * 1000;
            return num;
        }
    }
    
    return 0;
}

// Fetch total organizations in the specified locations
async function fetchTotalOrganizations(locationFilters) {
    try {
        let query = supabase
            .from('organizations')
            .select('id, location', { count: 'exact' });

        // Apply location filters
        if (locationFilters.type !== 'bay-area') {
            const locationConditions = [];
            
            if (locationFilters.counties.length > 0) {
                locationConditions.push(
                    ...locationFilters.counties.map(county => `location.ilike.%${county}%`)
                );
            }
            
            if (locationFilters.cities.length > 0) {
                locationConditions.push(
                    ...locationFilters.cities.map(city => `location.ilike.%${city}%`)
                );
            }

            if (locationConditions.length > 0) {
                query = query.or(locationConditions.join(','));
            }
        }

        const { data, count, error } = await query;

        if (error) throw error;

        // Also check organization_funding_locations for more precise location matching
        if (locationFilters.type !== 'bay-area') {
            try {
                const { data: fundingLocationOrgs } = await supabase
                    .from('organization_funding_locations')
                    .select(`
                        organization_id,
                        locations!inner(name)
                    `)
                    .or(
                        locationFilters.counties.concat(locationFilters.cities)
                            .map(loc => `locations.name.ilike.%${loc}%`)
                            .join(',')
                    );

                // Combine both counts (avoiding duplicates)
                const directLocationOrgs = new Set((data || []).map(org => org.id));
                const fundingLocationOrgIds = new Set((fundingLocationOrgs || []).map(item => item.organization_id));
                
                const totalUniqueOrgs = new Set([...directLocationOrgs, ...fundingLocationOrgIds]);
                const finalCount = totalUniqueOrgs.size;

                console.log(`Found ${finalCount} organizations in ${locationFilters.counties.concat(locationFilters.cities).join(', ')}`);
                
                // Calculate a mock change percentage
                const change = Math.floor(Math.random() * 20) + 10; // Random 10-30% for demo

                return { total: finalCount, change };
            } catch (fundingLocationError) {
                console.error('Error fetching funding location organizations:', fundingLocationError);
                // Fall back to direct count
                return { total: count || 0, change: Math.floor(Math.random() * 20) + 10 };
            }
        }

        console.log(`Found ${count} organizations for Bay Area`);
        const change = Math.floor(Math.random() * 20) + 10; // Random 10-30% for demo
        return { total: count || 0, change };

    } catch (error) {
        console.error('Error fetching organizations data:', error);
        return { total: 0, change: 0 };
    }
}

// Fetch total active funds (dollar amount of grants that haven't expired) in the specified locations
async function fetchTotalActiveFunds(locationFilters) {
    try {
        // Get current date for filtering active grants
        const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        
        let query = supabase
            .from('grants')
            .select(`
                id,
                deadline,
                max_funding_amount,
                funding_amount_text,
                organization_id,
                organizations!inner(
                    id,
                    location,
                    organization_funding_locations(
                        locations(name)
                    )
                )
            `)
            .gte('deadline', currentDate) // Only grants with deadlines >= today
            .not('deadline', 'is', null); // Exclude grants without deadlines

        const { data: allActiveGrants, error } = await query;
        if (error) throw error;

        let filteredGrants = allActiveGrants || [];

        // Filter grants based on location if not bay-area
        if (locationFilters.type !== 'bay-area') {
            filteredGrants = allActiveGrants?.filter(grant => {
                const org = grant.organizations;
                if (!org) return false;

                // Check organization's direct location field
                const orgLocation = org.location || '';
                
                // Check if organization location matches any of our target locations
                const matchesDirectLocation = 
                    locationFilters.counties.some(county => 
                        orgLocation.toLowerCase().includes(county.toLowerCase())
                    ) ||
                    locationFilters.cities.some(city => 
                        orgLocation.toLowerCase().includes(city.toLowerCase())
                    );

                // Also check funding locations table if available
                const matchesFundingLocations = org.organization_funding_locations?.some(loc => 
                    locationFilters.counties.some(county => 
                        loc.locations?.name?.toLowerCase().includes(county.toLowerCase())
                    ) ||
                    locationFilters.cities.some(city => 
                        loc.locations?.name?.toLowerCase().includes(city.toLowerCase())
                    )
                );

                return matchesDirectLocation || matchesFundingLocations;
            }) || [];
        }

        // Calculate total dollar amount of active funds
        let totalActiveFunding = 0;
        let grantCount = 0;

        filteredGrants.forEach(grant => {
            if (grant.max_funding_amount && grant.max_funding_amount > 0) {
                totalActiveFunding += grant.max_funding_amount;
                grantCount++;
            } else if (grant.funding_amount_text) {
                // Try to parse funding amount from text
                const amount = parseFundingAmount(grant.funding_amount_text);
                if (amount > 0) {
                    totalActiveFunding += amount;
                    grantCount++;
                }
            }
        });

        // If no funding found but we have grants, estimate based on average
        if (totalActiveFunding === 0 && filteredGrants.length > 0) {
            // Estimate based on average grant amount (use a reasonable default)
            totalActiveFunding = filteredGrants.length * 25000; // $25K average per grant estimate
        }

        // Calculate a mock change percentage
        const change = Math.floor(Math.random() * 12) + 3; // Random 3-15% for demo

        console.log(`Found ${totalActiveFunding} in active grants across ${filteredGrants.length} grants in location`);
        return { total: totalActiveFunding, change };

    } catch (error) {
        console.error('Error fetching active funds data:', error);
        return { total: 0, change: 0 };
    }
}
async function fetchTotalChampions(locationFilters) {
    try {
        let query = supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .not('location', 'is', null);

        // Apply location filters
        if (locationFilters.type !== 'bay-area') {
            const locationConditions = [];
            
            if (locationFilters.counties.length > 0) {
                locationConditions.push(
                    ...locationFilters.counties.map(county => `location.ilike.%${county}%`)
                );
            }
            
            if (locationFilters.cities.length > 0) {
                locationConditions.push(
                    ...locationFilters.cities.map(city => `location.ilike.%${city}%`)
                );
            }

            if (locationConditions.length > 0) {
                query = query.or(locationConditions.join(','));
            }
        }

        const { count, error } = await query;

        if (error) throw error;

        // Calculate a mock change percentage
        const change = Math.floor(Math.random() * 10) + 2; // Random 2-12% for demo

        return { total: count || 0, change };

    } catch (error) {
        console.error('Error fetching champions data:', error);
        return { total: 0, change: 0 };
    }
}

// Helper function to format funding amounts
function formatFundingAmount(amount) {
    if (amount === 0) return '$0';
    
    if (amount >= 1000000) {
        return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
        return `$${(amount / 1000).toFixed(0)}K`;
    } else {
        return `$${amount.toLocaleString()}`;
    }
}