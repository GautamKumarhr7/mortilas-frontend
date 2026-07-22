import axiosInstance from '../../utils/axios';



export const boqAPI = {
    // Get all Bill of Quantities
    getAllBills: async () => {
        const response = await axiosInstance.get('/bills');
        return response;
    },

    // Create a new Bill of Quantity
    createBill: async (data) => {
        const response = await axiosInstance.post('/bills', data);
        return response;
    },

    // Update an existing Bill of Quantity
    updateBill: async (id, data) => {
        const response = await axiosInstance.put(`/bills/${id}`, data);
        return response;
    },

    // Delete a Bill of Quantity
    deleteBill: async (id) => {
        const response = await axiosInstance.delete(`/bills/${id}`);
        return response;
    }
};

export const milestoneAPI = {
    /**
     * Fetch all milestones
     * GET /milestones
     */
    getAllMilestones: async () => {
        const response = await axiosInstance.get('/milestones');
        return response.data;
    },

    /**
     * Create a new milestone
     * POST /milestones
     * Body: { siteId, title, startDate, endDate, priority, status, completion }
     */
    createMilestone: async (data) => {
        const response = await axiosInstance.post('/milestones', data);
        return response.data;
    },

    /**
     * Update a milestone
     * PUT /milestones/:id
     */
    updateMilestone: async (id, data) => {
        const response = await axiosInstance.put(`/milestones/${id}`, data);
        return response.data;
    },

    /**
     * Delete a milestone
     * DELETE /milestones/:id
     */
    deleteMilestone: async (id) => {
        const response = await axiosInstance.delete(`/milestones/${id}`);
        return response.data;
    },
};

export const projectAPI = {
    // Get all Projects
    getAllProjects: async () => {
        const response = await axiosInstance.get('/projects');
        return response;
    },

    // Create a new Project
    createProject: async (data) => {
        const response = await axiosInstance.post('/projects', data);
        return response;
    },

    // Update an existing Project
    updateProject: async (id, data) => {
        const response = await axiosInstance.put(`/projects/${id}`, data);
        return response;
    },

    // Delete a Project
    deleteProject: async (id) => {
        const response = await axiosInstance.delete(`/projects/${id}`);
        return response;
    }
};

export const siteAPI = {
    /**
     * Fetch all sites
     * GET /sites
     */
    getAllSites: async () => {
        const response = await axiosInstance.get('/sites');
        return response.data;
    },

    /**
     * Create a new site
     * POST /sites
     * Body: { projectId, name, location, supervisor, count, budget, complexity, status, rating }
     */
    createSite: async (data) => {
        const response = await axiosInstance.post('/sites', data);
        return response.data;
    },

    /**
     * Update an existing site
     * PUT /sites/:id
     */
    updateSite: async (id, data) => {
        const response = await axiosInstance.put(`/sites/${id}`, data);
        return response.data;
    },

    /**
     * Delete a site
     * DELETE /sites/:id
     */
    deleteSite: async (id) => {
        const response = await axiosInstance.delete(`/sites/${id}`);
        return response.data;
    },
};

export const workOrderAPI = {
    /**
     * Fetch all work orders
     * GET /work-orders
     */
    getAllWorkOrders: async () => {
        const response = await axiosInstance.get('/work-orders');
        return response.data;
    },

    /**
     * Create a new work order
     * POST /work-orders
     * Body: { projectId, contractor, description, value, retention, startDate, target, type, status }
     */
    createWorkOrder: async (data) => {
        const response = await axiosInstance.post('/work-orders', data);
        return response.data;
    },

    /**
     * Update a work order
     * PUT /work-orders/:id
     */
    updateWorkOrder: async (id, data) => {
        const response = await axiosInstance.put(`/work-orders/${id}`, data);
        return response.data;
    },

    /**
     * Delete a work order
     * DELETE /work-orders/:id
     */
    deleteWorkOrder: async (id) => {
        const response = await axiosInstance.delete(`/work-orders/${id}`);
        return response.data;
    },
};

export const clientAPI = {
    getAllClients: async () => {
        const response = await axiosInstance.get('/clients');
        return response.data;
    },
    createClient: async (data) => {
        const response = await axiosInstance.post('/clients', data);
        return response.data;
    },
    updateClient: async (id, data) => {
        const response = await axiosInstance.put(`/clients/${id}`, data);
        return response.data;
    },
    deleteClient: async (id) => {
        const response = await axiosInstance.delete(`/clients/${id}`);
        return response.data;
    }
};

export const inventoryAPI = {
    getAllInventories: async () => {
        const response = await axiosInstance.get('/inventories');
        return response.data;
    },
    createInventory: async (data) => {
        const response = await axiosInstance.post('/inventories', data);
        return response.data;
    },
    updateInventory: async (id, data) => {
        const response = await axiosInstance.put(`/inventories/${id}`, data);
        return response.data;
    },
    deleteInventory: async (id) => {
        const response = await axiosInstance.delete(`/inventories/${id}`);
        return response.data;
    }
};
