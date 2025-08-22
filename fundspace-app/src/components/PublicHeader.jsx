// src/components/PublicHeader.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, PlusCircle } from './Icons.jsx';
import AuthButton from './AuthButton.jsx';
import headerLogoImage from '../assets/fundspace-logo.png';

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
        { to: "/grants", text: "Find Funding", activeClassName: "text-blue-600 font-semibold" },
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
    }, []);

    return (
        <>
            <header className="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-40 border-b border-slate-200">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
                    <Link to="/" aria-label="Fundspace Home">
                        <img src={headerLogoImage} alt="Fundspace Logo" className="h-12 md:h-14 w-auto" />
                    </Link>
                    
                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-4 md:space-x-6">
                        {mainNavLinks.map((link) => (
                            <PublicNavLink 
                                key={link.to} 
                                to={link.to} 
                                activeClassName={link.activeClassName}
                            >
                                {link.text}
                            </PublicNavLink>
                        ))}
                    </nav>

                    {/* Desktop Auth & Submit Grant Button */}
                    <div className="hidden md:flex items-center space-x-3">
                        <AuthButton />
                        <Link 
                            to="/submit-grant" 
                            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200 shadow-sm hover:shadow-md"
                        >
                            <PlusCircle className="w-4 h-4 mr-2" />
                            Submit Grant
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        aria-expanded={isMobileMenuOpen}
                        aria-label="Toggle mobile menu"
                    >
                        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="fixed inset-0 bg-black bg-opacity-25" onClick={closeMobileMenu}></div>
                    <div 
                        ref={mobileMenuRef}
                        className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white shadow-xl"
                    >
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <span className="text-lg font-semibold text-slate-900">Menu</span>
                            <button
                                onClick={closeMobileMenu}
                                className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                aria-label="Close mobile menu"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        
                        <nav className="px-2 py-4 space-y-1">
                            {mainNavLinks.map((link) => (
                                <PublicNavLink 
                                    key={link.to} 
                                    to={link.to} 
                                    activeClassName={link.activeClassName}
                                    mobile={true}
                                    onClick={closeMobileMenu}
                                >
                                    {link.text}
                                </PublicNavLink>
                            ))}
                        </nav>

                        <div className="border-t border-slate-200 p-4 space-y-3">
                            <div className="flex flex-col space-y-3">
                                <AuthButton mobile />
                                <Link 
                                    to="/submit-grant" 
                                    onClick={closeMobileMenu}
                                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
                                >
                                    <PlusCircle className="w-4 h-4 mr-2" />
                                    Submit Grant
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}