// src/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate, Link, NavLink } from 'react-router-dom';
import headerLogoImage from './assets/1rfp-logo.png';
import { PlusCircle, Menu } from './components/Icons.jsx';
import AuthButton from './components/AuthButton.jsx';


const PublicHeader = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mainNavLinks = [
    { to: "/", text: "Find Grants", active: "text-blue-600 font-semibold" },
    { to: "/funders", text: "Explore Funders", active: "text-green-600 font-semibold" },
    { to: "/nonprofits", text: "Explore Nonprofits", active: "text-purple-600 font-semibold" },
    { to: "/spotlight", text: "Spotlight", active: "text-rose-600 font-semibold" },
  ];

  useEffect(() => {
    if (isMobileMenuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileMenuOpen]);

  return (
    <header className="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-40 border-b border-slate-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
        <Link to="/" aria-label="1RFP Home">
          <img src={headerLogoImage} alt="1RFP Logo" className="h-12 md:h-14 w-auto" />
        </Link>
        <nav className="hidden md:flex items-center space-x-4 md:space-x-6">
          {mainNavLinks.map(link => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => `transition-colors ${isActive ? link.active : 'text-slate-700 hover:text-blue-600'}`}>
              <span className="text-sm md:text-base font-medium">{link.text}</span>
            </NavLink>
          ))}
        </nav>
        <div className="hidden md:flex items-center space-x-4">
          <AuthButton />
          <Link to="/submit-grant" className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 ease-in-out shadow-sm">
            <PlusCircle size={16} className="mr-2" />
            Submit Grant
          </Link>
        </div>
        <div className="md:hidden">
          <button onClick={() => setIsMobileMenuOpen(true)} aria-label="Open menu" className="p-2 rounded-md text-slate-600 hover:bg-slate-100">
            <Menu size={24} />
          </button>
        </div>
      </div>
    </header>
  );
};


export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Nonprofit');
  const [title, setTitle] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [location, setLocation] = useState('');
  
  const [view, setView] = useState('sign_in');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
          title: (role === 'Funder' || role === 'Nonprofit') ? title : null,
          organization_name: (role === 'Funder' || role === 'Nonprofit') ? organizationName : null,
          location: location,
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

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    if (error) {
      setError(error.message);
    } else {
      setMessage('Password reset link has been sent to your email.');
    }
    setLoading(false);
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${window.location.origin}/profile`
        }
    });
    if(error) {
        setError(error.message);
        setLoading(false);
    }
  };

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
        {(role === 'Funder' || role === 'Nonprofit') && (
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
        <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Location (Optional)</label>
            <input className="w-full px-3 py-2 border border-slate-300 rounded-lg" type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., San Francisco, CA" />
        </div>
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
        <div className="text-right">
          <button type="button" onClick={() => setView('forgot_password')} className="text-sm font-medium text-blue-600 hover:text-blue-500">
            Forgot your password?
          </button>
        </div>
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-sm">
            {loading ? 'Signing In...' : 'Sign In'}
        </button>
    </form>
  );

  const ForgotPasswordForm = (
    <form onSubmit={handlePasswordReset} className="space-y-4">
        <p className="text-sm text-slate-600">Enter your email address and we will send you a link to reset your password.</p>
        <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Email address</label>
            <input required className="w-full px-3 py-2 border border-slate-300 rounded-lg" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-sm">
            {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
    </form>
  );

  const renderContent = () => {
    switch(view) {
      case 'sign_up':
        return { title: 'Create a new account', form: SignUpForm };
      case 'forgot_password':
        return { title: 'Reset your password', form: ForgotPasswordForm };
      case 'sign_in':
      default:
        return { title: 'Sign in to your account', form: SignInForm };
    }
  };

  const { title: viewTitle, form: activeForm } = renderContent();
  const loginBgImageUrl = "https://images.pexels.com/photos/1683492/pexels-photo-1683492.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2";

  return (
    <div className="flex flex-col h-screen">
      <PublicHeader />
      <div className="lg:grid lg:grid-cols-2 flex-grow">
        <div 
          className="relative hidden lg:flex flex-col items-center justify-center text-center text-white p-12 bg-cover bg-center"
          style={{ backgroundImage: `url(${loginBgImageUrl})` }}
        >
          <div className="absolute inset-0 bg-blue-900 opacity-60"></div>
          <div className="relative z-10 space-y-6">
              <h1 className="text-4xl font-bold tracking-tight">
                  Unlock Grant Opportunities
              </h1>
              <p className="text-lg max-w-md mx-auto text-blue-100">
                  Join the 1RFP community to streamline grant discovery and make a greater impact in the Bay Area.
              </p>
          </div>
        </div>
        
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="w-full max-w-md space-y-8">
            <div>
              <Link to="/"><img className="mx-auto h-16 w-auto" src={headerLogoImage} alt="1RFP Logo" /></Link>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">{viewTitle}</h2>
            </div>
          
            {activeForm}

            {message && <p className="text-green-600 text-sm mt-4 text-center font-medium">{message}</p>}
            {error && <p className="text-red-600 text-sm mt-4 text-center font-medium">{error}</p>}
            
            <div className="text-center">
              <button onClick={() => { setView(view === 'sign_in' ? 'sign_up' : 'sign_in'); setError(''); setMessage(''); }} className="text-sm font-medium text-blue-600 hover:text-blue-500">
                {view === 'forgot_password' ? 'Back to Sign In' : (view === 'sign_in' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In')}
              </button>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">OR</span>
              </div>
            </div>

            <button onClick={signInWithGoogle} disabled={loading} className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-slate-300 text-sm font-semibold rounded-lg text-slate-700 bg-white hover:bg-slate-50 shadow-sm disabled:opacity-50">
              <svg className="w-4 h-4 mr-3" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.651-3.657-11.303-8H6.306C9.656,39.663,16.318,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.089,5.571l6.19,5.238C41.38,36.128,44,30.638,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path></svg>
              Continue with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}