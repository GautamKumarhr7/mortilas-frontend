import axiosInstance from '../../utils/axios';



export const accountAPI = {
    // Get all accounts
    getAllAccounts: async () => {
        const response = await axiosInstance.get('/accounts');
        return response.data;
    },

    // Create a new account
    createAccount: async (accountData) => {
        const response = await axiosInstance.post('/accounts', accountData);
        return response.data;
    },

    // Get a single account by ID
    getAccountById: async (id) => {
        const response = await axiosInstance.get(`/accounts/${id}`);
        return response.data;
    },

    // Update an account
    updateAccount: async (id, accountData) => {
        const response = await axiosInstance.put(`/accounts/${id}`, accountData);
        return response.data;
    },

    // Delete an account
    deleteAccount: async (id) => {
        const response = await axiosInstance.delete(`/accounts/${id}`);
        return response.data;
    }
};

const getLocalBanks = () => {
    const local = localStorage.getItem('mock_banks');
    if (local) return JSON.parse(local);
    const initialBanks = [
        { id: 1, bankName: 'HDFC Bank', accountNo: '50200012345678', ifsc: 'HDFC0000001', branch: 'Main Branch, Delhi', accountType: 'Current', status: 'Active', balance: 4500000, accountHolder: 'EcoConstruct Pvt Ltd' },
        { id: 2, bankName: 'State Bank of India', accountNo: '31234567890', ifsc: 'SBIN0001234', branch: 'Corporate Branch, Mumbai', accountType: 'OD', status: 'Active', balance: 12000000, accountHolder: 'EcoConstruct Pvt Ltd' },
        { id: 3, bankName: 'ICICI Bank', accountNo: '000123456789', ifsc: 'ICIC0000002', branch: 'Sector 18, Noida', accountType: 'Current', status: 'Inactive', balance: 0, accountHolder: 'EcoConstruct Pvt Ltd' },
    ];
    localStorage.setItem('mock_banks', JSON.stringify(initialBanks));
    return initialBanks;
};

const saveLocalBanks = (banks) => {
    localStorage.setItem('mock_banks', JSON.stringify(banks));
};

export const bankAPI = {
    // Get all banks
    getAllBanks: async () => {
        try {
            const response = await axiosInstance.get('/banks');
            return response.data;
        } catch {
            return { success: true, banks: getLocalBanks() };
        }
    },

    // Create a new bank
    createBank: async (bankData) => {
        try {
            const response = await axiosInstance.post('/banks', bankData);
            return response.data;
        } catch {
            const banks = getLocalBanks();
            const newBank = { ...bankData, id: Date.now() };
            banks.push(newBank);
            saveLocalBanks(banks);
            return { success: true, data: newBank };
        }
    },

    // Update a bank
    updateBank: async (id, bankData) => {
        try {
            const response = await axiosInstance.put(`/banks/${id}`, bankData);
            return response.data;
        } catch {
            let banks = getLocalBanks();
            banks = banks.map(b => b.id === id ? { ...b, ...bankData } : b);
            saveLocalBanks(banks);
            return { success: true, data: bankData };
        }
    },

    // Delete a bank
    deleteBank: async (id) => {
        try {
            const response = await axiosInstance.delete(`/banks/${id}`);
            return response.data;
        } catch {
            let banks = getLocalBanks();
            banks = banks.filter(b => b.id !== id);
            saveLocalBanks(banks);
            return { success: true };
        }
    }
};

export const invoiceAPI = {
    // Get all invoices
    getAllInvoices: async () => {
        const response = await axiosInstance.get('/invoices');
        return response.data;
    },

    // Create a new invoice
    createInvoice: async (invoiceData) => {
        const response = await axiosInstance.post('/invoices', invoiceData);
        return response.data;
    },

    // Get a single invoice by ID
    getInvoiceById: async (id) => {
        const response = await axiosInstance.get(`/invoices/${id}`);
        return response.data;
    },

    // Update an invoice
    updateInvoice: async (id, invoiceData) => {
        const response = await axiosInstance.put(`/invoices/${id}`, invoiceData);
        return response.data;
    },

    // Delete an invoice
    deleteInvoice: async (id) => {
        const response = await axiosInstance.delete(`/invoices/${id}`);
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

export const voucherAPI = {
    getAllVouchers: () => {
        return axiosInstance.get('/vouchers');
    },
    getVoucherById: (id) => {
        return axiosInstance.get(`/vouchers/${id}`);
    },
    createVoucher: (data) => {
        return axiosInstance.post('/vouchers', data);
    },
    updateVoucher: (id, data) => {
        return axiosInstance.put(`/vouchers/${id}`, data);
    },
    deleteVoucher: (id) => {
        return axiosInstance.delete(`/vouchers/${id}`);
    }
};
