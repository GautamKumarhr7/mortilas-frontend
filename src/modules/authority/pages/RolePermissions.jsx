import React, { useState, useEffect } from 'react';
import { Loader2, Save } from 'lucide-react';
import { authorityAPI } from '../services';
import toast from 'react-hot-toast';

import RoleSelector from '../components/RoleSelector';
import ModuleAccordion from '../components/ModuleAccordion';
import SubmodulePermissions from '../components/SubmodulePermissions';

export default function RolePermissions() {
    const [roles, setRoles] = useState([]);
    const [modules, setModules] = useState([]);
    const [permissions, setPermissions] = useState([]);
    
    const [selectedRole, setSelectedRole] = useState('');
    const [expandedModules, setExpandedModules] = useState({});
    const [moduleSubmodules, setModuleSubmodules] = useState({});
    const [loadingSubmodules, setLoadingSubmodules] = useState({});
    
    // selectedPermissions structure:
    // { [subModuleId]: { [permissionId]: true/false } }
    const [selectedPermissions, setSelectedPermissions] = useState({});
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const initData = async () => {
            try {
                setIsLoading(true);
                const [rolesData, modulesData, permissionsData] = await Promise.all([
                    authorityAPI.getRoles(),
                    authorityAPI.getModules(),
                    authorityAPI.getPermissions()
                ]);
                let filteredModules = modulesData ? JSON.parse(JSON.stringify(modulesData)) : [];
                // Filter Authority module to only include Role and Role Permission submodules
                const authModuleIdx = filteredModules.findIndex(m => m.name?.toLowerCase() === 'authority' || m.code?.toLowerCase() === 'authority');
                if (authModuleIdx >= 0 && filteredModules[authModuleIdx].submodules) {
                    filteredModules[authModuleIdx].submodules = filteredModules[authModuleIdx].submodules.filter(sub => {
                        const subName = sub.name?.toLowerCase() || '';
                        const subCode = sub.code?.toLowerCase() || '';
                        return subName.includes('role') || subCode.includes('role');
                    });
                }

                setRoles(rolesData || []);
                setModules(filteredModules);
                setPermissions(permissionsData || []);
            } catch (error) {
                console.error('Error fetching initial data:', error);
                toast.error('Failed to load required data');
            } finally {
                setIsLoading(false);
            }
        };
        initData();
    }, []);

    // When role changes, we might want to fetch existing permissions for this role
    // For now, we just clear selections, or we can load them if API provides it.
    useEffect(() => {
        if (selectedRole) {
            fetchExistingPermissions(selectedRole);
        } else {
            setSelectedPermissions({});
        }
    }, [selectedRole]);

    const fetchExistingPermissions = async (roleId) => {
        try {
            const data = await authorityAPI.getRolePermissions(roleId);
            const newSelection = {};
            
            if (Array.isArray(data)) {
                data.forEach((moduleItem) => {
                    // If response is nested modules -> submodules -> permissions
                    if (moduleItem.submodules && Array.isArray(moduleItem.submodules)) {
                        moduleItem.submodules.forEach((submodule) => {
                            if (submodule.permissions && Array.isArray(submodule.permissions)) {
                                submodule.permissions.forEach((permission) => {
                                    const subId = submodule.id || submodule._id;
                                    const permId = permission.id || permission._id;
                                    if (!newSelection[subId]) {
                                        newSelection[subId] = {};
                                    }
                                    newSelection[subId][permId] = true;
                                });
                            }
                        });
                    } else if (moduleItem.subModuleId && moduleItem.permissionId) {
                        // Fallback for flat structure
                        if (!newSelection[moduleItem.subModuleId]) {
                            newSelection[moduleItem.subModuleId] = {};
                        }
                        newSelection[moduleItem.subModuleId][moduleItem.permissionId] = true;
                    }
                });
            }
            setSelectedPermissions(newSelection);
        } catch (error) {
            console.error('Error fetching existing permissions:', error);
            toast.error('Failed to load existing permissions for this role');
        }
    };

    const toggleModule = async (moduleId) => {
        const isExpanded = expandedModules[moduleId];
        setExpandedModules(prev => ({ ...prev, [moduleId]: !isExpanded }));

        // Fetch submodules if not already loaded
        if (!isExpanded && !moduleSubmodules[moduleId]) {
            try {
                setLoadingSubmodules(prev => ({ ...prev, [moduleId]: true }));
                let data = await authorityAPI.getSubmodulesByModuleId(moduleId);
                data = data || [];
                
                // Filter out unwanted submodules if this is the Authority module
                const moduleObj = modules.find(m => (m.id || m._id) === moduleId);
                if (moduleObj && (moduleObj.name?.toLowerCase() === 'authority' || moduleObj.code?.toLowerCase() === 'authority')) {
                    data = data.filter(sub => {
                        const subName = sub.name?.toLowerCase() || '';
                        const subCode = sub.code?.toLowerCase() || '';
                        return subName.includes('role') || subCode.includes('role');
                    });
                }
                
                setModuleSubmodules(prev => ({ ...prev, [moduleId]: data }));
            } catch (error) {
                console.error('Error fetching submodules:', error);
                toast.error('Failed to fetch submodules');
            } finally {
                setLoadingSubmodules(prev => ({ ...prev, [moduleId]: false }));
            }
        }
    };

    const togglePermission = (subModuleId, permissionId) => {
        setSelectedPermissions(prev => {
            const currentSubModulePerms = prev[subModuleId] || {};
            const isSelected = currentSubModulePerms[permissionId];
            
            return {
                ...prev,
                [subModuleId]: {
                    ...currentSubModulePerms,
                    [permissionId]: !isSelected
                }
            };
        });
    };

    const handleSelectAllSubmodule = (subModuleId, select) => {
        setSelectedPermissions(prev => {
            const newSubModulePerms = {};
            if (select) {
                permissions.forEach(p => {
                    newSubModulePerms[p.id || p._id] = true;
                });
            }
            return {
                ...prev,
                [subModuleId]: newSubModulePerms
            };
        });
    };

    const handleSave = async () => {
        if (!selectedRole) {
            toast.error('Please select a role first');
            return;
        }

        const payload = [];
        Object.entries(selectedPermissions).forEach(([subModuleId, perms]) => {
            Object.entries(perms).forEach(([permissionId, isSelected]) => {
                if (isSelected) {
                    payload.push({
                        roleId: parseInt(selectedRole, 10),
                        subModuleId: parseInt(subModuleId, 10),
                        permissionId: parseInt(permissionId, 10)
                    });
                }
            });
        });

        try {
            setIsSaving(true);
            await authorityAPI.saveRolePermissions(payload);
            toast.success('Role permissions saved successfully!');
        } catch (error) {
            console.error('Error saving role permissions:', error);
            toast.error('Failed to save role permissions');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-[#2f6645] animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Role Permissions</h1>
                    <p className="text-slate-500 text-sm mt-1">Configure access control for modules and submodules</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving || !selectedRole}
                    className="btn-primary flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Permissions
                </button>
            </div>

            <RoleSelector 
                roles={roles} 
                selectedRole={selectedRole} 
                onSelectRole={setSelectedRole} 
            />

            {selectedRole && (
                <div className="space-y-4">
                    <h2 className="font-bold text-lg text-slate-800">Assign Permissions</h2>
                    {modules.map(module => {
                        const moduleId = module.id || module._id;
                        const isExpanded = expandedModules[moduleId];
                        const submodules = moduleSubmodules[moduleId] || [];
                        const isSubmodulesLoading = loadingSubmodules[moduleId];

                        return (
                            <ModuleAccordion 
                                key={moduleId}
                                module={module}
                                isExpanded={isExpanded}
                                onToggle={() => toggleModule(moduleId)}
                            >
                                <SubmodulePermissions 
                                    submodules={submodules}
                                    isLoading={isSubmodulesLoading}
                                    permissions={permissions}
                                    selectedPermissions={selectedPermissions}
                                    onTogglePermission={togglePermission}
                                    onSelectAll={handleSelectAllSubmodule}
                                />
                            </ModuleAccordion>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
