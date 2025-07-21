// src/components/auth/steps/InterestsStep.jsx
import React from 'react';

const INTEREST_AREAS = [
  { id: 'housing', name: 'Housing', emoji: '🏠', color: 'bg-blue-300', hoverColor: 'hover:bg-blue-400' },
  { id: 'education', name: 'Education', emoji: '📚', color: 'bg-green-300', hoverColor: 'hover:bg-green-400' },
  { id: 'health', name: 'Health', emoji: '🏥', color: 'bg-red-300', hoverColor: 'hover:bg-red-400' },
  { id: 'environment', name: 'Environment', emoji: '🌱', color: 'bg-emerald-300', hoverColor: 'hover:bg-emerald-400' },
  { id: 'arts', name: 'Arts & Culture', emoji: '🎨', color: 'bg-purple-300', hoverColor: 'hover:bg-purple-400' },
  { id: 'technology', name: 'Technology', emoji: '💻', color: 'bg-indigo-300', hoverColor: 'hover:bg-indigo-400' },
  { id: 'social-services', name: 'Social Services', emoji: '🤝', color: 'bg-orange-300', hoverColor: 'hover:bg-orange-400' },
  { id: 'youth', name: 'Youth Programs', emoji: '👶', color: 'bg-pink-300', hoverColor: 'hover:bg-pink-400' },
  { id: 'seniors', name: 'Senior Services', emoji: '👴', color: 'bg-teal-300', hoverColor: 'hover:bg-teal-400' },
  { id: 'community', name: 'Community Development', emoji: '🏘️', color: 'bg-amber-300', hoverColor: 'hover:bg-amber-400' },
  { id: 'research', name: 'Research & Science', emoji: '🔬', color: 'bg-cyan-300', hoverColor: 'hover:bg-cyan-400' },
  { id: 'advocacy', name: 'Advocacy', emoji: '📢', color: 'bg-rose-300', hoverColor: 'hover:bg-rose-400' }
];

export default function InterestsStep({ formData, updateFormData }) {
  const toggleInterest = (interestId) => {
    const currentInterests = formData.interests || [];
    const isSelected = currentInterests.includes(interestId);
    
    let newInterests;
    if (isSelected) {
      newInterests = currentInterests.filter(id => id !== interestId);
    } else {
      newInterests = [...currentInterests, interestId];
    }
    
    updateFormData('interests', newInterests);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">What interests you? 💡</h1>
        <p className="text-slate-600">Choose areas you're passionate about</p>
        
        {/* Brief setup notice - only for organization creators */}
        {formData.organizationChoice === 'create' && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              This is a brief setup form. You can add more detailed information after joining the platform.
            </p>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {INTEREST_AREAS.map((interest) => {
          const isSelected = formData.interests?.includes(interest.id);
          
          return (
            <button
              key={interest.id}
              onClick={() => toggleInterest(interest.id)}
              className={`p-4 rounded-lg border text-left transition-all transform hover:scale-105 ${
                isSelected
                  ? `${interest.color} text-slate-800 border-transparent shadow-lg`
                  : `bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:shadow-md ${interest.hoverColor.replace('bg-', 'hover:bg-').replace('-400', '-50')}`
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-xl">{interest.emoji}</span>
                <span className="font-medium text-sm">{interest.name}</span>
              </div>
            </button>
          );
        })}
      </div>
      
      <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-sm text-slate-600">
          <strong>Selected:</strong> {formData.interests?.length || 0} interest{formData.interests?.length !== 1 ? 's' : ''}
        </p>
        {formData.interests?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.interests.map(interestId => {
              const interest = INTEREST_AREAS.find(i => i.id === interestId);
              return (
                <span key={interestId} className="inline-flex items-center space-x-1 text-xs bg-white px-2 py-1 rounded-full border border-slate-200">
                  <span>{interest?.emoji}</span>
                  <span>{interest?.name}</span>
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}