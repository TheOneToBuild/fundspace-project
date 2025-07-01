// src/components/Auth.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // Make sure the path is correct

// A simple user avatar component
const UserAvatar = ({ email }) => {
  const initial = email ? email.charAt(0).toUpperCase() : '?';
  return (
    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
      {initial}
    </div>
  );
};

// The main authentication component
export default function Auth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [view, setView] = useState('sign_in'); // can be 'sign_in', 'sign_up', or 'forgot_password'
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Check for an existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for changes in auth state (like login or logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Cleanup the subscription when the component unmounts
    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      setError(error.message);
    } 
    setLoading(false);
  };
  
  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      setError(error.message);
    } else if (data.user && data.user.identities && data.user.identities.length === 0) {
      setError("This user already exists. Please sign in.");
    } else {
        setMessage('Check your email for the confirmation link!');
    }
    setLoading(false);
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  // If there's an active session, show the user info and logout button
  if (session) {
    return (
      <div className="flex items-center space-x-3">
        <UserAvatar email={session.user.email} />
        <button
          onClick={signOut}
          className="px-4 py-2 text-sm font-medium rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          Sign Out
        </button>
      </div>
    );
  }
  
  // If no session, show the login UI in a modal-like popup
  // This uses a simple dropdown-like approach for the UI
  return (
    <div className="relative">
      <div className="dropdown dropdown-end">
        <label tabIndex={0} className="btn btn-ghost rounded-btn">
          <div className="px-4 py-2 text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-sm">
            Sign In
          </div>
        </label>
        <div tabIndex={0} className="dropdown-content z-[1] menu p-4 shadow-lg bg-white rounded-box w-80 mt-2 border border-slate-200">
          <h3 className="font-bold text-lg mb-4 text-center">
            {view === 'sign_in' ? 'Welcome Back!' : 'Create an Account'}
          </h3>
          
          {/* Email/Password Form */}
          <form onSubmit={view === 'sign_in' ? handleLogin : handleSignUp} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-600 block mb-1">Email</label>
              <input
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                type="email"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 block mb-1">Password</label>
              <input
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                type="password"
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition"
            >
              {loading ? 'Processing...' : (view === 'sign_in' ? 'Sign In' : 'Sign Up')}
            </button>
          </form>

          {message && <p className="text-green-600 text-sm mt-4 text-center">{message}</p>}
          {error && <p className="text-red-600 text-sm mt-4 text-center">{error}</p>}
          
          <div className="text-center my-4">
             <button onClick={() => setView(view === 'sign_in' ? 'sign_up' : 'sign_in')} className="text-sm text-blue-600 hover:underline">
              {view === 'sign_in' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
            </button>
          </div>
          
          {/* Divider */}
          <div className="flex items-center my-4">
            <hr className="flex-grow border-t border-slate-200"/>
            <span className="px-2 text-xs text-slate-500">OR</span>
            <hr className="flex-grow border-t border-slate-200"/>
          </div>

          {/* Google Sign In */}
          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="w-full inline-flex items-center justify-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-all duration-200 ease-in-out shadow-sm disabled:opacity-50"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.651-3.657-11.303-8H6.306C9.656,39.663,16.318,44,24,44z"></path>
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.089,5.571l6.19,5.238C41.38,36.128,44,30.638,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
}
