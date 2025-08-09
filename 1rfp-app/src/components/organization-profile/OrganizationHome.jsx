// src/components/organization-profile/OrganizationHome.jsx - Updated with OrganizationPostsManager
import React, { useState } from 'react';
import { MessageSquare, Plus } from 'lucide-react';
import OrganizationPostsManager from './OrganizationPostsManager.jsx';
import { hasPermission, PERMISSIONS } from '../../utils/organizationPermissions.js';

const OrganizationHome = ({ 
  organization, 
  organizationPosts, 
  session, 
  onPostDelete,
  userMembership,
  photos = [], // Keep for compatibility but don't display
  activeTab,
  setActiveTab
}) => {
  // Check permissions
  const canCreatePosts = userMembership && hasPermission(
    userMembership.role, 
    PERMISSIONS.EDIT_ORGANIZATION, 
    session?.user?.is_omega_admin
  );

  const FocusAreaPill = ({ area }) => {
    const gradients = [
      'from-amber-100 to-orange-100 text-amber-700 border-orange-200', 
      'from-emerald-100 to-teal-100 text-emerald-700 border-teal-200', 
      'from-rose-100 to-pink-100 text-rose-700 border-rose-200', 
      'from-blue-100 to-indigo-100 text-blue-700 border-indigo-200'
    ];
    const gradient = gradients[area.length % gradients.length];
    return (
      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border bg-gradient-to-r ${gradient}`}>
        {area}
      </span>
    );
  };

  return (
    <div className="space-y-10">
      {/* Mission Section */}
      <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm grid md:grid-cols-2 gap-10 items-center">
        <div className="flex flex-col h-full">
          <h2 className="text-3xl font-black text-slate-900 mb-4">Our Mission ✨</h2>
          <p className="text-slate-700 leading-relaxed text-lg flex-grow">
            {organization.description || "Working to create positive impact in our community through strategic partnerships and innovative solutions."}
          </p>
          
          {/* Focus Areas */}
          {organization.focusAreas && organization.focusAreas.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-200">
              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Focus Areas</h4>
              <div className="flex flex-wrap gap-3">
                {organization.focusAreas.map((area) => (
                  <FocusAreaPill key={area} area={area} />
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Mission Image */}
        <img 
          src={organization.mission_image_url || 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&h=600&fit=crop'} 
          alt="Our Mission" 
          className="rounded-2xl object-cover w-full h-full max-h-[450px]" 
        />
      </div>

      {/* Organization Posts Section - Using OrganizationPostsManager */}
      <div className="space-y-6">
        <OrganizationPostsManager 
          organization={organization}
          session={session}
          userMembership={null} // Force no posting permissions in live view
          currentUserProfile={session?.user}
        />
      </div>
    </div>
  );
};

export default OrganizationHome;