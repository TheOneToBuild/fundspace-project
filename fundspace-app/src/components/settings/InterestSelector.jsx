import React from 'react';

const INTEREST_AREAS = [
    { id: 'housing', name: 'Housing', emoji: '🏠', color: 'bg-blue-100 text-blue-800 border-blue-200', hoverColor: 'hover:bg-blue-200' },
    { id: 'education', name: 'Education', emoji: '📚', color: 'bg-green-100 text-green-800 border-green-200', hoverColor: 'hover:bg-green-200' },
    { id: 'health', name: 'Health', emoji: '🏥', color: 'bg-red-100 text-red-800 border-red-200', hoverColor: 'hover:bg-red-200' },
    { id: 'environment', name: 'Environment', emoji: '🌱', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', hoverColor: 'hover:bg-emerald-200' },
    { id: 'arts', name: 'Arts & Culture', emoji: '🎨', color: 'bg-purple-100 text-purple-800 border-purple-200', hoverColor: 'hover:bg-purple-200' },
    { id: 'technology', name: 'Technology', emoji: '💻', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', hoverColor: 'hover:bg-indigo-200' },
    { id: 'social-services', name: 'Social Services', emoji: '🤝', color: 'bg-orange-100 text-orange-800 border-orange-200', hoverColor: 'hover:bg-orange-200' },
    { id: 'youth', name: 'Youth Programs', emoji: '👶', color: 'bg-pink-100 text-pink-800 border-pink-200', hoverColor: 'hover:bg-pink-200' },
    { id: 'seniors', name: 'Senior Services', emoji: '👴', color: 'bg-teal-100 text-teal-800 border-teal-200', hoverColor: 'hover:bg-teal-200' },
    { id: 'community', name: 'Community Development', emoji: '🏘️', color: 'bg-amber-100 text-amber-800 border-amber-200', hoverColor: 'hover:bg-amber-200' },
    { id: 'research', name: 'Research & Science', emoji: '🔬', color: 'bg-cyan-100 text-cyan-800 border-cyan-200', hoverColor: 'hover:bg-cyan-200' },
    { id: 'advocacy', name: 'Advocacy', emoji: '📢', color: 'bg-rose-100 text-rose-800 border-rose-200', hoverColor: 'hover:bg-rose-200' }
  ];

export default function InterestSelector({ interests, onChange, loading }) {
  const selectedInterests = Array.isArray(interests) ? interests : [];

  const toggleInterest = (interestId) => {
    const isSelected = selectedInterests.includes(interestId);
    const newInterests = isSelected
      ? selectedInterests.filter(id => id !== interestId)
      : [...selectedInterests, interestId];
    onChange(newInterests);
  };

  return (
    <div>
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Your Interests</h3>
        <p className="text-xs text-slate-500 mb-4">Select the areas you're most interested in.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {INTEREST_AREAS.map((interest) => {
            const isSelected = selectedInterests.includes(interest.id);
            return (
                <button
                key={interest.id}
                type="button"
                onClick={() => !loading && toggleInterest(interest.id)}
                disabled={loading}
                className={`p-3 rounded-lg border-2 text-sm font-medium transition-all duration-200 text-left ${isSelected ? `${interest.color} border-current` : 'bg-white text-slate-600 border-slate-200'} ${!loading ? `${interest.hoverColor} hover:border-current cursor-pointer` : 'cursor-not-allowed opacity-50'}`}
                >
                <div className="flex items-center gap-2">
                    <span className="text-lg">{interest.emoji}</span>
                    <span>{interest.name}</span>
                </div>
                </button>
            );
            })}
        </div>
    </div>
  );
}