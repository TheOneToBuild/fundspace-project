// src/components/NotificationsPanel.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, ThumbsUp, MessageSquare } from 'lucide-react';

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
        default:
            return null;
    }
};

const NotificationItem = ({ notification, onClick }) => {
    const { actor_id: actor, type, created_at, post_id } = notification;

    const notificationText = () => {
        switch (type) {
            case 'new_follower':
                return <><strong>{actor.full_name}</strong> started following you.</>;
            case 'new_like':
                return <><strong>{actor.full_name}</strong> liked your post.</>;
            case 'new_comment':
                return <><strong>{actor.full_name}</strong> commented on your post.</>;
            default:
                return 'New notification';
        }
    };
    
    // A post-related notification should link to the post, a follower notification to the follower's profile.
    const linkDestination = post_id ? `/profile` : `/profile/members/${actor.id}`;

    return (
        <Link to={linkDestination} onClick={onClick} className="block p-3 hover:bg-slate-50 transition-colors">
            <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 pt-1">
                    <NotificationIcon type={type} />
                </div>
                <div className="flex-grow">
                    <p className="text-sm text-slate-700">{notificationText()}</p>
                    <p className="text-xs text-slate-500 mt-1">{timeAgo(created_at)}</p>
                </div>
                {!notification.is_read && (
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-1 flex-shrink-0" title="Unread"></div>
                )}
            </div>
        </Link>
    );
};


export default function NotificationsPanel({ notifications, onClose }) {
    return (
        <div className="absolute right-0 mt-3 w-80 max-w-sm bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden">
            <div className="p-3 border-b border-slate-200">
                <h4 className="font-semibold text-slate-800">Notifications</h4>
            </div>
            <div className="max-h-96 overflow-y-auto custom-scrollbar">
                {notifications.length > 0 ? (
                    notifications.map(notif => (
                        <NotificationItem key={notif.id} notification={notif} onClick={onClose} />
                    ))
                ) : (
                    <p className="p-6 text-center text-sm text-slate-500">You have no new notifications.</p>
                )}
            </div>
        </div>
    );
}
