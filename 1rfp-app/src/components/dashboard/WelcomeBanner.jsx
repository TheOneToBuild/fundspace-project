// src/components/dashboard/WelcomeBanner.jsx
import React from 'react';
import PropTypes from 'prop-types';

const WelcomeBanner = ({ profile, organizationInfo }) => {
    return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-1">
                        Welcome back, {profile?.full_name?.split(' ')[0] || 'there'}! 👋
                    </h1>
                    <p className="text-slate-600">
                        {organizationInfo
                            ? `${organizationInfo.name} • ${profile?.title || 'Team Member'}`
                            : 'Ready to discover new opportunities?'}
                    </p>
                </div>
                <div className="text-4xl">
                    {organizationInfo ? '🏢' : '🚀'}
                </div>
            </div>
        </div>
    );
};

WelcomeBanner.propTypes = {
    profile: PropTypes.object,
    organizationInfo: PropTypes.object
};

export default WelcomeBanner;