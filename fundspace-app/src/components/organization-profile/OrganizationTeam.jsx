import React from 'react';
import { Users, UserPlus, ExternalLink } from 'lucide-react';
import { Linkedin, Twitter, Globe } from '../Icons.jsx';
import Avatar from '../Avatar.jsx';
import { hasPermission, PERMISSIONS } from '../../utils/organizationPermissions.js';

const OrganizationTeam = ({ teamMembers = [], organization, userMembership, session }) => {
  const canManageTeam = userMembership && hasPermission(
    userMembership.role, 
    PERMISSIONS.MANAGE_MEMBERS, 
    session?.user?.is_omega_admin
  );

  if (!teamMembers.length) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="w-24 h-24 mx-auto mb-6 bg-slate-100 rounded-2xl flex items-center justify-center">
            <Users className="w-12 h-12 text-slate-400" />
          </div>
          
          <h3 className="text-2xl font-bold text-slate-900 mb-4">No Team Members Listed</h3>
          <p className="text-slate-600 mb-8 leading-relaxed">
            {canManageTeam 
              ? "Start building your team by inviting members to join your organization and showcase the people behind your mission."
              : `${organization?.name} hasn't added their team members yet. Check back soon to meet the people behind their mission.`
            }
          </p>
          
          {canManageTeam && (
            <button className="inline-flex items-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl">
              <UserPlus className="w-5 h-5" />
              Invite Team Members
            </button>
          )}
        </div>
      </div>
    );
  }

  const groupedMembers = teamMembers.reduce((groups, member) => {
    const roleType = member.membership_type || 'staff';
    if (!groups[roleType]) {
      groups[roleType] = [];
    }
    groups[roleType].push(member);
    return groups;
  }, {});

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

  const socialPlatforms = [
    { key: 'linkedin_url', icon: Linkedin, color: 'bg-blue-600' },
    { key: 'twitter_url', icon: Twitter, color: 'bg-slate-900' },
    { key: 'website_url', icon: Globe, color: 'bg-green-600' }
  ];

  const getSocialLinks = (profile) => {
    return socialPlatforms.filter(platform => profile?.[platform.key]).map(platform => ({
      ...platform,
      url: profile[platform.key]
    }));
  };

  const TeamMemberCard = ({ member, organization, currentUserId }) => {
    const socialLinks = getSocialLinks(member.profiles);

    if (member.profile_id === currentUserId) {
      return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden w-full max-w-xs mx-auto">
          <div className="h-24 bg-gradient-to-r from-slate-200 to-slate-300 relative overflow-hidden">
            {organization?.banner_image_url ? (
              <img 
                src={organization.banner_image_url} 
                alt="Team banner" 
                className="w-full h-full object-cover opacity-80" 
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-300 via-slate-200 to-slate-100"></div>
            )}
          </div>
          
          <div className="px-7 pb-7 text-center relative">
            <div className="relative -mt-12 mb-5">
              <div className="w-24 h-24 mx-auto rounded-full overflow-hidden ring-4 ring-white shadow-lg bg-slate-100">
                <Avatar 
                  src={member.profiles?.avatar_url} 
                  fullName={member.profiles?.full_name} 
                  size="xl" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            <h5 className="text-xl font-bold text-slate-900 mb-2">
              {member.profiles?.full_name || 'Unknown Member'}
            </h5>
            
            <p className="text-slate-600 text-sm mb-3">
              {organization?.name}
            </p>
            
            {(member.functional_role || member.profiles?.title) && (
              <p className="text-blue-600 font-semibold text-sm mb-4">
                {member.functional_role || member.profiles.title}
              </p>
            )}
            
            {socialLinks.length > 0 && (
              <div className="flex justify-center gap-2 mb-4">
                {socialLinks.map((social, index) => {
                  const IconComponent = social.icon;
                  return (
                    <a
                      key={index}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${social.color} hover:opacity-80 transition-opacity`}
                      title={`Visit ${social.key.replace('_url', '').replace('_', ' ')}`}
                    >
                      <IconComponent className="w-4 h-4 text-white" />
                    </a>
                  );
                })}
              </div>
            )}
            
            <p className="text-slate-500 text-xs mb-5">
              Your Profile
            </p>
            
            <div className="flex gap-3">
              <div className="flex-1 bg-slate-100 text-slate-500 px-5 py-2.5 rounded-full text-sm font-medium">
                You
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-slate-300 transition-all duration-300 w-full max-w-xs mx-auto">
        <div className="h-24 bg-gradient-to-r from-slate-200 to-slate-300 relative overflow-hidden">
          {organization?.banner_image_url ? (
            <img 
              src={organization.banner_image_url} 
              alt="Team banner" 
              className="w-full h-full object-cover opacity-80" 
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-300 via-slate-200 to-slate-100"></div>
          )}
        </div>
        
        <div className="px-7 pb-7 text-center relative">
          <div className="relative -mt-12 mb-5">
            <div className="w-24 h-24 mx-auto rounded-full overflow-hidden ring-4 ring-white shadow-lg bg-slate-100">
              <Avatar 
                src={member.profiles?.avatar_url} 
                fullName={member.profiles?.full_name} 
                size="xl" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          
          <h5 className="text-xl font-bold text-slate-900 mb-2">
            {member.profiles?.full_name || 'Unknown Member'}
          </h5>
          
          <p className="text-slate-600 text-sm mb-3">
            {organization?.name}
          </p>
          
          {(member.functional_role || member.profiles?.title) && (
            <p className="text-blue-600 font-semibold text-sm mb-4">
              {member.functional_role || member.profiles.title}
            </p>
          )}
          
          {socialLinks.length > 0 && (
            <div className="flex justify-center gap-2 mb-4">
              {socialLinks.map((social, index) => {
                const IconComponent = social.icon;
                return (
                  <a
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${social.color} hover:opacity-80 transition-opacity`}
                    title={`Visit ${social.key.replace('_url', '').replace('_', ' ')}`}
                  >
                    <IconComponent className="w-4 h-4 text-white" />
                  </a>
                );
              })}
            </div>
          )}
          
          <p className="text-slate-500 text-xs mb-5">
            View Profile
          </p>
          
          <div className="flex gap-3">
            <button className="flex-1 px-5 py-2.5 rounded-full text-sm font-medium transition-colors border border-slate-300 text-slate-700 hover:bg-slate-50">
              Connect
            </button>
            <button className="flex-1 px-5 py-2.5 rounded-full text-sm font-medium transition-colors border border-slate-300 text-slate-700 hover:bg-slate-50">
              Follow
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderTeamGroup = (roleType, members) => {
    return (
      <div key={roleType} className="mb-12">
        <h4 className="text-2xl font-bold text-slate-800 mb-8 pb-3 border-b-2 border-slate-100">
          {roleLabels[roleType] || `${roleType.charAt(0).toUpperCase()}${roleType.slice(1)}`}
          <span className="ml-3 text-base font-normal text-slate-500">
            ({members.length})
          </span>
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {members.map((member) => (
            <TeamMemberCard 
              key={member.id} 
              member={member} 
              organization={organization}
              currentUserId={session?.user?.id}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-slate-900 mb-4">Meet Our Team</h2>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          The passionate people behind {organization?.name}'s mission and the driving force of our impact
        </p>
        
        {canManageTeam && (
          <div className="mt-8">
            <button className="inline-flex items-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl">
              <UserPlus className="w-5 h-5" />
              Manage Team
            </button>
          </div>
        )}
      </div>
      
      {roleOrder.map(roleType => {
        const members = groupedMembers[roleType];
        return members && members.length > 0 ? renderTeamGroup(roleType, members) : null;
      })}
      
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