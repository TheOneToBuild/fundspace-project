// src/components/discover/components/OrganizationCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Building, Users, MessageSquare } from 'lucide-react';

export default function OrganizationCard({ org }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
                    {org.image_url ? (
                        <img src={org.image_url} alt={org.name} className="w-full h-full object-cover" />
                    ) : (
                        <Building className="w-6 h-6 text-slate-400" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <Link 
                        to={`/organizations/${org.slug}`}
                        className="text-lg font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                    >
                        {org.name}
                    </Link>
                    <p className="text-slate-600 text-sm mt-1">{org.tagline}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {org.organization_follows?.[0]?.count || 0} followers
                        </span>
                        <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {org.organization_posts?.[0]?.count || 0} posts
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}