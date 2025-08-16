// components/organization/LeaveOrganizationModal.jsx
import React from 'react';
import { AlertTriangle, LogOut } from 'lucide-react';
import { ROLES } from '../../utils/organizationPermissions.js';

export default function LeaveOrganizationModal({ 
    isOpen, 
    onClose, 
    organization, 
    userRole, 
    onConfirm, 
    loading 
}) {
    if (!isOpen || !organization) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full mx-4">
                <div className="flex items-center mb-4">
                    <AlertTriangle className="w-6 h-6 text-orange-500 mr-3" />
                    <h3 className="text-lg font-semibold text-slate-800">Leave Organization</h3>
                </div>
                
                <div className="mb-6">
                    <p className="text-slate-600 mb-4">
                        Are you sure you want to leave <strong>{organization.name}</strong>? 
                    </p>
                    
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                        <p className="text-orange-800 text-sm">
                            <strong>Note:</strong> You'll lose access to organization features and will need to be re-invited to rejoin.
                        </p>
                    </div>
                    
                    {userRole === ROLES.SUPER_ADMIN && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-800 text-sm">
                                <strong>Warning:</strong> You are a Super Admin. Make sure other admins can manage the organization before leaving.
                            </p>
                        </div>
                    )}
                </div>
                
                <div className="flex space-x-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center transition-colors"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Leaving...
                            </>
                        ) : (
                            <>
                                <LogOut className="w-4 h-4 mr-2" />
                                Leave Organization
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}