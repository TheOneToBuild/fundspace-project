import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, PlusCircle, ChevronDown } from './Icons.jsx';
import AuthButton from './AuthButton.jsx';
import headerLogoImage from '../assets/fundspace-logo2.png';

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
    const [isScrolled, setIsScrolled] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);
    const dropdownTimeoutRef = useRef(null);
    const mobileMenuRef = useRef(null); // Add this line in the component
    const location = useLocation();
    
    const showNotificationBar = location.pathname === '/';

    const mainNavLinks = [
        { 
            to: "/grants", 
            text: "Explore", 
            active: "text-blue-600 font-semibold",
            dropdown: {
                sections: [
                    {
                        title: "Find Opportunities",
                        links: [
                            { to: "/grants", text: "Find Funding" },
                            { to: "/organizations", text: "Explore Organizations" },
                            { to: "/submit-grant", text: "Submit Grant" }
                        ]
                    }
                ],
                image: "https://i.imgur.com/X5UvEv6.png"
            }
        },
        { 
            to: "/spotlight", 
            text: "Spotlight", 
            active: "text-rose-600 font-semibold",
            dropdown: {
                sections: [
                    {
                        title: "Bay Area Counties",
                        links: [
                            { to: "/spotlight/san-francisco", text: "San Francisco County" },
                            { to: "/spotlight/alameda", text: "Alameda County" },
                            { to: "/spotlight/santa-clara", text: "Santa Clara County" },
                            { to: "/spotlight/contra-costa", text: "Contra Costa County" },
                            { to: "/spotlight/marin", text: "Marin County" },
                            { to: "/spotlight/san-mateo", text: "San Mateo County" },
                            { to: "/spotlight/solano", text: "Solano County" },
                            { to: "/spotlight/sonoma", text: "Sonoma County" },
                            { to: "/spotlight/napa", text: "Napa County" }
                        ]
                    },
                    {
                        title: "Peninsula",
                        links: [
                            { to: "/spotlight/san-mateo/palo-alto", text: "Palo Alto" },
                            { to: "/spotlight/san-mateo/redwood-city", text: "Redwood City" },
                            { to: "/spotlight/san-mateo/menlo-park", text: "Menlo Park" },
                            { to: "/spotlight/san-mateo/mountain-view", text: "Mountain View" }
                        ]
                    },
                    {
                        title: "South Bay",
                        links: [
                            { to: "/spotlight/santa-clara/san-jose", text: "San Jose" },
                            { to: "/spotlight/santa-clara/sunnyvale", text: "Sunnyvale" },
                            { to: "/spotlight/santa-clara/santa-clara", text: "Santa Clara" },
                            { to: "/spotlight/santa-clara/cupertino", text: "Cupertino" }
                        ]
                    },
                    {
                        title: "East Bay",
                        links: [
                            { to: "/spotlight/alameda/oakland", text: "Oakland" },
                            { to: "/spotlight/alameda/berkeley", text: "Berkeley" },
                            { to: "/spotlight/alameda/fremont", text: "Fremont" },
                            { to: "/spotlight/contra-costa/concord", text: "Concord" }
                        ]
                    },
                    {
                        title: "North Bay",
                        links: [
                            { to: "/spotlight/marin/san-rafael", text: "San Rafael" },
                            { to: "/spotlight/sonoma/santa-rosa", text: "Santa Rosa" },
                            { to: "/spotlight/napa/napa", text: "Napa" },
                            { to: "/spotlight/solano/vallejo", text: "Vallejo" }
                        ]
                    },
                    {
                        title: "Community",
                        links: [
                            { to: "/spotlight", text: "All Spotlights" },
                            { to: "/spotlight/submit", text: "Submit Story" },
                            { to: "/spotlight/featured", text: "Featured Stories" }
                        ]
                    }
                ],
                image: "https://i.imgur.com/4pVbT87.png"
            }
        },
        { 
            to: "/about", 
            text: "About", 
            active: "text-blue-600 font-semibold",
            dropdown: {
                sections: [
                    {
                        title: "Company",
                        links: [
                            { to: "/about", text: "About Us" },
                            { to: "/contact", text: "Contact" },
                            { to: "/how-it-works", text: "How It Works" },
                            { to: "/roadmap", text: "Roadmap" }
                        ]
                    },
                    {
                        title: "Resources",
                        links: [
                            { to: "/for-seekers", text: "For Seekers" },
                            { to: "/for-funders", text: "For Funders" },
                            { to: "/faq", text: "FAQ" }
                        ]
                    }
                ],
                image: "https://i.imgur.com/RLlEUMG.png"
            }
        }
    ];

    const handleMouseEnter = (index) => {
        if (dropdownTimeoutRef.current) {
            clearTimeout(dropdownTimeoutRef.current);
        }
        setActiveDropdown(index);
    };

    const handleMouseLeave = () => {
        dropdownTimeoutRef.current = setTimeout(() => {
            setActiveDropdown(null);
        }, 300); // 300ms delay to allow cursor to move to the dropdown
    };

    const toggleDropdown = (index, event) => {
        event.stopPropagation();
        if (dropdownTimeoutRef.current) {
            clearTimeout(dropdownTimeoutRef.current);
        }
        setActiveDropdown(activeDropdown === index ? null : index);
    };

    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 0);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        function handleClickOutside(event) {
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
                setIsMobileMenuOpen(false);
            }
            
            // Close dropdown when clicking anywhere outside
            const dropdownContainer = document.querySelector('[data-dropdown-container]');
            const navContainer = document.querySelector('[data-nav-container]');
            
            if ((!dropdownContainer || !dropdownContainer.contains(event.target)) && 
                (!navContainer || !navContainer.contains(event.target))) {
                setActiveDropdown(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        document.body.style.overflow = isMobileMenuOpen ? 'hidden' : 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [isMobileMenuOpen]);

    return (
        <>
            {showNotificationBar && (
                <div className={`bg-gradient-to-r from-purple-200/50 via-pink-200/40 to-blue-200/50 text-slate-700 py-4 px-6 text-center text-base font-medium fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
                    isScrolled ? 'transform -translate-y-full' : 'transform translate-y-0'
                }`}>
                    <span>🚀 Alpha Testing Open — </span>
                    <Link 
                        to="/login?view=signup" 
                        className="underline hover:no-underline font-semibold text-slate-800"
                    >
                        Register for early access
                    </Link>
                </div>
            )}

            <div className={`transition-all duration-300 ${
                showNotificationBar 
                    ? (isScrolled ? 'h-[73px]' : 'h-[137px]')
                    : 'h-[73px]'
            }`}></div>

            <div className="relative">
                <header className={`bg-white/90 backdrop-blur-lg fixed left-0 right-0 z-40 transition-all duration-300 ${
                    showNotificationBar && !isScrolled 
                        ? 'top-16 border-b border-transparent'
                        : 'top-0 border-b border-slate-200 shadow-sm'
                }`}>
                    <div className="w-full max-w-none px-6 lg:px-12 xl:px-16 py-4 flex justify-between items-center">
                        <div className="flex items-center space-x-8 lg:space-x-12">
                            <Link to="/" aria-label="Fundspace Home">
                                <img src={headerLogoImage} alt="Fundspace Logo" className="h-10 sm:h-12 md:h-14 w-auto" />
                            </Link>
                            
                            <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8 relative" data-nav-container>
                                {mainNavLinks.map((link, index) => (
                                    <div 
                                        key={link.to}
                                        className="relative"
                                        onMouseEnter={() => handleMouseEnter(index)}
                                        onMouseLeave={handleMouseLeave}
                                    >
                                        <div className="flex items-center">
                                            <NavLink 
                                                to={link.to} 
                                                className={({ isActive }) => `text-base font-medium transition-colors ${isActive ? link.active : 'text-slate-700 hover:text-blue-600'}`}
                                            >
                                                {link.text}
                                            </NavLink>
                                            <button
                                                onClick={(e) => toggleDropdown(index, e)}
                                                className="ml-2 p-1 text-slate-400 hover:text-slate-700 transition-colors rounded"
                                                aria-label="Toggle dropdown"
                                            >
                                                <ChevronDown 
                                                    size={18} 
                                                    className={`transition-transform duration-200 ${
                                                        activeDropdown === index ? 'rotate-180' : 'rotate-0'
                                                    }`} 
                                                />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </nav>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="hidden lg:block">
                                <AuthButton />
                            </div>
                            <Link 
                                to="/submit-grant" 
                                className="hidden lg:inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-semibold rounded-full text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
                            >
                                <PlusCircle size={16} className="mr-2" />
                                Submit Grant
                            </Link>
                            <button 
                                onClick={() => setIsMobileMenuOpen(true)} 
                                aria-label="Open menu" 
                                className="lg:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                <Menu size={24} />
                            </button>
                        </div>
                    </div>
                </header>

                {activeDropdown !== null && mainNavLinks[activeDropdown]?.dropdown && (
                    <div 
                        className="fixed left-0 w-full bg-white border-b border-slate-200 shadow-lg z-[9999] animate-fadeInDown"
                        data-dropdown-container
    onMouseEnter={() => handleMouseEnter(activeDropdown)}
    onMouseLeave={handleMouseLeave}
    style={{
        borderRadius: '0 0 16px 16px',
        top: showNotificationBar 
            ? (isScrolled ? '73px' : '137px')
            : '73px'
    }}
                    >
                        <div className="w-full px-6 lg:px-12 xl:px-16 py-8">
                            <div className="flex">
                                <div className="flex gap-16" style={{ marginLeft: '48px' }}>
                                    {mainNavLinks[activeDropdown].dropdown.sections.map((section, sectionIndex) => (
                                        <div key={sectionIndex} className="min-w-0">
                                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
                                                {section.title}
                                            </h3>
                                            <ul className="space-y-3">
                                                {section.links.map((dropdownLink, linkIndex) => (
                                                    <li key={linkIndex}>
                                                        <Link 
                                                            to={dropdownLink.to} 
                                                            className="text-slate-600 hover:text-blue-600 transition-colors block py-1 text-base leading-snug whitespace-nowrap"
                                                            onClick={() => setActiveDropdown(null)}
                                                        >
                                                            {dropdownLink.text}
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="w-80 h-60 rounded-xl overflow-hidden bg-slate-100 shadow-lg ml-auto flex-shrink-0">
                                    <img 
                                        src={mainNavLinks[activeDropdown].dropdown.image} 
                                        alt={mainNavLinks[activeDropdown].text}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                        </div>

                       
                    </div>
                )}
            </div>

            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
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
                                    activeClassName={link.active}
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