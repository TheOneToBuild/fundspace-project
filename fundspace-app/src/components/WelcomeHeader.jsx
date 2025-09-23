// src/components/WelcomeHeader.jsx - Compact profile completion banner for dashboard
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, User, Heart, Building2, CheckCircle2, X } from 'lucide-react';

export default function WelcomeHeader({ profile }) {
    const navigate = useNavigate();
    const firstName = profile?.full_name?.split(' ')[0] || 'there';
    const today = new Date();
    const dateString = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    // Calculate completion data
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

        return { checks, completed: additionalCompleted, total, percentage };
    };

    const { checks, percentage } = getCompletionData();
    const shouldShowBanner = checks.some(check => !check.completed);

    const handleCompleteProfile = () => {
        navigate('/onboarding');
    };

    return (
        <div className="space-y-4 mb-8">
            {/* Compact Profile Completion Banner - Only show when incomplete */}
            {shouldShowBanner && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-400 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                                    <span className="text-lg">✨</span>
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-amber-800">
                                    Complete your profile ({percentage}% done)
                                </h3>
                                <div className="flex items-center space-x-4 mt-1">
                                    <p className="text-xs text-amber-700">
                                        Unlock all features by completing your profile setup
                                    </p>
                                    {/* Mini progress indicators */}
                                    <div className="flex items-center space-x-1">
                                        {checks.map((item) => (
                                            <div 
                                                key={item.key}
                                                className={`w-2 h-2 rounded-full ${
                                                    item.completed 
                                                        ? 'bg-emerald-500' 
                                                        : 'bg-amber-200'
                                                }`}
                                                title={item.label}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* CTA Button */}
                        <div className="flex items-center space-x-2">
                            <button 
                                onClick={handleCompleteProfile}
                                className="flex items-center space-x-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                            >
                                <span>Complete</span>
                                <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Regular Welcome Header */}
            <div className="bg-gradient-to-r from-blue-50 via-white to-indigo-50 p-6 rounded-xl shadow-sm border border-slate-200/80">
                <div className="flex items-center">
                    <span className="text-4xl mr-4" role="img" aria-label="Waving hand">👋</span>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Hi {firstName},</h2>
                        <p className="text-slate-500 mt-1">Happy {dateString}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}