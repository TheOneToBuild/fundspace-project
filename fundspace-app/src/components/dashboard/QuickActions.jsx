// src/components/dashboard/QuickActions.jsx
import React from 'react';
import { Bookmark, Plus, Users, Bell } from 'lucide-react';
import PropTypes from 'prop-types';

const QuickActions = ({ onAction }) => {
    const actions = [
        { id: 'save-grant', icon: Bookmark, label: 'Save Grant', color: 'bg-blue-500', action: () => onAction('grants') },
        { id: 'create-post', icon: Plus, label: 'Create Post', color: 'bg-green-500', action: () => onAction('hello-world') },
        { id: 'connect', icon: Users, label: 'Find People', color: 'bg-purple-500', action: () => onAction('members') },
        { id: 'notifications', icon: Bell, label: 'Notifications', color: 'bg-orange-500', action: () => onAction('notifications') }
    ];

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
                {actions.map(action => (
                    <button
                        key={action.id}
                        onClick={action.action}
                        className="flex items-center p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200"
                    >
                        <div className={`p-2 rounded-md ${action.color} mr-3`}>
                            <action.icon size={16} className="text-white" />
                        </div>
                        <span className="text-sm font-medium text-slate-700">{action.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

QuickActions.propTypes = {
    onAction: PropTypes.func.isRequired
};

export default QuickActions;