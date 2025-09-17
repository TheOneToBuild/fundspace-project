// src/components/discover/components/OrganizationCard.jsx - FIXED
import React from 'react';
import { Link } from 'react-router-dom';
import { Building, Users, MessageSquare, ExternalLink } from 'lucide-react';

export default function OrganizationCard({ organization }) {
    // Safety check for organization object
    if (!organization) {
        return null;
    }

    return (
        <div className="group bg-white rounded-3xl shadow-lg border border-slate-200 p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 relative overflow-hidden">
            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Background decoration */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full opacity-30 blur-xl" />
            
            <div className="relative z-10">
                <div className="flex items-start gap-6 mb-6">
                    {/* Organization Logo/Avatar */}
                    <div className="flex-shrink-0">
                        <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden">
                            {organization.image_url ? (
                                <img 
                                    src={organization.image_url} 
                                    alt={`${organization.name} logo`} 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextElementSibling.style.display = 'flex';
                                    }}
                                />
                            ) : null}
                            <div className={`w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg ${organization.image_url ? 'hidden' : 'flex'}`}>
                                {organization.name ? organization.name.substring(0, 2).toUpperCase() : '??'}
                            </div>
                        </div>
                    </div>
                    
                    {/* Organization Info */}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
                            {organization.name}
                        </h3>
                        
                        {organization.tagline && (
                            <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                                {organization.tagline}
                            </p>
                        )}
                        
                        {/* Organization Type Badge */}
                        {organization.type && (
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 text-xs font-medium mb-3">
                                <Building className="w-3 h-3" />
                                {organization.type}
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Row */}
                <div className="flex items-center gap-6 mb-6 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="font-medium">
                            {organization.organization_follows?.[0]?.count || 0} followers
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <MessageSquare className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="font-medium">
                            {organization.organization_posts?.[0]?.count || 0} posts
                        </span>
                    </div>
                </div>

                {/* Action Button */}
                <div className="flex items-center justify-between">
                    <Link
                        to={`/organizations/${organization.slug || organization.id}`}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:shadow-lg hover:scale-105"
                    >
                        View Profile
                        <ExternalLink className="w-4 h-4" />
                    </Link>
                    
                    {/* Location if available */}
                    {organization.location && (
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                            {organization.location}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}