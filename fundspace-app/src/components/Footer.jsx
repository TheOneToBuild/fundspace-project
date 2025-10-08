// src/components/Footer.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Facebook, Twitter, Linkedin, Instagram, Youtube } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { getProfileById } from '../utils/profileHelpers.js';
import footerLogoImage from '../assets/fundspace-logo.png';

export default function Footer() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);

  // Fetch session/profile on mount
  useEffect(() => {
    const fetchProfileForSession = async (currentSession) => {
      setSession(currentSession);
      if (currentSession?.user) {
        const profileData = await getProfileById(currentSession.user.id);
        setProfile(profileData);
      } else {
        setProfile(null);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchProfileForSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      fetchProfileForSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmitGrantClick = async (e) => {
    e.preventDefault();
    
    if (!session || !profile) {
      window.location.href = '/login';
      return;
    }
    
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    navigate('/submit-grant');
    setIsSubmitting(false);
  };

  const productLinks = [
    { to: "/how-it-works", text: "How Fundspace Works" },
    { to: "/for-seekers", text: "For Fund Seekers" },
    { to: "/for-funders", text: "For Fund Providers" },
    { to: "/submit-grant", text: "Submit a Grant", onClick: handleSubmitGrantClick },
  ];

  const companyLinks = [
    { to: "/about", text: "About Us" },
    { to: "/contact", text: "Contact Us" },
    { to: "/roadmap", text: "Platform Roadmap" },
    { to: "/faq", text: "FAQ" },
  ];

  const spotlightLinks = [
    { to: "/spotlight", text: "All Spotlights", comingSoon: true },
    { to: "/spotlight/san-francisco", text: "San Francisco County", comingSoon: true },
    { to: "/spotlight/alameda", text: "Alameda County", comingSoon: true },
    { to: "/spotlight/contra-costa", text: "Contra Costa County", comingSoon: true },
    { to: "/spotlight/marin", text: "Marin County", comingSoon: true },
    { to: "/spotlight/napa", text: "Napa County", comingSoon: true },
    { to: "/spotlight/san-mateo", text: "San Mateo County" },
    { to: "/spotlight/santa-clara", text: "Santa Clara County", comingSoon: true },
    { to: "/spotlight/solano", text: "Solano County", comingSoon: true },
    { to: "/spotlight/sonoma", text: "Sonoma County", comingSoon: true },
  ];

  return (
    <footer className="bg-transparent py-8 mt-32">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <img src={footerLogoImage} alt="Fundspace Logo" className="h-20 mb-6 w-auto" />
            <p className="text-slate-600">Democratizing access to funding for a brighter Bay Area.</p>
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 mb-3 tracking-wider uppercase">Product</h4>
            <ul className="space-y-2 text-base">
              {productLinks.map(link => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    className="text-slate-600 hover:text-blue-600 transition-colors"
                    onClick={link.onClick}
                  >
                    {link.text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 mb-3 tracking-wider uppercase">Spotlight</h4>
            <ul className="space-y-2 text-base">
              {spotlightLinks.map(link => (
                <li key={link.to} className="flex items-center gap-2">
                  <Link 
                    to={link.comingSoon ? "#" : link.to}
                    className={`transition-colors ${
                      link.comingSoon 
                        ? 'text-slate-400 cursor-not-allowed pointer-events-none' 
                        : 'text-slate-600 hover:text-rose-600'
                    }`}
                    onClick={(e) => {
                      if (link.comingSoon) {
                        e.preventDefault();
                      }
                    }}
                  >
                    {link.text}
                  </Link>
                  {link.comingSoon && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full border border-yellow-200">
                      SOON
                    </span>
                  )}
                  {!link.comingSoon && link.to === "/spotlight/san-mateo" && (
                    <span className="px-2 py-0.5 text-xs font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full">
                      LIVE
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
            <div>
            <h4 className="text-sm font-bold text-slate-800 mb-3 tracking-wider uppercase">Company</h4>
            <ul className="space-y-2 text-base">
              {companyLinks.map(link => (
                  <li key={link.to}><Link to={link.to} className="text-slate-600 hover:text-blue-600 transition-colors">{link.text}</Link></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-base text-slate-500 mb-4 sm:mb-0">&copy; {new Date().getFullYear()} Fundspace. All rights reserved.</p>
          <div className="flex space-x-4 text-slate-500">
            <a href="#" aria-label="Facebook" className="hover:text-blue-600 transition-colors"><Facebook size={18} /></a>
            <a href="#" aria-label="Twitter" className="hover:text-blue-600 transition-colors"><Twitter size={18} /></a>
            <a href="#" aria-label="LinkedIn" className="hover:text-blue-600 transition-colors"><Linkedin size={18} /></a>
            <a href="#" aria-label="Instagram" className="hover:text-blue-600 transition-colors"><Instagram size={18} /></a>
            <a href="#" aria-label="YouTube" className="hover:text-blue-600 transition-colors"><Youtube size={18} /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}