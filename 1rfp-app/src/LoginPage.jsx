// src/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import AuthLayout from './components/auth/AuthLayout';
import LoginForm from './components/auth/LoginForm';
import SignUpWizard from './components/auth/SignUpWizard';

export default function LoginPage() {
  const [view, setView] = useState('sign_in'); // 'sign_in' or 'sign_up'
  const navigate = useNavigate();
  const location = useLocation();
  const { session, profile, loading } = useOutletContext();

  // Get the intended destination from state, default to profile
  const from = location.state?.from?.pathname || '/profile';

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

  // Handler for successful signup - called by SignUpWizard  
  const handleSignupSuccess = () => {
    console.log('Signup successful, redirecting to profile');
    navigate('/profile', { replace: true });
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

  return (
    <AuthLayout>
      {view === 'sign_in' ? (
        <LoginForm 
          onSwitchToSignUp={() => setView('sign_up')}
          onLoginSuccess={handleLoginSuccess}
        />
      ) : (
        <SignUpWizard 
          onSwitchToLogin={() => setView('sign_in')}
          onSignupSuccess={handleSignupSuccess}
        />
      )}
    </AuthLayout>
  );
}