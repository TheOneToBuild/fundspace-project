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
                } else if (mention.entityType === 'organization') {
                    const [orgType, orgId] = mention.id.split('-');
                    console.log(`🔍 Fetching ${orgType} data for ID:`, orgId);
                    
                    const tableName = orgType === 'nonprofit' ? 'nonprofits' : 'funders';
                    ({ data, error } = await supabase
                        .from(tableName)
                        .select('id, name, description, logo_url')
                        .eq('id', parseInt(orgId))
                        .single());
                    
                    // Standardize the data structure for consistent display
                    if (data) {
                        data.full_name = data.name;
                        data.avatar_url = data.logo_url;
                        data.title = data.description?.substring(0, 70) + (data.description?.length > 70 ? '...' : '') || 'Organization';
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
            const tableName = orgType === 'nonprofit' ? 'nonprofits' : 'funders';
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
                // FIXED: Use the same navigation pattern as PostBody
                console.log(`🔗 Navigating to user profile:`, mention.id);
                navigate(`/profile/members/${mention.id}`);
            } else if (mention.entityType === 'organization') {
                const [orgType, orgId] = mention.id.split('-');
                console.log(`🔗 Navigating to ${orgType} profile:`, orgId);
                
                // Get the organization slug from the database
                const slug = await getOrganizationSlug(orgType, orgId);
                
                if (slug) {
                    if (orgType === 'nonprofit') {
                        navigate(`/nonprofits/${slug}`);
                    } else if (orgType === 'funder') {
                        navigate(`/funders/${slug}`);
                    }
                } else {
                    console.error(`Could not find slug for ${orgType} with ID ${orgId}`);
                    // FIXED: Use the same fallback logic as PostBody
                    const fallbackPath = orgType === 'nonprofit' ? 
                        `/nonprofits/${orgId}` : `/funders/${orgId}`;
                    console.log(`🔄 Trying fallback navigation: ${fallbackPath}`);
                    navigate(fallbackPath);
                }
            }
        } catch (error) {
            console.error('💥 Error navigating from hover card:', error);
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
                        <p className="text-slate-500 text-sm">Could not load profile.</p>
                        <button
                            onClick={handleNavigation}
                            className="mt-2 px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                        >
                            Try to Visit
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}