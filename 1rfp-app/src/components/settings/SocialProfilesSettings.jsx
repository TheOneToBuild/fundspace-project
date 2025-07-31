// src/components/settings/SocialProfilesSettings.jsx
import React, { useState, useEffect } from 'react';
import { Linkedin, Twitter, Globe, ExternalLink } from 'lucide-react';
import { supabase } from '../../supabaseClient';

const SocialProfilesSettings = ({ profile, onSave, loading }) => {
  const [socialProfiles, setSocialProfiles] = useState({
    linkedin_url: '',
    twitter_url: '',
    website_url: ''
  });
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setSocialProfiles({
        linkedin_url: profile.linkedin_url || '',
        twitter_url: profile.twitter_url || '',
        website_url: profile.website_url || ''
      });
    }
  }, [profile]);

  const handleInputChange = (field, value) => {
    setSocialProfiles(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setSaveLoading(true);
    try {
      await onSave(socialProfiles);
    } finally {
      setSaveLoading(false);
    }
  };

  const socialPlatforms = [
    {
      key: 'linkedin_url',
      name: 'LinkedIn',
      icon: Linkedin,
      placeholder: 'https://linkedin.com/in/yourprofile',
      color: 'bg-blue-600'
    },
    {
      key: 'twitter_url',
      name: 'Twitter/X',
      icon: Twitter,
      placeholder: 'https://twitter.com/yourusername',
      color: 'bg-slate-900'
    },
    {
      key: 'website_url',
      name: 'Personal Website',
      icon: Globe,
      placeholder: 'https://yourwebsite.com',
      color: 'bg-green-600'
    }
  ];

  const validateUrl = (url) => {
    if (!url) return true;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const hasChanges = () => {
    if (!profile) return false;
    return Object.keys(socialProfiles).some(key => 
      socialProfiles[key] !== (profile[key] || '')
    );
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Social Profiles</h2>
      <p className="text-slate-500 mb-6">
        Add your social media profiles and website to help others connect with you.
      </p>

      <div className="space-y-4">
        {socialPlatforms.map(platform => {
          const IconComponent = platform.icon;
          const isValid = validateUrl(socialProfiles[platform.key]);
          
          return (
            <div key={platform.key}>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded flex items-center justify-center ${platform.color}`}>
                    <IconComponent className="w-3 h-3 text-white" />
                  </div>
                  {platform.name}
                </div>
              </label>
              
              <div className="relative">
                <input
                  type="url"
                  value={socialProfiles[platform.key]}
                  onChange={(e) => handleInputChange(platform.key, e.target.value)}
                  placeholder={platform.placeholder}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    !isValid && socialProfiles[platform.key] 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-slate-300'
                  }`}
                  disabled={loading || saveLoading}
                />
                
                {socialProfiles[platform.key] && isValid && (
                  <a
                    href={socialProfiles[platform.key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
              
              {!isValid && socialProfiles[platform.key] && (
                <p className="text-red-500 text-sm mt-1">
                  Please enter a valid URL (including https://)
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t">
        <button
          onClick={handleSave}
          disabled={loading || saveLoading || !hasChanges() || 
            Object.keys(socialProfiles).some(key => 
              socialProfiles[key] && !validateUrl(socialProfiles[key])
            )
          }
          className="bg-blue-600 text-white py-2.5 px-6 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 font-semibold transition-colors"
        >
          {saveLoading ? 'Saving...' : 'Save Social Profiles'}
        </button>
      </div>
    </div>
  );
};

export default SocialProfilesSettings;