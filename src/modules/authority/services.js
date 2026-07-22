import axiosInstance from '../../utils/axios';

export const authorityAPI = {
    // Roles
    getRoles: async () => {
        const response = await axiosInstance.get('/roles');
        return Array.isArray(response.data) ? response.data : (response.data?.data || []);
    },
    createRole: async (data) => {
        const response = await axiosInstance.post('/roles', data);
        return response.data;
    },
    updateRole: async (id, data) => {
        const response = await axiosInstance.put(`/roles/${id}`, data);
        return response.data;
    },
    deleteRole: async (id) => {
        const response = await axiosInstance.delete(`/roles/${id}`);
        return response.data;
    },

    // Modules & Permissions
    getModules: async () => {
        const response = await axiosInstance.get('/modules');
        return Array.isArray(response.data) ? response.data : (response.data?.data || []);
    },
    getSubmodulesByModuleId: async (moduleId) => {
        const response = await axiosInstance.get(`/submodules/module/${moduleId}`);
        return Array.isArray(response.data) ? response.data : (response.data?.data || []);
    },
    getAllSubmodules: async () => {
        const response = await axiosInstance.get('/submodules');
        return Array.isArray(response.data) ? response.data : (response.data?.data || []);
    },
    getPermissions: async () => {
        const response = await axiosInstance.get('/permissions');
        return Array.isArray(response.data) ? response.data : (response.data?.data || []);
    },

    // Role Permissions
    getRolePermissions: async (roleId) => {
        // Just in case there's an endpoint to get by roleId
        const response = await axiosInstance.get(`/role-permissions/role/${roleId}`);
        return Array.isArray(response.data) ? response.data : (response.data?.data || []);
    },
    saveRolePermissions: async (roleId, data) => {
        const response = await axiosInstance.put(`/role-permissions/role/${roleId}`, data);
        return response.data;
    }
};
