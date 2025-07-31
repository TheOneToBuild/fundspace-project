// src/components/organization-profile/OrganizationTeam.jsx
// Extract shared team display logic with full social functionality

import React from 'react';
import { Users, UserPlus, ExternalLink } from 'lucide-react';
import { Linkedin, Twitter, Globe } from '../Icons.jsx';
import Avatar from '../Avatar.jsx';
import { hasPermission, PERMISSIONS } from '../../utils/organizationPermissions.js';
import { useTeamMemberSocial } from '../../hooks/useTeamMemberSocial.js';

const OrganizationTeam = ({ teamMembers = [], organization, userMembership, session }) => {
  // Check if user can manage team members
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

  // Group team members by membership type and role
  const groupedMembers = teamMembers.reduce((groups, member) => {
    const roleType = member.membership_type || 'staff';
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

  // Social platform mapping
  const socialPlatforms = [
    { key: 'linkedin_url', icon: Linkedin, color: 'bg-blue-600' },
    { key: 'twitter_url', icon: Twitter, color: 'bg-slate-900' },
    { key: 'website_url', icon: Globe, color: 'bg-green-600' }
  ];

  // Get available social links for a member
  const getSocialLinks = (profile) => {
    return socialPlatforms.filter(platform => profile?.[platform.key]).map(platform => ({
      ...platform,
      url: profile[platform.key]
    }));
  };

  // Team Member Card Component with Social Functionality
  const TeamMemberCard = ({ member, organization, currentUserId }) => {
    const {
      isFollowing,
      followLoading,
      toggleFollow,
      mutualConnections,
      connectionLoading,
      getConnectionButtonProps
    } = useTeamMemberSocial(member.profile_id, currentUserId);

    const connectionButtonProps = getConnectionButtonProps();
    const socialLinks = getSocialLinks(member.profiles);

    const getConnectionText = () => {
      if (mutualConnections > 0) {
        return `${mutualConnections} mutual connection${mutualConnections > 1 ? 's' : ''}`;
      }
      return 'Connect to see mutual connections';
    };

    const getButtonVariantClasses = (variant) => {
      switch (variant) {
        case 'primary':
          return 'bg-blue-600 text-white hover:bg-blue-700';
        case 'secondary':
          return 'border border-slate-300 text-slate-700 hover:bg-slate-50';
        case 'connected':
          return 'border border-green-300 text-green-700 bg-green-50 hover:bg-green-100';
        default:
          return 'border border-slate-300 text-slate-700 hover:bg-slate-50';
      }
    };

    // Don't show buttons for current user's own card
    if (member.profile_id === currentUserId) {
      return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden w-full max-w-xs mx-auto">
          {/* Banner with organization image */}
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
            {/* Avatar positioned to overlap banner */}
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
            
            {/* Name */}
            <h5 className="text-xl font-bold text-slate-900 mb-2">
              {member.profiles?.full_name || 'Unknown Member'}
            </h5>
            
            {/* Organization Name */}
            <p className="text-slate-600 text-sm mb-3">
              {organization?.name}
            </p>
            
            {/* Title/Role */}
            {(member.functional_role || member.profiles?.title) && (
              <p className="text-blue-600 font-semibold text-sm mb-4">
                {member.functional_role || member.profiles.title}
              </p>
            )}
            
            {/* Social Links - only show if user has social profiles */}
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
            
            {/* Your Profile indicator */}
            <p className="text-slate-500 text-xs mb-5">
              Your Profile
            </p>
            
            {/* No action buttons for current user */}
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
        {/* Banner with organization image */}
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
          {/* Avatar positioned to overlap banner */}
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
          
          {/* Name */}
          <h5 className="text-xl font-bold text-slate-900 mb-2">
            {member.profiles?.full_name || 'Unknown Member'}
          </h5>
          
          {/* Organization Name */}
          <p className="text-slate-600 text-sm mb-3">
            {organization?.name}
          </p>
          
          {/* Title/Role */}
          {(member.functional_role || member.profiles?.title) && (
            <p className="text-blue-600 font-semibold text-sm mb-4">
              {member.functional_role || member.profiles.title}
            </p>
          )}
          
          {/* Social Links - only show if user has social profiles */}
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
          
          {/* Connection info - mutual connections */}
          <p className="text-slate-500 text-xs mb-5">
            {getConnectionText()}
          </p>
          
          {/* Action buttons */}
          <div className="flex gap-3">
            <button 
              onClick={connectionButtonProps.action}
              disabled={connectionButtonProps.disabled || connectionLoading}
              className={`flex-1 px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${getButtonVariantClasses(connectionButtonProps.variant)} ${connectionButtonProps.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {connectionLoading ? 'Loading...' : connectionButtonProps.text}
            </button>
            <button 
              onClick={toggleFollow}
              disabled={followLoading}
              className={`flex-1 px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
                isFollowing 
                  ? 'border border-slate-300 text-slate-700 bg-slate-50' 
                  : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
              } ${followLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {followLoading ? 'Loading...' : (isFollowing ? 'Following' : 'Follow')}
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
      {/* Header */}
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