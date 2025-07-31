// src/components/NotificationsPage.jsx - Updated with connection notifications support
import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { UserPlus, ThumbsUp, MessageSquare, AtSign, Building, Bell, BellOff, Check, X, Filter, Calendar, Clock, Users, UserCheck } from 'lucide-react';
// Add the missing import at the top
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
                className="w-10 h-10 rounded-full object-cover border-2 border-blue-200"
            />
        );
    }
    
    // For connection notifications, show the actor's avatar
    if ((type === 'connection_request' || type === 'connection_accepted') && actor?.avatar_url) {
        return (
            <img 
                src={actor.avatar_url} 
                alt={actor.full_name}
                className="w-10 h-10 rounded-full object-cover border-2 border-green-200"
            />
        );
    }
    
    // For notifications without avatar, show initials
    if ((type === 'new_follower' || type === 'connection_request' || type === 'connection_accepted') && actor?.full_name) {
        const initials = actor.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        const colorClass = type === 'new_follower' ? 'bg-blue-500 border-blue-200' : 'bg-green-500 border-green-200';
        return (
            <div className={`w-10 h-10 rounded-full text-white flex items-center justify-center text-sm font-medium border-2 ${colorClass}`}>
                {initials}
            </div>
        );
    }
    
    // Default icons for other notification types
    const iconClass = "w-10 h-10 rounded-full flex items-center justify-center";
    switch (type) {
        case 'new_follower':
            return <div className={`${iconClass} bg-blue-100`}><UserPlus className="w-5 h-5 text-blue-500" /></div>;
        case 'connection_request':
            return <div className={`${iconClass} bg-green-100`}><Users className="w-5 h-5 text-green-500" /></div>;
        case 'connection_accepted':
            return <div className={`${iconClass} bg-green-100`}><UserCheck className="w-5 h-5 text-green-500" /></div>;
        case 'new_like':
            return <div className={`${iconClass} bg-pink-100`}><ThumbsUp className="w-5 h-5 text-pink-500" /></div>;
        case 'new_comment':
            return <div className={`${iconClass} bg-green-100`}><MessageSquare className="w-5 h-5 text-green-500" /></div>;
        case 'mention':
            return <div className={`${iconClass} bg-purple-100`}><AtSign className="w-5 h-5 text-purple-500" /></div>;
        case 'organization_mention':
            return <div className={`${iconClass} bg-orange-100`}><Building className="w-5 h-5 text-orange-500" /></div>;
        default:
            return <div className={`${iconClass} bg-gray-100`}><Bell className="w-5 h-5 text-gray-500" /></div>;
    }
};

const NotificationItem = ({ notification, onViewPost, onMarkAsRead, onDelete, currentUserId, onRefresh }) => {
    const navigate = useNavigate();
    const [actionLoading, setActionLoading] = useState(false);
    const [localConnectionStatus, setLocalConnectionStatus] = useState(null); // Track local status changes
    
    const { 
        actor_id: actor, 
        type, 
        created_at, 
        post_id, 
        organization_post_id,
        is_read,
        connection_id
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
                return <><strong className="font-semibold text-slate-900">{actor.full_name}</strong> started following you.</>;
            case 'connection_request':
                // Show different text based on current connection status
                if (localConnectionStatus === 'accepted') {
                    return <><strong className="font-semibold text-slate-900">{actor.full_name}</strong> is now connected with you.</>;
                }
                return <><strong className="font-semibold text-slate-900">{actor.full_name}</strong> wants to connect with you.</>;
            case 'connection_accepted':
                return <><strong className="font-semibold text-slate-900">{actor.full_name}</strong> accepted your connection request.</>;
            case 'new_like':
                return <><strong className="font-semibold text-slate-900">{actor.full_name}</strong> liked your post.</>;
            case 'new_comment':
                return <><strong className="font-semibold text-slate-900">{actor.full_name}</strong> commented on your post.</>;
            case 'mention':
                return <><strong className="font-semibold text-slate-900">{actor.full_name}</strong> mentioned you in a post.</>;
            case 'organization_mention':
                return <><strong className="font-semibold text-slate-900">{actor.full_name}</strong> mentioned your organization in a post.</>;
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
                await onMarkAsRead(notification.id);
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
                // Remove this notification
                await onDelete(notification.id);
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
            const orgPath = `/organizations/${orgData.slug}`;
            
            console.log('🎯 Navigating to organization:', orgPath);
            navigate(orgPath);
            return true;
        } catch (error) {
            console.error('💥 Error in getOrganizationDetailsAndNavigate:', error);
            return false;
        }
    };

    const handleViewPost = (e) => {
        e.stopPropagation();
        
        if (organization_post_id) {
            console.log('🏢 Viewing organization post:', organization_post_id);
            getOrganizationDetailsAndNavigate(organization_post_id);
        } else if (post_id) {
            console.log('👤 Viewing user post:', post_id);
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
        if (!is_read) {
            onMarkAsRead(notification.id);
        }
        
        // Handle different notification types
        if (type === 'new_follower' || type === 'connection_request' || type === 'connection_accepted') {
            // For people-related notifications, navigate to the person's profile
            console.log('👥 User notification - navigating to user profile:', actor?.id);
            const profileUrl = `/profile/members/${actor.id}`;
            console.log('🔗 Navigating to:', profileUrl);
            navigate(profileUrl);
        } else if (organization_post_id) {
            console.log('🏢 Organization post notification - navigating to org profile');
            getOrganizationDetailsAndNavigate(organization_post_id);
        } else if (post_id) {
            console.log('👤 Regular post notification - navigating to user profile');
            // For regular post-related notifications, navigate to profile and highlight post
            navigate('/profile');
            
            setTimeout(() => {
                if (onViewPost) {
                    onViewPost(post_id);
                }
            }, 100);
        } else {
            // For other notifications (like mentions without posts), go to actor's profile
            const profileUrl = `/profile/members/${actor.id}`;
            console.log('🔗 Fallback navigation to:', profileUrl);
            navigate(profileUrl);
        }
    };

    return (
        <div 
            className={`flex items-start space-x-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all duration-200 cursor-pointer ${
                !is_read ? 'bg-blue-50/50 border-blue-200' : 'bg-white'
            }`}
            onClick={handleNotificationClick}
        >
            <div className="flex-shrink-0">
                <NotificationIcon type={type} actor={actor} />
            </div>
            
            <div className="flex-grow min-w-0">
                <div className="flex items-start justify-between">
                    <div className="flex-grow min-w-0 pr-2">
                        <p className={`text-sm ${!is_read ? 'text-slate-900' : 'text-slate-700'}`}>
                            {notificationText()}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                            <div className="flex items-center text-xs text-slate-500">
                                <Clock className="w-3 h-3 mr-1" />
                                {timeAgo(created_at)}
                            </div>
                            {!is_read && (
                                <div className="flex items-center">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full" title="Unread"></div>
                                    <span className="text-xs text-blue-600 ml-1 font-medium">New</span>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                        {!is_read && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onMarkAsRead(notification.id);
                                }}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                                title="Mark as read"
                            >
                                <Check className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(notification.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
                            title="Delete notification"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex flex-wrap gap-2 mt-3">
                    {/* Connection request actions - only show if not already connected */}
                    {type === 'connection_request' && localConnectionStatus !== 'accepted' && (
                        <>
                            <button 
                                onClick={handleAcceptConnection}
                                disabled={actionLoading}
                                className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full hover:bg-green-200 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                            >
                                {actionLoading ? 'Accepting...' : 'Accept'}
                            </button>
                            <button 
                                onClick={handleDeclineConnection}
                                disabled={actionLoading}
                                className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:opacity-50"
                            >
                                {actionLoading ? 'Declining...' : 'Decline'}
                            </button>
                        </>
                    )}
                    
                    {/* Show "Connected" status for accepted connections */}
                    {type === 'connection_request' && localConnectionStatus === 'accepted' && (
                        <div className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-medium border border-green-200">
                            ✓ Connected
                        </div>
                    )}
                    
                    {/* Show "View Post" button only for post-related notifications */}
                    {(post_id || organization_post_id) && (
                        <button 
                            onClick={handleViewPost}
                            className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            View Post
                        </button>
                    )}
                    
                    {/* Show "View Profile" button for people-related notifications */}
                    {(type === 'new_follower' || type === 'connection_request' || type === 'connection_accepted') && (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/profile/members/${actor.id}`);
                            }}
                            className="text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full hover:bg-purple-200 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            View Profile
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default function NotificationsPage() {
    const { session, profile, handleViewPost } = useOutletContext();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, unread, read, connections
    const [sortBy, setSortBy] = useState('newest'); // newest, oldest

    useEffect(() => {
        if (session?.user?.id) {
            fetchNotifications();
        }
    }, [session?.user?.id, filter, sortBy]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            
            let query = supabase
                .from('notifications')
                .select(`
                    id, type, post_id, organization_post_id, is_read, created_at, connection_id,
                    actor_id:profiles!notifications_actor_id_fkey (id, full_name, avatar_url, title, organization_name)
                `)
                .eq('user_id', session.user.id);

            // Apply filter
            if (filter === 'unread') {
                query = query.eq('is_read', false);
            } else if (filter === 'read') {
                query = query.eq('is_read', true);
            } else if (filter === 'connections') {
                query = query.in('type', ['connection_request', 'connection_accepted', 'connection_declined']);
            }

            // Apply sorting
            const ascending = sortBy === 'oldest';
            query = query.order('created_at', { ascending });

            // Limit to last 100 notifications
            query = query.limit(100);

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching notifications:', error);
                return;
            }

            setNotifications(data || []);
        } catch (error) {
            console.error('Error in fetchNotifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notificationId);

            if (error) {
                console.error('Error marking notification as read:', error);
                return;
            }

            // Update local state
            setNotifications(current =>
                current.map(notification =>
                    notification.id === notificationId
                        ? { ...notification, is_read: true }
                        : notification
                )
            );
        } catch (error) {
            console.error('Error in handleMarkAsRead:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
            if (unreadIds.length === 0) return;

            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .in('id', unreadIds);

            if (error) {
                console.error('Error marking all notifications as read:', error);
                return;
            }

            // Update local state
            setNotifications(current =>
                current.map(notification => ({ ...notification, is_read: true }))
            );
        } catch (error) {
            console.error('Error in handleMarkAllAsRead:', error);
        }
    };

    const handleDelete = async (notificationId) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', notificationId);

            if (error) {
                console.error('Error deleting notification:', error);
                return;
            }

            // Update local state
            setNotifications(current =>
                current.filter(notification => notification.id !== notificationId)
            );
        } catch (error) {
            console.error('Error in handleDelete:', error);
        }
    };

    const handleClearAll = async () => {
        if (!window.confirm('Are you sure you want to delete all notifications? This action cannot be undone.')) {
            return;
        }

        try {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('user_id', session.user.id);

            if (error) {
                console.error('Error clearing all notifications:', error);
                return;
            }

            setNotifications([]);
        } catch (error) {
            console.error('Error in handleClearAll:', error);
        }
    };

    const filteredNotifications = notifications;
    const unreadCount = notifications.filter(n => !n.is_read).length;
    const connectionRequestsCount = notifications.filter(n => n.type === 'connection_request' && !n.is_read).length;

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-slate-200 rounded w-1/3"></div>
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex space-x-4">
                                    <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                                        <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Bell className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
                            <p className="text-sm text-slate-600">
                                {unreadCount > 0 ? (
                                    <>
                                        {unreadCount} unread notification{unreadCount === 1 ? '' : 's'}
                                        {connectionRequestsCount > 0 && (
                                            <span className="ml-2 text-green-600 font-medium">
                                                • {connectionRequestsCount} connection request{connectionRequestsCount === 1 ? '' : 's'}
                                            </span>
                                        )}
                                    </>
                                ) : (
                                    'All caught up!'
                                )}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                                <Check className="w-4 h-4" />
                                <span>Mark All Read</span>
                            </button>
                        )}
                        <button
                            onClick={handleClearAll}
                            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4" />
                            <span>Clear All</span>
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center space-x-2">
                        <Filter className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-medium text-slate-700">Filter:</span>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="text-sm border border-slate-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All</option>
                            <option value="unread">Unread</option>
                            <option value="read">Read</option>
                            <option value="connections">Connections</option>
                        </select>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-medium text-slate-700">Sort:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="text-sm border border-slate-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Notifications List */}
            <div className="space-y-4">
                {filteredNotifications.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BellOff className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">No notifications</h3>
                        <p className="text-slate-600">
                            {filter === 'unread' 
                                ? "You don't have any unread notifications."
                                : filter === 'read'
                                ? "You don't have any read notifications."
                                : filter === 'connections'
                                ? "You don't have any connection notifications."
                                : "You don't have any notifications yet. When people interact with your posts, follow you, or send connection requests, you'll see them here."
                            }
                        </p>
                    </div>
                ) : (
                    filteredNotifications.map(notification => (
                        <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onViewPost={handleViewPost}
                            onMarkAsRead={handleMarkAsRead}
                            onDelete={handleDelete}
                            currentUserId={session?.user?.id}
                            onRefresh={fetchNotifications}
                        />
                    ))
                )}
            </div>
        </div>
    );
}