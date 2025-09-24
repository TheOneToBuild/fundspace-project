import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import AuthLayout from './components/auth/AuthLayout';
import LoginForm from './components/auth/LoginForm';
import MinimalSignupForm from './components/auth/MinimalSignupForm';
import ForgotPasswordForm from './components/auth/ForgotPasswordForm';
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, profile, loading } = useOutletContext();
  const urlParams = new URLSearchParams(location.search);
  const initialView = useMemo(() => {
    const viewParam = urlParams.get('view');
    switch (viewParam) {
      case 'signup':
        return 'signup';
      case 'forgot-password':
        return 'forgot-password';
      default:
        return 'sign_in';
    }
  }, [urlParams]);
  const [view, setView] = useState(initialView);
  const from = location.state?.from?.pathname || '/profile';
  useEffect(() => {
    if (!loading && session && profile) {
      navigate(from, { replace: true });
    }
  }, [session, profile, loading, navigate, from]);
  useEffect(() => {
    const viewParam = new URLSearchParams(location.search).get('view');
    switch (viewParam) {
      case 'signup':
        setView('signup');
        break;
      case 'forgot-password':
        setView('forgot-password');
        break;
      default:
        setView('sign_in');
        break;
    }
  }, [location.search]);
  const handleSwitchView = (newView, urlSuffix = '') => {
    setView(newView);
    navigate(`/login${urlSuffix}`, { replace: true });
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf7f4] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-blue-200/20 to-indigo-300/20 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-tr from-purple-200/20 to-pink-300/20 rounded-full blur-3xl"
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
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
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
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
    return null;
  }
  return (
    <div className="min-h-screen bg-[#faf7f4]">
      <AuthLayout>
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {view === 'sign_in' && (
            <LoginForm
              onSwitchToSignUp={() => handleSwitchView('signup', '?view=signup')}
              onSwitchToForgotPassword={() => handleSwitchView('forgot-password', '?view=forgot-password')}
              onLoginSuccess={() => {}}
            />
          )}
          {view === 'signup' && (
            <MinimalSignupForm
              onSwitchToLogin={() => handleSwitchView('sign_in')}
              onSignupSuccess={() => {}}
            />
          )}
          {view === 'forgot-password' && (
            <ForgotPasswordForm
              onSwitchToLogin={() => handleSwitchView('sign_in')}
            />
          )}
        </motion.div>
      </AuthLayout>
    </div>
  );
}