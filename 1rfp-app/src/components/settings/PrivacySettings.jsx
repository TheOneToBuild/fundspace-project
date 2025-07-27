import React from 'react';

// Icons
const EyeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
const UserCheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const BuildingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2-5V3" /></svg>;
const EyeOffIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" /></svg>;
const InfoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const LoaderIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;

export default function PrivacySettings({ privacySetting, handlePrivacyChange, privacyLoading, privacyMessage, privacyError }) {
  const privacyOptions = [
    { value: 'public', label: 'Public', description: 'Your name and organization are visible when you view profiles', icon: UserCheckIcon, example: 'Shows as: "Jane Smith from Acme Foundation viewed your profile"' },
    { value: 'organization', label: 'Organization Only', description: 'Only your organization name is visible, not your personal name', icon: BuildingIcon, example: 'Shows as: "Someone from Acme Foundation viewed your profile"' },
    { value: 'anonymous', label: 'Anonymous', description: 'Your profile views are not tracked at all', icon: EyeOffIcon, example: 'Your views are not recorded or displayed' }
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
      <div className="flex items-center gap-2 mb-4">
        <EyeIcon className="text-blue-500" />
        <h2 className="text-2xl font-bold text-slate-800">Profile View Privacy</h2>
      </div>
      <p className="text-slate-500 mt-1 mb-6">Control how you appear when viewing funder profiles.</p>
      
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <InfoIcon className="text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800 font-medium mb-1">How this works</p>
            <p className="text-xs text-blue-700">When you visit funder profiles, they can see analytics about their visitors. Choose how you want to appear in their visitor lists.</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {privacyOptions.map((option) => {
          const IconComponent = option.icon;
          const isSelected = privacySetting === option.value;
          return (
            <div key={option.value} className={`border rounded-lg p-4 cursor-pointer transition-all ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'} ${privacyLoading ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={() => !privacyLoading && handlePrivacyChange(option.value)}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-100' : 'bg-slate-100'}`}>
                  <IconComponent className={isSelected ? 'text-blue-600' : 'text-slate-600'} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className={`font-semibold ${isSelected ? 'text-blue-800' : 'text-slate-800'}`}>{option.label}</h4>
                    {isSelected && (<div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center"><div className="w-2 h-2 bg-white rounded-full"></div></div>)}
                  </div>
                  <p className={`text-sm mb-2 ${isSelected ? 'text-blue-700' : 'text-slate-600'}`}>{option.description}</p>
                  <p className={`text-xs italic ${isSelected ? 'text-blue-600' : 'text-slate-500'}`}>{option.example}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {privacyLoading && <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg"><div className="text-sm text-slate-600 flex items-center gap-2"><LoaderIcon />Updating privacy setting...</div></div>}
      {privacyMessage && <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg"><div className="text-sm text-green-700 font-medium">{privacyMessage}</div></div>}
      {privacyError && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg"><div className="text-sm text-red-700 font-medium">{privacyError}</div></div>}
    </div>
  );
}