// src/ResetPasswordPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import ResetPasswordForm from './components/auth/ResetPasswordForm';
import AuthLayout from './components/auth/AuthLayout';

export default function ResetPasswordPage() {
  const navigate = useNavigate();

  const handleResetSuccess = () => {
    // Redirect to login page after successful password reset
    navigate('/login', { 
      state: { message: 'Password updated successfully! You can now sign in.' }
    });
  };

  return (
    <AuthLayout>
      <ResetPasswordForm onResetSuccess={handleResetSuccess} />
    </AuthLayout>
  );
}