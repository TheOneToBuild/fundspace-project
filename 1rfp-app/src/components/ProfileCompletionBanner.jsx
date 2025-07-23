// src/components/ProfileCompletionBanner.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, User, MapPin, Heart, Users, Building2 } from 'lucide-react';

export default function ProfileCompletionBanner({ profile }) {
  const navigate = useNavigate();

  // Debug logging
  console.log('ProfileCompletionBanner - profile data:', {
    onboarding_completed: profile?.onboarding_completed,
    avatar_url: profile?.avatar_url,
    interests: profile?.interests,
    organization_choice: profile?.organization_choice,
    full_name: profile?.full_name,
    email: profile?.email
  });

  // Get user's first name
  const firstName = profile?.name?.split(' ')[0] || profile?.full_name?.split(' ')[0] || 'there';

  // Calculate completion percentage
  const getCompletionData = () => {
    const checks = [
      { key: 'avatar', label: 'Profile Photo', completed: !!profile?.avatar_url, icon: User },
      { key: 'interests', label: 'Interests', completed: !!(profile?.interests && profile?.interests?.length > 0), icon: Heart },
      { key: 'organization', label: 'Join your org', completed: !!(profile?.organization_choice && profile?.organization_choice !== ''), icon: Building2 },
    ];

    // Include base completion (name + email already required for signup)
    const baseCompleted = 2; // name and email
    const additionalCompleted = checks.filter(check => check.completed).length;
    const total = checks.length + baseCompleted;
    const totalCompleted = additionalCompleted + baseCompleted;
    const percentage = Math.round((totalCompleted / total) * 100);

    console.log('Completion calculation:', {
      checks,
      baseCompleted,
      additionalCompleted,
      total,
      totalCompleted,
      percentage
    });

    return { checks, completed: additionalCompleted, total, percentage };
  };

  const { checks, completed, total, percentage } = getCompletionData();

  const handleCompleteProfile = () => {
    navigate('/onboarding');
  };

  // Show banner if ANY of the main items are missing (ignore onboarding_completed for now)
  const shouldShowBanner = checks.some(check => !check.completed);
  
  console.log('Should show banner:', shouldShowBanner, 'Percentage:', percentage);

  if (!shouldShowBanner) {
    console.log('Banner hidden - all items complete');
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-4xl">✨</div>
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h2 className="text-xl font-bold text-slate-800">Complete Your Profile</h2>
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                <span>{percentage}% complete</span>
              </div>
            </div>
            <p className="text-slate-600 max-w-2xl mb-4">
              Hey {firstName}! 👋 Let's complete your profile to unlock all features!
            </p>
            
            {/* Show missing items */}
            {checks.filter(check => !check.completed).length > 0 && (
              <div className="flex items-center space-x-4 text-sm text-slate-600">
                <span className="font-medium">Still needed:</span>
                {checks.filter(check => !check.completed).slice(0, 3).map((item, index) => (
                  <div key={item.key} className="flex items-center space-x-1">
                    <item.icon size={14} className="text-emerald-600" />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <button 
          onClick={handleCompleteProfile}
          className="flex items-center space-x-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors shadow-sm"
        >
          <span>Complete Profile</span>
          <ArrowRight size={18} />
        </button>
      </div>
      
      {/* Progress bar */}
      <div className="mt-4">
        <div className="w-full bg-emerald-100 rounded-full h-2">
          <div 
            className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}