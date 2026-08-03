import { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  Plus,
  Search,
  Edit3,
  Trash2,
  X,
  Loader2,
  Save,
  Layers,
  ClipboardCheck,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import Skeleton from "../../../components/common/Skeleton";
import {
  inventoryAPI,
  materialIndentAPI,
  materialIndentItemAPI,
} from "../services";
import { workOrderAPI } from "../../projects/services";

const initialFormState = {
  indentId: "",
  itemId: "",
  workOrderId: "",
  requiredQty: "",
  availableQty: "",
  shortageQty: "",
  procurementRequired: false,
  status: "Pending",
};

const getArray = (response, keys = []) => {
  if (Array.isArray(response)) return response;
  for (const key of keys) {
    const value = response?.[key];
    if (Array.isArray(value)) return value;
  }
  return Array.isArray(response?.data) ? response.data : [];
};

const asNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function MaterialIndentItems() {
  const [items, setItems] = useState([]);
  const [indents, setIndents] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialFormState);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [itemsRes, indentsRes, inventoryRes, workOrdersRes] =
        await Promise.all([
          materialIndentItemAPI.getAllMaterialIndentItems().catch(() => []),
          materialIndentAPI.getAllMaterialIndents().catch(() => []),
          inventoryAPI.getAllMaterials().catch(() => []),
          workOrderAPI.getAllWorkOrders().catch(() => []),
        ]);

      setItems(getArray(itemsRes, ["data", "materialIndentItems"]));
      setIndents(getArray(indentsRes, ["data", "materialIndents"]));
      setInventoryItems(
        getArray(inventoryRes, ["data", "materials", "inventories", "items"]),
      );
      setWorkOrders(getArray(workOrdersRes, ["data", "workOrders"]));
    } catch (error) {
      console.error("Failed to load material indent items", error);
      toast.error("Failed to load material indent items");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateDerivedShortage = (nextRequiredQty, nextAvailableQty) => {
    const requiredQty = asNumber(nextRequiredQty);
    const availableQty = asNumber(nextAvailableQty);
    return String(Math.max(requiredQty - availableQty, 0));
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      indentId: item.indentId?.toString?.() || item.indentId || "",
      itemId: item.itemId?.toString?.() || item.itemId || "",
      workOrderId: item.workOrderId?.toString?.() || item.workOrderId || "",
      requiredQty: item.requiredQty?.toString?.() || "",
      availableQty: item.availableQty?.toString?.() || "",
      shortageQty:
        item.shortageQty?.toString?.() ||
        updateDerivedShortage(item.requiredQty, item.availableQty),
      procurementRequired: Boolean(item.procurementRequired),
      status: item.status || "Pending",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete material indent item #${item.id}?`)) return;
    try {
      await materialIndentItemAPI.deleteMaterialIndentItem(item.id);
      toast.success("Material indent item deleted");
      fetchData();
    } catch (error) {
      console.error("Delete failed", error);
      toast.error("Failed to delete material indent item");
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!formData.indentId || !formData.itemId || !formData.workOrderId) {
      toast.error("Indent, item, and work order are required");
      return;
    }

    const payload = {
      indentId: Number(formData.indentId),
      itemId: Number(formData.itemId),
      workOrderId: Number(formData.workOrderId),
      requiredQty: Number(formData.requiredQty),
      availableQty: Number(formData.availableQty),
      shortageQty: Number(
        formData.shortageQty ||
          updateDerivedShortage(formData.requiredQty, formData.availableQty),
      ),
      procurementRequired: Boolean(formData.procurementRequired),
      status: formData.status,
    };

    setIsSaving(true);
    try {
      if (editingId) {
        await materialIndentItemAPI.updateMaterialIndentItem(
          editingId,
          payload,
        );
        toast.success("Material indent item updated");
      } else {
        await materialIndentItemAPI.createMaterialIndentItem(payload);
        toast.success("Material indent item created");
      }
      setIsModalOpen(false);
      setFormData(initialFormState);
      setEditingId(null);
      fetchData();
    } catch (error) {
      console.error("Save failed", error);
      toast.error(
        error?.response?.data?.message || "Failed to save material indent item",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;

    return items.filter((item) => {
      const indentLabel = item.indentNo || item.indentId || "";
      const inventoryLabel =
        item.itemName || item.materialName || item.name || item.itemId || "";
      const workOrderLabel = item.workOrderNo || item.workOrderId || "";
      return [
        indentLabel,
        inventoryLabel,
        workOrderLabel,
        item.status,
        item.procurementRequired ? "yes" : "no",
      ].some((value) => String(value).toLowerCase().includes(term));
    });
  }, [items, search]);

  const stats = [
    {
      label: "Total Lines",
      value: items.length,
      icon: Layers,
      bg: "bg-blue-50",
      color: "text-blue-600",
    },
    {
      label: "Procurement Required",
      value: items.filter((item) => item.procurementRequired).length,
      icon: ClipboardCheck,
      bg: "bg-emerald-50",
      color: "text-emerald-600",
    },
    {
      label: "Pending",
      value: items.filter(
        (item) => (item.status || "").toLowerCase() === "pending",
      ).length,
      icon: AlertTriangle,
      bg: "bg-amber-50",
      color: "text-amber-600",
    },
    {
      label: "Approved",
      value: items.filter(
        (item) => (item.status || "").toLowerCase() === "approved",
      ).length,
      icon: ClipboardList,
      bg: "bg-slate-100",
      color: "text-slate-700",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in dashboard-container">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-[#2f6645]" /> Material Indent
            Items
          </h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2 px-0.5 border-l-2 border-[#2f6645] ml-0.5 pl-2">
            Indent line items, stock availability, and procurement flags
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="input pl-10 h-10 text-xs font-medium w-full"
              placeholder="Search indents, items or work orders..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <button
            onClick={handleOpenCreate}
            className="btn-primary flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-5">
            <div className="flex justify-between items-start">
              <div className={`${stat.bg} p-2.5 rounded-2xl`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                CRUD
              </span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-black text-slate-800 tracking-tight">
                {stat.value}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="table-header">Indent</th>
                <th className="table-header">Item</th>
                <th className="table-header">Work Order</th>
                <th className="table-header text-right">Qty</th>
                <th className="table-header text-center">Procurement</th>
                <th className="table-header text-center">Status</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="border-b border-slate-100">
                    {Array.from({ length: 7 }).map((__, cellIndex) => (
                      <td key={cellIndex} className="px-6 py-4">
                        <Skeleton className="w-full h-4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const indent = indents.find(
                    (entry) => String(entry.id) === String(item.indentId),
                  );
                  const inventory = inventoryItems.find(
                    (entry) => String(entry.id) === String(item.itemId),
                  );
                  const workOrder = workOrders.find(
                    (entry) => String(entry.id) === String(item.workOrderId),
                  );
                  const itemName =
                    inventory?.itemName ||
                    inventory?.materialName ||
                    inventory?.name ||
                    item.itemName ||
                    `Item #${item.itemId}`;

                  return (
                    <tr
                      key={item.id}
                      className="table-row hover:bg-slate-50 transition-colors"
                    >
                      <td className="table-cell">
                        <div>
                          <p className="text-slate-900 font-bold">
                            {indent?.indentNo ||
                              item.indentNo ||
                              `Indent #${item.indentId}`}
                          </p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                            ID: {item.indentId}
                          </p>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div>
                          <p className="text-slate-900 font-bold">{itemName}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                            Item ID: {item.itemId}
                          </p>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div>
                          <p className="text-slate-900 font-bold">
                            {workOrder?.workOrderNo ||
                              workOrder?.workOrderNumber ||
                              item.workOrderNo ||
                              `WO #${item.workOrderId}`}
                          </p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                            Work Order ID: {item.workOrderId}
                          </p>
                        </div>
                      </td>
                      <td className="table-cell text-right">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-800">
                            {item.requiredQty}
                          </p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Avail: {item.availableQty} | Short:{" "}
                            {item.shortageQty}
                          </p>
                        </div>
                      </td>
                      <td className="table-cell text-center">
                        <span
                          className={`badge ${item.procurementRequired ? "badge-yellow" : "badge-gray"}`}
                        >
                          {item.procurementRequired ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="table-cell text-center">
                        <span
                          className={`badge ${item.status === "Approved" ? "badge-green" : item.status === "Rejected" ? "badge-red" : item.status === "PO Generated" ? "badge-blue" : "badge-gray"}`}
                        >
                          {item.status || "Pending"}
                        </span>
                      </td>
                      <td className="table-cell text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="p-10 text-center text-slate-400 font-medium"
                  >
                    No material indent items found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-[#2f6645]" />{" "}
                {editingId
                  ? "Update Material Indent Item"
                  : "Add Material Indent Item"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleSave}
              className="flex-1 overflow-y-auto p-6 space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Material Indent <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    className="input w-full"
                    value={formData.indentId}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        indentId: event.target.value,
                      }))
                    }
                  >
                    <option value="">Select indent</option>
                    {indents.map((indent) => (
                      <option key={indent.id} value={indent.id}>
                        {indent.indentNo || `Indent #${indent.id}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Inventory Item <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    className="input w-full"
                    value={formData.itemId}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        itemId: event.target.value,
                      }))
                    }
                  >
                    <option value="">Select item</option>
                    {inventoryItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.itemName ||
                          item.materialName ||
                          item.name ||
                          `Item #${item.id}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Work Order <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    className="input w-full"
                    value={formData.workOrderId}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        workOrderId: event.target.value,
                      }))
                    }
                  >
                    <option value="">Select work order</option>
                    {workOrders.map((workOrder) => (
                      <option key={workOrder.id} value={workOrder.id}>
                        {workOrder.workOrderNo ||
                          workOrder.workOrderNumber ||
                          `WO #${workOrder.id}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Required Qty <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    className="input w-full"
                    value={formData.requiredQty}
                    onChange={(event) => {
                      const requiredQty = event.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        requiredQty,
                        shortageQty: updateDerivedShortage(
                          requiredQty,
                          prev.availableQty,
                        ),
                      }));
                    }}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Available Qty <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    className="input w-full"
                    value={formData.availableQty}
                    onChange={(event) => {
                      const availableQty = event.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        availableQty,
                        shortageQty: updateDerivedShortage(
                          prev.requiredQty,
                          availableQty,
                        ),
                      }));
                    }}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Shortage Qty
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    readOnly
                    className="input w-full bg-slate-50"
                    value={formData.shortageQty}
                    placeholder="Auto calculated"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Status
                  </label>
                  <select
                    className="input w-full"
                    value={formData.status}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        status: event.target.value,
                      }))
                    }
                  >
                    <option>Pending</option>
                    <option>Approved</option>
                    <option>PO Generated</option>
                    <option>Rejected</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <input
                  id="procurementRequired"
                  type="checkbox"
                  checked={formData.procurementRequired}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      procurementRequired: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-slate-300 text-[#2f6645] focus:ring-[#2f6645]"
                />
                <label
                  htmlFor="procurementRequired"
                  className="text-sm font-semibold text-slate-700"
                >
                  Mark as procurement required
                </label>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary px-6"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary flex items-center gap-2 px-6"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSaving ? "Processing..." : "Save Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
