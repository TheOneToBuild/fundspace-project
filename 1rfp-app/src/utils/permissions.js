// src/utils/permissions.js - Updated with enhanced Super Admin support

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
  VIEW_ORGANIZATION: 'view_organization'
};

/**
 * Check if a user role has a specific permission
 * @param {string} userRole - The user's role (omega_admin, super_admin, admin, or member)
 * @param {string} permission - The permission to check
 * @param {boolean} isOmegaAdmin - Whether the user is an omega admin (from profile.is_omega_admin)
 * @returns {boolean} - Whether the user has the permission
 */
export function hasPermission(userRole, permission, isOmegaAdmin = false) {
  // FIXED: Omega admins have all permissions - check this first
  if (isOmegaAdmin === true) {
    return true;
  }

  const rolePermissions = {
    [ROLES.SUPER_ADMIN]: [
      PERMISSIONS.EDIT_ORGANIZATION,
      PERMISSIONS.MANAGE_ADMINS,
      PERMISSIONS.MANAGE_MEMBERS,
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
 * Check if current user can manage a target user based on roles
 * @param {string} currentUserRole - Current user's role
 * @param {string} targetUserRole - Target user's role
 * @param {boolean} isOmegaAdmin - Whether current user is omega admin
 * @returns {boolean} - Whether current user can manage target user
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
 * @param {string} currentUserRole - Current user's role
 * @param {string} targetRole - Role to promote to
 * @param {boolean} isOmegaAdmin - Whether current user is omega admin
 * @returns {boolean} - Whether current user can promote to target role
 */
export function canPromoteToRole(currentUserRole, targetRole, isOmegaAdmin = false) {
  // Omega admins can promote to any role except omega_admin
  if (isOmegaAdmin === true) {
    return [ROLES.MEMBER, ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(targetRole);
  }

  // Super admins can promote to any role except omega_admin and super_admin
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
 * @param {string} currentUserRole - Current user's role
 * @param {string} currentTargetRole - Target user's current role
 * @param {boolean} isOmegaAdmin - Whether current user is omega admin
 * @returns {boolean} - Whether current user can demote target user
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
 * @param {string} currentUserRole - Current user's role
 * @param {boolean} isOmegaAdmin - Whether current user is omega admin
 * @returns {boolean} - Whether current user can access member management
 */
export function canAccessMemberManagement(currentUserRole, isOmegaAdmin = false) {
  if (isOmegaAdmin === true) {
    return true;
  }
  
  return [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(currentUserRole);
}

/**
 * Get display name for a role
 * @param {string} role - The role
 * @param {boolean} isOmegaAdmin - Whether the user is an omega admin
 * @returns {string} - Human readable role name
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
 * @param {string} role - The role
 * @param {boolean} isOmegaAdmin - Whether the user is an omega admin
 * @returns {string} - CSS classes for styling the role badge
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
 * @param {string} role - The role
 * @param {boolean} isOmegaAdmin - Whether the user is an omega admin
 * @returns {string} - Icon name
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
 * Check if user has platform-level admin privileges
 * @param {boolean} isOmegaAdmin - Whether the user is an omega admin
 * @returns {boolean} - Whether the user can access platform admin features
 */
export function isPlatformAdmin(isOmegaAdmin) {
  return isOmegaAdmin === true;
}

/**
 * Check if user can edit any organization (not just their own)
 * @param {boolean} isOmegaAdmin - Whether the user is an omega admin
 * @returns {boolean} - Whether the user can edit any organization
 */
export function canEditAnyOrganization(isOmegaAdmin) {
  return isOmegaAdmin === true;
}

/**
 * Check if user can access organization claim management
 * @param {boolean} isOmegaAdmin - Whether the user is an omega admin
 * @returns {boolean} - Whether the user can manage organization claims
 */
export function canManageOrganizationClaims(isOmegaAdmin) {
  return isOmegaAdmin === true;
}