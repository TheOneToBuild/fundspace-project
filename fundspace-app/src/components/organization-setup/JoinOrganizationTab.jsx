// src/components/organization-setup/JoinOrganizationTab.jsx
import React, { useState, useCallback } from 'react';
import { Search, Building2, Users, Plus, MapPin } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useOrganizationSearch } from './useOrganizationSearch';

export default function JoinOrganizationTab({ session, onSuccess, onError, onSwitchToCreate }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { searchResults, searching } = useOrganizationSearch(searchQuery);

    const handleJoinOrganization = useCallback(async (organization) => {
        setLoading(true);
        try {
            const userId = session?.user?.id;
            if (!userId) throw new Error('You must be logged in to join an organization');

            // Check for existing super admins
            const { data: existingSuperAdmins } = await supabase
                .from('organization_memberships')
                .select('id')
                .eq('organization_id', organization.id)
                .eq('role', 'super_admin');

            const role = (!existingSuperAdmins || existingSuperAdmins.length === 0) ? 'super_admin' : 'member';

            // Create membership
            const { error: membershipError } = await supabase
                .from('organization_memberships')
                .insert({
                    profile_id: userId,
                    organization_id: organization.id,
                    organization_type: organization.type,
                    role: role,
                    membership_type: 'staff',
                    is_public: true
                });

            if (membershipError) throw membershipError;

            // Update profile
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    organization_choice: 'join',
                    selected_organization_id: organization.id,
                    selected_organization_type: organization.type,
                    organization_name: organization.name,
                    updated_at: new Date()
                })
                .eq('id', userId);

            if (profileError) console.warn('Profile update failed:', profileError);

            // Trigger refresh callbacks
            if (window.refreshDashboardOrganizationData) window.refreshDashboardOrganizationData();
            if (window.refreshMemberProfileData) window.refreshMemberProfileData();
            if (window.refreshMyOrganizationPage) window.refreshMyOrganizationPage();

            onSuccess(`Successfully joined ${organization.name} as ${role === 'super_admin' ? 'Super Admin' : 'Member'}!`);

        } catch (err) {
            onError(err.message || 'Failed to join organization');
        } finally {
            setLoading(false);
        }
    }, [session, onSuccess, onError]);

    const getOrgTypeIcon = (type) => {
        const icons = {
            nonprofit: '🏛️',
            foundation: '💰', 
            government: '🏛️',
            'for-profit': '🏢',
            education: '🎓',
            healthcare: '🏥',
            religious: '⛪',
            international: '🌍'
        };
        return icons[type] || '🏢';
    };

    return (
        <div className="space-y-6">
            {/* Search Section */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    Search for your organization
                </label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Enter organization name..."
                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                </div>
            </div>

            {/* Search Results */}
            <div className="space-y-4">
                {searching && searchQuery && (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-slate-500 mt-2">Searching...</p>
                    </div>
                )}

                {searchResults.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="font-medium text-slate-900">Found Organizations ({searchResults.length})</h3>
                        {searchResults.map((org) => (
                            <div
                                key={org.id}
                                className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-xl">
                                        {org.image_url ? (
                                            <img 
                                                src={org.image_url} 
                                                alt={org.name}
                                                className="w-full h-full object-cover rounded-lg"
                                            />
                                        ) : (
                                            getOrgTypeIcon(org.type)
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-slate-900">{org.name}</h4>
                                        <div className="flex items-center space-x-4 text-sm text-slate-500">
                                            <span className="capitalize">{org.type.replace('-', ' ')}</span>
                                            {org.location && (
                                                <span className="flex items-center">
                                                    <MapPin className="w-3 h-3 mr-1" />
                                                    {org.location}
                                                </span>
                                            )}
                                        </div>
                                        {org.description && (
                                            <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                                                {org.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleJoinOrganization(org)}
                                    disabled={loading}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Users className="w-4 h-4 mr-2" />
                                    Join
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {searchQuery && searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
                    <div className="text-center py-12 bg-slate-50 rounded-lg">
                        <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 mb-2">No organizations found</h3>
                        <p className="text-slate-600 mb-4">
                            No organizations match your search for "{searchQuery}".
                        </p>
                        <button
                            onClick={() => onSwitchToCreate(searchQuery)}
                            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create "{searchQuery}"
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}