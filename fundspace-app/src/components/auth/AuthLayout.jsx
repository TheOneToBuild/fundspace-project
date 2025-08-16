// src/components/auth/AuthLayout.jsx - Live Version
import React from 'react';
import PublicHeader from '../PublicHeader';
import Footer from '../Footer';
import headerLogoImage from '../../assets/fundspace-logo2.png';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <PublicHeader />
      
      {/* Main content area with generous spacing and fixed height to prevent footer jumping */}
      <div className="flex-1 flex flex-col justify-center p-4 pt-20 pb-96 min-h-[700px]">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden mx-auto">
          <div className="p-12 min-h-[500px] flex flex-col">
            {/* Logo positioned with more space */}
            <div className="text-center mb-12">
              <div className="flex justify-center">
                <img 
                  src={headerLogoImage} 
                  alt="Fundspace Logo" 
                  className="h-20 w-auto"
                />
              </div>
            </div>

            {/* Main content with flex-1 to center vertically */}
            <div className="flex-1 flex flex-col justify-center">
              {children}
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer with extra margin to ensure it stays at bottom */}
      <div className="mt-auto pt-8">
        <Footer />
      </div>
    </div>
  );
}