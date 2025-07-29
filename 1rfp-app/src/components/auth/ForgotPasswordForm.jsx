// src/components/auth/ForgotPasswordForm.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle2 } from '../Icons.jsx';
import { supabase } from '../../supabaseClient.js';
import MessageDisplay from './shared/MessageDisplay';

export default function ForgotPasswordForm({ onSwitchToLogin }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setIsEmailSent(true);
      setMessage('Password reset email sent! Check your inbox and follow the instructions.');
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Password reset error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <div className="w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </motion.div>

          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            Check Your Email!
            <motion.span
              className="inline-block ml-2"
              animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
              transition={{ duration: 2, delay: 0.5, repeat: Infinity, repeatDelay: 3 }}
            >
              📧
            </motion.span>
          </h1>
          <p className="text-slate-600 text-lg mb-6">
            We've sent password reset instructions to <strong>{email}</strong>
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
            <p className="text-sm text-blue-800 text-left">
              <strong>Next steps:</strong><br />
              1. Check your email inbox<br />
              2. Click the reset link in the email<br />
              3. Create your new password
            </p>
          </div>

          <button
            onClick={onSwitchToLogin}
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
            <span>Back to Sign In</span>
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold text-slate-900 mb-3">
          Forgot Password?
          <motion.span
            className="inline-block ml-2"
            animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
            transition={{ duration: 2, delay: 0.5, repeat: Infinity, repeatDelay: 3 }}
          >
            🤔
          </motion.span>
        </h1>
        <p className="text-slate-600 text-lg">
          No worries! Enter your email and we'll send you reset instructions.
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className={`w-5 h-5 transition-colors ${
                email ? 'text-blue-500' : 'text-slate-400'
              }`} />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:ring-4 transition-all duration-200 bg-white/50 backdrop-blur-sm ${
                email && !validateEmail(email)
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                  : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 hover:border-slate-300'
              }`}
              placeholder="you@example.com"
              disabled={loading}
            />
          </div>
          {email && !validateEmail(email) && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-600 mt-2 flex items-center"
            >
              Please enter a valid email address
            </motion.p>
          )}
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          type="submit"
          disabled={loading || !email.trim() || (email && !validateEmail(email))}
          className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${
            email.trim() && validateEmail(email) && !loading
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
              : 'bg-slate-200 text-slate-500 cursor-not-allowed'
          }`}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center justify-center space-x-2">
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Sending reset email...</span>
              </>
            ) : (
              <>
                <span>Send Reset Email</span>
              </>
            )}
          </div>
        </motion.button>
      </form>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mt-8 text-center"
      >
        <button
          onClick={onSwitchToLogin}
          className="inline-flex items-center space-x-2 text-slate-600 hover:text-slate-800 font-medium transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
          <span>Back to Sign In</span>
        </button>
      </motion.div>

      <MessageDisplay message={message} error={error} />
    </div>
  );
}