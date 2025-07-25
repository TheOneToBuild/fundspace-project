// src/components/auth/steps/OrganizationTypeStep.jsx - Updated with All Organization Types
import React from 'react';
import { 
  User, 
  Building2, 
  Heart, 
  Sparkles, 
  CheckCircle, 
  GraduationCap,
  Stethoscope,
  Church,
  Globe
} from 'lucide-react';

const ORGANIZATION_TYPES = [
  {
    id: 'nonprofit',
    name: 'Nonprofit',
    description: 'Tax-exempt organizations serving public good',
    icon: Heart,
    color: 'bg-rose-50 border-rose-200 text-rose-700',
    examples: '501(c)(3) organizations, charities, NGOs'
  },
  {
    id: 'foundation',
    name: 'Foundation',
    description: 'Philanthropic grant-making organizations',
    icon: Sparkles,
    color: 'bg-purple-50 border-purple-200 text-purple-700',
    examples: 'Family foundations, community foundations, corporate foundations'
  },
  {
    id: 'government', 
    name: 'Government',
    description: 'Public sector agencies and departments',
    icon: Building2,
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    examples: 'Federal agencies, state departments, city offices'
  },
  {
    id: 'education',
    name: 'Education',
    description: 'Educational institutions and schools',
    icon: GraduationCap,
    color: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    examples: 'Universities, K-12 schools, research institutions'
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    description: 'Medical and health organizations',
    icon: Stethoscope,
    color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    examples: 'Hospitals, clinics, health centers, medical research'
  },
  {
    id: 'for-profit',
    name: 'For-Profit',
    description: 'Companies with social impact missions',
    icon: Building2,
    color: 'bg-green-50 border-green-200 text-green-700',
    examples: 'B-Corps, social enterprises, startups, CSR programs'
  },
  {
    id: 'religious',
    name: 'Religious',
    description: 'Faith-based and religious organizations',
    icon: Church,
    color: 'bg-amber-50 border-amber-200 text-amber-700',
    examples: 'Churches, religious nonprofits, interfaith councils'
  },
  {
    id: 'international',
    name: 'International',
    description: 'Global and international organizations',
    icon: Globe,
    color: 'bg-cyan-50 border-cyan-200 text-cyan-700',
    examples: 'UN organizations, embassies, international NGOs'
  },
  {
    id: 'community-member',
    name: 'Community Member',
    description: 'Individual advocates and volunteers',
    icon: User,
    color: 'bg-slate-50 border-slate-200 text-slate-700',
    examples: 'Individual users, advocates, volunteers, consultants'
  }
];

export default function OrganizationTypeStep({ formData, updateFormData }) {
  
  const handleOrganizationTypeSelect = (typeId) => {
    updateFormData('organizationType', typeId);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Welcome{formData.fullName ? `, ${formData.fullName.split(' ')[0]}` : ''}! 👋
        </h1>
        <p className="text-slate-600">Tell us about your organization type to get started</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ORGANIZATION_TYPES.map((type) => {
          const IconComponent = type.icon;
          const isSelected = formData.organizationType === type.id;
          
          return (
            <button
              key={type.id}
              onClick={() => handleOrganizationTypeSelect(type.id)}
              className={`p-5 rounded-lg border-2 transition-all text-left relative hover:shadow-md group ${
                isSelected
                  ? `${type.color} border-opacity-100 shadow-md`
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start space-x-3">
                <IconComponent className={`w-6 h-6 mt-1 flex-shrink-0 ${isSelected ? '' : 'text-slate-600 group-hover:text-slate-700'}`} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base mb-1">{type.name}</h3>
                  <p className="text-sm opacity-75 mb-2 leading-tight">{type.description}</p>
                  <p className="text-xs opacity-60 leading-tight">{type.examples}</p>
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