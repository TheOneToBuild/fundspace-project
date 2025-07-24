// components/organization/TeamMemberCard.jsx
import React from 'react';
import { Crown, Shield, Users, UserPlus, UserMinus } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import Avatar from '../Avatar.jsx';
import { 
    ROLES, 
    getRoleDisplayName, 
    getRoleBadgeColor, 
    canManageUser,
    hasPermission,
    PERMISSIONS
} from '../../utils/organizationPermissions.js';

export default function TeamMemberCard({ 
    member, 
    userMembership, 
    profile, 
    onMemberAction, 
    setError 
}) {
    const isOmegaAdmin = profile?.is_omega_admin === true;
    const userRole = userMembership?.role;
    
    const canManageMembers = hasPermission(userRole, PERMISSIONS.MANAGE_MEMBERS, isOmegaAdmin);
    const canManageAdmins = hasPermission(userRole, PERMISSIONS.MANAGE_ADMINS, isOmegaAdmin);

    const getRoleIcon = (role) => {
        switch (role) {
            case 'super_admin': 
                return <Crown className="text-yellow-500" size={16} />;
            case 'admin': 
                return <Shield className="text-blue-500" size={16} />;
            case 'member': 
                return <Users className="text-green-500" size={16} />;
            default: 
                return <Users className="text-slate-400" size={16} />;
        }
    };

    const handleMemberAction = async (action) => {
        if (!userMembership) return;

        const currentUserRole = userMembership.role;
        const targetRole = member.role;
        
        if (!canManageUser(currentUserRole, targetRole, isOmegaAdmin)) {
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

    return (
        <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            {/* Member Info */}
            <div className="flex items-center space-x-3">
                <Avatar 
                    src={member.profiles?.avatar_url} 
                    fullName={member.profiles?.full_name} 
                    size="md" 
                />
                <div>
                    <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-slate-800">
                            {member.profiles?.full_name || 'Unknown User'}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role, member.profiles?.is_omega_admin)}`}>
                            {getRoleIcon(member.role)}
                            <span className="ml-1">
                                {getRoleDisplayName(member.role, member.profiles?.is_omega_admin)}
                            </span>
                        </span>
                    </div>
                    {member.profiles?.title && (
                        <p className="text-sm text-slate-500">{member.profiles.title}</p>
                    )}
                    <p className="text-xs text-slate-400">
                        Joined {new Date(member.joined_at).toLocaleDateString()}
                    </p>
                </div>
            </div>

            {/* Action Buttons */}
            {canManageMembers && member.profile_id !== profile.id && (
                <div className="flex items-center space-x-2">
                    {/* Promote to Admin */}
                    {member.role === ROLES.MEMBER && canManageAdmins && (
                        <button
                            onClick={() => handleMemberAction('promote')}
                            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                            title="Promote to Admin"
                        >
                            <UserPlus className="w-4 h-4" />
                        </button>
                    )}
                    
                    {/* Demote to Member */}
                    {(member.role === ROLES.ADMIN || member.role === ROLES.SUPER_ADMIN) && canManageAdmins && (
                        <button
                            onClick={() => handleMemberAction('demote')}
                            className="p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Demote to Member"
                        >
                            <UserMinus className="w-4 h-4" />
                        </button>
                    )}
                    
                    {/* Remove from Organization */}
                    <button
                        onClick={() => handleMemberAction('remove')}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove from Organization"
                    >
                        <UserMinus className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}