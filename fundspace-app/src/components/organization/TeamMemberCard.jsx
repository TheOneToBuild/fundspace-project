// components/organization/TeamMemberCard.jsx - Complete fixed version with null safety
import React, { useState } from 'react';
import { Crown, Shield, Users, UserPlus, UserMinus, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import Avatar from '../Avatar.jsx';
import { 
    ROLES, 
    getRoleDisplayName, 
    getRoleBadgeColor, 
    hasPermission,
    PERMISSIONS,
    canPromoteToRole,
    canDemoteFromRole
} from '../../utils/organizationPermissions.js';

export default function TeamMemberCard({ 
    member, 
    userMembership, 
    profile, 
    onMemberAction, 
    setError,
    organization
}) {
    const [showDropdown, setShowDropdown] = useState(false);
    const navigate = useNavigate();
    
    // Early return with null safety checks
    if (!member) {
        console.warn('TeamMemberCard: member is null/undefined');
        return null;
    }
    
    if (!member.profiles) {
        console.warn('TeamMemberCard: member.profiles is null/undefined for member:', member);
        return null;
    }
    
    if (!member.profiles.id) {
        console.warn('TeamMemberCard: member.profiles.id is null/undefined for member:', member);
        return null;
    }

    const isOmegaAdmin = profile?.is_omega_admin === true;
    const userRole = userMembership?.role;
    
    const canManageMembers = hasPermission(userRole, PERMISSIONS.MANAGE_MEMBERS, isOmegaAdmin);
    const canManageAdmins = hasPermission(userRole, PERMISSIONS.MANAGE_ADMINS, isOmegaAdmin);

    const handleMemberAction = async (action) => {
        if (!userMembership) return;
        setShowDropdown(false);

        if (member.profile_id === profile?.id) {
            setError('You cannot manage yourself.');
            return;
        }

        try {
            let updateData = {};
            let successMessage = '';
            
            switch(action) {
                case 'promote':
                    if (member.role === 'member' && canPromoteToRole(userRole, 'admin', isOmegaAdmin)) {
                        updateData = { role: 'admin' };
                        successMessage = `Successfully promoted ${member.profiles.full_name} to Admin`;
                    } else if (member.role === 'admin' && canPromoteToRole(userRole, 'super_admin', isOmegaAdmin)) {
                        updateData = { role: 'super_admin' };
                        successMessage = `Successfully promoted ${member.profiles.full_name} to Super Admin`;
                    } else {
                        throw new Error('You do not have permission to promote this member.');
                    }
                    break;
                case 'demote':
                    if (member.role === 'super_admin' && canDemoteFromRole(userRole, 'super_admin', isOmegaAdmin)) {
                        updateData = { role: 'admin' };
                        successMessage = `Successfully changed ${member.profiles.full_name}'s role to Admin`;
                    } else if (member.role === 'admin' && canDemoteFromRole(userRole, 'admin', isOmegaAdmin)) {
                        updateData = { role: 'member' };
                        successMessage = `Successfully changed ${member.profiles.full_name}'s role to Member`;
                    } else {
                        throw new Error('You do not have permission to demote this member.');
                    }
                    break;
                case 'remove':
                    if (!canManageMembers) {
                        throw new Error('You do not have permission to remove members.');
                    }
                    const { error: removeError } = await supabase
                        .from('organization_memberships')
                        .delete()
                        .eq('id', member.id);
                    
                    if (removeError) throw removeError;

                    console.log(`Successfully removed ${member.profiles.full_name}`);
                    
                    if (onMemberAction) {
                        onMemberAction();
                    }
                    return;
            }

            // Handle role updates
            if (Object.keys(updateData).length > 0) {
                const { error } = await supabase
                    .from('organization_memberships')
                    .update(updateData)
                    .eq('id', member.id);

                if (error) throw error;

                console.log(successMessage);

                if (onMemberAction) {
                    onMemberAction();
                }
            }

        } catch (err) {
            console.error(`Error ${action}ing member:`, err);
            setError(`Failed to ${action} member. Please try again.`);
        }
    };

    const handleCardClick = () => {
        // Safe navigation using the profiles.id we've already verified exists
        if (member.profiles?.id) {
            navigate(`/profile/members/${member.profiles.id}`);
        }
    };

    const canShowActions = canManageMembers && member.profile_id !== profile?.id;

    return (
        <div 
            className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer relative w-80 mx-auto"
            onClick={handleCardClick}
        >
            {/* Organization Banner Background */}
            <div className="h-24 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 relative">
                {organization?.banner_image_url ? (
                    <div 
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${organization.banner_image_url})` }}
                    />
                ) : organization?.image_url ? (
                    <div 
                        className="absolute inset-0 bg-cover bg-center opacity-30"
                        style={{ backgroundImage: `url(${organization.image_url})` }}
                    />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-black/30" />
                
                {/* Management Dropdown */}
                {canShowActions && (
                    <div className="absolute top-2 right-2 z-10">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowDropdown(!showDropdown);
                            }}
                            className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                        >
                            <MoreVertical className="w-4 h-4 text-white" />
                        </button>

                        {/* Dropdown Menu */}
                        {showDropdown && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1">
                                {/* Role Management */}
                                {canManageMembers && (
                                    <>
                                        {member.role === 'member' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleMemberAction('promote');
                                                }}
                                                className="flex items-center w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                                            >
                                                <UserPlus className="w-4 h-4 mr-3" />
                                                Promote to Admin
                                            </button>
                                        )}
                                        
                                        {member.role === 'admin' && canManageAdmins && (
                                            <>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleMemberAction('promote');
                                                    }}
                                                    className="flex items-center w-full px-4 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors"
                                                >
                                                    <Crown className="w-4 h-4 mr-3" />
                                                    Promote to Super Admin
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleMemberAction('demote');
                                                    }}
                                                    className="flex items-center w-full px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 transition-colors"
                                                >
                                                    <UserMinus className="w-4 h-4 mr-3" />
                                                    Demote to Member
                                                </button>
                                            </>
                                        )}

                                        {member.role === 'super_admin' && canManageAdmins && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleMemberAction('demote');
                                                }}
                                                className="flex items-center w-full px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 transition-colors"
                                            >
                                                <UserMinus className="w-4 h-4 mr-3" />
                                                Demote to Admin
                                            </button>
                                        )}
                                    </>
                                )}
                                
                                {/* Remove from Organization */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleMemberAction('remove');
                                    }}
                                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    <UserMinus className="w-4 h-4 mr-3" />
                                    Remove from Organization
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Profile Content */}
            <div className="px-6 pb-6 text-center">
                {/* Avatar - overlapping banner */}
                <div className="flex justify-center -mt-12 mb-4">
                    <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-white shadow-lg bg-slate-100">
                        <Avatar 
                            src={member.profiles?.avatar_url} 
                            fullName={member.profiles?.full_name} 
                            size="xl"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                {/* Member Info */}
                <h3 className="font-semibold text-slate-900 text-lg mb-1 leading-tight">
                    {member.profiles?.full_name || 'Unknown User'}
                </h3>
                
                {member.profiles?.title && (
                    <p className="text-slate-600 mb-4 text-sm">{member.profiles.title}</p>
                )}

                {/* Role Badge */}
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(member.role, member.profiles?.is_omega_admin)}`}>
                    {member.role === 'super_admin' && <Crown className="w-4 h-4 mr-2" />}
                    {member.role === 'admin' && <Shield className="w-4 h-4 mr-2" />}
                    {member.role === 'member' && <Users className="w-4 h-4 mr-2" />}
                    {getRoleDisplayName(member.role, member.profiles?.is_omega_admin)}
                </span>
            </div>
        </div>
    );
}