// src/components/auth/MinimalSignupForm.jsx
import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Eye, EyeOff } from 'lucide-react';
import MessageDisplay from './shared/MessageDisplay';

export default function MinimalSignupForm({ onSwitchToLogin, onSignupSuccess }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear errors when user starts typing
    if (error) setError('');
  };

  const isFormValid = () => {
    return formData.fullName.trim() && 
           formData.email.trim() && 
           validateEmail(formData.email) &&
           formData.password.length >= 6 &&
           formData.password === formData.confirmPassword;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      console.log('🚀 Starting minimal signup...');

      // Create user account with minimal data
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
        throw new Error(signUpError.message);
      }

      if (!authData.user) {
        throw new Error('No user data returned from signup');
      }

      console.log('✅ User account created:', authData.user.id);

      // Create minimal profile entry (this should work even without email verification)
      // We'll just mark onboarding as incomplete
      const minimalProfile = {
        id: authData.user.id,
        full_name: formData.fullName,
        onboarding_completed: false,
        signup_step_completed: 1 // Only completed basic signup
      };

      // Try to create profile, but don't fail if it doesn't work due to RLS
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(minimalProfile, { onConflict: 'id' });

        if (profileError) {
          console.warn('Profile creation failed (expected due to RLS):', profileError);
        } else {
          console.log('✅ Minimal profile created');
        }
      } catch (profileError) {
        console.warn('Profile creation failed (expected due to RLS):', profileError);
      }

      // Success! Show verification message
      setMessage('🎉 Woohoo! Your account is ready to rock! Check your email for a magical verification link to complete the party setup! ✨📧');
      
      // Clear the form
      setFormData({ fullName: '', email: '', password: '', confirmPassword: '' });
      
      // Call success callback after a delay
      setTimeout(() => {
        if (onSignupSuccess) {
          onSignupSuccess();
        }
      }, 2000);

    } catch (err) {
      console.error('❌ Signup error:', err);
      setError(err.message || 'An error occurred during signup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">
          Welcome to the party! 🎉
        </h2>
        <p className="text-slate-600">
          Yay! We're so excited to have you join us. Let's get you started on your impact journey! ✨
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            required
            value={formData.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 transition-colors ${
              formData.email && !validateEmail(formData.email) 
                ? 'border-red-300 focus:ring-red-500' 
                : 'border-slate-300 focus:ring-blue-500'
            }`}
            placeholder="you@example.com"
          />
          {formData.email && !validateEmail(formData.email) && (
            <p className="text-xs text-red-600 mt-1">Please enter a valid email address</p>
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
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Create a strong password"
              minLength="6"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
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
            Confirm Password *
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 transition-colors ${
                formData.confirmPassword && formData.password !== formData.confirmPassword
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-slate-300 focus:ring-blue-500'
              }`}
              placeholder="Type your password again"
            />
          </div>
          {formData.confirmPassword && formData.password !== formData.confirmPassword && (
            <p className="text-xs text-red-600 mt-1">Passwords don't match</p>
          )}
        </div>

        <button
          type="submit"
          disabled={!isFormValid() || loading}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            isFormValid() && !loading
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-slate-300 text-slate-500 cursor-not-allowed'
          }`}
        >
          {loading ? 'Creating Your Account...' : 'Join the Community! 🚀'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-slate-600">
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Sign in →
          </button>
        </p>
      </div>

      <MessageDisplay message={message} error={error} />
    </div>
  );
}