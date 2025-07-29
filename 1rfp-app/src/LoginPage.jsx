// src/LoginPage.jsx - Updated with forgot password support
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import AuthLayout from './components/auth/AuthLayout';
import LoginForm from './components/Auth/LoginForm';
import MinimalSignupForm from './components/auth/MinimalSignupForm';
import ForgotPasswordForm from './components/auth/ForgotPasswordForm';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, profile, loading } = useOutletContext();

  // Check URL parameters to determine initial view
  const urlParams = new URLSearchParams(location.search);
  const viewParam = urlParams.get('view');
  
  // Determine initial view - now includes forgot-password
  const getInitialView = () => {
    if (viewParam === 'signup') return 'signup';
    if (viewParam === 'forgot-password') return 'forgot-password';
    return 'sign_in';
  };
  
  const [view, setView] = useState(getInitialView());

  // Get the intended destination from state, default to profile
  const from = location.state?.from?.pathname || '/profile';

  // Update view when URL parameters change
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const viewParam = urlParams.get('view');
    
    if (viewParam === 'signup') {
      setView('signup');
    } else if (viewParam === 'forgot-password') {
      setView('forgot-password');
    } else {
      setView('sign_in');
    }
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

  // Handler to switch to forgot password view
  const handleSwitchToForgotPassword = () => {
    setView('forgot-password');
    navigate('/login?view=forgot-password', { replace: true });
  };

  // Enhanced loading screen with modern design
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-blue-200/20 to-indigo-300/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-tr from-purple-200/20 to-pink-300/20 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>

        <motion.div 
          className="text-center relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-6"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.p 
            className="text-slate-700 text-lg font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Preparing your experience...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  if (session && profile) {
    return null; // Will redirect via useEffect
  }

  return (
    <AuthLayout>
      <motion.div
        key={view} // This will trigger re-animation when view changes
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        {view === 'sign_in' && (
          <LoginForm
            onSwitchToSignUp={handleSwitchToSignUp}
            onSwitchToForgotPassword={handleSwitchToForgotPassword}
            onLoginSuccess={handleLoginSuccess}
          />
        )}

        {view === 'signup' && (
          <MinimalSignupForm
            onSwitchToLogin={handleSwitchToLogin}
            onSignupSuccess={handleSignupSuccess}
          />
        )}

        {view === 'forgot-password' && (
          <ForgotPasswordForm
            onSwitchToLogin={handleSwitchToLogin}
          />
        )}
      </motion.div>
    </AuthLayout>
  );
}