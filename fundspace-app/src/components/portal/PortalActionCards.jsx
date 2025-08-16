// src/components/portal/PortalActionCards.jsx
import React from 'react';
import { Search, DollarSign, Plus, Heart, Users, Building2 } from '../Icons.jsx';

const ActionCard = ({ isActive, onClick, gradient, icon: Icon, title, description, activeColor }) => (
  <div 
    className={`group relative overflow-hidden rounded-3xl cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl ${
      isActive ? `ring-2 ring-${activeColor}` : ''
    }`}
    onClick={onClick}
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`}></div>
    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/40 to-transparent rounded-full transform translate-x-6 -translate-y-6"></div>
    <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-white/30 to-transparent rounded-full transform -translate-x-4 translate-y-4"></div>
    <div className="relative p-6">
      <div className="w-12 h-12 bg-white/50 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-6 h-6 text-slate-700" />
      </div>
      <h3 className="font-bold text-slate-800 text-sm mb-1">{title}</h3>
      <p className="text-slate-600/80 text-xs leading-relaxed">{description}</p>
    </div>
  </div>
);

const PortalActionCards = ({ activeTab, setActiveTab, userMembership }) => {
  if (!userMembership?.organizations) return null;

  const cards = [
    {
      id: 'explore',
      title: 'Explore Funds',
      description: 'Discover opportunities',
      icon: Search,
      gradient: 'from-blue-100 via-blue-50 to-indigo-100',
      activeColor: 'blue-500'
    },
    {
      id: 'track',
      title: 'Track Funds',
      description: 'Monitor progress',
      icon: DollarSign,
      gradient: 'from-green-100 via-green-50 to-emerald-100',
      activeColor: 'green-500'
    },
    {
      id: 'create',
      title: 'Create Funds',
      description: 'Launch programs',
      icon: Plus,
      gradient: 'from-purple-100 via-purple-50 to-pink-100',
      activeColor: 'purple-500'
    },
    {
      id: 'request',
      title: 'Request Funds',
      description: 'Apply for support',
      icon: Heart,
      gradient: 'from-teal-100 via-teal-50 to-cyan-100',
      activeColor: 'teal-500'
    },
    {
      id: 'communities',
      title: 'Communities',
      description: 'Connect & engage',
      icon: Users,
      gradient: 'from-orange-100 via-orange-50 to-amber-100',
      activeColor: 'orange-500'
    },
    {
      id: 'organizations',
      title: 'Organizations',
      description: 'Partner network',
      icon: Building2,
      gradient: 'from-rose-100 via-rose-50 to-pink-100',
      activeColor: 'rose-500'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
      {cards.map((card) => (
        <ActionCard
          key={card.id}
          isActive={activeTab === card.id}
          onClick={() => setActiveTab(card.id)}
          gradient={card.gradient}
          icon={card.icon}
          title={card.title}
          description={card.description}
          activeColor={card.activeColor}
        />
      ))}
    </div>
  );
};

export default PortalActionCards;