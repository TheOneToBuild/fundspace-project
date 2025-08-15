// components/organization/OrganizationHeader.jsx - Enhanced banner implementation with fixed dropdown
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    MapPin, Globe, Mail, Edit, LogOut, Trash2, Settings, 
    Crown, Shield, Users, Star, MoreVertical, ExternalLink
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
    const [showDropdown, setShowDropdown] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
    const buttonRef = useRef(null);
    const navigate = useNavigate();

    const isOmegaAdmin = profile?.is_omega_admin === true;
    const userRole = userMembership?.role;
    
    // Permission checks
    const canEditOrg = hasPermission(userRole, PERMISSIONS.EDIT_ORGANIZATION, isOmegaAdmin);
    const canDeleteOrg = hasPermission(userRole, PERMISSIONS.DELETE_ORGANIZATION, isOmegaAdmin);
    const canLeave = !isOmegaAdmin && userMembership;

    const handleEditOrganization = () => {
        setShowDropdown(false);
        
        // For Omega Admins, store the organization info in sessionStorage
        if (isOmegaAdmin) {
            sessionStorage.setItem('omegaAdminEditOrg', JSON.stringify({
                id: organization.id,
                type: organization.type
            }));
        }
        
        // Navigate to the organization profile page with edit mode
        if (organization.slug) {
            navigate(`/organizations/${organization.slug}?edit=true`);
        } else {
            // Fallback if no slug
            navigate(`/organizations/${organization.id}?edit=true`);
        }
    };

    const handleDropdownToggle = () => {
        if (!showDropdown && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 8,
                right: window.innerWidth - rect.right
            });
        }
        setShowDropdown(!showDropdown);
    };

    if (!organization) return null;

    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            {/* Enhanced Banner Section */}
            <div className="relative">
                {/* Banner Image */}
                <div className="aspect-[6/1] overflow-hidden bg-gradient-to-br from-slate-100 via-white to-slate-100">
                    {organization.banner_url || organization.banner_image_url ? (
                        <img 
                            src={organization.banner_url || organization.banner_image_url} 
                            alt={`${organization.name} banner`}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        // Default gradient banner if no image
                        <div className="w-full h-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
                            <div className="text-6xl opacity-20">
                                {getOrgTypeIcon(organization.type)}
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Banner Overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            </div>
            
            <div className="p-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start space-x-4">
                        {/* Organization Logo - positioned to overlap banner */}
                        <div className="relative group flex-shrink-0 -mt-12">
                            <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                                {organization.image_url || organization.logo_url ? (
                                    <img 
                                        src={organization.image_url || organization.logo_url} 
                                        alt={organization.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-2xl">{getOrgTypeIcon(organization.type)}</span>
                                )}
                            </div>
                        </div>
                        
                        <div className="min-w-0 flex-1">
                            {/* Organization Name & Type */}
                            <div className="flex items-center flex-wrap gap-2 mb-2">
                                <h1 className="text-2xl font-bold text-slate-900 truncate">
                                    {organization.name}
                                </h1>
                                <span className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full">
                                    <span className="mr-1">{getOrgTypeIcon(organization.type)}</span>
                                    {getOrgTypeLabel(organization.type)}
                                </span>
                            </div>

                            {/* Organization Meta Info */}
                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                                <span className="flex items-center">
                                    {userRole === ROLES.SUPER_ADMIN && <Crown className="w-3 h-3 mr-1.5" />}
                                    {userRole === ROLES.ADMIN && <Shield className="w-3 h-3 mr-1.5" />}
                                    {userRole === ROLES.MEMBER && <Users className="w-3 h-3 mr-1.5" />}
                                    {isOmegaAdmin && <Star className="w-3 h-3 mr-1.5" />}
                                    {getRoleDisplayName(userRole, isOmegaAdmin)}
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
                                        <a 
                                            href={organization.website} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center hover:text-blue-600 transition-colors"
                                        >
                                            <Globe className="w-4 h-4 mr-1.5" />
                                            Website
                                        </a>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-3">
                        {/* View Public Profile Button */}
                        {organization.slug && (
                            <a
                                href={`/organizations/${organization.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-2 border border-slate-300 rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors text-sm"
                            >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View Public Profile
                            </a>
                        )}

                        {/* Management Dropdown */}
                        {(canEditOrg || canLeave || canDeleteOrg) && (
                            <div className="relative">
                                <button
                                    ref={buttonRef}
                                    onClick={handleDropdownToggle}
                                    className="inline-flex items-center px-3 py-2 border border-slate-300 rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                                >
                                    <Settings className="w-4 h-4 mr-2" />
                                    Manage
                                    <MoreVertical className="w-4 h-4 ml-2" />
                                </button>

                                {showDropdown && (
                                    <>
                                        {/* Backdrop */}
                                        <div 
                                            className="fixed inset-0 z-40" 
                                            onClick={() => setShowDropdown(false)}
                                        />
                                        
                                        {/* Dropdown Menu - positioned with calculated coordinates */}
                                        <div 
                                            className="fixed z-50 w-64 bg-white rounded-lg shadow-xl border border-slate-200 py-2"
                                            style={{
                                                top: `${dropdownPosition.top}px`,
                                                right: `${dropdownPosition.right}px`
                                            }}
                                        >
                                            {canEditOrg && (
                                                <button
                                                    onClick={handleEditOrganization}
                                                    className="flex items-start w-full px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                                                >
                                                    <Edit className="w-4 h-4 mr-3 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        <div className="font-medium mb-1">Edit Public Profile</div>
                                                        <div className="text-xs text-slate-500 leading-relaxed">Update your organization's public information</div>
                                                    </div>
                                                </button>
                                            )}
                                            {canLeave && (
                                                <>
                                                    {canEditOrg && <div className="border-t border-slate-100 my-1" />}
                                                    <button
                                                        onClick={() => {
                                                            setShowDropdown(false);
                                                            onLeave();
                                                        }}
                                                        className="flex items-start w-full px-4 py-3 text-sm text-orange-600 hover:bg-orange-50 transition-colors text-left"
                                                    >
                                                        <LogOut className="w-4 h-4 mr-3 mt-0.5 flex-shrink-0" />
                                                        <div>
                                                            <div className="font-medium mb-1">Leave Organization</div>
                                                            <div className="text-xs text-orange-500 leading-relaxed">Remove yourself from this organization</div>
                                                        </div>
                                                    </button>
                                                </>
                                            )}
                                            {canDeleteOrg && (
                                                <>
                                                    {(canEditOrg || canLeave) && <div className="border-t border-slate-100 my-1" />}
                                                    <button
                                                        onClick={() => {
                                                            setShowDropdown(false);
                                                            onDelete();
                                                        }}
                                                        className="flex items-start w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-3 mt-0.5 flex-shrink-0" />
                                                        <div>
                                                            <div className="font-medium mb-1">Delete Organization</div>
                                                            <div className="text-xs text-red-500 leading-relaxed">Permanently remove this organization</div>
                                                        </div>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Description/Mission */}
                {organization.description && (
                    <div className="mt-6 pt-6 border-t border-slate-200">
                        <h3 className="text-sm font-medium text-slate-700 mb-2">Mission</h3>
                        <p className="text-slate-600 leading-relaxed">{organization.description}</p>
                    </div>
                )}
            </div>
        </div>
    );
}