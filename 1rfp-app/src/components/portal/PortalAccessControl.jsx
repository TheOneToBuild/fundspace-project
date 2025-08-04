// src/components/portal/PortalAccessControl.jsx
import React from 'react';
import { Heart } from '../Icons.jsx';

const LoadingState = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <Heart className="w-8 h-8 text-blue-500 animate-pulse mx-auto mb-4" />
      <p className="text-slate-700 font-medium">Loading grants portal...</p>
    </div>
  </div>
);

const AccessDeniedState = () => (
  <div className="min-h-screen flex items-center justify-center p-4">
    <div className="bg-white rounded-3xl shadow-xl p-8 text-center max-w-md border border-slate-200">
      <Heart className="w-8 h-8 text-blue-500 mx-auto mb-4" />
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Access Required</h1>
      <p className="text-slate-600">You need admin privileges to access the Grants Portal.</p>
    </div>
  </div>
);

const PortalAccessControl = ({ checkingAccess, hasAccess, children }) => {
  if (checkingAccess) {
    return <LoadingState />;
  }

  if (!hasAccess) {
    return <AccessDeniedState />;
  }

  return children;
};

export default PortalAccessControl;