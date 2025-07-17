import React from 'react';
import { getPillClasses, formatDate } from '../../utils';
import { Lightbulb, Building, MapPin, DollarSign, MessageSquare, Award, Tag, Calendar, Users } from '../Icons.jsx';

export default function FunderProfileOverview({ funder, recentActivities }) {

  const renderRecentActivity = () => (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <Calendar className="text-blue-500" />
        Recent Activity
      </h3>

      <div className="space-y-4">
        {recentActivities.map(activity => (
          <div key={activity.id} className="flex items-start gap-4 p-4 hover:bg-slate-50 rounded-lg transition-colors">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              {activity.type === 'grant_awarded' && <DollarSign size={16} className="text-blue-600" />}
              {activity.type === 'new_program' && <Lightbulb size={16} className="text-blue-600" />}
              {activity.type === 'partnership' && <Users size={16} className="text-blue-600" />}
            </div>

            <div className="flex-1">
              <p className="font-medium text-slate-800">{activity.description}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-slate-500">{formatDate(activity.date)}</span>
                {activity.amount && (
                  <span className="text-sm font-medium text-green-600">{activity.amount}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-3 space-y-8">
        <div className="bg-white rounded-xl border border-slate-200 p-8">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Lightbulb className="text-yellow-500" />
            Our Mission & Approach
          </h3>
          <p className="text-slate-600 leading-relaxed text-lg mb-8">{funder.description}</p>
          <div className="border-t border-slate-200 pt-8">
            <h4 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Building className="text-blue-500" />
              Quick Facts
            </h4>
            {funder.focus_areas?.length > 0 && (
              <div className="mb-6 bg-pink-50 rounded-lg p-4 border border-pink-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center">
                    <Tag size={16} className="text-white" />
                  </div>
                  <span className="font-semibold text-slate-800">Focus / Priority Areas</span>
                </div>
                <div className="flex flex-wrap gap-2 ml-11">
                  {funder.focus_areas.map(area => (
                    <span key={area} className={`text-sm font-semibold px-3 py-1.5 rounded-full ${getPillClasses(area)}`}>
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <MapPin size={16} className="text-white" />
                  </div>
                  <span className="font-semibold text-slate-800">Headquarters</span>
                </div>
                <p className="text-slate-600 ml-11">{funder.location || 'Not specified'}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <DollarSign size={16} className="text-white" />
                  </div>
                  <span className="font-semibold text-slate-800">Annual Giving</span>
                </div>
                <p className="text-slate-600 ml-11">{funder.total_funding_annually || 'Not specified'}</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <MessageSquare size={16} className="text-white" />
                  </div>
                  <span className="font-semibold text-slate-800">Avg. Grant Size</span>
                </div>
                <p className="text-slate-600 ml-11">{funder.average_grant_size || 'Not specified'}</p>
              </div>
              {funder.notable_grant && (
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                      <Award size={16} className="text-white" />
                    </div>
                    <span className="font-semibold text-slate-800">Notable Grant</span>
                  </div>
                  <p className="text-slate-600 ml-11">{funder.notable_grant}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        {recentActivities && recentActivities.length > 0 && renderRecentActivity()}
      </div>
    </div>
  );
}