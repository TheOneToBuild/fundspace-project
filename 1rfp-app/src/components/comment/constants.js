// src/components/comment/constants.js
import { ThumbsUp, Heart, Lightbulb, PartyPopper } from 'lucide-react';

export const reactions = [
    { type: 'like', Icon: ThumbsUp, color: 'bg-blue-500', label: 'Like' },
    { type: 'love', Icon: Heart, color: 'bg-red-500', label: 'Love' },
    { type: 'celebrate', Icon: PartyPopper, color: 'bg-green-500', label: 'Celebrate' },
    { type: 'insightful', Icon: Lightbulb, color: 'bg-yellow-500', label: 'Insightful' },
];

// Helper function for time formatting
export const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y";
    interval = seconds / 2592000;
    if (interval > 1) return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m";
    return Math.floor(seconds) + "s";
};