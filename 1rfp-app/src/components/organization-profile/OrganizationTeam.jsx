// src/components/organization-profile/OrganizationTeam.jsx
// Extract shared team display logic

import React from 'react';
import { Users } from 'lucide-react';
import Avatar from '../Avatar.jsx';

const OrganizationTeam = ({ teamMembers = [], organization }) => {
  if (!teamMembers.length) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <Users className="w-16 h-16 mx-auto text-slate-300 mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">No Team Members Listed</h3>
        <p className="text-slate-600">
          Team member information is not currently available for {organization?.name}.
        </p>
      </div>
    );
  }

  // Group team members by role type
  const groupedMembers = teamMembers.reduce((groups, member) => {
    const roleType = member.role_type || member.membership_type || 'staff';
    if (!groups[roleType]) {
      groups[roleType] = [];
    }
    groups[roleType].push(member);
    return groups;
  }, {});

  // Define role order and labels
  const roleOrder = ['leadership', 'staff', 'board', 'volunteer', 'contractor', 'partner', 'intern'];
  const roleLabels = {
    leadership: 'Leadership Team',
    staff: 'Staff Members',
    board: 'Board Members',
    volunteer: 'Volunteers',
    contractor: 'Contractors',
    partner: 'Partners',
    intern: 'Interns'
  };

  const renderTeamGroup = (roleType, members) => {
    const gridCols = members.length <= 3 ? 'md:grid-cols-3' : 
                     members.length <= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-5';

    return (
      <div key={roleType} className="mb-10">
        <h4 className="text-xl font-bold text-slate-800 mb-6 pb-2 border-b border-slate-200">
          {roleLabels[roleType] || `${roleType.charAt(0).toUpperCase()}${roleType.slice(1)}`}
          <span className="ml-2 text-sm font-normal text-slate-500">
            ({members.length} {members.length === 1 ? 'member' : 'members'})
          </span>
        </h4>
        
        <div className={`grid grid-cols-2 md:grid-cols-3 ${gridCols} gap-6`}>
          {members.map((member) => (
            <div 
              key={member.id} 
              className="bg-white rounded-lg border border-slate-200 p-6 text-center hover:shadow-md transition-shadow flex flex-col items-center justify-center"
            >
              <div className="flex justify-center mb-4">
                <Avatar 
                  src={member.avatar_url} 
                  fullName={member.full_name} 
                  size="lg" 
                />
              </div>
              
              <h5 className="font-bold text-slate-800 mb-2 text-sm text-center">
                {member.full_name}
              </h5>
              
              {(member.title || member.functional_role) && (
                <p className="text-blue-600 font-medium mb-3 text-xs text-center">
                  {member.title || member.functional_role}
                </p>
              )}
              
              {/* Role badge */}
              <div className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full mb-3">
                {member.role || 'Member'}
              </div>
              
              {/* Additional info */}
              {member.joined_at && (
                <div className="text-xs text-slate-400">
                  Joined {new Date(member.joined_at).getFullYear()}
                </div>
              )}
              
              {/* Member profile link - if you implement individual member pages */}
              <button className="text-xs text-slate-500 hover:text-slate-700 mt-2">
                View Profile →
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-slate-800 mb-3">Meet Our Team</h3>
        <p className="text-slate-600">
          The passionate people behind {organization?.name}'s mission
        </p>
      </div>
      
      {/* Render groups in priority order */}
      {roleOrder.map(roleType => {
        const members = groupedMembers[roleType];
        return members && members.length > 0 ? renderTeamGroup(roleType, members) : null;
      })}
      
      {/* Render any remaining role types not in the predefined order */}
      {Object.entries(groupedMembers).map(([roleType, members]) => {
        if (!roleOrder.includes(roleType) && members.length > 0) {
          return renderTeamGroup(roleType, members);
        }
        return null;
      })}
    </div>
  );
};

export default OrganizationTeam;