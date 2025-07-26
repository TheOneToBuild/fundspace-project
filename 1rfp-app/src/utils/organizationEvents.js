// src/utils/organizationEvents.js - Complete Organization Events Utility
console.log('🎯 Organization Events Utility loaded');

// Custom event dispatchers for instant organization updates
export const dispatchOrganizationChange = (profileId, organization) => {
    console.log('🚀 Dispatching INSTANT organization change event for profile:', profileId);
    console.log('📋 Organization data:', organization);
    
    try {
        const event = new CustomEvent('organizationChanged', {
            detail: {
                profileId,
                organization,
                timestamp: Date.now()
            }
        });
        
        window.dispatchEvent(event);
        console.log('✅ Organization change event dispatched successfully');
        return true;
    } catch (error) {
        console.error('❌ Failed to dispatch organization change event:', error);
        return false;
    }
};

export const notifyOrganizationJoined = (profileId, organization) => {
    console.log('🎉 Notifying organization joined for profile:', profileId);
    console.log('🏢 New organization:', organization);
    
    try {
        // Dispatch the organization change event
        dispatchOrganizationChange(profileId, organization);
        
        // Also dispatch a specific "joined" event
        const joinEvent = new CustomEvent('organizationJoined', {
            detail: {
                profileId,
                organization,
                timestamp: Date.now()
            }
        });
        
        window.dispatchEvent(joinEvent);
        console.log('✅ Organization joined event dispatched successfully');
        return true;
    } catch (error) {
        console.error('❌ Failed to dispatch organization joined event:', error);
        return false;
    }
};

export const notifyOrganizationLeft = (profileId, organizationId) => {
    console.log('👋 Notifying organization left for profile:', profileId);
    console.log('🏢 Left organization ID:', organizationId);
    
    try {
        // Dispatch with null organization to indicate leaving
        dispatchOrganizationChange(profileId, null);
        
        // Also dispatch a specific "left" event
        const leftEvent = new CustomEvent('organizationLeft', {
            detail: {
                profileId,
                organizationId,
                timestamp: Date.now()
            }
        });
        
        window.dispatchEvent(leftEvent);
        console.log('✅ Organization left event dispatched successfully');
        return true;
    } catch (error) {
        console.error('❌ Failed to dispatch organization left event:', error);
        return false;
    }
};

export const notifyOrganizationUpdated = (profileId, organization) => {
    console.log('📝 Notifying organization updated for profile:', profileId);
    console.log('🏢 Updated organization:', organization);
    
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
        console.log('✅ Organization updated event dispatched successfully');
        return true;
    } catch (error) {
        console.error('❌ Failed to dispatch organization updated event:', error);
        return false;
    }
};

// Utility function to add event listeners
export const addOrganizationEventListener = (eventType, callback) => {
    console.log(`👂 Adding organization event listener for: ${eventType}`);
    window.addEventListener(eventType, callback);
    
    // Return cleanup function
    return () => {
        console.log(`🧹 Cleaning up organization event listener for: ${eventType}`);
        window.removeEventListener(eventType, callback);
    };
};

// Cross-tab communication for organization changes
export const broadcastOrganizationChange = (profileId, organization) => {
    console.log('📡 Broadcasting organization change across tabs');
    
    try {
        const message = {
            type: 'ORGANIZATION_CHANGED',
            profileId,
            organization,
            timestamp: Date.now()
        };
        
        // Use localStorage to communicate across tabs
        localStorage.setItem('orgChangeEvent', JSON.stringify(message));
        
        // Remove it immediately to trigger the storage event
        setTimeout(() => {
            localStorage.removeItem('orgChangeEvent');
        }, 100);
        
        console.log('✅ Organization change broadcasted across tabs');
        return true;
    } catch (error) {
        console.error('❌ Failed to broadcast organization change:', error);
        return false;
    }
};

// Listen for cross-tab organization changes
export const listenForCrossTabOrgChanges = (callback) => {
    console.log('👂 Setting up cross-tab organization change listener');
    
    const handleStorageChange = (e) => {
        if (e.key === 'orgChangeEvent' && e.newValue) {
            try {
                const message = JSON.parse(e.newValue);
                console.log('📡 Received cross-tab organization change:', message);
                callback(message);
            } catch (error) {
                console.error('❌ Failed to parse cross-tab message:', error);
            }
        }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Return cleanup function
    return () => {
        console.log('🧹 Cleaning up cross-tab organization change listener');
        window.removeEventListener('storage', handleStorageChange);
    };
};