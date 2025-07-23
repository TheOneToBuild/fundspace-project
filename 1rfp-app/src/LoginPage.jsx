// src/LoginPage.jsx - Updated to support both minimal and full signup
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import AuthLayout from './components/auth/AuthLayout';
import LoginForm from './components/auth/LoginForm';
import MinimalSignupForm from './components/auth/MinimalSignupForm';
import SignUpWizard from './components/auth/SignUpWizard';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, profile, loading } = useOutletContext();

  // Check URL parameters to determine initial view
  const urlParams = new URLSearchParams(location.search);
  const viewParam = urlParams.get('view');
  
  // Determine initial view - simplified to just sign_in or signup
  const getInitialView = () => {
    return viewParam === 'signup' ? 'signup' : 'sign_in';
  };
  
  const [view, setView] = useState(getInitialView());

  // Get the intended destination from state, default to profile
  const from = location.state?.from?.pathname || '/profile';

  // Update view when URL parameters change
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const viewParam = urlParams.get('view');
    
    setView(viewParam === 'signup' ? 'signup' : 'sign_in');
  }, [location.search]);

  // If already logged in, redirect immediately
  useEffect(() => {
    if (!loading && session && profile) {
      console.log('User is already logged in, redirecting to:', from);
      navigate(from, { replace: true });
    }
  }, [session, profile, loading, navigate, from]);

  // Handler for successful login - called by LoginForm
  const handleLoginSuccess = () => {
    console.log('Login successful, will redirect via useEffect');
    // Navigation will happen automatically via useEffect when session updates
  };

  // Handler for successful signup
  const handleSignupSuccess = () => {
    console.log('Signup successful');
    // Show success message and stay on this page
    // User will need to verify email before proceeding
  };

  // Handler to switch to signup view
  const handleSwitchToSignUp = () => {
    setView('signup');
    navigate('/login?view=signup', { replace: true });
  };

  // Handler to switch to login view
  const handleSwitchToLogin = () => {
    setView('sign_in');
    navigate('/login', { replace: true });
  };

  // Don't render anything while loading or if already authenticated
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (session && profile) {
    return null; // Will redirect via useEffect
  }

  const renderAuthForm = () => {
    switch (view) {
      case 'sign_in':
        return (
          <LoginForm 
            onSwitchToSignUp={handleSwitchToSignUp}
            onLoginSuccess={handleLoginSuccess}
          />
        );
      
      case 'signup':
        return (
          <MinimalSignupForm 
            onSwitchToLogin={handleSwitchToLogin}
            onSignupSuccess={handleSignupSuccess}
          />
        );
      
      default:
        return (
          <LoginForm 
            onSwitchToSignUp={handleSwitchToSignUp}
            onLoginSuccess={handleLoginSuccess}
          />
        );
    }
  };

  return (
    <AuthLayout>
      {renderAuthForm()}
    </AuthLayout>
  );
}