// src/components/AuthButton.jsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';

const UserAvatar = ({ email }) => {
  const initial = email ? email.charAt(0).toUpperCase() : '?';
  return (
    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-base ring-2 ring-offset-2 ring-blue-500">
      {initial}
    </div>
  );
};

export default function AuthButton() {
  const [session, setSession] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsDropdownOpen(false);
    navigate('/'); // Ensure user is on a public page after logout
  };

  if (session) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="btn btn-ghost btn-circle avatar"
        >
          <UserAvatar email={session.user.email} />
        </button>
        {isDropdownOpen && (
          <ul tabIndex={0} className="absolute right-0 menu menu-sm mt-3 z-[50] p-2 shadow-lg bg-white rounded-box w-52 border border-slate-200">
            <li className="p-2 font-semibold text-slate-700 border-b truncate">{session.user.email}</li>
            <li>
              <Link to="/profile" className="justify-between" onClick={() => setIsDropdownOpen(false)}>
                Profile
              </Link>
            </li>
            <li><a onClick={handleSignOut}>Logout</a></li>
          </ul>
        )}
      </div>
    );
  }

  return (
    <Link
      to="/login"
      className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 ease-in-out shadow-sm"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-5 w-5">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
      Sign In
    </Link>
  );
}
