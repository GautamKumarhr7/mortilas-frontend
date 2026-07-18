import React from 'react';
import { Check, Loader2 } from 'lucide-react';

export default function SubmodulePermissions({ 
    submodules, 
    isLoading, 
    permissions, 
    selectedPermissions, 
    onTogglePermission, 
    onSelectAll 
}) {
    if (isLoading) {
        return (
            <div className="py-8 flex justify-center">
                <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
            </div>
        );
    }

    if (!submodules || submodules.length === 0) {
        return (
            <div className="py-8 text-center text-slate-500 text-sm">
                No submodules found for this module.
            </div>
        );
    }

    return (
        <div className="space-y-4 mt-4">
            {submodules.map(submodule => {
                const subModuleId = submodule.id || submodule._id;
                const subModulePerms = selectedPermissions[subModuleId] || {};
                const isAllSelected = permissions.length > 0 && permissions.every(p => subModulePerms[p.id || p._id]);

                return (
                    <div key={subModuleId} className="bg-white p-4 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                            <h4 className="font-semibold text-slate-700">{submodule.name}</h4>
                            <button
                                onClick={() => onSelectAll(subModuleId, !isAllSelected)}
                                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${isAllSelected ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                {isAllSelected ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {permissions.map(permission => {
                                const permissionId = permission.id || permission._id;
                                const isSelected = !!subModulePerms[permissionId];
                                return (
                                    <button 
                                        type="button"
                                        role="checkbox"
                                        aria-checked={isSelected}
                                        key={permissionId}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            onTogglePermission(subModuleId, permissionId);
                                        }}
                                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${isSelected ? 'border-[#2f6645] bg-green-50' : 'border-slate-200 hover:border-slate-300'}`}
                                    >
                                        <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-[#2f6645]' : 'bg-white border border-slate-300'}`}>
                                            {isSelected && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <span className={`text-sm select-none truncate ${isSelected ? 'text-[#2f6645] font-medium' : 'text-slate-600'}`}>
                                            {permission.name}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
