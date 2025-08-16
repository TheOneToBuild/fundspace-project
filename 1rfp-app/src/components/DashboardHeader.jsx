// src/components/DashboardHeader.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, PlusCircle, Bell, User, ChevronDown } from 'lucide-react';
import GlobalSearch from './GlobalSearch.jsx';
import headerLogoImage from '../assets/1rfp-logo.png';

export default function DashboardHeader({ profile }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const mobileMenuRef = useRef(null);

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    // Close mobile menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
                closeMobileMenu();
            }
        };

        if (isMobileMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMobileMenuOpen]);

    return (
        <>
            <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-slate-200">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    {/* Left side - Logo */}
                    <div className="flex items-center">
                        <Link to="/profile" aria-label="1RFP Home">
                            <img src={headerLogoImage} alt="1RFP Logo" className="h-10 sm:h-12 w-auto" />
                        </Link>
                    </div>

                    {/* Center - Extended Search Bar */}
                    <div className="flex-1 max-w-5xl mx-8 hidden md:block">
                        <div className="flex justify-center">
                            <div className="w-full max-w-4xl">
                                <GlobalSearch />
                            </div>
                        </div>
                    </div>

                    {/* Right side - Actions and Profile */}
                    <div className="flex items-center space-x-2 md:space-x-4">
                        {/* Submit Grant Button */}
                        <Link 
                            to="/submit-grant" 
                            className="inline-flex items-center justify-center px-3 md:px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                        >
                            <PlusCircle size={16} className="mr-1 md:mr-2" />
                            <span className="hidden sm:inline">Submit Grant</span>
                            <span className="sm:hidden">Submit</span>
                        </Link>

                        {/* Notifications */}
                        <Link 
                            to="/profile/notifications"
                            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors relative"
                            aria-label="Notifications"
                        >
                            <Bell size={20} />
                            {/* You can add notification badge here if needed */}
                        </Link>

                        {/* Profile Dropdown */}
                        <Link 
                            to="/profile/settings"
                            className="flex items-center space-x-2 p-1 hover:bg-slate-100 rounded-lg transition-colors"
                            aria-label="Profile Settings"
                        >
                            {profile?.avatar_url ? (
                                <img 
                                    src={profile.avatar_url} 
                                    alt={profile.display_name || 'Profile'} 
                                    className="w-8 h-8 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center">
                                    <User size={16} className="text-slate-600" />
                                </div>
                            )}
                            <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
                        </Link>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={toggleMobileMenu}
                            className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            aria-label="Toggle mobile menu"
                        >
                            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Search Bar - Always visible on mobile */}
                <div className="md:hidden border-t border-slate-200 p-4">
                    <GlobalSearch />
                </div>
            </header>

            {/* Mobile Menu Overlay - Simple menu for mobile actions */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-40 md:hidden">
                    {/* Backdrop */}
                    <div className="fixed inset-0 bg-black bg-opacity-25" onClick={closeMobileMenu}></div>
                    
                    {/* Menu Panel */}
                    <div 
                        ref={mobileMenuRef}
                        className="fixed top-0 right-0 bottom-0 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <span className="text-lg font-semibold text-slate-900">Quick Actions</span>
                            <button
                                onClick={closeMobileMenu}
                                className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Mobile Menu Actions */}
                        <div className="p-4 space-y-3">
                            <Link 
                                to="/submit-grant"
                                onClick={closeMobileMenu}
                                className="flex items-center justify-center w-full px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                            >
                                <PlusCircle size={16} className="mr-2" />
                                Submit Grant
                            </Link>
                            
                            <Link 
                                to="/profile/notifications"
                                onClick={closeMobileMenu}
                                className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                            >
                                <Bell size={16} className="mr-2" />
                                Notifications
                            </Link>
                            
                            <Link 
                                to="/profile/settings"
                                onClick={closeMobileMenu}
                                className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                            >
                                <User size={16} className="mr-2" />
                                Profile Settings
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}