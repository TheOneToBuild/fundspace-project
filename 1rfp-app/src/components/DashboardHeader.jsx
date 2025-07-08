// src/components/DashboardHeader.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import NotificationsPanel from './NotificationsPanel';
import UserMenu from './UserMenu.jsx';
import headerLogoImage from '../assets/1rfp-logo.png';
import { Search, PlusCircle, Home, Building, FileText, ClipboardList, Bell, Menu, X } from './Icons';

const HeaderNavLink = ({ to, children, Icon, mobile = false, onClick }) => {
    const navLinkClass = ({ isActive }) => mobile 
        ? `flex items-center space-x-3 w-full px-4 py-3 text-left transition-colors duration-200 ${
            isActive 
                ? 'text-blue-600 bg-blue-50 border-r-2 border-blue-600' 
                : 'text-slate-700 hover:text-blue-600 hover:bg-slate-50'
        }`
        : `flex flex-col items-center space-y-1 w-24 h-full justify-center transition-colors duration-200 border-b-2 ${
            isActive
                ? 'text-blue-600 border-blue-600'
                : 'text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-100'
        }`;
    
    return (
        <NavLink to={to} end className={navLinkClass} onClick={onClick}>
            <Icon className={mobile ? "h-5 w-5" : "h-6 w-6"} />
            <span className={mobile ? "font-medium" : "text-xs font-medium"}>{children}</span>
        </NavLink>
    );
};

export default function DashboardHeader({ profile, notifications, unreadCount, onPanelToggle }) {
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const panelRef = useRef(null);
    const mobileMenuRef = useRef(null);

    const handlePanelToggle = () => {
        if (!isPanelOpen && unreadCount > 0) {
            onPanelToggle();
        }
        setIsPanelOpen(!isPanelOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };
    
    useEffect(() => {
        function handleClickOutside(event) {
            if (panelRef.current && !panelRef.current.contains(event.target)) {
                setIsPanelOpen(false);
            }
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
                setIsMobileMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isMobileMenuOpen]);

    return (
        <>
            <header className="bg-white/90 backdrop-blur-lg sticky top-0 z-40 border-b border-slate-200">
                <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Left side - Logo and Desktop Search */}
                        <div className="flex items-center space-x-3 sm:space-x-6 flex-1">
                            <Link to="/profile" aria-label="1RFP Home">
                                <img src={headerLogoImage} alt="1RFP Logo" className="h-10 sm:h-12 w-auto" />
                            </Link>
                            
                            {/* Desktop Search */}
                            <div className="relative hidden lg:block">
                                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search grants, funders..." 
                                    className="pl-10 pr-4 py-2 w-64 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-colors"
                                    onFocus={() => setIsSearchFocused(true)}
                                    onBlur={() => setIsSearchFocused(false)}
                                />
                            </div>
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center justify-center h-full">
                            <HeaderNavLink to="/profile" Icon={Home}>Home</HeaderNavLink>
                            <HeaderNavLink to="/profile/grants" Icon={ClipboardList}>Grants</HeaderNavLink>
                            <HeaderNavLink to="/profile/funders" Icon={Building}>Funders</HeaderNavLink>
                            <HeaderNavLink to="/profile/nonprofits" Icon={FileText}>Nonprofits</HeaderNavLink>
                        </nav>

                        {/* Right side - Actions and Profile */}
                        <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4 flex-1 justify-end">
                            {/* Mobile Search Button */}
                            <button className="lg:hidden p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors">
                                <Search size={20} />
                            </button>

                            {/* Submit Grant Button - Hidden on smallest screens */}
                            <Link 
                                to="/submit-grant" 
                                className="hidden sm:inline-flex items-center justify-center px-3 md:px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
                            >
                                <PlusCircle size={16} className="mr-1 md:mr-2" />
                                <span className="hidden md:inline">Submit Grant</span>
                                <span className="md:hidden">Submit</span>
                            </Link>

                            {/* Notifications */}
                            <div className="relative" ref={panelRef}>
                                <button 
                                    onClick={handlePanelToggle} 
                                    className="p-2 sm:p-2.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                                >
                                    <Bell size={20} />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
                                    )}
                                </button>
                                {isPanelOpen && <NotificationsPanel notifications={notifications} onClose={() => setIsPanelOpen(false)} />}
                            </div>
                            
                            {/* User Menu */}
                            <UserMenu profile={profile} />

                            {/* Mobile Menu Button */}
                            <button 
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="md:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100 transition-colors"
                                aria-label="Open menu"
                            >
                                <Menu size={22} />
                            </button>
                        </div>
                    </div>

                    {/* Mobile Search Bar - Shows below header on mobile when needed */}
                    <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3">
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search grants, funders..." 
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-colors"
                            />
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden"
                    onClick={closeMobileMenu}
                >
                    <div 
                        ref={mobileMenuRef}
                        className="fixed inset-y-0 right-0 w-80 max-w-sm bg-white shadow-xl transform transition-transform duration-300 ease-in-out"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Mobile Menu Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <img src={headerLogoImage} alt="1RFP Logo" className="h-8 w-auto" />
                            <button 
                                onClick={closeMobileMenu}
                                className="p-2 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                                aria-label="Close menu"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Mobile Navigation Links */}
                        <nav className="py-4">
                            <HeaderNavLink to="/profile" Icon={Home} mobile onClick={closeMobileMenu}>
                                Dashboard Home
                            </HeaderNavLink>
                            <HeaderNavLink to="/profile/grants" Icon={ClipboardList} mobile onClick={closeMobileMenu}>
                                My Grants
                            </HeaderNavLink>
                            <HeaderNavLink to="/profile/funders" Icon={Building} mobile onClick={closeMobileMenu}>
                                Explore Funders
                            </HeaderNavLink>
                            <HeaderNavLink to="/profile/nonprofits" Icon={FileText} mobile onClick={closeMobileMenu}>
                                Explore Nonprofits
                            </HeaderNavLink>
                        </nav>

                        {/* Mobile Menu Actions */}
                        <div className="border-t border-slate-200 p-4 space-y-3">
                            <Link 
                                to="/submit-grant"
                                onClick={closeMobileMenu}
                                className="flex items-center justify-center w-full px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                            >
                                <PlusCircle size={16} className="mr-2" />
                                Submit Grant
                            </Link>
                            
                            {/* User Profile Link for Mobile */}
                            <Link 
                                to="/profile/settings"
                                onClick={closeMobileMenu}
                                className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                            >
                                Profile Settings
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}