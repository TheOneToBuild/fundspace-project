// src/components/post/MentionHoverCard.jsx - Production version without debug logs
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import Avatar from '../Avatar.jsx';

export default function MentionHoverCard({ mention, onClose }) {
    const navigate = useNavigate();
    const [entityData, setEntityData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEntityData = async () => {
            if (!mention?.id || !mention?.entityType) {
                setLoading(false);
                return;
            }

            try {
                let data = null;
                let error = null;

                if (mention.entityType === 'user') {
                    const result = await supabase
                        .from('profiles')
                        .select('id, full_name, title, avatar_url, organization_name')
                        .eq('id', mention.id)
                        .single();
                    
                    data = result.data;
                    error = result.error;
                } else if (mention.entityType === 'organization') {
                    const [orgType, orgId] = mention.id.split('-');
                    
                    if (!orgId) {
                        setEntityData(null);
                        setLoading(false);
                        return;
                    }

                    const result = await supabase
                        .from('organizations')
                        .select('id, name, type, tagline, image_url, slug')
                        .eq('id', parseInt(orgId))
                        .eq('type', orgType)
                        .single();
                    
                    data = result.data;
                    error = result.error;

                    if (data) {
                        data.orgType = orgType;
                        data.orgId = orgId;
                    }
                }

                if (error) {
                    setEntityData(null);
                } else if (data) {
                    setEntityData(data);
                } else {
                    setEntityData(null);
                }
            } catch (err) {
                setEntityData(null);
            }
            
            setLoading(false);
        };

        fetchEntityData();
    }, [mention]);

    const getOrganizationSlug = async (orgType, orgId) => {
        try {
            const { data, error } = await supabase
                .from('organizations')
                .select('slug')
                .eq('id', parseInt(orgId))
                .eq('type', orgType)
                .single();

            if (error) {
                return null;
            }

            return data?.slug;
        } catch (error) {
            return null;
        }
    };

    const handleNavigation = async () => {
        if (!mention) return;

        try {
            if (mention.entityType === 'user') {
                navigate(`/profile/members/${mention.id}`);
            } else if (mention.entityType === 'organization') {
                const [orgType, orgId] = mention.id.split('-');
                
                if (!orgId) {
                    return;
                }

                const slug = await getOrganizationSlug(orgType, orgId);
                
                if (slug) {
                    if (orgType === 'nonprofit') {
                        navigate(`/nonprofits/${slug}`);
                    } else if (orgType === 'funder') {
                        navigate(`/funders/${slug}`);
                    } else {
                        navigate(`/organizations/${slug}`);
                    }
                } else {
                    const fallbackPath = orgType === 'nonprofit' 
                        ? `/nonprofits/${orgId}` 
                        : orgType === 'funder'
                        ? `/funders/${orgId}`
                        : `/organizations/${orgId}`;
                    navigate(fallbackPath);
                }
            }
            
            if (onClose) onClose();
        } catch (error) {
            // Silent fallback
            if (mention.entityType === 'organization') {
                navigate(`/organizations/${mention.id}`);
            }
        }
    };

    if (loading) {
        return (
            <div className="w-64 p-4 bg-white rounded-lg shadow-lg border border-slate-200">
                <div className="animate-pulse">
                    <div className="flex items-center mb-3">
                        <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                        <div className="ml-3 flex-1">
                            <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                        </div>
                    </div>
                    <div className="h-8 bg-slate-200 rounded w-full"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-64 p-4 bg-white rounded-lg shadow-lg border border-slate-200">
            {entityData ? (
                <div className="flex flex-col">
                    <div className="flex items-center mb-3">
                        <Avatar 
                            src={entityData.avatar_url || entityData.image_url} 
                            fullName={entityData.full_name || entityData.name} 
                            size="lg" 
                        />
                        <div className="ml-3 overflow-hidden">
                            <p className="font-bold text-slate-800 truncate">
                                {entityData.full_name || entityData.name}
                            </p>
                            <p className="text-sm text-slate-500 truncate">
                                {entityData.title || entityData.tagline || (mention.entityType === 'user' ? 'User Profile' : 'Organization')}
                            </p>
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