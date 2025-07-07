import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { X, Crown, Shield, Users, UserPlus, UserMinus, AlertTriangle, CheckCircle } from 'lucide-react';
import { ROLES, getRoleDisplayName, getRoleBadgeColor } from '../utils/permissions.js';
import Avatar from './Avatar.jsx';

export default function AdminManagementModal({ 
    isOpen, 
    onClose, 
    member, 
    action, 
    organizationId, 
    organizationType, 
    onActionComplete 
}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedRole, setSelectedRole] = useState('admin');

    if (!isOpen || !member) return null;

    const handlePromote = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const { data, error } = await supabase.rpc('promote_to_admin', {
                target_profile_id: member.id,
                organization_id_param: organizationId,
                organization_type_param: organizationType,
                admin_level: selectedRole
            });

            if (error) throw error;

            if (data.success) {
                setSuccess(data.message);
                setTimeout(() => {
                    onActionComplete();
                    onClose();
                }, 1500);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDemote = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const { data, error } = await supabase.rpc('demote_admin', {
                target_profile_id: member.id,
                organization_id_param: organizationId,
                organization_type_param: organizationType
            });

            if (error) throw error;

            if (data.success) {
                setSuccess(data.message);
                setTimeout(() => {
                    onActionComplete();
                    onClose();
                }, 1500);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async () => {
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const { data, error } = await supabase.rpc('remove_organization_member', {
                target_profile_id: member.id,
                organization_id_param: organizationId,
                organization_type_param: organizationType
            });

            if (error) throw error;

            if (data.success) {
                setSuccess(data.message);
                setTimeout(() => {
                    onActionComplete();
                    onClose();
                }, 1500);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const renderPromoteContent = () => (
        <div>
            <div className="flex items-center mb-4">
                <UserPlus className="w-6 h-6 text-green-600 mr-3" />
                <h3 className="text-lg font-semibold text-slate-800">Promote Member</h3>
            </div>
            
            <p className="text-slate-600 mb-4">
                Promote <strong>{member.full_name || 'this user'}</strong> to an admin role?
            </p>

            <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    Select Admin Level:
                </label>
                <div className="space-y-2">
                    <label className="flex items-center">
                        <input
                            type="radio"
                            value="admin"
                            checked={selectedRole === 'admin'}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="mr-3"
                        />
                        <Shield className="w-4 h-4 text-green-600 mr-2" />
                        <span className="font-medium">Admin</span>
                        <span className="text-sm text-slate-500 ml-2">
                            - Can manage members only
                        </span>
                    </label>
                    <label className="flex items-center">
                        <input
                            type="radio"
                            value="super_admin"
                            checked={selectedRole === 'super_admin'}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="mr-3"
                        />
                        <Crown className="w-4 h-4 text-purple-600 mr-2" />
                        <span className="font-medium">Super Admin</span>
                        <span className="text-sm text-slate-500 ml-2">
                            - Full organization control
                        </span>
                    </label>
                </div>
            </div>

            <div className="flex space-x-3 justify-end">
                <button
                    onClick={onClose}
                    disabled={loading}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    onClick={handlePromote}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
                >
                    {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                        <UserPlus className="w-4 h-4 mr-2" />
                    )}
                    Promote
                </button>
            </div>
        </div>
    );

    const renderDemoteContent = () => (
        <div>
            <div className="flex items-center mb-4">
                <UserMinus className="w-6 h-6 text-orange-600 mr-3" />
                <h3 className="text-lg font-semibold text-slate-800">Demote Admin</h3>
            </div>
            
            <p className="text-slate-600 mb-4">
                Demote <strong>{member.full_name || 'this user'}</strong> from{' '}
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getRoleBadgeColor(member.role)} mx-1`}>
                    {getRoleDisplayName(member.role)}
                </span>
                to Member?
            </p>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-orange-600 mr-2 mt-0.5" />
                    <div>
                        <p className="text-sm text-orange-800 font-medium">Warning</p>
                        <p className="text-sm text-orange-700">
                            This user will lose their admin privileges and will only be able to view the organization.
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex space-x-3 justify-end">
                <button
                    onClick={onClose}
                    disabled={loading}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    onClick={handleDemote}
                    disabled={loading}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center"
                >
                    {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                        <UserMinus className="w-4 h-4 mr-2" />
                    )}
                    Demote to Member
                </button>
            </div>
        </div>
    );

    const renderRemoveContent = () => (
        <div>
            <div className="flex items-center mb-4">
                <UserMinus className="w-6 h-6 text-red-600 mr-3" />
                <h3 className="text-lg font-semibold text-slate-800">Remove Member</h3>
            </div>
            
            <p className="text-slate-600 mb-4">
                Remove <strong>{member.full_name || 'this user'}</strong> from the organization completely?
            </p>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                    <div>
                        <p className="text-sm text-red-800 font-medium">This action cannot be undone</p>
                        <p className="text-sm text-red-700">
                            The user will be completely removed from the organization and will need to rejoin or be re-invited.
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex space-x-3 justify-end">
                <button
                    onClick={onClose}
                    disabled={loading}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    onClick={handleRemove}
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center"
                >
                    {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                        <UserMinus className="w-4 h-4 mr-2" />
                    )}
                    Remove Member
                </button>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full shadow-xl">
                <div className="p-6">
                    {/* Header with member info */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                            <Avatar 
                                src={member.avatar_url} 
                                fullName={member.full_name} 
                                size="md" 
                            />
                            <div className="ml-3">
                                <p className="font-medium text-slate-900">
                                    {member.full_name || 'Anonymous User'}
                                </p>
                                <p className="text-sm text-slate-500">
                                    {member.title || 'Team Member'}
                                </p>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(member.role)} mt-1`}>
                                    {member.role === ROLES.SUPER_ADMIN && <Crown className="w-3 h-3 mr-1" />}
                                    {member.role === ROLES.ADMIN && <Shield className="w-3 h-3 mr-1" />}
                                    {member.role === ROLES.MEMBER && <Users className="w-3 h-3 mr-1" />}
                                    {getRoleDisplayName(member.role)}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Status Messages */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center">
                                <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center">
                                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                                <p className="text-sm text-green-800">{success}</p>
                            </div>
                        </div>
                    )}

                    {/* Action Content */}
                    {action === 'promote' && renderPromoteContent()}
                    {action === 'demote' && renderDemoteContent()}
                    {action === 'remove' && renderRemoveContent()}
                </div>
            </div>
        </div>
    );
}