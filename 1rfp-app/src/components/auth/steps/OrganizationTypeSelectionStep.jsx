// src/components/auth/steps/OrganizationTypeSelectionStep.jsx - For Creating New Organizations Only
import React from 'react';
import { 
  Heart, 
  Sparkles, 
  Building2, 
  GraduationCap,
  Stethoscope,
  Church,
  Globe,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';

const ORGANIZATION_TYPES = [
  {
    id: 'nonprofit',
    name: 'Nonprofit',
    description: 'Tax-exempt organizations serving public good',
    icon: Heart,
    color: 'bg-rose-50 border-rose-200 text-rose-700',
    examples: '501(c)(3) organizations, charities, NGOs',
    detailedDescription: 'Nonprofits work to address social causes and serve the public interest. They are exempt from federal income tax and include charities, foundations, advocacy groups, and service organizations.'
  },
  {
    id: 'foundation',
    name: 'Foundation',
    description: 'Philanthropic grant-making organizations',
    icon: Sparkles,
    color: 'bg-purple-50 border-purple-200 text-purple-700',
    examples: 'Family foundations, community foundations, corporate foundations',
    detailedDescription: 'Foundations provide grants and funding to support nonprofits, research, education, and social causes. They manage endowments and distribute funds strategically.'
  },
  {
    id: 'government', 
    name: 'Government',
    description: 'Public sector agencies and departments',
    icon: Building2,
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    examples: 'Federal agencies, state departments, city offices',
    detailedDescription: 'Government agencies at federal, state, and local levels that serve the public through policy, services, and administration.'
  },
  {
    id: 'education',
    name: 'Education',
    description: 'Educational institutions and schools',
    icon: GraduationCap,
    color: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    examples: 'Universities, K-12 schools, research institutions',
    detailedDescription: 'Educational institutions including universities, colleges, K-12 schools, research institutes, and other learning organizations.'
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    description: 'Medical and health organizations',
    icon: Stethoscope,
    color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    examples: 'Hospitals, clinics, health centers, medical research',
    detailedDescription: 'Healthcare organizations including hospitals, clinics, medical research institutions, and health service providers.'
  },
  {
    id: 'for-profit',
    name: 'For-Profit',
    description: 'Companies with social impact missions',
    icon: Building2,
    color: 'bg-green-50 border-green-200 text-green-700',
    examples: 'B-Corps, social enterprises, startups, CSR programs',
    detailedDescription: 'For-profit companies focused on social impact, including B-Corporations, social enterprises, and businesses with corporate social responsibility programs.'
  },
  {
    id: 'religious',
    name: 'Religious',
    description: 'Faith-based and religious organizations',
    icon: Church,
    color: 'bg-amber-50 border-amber-200 text-amber-700',
    examples: 'Churches, religious nonprofits, interfaith councils',
    detailedDescription: 'Faith-based organizations including churches, religious nonprofits, interfaith councils, and spiritual communities serving their communities.'
  },
  {
    id: 'international',
    name: 'International',
    description: 'Global and international organizations',
    icon: Globe,
    color: 'bg-cyan-50 border-cyan-200 text-cyan-700',
    examples: 'UN organizations, embassies, international NGOs',
    detailedDescription: 'International organizations including UN agencies, embassies, international NGOs, and global development organizations.'
  }
];

export default function OrganizationTypeSelectionStep({ formData, updateFormData }) {
  
  const handleOrganizationTypeSelect = (typeId) => {
    updateFormData('organizationType', typeId);
  };

  const handleGoBack = () => {
    // Reset to organization search step
    updateFormData('organizationChoice', '');
    updateFormData('organizationType', '');
  };

  // This step only appears when creating a new organization
  if (formData.organizationChoice !== 'create') {
    return null;
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          What type of organization are you creating? 🏢
        </h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Choose the category that best describes your organization. This helps us customize your experience and connect you with relevant opportunities.
        </p>
      </div>
      
      {/* Organization Type Grid - Improved layout with centered last two items */}
      <div className="space-y-6">
        {/* First 6 cards in 3x2 grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ORGANIZATION_TYPES.slice(0, 6).map((type) => {
            const IconComponent = type.icon;
            const isSelected = formData.organizationType === type.id;
            
            return (
              <button
                key={type.id}
                onClick={() => handleOrganizationTypeSelect(type.id)}
                className={`p-8 rounded-xl border-2 transition-all text-left relative hover:shadow-lg group min-h-[200px] ${
                  isSelected
                    ? `${type.color} border-opacity-100 shadow-lg scale-105`
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:scale-102'
                }`}
              >
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center space-x-3">
                    <IconComponent className={`w-8 h-8 flex-shrink-0 ${
                      isSelected ? '' : 'text-slate-600 group-hover:text-slate-700'
                    }`} />
                    <h3 className="font-bold text-xl">{type.name}</h3>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm opacity-85 mb-4 leading-relaxed">
                      {type.description}
                    </p>
                    <p className="text-xs opacity-75 leading-relaxed">
                      <strong>Examples:</strong> {type.examples}
                    </p>
                  </div>
                </div>
                {isSelected && (
                  <CheckCircle className="w-7 h-7 text-green-600 absolute top-6 right-6" />
                )}
              </button>
            );
          })}
        </div>

        {/* Last 2 cards centered */}
        <div className="flex justify-center">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
            {ORGANIZATION_TYPES.slice(6).map((type) => {
              const IconComponent = type.icon;
              const isSelected = formData.organizationType === type.id;
              
              return (
                <button
                  key={type.id}
                  onClick={() => handleOrganizationTypeSelect(type.id)}
                  className={`p-8 rounded-xl border-2 transition-all text-left relative hover:shadow-lg group min-h-[200px] ${
                    isSelected
                      ? `${type.color} border-opacity-100 shadow-lg scale-105`
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:scale-102'
                  }`}
                >
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center space-x-3">
                      <IconComponent className={`w-8 h-8 flex-shrink-0 ${
                        isSelected ? '' : 'text-slate-600 group-hover:text-slate-700'
                      }`} />
                      <h3 className="font-bold text-xl">{type.name}</h3>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm opacity-85 mb-4 leading-relaxed">
                        {type.description}
                      </p>
                      <p className="text-xs opacity-75 leading-relaxed">
                        <strong>Examples:</strong> {type.examples}
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <CheckCircle className="w-7 h-7 text-green-600 absolute top-6 right-6" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Type Details */}
      {formData.organizationType && (
        <div className="mt-8 p-6 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              {(() => {
                const selectedType = ORGANIZATION_TYPES.find(t => t.id === formData.organizationType);
                const IconComponent = selectedType?.icon || Building2;
                return <IconComponent className="w-6 h-6 text-blue-600" />;
              })()}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {ORGANIZATION_TYPES.find(t => t.id === formData.organizationType)?.name} Organization
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {ORGANIZATION_TYPES.find(t => t.id === formData.organizationType)?.detailedDescription}
              </p>
            </div>
            <div className="flex-shrink-0">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <CheckCircle className="w-4 h-4 mr-1" />
                Selected
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Next Steps Preview */}
      {formData.organizationType && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-sm">📝</span>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">
                Next: Organization details
              </p>
              <p className="text-xs text-blue-600">
                We'll help you set up your {ORGANIZATION_TYPES.find(t => t.id === formData.organizationType)?.name.toLowerCase()} profile with the right categories and information.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}