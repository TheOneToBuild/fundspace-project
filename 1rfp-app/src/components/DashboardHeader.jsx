// src/components/DashboardHeader.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import NotificationsPanel from './NotificationsPanel';
import UserMenu from './UserMenu.jsx'; // Import the reusable UserMenu component
import headerLogoImage from '../assets/1rfp-logo.png';
import { Search, PlusCircle, Home, Building, FileText, ClipboardList, Bell } from './Icons';

const HeaderNavLink = ({ to, children, Icon }) => {
    const navLinkClass = ({ isActive }) =>
        `flex flex-col items-center space-y-1 w-24 h-full justify-center transition-colors duration-200 border-b-2 ${
            isActive
                ? 'text-blue-600 border-blue-600'
                : 'text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-100'
        }`;
    
    return (<NavLink to={to} end className={navLinkClass}><Icon className="h-6 w-6" /><span className="text-xs font-medium">{children}</span></NavLink>);
};

export default function DashboardHeader({ profile, notifications, unreadCount, onPanelToggle }) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const panelRef = useRef(null);

  // Note: All logic for the user dropdown has been moved to UserMenu.jsx

  const handlePanelToggle = () => {
    if (!isPanelOpen && unreadCount > 0) {
        onPanelToggle();
    }
    setIsPanelOpen(!isPanelOpen);
  };
  
  useEffect(() => {
    function handleClickOutside(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsPanelOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [panelRef]);

  return (
    <header className="bg-white/90 backdrop-blur-lg sticky top-0 z-40 border-b border-slate-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-6 flex-1">
            <Link to="/profile" aria-label="1RFP Home"><img src={headerLogoImage} alt="1RFP Logo" className="h-12 w-auto" /></Link>
            <div className="relative hidden md:block">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search grants, funders..." className="pl-10 pr-4 py-2 w-64 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500"/>
            </div>
          </div>
          <nav className="hidden md:flex items-center justify-center h-full">
            <HeaderNavLink to="/profile" Icon={Home}>Home</HeaderNavLink>
            <HeaderNavLink to="/profile/grants" Icon={ClipboardList}>Grants</HeaderNavLink>
            <HeaderNavLink to="/profile/funders" Icon={Building}>Funders</HeaderNavLink>
            <HeaderNavLink to="/profile/nonprofits" Icon={FileText}>Nonprofits</HeaderNavLink>
          </nav>
          <div className="flex items-center space-x-2 sm:space-x-4 flex-1 justify-end">
            <Link to="/submit-grant" className="hidden sm:inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm">
              <PlusCircle size={16} className="mr-2" />
              Submit Grant
            </Link>
            <div className="relative" ref={panelRef}>
                <button onClick={handlePanelToggle} className="p-2.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors">
                    <Bell size={22} />
                    {unreadCount > 0 && (<span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>)}
                </button>
                {isPanelOpen && <NotificationsPanel notifications={notifications} onClose={() => setIsPanelOpen(false)} />}
            </div>
            
            {/* MODIFIED: Replaced all dropdown logic with the reusable UserMenu component */}
            <UserMenu profile={profile} />
          </div>
        </div>
      </div>
    </header>
  );
}