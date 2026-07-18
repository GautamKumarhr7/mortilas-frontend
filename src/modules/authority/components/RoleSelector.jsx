import React from 'react';

export default function RoleSelector({ roles, selectedRole, onSelectRole }) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="max-w-md">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Select Role <span className="text-red-500">*</span>
                </label>
                <select
                    value={selectedRole}
                    onChange={(e) => onSelectRole(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2f6645]/20 focus:border-[#2f6645] transition-all"
                >
                    <option value="">-- Choose a Role --</option>
                    {roles.map(role => (
                        <option key={role.id || role._id} value={role.id || role._id}>
                            {role.name} ({role.code})
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
