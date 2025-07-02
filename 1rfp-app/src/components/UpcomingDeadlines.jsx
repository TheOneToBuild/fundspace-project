// src/components/UpcomingDeadlines.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar } from './Icons.jsx';

// Helper function to calculate the difference in days
const daysUntil = (dateString) => {
    if (!dateString) return null;
    const today = new Date();
    const deadline = new Date(dateString);
    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);
    const diffTime = deadline.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Helper to format the deadline text
const formatDeadline = (days) => {
    if (days === null) return 'No deadline';
    if (days < 0) return 'Past due';
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `Due in ${days} days`;
};

export default function UpcomingDeadlines({ savedGrants = [] }) {
    const [upcoming, setUpcoming] = useState([]);

    useEffect(() => {
        if (savedGrants && savedGrants.length > 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const sorted = savedGrants
                .filter(grant => grant.dueDate && new Date(grant.dueDate) >= today)
                .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                .slice(0, 5);
            
            setUpcoming(sorted);
        }
    }, [savedGrants]);

    // The outer card div has been removed. This component now only returns its content.
    if (upcoming.length === 0) {
        return <p className="text-sm text-slate-500 py-4 text-center">No upcoming deadlines for your saved grants.</p>;
    }

    return (
        <div className="space-y-3">
            {upcoming.map(grant => {
                const daysLeft = daysUntil(grant.dueDate);
                const deadlineText = formatDeadline(daysLeft);
                const isUrgent = daysLeft !== null && daysLeft <= 7;

                return (
                    <Link to="#" key={grant.id} className="block p-2 rounded-lg hover:bg-slate-50">
                        <p className="text-sm font-semibold text-slate-700 truncate">{grant.title}</p>
                        <div className={`flex items-center text-xs mt-1 ${isUrgent ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                            <Calendar size={12} className="mr-1.5" />
                            <span>{deadlineText}</span>
                            <span className="mx-1">·</span>
                            <span>{new Date(grant.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
