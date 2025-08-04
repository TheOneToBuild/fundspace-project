// src/components/portal/PortalBanner.jsx
import React from 'react';
import { MapPin } from '../Icons.jsx';

const PortalBanner = ({ userMembership }) => {
  if (!userMembership?.organizations) return null;

  return (
    <div className="mb-8">
      <div className="relative overflow-hidden rounded-3xl shadow-lg border border-slate-200">
        <div className="h-80 bg-gradient-to-br from-slate-100 via-white to-slate-100">
          {userMembership.organizations.banner_image_url ? (
            <img 
              src={userMembership.organizations.banner_image_url} 
              alt="Organization banner" 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500"></div>
          )}
        </div>
        
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-xl overflow-hidden flex-shrink-0">
              {userMembership.organizations.image_url ? (
                <img 
                  src={userMembership.organizations.image_url} 
                  alt="Organization logo" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xl">
                  {userMembership.organizations.name?.charAt(0)?.toUpperCase()}
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-2">{userMembership.organizations.name}</h2>
              {userMembership.organizations.tagline && (
                <p className="text-white/90 text-lg mb-4">{userMembership.organizations.tagline}</p>
              )}
              <div className="flex items-center gap-6 text-sm">
                {userMembership.organizations.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{userMembership.organizations.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortalBanner;