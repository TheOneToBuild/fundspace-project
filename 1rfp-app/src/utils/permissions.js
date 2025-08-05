export const ROLES = {
  OMEGA_ADMIN: 'omega_admin',
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MEMBER: 'member'
};

export const PERMISSIONS = {
  PLATFORM_MANAGEMENT: 'platform_management',
  VIEW_ALL_ORGANIZATIONS: 'view_all_organizations',
  EDIT_ORGANIZATION: 'edit_organization',
  MANAGE_ADMINS: 'manage_admins',
  MANAGE_MEMBERS: 'manage_members',
  APPOINT_SUPER_ADMIN: 'appoint_super_admin',
  DELETE_ORGANIZATION: 'delete_organization',
  VIEW_ORGANIZATION: 'view_organization'
};

export function hasPermission(userRole, permission, isOmegaAdmin = false) {
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

export function isPlatformAdmin(isOmegaAdmin) {
  return isOmegaAdmin === true;
}

export function canEditAnyOrganization(isOmegaAdmin) {
  return isOmegaAdmin === true;
}

export function canAppointSuperAdmin(currentUserRole, isOmegaAdmin = false) {
  return hasPermission(currentUserRole, PERMISSIONS.APPOINT_SUPER_ADMIN, isOmegaAdmin);
}

export async function checkExistingSuperAdmins(organizationId) {
  const { supabase } = await import('../supabaseClient');
  
  const { data: existingSuperAdmins, error } = await supabase
    .from('organization_memberships')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('role', 'super_admin');
  
  if (error) {
    console.error('Error checking existing super admins:', error);
    return true;
  }
  
  return existingSuperAdmins && existingSuperAdmins.length > 0;
}

export async function determineJoinRole(organizationId) {
  const hasExistingSuperAdmins = await checkExistingSuperAdmins(organizationId);
  return hasExistingSuperAdmins ? ROLES.MEMBER : ROLES.SUPER_ADMIN;
}

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

export function canManageUser(currentUserRole, targetUserRole, isOmegaAdmin = false) {
  if (isOmegaAdmin === true) {
    return true;
  }

  if (currentUserRole === ROLES.SUPER_ADMIN && targetUserRole !== ROLES.OMEGA_ADMIN) {
    return true;
  }
  
  if (currentUserRole === ROLES.ADMIN && targetUserRole === ROLES.MEMBER) {
    return true;
  }
  
  return false;
}

export function canPromoteToRole(currentUserRole, targetRole, isOmegaAdmin = false) {
  if (isOmegaAdmin === true) {
    return [ROLES.MEMBER, ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(targetRole);
  }

  if (currentUserRole === ROLES.SUPER_ADMIN) {
    return [ROLES.MEMBER, ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(targetRole);
  }
  
  if (currentUserRole === ROLES.ADMIN) {
    return [ROLES.MEMBER, ROLES.ADMIN].includes(targetRole);
  }
  
  return false;
}

export function canDemoteFromRole(currentUserRole, currentTargetRole, isOmegaAdmin = false) {
  if (isOmegaAdmin === true) {
    return currentTargetRole !== ROLES.OMEGA_ADMIN;
  }

  if (currentUserRole === ROLES.SUPER_ADMIN) {
    return [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MEMBER].includes(currentTargetRole);
  }
  
  if (currentUserRole === ROLES.ADMIN) {
    return [ROLES.ADMIN, ROLES.MEMBER].includes(currentTargetRole);
  }
  
  return false;
}

export function canAccessMemberManagement(currentUserRole, isOmegaAdmin = false) {
  if (isOmegaAdmin === true) {
    return true;
  }
  
  return [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(currentUserRole);
}

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