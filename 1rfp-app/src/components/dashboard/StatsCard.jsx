// src/components/dashboard/StatsCard.jsx
import React from 'react';
import { ArrowRight } from 'lucide-react';
import PropTypes from 'prop-types';

const StatsCard = ({ icon: Icon, title, value, subtitle, color, onClick }) => (
    <div
        className={`bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
    >
        <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${color}`}>
                <Icon size={24} className="text-white" />
            </div>
            {onClick && <ArrowRight size={16} className="text-slate-400" />}
        </div>
        <div>
            <h3 className="text-2xl font-bold text-slate-900 mb-1">{value}</h3>
            <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
    </div>
);

StatsCard.propTypes = {
    icon: PropTypes.elementType.isRequired,
    title: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    subtitle: PropTypes.string,
    color: PropTypes.string.isRequired,
    onClick: PropTypes.func
};

export default StatsCard;