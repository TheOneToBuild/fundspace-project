// utils/organizationPermissions.js - Updated to remove analytics and impact stories

export const ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    MEMBER: 'member'
};

export const PERMISSIONS = {
    EDIT_ORGANIZATION: 'edit_organization',
    DELETE_ORGANIZATION: 'delete_organization',
    MANAGE_MEMBERS: 'manage_members',
    INVITE_MEMBERS: 'invite_members',
    REMOVE_MEMBERS: 'remove_members',
    CHANGE_ROLES: 'change_roles'
};

export const hasPermission = (userRole, permission, isOmegaAdmin = false) => {
    if (isOmegaAdmin) return true;
    
    const rolePermissions = {
        [ROLES.SUPER_ADMIN]: [
            PERMISSIONS.EDIT_ORGANIZATION,
            PERMISSIONS.DELETE_ORGANIZATION,
            PERMISSIONS.MANAGE_MEMBERS,
            PERMISSIONS.INVITE_MEMBERS,
            PERMISSIONS.REMOVE_MEMBERS,
            PERMISSIONS.CHANGE_ROLES
        ],
        [ROLES.ADMIN]: [
            PERMISSIONS.EDIT_ORGANIZATION,
            PERMISSIONS.MANAGE_MEMBERS,
            PERMISSIONS.INVITE_MEMBERS,
            PERMISSIONS.REMOVE_MEMBERS
        ],
        [ROLES.MEMBER]: []
    };

    return rolePermissions[userRole]?.includes(permission) || false;
};

export const getRoleDisplayName = (role, isOmegaAdmin = false) => {
    if (isOmegaAdmin) return 'Omega Admin';
    
    const roleNames = {
        [ROLES.SUPER_ADMIN]: 'Super Admin',
        [ROLES.ADMIN]: 'Admin',
        [ROLES.MEMBER]: 'Member'
    };
    
    return roleNames[role] || 'Member';
};

export const getRoleBadgeColor = (role, isOmegaAdmin = false) => {
    if (isOmegaAdmin) return 'bg-yellow-100 text-yellow-800';
    
    const roleColors = {
        [ROLES.SUPER_ADMIN]: 'bg-purple-100 text-purple-800',
        [ROLES.ADMIN]: 'bg-blue-100 text-blue-800',
        [ROLES.MEMBER]: 'bg-slate-100 text-slate-800'
    };
    
    return roleColors[role] || 'bg-slate-100 text-slate-800';
};

export const getOrgTypeIcon = (type) => {
    const iconMap = {
        'nonprofit': '💙',
        'foundation': '🏛️',
        'funder': '💰',
        'for-profit': '🏢',
        'forprofit': '🏢',
        'government': '🏛️',
        'healthcare': '🏥',
        'education': '🎓',
        'religious': '⛪',
        'international': '🌍'
    };
    return iconMap[type?.toLowerCase()] || '🏢';
};

export const getOrgTypeLabel = (type) => {
    const labelMap = {
        'nonprofit': '501(c)(3) Nonprofit',
        'foundation': 'Foundation',
        'funder': 'Funder',
        'for-profit': 'Company',
        'forprofit': 'Company',
        'government': 'Government Agency',
        'healthcare': 'Healthcare Organization',
        'education': 'Educational Institution',
        'religious': 'Religious Organization',
        'international': 'International Organization'
    };
    return labelMap[type] || type;
};

export const getTabsForOrganizationType = (organizationType, canViewAnalytics = false) => {
    const baseTabs = [
        { id: 'overview', label: 'Overview', icon: 'Building2' },
        { id: 'team', label: 'Team', icon: 'Users' }
    ];

    if (organizationType === 'nonprofit') {
        return [
            ...baseTabs,
            { id: 'programs', label: 'Programs', icon: 'ClipboardList' },
            { id: 'supporters', label: 'Supporters', icon: 'Star' }
        ];
    } else if (organizationType === 'foundation') {
        return [
            ...baseTabs,
            { id: 'grants', label: 'Active Grants', icon: 'ClipboardList' },
            { id: 'grantees', label: 'Our Grantees', icon: 'Users' }
        ];
    }

    return baseTabs;
};

/**
 * Check if a user can manage another user based on their roles
 * @param {string} userRole - The role of the user performing the action
 * @param {string} targetRole - The role of the user being managed
 * @param {boolean} isOmegaAdmin - Whether the user is an omega admin
 * @returns {boolean} - Whether the user can manage the target user
 */
export function canManageUser(userRole, targetRole, isOmegaAdmin = false) {
  // Omega admins can manage anyone
  if (isOmegaAdmin) return true;
  
  // Super admins can manage admins and members
  if (userRole === ROLES.SUPER_ADMIN) {
    return targetRole === ROLES.ADMIN || targetRole === ROLES.MEMBER;
  }
  
  // Admins can manage members only
  if (userRole === ROLES.ADMIN) {
    return targetRole === ROLES.MEMBER;
  }
  
  // Members cannot manage anyone
  return false;
};