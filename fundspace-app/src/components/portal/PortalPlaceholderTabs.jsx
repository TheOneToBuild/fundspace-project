// src/components/portal/PortalPlaceholderTabs.jsx
import React from 'react';
import { Plus, Heart, Users, Building2 } from '../Icons.jsx';

const PlaceholderTab = ({ icon: Icon, title, description, actionButton, gradient }) => (
  <div className="text-center py-16">
    <div className="bg-white/80 backdrop-blur-sm p-12 rounded-3xl border border-white/60 shadow-xl max-w-md mx-auto">
      <div className={`w-20 h-20 bg-gradient-to-r ${gradient} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
        <Icon size={40} className="text-white" />
      </div>
      <h3 className="text-2xl font-bold text-slate-800 mb-3">{title}</h3>
      <p className="text-slate-600 mb-6">{description}</p>
      {actionButton || <div className="text-sm text-slate-500">Coming Soon</div>}
    </div>
  </div>
);

const CreateFundsTab = () => (
  <PlaceholderTab
    icon={Plus}
    title="Create Funds"
    description="Launch new funding programs and manage grant opportunities for your organization."
    gradient="from-purple-500 to-pink-600"
  />
);

const RequestFundsTab = () => (
  <PlaceholderTab
    icon={Heart}
    title="Request Funds"
    description="Apply for funding support and submit grant applications to support your mission."
    gradient="from-teal-500 to-cyan-600"
  />
);

const CommunitiesTab = () => (
  <PlaceholderTab
    icon={Users}
    title="Communities"
    description="Connect with other organizations and engage with your funding community."
    gradient="from-orange-500 to-amber-600"
  />
);

const OrganizationsTab = () => (
  <PlaceholderTab
    icon={Building2}
    title="Organizations"
    description="Explore your partner network and discover potential collaboration opportunities."
    gradient="from-rose-500 to-pink-600"
  />
);

export {
  CreateFundsTab,
  RequestFundsTab,
  CommunitiesTab,
  OrganizationsTab
};