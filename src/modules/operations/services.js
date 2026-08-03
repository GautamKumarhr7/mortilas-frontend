import axiosInstance from "../../utils/axios";

export const equipmentAPI = {
  getAllEquipments: async () => {
    const response = await axiosInstance.get("/equipments");
    return response.data;
  },
  getEquipmentById: async (id) => {
    const response = await axiosInstance.get(`/equipments/${id}`);
    return response.data;
  },
  createEquipment: async (data) => {
    const response = await axiosInstance.post("/equipments", data);
    return response.data;
  },
  updateEquipment: async (id, data) => {
    const response = await axiosInstance.put(`/equipments/${id}`, data);
    return response.data;
  },
  deleteEquipment: async (id) => {
    const response = await axiosInstance.delete(`/equipments/${id}`);
    return response.data;
  },
  deployEquipment: async (id, data) => {
    const response = await axiosInstance.post(`/equipments/${id}/deploy`, data);
    return response.data;
  },
  returnEquipment: async (id, deploymentId, data) => {
    const response = await axiosInstance.put(
      `/equipments/${id}/deploy/${deploymentId}/return`,
      data,
    );
    return response.data;
  },
  logMaintenance: async (id, data) => {
    const response = await axiosInstance.post(
      `/equipments/${id}/maintenance`,
      data,
    );
    return response.data;
  },
  logFuelOrUtilization: async (id, data) => {
    const response = await axiosInstance.post(`/equipments/${id}/logs`, data);
    return response.data;
  },
};

export const inventoryAPI = {
  getAllMaterials: async () => {
    const response = await axiosInstance.get("/inventories");
    return response.data;
  },
  getMaterialById: async (id) => {
    const response = await axiosInstance.get(`/inventories/${id}`);
    return response.data;
  },
  createMaterial: async (data) => {
    const response = await axiosInstance.post("/inventories", data);
    return response.data;
  },
  updateMaterial: async (id, data) => {
    const response = await axiosInstance.put(`/inventories/${id}`, data);
    return response.data;
  },
  deleteMaterial: async (id) => {
    const response = await axiosInstance.delete(`/inventories/${id}`);
    return response.data;
  },
};

export const materialReconciliationAPI = {
  // Get all material reconciliations
  getAllMaterialReconciliations: async () => {
    const response = await axiosInstance.get("/material-reconciliations");
    return response.data;
  },

  // Create a new material reconciliation entry
  createMaterialReconciliation: async (data) => {
    const response = await axiosInstance.post(
      "/material-reconciliations",
      data,
    );
    return response.data;
  },

  // Update reconciliation status if needed
  updateMaterialReconciliationStatus: async (id, status) => {
    const response = await axiosInstance.patch(
      `/material-reconciliations/${id}`,
      { status },
    );
    return response.data;
  },
};

export const procurementAPI = {
  // Get all procurements
  getAllProcurements: async () => {
    const response = await axiosInstance.get("/procurements");
    return response.data;
  },

  // Create a new procurement
  createProcurement: async (procurementData) => {
    const response = await axiosInstance.post("/procurements", procurementData);
    return response.data;
  },

  // Update procurement status/progress
  updateProcurementStatus: async (id, updateData) => {
    const response = await axiosInstance.patch(
      `/procurements/${id}`,
      updateData,
    );
    return response.data;
  },
};

export const materialIndentAPI = {
  getAllMaterialIndents: async () => {
    const response = await axiosInstance.get("/material-indents");
    return response.data;
  },
  createMaterialIndent: async (data) => {
    const response = await axiosInstance.post("/material-indents", data);
    return response.data;
  },
  updateMaterialIndent: async (id, data) => {
    const response = await axiosInstance.put(`/material-indents/${id}`, data);
    return response.data;
  },
  deleteMaterialIndent: async (id) => {
    const response = await axiosInstance.delete(`/material-indents/${id}`);
    return response.data;
  },
};

export const materialIndentItemAPI = {
  getAllMaterialIndentItems: async () => {
    const response = await axiosInstance.get("/material-indent-items");
    return response.data;
  },
  getMaterialIndentItemById: async (id) => {
    const response = await axiosInstance.get(`/material-indent-items/${id}`);
    return response.data;
  },
  createMaterialIndentItem: async (data) => {
    const response = await axiosInstance.post("/material-indent-items", data);
    return response.data;
  },
  updateMaterialIndentItem: async (id, data) => {
    const response = await axiosInstance.put(
      `/material-indent-items/${id}`,
      data,
    );
    return response.data;
  },
  deleteMaterialIndentItem: async (id) => {
    const response = await axiosInstance.delete(`/material-indent-items/${id}`);
    return response.data;
  },
};

export const purchaseOrderAPI = {
  getAllPurchaseOrders: async () => {
    const response = await axiosInstance.get("/purchase-orders");
    return response.data;
  },
  createPurchaseOrder: async (data) => {
    const response = await axiosInstance.post("/purchase-orders", data);
    return response.data;
  },
  approvePurchaseOrder: async (id) => {
    const response = await axiosInstance.patch(
      `/purchase-orders/${id}/approve`,
    );
    return response.data;
  },
  rejectPurchaseOrder: async (id) => {
    const response = await axiosInstance.patch(`/purchase-orders/${id}/reject`);
    return response.data;
  },
  updateDeliveryStatus: async (id, data) => {
    const response = await axiosInstance.patch(
      `/purchase-orders/${id}/delivery-status`,
      data,
    );
    return response.data;
  },
  getPoWithItems: async (id) => {
    const response = await axiosInstance.get(`/purchase-orders/${id}/items`);
    return response.data;
  },
  generateInvoice: async (id, data) => {
    const response = await axiosInstance.post(
      `/purchase-orders/${id}/invoice`,
      data,
    );
    return response.data;
  },
};

export const grnAPI = {
  getAllGRNs: async () => {
    const response = await axiosInstance.get("/grns");
    return response.data;
  },
  createGRNFromPO: async (data) => {
    const response = await axiosInstance.post("/grns/from-po", data);
    return response.data;
  },
  initiatePayment: async (id, data) => {
    const response = await axiosInstance.patch(
      `/grns/${id}/initiate-payment`,
      data,
    );
    return response.data;
  },
};

export const poBidAPI = {
  getBidsByIndent: async (indentId) => {
    const response = await axiosInstance.get(`/po-bids/indent/${indentId}`);
    return response.data;
  },
  getBidsByVendor: async (vendorId) => {
    const response = await axiosInstance.get(`/po-bids/vendor/${vendorId}`);
    return response.data;
  },
  createBid: async (data) => {
    const response = await axiosInstance.post("/po-bids", data);
    return response.data;
  },
  winBid: async (id) => {
    const response = await axiosInstance.patch(`/po-bids/${id}/win`);
    return response.data;
  },
};

export const subcontractorAPI = {
  getAllSubcontractors: async () => {
    const response = await axiosInstance.get("/subcontractors");
    return response.data;
  },
  getSubcontractorById: async (id) => {
    const response = await axiosInstance.get(`/subcontractors/${id}`);
    return response.data;
  },
  createSubcontractor: async (data) => {
    const response = await axiosInstance.post("/subcontractors", data);
    return response.data;
  },
  updateSubcontractor: async (id, data) => {
    const response = await axiosInstance.put(`/subcontractors/${id}`, data);
    return response.data;
  },
  deleteSubcontractor: async (id) => {
    const response = await axiosInstance.delete(`/subcontractors/${id}`);
    return response.data;
  },
};
