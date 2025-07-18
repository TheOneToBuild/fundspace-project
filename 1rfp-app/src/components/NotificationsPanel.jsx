// src/components/NotificationsPanel.jsx - FIXED WITH ORGANIZATION POST NAVIGATION
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, ThumbsUp, MessageSquare, AtSign, Building } from 'lucide-react';
import { supabase } from '../supabaseClient';

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

const NotificationIcon = ({ type }) => {
    switch (type) {
        case 'new_follower':
            return <UserPlus className="w-5 h-5 text-blue-500" />;
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

const NotificationItem = ({ notification, onClick, onViewPost }) => {
    const navigate = useNavigate();
    const { 
        actor_id: actor, 
        type, 
        created_at, 
        post_id, 
        organization_post_id  // ✅ Now we check for this!
    } = notification;

    const notificationText = () => {
        switch (type) {
            case 'new_follower':
                return <><strong>{actor.full_name}</strong> started following you.</>;
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

    // ✅ NEW: Function to get organization details and navigate to org profile
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
            
            console.log(`🎯 Navigating to organization: ${orgPath}`);
            navigate(orgPath);
            
            // Highlight the post after navigation
            setTimeout(() => {
                if (onViewPost) {
                    onViewPost(orgPostId, true); // true indicates it's an organization post
                }
            }, 100);
            
            return true;
            
        } catch (error) {
            console.error('💥 Error in organization navigation:', error);
            return false;
        }
    };

    const handleViewPost = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('🎯 View Post clicked:', { 
            post_id, 
            organization_post_id,
            type 
        });
        
        // ✅ FIXED: Check if it's an organization post first
        if (organization_post_id) {
            console.log('🏢 Handling organization post notification');
            onClick(); // Close notifications panel
            getOrganizationDetailsAndNavigate(organization_post_id);
        } else if (post_id && onViewPost) {
            console.log('👤 Handling regular post notification');
            // Close the notifications panel first
            onClick();
            
            // Navigate to profile page (where posts are displayed)
            navigate('/profile');
            
            // Small delay to ensure navigation completes, then highlight the post
            setTimeout(() => {
                onViewPost(post_id);
            }, 100);
        }
    };

    const handleNotificationClick = () => {
        console.log('📱 Notification clicked:', { 
            type, 
            post_id, 
            organization_post_id,
            actor: actor?.full_name 
        });
        
        // ✅ FIXED: Handle organization posts vs regular posts
        if (organization_post_id) {
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
            // For non-post notifications (like follows), go to actor's profile
            onClick();
            navigate(`/profile/members/${actor.id}`);
        }
    };

    return (
        <div 
            onClick={handleNotificationClick}
            className="block p-3 hover:bg-slate-50 transition-colors cursor-pointer"
        >
            <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 pt-1">
                    <NotificationIcon type={type} />
                </div>
                <div className="flex-grow">
                    <p className="text-sm text-slate-700">{notificationText()}</p>
                    <p className="text-xs text-slate-500 mt-1">{timeAgo(created_at)}</p>
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
                </div>
                {!notification.is_read && (
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-1 flex-shrink-0" title="Unread"></div>
                )}
            </div>
        </div>
    );
};

export default function NotificationsPanel({ notifications, onClose, onViewPost, onClearAll }) {
    console.log('🔔 NotificationsPanel props:', { 
        notificationsCount: notifications?.length, 
        hasOnViewPost: !!onViewPost,
        hasOnClearAll: !!onClearAll 
    });

    return (
        <div className="absolute right-0 mt-3 w-80 max-w-sm bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden">
            <div className="p-3 border-b border-slate-200 flex items-center justify-between">
                <h4 className="font-semibold text-slate-800">Notifications</h4>
                {notifications.length > 0 && onClearAll && (
                    <button
                        onClick={onClearAll}
                        className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                    >
                        Clear All
                    </button>
                )}
            </div>
            <div className="max-h-96 overflow-y-auto custom-scrollbar">
                {notifications.length > 0 ? (
                    notifications.map(notif => (
                        <NotificationItem 
                            key={notif.id} 
                            notification={notif} 
                            onClick={onClose}
                            onViewPost={onViewPost}
                        />
                    ))
                ) : (
                    <p className="p-6 text-center text-sm text-slate-500">You have no new notifications.</p>
                )}
            </div>
        </div>
    );
}