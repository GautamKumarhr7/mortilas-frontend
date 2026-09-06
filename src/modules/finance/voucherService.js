import axiosInstance from '../../utils/axios';

export const voucherAPI = {
    getAllVouchers: async () => {
        const response = await axiosInstance.get('/finance/vouchers');
        return response.data;
    },
    getLedger: async (bankId, page = 1, limit = 10) => {
        const response = await axiosInstance.get('/finance/vouchers/ledger', {
            params: { bankId, page, limit }
        });
        return response.data;
    },
    getVoucherById: async (id) => {
        const response = await axiosInstance.get(`/finance/vouchers/${id}`);
        return response.data;
    },
    createVoucher: async (data) => {
        const response = await axiosInstance.post('/finance/vouchers', data);
        return response.data;
    },
    updateVoucher: async (id, data) => {
        const response = await axiosInstance.put(`/finance/vouchers/${id}`, data);
        return response.data;
    },
    deleteVoucher: async (id) => {
        const response = await axiosInstance.delete(`/finance/vouchers/${id}`);
        return response.data;
    }
};

