// components/organization/DeleteOrganizationModal.jsx
import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';

export default function DeleteOrganizationModal({ 
    isOpen, 
    onClose, 
    organization, 
    members, 
    onConfirm, 
    loading,
    setError 
}) {
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    // Reset confirmation text when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setDeleteConfirmText('');
            if (setError) setError('');
        }
    }, [isOpen, setError]);

    const handleConfirm = async () => {
        if (deleteConfirmText !== organization?.name) {
            if (setError) setError('Please enter the organization name exactly to confirm deletion.');
            return;
        }

        const success = await onConfirm(deleteConfirmText);
        if (success) {
            onClose();
        }
    };

    const handleClose = () => {
        setDeleteConfirmText('');
        if (setError) setError('');
        onClose();
    };

    if (!isOpen || !organization) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-xl max-w-lg w-full mx-4">
                <div className="flex items-center mb-4">
                    <Trash2 className="w-6 h-6 text-red-600 mr-3" />
                    <h3 className="text-lg font-semibold text-slate-800">Delete Organization</h3>
                </div>
                
                <div className="mb-6">
                    <p className="text-slate-600 mb-4">
                        <strong className="text-red-600">Warning:</strong> This action cannot be undone. 
                        Deleting <strong>{organization.name}</strong> will permanently:
                    </p>
                    
                    {/* CORRECTED: All list items are now correctly placed inside the <ul> tag */}
                    <ul className="text-sm text-slate-600 space-y-2 mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                        <li className="flex items-start">
                            <span className="text-red-500 mr-2">•</span>
                            <span>Delete all associated data, settings, and history</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-red-500 mr-2">•</span>
                            <span>Remove all organization members ({members?.length || 0} people)</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-red-500 mr-2">•</span>
                            <span>Delete all organization posts and content</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-red-500 mr-2">•</span>
                            <span>Remove the organization from the platform entirely</span>
                        </li>
                    </ul>
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                        <p className="text-yellow-800 text-sm">
                            <strong>Important:</strong> All members will be automatically removed and notified. 
                            Make sure to communicate this change to your team beforehand.
                        </p>
                    </div>
                    
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            To confirm deletion, type the organization name exactly:
                        </label>
                        <p className="text-sm font-mono bg-slate-100 p-2 rounded border mb-2">
                            {organization.name}
                        </p>
                        <input
                            type="text"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder="Enter organization name exactly as shown"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            disabled={loading}
                        />
                    </div>
                </div>
                
                <div className="flex space-x-3">
                    <button
                        onClick={handleClose}
                        disabled={loading}
                        className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading || deleteConfirmText !== organization.name}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Deleting...
                            </>
                        ) : (
                            <>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Forever
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
