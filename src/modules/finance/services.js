import axiosInstance from '../../utils/axios';



export const accountAPI = {
    // Get all accounts
    getAllAccounts: async () => {
        const response = await axiosInstance.get('/finance/chart-of-accounts');
        return response.data;
    },

    // Create a new account
    createAccount: async (accountData) => {
        const response = await axiosInstance.post('/finance/chart-of-accounts', accountData);
        return response.data;
    },

    // Get a single account by ID
    getAccountById: async (id) => {
        const response = await axiosInstance.get(`/finance/chart-of-accounts/${id}`);
        return response.data;
    },

    // Update an account
    updateAccount: async (id, accountData) => {
        const response = await axiosInstance.put(`/finance/chart-of-accounts/${id}`, accountData);
        return response.data;
    },

    // Deactivate an account
    deactivateAccount: async (id) => {
        const response = await axiosInstance.patch(`/finance/chart-of-accounts/${id}/deactivate`);
        return response.data;
    }
};

export const bankAPI = {
    // Get all banks
    getAllBanks: async () => {
        const response = await axiosInstance.get('/finance/bank-accounts');
        if (response.data?.data) {
            response.data.banks = response.data.data.map(b => ({
                ...b,
                ifsc: b.ifscCode,
                balance: b.currentBalance
            }));
        }
        return response.data;
    },

    // Create a new bank
    createBank: async (bankData) => {
        // Map frontend fields to backend
        const payload = {
            ...bankData,
            accountType: bankData.accountType?.toUpperCase().replace(' ', '_') || 'CURRENT',
            status: bankData.status?.toUpperCase() || 'ACTIVE',
            ifscCode: bankData.ifsc,
            openingBalance: bankData.balance ? bankData.balance.toString() : '0',
            currentBalance: bankData.balance ? bankData.balance.toString() : '0',
        };
        // Remove old fields
        delete payload.ifsc;
        delete payload.balance;

        const response = await axiosInstance.post('/finance/bank-accounts', payload);
        return response.data;
    },

    // Update a bank
    updateBank: async (id, bankData) => {
        const payload = { ...bankData };
        if (payload.accountType) payload.accountType = payload.accountType.toUpperCase().replace(' ', '_');
        if (payload.status) payload.status = payload.status.toUpperCase();
        if (payload.ifsc) payload.ifscCode = payload.ifsc;
        if (payload.balance !== undefined) {
            payload.currentBalance = payload.balance.toString();
        }
        
        // Remove old fields
        delete payload.ifsc;
        delete payload.balance;

        const response = await axiosInstance.put(`/finance/bank-accounts/${id}`, payload);
        return response.data;
    },

    // Delete a bank
    deleteBank: async (id) => {
        const response = await axiosInstance.delete(`/finance/bank-accounts/${id}`);
        return response.data;
    }
};

export const invoiceAPI = {
    // Get all invoices
    getAllInvoices: async () => {
        const response = await axiosInstance.get('/finance/invoices');
        return response.data;
    },

    // Create a new invoice
    createInvoice: async (invoiceData) => {
        const response = await axiosInstance.post('/finance/invoices', invoiceData);
        return response.data;
    },

    // Get a single invoice by ID
    getInvoiceById: async (id) => {
        const response = await axiosInstance.get(`/finance/invoices/${id}`);
        return response.data;
    },

    // Update an invoice
    updateInvoice: async (id, invoiceData) => {
        const response = await axiosInstance.put(`/finance/invoices/${id}`, invoiceData);
        return response.data;
    },

    // Delete an invoice
    deleteInvoice: async (id) => {
        const response = await axiosInstance.delete(`/finance/invoices/${id}`);
        return response.data;
    }
};

export const partyAPI = {
    getAllParties: () => {
        return axiosInstance.get('/parties');
    },
    getPartyById: (id) => {
        return axiosInstance.get(`/parties/${id}`);
    },
    createParty: (data) => {
        return axiosInstance.post('/parties', data);
    },
    updateParty: (id, data) => {
        return axiosInstance.put(`/parties/${id}`, data);
    },
    deleteParty: (id) => {
        return axiosInstance.delete(`/parties/${id}`);
    }
};

export const tdsAPI = {
    // Get all TDS records
    getAllTDS: async () => {
        const response = await axiosInstance.get('/tds');
        return response.data;
    },

    // Create a new TDS record
    createTDS: async (tdsData) => {
        const response = await axiosInstance.post('/tds', tdsData);
        return response.data;
    },

    // Get a single TDS record by ID
    getTDSById: async (id) => {
        const response = await axiosInstance.get(`/tds/${id}`);
        return response.data;
    },

    // Update an existing TDS record
    updateTDS: async (id, tdsData) => {
        const response = await axiosInstance.put(`/tds/${id}`, tdsData);
        return response.data;
    },

    // Delete a TDS record
    deleteTDS: async (id) => {
        const response = await axiosInstance.delete(`/tds/${id}`);
        return response.data;
    }
};


