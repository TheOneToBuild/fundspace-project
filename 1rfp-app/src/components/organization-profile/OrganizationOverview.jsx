// src/components/organization-profile/OrganizationOverview.jsx
// Extract shared overview logic from both profile pages

import React from 'react';
import { 
  MapPin, DollarSign, Users, Calendar, Building, CheckCircle,
  Lightbulb, Tag, Globe, Mail, ExternalLink
} from 'lucide-react';
import { getPillClasses } from '../../utils.js';

const OrganizationOverview = ({ organization, recentActivities = [] }) => {
  if (!organization) return null;

  const renderQuickFacts = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Location */}
      {organization.location && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <MapPin size={16} className="text-white" />
            </div>
            <span className="font-semibold text-slate-800">Headquarters</span>
          </div>
          <p className="text-slate-600 ml-11">{organization.location}</p>
        </div>
      )}

      {/* Annual Budget */}
      {organization.annual_budget && (
        <div className="bg-green-50 rounded-lg p-4 border border-green-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <DollarSign size={16} className="text-white" />
            </div>
            <span className="font-semibold text-slate-800">Annual Budget</span>
          </div>
          <p className="text-slate-600 ml-11">{organization.annual_budget}</p>
        </div>
      )}

      {/* Year Founded */}
      {organization.year_founded && (
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <Calendar size={16} className="text-white" />
            </div>
            <span className="font-semibold text-slate-800">Year Founded</span>
          </div>
          <p className="text-slate-600 ml-11">{organization.year_founded}</p>
        </div>
      )}

      {/* Staff Count */}
      {organization.staff_count && (
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
              <Users size={16} className="text-white" />
            </div>
            <span className="font-semibold text-slate-800">Staff Count</span>
          </div>
          <p className="text-slate-600 ml-11">{organization.staff_count}</p>
        </div>
      )}
    </div>
  );

  const renderContactInfo = () => (
    <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
      <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        <Building className="text-slate-500" />
        Contact Information
      </h4>
      
      <div className="space-y-3">
        {organization.website && (
          <div className="flex items-center gap-3">
            <Globe size={16} className="text-slate-400" />
            <a 
              href={organization.website}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
            >
              {organization.website}
              <ExternalLink size={12} />
            </a>
          </div>
        )}
        
        {organization.contact_email && (
          <div className="flex items-center gap-3">
            <Mail size={16} className="text-slate-400" />
            <a 
              href={`mailto:${organization.contact_email}`}
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              {organization.contact_email}
            </a>
          </div>
        )}
      </div>
    </div>
  );

  const renderRecentActivities = () => {
    if (!recentActivities.length) return null;

    return (
      <div className="bg-white rounded-lg p-6 border border-slate-200">
        <h4 className="text-lg font-bold text-slate-800 mb-4">Recent Activities</h4>
        <div className="space-y-4">
          {recentActivities.slice(0, 5).map((activity, index) => (
            <div key={activity.id || index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="flex-1">
                <p className="text-slate-800 font-medium">{activity.title || activity.description}</p>
                {activity.amount && (
                  <p className="text-green-600 font-semibold">{activity.amount}</p>
                )}
                <p className="text-slate-500 text-sm">{activity.date || activity.activity_date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Mission and Description */}
      <div className="bg-white rounded-xl border border-slate-200 p-8">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Lightbulb className="text-yellow-500" />
          About {organization.name}
        </h3>
        
        {organization.description && (
          <p className="text-slate-600 leading-relaxed text-lg mb-8">
            {organization.description}
          </p>
        )}
        
        {/* Focus Areas */}
        {organization.focusAreas && organization.focusAreas.length > 0 && (
          <div className="mb-8 bg-pink-50 rounded-lg p-4 border border-pink-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center">
                <Tag size={16} className="text-white" />
              </div>
              <span className="font-semibold text-slate-800">Focus Areas</span>
            </div>
            <div className="flex flex-wrap gap-2 ml-11">
              {organization.focusAreas.map(area => (
                <span 
                  key={area} 
                  className={`text-sm font-semibold px-3 py-1.5 rounded-full ${getPillClasses(area)}`}
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Quick Facts */}
        <div className="border-t border-slate-200 pt-8">
          <h4 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Building className="text-blue-500" />
            Organization Details
          </h4>
          {renderQuickFacts()}
        </div>

        {/* EIN for Nonprofits */}
        {organization.ein && (
          <div className="mt-6 bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-slate-500 rounded-full flex items-center justify-center">
                <CheckCircle size={16} className="text-white" />
              </div>
              <span className="font-semibold text-slate-800">Tax ID (EIN)</span>
            </div>
            <p className="text-slate-600 ml-11">{organization.ein}</p>
          </div>
        )}
      </div>

      {/* Contact Information */}
      {(organization.website || organization.contact_email) && (
        renderContactInfo()
      )}

      {/* Recent Activities */}
      {renderRecentActivities()}
    </div>
  );
};

export default OrganizationOverview;