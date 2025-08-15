// src/components/PublicHeader.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, PlusCircle } from './Icons.jsx';
import AuthButton from './AuthButton.jsx';
import headerLogoImage from '../assets/1rfp-logo.png';

const PublicNavLink = ({ to, children, activeClassName, mobile = false, onClick }) => {
    const linkClass = ({ isActive }) => mobile
        ? `block w-full text-left px-4 py-3 transition-colors ${
            isActive 
                ? `${activeClassName} bg-blue-50 border-r-2 border-blue-600` 
                : 'text-slate-700 hover:text-blue-600 hover:bg-slate-50'
        }`
        : `text-sm md:text-base font-medium transition-colors ${
            isActive ? activeClassName : 'text-slate-700 hover:text-blue-600'
        }`;

    return (
        <NavLink to={to} className={linkClass} onClick={onClick}>
            {children}
        </NavLink>
    );
};

export default function PublicHeader() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const mobileMenuRef = useRef(null);

    const mainNavLinks = [
        { to: "/grants", text: "Find Grants", activeClassName: "text-blue-600 font-semibold" },
        { to: "/organizations", text: "Explore Organizations", activeClassName: "text-blue-600 font-semibold" },
        { to: "/spotlight", text: "Spotlight", activeClassName: "text-rose-600 font-semibold" },
    ];

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    // Handle clicks outside mobile menu
    useEffect(() => {
        function handleClickOutside(event) {
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
            <header className="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-40 border-b border-slate-200">
                <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 flex justify-between items-center">
                    <Link to="/" aria-label="1RFP Home">
                        <img src={headerLogoImage} alt="1RFP Logo" className="h-10 sm:h-12 md:h-14 w-auto" />
                    </Link>
                    <nav className="hidden md:flex items-center space-x-4 lg:space-x-6">
                        {mainNavLinks.map(({ to, text, activeClassName }) => (
                            <PublicNavLink key={to} to={to} activeClassName={activeClassName}>
                                {text}
                            </PublicNavLink>
                        ))}
                    </nav>
                    <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
                        <AuthButton />
                        <Link 
                            to="/submit-grant" 
                            className="inline-flex items-center justify-center px-3 lg:px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 ease-in-out shadow-sm"
                        >
                            <PlusCircle size={16} className="mr-1 lg:mr-2" />
                            <span className="hidden lg:inline">Submit Grant</span>
                            <span className="lg:hidden">Submit</span>
                        </Link>
                    </div>
                    <div className="md:hidden">
                        <button 
                            onClick={() => setIsMobileMenuOpen(true)} 
                            aria-label="Open menu" 
                            className="p-2 rounded-md text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            <Menu size={24} />
                        </button>
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
                                className="p-2 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                                aria-label="Close menu"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Mobile Navigation Links */}
                        <nav className="py-4">
                            {mainNavLinks.map(({ to, text, activeClassName }) => (
                                <PublicNavLink 
                                    key={to} 
                                    to={to} 
                                    activeClassName={activeClassName}
                                    mobile 
                                    onClick={closeMobileMenu}
                                >
                                    {text}
                                </PublicNavLink>
                            ))}
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
                            <div className="w-full">
                                <AuthButton mobile onClose={closeMobileMenu} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}