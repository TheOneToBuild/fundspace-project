// src/components/auth/MinimalSignupForm.jsx - Redesigned
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Heart, CheckCircle2 } from '../Icons.jsx';
import { supabase } from '../../supabaseClient.js';
import MessageDisplay from './shared/MessageDisplay';

export default function MinimalSignupForm({ onSwitchToLogin, onSignupSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear errors when user starts typing
    if (error) setError('');
  };

  const validateEmail = (email) => {
    return email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };

  const isFormValid = () => {
    return formData.fullName.trim() && 
           formData.email && 
           formData.password && 
           formData.confirmPassword &&
           validateEmail(formData.email) &&
           formData.password.length >= 6 &&
           formData.password === formData.confirmPassword;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) return;
    
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName.trim(),
          }
        }
      });
      
      if (error) {
        if (error.message.includes('already registered')) {
          setError('This email is already registered. Try signing in instead!');
        } else {
          setError(error.message);
        }
        return;
      }
      
      setMessage('Welcome to the community! Please check your email and click the confirmation link to get started.');
      onSignupSuccess();
      
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold text-slate-900 mb-3">
          Welcome to the party! 
          <motion.span
            className="inline-block ml-2"
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0]
            }}
            transition={{ duration: 2, delay: 0.5, repeat: Infinity, repeatDelay: 4 }}
          >
            🎉
          </motion.span>
        </h1>
        <p className="text-slate-600 text-lg">
          Yay! We're so excited to have you join us. Let's get you started on your journey! 
          <span className="inline-block ml-1">✨</span>
        </p>
      </motion.div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Full Name *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User className={`w-5 h-5 transition-colors ${
                formData.fullName ? 'text-blue-500' : 'text-slate-400'
              }`} />
            </div>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:border-blue-500 focus:ring-blue-500/20 hover:border-slate-300 transition-all duration-200 bg-white/50 backdrop-blur-sm"
              placeholder="Your full name"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Email Address *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className={`w-5 h-5 transition-colors ${
                formData.email ? 'text-blue-500' : 'text-slate-400'
              }`} />
            </div>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:ring-4 transition-all duration-200 bg-white/50 backdrop-blur-sm ${
                formData.email && !validateEmail(formData.email)
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                  : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 hover:border-slate-300'
              }`}
              placeholder="you@example.com"
            />
          </div>
          {formData.email && !validateEmail(formData.email) && (
            <motion.p 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-600 mt-2"
            >
              Please enter a valid email address
            </motion.p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Password *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className={`w-5 h-5 transition-colors ${
                formData.password ? 'text-blue-500' : 'text-slate-400'
              }`} />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              className="w-full pl-12 pr-12 py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:border-blue-500 focus:ring-blue-500/20 hover:border-slate-300 transition-all duration-200 bg-white/50 backdrop-blur-sm"
              placeholder="Create a strong password"
              minLength="6"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-sm text-slate-500 mt-2">Minimum 6 characters</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Confirm Password *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <CheckCircle2 className={`w-5 h-5 transition-colors ${
                formData.confirmPassword && formData.password === formData.confirmPassword
                  ? 'text-green-500' 
                  : formData.confirmPassword 
                    ? 'text-red-500' 
                    : 'text-slate-400'
              }`} />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:ring-4 transition-all duration-200 bg-white/50 backdrop-blur-sm ${
                formData.confirmPassword && formData.password !== formData.confirmPassword
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                  : formData.confirmPassword && formData.password === formData.confirmPassword
                    ? 'border-green-300 focus:border-green-500 focus:ring-green-500/20'
                    : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 hover:border-slate-300'
              }`}
              placeholder="Type your password again"
            />
          </div>
          {formData.confirmPassword && formData.password !== formData.confirmPassword && (
            <motion.p 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-600 mt-2"
            >
              Passwords don't match
            </motion.p>
          )}
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          type="submit"
          disabled={!isFormValid() || loading}
          className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${
            isFormValid() && !loading
              ? 'bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
              : 'bg-slate-200 text-slate-500 cursor-not-allowed'
          }`}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center justify-center space-x-2">
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating Your Account...</span>
              </>
            ) : (
              <>
                <span>Join the Community!</span>
                <Heart className="w-5 h-5" />
              </>
            )}
          </div>
        </motion.button>
      </form>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="mt-8 text-center"
      >
        <p className="text-slate-600 mb-3">Already part of our community?</p>
        <button
          onClick={onSwitchToLogin}
          className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors group"
        >
          <span>Sign in to your account</span>
          <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
        </button>
      </motion.div>

      <MessageDisplay message={message} error={error} />
    </div>
  );
}