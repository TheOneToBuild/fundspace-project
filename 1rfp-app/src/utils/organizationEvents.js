// src/utils/organizationEvents.js - Cleaned
export const dispatchOrganizationChange = (profileId, organization) => {
    try {
        const event = new CustomEvent('organizationChanged', {
            detail: {
                profileId,
                organization,
                timestamp: Date.now()
            }
        });
        window.dispatchEvent(event);
        return true;
    } catch (error) {
        console.error('❌ Failed to dispatch organization change event:', error);
        return false;
    }
};

export const notifyOrganizationJoined = (profileId, organization) => {
    try {
        dispatchOrganizationChange(profileId, organization);
        const joinEvent = new CustomEvent('organizationJoined', {
            detail: {
                profileId,
                organization,
                timestamp: Date.now()
            }
        });
        window.dispatchEvent(joinEvent);
        return true;
    } catch (error) {
        console.error('❌ Failed to dispatch organization joined event:', error);
        return false;
    }
};

export const notifyOrganizationLeft = (profileId, organizationId) => {
    try {
        dispatchOrganizationChange(profileId, null);
        const leftEvent = new CustomEvent('organizationLeft', {
            detail: {
                profileId,
                organizationId,
                timestamp: Date.now()
            }
        });
        window.dispatchEvent(leftEvent);
        return true;
    } catch (error) {
        console.error('❌ Failed to dispatch organization left event:', error);
        return false;
    }
};

export const notifyOrganizationUpdated = (profileId, organization) => {
    try {
        dispatchOrganizationChange(profileId, organization);
        const updateEvent = new CustomEvent('organizationUpdated', {
            detail: {
                profileId,
                organization,
                timestamp: Date.now()
            }
        });
        window.dispatchEvent(updateEvent);
        return true;
    } catch (error) {
        console.error('❌ Failed to dispatch organization updated event:', error);
        return false;
    }
};

export const addOrganizationEventListener = (eventType, callback) => {
    window.addEventListener(eventType, callback);
    return () => {
        window.removeEventListener(eventType, callback);
    };
};

export const broadcastOrganizationChange = (profileId, organization) => {
    try {
        const message = {
            type: 'ORGANIZATION_CHANGED',
            profileId,
            organization,
            timestamp: Date.now()
        };
        localStorage.setItem('orgChangeEvent', JSON.stringify(message));
        setTimeout(() => {
            localStorage.removeItem('orgChangeEvent');
        }, 100);
        return true;
    } catch (error) {
        console.error('❌ Failed to broadcast organization change:', error);
        return false;
    }
};

export const listenForCrossTabOrgChanges = (callback) => {
    const handleStorageChange = (e) => {
        if (e.key === 'orgChangeEvent' && e.newValue) {
            try {
                const message = JSON.parse(e.newValue);
                callback(message);
            } catch (error) {
                console.error('❌ Failed to parse cross-tab message:', error);
            }
        }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };
};