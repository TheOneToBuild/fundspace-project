// src/components/auth/LoginForm.jsx - Redesigned
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Sparkles } from '../Icons.jsx';
import { supabase } from '../../supabaseClient.js';
import MessageDisplay from './shared/MessageDisplay';

export default function LoginForm({ onSwitchToSignUp, onSwitchToForgotPassword, onLoginSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
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
    return formData.email && 
           formData.password && 
           validateEmail(formData.email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) return;
    
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password,
      });
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Please check your email and click the confirmation link before signing in.');
        } else {
          setError(error.message);
        }
        return;
      }
      
      // Call the success handler
      onLoginSuccess();
      
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
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
          Welcome Back! 
          <motion.span
            className="inline-block ml-2"
            animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
            transition={{ duration: 2, delay: 0.5, repeat: Infinity, repeatDelay: 3 }}
          >
            👋
          </motion.span>
        </h1>
        <p className="text-slate-600 text-lg">
          Ready to continue building impact together?
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
              className="text-sm text-red-600 mt-2 flex items-center"
            >
              Please enter a valid email address
            </motion.p>
          )}
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-semibold text-slate-700">
              Password
            </label>
            <button
              type="button"
              onClick={onSwitchToForgotPassword}
              className="text-xs text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              Forgot password?
            </button>
          </div>
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
              placeholder="••••••••••"
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
        </motion.div>
        
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          type="submit"
          disabled={!isFormValid() || loading}
          className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${
            isFormValid() && !loading
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
              : 'bg-slate-200 text-slate-500 cursor-not-allowed'
          }`}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center justify-center space-x-2">
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Signing you in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <Sparkles className="w-5 h-5" />
              </>
            )}
          </div>
        </motion.button>
      </form>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-8 text-center"
      >
        <p className="text-slate-600 mb-3">New to our community?</p>
        <button
          onClick={onSwitchToSignUp}
          className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors group"
        >
          <span>Join the crew!</span>
          <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
        </button>
      </motion.div>

      <MessageDisplay message={message} error={error} />
    </div>
  );
}