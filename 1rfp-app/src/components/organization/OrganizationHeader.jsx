// components/organization/OrganizationHeader.jsx
import React, { useState } from 'react';
import { 
    MapPin, Globe, Mail, Edit, LogOut, Trash2, Settings, 
    Crown, Shield, Users, Star 
} from 'lucide-react';
import { 
    hasPermission, 
    PERMISSIONS, 
    ROLES, 
    getRoleDisplayName, 
    getRoleBadgeColor,
    getOrgTypeIcon,
    getOrgTypeLabel
} from '../../utils/organizationPermissions.js';

export default function OrganizationHeader({ 
    organization, 
    userMembership, 
    profile, 
    onUpdate, 
    onLeave, 
    onDelete, 
    setError 
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editingData, setEditingData] = useState({});
    const [saving, setSaving] = useState(false);

    const isOmegaAdmin = profile?.is_omega_admin === true;
    const userRole = userMembership?.role;
    
    // Permission checks
    const canEditOrg = hasPermission(userRole, PERMISSIONS.EDIT_ORGANIZATION, isOmegaAdmin);
    const canDeleteOrg = hasPermission(userRole, PERMISSIONS.DELETE_ORGANIZATION, isOmegaAdmin);
    const canLeave = !isOmegaAdmin && userMembership;

    const startEditing = () => {
        setIsEditing(true);
        setEditingData({
            name: organization.name || '',
            tagline: organization.tagline || '',
            description: organization.description || '',
            website: organization.website || '',
            location: organization.location || '',
            contact_email: organization.contact_email || ''
        });
    };

    const cancelEditing = () => {
        setIsEditing(false);
        setEditingData({});
        setError('');
    };

    const saveChanges = async () => {
        if (!canEditOrg || !editingData.name?.trim()) return;

        try {
            setSaving(true);
            setError('');

            const updateData = {
                name: editingData.name,
                tagline: editingData.tagline || null,
                description: editingData.description || null,
                website: editingData.website || null,
                location: editingData.location || null,
                contact_email: editingData.contact_email || null,
            };

            const success = await onUpdate(updateData);
            
            if (success) {
                setIsEditing(false);
                setEditingData({});
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-start justify-between flex-wrap gap-4">
                {/* Organization Info */}
                <div className="flex items-center space-x-4 flex-1">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                        {organization.logo_url ? (
                            <img 
                                src={organization.logo_url} 
                                alt={organization.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-2xl">{getOrgTypeIcon(organization.type)}</span>
                        )}
                    </div>
                    
                    <div className="flex-1">
                        {isEditing ? (
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    value={editingData.name}
                                    onChange={(e) => setEditingData(prev => ({ ...prev, name: e.target.value }))}
                                    className="text-2xl font-bold text-slate-800 bg-white border border-slate-300 rounded px-3 py-1 w-full max-w-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Organization Name"
                                    required
                                />
                                <input
                                    type="text"
                                    value={editingData.tagline}
                                    onChange={(e) => setEditingData(prev => ({ ...prev, tagline: e.target.value }))}
                                    className="text-slate-600 bg-white border border-slate-300 rounded px-3 py-1 w-full max-w-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Organization tagline"
                                />
                            </div>
                        ) : (
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800">{organization.name}</h1>
                                {organization.tagline && <p className="text-slate-600 mt-1">{organization.tagline}</p>}
                                <div className="flex items-center mt-2 text-sm text-slate-500 flex-wrap gap-4">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(userRole, isOmegaAdmin)}`}>
                                        {userRole === ROLES.SUPER_ADMIN && <Crown className="w-3 h-3 mr-1.5" />}
                                        {userRole === ROLES.ADMIN && <Shield className="w-3 h-3 mr-1.5" />}
                                        {userRole === ROLES.MEMBER && <Users className="w-3 h-3 mr-1.5" />}
                                        {isOmegaAdmin && <Star className="w-3 h-3 mr-1.5" />}
                                        {getRoleDisplayName(userRole, isOmegaAdmin)}
                                    </span>
                                    <span className="text-slate-400">•</span>
                                    <span className="flex items-center">
                                        <span className="mr-1">{getOrgTypeIcon(organization.type)}</span>
                                        {getOrgTypeLabel(organization.type)}
                                    </span>
                                    {organization.location && (
                                        <>
                                            <span className="text-slate-400">•</span>
                                            <span className="flex items-center">
                                                <MapPin className="w-4 h-4 mr-1.5" />
                                                {organization.location}
                                            </span>
                                        </>
                                    )}
                                    {organization.website && (
                                        <>
                                            <span className="text-slate-400">•</span>
                                            <span className="flex items-center">
                                                <Globe className="w-4 h-4 mr-1.5" />
                                                <a 
                                                    href={organization.website} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="text-blue-600 hover:text-blue-800 transition-colors"
                                                >
                                                    Website
                                                </a>
                                            </span>
                                        </>
                                    )}
                                    {organization.contact_email && (
                                        <>
                                            <span className="text-slate-400">•</span>
                                            <span className="flex items-center">
                                                <Mail className="w-4 h-4 mr-1.5" />
                                                <a 
                                                    href={`mailto:${organization.contact_email}`}
                                                    className="text-blue-600 hover:text-blue-800 transition-colors"
                                                >
                                                    Contact
                                                </a>
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center space-x-3 flex-shrink-0">
                    {isEditing ? (
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={cancelEditing}
                                disabled={saving}
                                className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveChanges}
                                disabled={saving || !editingData.name?.trim()}
                                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center transition-colors"
                            >
                                {saving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Settings className="w-4 h-4 mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <>
                            {canEditOrg && (
                                <button
                                    onClick={startEditing}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
                                >
                                    <Edit size={16} className="mr-2" />
                                    Edit Organization
                                </button>
                            )}
                            {canLeave && (
                                <button
                                    onClick={onLeave}
                                    className="inline-flex items-center px-4 py-2 border border-red-300 text-red-700 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
                                >
                                    <LogOut size={16} className="mr-2" />
                                    Leave Organization
                                </button>
                            )}
                            {canDeleteOrg && (
                                <button
                                    onClick={onDelete}
                                    className="inline-flex items-center px-4 py-2 border border-red-500 text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors"
                                >
                                    <Trash2 size={16} className="mr-2" />
                                    Delete Organization
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Description Section */}
            {isEditing ? (
                <div className="mt-6 pt-6 border-t border-slate-200">
                    <label className="block text-sm font-medium text-slate-700 mb-2">About This Organization</label>
                    <textarea
                        value={editingData.description}
                        onChange={(e) => setEditingData(prev => ({ ...prev, description: e.target.value }))}
                        rows={4}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Describe your organization's mission, activities, and goals..."
                    />
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                            type="text"
                            value={editingData.location}
                            onChange={(e) => setEditingData(prev => ({ ...prev, location: e.target.value }))}
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Location"
                        />
                        <input
                            type="url"
                            value={editingData.website}
                            onChange={(e) => setEditingData(prev => ({ ...prev, website: e.target.value }))}
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Website URL"
                        />
                        <input
                            type="email"
                            value={editingData.contact_email}
                            onChange={(e) => setEditingData(prev => ({ ...prev, contact_email: e.target.value }))}
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Contact Email"
                        />
                    </div>
                </div>
            ) : (
                organization.description && (
                    <div className="mt-6 pt-6 border-t border-slate-200">
                        <h3 className="text-sm font-medium text-slate-700 mb-2">About</h3>
                        <p className="text-slate-600 leading-relaxed">{organization.description}</p>
                    </div>
                )
            )}
        </div>
    );
}