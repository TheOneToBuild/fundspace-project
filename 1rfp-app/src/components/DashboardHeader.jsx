// src/components/DashboardHeader.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import AuthButton from './AuthButton';
import headerLogoImage from '../assets/1rfp-logo.png';
import { Search, PlusCircle } from './Icons';

export default function DashboardHeader() {
  return (
    <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 border-b border-slate-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
        {/* Logo and Search */}
        <div className="flex items-center space-x-6">
          <Link to="/" aria-label="1RFP Home">
            <img src={headerLogoImage} alt="1RFP Logo" className="h-12 w-auto" />
          </Link>
          <div className="relative hidden md:block">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search grants, funders..." 
              className="pl-10 pr-4 py-2 w-64 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          <Link to="/submit-grant" className="hidden sm:inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm">
            <PlusCircle size={16} className="mr-2" />
            Submit Grant
          </Link>
          <AuthButton />
        </div>
      </div>
    </header>
  );
}