// components/NotificationsPanel.jsx - Enhanced with Connection Notifications
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ThumbsUp, MessageSquare, AtSign, Building, Users, UserCheck } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { acceptConnectionRequest, declineConnectionRequest, getConnectionStatus } from '../utils/userConnectionsUtils';

const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "Just now";
};

const NotificationIcon = ({ type, actor }) => {
    // For follower notifications, show the follower's avatar
    if (type === 'new_follower' && actor?.avatar_url) {
        return (
            <img 
                src={actor.avatar_url} 
                alt={actor.full_name}
                className="w-8 h-8 rounded-full object-cover border-2 border-blue-200"
            />
        );
    }
    
    // For connection notifications, show the actor's avatar
    if ((type === 'connection_request' || type === 'connection_accepted') && actor?.avatar_url) {
        return (
            <img 
                src={actor.avatar_url} 
                alt={actor.full_name}
                className="w-8 h-8 rounded-full object-cover border-2 border-green-200"
            />
        );
    }
    
    // For notifications without avatar, show initials
    if ((type === 'new_follower' || type === 'connection_request' || type === 'connection_accepted') && actor?.full_name) {
        const initials = actor.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        const colorClass = type === 'new_follower' ? 'bg-blue-500 border-blue-200' : 'bg-green-500 border-green-200';
        return (
            <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center text-sm font-medium border-2 ${colorClass}`}>
                {initials}
            </div>
        );
    }
    
    // Default icons for other notification types
    switch (type) {
        case 'new_follower':
            return <UserPlus className="w-5 h-5 text-blue-500" />;
        case 'connection_request':
            return <Users className="w-5 h-5 text-green-500" />;
        case 'connection_accepted':
            return <UserCheck className="w-5 h-5 text-green-500" />;
        case 'new_like':
            return <ThumbsUp className="w-5 h-5 text-pink-500" />;
        case 'new_comment':
            return <MessageSquare className="w-5 h-5 text-green-500" />;
        case 'mention':
            return <AtSign className="w-5 h-5 text-purple-500" />;
        case 'organization_mention':
            return <Building className="w-5 h-5 text-orange-500" />;
        default:
            return null;
    }
};

const NotificationItem = ({ notification, onClick, onViewPost, currentUserId, onRefresh }) => {
    const navigate = useNavigate();
    const [actionLoading, setActionLoading] = useState(false);
    const [localConnectionStatus, setLocalConnectionStatus] = useState(null);
    
    const { 
        actor_id: actor, 
        type, 
        created_at, 
        post_id, 
        organization_post_id
    } = notification;

    // Check connection status for connection notifications
    useEffect(() => {
        const checkConnectionStatus = async () => {
            if (type === 'connection_request' && actor?.id && currentUserId) {
                try {
                    const { status } = await getConnectionStatus(currentUserId, actor.id);
                    setLocalConnectionStatus(status);
                } catch (error) {
                    console.error('Error checking connection status:', error);
                }
            }
        };

        checkConnectionStatus();
    }, [type, actor?.id, currentUserId]);

    const notificationText = () => {
        switch (type) {
            case 'new_follower':
                return <><strong>{actor.full_name}</strong> started following you.</>;
            case 'connection_request':
                // Show different text based on current connection status
                if (localConnectionStatus === 'accepted') {
                    return <><strong>{actor.full_name}</strong> is now connected with you.</>;
                }
                return <><strong>{actor.full_name}</strong> wants to connect.</>;
            case 'connection_accepted':
                return <><strong>{actor.full_name}</strong> accepted your connection.</>;
            case 'new_like':
                return <><strong>{actor.full_name}</strong> liked your post.</>;
            case 'new_comment':
                return <><strong>{actor.full_name}</strong> commented on your post.</>;
            case 'mention':
                return <><strong>{actor.full_name}</strong> mentioned you in a post.</>;
            case 'organization_mention':
                return <><strong>{actor.full_name}</strong> mentioned your organization in a post.</>;
            default:
                return 'New notification';
        }
    };

    const handleAcceptConnection = async (e) => {
        e.stopPropagation();
        setActionLoading(true);
        
        try {
            const result = await acceptConnectionRequest(currentUserId, actor.id);
            if (result.success) {
                // Update local status immediately
                setLocalConnectionStatus('accepted');
                // Mark notification as read and refresh
                await markAsRead();
                if (onRefresh) onRefresh();
            } else {
                console.error('Failed to accept connection:', result.error);
            }
        } catch (error) {
            console.error('Error accepting connection:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeclineConnection = async (e) => {
        e.stopPropagation();
        setActionLoading(true);
        
        try {
            const result = await declineConnectionRequest(currentUserId, actor.id);
            if (result.success) {
                // Refresh notifications to remove this one
                if (onRefresh) onRefresh();
            } else {
                console.error('Failed to decline connection:', result.error);
            }
        } catch (error) {
            console.error('Error declining connection:', error);
        } finally {
            setActionLoading(false);
        }
    };

    // Function to get organization details and navigate to org profile
    const getOrganizationDetailsAndNavigate = async (orgPostId) => {
        try {
            console.log('🔍 Fetching organization details for post ID:', orgPostId);
            
            // Query the organization_posts table to get org info
            const { data: orgPost, error } = await supabase
                .from('organization_posts')
                .select('organization_id, organization_type')
                .eq('id', orgPostId)
                .single();

            if (error) {
                console.error('❌ Error fetching organization post:', error);
                return false;
            }

            if (!orgPost) {
                console.error('❌ Organization post not found');
                return false;
            }

            const { organization_id, organization_type } = orgPost;
            
            // Query the appropriate organization table for the slug
            const tableName = organization_type === 'nonprofit' ? 'nonprofits' : 'funders';
            const { data: orgData, error: orgError } = await supabase
                .from(tableName)
                .select('slug, name')
                .eq('id', organization_id)
                .single();

            if (orgError || !orgData?.slug) {
                console.error(`❌ Error fetching ${organization_type} details:`, orgError);
                return false;
            }

            // Navigate to the organization profile page
            const orgPath = organization_type === 'nonprofit' 
                ? `/nonprofits/${orgData.slug}` 
                : `/funders/${orgData.slug}`;
            
            console.log('🎯 Navigating to organization:', orgPath);
            navigate(orgPath);
            return true;
        } catch (error) {
            console.error('💥 Error in getOrganizationDetailsAndNavigate:', error);
            return false;
        }
    };

    const handleViewPost = (e) => {
        e.stopPropagation(); // Prevent the notification click handler from firing
        
        if (organization_post_id) {
            console.log('🏢 Viewing organization post:', organization_post_id);
            getOrganizationDetailsAndNavigate(organization_post_id);
        } else if (post_id) {
            console.log('👤 Viewing user post:', post_id);
            onClick(); // Close notifications panel
            navigate('/profile');
            
            // Small delay to ensure navigation completes, then highlight the post
            setTimeout(() => {
                if (onViewPost) {
                    onViewPost(post_id);
                }
            }, 100);
        }
    };

    const handleNotificationClick = () => {
        console.log('📱 Notification clicked:', { 
            type, 
            post_id, 
            organization_post_id,
            actor: actor?.full_name,
            actorId: actor?.id 
        });
        
        // Mark notification as read when clicked
        markAsRead();
        
        // Handle different notification types
        if (type === 'new_follower' || type === 'connection_request' || type === 'connection_accepted') {
            // For people-related notifications, navigate to the person's profile
            console.log('👥 User notification - navigating to user profile:', actor?.id);
            onClick(); // Close notifications panel
            const profileUrl = `/profile/members/${actor.id}`;
            console.log('🔗 Navigating to:', profileUrl);
            navigate(profileUrl);
        } else if (organization_post_id) {
            console.log('🏢 Organization post notification - navigating to org profile');
            onClick(); // Close notifications panel
            getOrganizationDetailsAndNavigate(organization_post_id);
        } else if (post_id) {
            console.log('👤 Regular post notification - navigating to user profile');
            // For regular post-related notifications, navigate to profile and highlight post
            onClick(); // Close notifications panel
            navigate('/profile');
            
            setTimeout(() => {
                if (onViewPost) {
                    onViewPost(post_id);
                }
            }, 100);
        } else {
            // For other notifications (like mentions without posts), go to actor's profile
            onClick();
            const profileUrl = `/profile/members/${actor.id}`;
            console.log('🔗 Fallback navigation to:', profileUrl);
            navigate(profileUrl);
        }
    };

    const markAsRead = async () => {
        if (notification.is_read) return;
        
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notification.id);
            
            if (error) {
                console.error('Error marking notification as read:', error);
            }
        } catch (error) {
            console.error('Error in markAsRead:', error);
        }
    };

    return (
        <div 
            onClick={handleNotificationClick}
            className="block p-3 hover:bg-slate-50 transition-colors cursor-pointer"
        >
            <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 pt-1">
                    <NotificationIcon type={type} actor={actor} />
                </div>
                <div className="flex-grow">
                    <p className="text-sm text-slate-700">{notificationText()}</p>
                    <p className="text-xs text-slate-500 mt-1">{timeAgo(created_at)}</p>
                    
                    {/* Connection request actions - only show if not already connected */}
                    {type === 'connection_request' && localConnectionStatus !== 'accepted' && (
                        <div className="mt-2 flex gap-2">
                            <button 
                                onClick={handleAcceptConnection}
                                disabled={actionLoading}
                                className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full hover:bg-green-200 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                            >
                                {actionLoading ? 'Accepting...' : 'Accept'}
                            </button>
                            <button 
                                onClick={handleDeclineConnection}
                                disabled={actionLoading}
                                className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:opacity-50"
                            >
                                {actionLoading ? 'Declining...' : 'Decline'}
                            </button>
                        </div>
                    )}
                    
                    {/* Show "Connected" status for accepted connections */}
                    {type === 'connection_request' && localConnectionStatus === 'accepted' && (
                        <div className="mt-2">
                            <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium border border-green-200">
                                ✓ Connected
                            </div>
                        </div>
                    )}
                    
                    {/* Show "View Post" button only for post-related notifications */}
                    {(post_id || organization_post_id) && (
                        <div className="mt-2">
                            <button 
                                onClick={handleViewPost}
                                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full hover:bg-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                View Post
                            </button>
                        </div>
                    )}
                    
                    {/* Show "View Profile" button for people-related notifications */}
                    {(type === 'new_follower' || type === 'connection_request' || type === 'connection_accepted') && (
                        <div className="mt-2">
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClick(); // Close notifications panel
                                    navigate(`/profile/members/${actor.id}`);
                                }}
                                className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full hover:bg-purple-200 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                View Profile
                            </button>
                        </div>
                    )}
                </div>
                {!notification.is_read && (
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-1 flex-shrink-0" title="Unread"></div>
                )}
            </div>
        </div>
    );
};

export default function NotificationsPanel({ notifications, onClose, onViewPost, onClearAll, currentUserId, onRefresh }) {
    console.log('🔔 NotificationsPanel props:', { 
        notificationsCount: notifications?.length, 
        hasOnViewPost: !!onViewPost,
        hasOnClearAll: !!onClearAll
    });

    if (!notifications || notifications.length === 0) {
        return (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
                <div className="p-4 text-center text-slate-500">
                    <UserPlus className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p>No notifications yet</p>
                </div>
            </div>
        );
    }

    // Count connection requests
    const connectionRequestsCount = notifications.filter(n => n.type === 'connection_request' && !n.is_read).length;

    return (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 z-50 max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-slate-900">Notifications</h3>
                    {connectionRequestsCount > 0 && (
                        <p className="text-xs text-green-600 font-medium">
                            {connectionRequestsCount} connection request{connectionRequestsCount === 1 ? '' : 's'}
                        </p>
                    )}
                </div>
                {onClearAll && (
                    <button
                        onClick={onClearAll}
                        className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
                    >
                        Clear All
                    </button>
                )}
            </div>
            <div className="divide-y divide-slate-100">
                {notifications.map(notification => (
                    <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onClick={onClose}
                        onViewPost={onViewPost}
                        currentUserId={currentUserId}
                        onRefresh={onRefresh}
                    />
                ))}
            </div>
        </div>
    );
}