// src/components/Auth/SignUpWizard.jsx - Updated with New Flow
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import PersonalInfoStep from './steps/PersonalInfoStep';
import OrganizationSearchStep from './steps/OrganizationSearchStep';
import OrganizationTypeSelectionStep from './steps/OrganizationTypeSelectionStep';
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
    
    // Organization search/choice
    organizationChoice: '', // 'join', 'create', or 'community'
    selectedOrgData: null,
    
    // Organization creation (only for create choice)
    organizationType: '', // Set after organization search or type selection
    newOrganization: {
      name: '',
      description: '',
      tagline: '',
      website: '',
      location: '',
      contactEmail: '',
      budget: '',
      staffCount: '',
      yearFounded: '',
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

  // Session storage for persistence
  useEffect(() => {
    // Load saved form data on component mount
    const savedData = sessionStorage.getItem('signupFormData');
    const savedStep = sessionStorage.getItem('signupCurrentStep');
    
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setFormData(parsedData);
      } catch (error) {
        console.warn('Failed to parse saved form data:', error);
      }
    }
    
    if (savedStep) {
      const step = parseInt(savedStep, 10);
      if (step >= 1 && step <= 7) {
        setCurrentStep(step);
      }
    }
  }, []);

  // Save form data to session storage whenever it changes
  useEffect(() => {
    sessionStorage.setItem('signupFormData', JSON.stringify(formData));
    sessionStorage.setItem('signupCurrentStep', currentStep.toString());
  }, [formData, currentStep]);

  // Form data update handler
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
  }, []);

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
        organization_type: selectedOrgData.type,
        role: 'member'
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
    // Dynamic step navigation based on user choices
    if (currentStep === 2) {
      // After organization search step
      if (formData.organizationChoice === 'community' || formData.organizationChoice === 'join') {
        setCurrentStep(5); // Skip to location step for community members and joiners
      } else if (formData.organizationChoice === 'create') {
        setCurrentStep(3); // Go to organization type selection
      }
    } else if (currentStep === 3) {
      // After organization type selection (only for create)
      setCurrentStep(4); // Go to organization setup
    } else if (currentStep === 5 && (formData.organizationChoice === 'community' || formData.organizationChoice === 'join')) {
      setCurrentStep(6); // From location to interests for community/join
    } else if (currentStep === 6 && (formData.organizationChoice === 'community' || formData.organizationChoice === 'join')) {
      setCurrentStep(7); // From interests to follow for community/join
    } else {
      setCurrentStep(prev => prev + 1);
    }
    
    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [formData.organizationChoice, currentStep]);

  const handlePrev = useCallback(() => {
    // Dynamic step navigation going backwards
    if (currentStep === 5 && (formData.organizationChoice === 'community' || formData.organizationChoice === 'join')) {
      setCurrentStep(2); // Back to organization search
    } else if (currentStep === 6 && (formData.organizationChoice === 'community' || formData.organizationChoice === 'join')) {
      setCurrentStep(5); // Back to location for community/join
    } else if (currentStep === 7 && (formData.organizationChoice === 'community' || formData.organizationChoice === 'join')) {
      setCurrentStep(6); // Back to interests for community/join
    } else if (currentStep === 4 && formData.organizationChoice === 'create') {
      setCurrentStep(3); // Back to organization type selection
    } else if (currentStep === 3 && formData.organizationChoice === 'create') {
      setCurrentStep(2); // Back to organization search
    } else {
      setCurrentStep(prev => prev - 1);
    }
    
    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [formData.organizationChoice, currentStep]);

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

      // Create user profile
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
        signup_step_completed: 7
      };

      // Check if profile already exists and update or create
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (existingProfile) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', userId);

        if (updateError && updateError.code !== '42501') {
          throw new Error(`Profile update failed: ${updateError.message}`);
        }
      } else {
        const { error: createError } = await supabase
          .from('profiles')
          .insert(profileData);

        if (createError && createError.code !== '42501') {
          throw new Error(`Profile creation failed: ${createError.message}`);
        }
      }

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
          console.warn('Follow relationships failed, but continuing signup:', followError);
        }
      }

      // Clear session storage on successful signup
      sessionStorage.removeItem('signupFormData');
      sessionStorage.removeItem('signupCurrentStep');

      // Success message
      setMessage('🎉 Welcome to 1RFP! Your account has been created successfully. Please check your email to verify your account.');
      
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

  // Form validation
  const isStepValid = useCallback(() => {
    switch (currentStep) {
      case 1: 
        return !!(formData.fullName && 
               formData.email && 
               validateEmail(formData.email) &&
               formData.password && 
               formData.password.length >= 6);
      case 2: 
        return !!formData.organizationChoice;
      case 3: 
        // Organization type selection (only for create)
        return formData.organizationChoice !== 'create' || !!formData.organizationType;
      case 4: 
        // Organization setup (only for create)
        if (formData.organizationChoice !== 'create') return true;
        return !!(formData.newOrganization?.name && formData.taxonomyCode);
      case 5: 
        return !!(formData.location && Array.isArray(formData.location) && formData.location.length > 0);
      case 6:
        return true; // Interests are optional
      case 7:
        return true; // Follow users is optional
      default: 
        return false;
    }
  }, [formData, currentStep]);

  // Calculate total steps based on user choices
  const getTotalSteps = useCallback(() => {
    if (formData.organizationChoice === 'community' || formData.organizationChoice === 'join') {
      return 5; // Steps: 1(account), 2(org search), 5(location), 6(interests), 7(follow) = 5 total
    }
    return 7; // Full flow for create
  }, [formData.organizationChoice]);

  // Get current step number for display
  const getCurrentStepNumber = useCallback(() => {
    if (formData.organizationChoice === 'community' || formData.organizationChoice === 'join') {
      if (currentStep === 5) return 3; // Location becomes step 3
      if (currentStep === 6) return 4; // Interests becomes step 4  
      if (currentStep === 7) return 5; // Follow becomes step 5
    }
    return currentStep;
  }, [formData.organizationChoice, currentStep]);

  const renderStep = useCallback(() => {
    switch (currentStep) {
      case 1:
        return <PersonalInfoStep formData={formData} updateFormData={updateFormData} />;
      case 2:
        return <OrganizationSearchStep formData={formData} updateFormData={updateFormData} />;
      case 3:
        return <OrganizationTypeSelectionStep formData={formData} updateFormData={updateFormData} />;
      case 4:
        return <OrganizationSetupStep formData={formData} updateFormData={updateFormData} />;
      case 5:
        return <LocationStep formData={formData} updateFormData={updateFormData} />;
      case 6:
        return <InterestsStep formData={formData} updateFormData={updateFormData} />;
      case 7:
        return <FollowUsersStep formData={formData} updateFormData={updateFormData} />;
      default:
        return <PersonalInfoStep formData={formData} updateFormData={updateFormData} />;
    }
  }, [currentStep, formData, updateFormData]);

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Account Information';
      case 2: return 'Find Your Organization';
      case 3: return 'Organization Type';
      case 4: return 'Organization Setup';
      case 5: return 'Location';
      case 6: return 'Interests';
      case 7: return 'Follow Users';
      default: return 'Setup';
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h2 className="text-sm font-medium text-slate-500 tracking-wide uppercase">
          Step {getCurrentStepNumber()} of {getTotalSteps()} • {getStepTitle()}
        </h2>
      </div>

      <div className="mb-10">
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(getCurrentStepNumber() / getTotalSteps()) * 100}%` }}
          />
        </div>
      </div>

      {renderStep()}
      
      <NavigationButtons
        currentStep={currentStep}
        totalSteps={getTotalSteps()}
        onPrev={currentStep === 1 ? onSwitchToLogin : handlePrev}
        onNext={getCurrentStepNumber() === getTotalSteps() ? handleSubmit : handleNext}
        isValid={isStepValid()}
        loading={loading}
        prevLabel={currentStep === 1 ? 'Back to Sign In' : 'Back'}
        nextLabel={getCurrentStepNumber() === getTotalSteps() ? '🚀 Create Account' : 'Next'}
      />

      <MessageDisplay message={message} error={error} />
    </div>
  );
}