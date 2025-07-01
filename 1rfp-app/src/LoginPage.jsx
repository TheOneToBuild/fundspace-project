// src/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';
import headerLogoImage from './assets/1rfp-logo.png';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // --- New state for additional user info ---
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Nonprofit'); // Default role
  const [title, setTitle] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  
  const [view, setView] = useState('sign_in');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/profile');
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };
  
  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    // --- Pass additional data in the 'options' object ---
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
          // Only include title and organization if the role is 'Funder'
          title: role === 'Funder' ? title : null,
          organization_name: role === 'Funder' ? organizationName : null,
        }
      }
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
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) setError(error.message);
    setLoading(false);
  };
  
  // Form component for sign-up view
  const SignUpForm = (
    <form onSubmit={handleSignUp} className="space-y-4">
        <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Full Name</label>
            <input required className="w-full px-3 py-2 border border-slate-300 rounded-lg" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g., Jane Doe" />
        </div>
        <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Email address</label>
            <input required className="w-full px-3 py-2 border border-slate-300 rounded-lg" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Password</label>
            <input required className="w-full px-3 py-2 border border-slate-300 rounded-lg" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">I am a...</label>
            <select required className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white" value={role} onChange={(e) => setRole(e.target.value)}>
                <option>Nonprofit</option>
                <option>Funder</option>
                <option>Community member</option>
            </select>
        </div>
        {role === 'Funder' && (
            <>
                <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Your Title</label>
                    <input required className="w-full px-3 py-2 border border-slate-300 rounded-lg" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Program Officer" />
                </div>
                <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Organization Name</label>
                    <input required className="w-full px-3 py-2 border border-slate-300 rounded-lg" type="text" value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} placeholder="e.g., The Community Foundation" />
                </div>
            </>
        )}
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-sm">
            {loading ? 'Creating Account...' : 'Sign Up'}
        </button>
    </form>
  );

  const SignInForm = (
    <form onSubmit={handleLogin} className="space-y-4">
        <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Email address</label>
            <input required className="w-full px-3 py-2 border border-slate-300 rounded-lg" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Password</label>
            <input required className="w-full px-3 py-2 border border-slate-300 rounded-lg" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-sm">
            {loading ? 'Signing In...' : 'Sign In'}
        </button>
    </form>
  );

  return (
    <div className="lg:grid lg:grid-cols-2">
      {/* Left side content */}
      <div className="relative hidden lg:flex flex-col items-center justify-center bg-indigo-100 p-12 text-center">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://cdn.pixabay.com/photo/2016/03/13/18/10/san-francisco-1254172_1280.jpg')" }} />
        <div className="absolute inset-0 bg-indigo-800 opacity-60"></div>
        <div className="relative z-10">
            <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">Unlock Grant Opportunities</h2>
            <p className="text-indigo-200 max-w-md">Join the 1RFP community to streamline grant discovery and make a greater impact in the Bay Area.</p>
        </div>
      </div>
      
      {/* Right side form */}
      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="w-full max-w-md space-y-8">
          <div>
            <img className="mx-auto h-16 w-auto" src={headerLogoImage} alt="1RFP Logo" />
            <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
              {view === 'sign_in' ? 'Sign in to your account' : 'Create a new account'}
            </h2>
          </div>
        
          {view === 'sign_in' ? SignInForm : SignUpForm}

          {message && <p className="text-green-600 text-sm mt-4 text-center font-medium">{message}</p>}
          {error && <p className="text-red-600 text-sm mt-4 text-center font-medium">{error}</p>}
          
          <div className="text-center my-4">
             <button onClick={() => { setView(view === 'sign_in' ? 'sign_up' : 'sign_in'); setError(''); setMessage(''); }} className="text-sm font-medium text-blue-600 hover:text-blue-500">
              {view === 'sign_in' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
            </button>
          </div>
          
          <div className="flex items-center my-4">
            <hr className="flex-grow border-t border-slate-300"/>
            <span className="px-3 text-xs font-medium text-slate-500">OR</span>
            <hr className="flex-grow border-t border-slate-300"/>
          </div>

          <button onClick={signInWithGoogle} disabled={loading} className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-slate-300 text-sm font-semibold rounded-lg text-slate-700 bg-white hover:bg-slate-50 shadow-sm">
            {/* Google SVG */}
            <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.651-3.657-11.303-8H6.306C9.656,39.663,16.318,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.089,5.571l6.19,5.238C41.38,36.128,44,30.638,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path></svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}