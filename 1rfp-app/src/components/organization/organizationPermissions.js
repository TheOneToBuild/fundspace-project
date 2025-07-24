// utils/organizationPermissions.js
export const PERMISSIONS = {
    EDIT_ORGANIZATION: 'edit_organization',
    MANAGE_MEMBERS: 'manage_members',
    MANAGE_ADMINS: 'manage_admins',
    DELETE_ORGANIZATION: 'delete_organization'
};

export const ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    MEMBER: 'member'
};

export const hasPermission = (userRole, permission, isOmegaAdmin = false) => {
    if (isOmegaAdmin) return true;
    
    const rolePermissions = {
        [ROLES.SUPER_ADMIN]: [
            PERMISSIONS.EDIT_ORGANIZATION, 
            PERMISSIONS.MANAGE_MEMBERS, 
            PERMISSIONS.MANAGE_ADMINS,
            PERMISSIONS.DELETE_ORGANIZATION
        ],
        [ROLES.ADMIN]: [PERMISSIONS.MANAGE_MEMBERS],
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
    if (isOmegaAdmin) return 'bg-purple-100 text-purple-800 border-purple-200';
    const colors = {
        [ROLES.SUPER_ADMIN]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        [ROLES.ADMIN]: 'bg-blue-100 text-blue-800 border-blue-200',
        [ROLES.MEMBER]: 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[role] || 'bg-gray-100 text-gray-800 border-gray-200';
};

export const canManageUser = (currentUserRole, targetRole, isOmegaAdmin = false) => {
    if (isOmegaAdmin) return true;
    if (currentUserRole === ROLES.SUPER_ADMIN) return true;
    if (currentUserRole === ROLES.ADMIN && targetRole === ROLES.MEMBER) return true;
    return false;
};

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
    return labelMap[type] || type;
};

export const getTabsForOrganizationType = (organizationType, canViewAnalytics = false) => {
    const baseTabs = [
        { id: 'overview', label: 'Overview', icon: 'Building2' },
        { id: 'team', label: 'Team', icon: 'Users' }
    ];

    if (canViewAnalytics) {
        baseTabs.splice(1, 0, { id: 'analytics', label: 'Analytics', icon: 'BarChart3' });
    }

    if (organizationType === 'nonprofit') {
        return [
            ...baseTabs,
            { id: 'programs', label: 'Programs', icon: 'ClipboardList' },
            { id: 'impact', label: 'Impact Stories', icon: 'TrendingUp' },
            { id: 'supporters', label: 'Supporters', icon: 'Star' }
        ];
    } else if (organizationType === 'foundation') {
        return [
            ...baseTabs,
            { id: 'grants', label: 'Active Grants', icon: 'ClipboardList' },
            { id: 'grantees', label: 'Our Grantees', icon: 'Users' },
            { id: 'impact', label: 'Impact Stories', icon: 'TrendingUp' }
        ];
    }

    return baseTabs;
};