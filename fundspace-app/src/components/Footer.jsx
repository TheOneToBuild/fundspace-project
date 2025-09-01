// src/components/Footer.jsx - COMPLETE FILE WITH TRANSPARENT BACKGROUND
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import footerLogoImage from '../assets/fundspace-logo2.png';
import { Facebook, Twitter, Linkedin, Youtube, Instagram } from './Icons.jsx';

export default function Footer() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => setProfile(data));
      } else {
        setProfile(null);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', newSession.user.id)
          .single()
          .then(({ data }) => setProfile(data));
      } else {
        setProfile(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmitGrantClick = (e) => {
    if (!session || !profile) {
      e.preventDefault();
      window.location.href = '/login';
    }
  };

  const productLinks = [
    { to: "/how-it-works", text: "How Fundspace Works" },
    { to: "/for-seekers", text: "For Grant Seekers" },
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
    { to: "/spotlight", text: "All Spotlights" },
    { to: "/spotlight/san-francisco", text: "San Francisco" },
    { to: "/spotlight/alameda", text: "Alameda" },
    { to: "/spotlight/contra-costa", text: "Contra Costa" },
    { to: "/spotlight/marin", text: "Marin" },
    { to: "/spotlight/napa", text: "Napa" },
    { to: "/spotlight/san-mateo", text: "San Mateo" },
    { to: "/spotlight/santa-clara", text: "Santa Clara" },
    { to: "/spotlight/solano", text: "Solano" },
    { to: "/spotlight/sonoma", text: "Sonoma" },
  ];

  return (
    // ✅ UPDATED: Changed from bg-white to bg-transparent and removed border-t to eliminate separation line
    <footer className="bg-transparent py-8 mt-auto">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <img src={footerLogoImage} alt="Fundspace Logo" className="h-20 mb-6 w-auto" />
            <p className="text-slate-600">Democratizing access to funding for a better Bay Area.</p>
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
                  <li key={link.to}><Link to={link.to} className="text-slate-600 hover:text-rose-600 transition-colors">{link.text}</Link></li>
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
        <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center">
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