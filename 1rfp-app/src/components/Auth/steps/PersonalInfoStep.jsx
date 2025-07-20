// src/components/auth/steps/PersonalInfoStep.jsx - Real Data Integration
import React, { useState } from 'react';
import { Upload, X, Eye, EyeOff } from 'lucide-react';

export default function PersonalInfoStep({ formData, updateFormData }) {
  const [emailError, setEmailError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [uploading, setUploading] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e) => {
    const email = e.target.value;
    updateFormData('email', email);
    
    // Validate email in real-time
    if (email && !validateEmail(email)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      setUploading(true);
      
      try {
        // For now, we'll store the file object directly
        // The actual upload happens during account creation
        updateFormData('avatar', file);
        
        // Create preview URL for display
        const reader = new FileReader();
        reader.onload = (e) => {
          updateFormData('avatarPreview', e.target.result);
        };
        reader.readAsDataURL(file);
        
      } catch (error) {
        console.error('Error processing file:', error);
        alert('Error processing file. Please try again.');
      } finally {
        setUploading(false);
      }
    }
  };

  const removePhoto = () => {
    updateFormData('avatar', null);
    updateFormData('avatarPreview', null);
    // Clear the file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const getAvatarDisplay = () => {
    // Show preview if available (from file upload)
    if (formData.avatarPreview) {
      return (
        <img 
          src={formData.avatarPreview} 
          alt="Avatar Preview" 
          className="w-full h-full rounded-full object-cover" 
        />
      );
    }
    
    // Show existing avatar URL if available
    if (formData.avatar && typeof formData.avatar === 'string') {
      return (
        <img 
          src={formData.avatar} 
          alt="Avatar" 
          className="w-full h-full rounded-full object-cover" 
        />
      );
    }
    
    // Show upload icon
    return <Upload className="w-6 h-6 text-slate-400" />;
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Tell us about you ✨</h1>
        <p className="text-slate-600">Let's get you set up to make an impact</p>
      </div>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Full name *
          </label>
          <input
            type="text"
            required
            value={formData.fullName || ''}
            onChange={(e) => updateFormData('fullName', e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Your full name"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Email address *
          </label>
          <input
            type="email"
            required
            value={formData.email || ''}
            onChange={handleEmailChange}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-blue-500 transition-colors ${
              emailError 
                ? 'border-red-300 focus:ring-red-500' 
                : 'border-slate-300 focus:ring-blue-500'
            }`}
            placeholder="you@example.com"
          />
          {emailError && (
            <p className="text-xs text-red-600 mt-1">{emailError}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Password *
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={formData.password || ''}
              onChange={(e) => updateFormData('password', e.target.value)}
              className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Create a strong password"
              minLength="6"
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1">Minimum 6 characters</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Profile photo (optional)
          </label>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300 relative overflow-hidden">
              {(formData.avatar || formData.avatarPreview) ? (
                <>
                  {getAvatarDisplay()}
                  <button
                    onClick={removePhoto}
                    disabled={uploading}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors disabled:opacity-50"
                    type="button"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </>
              ) : (
                getAvatarDisplay()
              )}
              {uploading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
                className="block w-full text-sm text-slate-600
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-medium
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  disabled:opacity-50
                  cursor-pointer file:cursor-pointer"
              />
              <p className="text-xs text-slate-500 mt-1">
                PNG, JPG up to 2MB
                {uploading && ' • Uploading...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}