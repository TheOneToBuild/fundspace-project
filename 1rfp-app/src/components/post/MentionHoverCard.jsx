// src/components/post/MentionHoverCard.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';
import Avatar from '../Avatar';

export default function MentionHoverCard({ mention, position }) {
    const [entityData, setEntityData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEntityData = async () => {
            if (!mention) return;
            setLoading(true);

            try {
                let data = null, error = null;

                if (mention.entityType === 'user') {
                    console.log(`🔍 Fetching user data for:`, mention.id);
                    ({ data, error } = await supabase
                        .from('profiles')
                        .select('id, full_name, avatar_url, title, organization_name')
                        .eq('id', mention.id)
                        .single());
                    
                    // Standardize user data structure  
                    if (data) {
                        // Use organization_name for the subtitle instead of title
                        data.title = data.organization_name || 'User Profile';
                    }
                } else if (mention.entityType === 'organization') {
                    console.log(`🔍 Fetching organization data for:`, mention.id);
                    
                    // Handle different mention ID formats for backward compatibility
                    let orgType, orgId;
                    
                    if (mention.id.includes('-')) {
                        // Format: "orgType-orgId" (e.g., "foundation-57")
                        const parts = mention.id.split('-');
                        if (parts.length === 2) {
                            orgType = parts[0];
                            orgId = parseInt(parts[1]);
                        }
                    } else {
                        // Fallback: might be just an ID or slug - try to find in organizations table
                        console.log('🔄 Trying fallback lookup for mention ID:', mention.id);
                        
                        // Try to find by slug first
                        const { data: orgBySlug } = await supabase
                            .from('organizations')
                            .select('id, type, slug')
                            .eq('slug', mention.id)
                            .single();
                            
                        if (orgBySlug) {
                            orgType = orgBySlug.type;
                            orgId = orgBySlug.id;
                            console.log('✅ Found organization by slug:', { orgType, orgId });
                        } else {
                            // Try to find by ID if it's numeric
                            const numericId = parseInt(mention.id);
                            if (!isNaN(numericId)) {
                                const { data: orgById } = await supabase
                                    .from('organizations')
                                    .select('id, type, slug')
                                    .eq('id', numericId)
                                    .single();
                                    
                                if (orgById) {
                                    orgType = orgById.type;
                                    orgId = orgById.id;
                                    console.log('✅ Found organization by ID:', { orgType, orgId });
                                }
                            }
                        }
                    }
                    
                    // If we still don't have valid org data, fail gracefully
                    if (!orgType || !orgId || isNaN(orgId)) {
                        console.error('❌ Could not parse organization mention ID:', mention.id);
                        setEntityData(null);
                        setLoading(false);
                        return;
                    }
                    
                    // Validate organization type - support all database organization types
                    const validOrgTypes = ['nonprofit', 'funder', 'foundation', 'education', 'healthcare', 'government', 'religious', 'forprofit'];
                    if (!validOrgTypes.includes(orgType)) {
                        console.error('❌ Invalid organization type:', orgType);
                        setEntityData(null);
                        setLoading(false);
                        return;
                    }
                    
                    console.log(`🏢 Fetching ${orgType} data for ID:`, orgId);
                    
                    // Map organization type to correct table name
                    let tableName;
                    if (orgType === 'nonprofit') {
                        tableName = 'nonprofits';
                    } else if (orgType === 'funder') {
                        tableName = 'funders';
                    } else {
                        // All other organization types (foundation, education, etc.) are in the 'organizations' table
                        tableName = 'organizations';
                    }
                    
                    ({ data, error } = await supabase
                        .from(tableName)
                        .select('id, name, description, image_url, slug, type, location')
                        .eq('id', orgId)
                        .single());
                    
                    // Standardize the data structure for consistent display
                    if (data) {
                        data.full_name = data.name;
                        data.avatar_url = data.image_url; // Fixed: use image_url not logo_url
                        
                        // Create a better subtitle with organization type and location
                        const getOrgTypeLabel = (type) => {
                            const typeLabels = {
                                'nonprofit': 'Nonprofit',
                                'funder': 'Funder', 
                                'foundation': 'Foundation',
                                'education': 'Education',
                                'healthcare': 'Healthcare',
                                'government': 'Government',
                                'religious': 'Religious',
                                'forprofit': 'For-Profit'
                            };
                            return typeLabels[type] || 'Organization';
                        };
                        
                        const orgTypeLabel = getOrgTypeLabel(data.type || orgType);
                        const location = data.location;
                        
                        // Combine org type and location for the subtitle
                        if (location) {
                            data.title = `${orgTypeLabel} • ${location}`;
                        } else {
                            data.title = orgTypeLabel;
                        }
                        
                        // Store organization type and original ID for navigation
                        data.orgType = orgType;
                        data.orgId = orgId;
                    }
                }

                if (error) {
                    console.error(`❌ Error fetching ${mention.entityType} hover card data:`, error);
                    setEntityData(null);
                } else if (data) {
                    console.log(`✅ Successfully fetched ${mention.entityType} data:`, data);
                    setEntityData(data);
                } else {
                    console.warn(`⚠️ No data found for ${mention.entityType}:`, mention.id);
                    setEntityData(null);
                }
            } catch (err) {
                console.error(`💥 Exception fetching ${mention.entityType} data:`, err);
                setEntityData(null);
            }
            
            setLoading(false);
        };

        fetchEntityData();
    }, [mention]);

    const getOrganizationSlug = async (orgType, orgId) => {
        try {
            let tableName;
            if (orgType === 'nonprofit') {
                tableName = 'nonprofits';
            } else if (orgType === 'funder') {
                tableName = 'funders';
            } else {
                // All other organization types are in the 'organizations' table
                tableName = 'organizations';
            }
            
            const { data, error } = await supabase
                .from(tableName)
                .select('slug')
                .eq('id', parseInt(orgId))
                .single();

            if (error) {
                console.error(`Error fetching ${orgType} slug:`, error);
                return null;
            }

            return data?.slug;
        } catch (error) {
            console.error(`Exception fetching ${orgType} slug:`, error);
            return null;
        }
    };

    const handleNavigation = async () => {
        if (!mention) return;

        try {
            if (mention.entityType === 'user') {
                console.log(`🔗 Navigating to user profile:`, mention.id);
                navigate(`/profile/members/${mention.id}`);
            } else if (mention.entityType === 'organization') {
                console.log(`🔗 Attempting to navigate to organization:`, mention.id);
                
                // Use the same logic as data fetching for consistency
                let orgType, orgId;
                
                if (mention.id.includes('-')) {
                    // Format: "orgType-orgId" (e.g., "foundation-57")
                    const parts = mention.id.split('-');
                    if (parts.length === 2) {
                        orgType = parts[0];
                        orgId = parseInt(parts[1]);
                    }
                } else {
                    // Fallback: use entityData if we have it from successful data fetch
                    if (entityData?.orgType && entityData?.orgId) {
                        orgType = entityData.orgType;
                        orgId = entityData.orgId;
                        console.log('🔄 Using entityData for navigation:', { orgType, orgId });
                    } else {
                        // Try to find organization info by slug/ID
                        console.log('🔄 Attempting fallback lookup for navigation:', mention.id);
                        
                        // Try to find by slug first
                        const { data: orgBySlug } = await supabase
                            .from('organizations')
                            .select('id, type, slug')
                            .eq('slug', mention.id)
                            .single();
                            
                        if (orgBySlug) {
                            orgType = orgBySlug.type;
                            orgId = orgBySlug.id;
                            console.log('✅ Found organization by slug for navigation:', { orgType, orgId });
                        } else {
                            // Try by numeric ID
                            const numericId = parseInt(mention.id);
                            if (!isNaN(numericId)) {
                                const { data: orgById } = await supabase
                                    .from('organizations')
                                    .select('id, type, slug')
                                    .eq('id', numericId)
                                    .single();
                                    
                                if (orgById) {
                                    orgType = orgById.type;
                                    orgId = orgById.id;
                                    console.log('✅ Found organization by ID for navigation:', { orgType, orgId });
                                }
                            }
                        }
                    }
                }
                
                // If we still don't have valid org data, show error but don't block navigation
                if (!orgType || !orgId) {
                    console.error('❌ Cannot determine organization type/ID for navigation:', mention.id);
                    // Try a generic fallback navigation
                    navigate(`/organizations/${mention.id}`);
                    return;
                }
                
                const validOrgTypes = ['nonprofit', 'funder', 'foundation', 'education', 'healthcare', 'government', 'religious', 'forprofit'];
                if (!validOrgTypes.includes(orgType)) {
                    console.error('❌ Invalid organization type for navigation:', orgType);
                    // Try generic fallback
                    navigate(`/organizations/${mention.id}`);
                    return;
                }
                
                console.log(`🔗 Navigating to ${orgType} profile:`, orgId);
                
                // Try to use the slug if we already have it from the fetched data
                if (entityData?.slug) {
                    console.log(`✨ Using cached slug for navigation:`, entityData.slug);
                    if (orgType === 'nonprofit') {
                        navigate(`/nonprofits/${entityData.slug}`);
                    } else if (orgType === 'funder') {
                        navigate(`/funders/${entityData.slug}`);
                    } else {
                        // For other organization types (foundation, education, etc.)
                        navigate(`/organizations/${entityData.slug}`);
                    }
                    return;
                }
                
                // Otherwise, get the organization slug from the database
                const slug = await getOrganizationSlug(orgType, orgId);
                
                if (slug) {
                    if (orgType === 'nonprofit') {
                        navigate(`/nonprofits/${slug}`);
                    } else if (orgType === 'funder') {
                        navigate(`/funders/${slug}`);
                    } else {
                        // For other organization types
                        navigate(`/organizations/${slug}`);
                    }
                } else {
                    console.error(`Could not find slug for ${orgType} with ID ${orgId}`);
                    // Fallback: try direct navigation with ID
                    let fallbackPath;
                    if (orgType === 'nonprofit') {
                        fallbackPath = `/nonprofits/${orgId}`;
                    } else if (orgType === 'funder') {
                        fallbackPath = `/funders/${orgId}`;
                    } else {
                        fallbackPath = `/organizations/${orgId}`;
                    }
                    console.log(`🔄 Trying fallback navigation: ${fallbackPath}`);
                    navigate(fallbackPath);
                }
            }
        } catch (error) {
            console.error('💥 Error navigating from hover card:', error);
            // Final fallback - try to navigate anyway
            if (mention.entityType === 'organization') {
                navigate(`/organizations/${mention.id}`);
            }
        }
    };

    if (!position) return null;

    return (
        <div
            className="absolute z-20 bg-white rounded-lg shadow-xl border border-slate-200 w-80 p-4 animate-fade-in-fast"
            style={{ top: position.top, left: position.left }}
            onClick={e => e.stopPropagation()} // Prevent card from disappearing if clicked
        >
            {loading ? (
                <div className="flex items-center justify-center h-24">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : entityData ? (
                <div className="flex flex-col">
                    <div className="flex items-center mb-3">
                        <Avatar src={entityData.avatar_url} fullName={entityData.full_name} size="lg" />
                        <div className="ml-3 overflow-hidden">
                            <p className="font-bold text-slate-800 truncate">{entityData.full_name}</p>
                            <p className="text-sm text-slate-500 truncate">{entityData.title || (mention.entityType === 'user' ? 'User Profile' : 'Organization')}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleNavigation}
                        className="w-full mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                        View Profile
                    </button>
                </div>
            ) : (
                <div className="flex items-center justify-center h-24">
                    <div className="text-center">
                        <p className="text-slate-500 text-sm mb-2">Could not load profile.</p>
                        <p className="text-xs text-slate-400 mb-3">
                            {mention.entityType === 'organization' 
                                ? 'Organization data may be from outdated code.' 
                                : 'Profile may no longer exist.'}
                        </p>
                        <button
                            onClick={handleNavigation}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                        >
                            Try to Visit
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}