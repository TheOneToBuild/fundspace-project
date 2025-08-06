// components/organization/TeamManagement.jsx - Updated to pass organization prop
import React, { useState, useMemo } from 'react';
import { Search, Users } from 'lucide-react';
import { ROLES } from '../../utils/organizationPermissions.js';
import TeamSection from './TeamSection.jsx';

export default function TeamManagement({ 
    members, 
    userMembership, 
    profile, 
    onMemberAction, 
    setError,
    organization  // Add organization prop
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    // Filter members based on search and role
    const filteredMembers = useMemo(() => {
        return members.filter(member => {
            const matchesSearch = !searchQuery || 
                member.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                member.profiles?.title?.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesRole = roleFilter === 'all' || member.role === roleFilter;
            
            return matchesSearch && matchesRole;
        });
    }, [members, searchQuery, roleFilter]);

    // Organize members by role and title
    const organizedMembers = useMemo(() => {
        const filtered = filteredMembers;

        const leadership = filtered.filter(m => 
            ['super_admin', 'admin'].includes(m.role) || 
            m.profiles?.title?.toLowerCase().includes('director') ||
            m.profiles?.title?.toLowerCase().includes('ceo') ||
            m.profiles?.title?.toLowerCase().includes('president') ||
            m.profiles?.title?.toLowerCase().includes('executive')
        );

        const boardMembers = filtered.filter(m => 
            m.profiles?.title?.toLowerCase().includes('board') ||
            m.profiles?.title?.toLowerCase().includes('trustee') ||
            m.profiles?.title?.toLowerCase().includes('chair')
        );

        const staff = filtered.filter(m => 
            !leadership.includes(m) && !boardMembers.includes(m)
        );

        return { leadership, staff, boardMembers };
    }, [filteredMembers]);

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-800">
                    Team Members ({members.length})
                </h2>
                
                {/* Search and Filter Controls */}
                <div className="flex items-center space-x-3">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search members..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors w-64"
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    >
                        <option value="all">All Roles</option>
                        <option value={ROLES.SUPER_ADMIN}>Super Admins</option>
                        <option value={ROLES.ADMIN}>Admins</option>
                        <option value={ROLES.MEMBER}>Members</option>
                    </select>
                </div>
            </div>

            {/* Team Sections */}
            <div className="space-y-8">
                <TeamSection
                    title="Leadership"
                    members={organizedMembers.leadership}
                    userMembership={userMembership}
                    profile={profile}
                    onMemberAction={onMemberAction}
                    setError={setError}
                    organization={organization}  // Pass organization prop
                />
                
                <TeamSection
                    title="Board Members"
                    members={organizedMembers.boardMembers}
                    userMembership={userMembership}
                    profile={profile}
                    onMemberAction={onMemberAction}
                    setError={setError}
                    organization={organization}  // Pass organization prop
                />
                
                <TeamSection
                    title="Staff"
                    members={organizedMembers.staff}
                    userMembership={userMembership}
                    profile={profile}
                    onMemberAction={onMemberAction}
                    setError={setError}
                    organization={organization}  // Pass organization prop
                />
            </div>

            {/* Empty State */}
            {filteredMembers.length === 0 && (
                <div className="text-center py-8">
                    <Users size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500">
                        {searchQuery || roleFilter !== 'all' 
                            ? 'No members match your search criteria.'
                            : 'No team members found.'
                        }
                    </p>
                </div>
            )}
        </div>
    );
}