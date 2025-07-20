// src/components/auth/steps/OrganizationTypeStep.jsx - Clean Version
import React from 'react';
import { User, Building2, Heart, Sparkles, CheckCircle } from 'lucide-react';

const ORGANIZATION_TYPES = [
  {
    id: 'nonprofit',
    name: 'Nonprofit',
    description: 'Tax-exempt organizations serving public good',
    icon: Heart,
    color: 'bg-rose-50 border-rose-200 text-rose-700'
  },
  {
    id: 'government', 
    name: 'Government',
    description: 'Public sector agencies and departments',
    icon: Building2,
    color: 'bg-blue-50 border-blue-200 text-blue-700'
  },
  {
    id: 'foundation',
    name: 'Foundation',
    description: 'Philanthropic grant-making organizations',
    icon: Sparkles,
    color: 'bg-purple-50 border-purple-200 text-purple-700'
  },
  {
    id: 'for-profit',
    name: 'For-Profit',
    description: 'Companies with social impact missions',
    icon: Building2,
    color: 'bg-green-50 border-green-200 text-green-700'
  },
  {
    id: 'community-member',
    name: 'Community Member',
    description: 'Individual advocates and volunteers',
    icon: User,
    color: 'bg-amber-50 border-amber-200 text-amber-700'
  }
];

export default function OrganizationTypeStep({ formData, updateFormData }) {
  
  const handleOrganizationTypeSelect = (typeId) => {
    updateFormData('organizationType', typeId);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Who are you? 🎯</h1>
        <p className="text-slate-600">Help us tailor your experience</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ORGANIZATION_TYPES.map((type) => {
          const IconComponent = type.icon;
          const isSelected = formData.organizationType === type.id;
          
          return (
            <button
              key={type.id}
              onClick={() => handleOrganizationTypeSelect(type.id)}
              className={`p-6 rounded-lg border-2 transition-all text-left relative hover:shadow-md ${
                isSelected
                  ? `${type.color} border-opacity-100 shadow-md`
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start space-x-3">
                <IconComponent className={`w-6 h-6 mt-1 ${isSelected ? '' : 'text-slate-600'}`} />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{type.name}</h3>
                  <p className="text-sm opacity-75 mt-1">{type.description}</p>
                </div>
              </div>
              {isSelected && (
                <CheckCircle className="w-5 h-5 text-green-600 absolute top-3 right-3" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}