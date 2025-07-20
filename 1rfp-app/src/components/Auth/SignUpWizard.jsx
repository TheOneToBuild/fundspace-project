// src/components/auth/SignUpWizard.jsx - Enhanced with Complete Organization Integration and Auth Fix
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import PersonalInfoStep from './steps/PersonalInfoStep';
import OrganizationTypeStep from './steps/OrganizationTypeStep';
import OrganizationSetupStep from './steps/OrganizationSetupStep';
import LocationStep from './steps/LocationStep';
import InterestsStep from './steps/InterestsStep';
import FollowUsersStep from './steps/FollowUsersStep';
import NavigationButtons from './shared/NavigationButtons';
import MessageDisplay from './shared/MessageDisplay';

export default function SignUpWizard({ onSwitchToLogin }) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    avatar: null,
    organizationType: '',
    organizationChoice: '',
    existingOrganization: '',
    selectedOrgData: null,
    newOrganization: {
      name: '',
      tagline: '',
      description: '',
      location: '',
      website: '',
      contactEmail: '',
      image: null,
      funderTypeId: '',
      totalFundingAnnually: '',
      averageGrantSize: '',
      budget: '',
      staffCount: '',
      yearFounded: '',
      ein: ''
    },
    location: [],
    interests: [],
    followUsers: []
  });

  const updateFormData = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleNext = () => {
    if (currentStep === 2 && formData.organizationType === 'community-member') {
      setCurrentStep(4);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep === 4 && formData.organizationType === 'community-member') {
      setCurrentStep(2);
    } else {
      setCurrentStep(prev => prev - 1);
    }
  };

  const uploadAvatar = async (avatarFile) => {
    if (!avatarFile) return null;

    try {
      const fileExt = avatarFile.name?.split('.').pop() || 'jpg';
      const fileName = `avatar-${Math.random()}.${fileExt}`;
      // Remove the extra 'avatars/' prefix since the bucket is already 'avatars'
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  };

  const createOrganization = async (orgData, userId) => {
    try {
      const isNonprofit = formData.organizationType === 'nonprofit';
      const table = isNonprofit ? 'nonprofits' : 'funders';
      
      // Prepare organization record based on type
      const orgRecord = {
        name: orgData.name,
        tagline: orgData.tagline,
        description: orgData.description,
        location: orgData.location,
        website: orgData.website,
        contact_email: orgData.contactEmail,
        admin_profile_id: userId,
        ...(isNonprofit ? {
          // Nonprofit-specific fields
          image_url: orgData.image,
          budget: orgData.budget,
          staff_count: orgData.staffCount ? parseInt(orgData.staffCount) : null,
          year_founded: orgData.yearFounded ? parseInt(orgData.yearFounded) : null,
          ein: orgData.ein
        } : {
          // Funder-specific fields
          logo_url: orgData.image,
          funder_type_id: orgData.funderTypeId ? parseInt(orgData.funderTypeId) : null,
          total_funding_annually: orgData.totalFundingAnnually,
          average_grant_size: orgData.averageGrantSize
        })
      };

      console.log('Creating organization:', { table, orgRecord });

      // Create organization
      const { data: newOrg, error: orgError } = await supabase
        .from(table)
        .insert(orgRecord)
        .select()
        .single();

      if (orgError) {
        console.error('Organization creation error:', orgError);
        throw new Error(`Failed to create organization: ${orgError.message}`);
      }

      console.log('Organization created successfully:', newOrg);

      // Create organization membership
      const membershipData = {
        profile_id: userId,
        organization_id: newOrg.id,
        organization_type: isNonprofit ? 'nonprofit' : 'funder',
        role: 'super_admin'
      };

      console.log('Creating membership:', membershipData);

      const { error: membershipError } = await supabase
        .from('organization_memberships')
        .insert(membershipData);

      if (membershipError) {
        console.error('Membership creation error:', membershipError);
        throw new Error(`Failed to create organization membership: ${membershipError.message}`);
      }

      console.log('Membership created successfully');
      return newOrg;
    } catch (error) {
      console.error('Error in createOrganization:', error);
      throw error;
    }
  };

  const createOrganizationMembership = async (userId, orgData) => {
    const { error } = await supabase
      .from('organization_memberships')
      .insert({
        profile_id: userId,
        organization_id: orgData.id,
        organization_type: orgData.type,
        role: 'member'
      });

    if (error) throw error;
  };

  const createFollowRelationships = async (userId, followUserIds) => {
    if (!followUserIds || followUserIds.length === 0) return;

    try {
      const followRecords = followUserIds.map(followingId => ({
        follower_id: userId,
        following_id: followingId
      }));

      const { error } = await supabase
        .from('followers')
        .insert(followRecords);

      if (error) {
        console.error('Follow relationships error:', error);
        throw new Error(`Failed to create follow relationships: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in createFollowRelationships:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Starting signup process...');
      
      // Create user account with metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            avatar_url: null // Will be updated later
          }
        }
      });

      if (authError) throw authError;
      const userId = authData.user.id;
      console.log('User created:', userId);

      // Wait a moment for auth to fully establish
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Try to get the session, but don't fail if it's not available (email confirmation might be required)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.warn('Session error:', sessionError);
      }
      
      if (session && session.user.id === userId) {
        console.log('Session verified:', session.user.id);
      } else if (session) {
        console.log('Session exists but for different user. Signing out old session...');
        await supabase.auth.signOut();
        console.log('Using new user ID for profile creation:', userId);
      } else {
        console.log('No session found - email confirmation may be required');
        // For now, we'll continue with the signup process using the user ID from signup
        // The user will need to confirm their email before they can log in
      }

      // Upload avatar if provided
      let avatarUrl = null;
      if (formData.avatar) {
        console.log('Uploading avatar...');
        if (typeof formData.avatar === 'string' && formData.avatar.startsWith('data:')) {
          const response = await fetch(formData.avatar);
          const blob = await response.blob();
          const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
          avatarUrl = await uploadAvatar(file);
        } else if (formData.avatar instanceof File) {
          avatarUrl = await uploadAvatar(formData.avatar);
        }
        console.log('Avatar uploaded:', avatarUrl);
      }

      // Map organization types to role display names
      const roleMapping = {
        'nonprofit': 'Nonprofit',
        'government': 'Government', 
        'foundation': 'Funder',
        'for-profit': 'For-profit',
        'community-member': 'Community member'
      };

      // Create user profile with all signup data
      console.log('Creating profile...');
      const profileData = {
        id: userId,
        full_name: formData.fullName,
        avatar_url: avatarUrl,
        role: roleMapping[formData.organizationType] || 'Community member',
        location: formData.location?.join(', ') || '',
        bio: formData.interests?.length > 0 ? 'Interested in: ' + formData.interests.join(', ') : null,
        interests: formData.interests?.length > 0 ? formData.interests : null,
        organization_type: formData.organizationType,
        organization_choice: formData.organizationChoice,
        selected_organization_id: formData.selectedOrgData?.id || null,
        selected_organization_type: formData.selectedOrgData?.type || null,
        follow_users: formData.followUsers?.length > 0 ? formData.followUsers : null,
        onboarding_completed: true,
        signup_step_completed: 6
      };
      
      console.log('Profile data:', profileData);

      // First check if profile already exists (from trigger)
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      console.log('Existing profile check:', { existingProfile, checkError });

      if (existingProfile) {
        console.log('Profile already exists from trigger, updating with full data...');
        // Update existing profile with full signup data
        const { error: updateError } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', userId);

        if (updateError) {
          console.error('Profile update error:', updateError);
          // If update fails due to RLS, show email confirmation message
          if (updateError.code === '42501' || updateError.message.includes('row-level security')) {
            setMessage('🎉 Account created! Please check your email to verify your account, then you can complete your profile setup.');
            setTimeout(() => {
              navigate('/login');
            }, 3000);
            return;
          } else {
            throw new Error(`Profile update failed: ${updateError.message}`);
          }
        }
        console.log('Profile updated successfully');
      } else {
        console.log('Creating new profile...');
        // Try to create profile with authenticated client
        const { error: authProfileError } = await supabase
          .from('profiles')
          .insert(profileData);

        if (authProfileError) {
          console.error('Authenticated profile creation failed:', authProfileError);
          
          // Handle various error scenarios
          if (authProfileError.code === '42501' || 
              authProfileError.message.includes('row-level security') ||
              authProfileError.message.includes('foreign key constraint') ||
              authProfileError.code === '23503' ||
              authProfileError.code === '23505') { // Duplicate key error
            setMessage('🎉 Account created! Please check your email to verify your account, then you can complete your profile setup.');
            setTimeout(() => {
              navigate('/login');
            }, 3000);
            return; // Exit early - user needs to confirm email first
          } else {
            throw new Error(`Profile creation failed: ${authProfileError.message}`);
          }
        }
        console.log('Profile created successfully');
      }

      // Handle organization creation/joining (skip for community members)
      if (formData.organizationType !== 'community-member') {
        if (formData.organizationChoice === 'create' && formData.newOrganization.name) {
          console.log('Creating organization...');
          // Create new organization with all the detailed information
          await createOrganization(formData.newOrganization, userId);
        } else if (formData.organizationChoice === 'join' && formData.selectedOrgData) {
          console.log('Joining organization...');
          // Join existing organization
          await createOrganizationMembership(userId, formData.selectedOrgData);
        }
      }

      // Create follow relationships (temporarily skip to avoid RLS issues)
      if (formData.followUsers?.length > 0) {
        console.log('Creating follow relationships...');
        try {
          await createFollowRelationships(userId, formData.followUsers);
        } catch (followError) {
          console.warn('Follow relationships failed, but continuing signup:', followError);
          // Don't throw error - let signup continue without follows
        }
      }

      // Success message
      setMessage('🎉 Welcome to 1RFP! Your account has been created successfully. Please check your email to verify your account.');
      
      // Force a page refresh to ensure all components load with the new user data
      setTimeout(() => {
        window.location.href = '/profile';
      }, 2000);
      
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || 'An error occurred during signup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1: 
        return formData.fullName && 
               formData.email && 
               validateEmail(formData.email) &&
               formData.password && 
               formData.password.length >= 6;
      case 2: 
        return formData.organizationType;
      case 3: 
        if (!formData.organizationChoice) return false;
        if (formData.organizationChoice === 'join') {
          return !!formData.selectedOrgData;
        }
        if (formData.organizationChoice === 'create') {
          // Validate required fields for organization creation
          const orgValid = !!formData.newOrganization.name;
          // For funders, also require organization type selection
          if (formData.organizationType !== 'nonprofit') {
            return orgValid && !!formData.newOrganization.funderTypeId;
          }
          return orgValid;
        }
        return false;
      case 4: 
        return formData.location && formData.location.length > 0;
      case 5:
        return true; // Interests are optional
      case 6:
        return true; // Follow users is optional
      default: 
        return false;
    }
  };

  const totalSteps = () => {
    if (formData.organizationType === 'community-member') return 5;
    return 6;
  };

  const getCurrentStepNumber = () => {
    if (formData.organizationType === 'community-member') {
      if (currentStep === 4) return 3;
      if (currentStep === 5) return 4;
      if (currentStep === 6) return 5;
    }
    return currentStep;
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <PersonalInfoStep formData={formData} updateFormData={updateFormData} />;
      case 2:
        return <OrganizationTypeStep formData={formData} updateFormData={updateFormData} />;
      case 3:
        return <OrganizationSetupStep formData={formData} updateFormData={updateFormData} />;
      case 4:
        return <LocationStep formData={formData} updateFormData={updateFormData} />;
      case 5:
        return <InterestsStep formData={formData} updateFormData={updateFormData} />;
      case 6:
        return <FollowUsersStep formData={formData} updateFormData={updateFormData} />;
      default:
        return <PersonalInfoStep formData={formData} updateFormData={updateFormData} />;
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h2 className="text-sm font-medium text-slate-500 tracking-wide uppercase">
          Step {getCurrentStepNumber()} of {totalSteps()}
        </h2>
      </div>

      <div className="mb-10">
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(getCurrentStepNumber() / totalSteps()) * 100}%` }}
          />
        </div>
      </div>

      {renderStep()}
      
      <NavigationButtons
        currentStep={currentStep}
        totalSteps={totalSteps()}
        onPrev={currentStep === 1 ? onSwitchToLogin : handlePrev}
        onNext={currentStep === 6 ? handleSubmit : handleNext}
        isValid={isStepValid()}
        loading={loading}
        prevLabel={currentStep === 1 ? 'Back to Sign In' : 'Back'}
        nextLabel={currentStep === 6 ? '🚀 Create Account' : 'Next'}
      />

      <MessageDisplay message={message} error={error} />
    </div>
  );
}