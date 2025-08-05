// src/components/portal/track-funds/components/TeamSection.jsx
import React from 'react';
import { MessageCircle, Plus } from '../../../Icons.jsx';

const TeamSection = ({ teamMembers, unreadComments, onToggleComments, onAddMember }) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-slate-700">Team Members ({teamMembers.length})</span>
        <div className="flex items-center gap-2">
          <button 
            onClick={onToggleComments}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 px-3 py-1 hover:bg-blue-50 rounded-md transition-colors"
          >
            <MessageCircle size={14} />
            Comments
            {unreadComments > 0 && (
              <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-1">
                {unreadComments}
              </span>
            )}
          </button>
          <button 
            onClick={onAddMember}
            className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1 px-3 py-1 hover:bg-green-50 rounded-md transition-colors"
          >
            <Plus size={14} />
            Add Member
          </button>
        </div>
      </div>
      
      <div className="flex items-center gap-3 flex-wrap">
        {teamMembers.map((member) => (
          <div key={member.id} className="flex items-center gap-3 bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg px-4 py-3 border border-slate-200 hover:border-blue-300 transition-colors">
            <div className="relative">
              {member.avatar ? (
                <img 
                  src={member.avatar} 
                  alt={member.name}
                  className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center border-2 border-white shadow-sm">
                  <span className="text-white text-sm font-bold">{member.initials}</span>
                </div>
              )}
              {member.isOnline && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              )}
            </div>
            <div>
              <div className="text-sm font-medium text-slate-900">{member.name}</div>
              <div className="text-xs text-slate-500">{member.role}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamSection;