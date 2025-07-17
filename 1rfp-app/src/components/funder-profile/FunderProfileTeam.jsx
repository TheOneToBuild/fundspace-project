import React from 'react';
import Avatar from '../Avatar.jsx';

export default function FunderProfileTeam({ members }) {
    // This component uses mock data as per the original file.
    // It can be updated later to use the `members` prop passed from the parent.
    const mockTeamData = [
      { id: 1, full_name: "Dr. Sarah Chen", title: "Executive Director", avatar_url: null, role_type: "leadership" },
      { id: 2, full_name: "Michael Rodriguez", title: "Chief Operating Officer", avatar_url: null, role_type: "leadership" },
      { id: 3, full_name: "Jane Do", title: "Program Manager", avatar_url: null, role_type: "staff" },
      { id: 4, full_name: "John Do", title: "Education Engineer", avatar_url: null, role_type: "staff" },
      { id: 5, full_name: "Emily Watson", title: "Research Coordinator", avatar_url: null, role_type: "staff" },
      { id: 6, full_name: "David Kim", title: "Communications Specialist", avatar_url: null, role_type: "staff" },
      { id: 7, full_name: "Dr. Patricia Williams", title: "Board Chair", avatar_url: null, role_type: "board" },
      { id: 8, full_name: "Robert Johnson", title: "Board Treasurer", avatar_url: null, role_type: "board" },
      { id: 9, full_name: "Maria Gonzalez", title: "Board Secretary", avatar_url: null, role_type: "board" },
      { id: 10, full_name: "Thomas Anderson", title: "Board Member", avatar_url: null, role_type: "board" }
    ];

    const leadership = mockTeamData.filter(member => member.role_type === 'leadership');
    const staff = mockTeamData.filter(member => member.role_type === 'staff');
    const boardMembers = mockTeamData.filter(member => member.role_type === 'board');

    const renderTeamGroup = (title, members, gridCols = "xl:grid-cols-5") => (
        <div className="mb-10">
            <h4 className="text-xl font-bold text-slate-800 mb-6 pb-2 border-b border-slate-200">{title}</h4>
            <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ${gridCols} gap-6`}>
                {members.map(member => (
                    <div key={member.id} className="bg-white rounded-lg border border-slate-200 p-6 text-center hover:shadow-md transition-shadow flex flex-col items-center justify-center">
                        <div className="flex justify-center mb-4">
                            <Avatar src={member.avatar_url} fullName={member.full_name} size="lg" />
                        </div>
                        <h5 className="font-bold text-slate-800 mb-2 text-sm">{member.full_name}</h5>
                        <p className="text-blue-600 font-medium mb-3 text-xs">{member.title}</p>
                        <button className="text-xs text-slate-500 hover:text-slate-700">View Profile →</button>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h3 className="text-2xl font-bold text-slate-800 mb-3">Meet Our Team</h3>
                <p className="text-slate-600">The people behind the mission</p>
            </div>

            {leadership.length > 0 && renderTeamGroup("Leadership", leadership, "xl:grid-cols-4")}
            {staff.length > 0 && renderTeamGroup("Staff", staff, "xl:grid-cols-5")}
            {boardMembers.length > 0 && renderTeamGroup("Board Members", boardMembers, "xl:grid-cols-5")}
        </div>
    );
}