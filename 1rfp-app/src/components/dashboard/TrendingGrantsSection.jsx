// src/components/dashboard/TrendingGrantsSection.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar, DollarSign, MapPin, Bookmark, TrendingUp } from 'lucide-react';
import PropTypes from 'prop-types';

const TrendingGrantCard = ({ grant, onClick, onSave, onUnsave, isSaved }) => {
    const formatDate = (dateString) => {
        if (!dateString) return 'No deadline';
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = date.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return 'Expired';
        if (diffDays === 0) return 'Due today';
        if (diffDays === 1) return 'Due tomorrow';
        if (diffDays <= 7) return `${diffDays} days left`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const formatFunding = (amount) => {
        if (!amount) return 'Amount varies';
        if (typeof amount === 'string' && amount.includes('$')) return amount;
        const cleanAmount = amount?.toString().replace(/[^0-9]/g, '') || '0';
        const num = parseInt(cleanAmount);
        if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
        return `$${num.toLocaleString()}`;
    };

    const getUrgencyColor = (dueDate) => {
        if (!dueDate) return 'bg-slate-100 text-slate-600';
        const date = new Date(dueDate);
        const now = new Date();
        const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return 'bg-red-100 text-red-700';
        if (diffDays <= 3) return 'bg-orange-100 text-orange-700';
        if (diffDays <= 7) return 'bg-yellow-100 text-yellow-700';
        return 'bg-green-100 text-green-700';
    };

    const getOrgTypeColor = (type) => {
        const typeMap = {
            'nonprofit': 'bg-rose-100 text-rose-700 border-rose-200',
            '501(c)(3)': 'bg-rose-100 text-rose-700 border-rose-200',
            'education': 'bg-indigo-100 text-indigo-700 border-indigo-200',
            'healthcare': 'bg-emerald-100 text-emerald-700 border-emerald-200',
            'government': 'bg-blue-100 text-blue-700 border-blue-200',
            'foundation': 'bg-purple-100 text-purple-700 border-purple-200',
            'for profit': 'bg-green-100 text-green-700 border-green-200',
            'religious': 'bg-amber-100 text-amber-700 border-amber-200',
            'international': 'bg-cyan-100 text-cyan-700 border-cyan-200',
            'individual': 'bg-orange-100 text-orange-700 border-orange-200',
            'local government': 'bg-sky-100 text-sky-700 border-sky-200'
        };
        
        // Check for partial matches
        for (const [key, value] of Object.entries(typeMap)) {
            if (type.includes(key)) {
                return value;
            }
        }
        
        return 'bg-slate-100 text-slate-700 border-slate-200';
    };

    const handleBookmark = (e) => {
        e.stopPropagation();
        
        if (isSaved) {
            onUnsave?.(grant.id);
        } else {
            onSave?.(grant.id);
        }
    };

    // Extract organization data consistently
    const organizationData = {
        name: grant.organization?.name || grant.foundation_name || grant.foundationName || grant.funder_name || 'Unknown Foundation',
        imageUrl: grant.organization?.image_url || grant.funder_logo_url || null,
        bannerUrl: grant.organization?.banner_image_url || null
    };

    const grantData = {
        title: grant.title || 'Untitled Grant',
        description: grant.description || 'No description available',
        fundingAmount: grant.funding_amount_text || grant.fundingAmount || grant.max_funding_amount,
        dueDate: grant.due_date || grant.dueDate || grant.deadline,
        location: grant.location || grant.locations?.[0]?.name || 'Location varies',
        grantType: grant.grant_type || grant.grantType
    };

    const getInitials = (name) => {
        if (!name || name === 'Unknown Foundation') return '💰';
        const words = name.split(' ');
        if (words.length > 1) {
            return (words[0][0] + words[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <div
            className="flex-shrink-0 w-80 bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group relative transform hover:-translate-y-1"
            onClick={onClick}
        >
            {/* Banner & Avatar Section */}
            <div className="relative">
                {/* Organization Banner */}
                <div className="h-16 bg-gradient-to-br from-slate-100 via-white to-slate-100">
                    {organizationData.bannerUrl && (
                        <img
                            src={organizationData.bannerUrl}
                            alt={`${organizationData.name} banner`}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                    )}
                </div>

                {/* Organization Avatar */}
                <div className="absolute bottom-0 left-4 translate-y-1/2 transform transition-transform duration-300 group-hover:scale-110">
                    {organizationData.imageUrl ? (
                        <img
                            src={organizationData.imageUrl}
                            alt={`${organizationData.name} logo`}
                            className="h-10 w-10 rounded-lg object-cover border-2 border-white shadow-lg bg-white"
                            onError={(e) => { 
                                e.target.style.display = 'none'; 
                                e.target.nextSibling.style.display = 'flex'; 
                            }}
                        />
                    ) : null}
                    <div className={`h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-lg border-2 border-white ${organizationData.imageUrl ? 'hidden' : 'flex'}`}>
                        {getInitials(organizationData.name)}
                    </div>
                </div>

                {/* Status badges - positioned in top-right corner like main grant cards */}
                <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
                    <div className={`text-xs font-medium px-2 py-1 rounded-full ${getUrgencyColor(grantData.dueDate)}`}>
                        {formatDate(grantData.dueDate)}
                    </div>
                    {/* Bookmark count badge - always show total bookmarks from all users */}
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
                        <Bookmark size={8} fill="currentColor" />
                        {grant.save_count || 0}
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="px-4 pt-6 pb-4">
                {/* Organization name */}
                <div className="mb-3">
                    <p className="font-semibold text-slate-800 text-sm truncate">
                        {organizationData.name}
                    </p>
                </div>

                {/* Grant title */}
                <h4 className="font-bold text-slate-900 text-base mb-3 line-clamp-2 leading-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
                    {grantData.title}
                </h4>

                {/* Description */}
                <p className="text-slate-600 text-sm leading-relaxed line-clamp-3 mb-4">
                    {grantData.description}
                </p>

                {/* Location - only show if not "Location varies" */}
                {grantData.location && grantData.location !== 'Location varies' && (
                    <div className="flex items-center text-xs mb-4">
                        <MapPin size={12} className="mr-1 text-blue-500" />
                        <span className="text-slate-600 truncate">{grantData.location}</span>
                    </div>
                )}

                {/* Action footer with funding at bottom */}
                <div className="space-y-3">
                    {/* FUNDING AMOUNT - Centered */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-2 border border-green-200 shadow-sm">
                        <div className="flex items-center justify-center gap-1">
                            <DollarSign size={14} className="text-green-600" />
                            <span className="text-sm font-bold text-green-800">
                                {formatFunding(grantData.fundingAmount)}
                            </span>
                        </div>
                    </div>

                    {/* Eligible Organization Types - Colored Pills */}
                    {grant.eligible_organization_types && grant.eligible_organization_types.length > 0 && (
                        <div>
                            <p className="text-xs text-slate-500 mb-2">Eligible Organizations</p>
                            <div className="flex flex-wrap gap-1 items-center">
                                {grant.eligible_organization_types.slice(0, 2).map((type, index) => {
                                    const cleanType = type.replace(/^\d+\.\s*/, '').replace(/([A-Z])/g, ' $1').trim();
                                    const colorClass = getOrgTypeColor(cleanType.toLowerCase());
                                    return (
                                        <span key={index} className={`text-xs px-2 py-1 rounded-full font-medium ${colorClass}`}>
                                            {cleanType}
                                        </span>
                                    );
                                })}
                                {grant.eligible_organization_types.length > 2 && (
                                    <span className="text-xs text-slate-500">+{grant.eligible_organization_types.length - 2} more</span>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <button
                            onClick={handleBookmark}
                            className={`p-2 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-105 ${
                                isSaved 
                                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white' 
                                    : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            <Bookmark size={14} fill={isSaved ? 'currentColor' : 'none'} />
                        </button>
                        <div className="text-blue-600 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            View Details →
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TrendingGrantsSection = ({ currentUserProfile, onOpenGrantModal, trendingGrants = [], onSaveGrant, onUnsaveGrant, savedGrantIds = new Set() }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Debug log to see what grants are being passed
    console.log('TrendingGrantsSection received grants:', trendingGrants.map(g => ({ id: g.id, save_count: g.save_count })));

    const scrollGrants = (direction) => {
        const container = document.getElementById('trending-grants-scroll');
        if (container) {
            container.scrollBy({ left: direction === 'left' ? -320 : 320, behavior: 'smooth' });
        }
    };

    const handleViewMore = () => {
        navigate('/grants');
    };

    const handleGrantClick = (grant) => {
        // Use the modal callback to open the grant detail modal
        if (onOpenGrantModal) {
            onOpenGrantModal(grant);
        } else {
            // Fallback to navigation if no modal callback provided
            navigate(`/grants?open_grant=${grant.id}`);
        }
    };

    if (loading) {
        return (
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-800">Trending Grants</h2>
                </div>
                <div className="flex space-x-4 overflow-hidden">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex-shrink-0 w-80 bg-slate-100 rounded-xl h-64 animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <TrendingUp className="text-green-500" size={24} />
                        Trending Grants
                    </h2>
                    <p className="text-sm text-slate-600 mt-1">Popular funding opportunities from the community</p>
                </div>
                <div className="flex items-center space-x-2">
                    {trendingGrants.length > 0 && (
                        <div className="flex space-x-2">
                            <button
                                onClick={() => scrollGrants('left')}
                                className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={() => scrollGrants('right')}
                                className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                    <button
                        onClick={handleViewMore}
                        className="ml-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                        View All Grants
                    </button>
                </div>
            </div>

            {trendingGrants.length > 0 ? (
                <div id="trending-grants-scroll" className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4">
                    {trendingGrants.map(grant => (
                        <TrendingGrantCard
                            key={grant.id}
                            grant={grant}
                            onClick={() => handleGrantClick(grant)}
                            onSave={onSaveGrant}
                            onUnsave={onUnsaveGrant}
                            isSaved={savedGrantIds.has(grant.id)}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                    <TrendingUp size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-600 mb-2">No trending grants yet</h3>
                    <p className="text-slate-500 text-sm mb-4">Check back later for popular funding opportunities!</p>
                    <button
                        onClick={handleViewMore}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Browse All Grants
                    </button>
                </div>
            )}
        </div>
    );
};

TrendingGrantsSection.propTypes = {
    currentUserProfile: PropTypes.object,
    onOpenGrantModal: PropTypes.func,
    trendingGrants: PropTypes.array,
    onSaveGrant: PropTypes.func,
    onUnsaveGrant: PropTypes.func,
    savedGrantIds: PropTypes.object
};

TrendingGrantCard.propTypes = {
    grant: PropTypes.object.isRequired,
    onClick: PropTypes.func.isRequired,
    onSave: PropTypes.func,
    onUnsave: PropTypes.func,
    isSaved: PropTypes.bool
};

export default TrendingGrantsSection;