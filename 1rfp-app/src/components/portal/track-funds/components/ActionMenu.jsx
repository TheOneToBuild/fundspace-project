// src/components/portal/track-funds/components/ActionMenu.jsx
import React, { useState } from 'react';
import { MoreHorizontal, CheckSquare, Bell, Trophy, X } from '../../../Icons.jsx';

const ActionMenu = ({ application, onMarkAsReceived, onRemoveApplication }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative">
      <button 
        onClick={() => setShowMenu(!showMenu)}
        className="px-4 py-3 bg-gradient-to-r from-purple-100 to-pink-100 text-slate-700 rounded-lg text-sm font-medium hover:from-purple-200 hover:to-pink-200 transition-all border border-slate-300 flex items-center gap-2 shadow-sm"
      >
        Actions
        <MoreHorizontal size={16} />
      </button>
      
      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowMenu(false)}
          ></div>
          <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 min-w-48">
            <button className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 text-slate-700 flex items-center gap-2">
              <CheckSquare size={14} />
              Update Status
            </button>
            <button className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 text-slate-700 flex items-center gap-2">
              <Bell size={14} />
              Set Reminder
            </button>
            <button 
              onClick={() => {
                onMarkAsReceived(application.id);
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-green-50 text-green-700 flex items-center gap-2"
            >
              <Trophy size={14} />
              Mark as Received
            </button>
            <div className="border-t border-slate-200"></div>
            <button 
              onClick={() => {
                onRemoveApplication(application.id);
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
            >
              <X size={14} />
              Withdraw Application
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ActionMenu;