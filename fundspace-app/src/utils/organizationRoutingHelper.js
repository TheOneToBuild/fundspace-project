// src/utils/organizationRoutingHelper.js

/**
 * Determines which organization setup path a user should take
 * @param {Object} profile - User profile object
 * @returns {string} - 'onboarding' or 'direct-setup'
 */
export const getOrganizationSetupPath = (profile) => {
    // New users who haven't completed onboarding should go through full wizard
    if (!profile?.onboarding_completed) {
        return 'onboarding';
    }
    
    // Check if user has completed key onboarding steps
    const hasAvatar = !!profile?.avatar_url;
    const hasInterests = profile?.interests && profile.interests.length > 0;
    const hasLocation = profile?.location && (
        Array.isArray(profile.location) ? profile.location.length > 0 : !!profile.location
    );
    
    // If user is missing core profile elements, send to onboarding
    if (!hasAvatar || !hasInterests) {
        return 'onboarding';
    }
    
    // Existing users with complete profiles can use direct setup
    return 'direct-setup';
};

/**
 * Routes user to appropriate organization setup
 * @param {Object} navigate - React Router navigate function
 * @param {Object} profile - User profile object
 */
export const routeToOrganizationSetup = (navigate, profile) => {
    const path = getOrganizationSetupPath(profile);
    
    if (path === 'onboarding') {
        navigate('/onboarding');
    } else {
        navigate('/profile/my-organization');
    }
};

/**
 * Check if user should see organization setup vs onboarding
 * Used in component logic to determine which interface to show
 */
export const shouldShowDirectSetup = (profile) => {
    return getOrganizationSetupPath(profile) === 'direct-setup';
};