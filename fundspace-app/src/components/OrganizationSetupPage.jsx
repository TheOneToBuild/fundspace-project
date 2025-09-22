// src/components/OrganizationSetupPage.jsx - Complete refactored main container
import React, { useState } from 'react';
import { Users, Plus } from 'lucide-react';
import JoinOrganizationTab from './organization-setup/JoinOrganizationTab.jsx';
import CreateOrganizationTab from './organization-setup/CreateOrganizationTab.jsx';

export default function OrganizationSetupPage({ profile, session, onComplete }) {
    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem('orgSetupActiveTab') || 'join';
    });
    
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const clearMessages = () => {
        setMessage('');
        setError('');
    };

    const handleSuccess = (successMessage) => {
        setMessage(successMessage);
        // Clear persisted data on success
        localStorage.removeItem('orgSetupActiveTab');
        setTimeout(() => {
            if (onComplete) onComplete();
        }, 2000);
    };

    const handleError = (errorMessage) => {
        setError(errorMessage);
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        localStorage.setItem('orgSetupActiveTab', tab);
        clearMessages();
    };

    const handleSwitchToCreate = (orgName) => {
        setActiveTab('create');
        localStorage.setItem('orgSetupActiveTab', 'create');
        clearMessages();
        // Store the organization name to pre-fill the create form
        if (orgName) {
            const currentFormData = JSON.parse(localStorage.getItem('createOrgFormData') || '{}');
            localStorage.setItem('createOrgFormData', JSON.stringify({
                ...currentFormData,
                name: orgName
            }));
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Join Your Organization</h1>
                <p className="text-slate-600">
                    Find your organization to connect with colleagues, or create a new organization profile if it doesn't exist yet.
                </p>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="flex border-b border-slate-200">
                    <button
                        onClick={() => handleTabChange('join')}
                        className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                            activeTab === 'join'
                                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                        }`}
                    >
                        <Users className="w-5 h-5 mx-auto mb-1" />
                        Join Existing Organization
                    </button>
                    <button
                        onClick={() => handleTabChange('create')}
                        className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                            activeTab === 'create'
                                ? 'bg-green-50 text-green-700 border-b-2 border-green-500'
                                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                        }`}
                    >
                        <Plus className="w-5 h-5 mx-auto mb-1" />
                        Create New Organization
                    </button>
                </div>

                {/* Messages */}
                {message && (
                    <div className="p-4 bg-green-50 border-b border-green-200">
                        <div className="text-green-800">{message}</div>
                    </div>
                )}
                {error && (
                    <div className="p-4 bg-red-50 border-b border-red-200">
                        <div className="text-red-800">{error}</div>
                    </div>
                )}

                {/* Tab Content */}
                <div className="p-6">
                    {activeTab === 'join' ? (
                        <JoinOrganizationTab 
                            session={session}
                            onSuccess={handleSuccess}
                            onError={handleError}
                            onSwitchToCreate={handleSwitchToCreate}
                        />
                    ) : (
                        <CreateOrganizationTab 
                            session={session}
                            onSuccess={handleSuccess}
                            onError={handleError}
                        />
                    )}
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-center mb-3">
                        <Users className="w-6 h-6 text-blue-600 mr-3" />
                        <h3 className="font-semibold text-blue-900">Joining an Organization</h3>
                    </div>
                    <ul className="text-sm text-blue-800 space-y-2">
                        <li>• Connect with your colleagues and team members</li>
                        <li>• Access organization-specific features and content</li>
                        <li>• Participate in internal discussions and updates</li>
                        <li>• Be listed as a team member on the organization profile</li>
                    </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                    <div className="flex items-center mb-3">
                        <Plus className="w-6 h-6 text-green-600 mr-3" />
                        <h3 className="font-semibold text-green-900">Creating an Organization</h3>
                    </div>
                    <ul className="text-sm text-green-800 space-y-2">
                        <li>• Become the organization administrator</li>
                        <li>• Invite and manage team members</li>
                        <li>• Create a public organization profile</li>
                        <li>• Share updates and engage with the community</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}