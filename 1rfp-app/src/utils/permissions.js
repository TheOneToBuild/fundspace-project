// src/utils/permissions.js - Complete permissions system with all exports

export const ROLES = {
  OMEGA_ADMIN: 'omega_admin',
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MEMBER: 'member'
};

export const PERMISSIONS = {
  // Platform-level permissions
  APPROVE_ADMIN_CLAIMS: 'approve_admin_claims',
  PLATFORM_MANAGEMENT: 'platform_management',
  VIEW_ALL_ORGANIZATIONS: 'view_all_organizations',
  
  // Organization-level permissions
  EDIT_ORGANIZATION: 'edit_organization',
  MANAGE_ADMINS: 'manage_admins',
  MANAGE_MEMBERS: 'manage_members',
  APPOINT_SUPER_ADMIN: 'appoint_super_admin',
  DELETE_ORGANIZATION: 'delete_organization',
  VIEW_ORGANIZATION: 'view_organization'
};

/**
 * Check if a user role has a specific permission
 */
export function hasPermission(userRole, permission, isOmegaAdmin = false) {
  // Omega admins have all permissions
  if (isOmegaAdmin === true) {
    return true;
  }

  const rolePermissions = {
    [ROLES.SUPER_ADMIN]: [
      PERMISSIONS.EDIT_ORGANIZATION,
      PERMISSIONS.MANAGE_ADMINS,
      PERMISSIONS.MANAGE_MEMBERS,
      PERMISSIONS.APPOINT_SUPER_ADMIN,
      PERMISSIONS.DELETE_ORGANIZATION,
      PERMISSIONS.VIEW_ORGANIZATION
    ],
    [ROLES.ADMIN]: [
      PERMISSIONS.MANAGE_MEMBERS,
      PERMISSIONS.VIEW_ORGANIZATION
    ],
    [ROLES.MEMBER]: [
      PERMISSIONS.VIEW_ORGANIZATION
    ]
  };

  return rolePermissions[userRole]?.includes(permission) || false;
}

/**
 * Check if user has platform-level admin privileges
 */
export function isPlatformAdmin(isOmegaAdmin) {
  return isOmegaAdmin === true;
}

/**
 * Check if user can edit any organization (not just their own)
 */
export function canEditAnyOrganization(isOmegaAdmin) {
  return isOmegaAdmin === true;
}

/**
 * Check if user can access organization claim management
 */
export function canManageOrganizationClaims(isOmegaAdmin) {
  return isOmegaAdmin === true;
}

/**
 * Check if user can appoint super admins
 */
export function canAppointSuperAdmin(currentUserRole, isOmegaAdmin = false) {
  return hasPermission(currentUserRole, PERMISSIONS.APPOINT_SUPER_ADMIN, isOmegaAdmin);
}

/**
 * Check if organization has existing super admins
 */
export async function checkExistingSuperAdmins(organizationId) {
  const { supabase } = await import('../supabaseClient');
  
  const { data: existingSuperAdmins, error } = await supabase
    .from('organization_memberships')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('role', 'super_admin');
  
  if (error) {
    console.error('Error checking existing super admins:', error);
    return true; // Default to assuming admins exist to be safe
  }
  
  return existingSuperAdmins && existingSuperAdmins.length > 0;
}

/**
 * Determine role for new member joining organization
 */
export async function determineJoinRole(organizationId) {
  const hasExistingSuperAdmins = await checkExistingSuperAdmins(organizationId);
  return hasExistingSuperAdmins ? ROLES.MEMBER : ROLES.SUPER_ADMIN;
}

/**
 * Promote member to super admin
 */
export async function promoteMemberToSuperAdmin(profileId, organizationId) {
  const { supabase } = await import('../supabaseClient');
  
  try {
    const { error } = await supabase
      .from('organization_memberships')
      .update({ role: ROLES.SUPER_ADMIN })
      .eq('profile_id', profileId)
      .eq('organization_id', organizationId);

    if (error) {
      throw new Error(`Failed to promote to super admin: ${error.message}`);
    }

    return { success: true };
  } catch (err) {
    console.error('Error promoting to super admin:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Check if current user can manage a target user based on roles
 */
export function canManageUser(currentUserRole, targetUserRole, isOmegaAdmin = false) {
  // Omega admins can manage everyone
  if (isOmegaAdmin === true) {
    return true;
  }

  // Super admins can manage everyone except omega admins
  if (currentUserRole === ROLES.SUPER_ADMIN && targetUserRole !== ROLES.OMEGA_ADMIN) {
    return true;
  }
  
  // Regular admins can only manage members
  if (currentUserRole === ROLES.ADMIN && targetUserRole === ROLES.MEMBER) {
    return true;
  }
  
  return false;
}

/**
 * Check if current user can promote target user to a specific role
 */
export function canPromoteToRole(currentUserRole, targetRole, isOmegaAdmin = false) {
  // Omega admins can promote to any role except omega_admin
  if (isOmegaAdmin === true) {
    return [ROLES.MEMBER, ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(targetRole);
  }

  // Super admins can promote to any role including super_admin
  if (currentUserRole === ROLES.SUPER_ADMIN) {
    return [ROLES.MEMBER, ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(targetRole);
  }
  
  // Regular admins can only promote to member or admin
  if (currentUserRole === ROLES.ADMIN) {
    return [ROLES.MEMBER, ROLES.ADMIN].includes(targetRole);
  }
  
  return false;
}

/**
 * Check if current user can demote target user from a specific role
 */
export function canDemoteFromRole(currentUserRole, currentTargetRole, isOmegaAdmin = false) {
  // Omega admins can demote anyone except other omega admins
  if (isOmegaAdmin === true) {
    return currentTargetRole !== ROLES.OMEGA_ADMIN;
  }

  // Super admins can demote anyone except omega admins
  if (currentUserRole === ROLES.SUPER_ADMIN) {
    return [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MEMBER].includes(currentTargetRole);
  }
  
  // Regular admins can only demote other admins and members
  if (currentUserRole === ROLES.ADMIN) {
    return [ROLES.ADMIN, ROLES.MEMBER].includes(currentTargetRole);
  }
  
  return false;
}

/**
 * Check if current user can manage members (view member management interface)
 */
export function canAccessMemberManagement(currentUserRole, isOmegaAdmin = false) {
  if (isOmegaAdmin === true) {
    return true;
  }
  
  return [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(currentUserRole);
}

/**
 * Get display name for a role
 */
export function getRoleDisplayName(role, isOmegaAdmin = false) {
  if (isOmegaAdmin === true) {
    return 'Omega Admin';
  }

  const roleNames = {
    [ROLES.SUPER_ADMIN]: 'Super Admin',
    [ROLES.ADMIN]: 'Admin',
    [ROLES.MEMBER]: 'Member'
  };
  
  return roleNames[role] || 'Unknown';
}

/**
 * Get Tailwind CSS classes for role badges
 */
export function getRoleBadgeColor(role, isOmegaAdmin = false) {
  if (isOmegaAdmin === true) {
    return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
  }

  const colors = {
    [ROLES.SUPER_ADMIN]: 'bg-purple-100 text-purple-800',
    [ROLES.ADMIN]: 'bg-green-100 text-green-800',
    [ROLES.MEMBER]: 'bg-blue-100 text-blue-800'
  };
  
  return colors[role] || 'bg-gray-100 text-gray-800';
}

/**
 * Get the appropriate icon name for a role (for use with lucide-react)
 */
export function getRoleIcon(role, isOmegaAdmin = false) {
  if (isOmegaAdmin === true) {
    return 'Star';
  }

  const icons = {
    [ROLES.SUPER_ADMIN]: 'Crown',
    [ROLES.ADMIN]: 'Shield',
    [ROLES.MEMBER]: 'Users'
  };
  
  return icons[role] || 'User';
}

/**
 * Organization type utilities
 */
export const getOrgTypeIcon = (type) => {
  const iconMap = {
    'nonprofit': '🏛️',
    'foundation': '💰',
    'government': '🏛️',
    'for-profit': '🏢',
    'education': '🎓',
    'healthcare': '🏥',
    'religious': '⛪',
    'international': '🌍'
  };
  return iconMap[type] || '🏢';
};

export const getOrgTypeLabel = (type) => {
  const labelMap = {
    'nonprofit': 'Nonprofit Organization',
    'foundation': 'Foundation',
    'government': 'Government Agency',
    'for-profit': 'For-Profit Company',
    'education': 'Educational Institution',
    'healthcare': 'Healthcare Organization',
    'religious': 'Religious Organization',
    'international': 'International Organization'
  };
  return labelMap[type] || 'Organization';
};