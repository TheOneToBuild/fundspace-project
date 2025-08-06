// components/settings/OrganizationalRoleSelector.jsx
import React from 'react';

const ORGANIZATIONAL_ROLES = [
  { value: '', label: 'Not specified' },
  { value: 'leadership', label: 'Leadership' },
  { value: 'staff', label: 'Staff' },
  { value: 'board', label: 'Board Member' }
];

export default function OrganizationalRoleSelector({ organizationalRole, onChange, loading }) {
  return (
    <div>
      <label htmlFor="organizational-role" className="block text-sm font-medium text-slate-700 mb-2">
        Your Role
      </label>
      
      <select
        id="organizational-role"
        value={organizationalRole}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {ORGANIZATIONAL_ROLES.map((role) => (
          <option key={role.value} value={role.value}>
            {role.label}
          </option>
        ))}
      </select>
    </div>
  );
}