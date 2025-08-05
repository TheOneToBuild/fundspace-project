// src/components/OnboardingWizard.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// Import the existing step components from SignUpWizard
import PersonalInfoStep from './auth/steps/PersonalInfoStep';
import OrganizationSearchStep from './auth/steps/OrganizationSearchStep';
import OrganizationTypeSelectionStep from './auth/steps/OrganizationTypeSelectionStep';
import OrganizationSetupStep from './auth/steps/OrganizationSetupStep';
import LocationStep from './auth/steps/LocationStep';
import InterestsStep from './auth/steps/InterestsStep';
import FollowUsersStep from './auth/steps/FollowUsersStep';
import NavigationButtons from './auth/shared/NavigationButtons';
import MessageDisplay from './auth/shared/MessageDisplay';

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useOutletContext();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Organization helper functions (copied from SignUpWizard)
  const createOrganizationMembership = async (userId, selectedOrgData) => {
    console.log('Creating organization membership:', { userId, selectedOrgData });
    
    try {
      // Check if organization has existing super admins
      const { data: existingSuperAdmins, error: checkError } = await supabase
        .from('organization_memberships')
        .select('id')
        .eq('organization_id', selectedOrgData.id)
        .eq('role', 'super_admin');
      
      if (checkError) {
        console.error('Error checking existing super admins:', checkError);
        throw checkError;
      }
      
      // Determine role: super_admin if no existing super_admins, otherwise member
      const role = (!existingSuperAdmins || existingSuperAdmins.length === 0) ? 'super_admin' : 'member';
      
      const membershipData = {
        profile_id: userId,
        organization_id: selectedOrgData.id,
        organization_type: selectedOrgData.type,
        role: role // This will be 'super_admin' if no existing super admins, otherwise 'member'
      };

      const { error } = await supabase
        .from('organization_memberships')
        .insert(membershipData);

      if (error) throw error;
      
      console.log(`✅ Organization membership created successfully with role: ${role}`);
      return { success: true, role };
    } catch (error) {
      console.error('❌ Error creating organization membership:', error);
      throw error;
    }
  };

  const createFollowRelationships = async (userId, followUsers) => {
    if (!followUsers || !Array.isArray(followUsers) || followUsers.length === 0) {
      return;
    }

    console.log('Creating follow relationships:', { userId, followUsers });
    
    try {
      const followData = followUsers.map(followUserId => ({
        follower_id: userId,
        following_id: followUserId
      }));

      const { error } = await supabase
        .from('followers')
        .insert(followData);

      if (error) throw error;
      
      console.log('✅ Follow relationships created successfully');
    } catch (error) {
      console.error('❌ Error creating follow relationships:', error);
      throw error;
    }
  };

  // Enhanced organization creation function (without logo upload)
  const createOrganization = async (organizationData, userId) => {
    try {
      console.log('Creating organization with data:', organizationData);
      
      // Prepare organization data for insertion (no logo handling)
      const orgData = {
        name: organizationData.name,
        type: formData.organizationType,
        taxonomy_code: formData.taxonomyCode,
        tagline: organizationData.tagline || null,
        description: organizationData.description || null,
        website: organizationData.website || null,
        location: organizationData.location || null,
        contact_email: organizationData.contactEmail || profile.email,
        image_url: null, // Logo can be added later in organization editing
        annual_budget: organizationData.budget || null,
        staff_count: organizationData.staffCount ? parseInt(organizationData.staffCount) : null,
        year_founded: organizationData.yearFounded ? parseInt(organizationData.yearFounded) : null,
        admin_profile_id: userId,
        capabilities: organizationData.capabilities || [],
        extended_data: {
          focus_areas: organizationData.focusAreas || [],
          service_areas: organizationData.serviceAreas || []
        },
        is_verified: false
      };

      console.log('Inserting organization with data:', orgData);

      // Insert the organization
      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert(orgData)
        .select()
        .single();

      if (orgError) {
        console.error('Organization insertion error:', orgError);
        throw new Error(`Failed to create organization: ${orgError.message}`);
      }

      console.log('✅ Organization created successfully:', newOrg);

      // Create organization membership for the creator as admin
      const membershipData = {
        profile_id: userId,
        organization_id: newOrg.id,
        organization_type: formData.organizationType,
        role: 'super_admin', // 🎯 FIXED: Organization creators should be super_admin, not admin
        membership_type: 'staff',
        is_public: true
      };

      const { error: membershipError } = await supabase
        .from('organization_memberships')
        .insert(membershipData);

      if (membershipError) {
        console.error('Membership creation error:', membershipError);
        // Don't throw here, organization was created successfully
        console.warn('Organization created but membership creation failed');
      } else {
        console.log('✅ Organization membership created successfully');
      }

      // Update profile with organization info
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          organization_choice: 'create',
          organization_type: formData.organizationType,
          selected_organization_id: newOrg.id,
          selected_organization_type: formData.organizationType
        })
        .eq('id', userId);

      if (profileError) {
        console.error('Profile update error:', profileError);
        // Don't throw here, organization was created successfully
      }

      return newOrg;
      
    } catch (error) {
      console.error('❌ Error creating organization:', error);
      throw error;
    }
  };

  // Initialize form data based on existing profile
  const [formData, setFormData] = useState({
    // Pre-fill with existing profile data
    fullName: profile?.full_name || '',
    email: profile?.email || '',
    password: '', // Not needed for onboarding
    avatar: null,
    avatarPreview: profile?.avatar_url || null,
    
    // Organization search/choice
    organizationChoice: profile?.organization_choice || '',
    selectedOrgData: null,
    
    // Organization creation (only for create choice)
    organizationType: profile?.organization_type || '',
    newOrganization: {
      name: '',
      description: '',
      tagline: '',
      website: '',
      location: profile?.location || '',
      contactEmail: profile?.email || '',
      budget: '',
      staffCount: '',
      yearFounded: '',
      capabilities: [],
      logo: null,
      logoPreview: null
    },
    taxonomyCode: '',
    capabilities: [],
    
    // Focus and service areas
    focusAreas: [],
    serviceAreas: [],
    
    // Location and interests
    location: Array.isArray(profile?.location) ? profile.location : (profile?.location ? [profile.location] : []),
    interests: Array.isArray(profile?.interests) ? profile.interests : [],
    
    // Follow users
    followUsers: []
  });

  // Determine which step to start on based on profile completion
  // Only run once when component mounts, not when profile updates
  useEffect(() => {
    if (profile && currentStep === 1) {
      // Only set initial step, don't auto-advance during the flow
      // Always start with step 1 for the combined avatar + interests step
      // Only move to later steps if both avatar AND interests are complete
      if ((!profile.avatar_url && (!profile.interests || profile.interests.length === 0)) ||
          (!profile.avatar_url || !profile.interests || profile.interests.length === 0)) {
        setCurrentStep(1); // Combined avatar + interests step
      } else if (!profile.organization_choice) {
        setCurrentStep(2); // Organization search
      } else if (profile.organization_choice === 'create' && !profile.organization_type) {
        setCurrentStep(3); // Organization type
      } else if (profile.organization_choice === 'create' && !profile.organization_id) {
        setCurrentStep(4); // Organization setup
      } else if (!profile.location || (Array.isArray(profile.location) && profile.location.length === 0)) {
        setCurrentStep(5); // Location
      } else {
        setCurrentStep(6); // Follow users (final step)
      }
    }
  }, [profile?.id]); // Only depend on profile.id, not the entire profile object

  const updateFormData = useCallback((fieldOrUpdates, value) => {
    if (typeof fieldOrUpdates === 'string') {
      // Handle nested field paths like 'newOrganization.name'
      if (fieldOrUpdates.includes('.')) {
        const [parent, child] = fieldOrUpdates.split('.');
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        }));
      } else {
        // Handle simple field: updateFormData('field', value)
        setFormData(prev => ({ ...prev, [fieldOrUpdates]: value }));
      }
    } else {
      // Handle object format: updateFormData({ field: value })
      setFormData(prev => ({ ...prev, ...fieldOrUpdates }));
    }
  }, []);

  // Calculate total steps based on user choices
  const getTotalSteps = useCallback(() => {
    if (formData.organizationChoice === 'community' || formData.organizationChoice === 'join') {
      return 4; // Avatar+Interests, Organization, Location, Follow = 4 steps
    }
    return 6; // Avatar+Interests, Organization, Type, Setup, Location, Follow = 6 steps
  }, [formData.organizationChoice]);

  // Get current step number for display
  const getCurrentStepNumber = useCallback(() => {
    if (formData.organizationChoice === 'community' || formData.organizationChoice === 'join') {
      if (currentStep === 2) return 2; // Organization search
      if (currentStep === 5) return 3; // Location
      if (currentStep === 6) return 4; // Follow users
    }
    return currentStep;
  }, [formData.organizationChoice, currentStep]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (formData.organizationChoice === 'community' || formData.organizationChoice === 'join') {
      if (currentStep === 2) {
        setCurrentStep(5); // Skip to location
      } else if (currentStep === 5) {
        setCurrentStep(6); // To follow users
      } else {
        setCurrentStep(prev => prev + 1);
      }
    } else {
      setCurrentStep(prev => prev + 1);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [formData.organizationChoice, currentStep]);

  const handlePrev = useCallback(() => {
    if (formData.organizationChoice === 'community' || formData.organizationChoice === 'join') {
      if (currentStep === 6) {
        setCurrentStep(5); // Back to location
      } else if (currentStep === 5) {
        setCurrentStep(2); // Back to organization search
      } else {
        setCurrentStep(prev => prev - 1);
      }
    } else {
      setCurrentStep(prev => prev - 1);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [formData.organizationChoice, currentStep]);

  // Form validation
  const isStepValid = useCallback(() => {
    switch (currentStep) {
      case 1: 
        return true; // Avatar and interests are optional
      case 2: 
        return !!formData.organizationChoice;
      case 3: 
        return formData.organizationChoice !== 'create' || !!formData.organizationType;
      case 4: 
        if (formData.organizationChoice !== 'create') return true;
        return !!(formData.newOrganization?.name && formData.taxonomyCode);
      case 5: 
        return true; // Location is optional in onboarding
      case 6:
        return true; // Follow users is optional
      default: 
        return false;
    }
  }, [formData, currentStep]);

  // Handle completion
  const handleComplete = async () => {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      console.log('🚀 Completing onboarding with data:', formData);

      const userId = profile.id;

      // Upload avatar if provided
      let avatarUrl = profile.avatar_url; // Keep existing if no new avatar
      if (formData.avatar instanceof File) {
        console.log('📷 Uploading new avatar...');
        const fileExt = formData.avatar.name.split('.').pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, formData.avatar, { 
            cacheControl: '3600',
            upsert: false 
          });

        if (uploadError) {
          console.error('❌ Avatar upload error:', uploadError);
          throw new Error(`Avatar upload failed: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(uploadData.path);
        
        avatarUrl = publicUrl;
        console.log('✅ Avatar uploaded:', avatarUrl);
      }

      // Prepare profile updates
      const profileUpdates = {
        avatar_url: avatarUrl,
        bio: formData.bio || profile.bio,
        location: Array.isArray(formData.location) && formData.location.length > 0 ? formData.location : profile.location,
        interests: Array.isArray(formData.interests) && formData.interests.length > 0 ? formData.interests : profile.interests,
        organization_type: formData.organizationType || profile.organization_type,
        organization_choice: formData.organizationChoice || profile.organization_choice,
        selected_organization_id: formData.selectedOrgData?.id || profile.selected_organization_id,
        selected_organization_type: formData.selectedOrgData?.type || profile.selected_organization_type,
        follow_users: Array.isArray(formData.followUsers) && formData.followUsers.length > 0 ? formData.followUsers : profile.follow_users,
        onboarding_completed: true,
        signup_step_completed: 7
      };

      console.log('💾 Updating profile with:', profileUpdates);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', userId);

      if (updateError) {
        console.error('❌ Profile update error:', updateError);
        throw new Error(`Profile update failed: ${updateError.message}`);
      }

      console.log('✅ Profile updated successfully');

      // Handle organization creation/joining
      if (formData.organizationChoice === 'create' && formData.newOrganization?.name) {
        console.log('🏢 Creating organization...');
        await createOrganization(formData.newOrganization, userId);
      } else if (formData.organizationChoice === 'join' && formData.selectedOrgData) {
        console.log('🤝 Joining organization...');
        await createOrganizationMembership(userId, formData.selectedOrgData);
      }

      // Create follow relationships
      if (Array.isArray(formData.followUsers) && formData.followUsers.length > 0) {
        console.log('👥 Creating follow relationships...');
        try {
          await createFollowRelationships(userId, formData.followUsers);
        } catch (followError) {
          console.warn('Follow relationships failed, but continuing:', followError);
        }
      }

      // Refresh profile data
      await refreshProfile();

      setMessage('🎉 Your profile is now complete! Welcome to the community!');
      
      // Redirect to profile after a short delay
      setTimeout(() => {
        navigate('/profile');
      }, 2000);

    } catch (err) {
      console.error('❌ Onboarding completion error:', err);
      setError(err.message || 'An error occurred while completing your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = useCallback(() => {
    switch (currentStep) {
      case 1:
        return <CombinedAvatarInterestsStep formData={formData} updateFormData={updateFormData} profile={profile} />;
      case 2:
        return <OrganizationSearchStep formData={formData} updateFormData={updateFormData} />;
      case 3:
        return <OrganizationTypeSelectionStep formData={formData} updateFormData={updateFormData} />;
      case 4:
        return <OrganizationSetupStep formData={formData} updateFormData={updateFormData} setFormData={setFormData} />;
      case 5:
        return <LocationStep formData={formData} updateFormData={updateFormData} />;
      case 6:
        return <FollowUsersStep formData={formData} updateFormData={updateFormData} />;
      default:
        return <CombinedAvatarInterestsStep formData={formData} updateFormData={updateFormData} profile={profile} />;
    }
  }, [currentStep, formData, updateFormData, setFormData, profile]);

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Profile Photo & Interests';
      case 2: return 'Find Your Organization';
      case 3: return 'Organization Type';
      case 4: return 'Organization Setup';
      case 5: return 'Location';
      case 6: return 'Follow Users';
      default: return 'Profile Setup';
    }
  };

  // Combined Avatar and Interests Step Component
  const CombinedAvatarInterestsStep = ({ formData, updateFormData, profile }) => {
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

    const toggleInterest = async (interestId) => {
      const currentInterests = formData.interests || [];
      const isSelected = currentInterests.includes(interestId);
      
      let newInterests;
      if (isSelected) {
        newInterests = currentInterests.filter(id => id !== interestId);
      } else {
        newInterests = [...currentInterests, interestId];
      }
      
      updateFormData({ interests: newInterests });
      
      // Auto-save interests to database
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ 
            interests: newInterests,
            updated_at: new Date()
          })
          .eq('id', profile.id);

        if (error) {
          console.error('Error saving interests:', error);
        } else {
          console.log('✅ Interests auto-saved');
          // Refresh profile to ensure consistency
          if (refreshProfile) {
            await refreshProfile();
          }
        }
      } catch (err) {
        console.error('Error auto-saving interests:', err);
      }
    };

    const handleAvatarChange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        // Show immediate preview
        updateFormData({ 
          avatar: file,
          avatarPreview: URL.createObjectURL(file)
        });

        // Auto-upload and save like in SettingsPage
        const fileExt = file.name.split('.').pop();
        const fileName = `avatar-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        console.log('🔧 Auto-uploading avatar:', fileName);

        // Upload to Supabase storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('❌ Avatar upload error:', uploadError);
          return;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        if (!urlData?.publicUrl) {
          console.error('Failed to get public URL');
          return;
        }

        const imageUrl = `${urlData.publicUrl}?v=${Date.now()}`;
        console.log('✅ Avatar uploaded:', imageUrl);

        // Auto-save to profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            avatar_url: imageUrl,
            updated_at: new Date()
          })
          .eq('id', profile.id);

        if (updateError) {
          console.error('❌ Error updating avatar:', updateError);
        } else {
          console.log('✅ Avatar auto-saved to profile');
          // Update form data with final URL
          updateFormData({ avatarPreview: imageUrl });
          
          // Refresh profile to ensure consistency
          if (refreshProfile) {
            await refreshProfile();
          }
        }
      } catch (err) {
        console.error('❌ Avatar upload error:', err);
      }
    };

    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Let's Get Started! ✨</h1>
          <p className="text-slate-600">
            Let's upload a photo and tell us what you're interested in so we can tailor your experience.
          </p>
        </div>

        {/* Avatar Upload Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Profile Photo (optional)</h3>
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-slate-200 border-2 border-dashed border-slate-300 flex items-center justify-center mb-4 overflow-hidden">
              {formData.avatarPreview || profile?.avatar_url ? (
                <img 
                  src={formData.avatarPreview || profile?.avatar_url} 
                  alt="Profile preview" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-slate-500 text-sm">Photo</span>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
              id="avatar-upload"
            />
            <label
              htmlFor="avatar-upload"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
            >
              Choose Photo
            </label>
            <p className="text-xs text-slate-500 mt-2">PNG, JPG up to 2MB</p>
          </div>
        </div>

        {/* Interests Section */}
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">What interests you? 💡</h3>
          <p className="text-slate-600 mb-6">Choose areas you're passionate about</p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
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
          
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
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
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 py-8 pb-48">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Progress indicator */}
        <div className="text-center mb-8">
          <h2 className="text-sm font-medium text-slate-500 tracking-wide uppercase mb-4">
            Step {getCurrentStepNumber()} of {getTotalSteps()} • {getStepTitle()}
          </h2>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(getCurrentStepNumber() / getTotalSteps()) * 100}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {renderStep()}
          
          {/* Navigation - Now inside the same box with proper spacing */}
          <div className="mt-4 pt-3">
            <NavigationButtons
              currentStep={currentStep}
              totalSteps={getTotalSteps()}
              onPrev={currentStep === 1 ? () => navigate('/profile') : handlePrev}
              onNext={getCurrentStepNumber() === getTotalSteps() ? handleComplete : handleNext}
              isValid={isStepValid()}
              loading={loading}
              prevLabel={currentStep === 1 ? 'Back to Profile' : 'Back'}
              nextLabel={getCurrentStepNumber() === getTotalSteps() ? '🎉 Complete Profile' : 'Next'}
            />
            
            <MessageDisplay message={message} error={error} />
          </div>
        </div>
      </div>
    </div>
  );
}