// src/LoginPage.jsx
import React, { useState } from 'react';
import AuthLayout from './components/auth/AuthLayout';
import LoginForm from './components/auth/LoginForm';
import SignUpWizard from './components/auth/SignUpWizard';

export default function LoginPage() {
  const [view, setView] = useState('sign_in'); // 'sign_in' or 'sign_up'

  return (
    <AuthLayout>
      {view === 'sign_in' ? (
        <LoginForm onSwitchToSignUp={() => setView('sign_up')} />
      ) : (
        <SignUpWizard onSwitchToLogin={() => setView('sign_in')} />
      )}
    </AuthLayout>
  );
}