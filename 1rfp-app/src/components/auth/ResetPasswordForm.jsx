// src/components/auth/ResetPasswordForm.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, CheckCircle2, Sparkles } from '../Icons.jsx';
import { supabase } from '../../supabaseClient.js';
import MessageDisplay from './shared/MessageDisplay';

export default function ResetPasswordForm({ onResetSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    // Check if we have a valid session from the reset link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Reset password session check:', session);
      if (!session) {
        setError('Invalid or expired reset link. Please request a new password reset.');
      } else {
        console.log('Valid session found for password reset');
      }
    };
    
    checkSession();
  }, []);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) setError('');
  };

  const validatePassword = () => {
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    return true;
  };

  const isFormValid = () => {
    return formData.password && 
           formData.confirmPassword && 
           formData.password.length >= 6 &&
           formData.password === formData.confirmPassword;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePassword()) return;
    
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.password
      });
      
      if (error) {
        setError(error.message);
        return;
      }
      
      setIsPasswordReset(true);
      setMessage('Password updated successfully!');
      
      // Optionally call success handler after a delay
      setTimeout(() => {
        onResetSuccess?.();
      }, 2000);
      
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Password reset error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (isPasswordReset) {
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
            Password Updated!
            <motion.span
              className="inline-block ml-2"
              animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
              transition={{ duration: 2, delay: 0.5, repeat: Infinity, repeatDelay: 3 }}
            >
              🎉
            </motion.span>
          </h1>
          <p className="text-slate-600 text-lg mb-6">
            Your password has been successfully updated. You can now sign in with your new password.
          </p>
          
          <button
            onClick={onResetSuccess}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 px-8 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
          >
            Continue to Sign In
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
          Create New Password
          <motion.span
            className="inline-block ml-2"
            animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
            transition={{ duration: 2, delay: 0.5, repeat: Infinity, repeatDelay: 3 }}
          >
            🔐
          </motion.span>
        </h1>
        <p className="text-slate-600 text-lg">
          Choose a strong password for your account.
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            New Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className={`w-5 h-5 transition-colors ${
                formData.password ? 'text-blue-500' : 'text-slate-400'
              }`} />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              className="w-full pl-12 pr-12 py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:border-blue-500 focus:ring-blue-500/20 hover:border-slate-300 transition-all duration-200 bg-white/50 backdrop-blur-sm"
              placeholder="••••••••••"
              disabled={loading}
              minLength="6"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2">Minimum 6 characters</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Confirm New Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className={`w-5 h-5 transition-colors ${
                formData.confirmPassword ? 'text-blue-500' : 'text-slate-400'
              }`} />
            </div>
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              className="w-full pl-12 pr-12 py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:border-blue-500 focus:ring-blue-500/20 hover:border-slate-300 transition-all duration-200 bg-white/50 backdrop-blur-sm"
              placeholder="••••••••••"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          type="submit"
          disabled={loading || !isFormValid()}
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
                <span>Updating password...</span>
              </>
            ) : (
              <>
                <span>Update Password</span>
                <Sparkles className="w-5 h-5" />
              </>
            )}
          </div>
        </motion.button>
      </form>

      <MessageDisplay message={message} error={error} />
    </div>
  );
}