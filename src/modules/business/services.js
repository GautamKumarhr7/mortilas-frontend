import axiosInstance from '../../utils/axios';



export const contractAPI = {
    // Get all contracts
    getAllContracts: async () => {
        const response = await axiosInstance.get('/contracts');
        return response;
    },

    // Get contract by ID
    getContractById: async (id) => {
        const response = await axiosInstance.get(`/contracts/${id}`);
        return response;
    },

    // Create a new contract
    createContract: async (data) => {
        const response = await axiosInstance.post('/contracts', data);
        return response;
    },

    // Update an existing contract
    updateContract: async (id, data) => {
        const response = await axiosInstance.put(`/contracts/${id}`, data);
        return response;
    },

    // Delete a contract
    deleteContract: async (id) => {
        const response = await axiosInstance.delete(`/contracts/${id}`);
        return response;
    }
};

export const quotationAPI = {
    getAllQuotations: () => {
        return axiosInstance.get('/quotations');
    },
    getQuotationById: (id) => {
        return axiosInstance.get(`/quotations/${id}`);
    },
    createQuotation: (data) => {
        return axiosInstance.post('/quotations', data);
    },
    updateQuotation: (id, data) => {
        return axiosInstance.put(`/quotations/${id}`, data);
    },
    deleteQuotation: (id) => {
        return axiosInstance.delete(`/quotations/${id}`);
    }
};

export const tenderAPI = {
    getAllTenders: async () => {
        const response = await axiosInstance.get('/tenders');
        return response;
    },
    getTenderById: async (id) => {
        const response = await axiosInstance.get(`/tenders/${id}`);
        return response;
    },
    createTender: async (data) => {
        const response = await axiosInstance.post('/tenders', data);
        return response;
    },
    updateTender: async (id, data) => {
        const response = await axiosInstance.put(`/tenders/${id}`, data);
        return response;
    },
    deleteTender: async (id) => {
        const response = await axiosInstance.delete(`/tenders/${id}`);
        return response;
    }
};

export const vendorAPI = {
    // Get all vendors
    getAllVendors: async () => {
        try {
            const response = await axiosInstance.get('/vendors');
            return response.data;
        } catch (error) {
            console.error('Error fetching vendors:', error);
            throw error;
        }
    },

    // Get specific vendor by ID
    getVendorById: async (id) => {
        try {
            const response = await axiosInstance.get(`/vendors/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching vendor ${id}:`, error);
            throw error;
        }
    },

    // Create a new vendor
    createVendor: async (vendorData) => {
        try {
            // Mapping to both potential names to ensure compatibility
            const payload = {
                ...vendorData,
                panOrgstin: vendorData.panOrgstin || vendorData.gstinOrPan // Handle both variations
            };
            const response = await axiosInstance.post('/vendors', payload);
            return response.data;
        } catch (error) {
            console.error('Error creating vendor:', error);
            throw error;
        }
    },

    // Update an existing vendor
    updateVendor: async (id, vendorData) => {
        try {
            const response = await axiosInstance.put(`/vendors/${id}`, vendorData);
            return response.data;
        } catch (error) {
            console.error('Error updating vendor:', error);
            throw error;
        }
    },

    // Delete a vendor
    deleteVendor: async (id) => {
        try {
            const response = await axiosInstance.delete(`/vendors/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting vendor:', error);
            throw error;
        }
    },

    // Rate Contracts
    getVendorRateContracts: async (vendorId) => {
        try {
            const response = await axiosInstance.get(`/vendors/${vendorId}/rate-contracts`);
            return response.data;
        } catch (error) {
            console.error('Error fetching rate contracts:', error);
            throw error;
        }
    },

    createVendorRateContract: async (vendorId, contractData) => {
        try {
            const response = await axiosInstance.post(`/vendors/${vendorId}/rate-contracts`, contractData);
            return response.data;
        } catch (error) {
            console.error('Error creating rate contract:', error);
            throw error;
        }
    }
};

export const leadAPI = {
    getAllLeads: () => axiosInstance.get('/leads'),
    getLeadById: (id) => axiosInstance.get(`/leads/${id}`),
    createLead: (data) => axiosInstance.post('/leads', data),
    updateLead: (id, data) => axiosInstance.put(`/leads/${id}`, data),
    deleteLead: (id) => axiosInstance.delete(`/leads/${id}`),
};

