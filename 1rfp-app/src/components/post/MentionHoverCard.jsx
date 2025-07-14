import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';
import Avatar from '../Avatar'; // Assuming a generic Avatar component exists

export default function MentionHoverCard({ mention, position }) {
    const [entityData, setEntityData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEntityData = async () => {
            if (!mention) return;
            setLoading(true);

            let data = null, error = null;

            if (mention.entityType === 'user') {
                ({ data, error } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url, title, organization_name')
                    .eq('id', mention.id)
                    .single());
            } else if (mention.entityType === 'organization') {
                 const [orgType, orgId] = mention.id.split('-');
                 ({ data, error } = await supabase
                    .from(orgType === 'nonprofit' ? 'nonprofits' : 'funders')
                    .select('id, name, avatar_url, mission')
                    .eq('id', orgId)
                    .single());
                // Standardize the data structure for consistent display
                if (data) {
                    data.full_name = data.name;
                    data.title = data.mission?.substring(0, 70) + (data.mission?.length > 70 ? '...' : '');
                }
            }

            if (error) {
                console.error('Error fetching hover card data:', error);
            } else {
                setEntityData(data);
            }
            setLoading(false);
        };

        fetchEntityData();
    }, [mention]);

    const handleNavigation = () => {
        if (!mention) return;

        // IMPORTANT: Verify these URL paths match your application's routes.
        if (mention.entityType === 'user') {
            // Assumes user profiles are at /profile/:id
            navigate(`/profile/${mention.id}`);
        } else if (mention.entityType === 'organization') {
             const [orgType, orgId] = mention.id.split('-');
             // Assumes org profiles are at /nonprofits/:id or /funders/:id
             const path = orgType === 'nonprofit' ? `/nonprofits/${orgId}` : `/funders/${orgId}`;
             navigate(path);
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
                    <p className="text-slate-500">Loading...</p>
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
                    <p className="text-slate-500">Could not load profile.</p>
                </div>
            )}
        </div>
    );
}