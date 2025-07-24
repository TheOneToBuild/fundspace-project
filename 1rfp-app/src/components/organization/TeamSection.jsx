// components/organization/TeamSection.jsx
import React from 'react';
import TeamMemberCard from './TeamMemberCard.jsx';

export default function TeamSection({ 
    title, 
    members, 
    userMembership, 
    profile, 
    onMemberAction, 
    setError 
}) {
    if (members.length === 0) return null;

    return (
        <div className="mb-8">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                {title} ({members.length})
            </h3>
            <div className="space-y-3">
                {members.map(member => (
                    <TeamMemberCard
                        key={member.profile_id}
                        member={member}
                        userMembership={userMembership}
                        profile={profile}
                        onMemberAction={onMemberAction}
                        setError={setError}
                    />
                ))}
            </div>
        </div>
    );
}