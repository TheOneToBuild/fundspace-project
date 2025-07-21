// src/components/Auth/SignUpWizard.jsx - UPDATED WITH FIXES
import React, { useState, useCallback } from 'react';
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
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Form data state
  const [formData, setFormData] = useState({
    // Personal info
    fullName: '',
    email: '',
    password: '',
    avatar: null,
    avatarPreview: null,
    
    // Organization info
    organizationType: '',
    organizationChoice: '', // 'join' or 'create'
    selectedOrgData: null,
    newOrganization: {
      name: '',
      description: '',
      funderTypeId: '',
      taxonomyCode: '',
      capabilities: []
    },
    taxonomyCode: '',
    capabilities: [],
    
    // Location and interests
    location: [],
    interests: [],
    
    // Follow users
    followUsers: []
  });

  // FIXED: Use useCallback to prevent function recreation on every render
  const updateFormData = useCallback((field, value) => {
    console.log('SignUpWizard updateFormData called:', field, value);
    
    setFormData(prevData => {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        const newData = {
          ...prevData,
          [parent]: {
            ...prevData[parent],
            [child]: value
          }
        };
        console.log('SignUpWizard state updated (nested):', newData);
        return newData;
      } else {
        const newData = { ...prevData, [field]: value };
        console.log('SignUpWizard state updated:', newData);
        return newData;
      }
    });
  }, []); // Empty dependency array to prevent recreation

  // Helper functions
  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');
  };

  const uploadAvatar = async (file) => {
    try {
      const fileExt = file.name?.split('.').pop() || 'jpg';
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  };

  // Helper function for type-specific extended_data
  const buildExtendedData = (orgType, orgData) => {
    const extended = {};
    
    switch (orgType) {
      case 'nonprofit':
        if (orgData.ein) extended.ein = orgData.ein;
        if (orgData.programs) extended.programs = orgData.programs;
        break;
      case 'foundation':
        if (orgData.endowmentSize) extended.endowment_size = orgData.endowmentSize;
        if (orgData.payoutRate) extended.payout_rate = orgData.payoutRate;
        break;
      case 'government':
        if (orgData.agencyCode) extended.agency_code = orgData.agencyCode;
        if (orgData.parentDepartment) extended.parent_department = orgData.parentDepartment;
        break;
      case 'education':
        if (orgData.studentCount) extended.student_count = orgData.studentCount;
        if (orgData.researchFocus) extended.research_focus = orgData.researchFocus;
        break;
      case 'healthcare':
        if (orgData.specialties) extended.specialties = orgData.specialties;
        if (orgData.bedCount) extended.bed_count = orgData.bedCount;
        break;
      case 'religious':
        if (orgData.denomination) extended.denomination = orgData.denomination;
        if (orgData.congregationSize) extended.congregation_size = orgData.congregationSize;
        break;
      case 'for-profit':
        if (orgData.revenue) extended.revenue = orgData.revenue;
        if (orgData.industry) extended.industry = orgData.industry;
        break;
    }
    
    return extended;
  };

  const createOrganization = async (organizationData, userId) => {
    console.log('Creating organization with data:', organizationData);
    
    try {
      // Build the unified organization data
      const orgData = {
        name: organizationData.name,
        type: formData.organizationType,
        taxonomy_code: organizationData.taxonomyCode || formData.taxonomyCode,
        tagline: organizationData.tagline,
        description: organizationData.description || '',
        website: organizationData.website,
        location: organizationData.location,
        contact_email: organizationData.contactEmail,
        annual_budget: organizationData.budget,
        staff_count: organizationData.staffCount ? parseInt(organizationData.staffCount.split('-')[0]) : null,
        year_founded: organizationData.yearFounded ? parseInt(organizationData.yearFounded) : null,
        admin_profile_id: userId,
        capabilities: organizationData.capabilities || formData.capabilities || [],
        extended_data: buildExtendedData(formData.organizationType, organizationData)
      };

      // Create organization in unified table
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .insert(orgData)
        .select()
        .single();

      if (orgError) throw orgError;

      // Create organization membership
      const membershipData = {
        profile_id: userId,
        organization_id: organization.id,
        organization_type: organization.type,
        role: 'super_admin'
      };

      const { error: membershipError } = await supabase
        .from('organization_memberships')
        .insert(membershipData);

      if (membershipError) throw membershipError;

      console.log('✅ Organization created successfully:', organization);
      return organization;
    } catch (error) {
      console.error('❌ Error creating organization:', error);
      throw error;
    }
  };

  const createOrganizationMembership = async (userId, selectedOrgData) => {
    console.log('Creating organization membership:', { userId, selectedOrgData });
    
    try {
      const membershipData = {
        profile_id: userId,
        organization_id: selectedOrgData.id,
        organization_type: selectedOrgData.type, // Use the actual type from the organization
        role: 'member' // New members start as regular members
      };

      const { error } = await supabase
        .from('organization_memberships')
        .insert(membershipData);

      if (error) throw error;
      
      console.log('✅ Organization membership created successfully');
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

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (formData.organizationType === 'community-member' && currentStep === 2) {
      setCurrentStep(4); // Skip organization setup for community members (go from step 2 to step 4)
    } else {
      setCurrentStep(prev => prev + 1);
    }
  }, [formData.organizationType, currentStep]);

  const handlePrev = useCallback(() => {
    if (formData.organizationType === 'community-member' && currentStep === 4) {
      setCurrentStep(2); // Skip organization setup when going back (go from step 4 to step 2)
    } else {
      setCurrentStep(prev => prev - 1);
    }
  }, [formData.organizationType, currentStep]);

  // Form submission
  const handleSubmit = async () => {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      console.log('🚀 Starting signup process with data:', formData);

      // Create user account
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName
          }
        }
      });

      if (signUpError) {
        throw new Error(`Account creation failed: ${signUpError.message}`);
      }

      if (!authData.user) {
        throw new Error('No user data returned from signup');
      }

      const userId = authData.user.id;
      console.log('✅ User account created:', userId);

      // Check if a session was created (email confirmation not required)
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        console.log('✅ Session created, no email confirmation required');
      } else {
        console.log('📧 Email confirmation required');
      }

      // Upload avatar if provided
      let avatarUrl = null;
      if (formData.avatar) {
        console.log('📸 Uploading avatar...');
        if (typeof formData.avatar === 'string' && formData.avatar.startsWith('data:')) {
          const response = await fetch(formData.avatar);
          const blob = await response.blob();
          const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
          avatarUrl = await uploadAvatar(file);
        } else if (formData.avatar instanceof File) {
          avatarUrl = await uploadAvatar(formData.avatar);
        }
        console.log('✅ Avatar uploaded:', avatarUrl);
      }

      // Map organization types to role display names
      const roleMapping = {
        'nonprofit': 'Nonprofit',
        'government': 'Government', 
        'foundation': 'Funder',
        'for-profit': 'For-profit',
        'education': 'Education',
        'healthcare': 'Healthcare', 
        'religious': 'Religious',
        'international': 'International',
        'community-member': 'Community member'
      };

      // Create user profile with all signup data
      console.log('👤 Creating profile...');
      const profileData = {
        id: userId,
        full_name: formData.fullName,
        avatar_url: avatarUrl,
        role: roleMapping[formData.organizationType] || 'Community member',
        location: Array.isArray(formData.location) ? formData.location.join(', ') : (formData.location || ''),
        bio: Array.isArray(formData.interests) && formData.interests.length > 0 ? 'Interested in: ' + formData.interests.join(', ') : null,
        interests: Array.isArray(formData.interests) && formData.interests.length > 0 ? formData.interests : null,
        organization_type: formData.organizationType,
        organization_choice: formData.organizationChoice,
        selected_organization_id: formData.selectedOrgData?.id || null,
        selected_organization_type: formData.selectedOrgData?.type || null,
        follow_users: Array.isArray(formData.followUsers) && formData.followUsers.length > 0 ? formData.followUsers : null,
        onboarding_completed: true,
        signup_step_completed: 6
      };
      
      console.log('Profile data to insert:', profileData);

      // Check if profile already exists (from trigger)
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      console.log('Existing profile check:', { existingProfile, checkError });

      if (existingProfile) {
        console.log('Profile already exists from trigger, updating with full data...');
        const { error: updateError } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', userId);

        if (updateError) {
          console.error('Profile update error:', updateError);
          if (updateError.code === '42501' || (updateError.message && updateError.message.includes('row-level security'))) {
            setMessage('🎉 Account created! Please check your email to verify your account, then you can complete your profile setup.');
            setTimeout(() => {
              navigate('/login');
            }, 3000);
            return;
          } else {
            throw new Error(`Profile update failed: ${updateError.message}`);
          }
        }
        console.log('✅ Profile updated successfully');
      } else {
        console.log('Creating new profile...');
        const { error: authProfileError } = await supabase
          .from('profiles')
          .insert(profileData);

        if (authProfileError) {
          console.error('Authenticated profile creation failed:', authProfileError);
          
          if (authProfileError.code === '42501' || 
              (authProfileError.message && (
                authProfileError.message.includes('row-level security') ||
                authProfileError.message.includes('foreign key constraint')
              )) ||
              authProfileError.code === '23503' ||
              authProfileError.code === '23505') {
            setMessage('🎉 Account created! Please check your email to verify your account, then you can complete your profile setup.');
            setTimeout(() => {
              navigate('/login');
            }, 3000);
            return;
          } else {
            throw new Error(`Profile creation failed: ${authProfileError.message}`);
          }
        }
        console.log('✅ Profile created successfully');
      }

      // Handle organization creation/joining (skip for community members)
      if (formData.organizationType !== 'community-member') {
        if (formData.organizationChoice === 'create' && formData.newOrganization && formData.newOrganization.name) {
          console.log('🏢 Creating organization...');
          await createOrganization(formData.newOrganization, userId);
        } else if (formData.organizationChoice === 'join' && formData.selectedOrgData) {
          console.log('🤝 Joining organization...');
          await createOrganizationMembership(userId, formData.selectedOrgData);
        }
      }

      // Create follow relationships
      if (Array.isArray(formData.followUsers) && formData.followUsers.length > 0) {
        console.log('👥 Creating follow relationships...');
        try {
          await createFollowRelationships(userId, formData.followUsers);
        } catch (followError) {
          console.warn('Follow relationships failed, but continuing signup:', followError);
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

  // FIXED: Form validation
  const isStepValid = useCallback(() => {
    switch (currentStep) {
      case 1: 
        return !!(formData.fullName && 
               formData.email && 
               validateEmail(formData.email) &&
               formData.password && 
               formData.password.length >= 6);
      case 2: 
        return !!formData.organizationType;
      case 3: 
        // Skip organization setup validation for community members
        if (formData.organizationType === 'community-member') {
          return true;
        }
        
        if (!formData.organizationChoice) return false;
        if (formData.organizationChoice === 'join') {
          return !!formData.selectedOrgData;
        }
        if (formData.organizationChoice === 'create') {
          // Validate required fields for organization creation
          const orgValid = !!(formData.newOrganization && formData.newOrganization.name);
          // For all organization types, just require name and taxonomy selection
          return orgValid && !!formData.taxonomyCode;
        }
        return false;
      case 4: 
        return !!(formData.location && Array.isArray(formData.location) && formData.location.length > 0);
      case 5:
        return true; // Interests are optional
      case 6:
        return true; // Follow users is optional
      default: 
        return false;
    }
  }, [formData, currentStep]);

  const totalSteps = useCallback(() => {
    if (formData.organizationType === 'community-member') return 5;
    return 6;
  }, [formData.organizationType]);

  const getCurrentStepNumber = useCallback(() => {
    if (formData.organizationType === 'community-member') {
      if (currentStep === 4) return 3;
      if (currentStep === 5) return 4;
      if (currentStep === 6) return 5;
    }
    return currentStep;
  }, [formData.organizationType, currentStep]);

  const renderStep = useCallback(() => {
    switch (currentStep) {
      case 1:
        return <PersonalInfoStep formData={formData} updateFormData={updateFormData} />;
      case 2:
        return <OrganizationTypeStep formData={formData} updateFormData={updateFormData} />;
      case 3:
        // Skip organization setup for community members
        if (formData.organizationType === 'community-member') {
          return <LocationStep formData={formData} updateFormData={updateFormData} />;
        }
        return <OrganizationSetupStep formData={formData} updateFormData={updateFormData} />;
      case 4:
        if (formData.organizationType === 'community-member') {
          return <InterestsStep formData={formData} updateFormData={updateFormData} />;
        }
        return <LocationStep formData={formData} updateFormData={updateFormData} />;
      case 5:
        if (formData.organizationType === 'community-member') {
          return <FollowUsersStep formData={formData} updateFormData={updateFormData} />;
        }
        return <InterestsStep formData={formData} updateFormData={updateFormData} />;
      case 6:
        return <FollowUsersStep formData={formData} updateFormData={updateFormData} />;
      default:
        return <PersonalInfoStep formData={formData} updateFormData={updateFormData} />;
    }
  }, [currentStep, formData, updateFormData]);

  console.log('SignUpWizard render - currentStep:', currentStep, 'formData.fullName:', formData.fullName);

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