// src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import footerLogoImage from '../assets/1rfp-footer-logo.png';
import { Facebook, Twitter, Linkedin, Youtube, Instagram } from './Icons.jsx';

// MODIFIED: Removed the "bgColor" prop.
export default function Footer() {
  const productLinks = [
    { to: "/how-it-works", text: "How 1RFP Works" },
    { to: "/for-nonprofits", text: "For Nonprofits" },
    { to: "/for-funders", text: "For Funders" },
    { to: "/submit-grant", text: "Submit a Grant" },
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
    // MODIFIED: Changed the background to be permanently transparent.
    <footer className="py-12 bg-transparent">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <img src={footerLogoImage} alt="1RFP Logo" className="h-14 mb-4 w-auto" />
            <p className="text-slate-600">Streamlining grant discovery for a better Bay Area.</p>
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 mb-3 tracking-wider uppercase">Product</h4>
            <ul className="space-y-2 text-base">
              {productLinks.map(link => (
                  <li key={link.to}><Link to={link.to} className="text-slate-600 hover:text-blue-600 transition-colors">{link.text}</Link></li>
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
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-base text-slate-500 mb-4 sm:mb-0">&copy; {new Date().getFullYear()} 1RFP. All rights reserved.</p>
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