// components/organization/TeamSection.jsx - Updated to pass organization data
import React from 'react';
import TeamMemberCard from './TeamMemberCard.jsx';

export default function TeamSection({ 
    title, 
    members, 
    userMembership, 
    profile, 
    onMemberAction, 
    setError,
    organization
}) {
    if (members.length === 0) return null;

    return (
        <div className="mb-8">
            <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
                {title} ({members.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {members.map(member => (
                    <TeamMemberCard
                        key={member.profile_id}
                        member={member}
                        userMembership={userMembership}
                        profile={profile}
                        onMemberAction={onMemberAction}
                        setError={setError}
                        organization={organization}
                    />
                ))}
            </div>
        </div>
    );
}