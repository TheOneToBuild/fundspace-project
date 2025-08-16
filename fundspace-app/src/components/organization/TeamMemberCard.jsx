// components/organization/TeamMemberCard.jsx - LinkedIn-sized card with proper organization banner and clickable
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
    PERMISSIONS
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
    const isOmegaAdmin = profile?.is_omega_admin === true;
    const userRole = userMembership?.role;
    
    const canManageMembers = hasPermission(userRole, PERMISSIONS.MANAGE_MEMBERS, isOmegaAdmin);
    const canManageAdmins = hasPermission(userRole, PERMISSIONS.MANAGE_ADMINS, isOmegaAdmin);

    const handleMemberAction = async (action) => {
        if (!userMembership) return;
        setShowDropdown(false);

        if (!userMembership || member.profile_id === profile.id) {
            setError('You do not have permission to manage this user.');
            return;
        }

        try {
            if (action === 'promote') {
                const { error } = await supabase
                    .from('organization_memberships')
                    .update({ role: ROLES.ADMIN })
                    .eq('profile_id', member.profile_id)
                    .eq('organization_id', userMembership.organization_id);

                if (error) throw error;
                await onMemberAction();

            } else if (action === 'demote') {
                const { error } = await supabase
                    .from('organization_memberships')
                    .update({ role: ROLES.MEMBER })
                    .eq('profile_id', member.profile_id)
                    .eq('organization_id', userMembership.organization_id);

                if (error) throw error;
                await onMemberAction();

            } else if (action === 'remove') {
                const { error } = await supabase
                    .from('organization_memberships')
                    .delete()
                    .eq('profile_id', member.profile_id)
                    .eq('organization_id', userMembership.organization_id);

                if (error) throw error;
                await onMemberAction();
            }
        } catch (err) {
            setError(`Error ${action}ing member: ${err.message}`);
        }
    };

    const canShowActions = canManageMembers && member.profile_id !== profile.id;

    // Handle click to profile  
    const handleCardClick = () => {
        const profileId = member.profile_id;
        
        if (profileId) {
            navigate(`/profile/members/${profileId}`);
        }
    };



    return (
        <div 
            className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer relative w-80 mx-auto"
            onClick={handleCardClick}
        >
            {/* Organization Banner Background - LinkedIn sized */}
            <div className="h-24 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 relative">
                {organization?.banner_image_url ? (
                    <img 
                        src={organization.banner_image_url} 
                        alt="Organization banner" 
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500" />
                )}
                
                {/* Action Menu - positioned on banner */}
                {canShowActions && (
                    <div className="absolute top-3 right-3">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowDropdown(!showDropdown);
                            }}
                            className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>

                        {showDropdown && (
                            <>
                                {/* Backdrop */}
                                <div 
                                    className="fixed inset-0 z-10" 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowDropdown(false);
                                    }}
                                />
                                
                                {/* Dropdown Menu */}
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                                    {/* Promote to Admin */}
                                    {member.role === ROLES.MEMBER && canManageAdmins && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleMemberAction('promote');
                                            }}
                                            className="flex items-center w-full px-4 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors"
                                        >
                                            <UserPlus className="w-4 h-4 mr-3" />
                                            Promote to Admin
                                        </button>
                                    )}
                                    
                                    {/* Demote to Member */}
                                    {(member.role === ROLES.ADMIN || member.role === ROLES.SUPER_ADMIN) && canManageAdmins && (
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
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Profile Content */}
            <div className="px-6 pb-6 text-center">
                {/* Avatar - overlapping banner, LinkedIn-sized */}
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