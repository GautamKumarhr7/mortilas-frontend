import React, { useState, useEffect } from "react";
import {
  ShoppingCart,
  FileText,
  CheckCircle2,
  TrendingUp,
  Plus,
  Search,
  Filter,
  Loader2,
  PackageOpen,
  Truck,
  AlertCircle,
  ArrowRight,
  XCircle,
  Pencil,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import Skeleton from "../../../components/common/Skeleton";
import { useApp } from "../../../hooks/useApp";
import IndentModal from "../components/procurement/IndentModal";
import VendorComparisonModal from "../components/procurement/VendorComparisonModal";
import {
  grnAPI,
  materialIndentAPI,
  purchaseOrderAPI,
  poBidAPI,
} from "../services";
import { vendorAPI } from "../../business/services";

export default function Procurement() {
  const { projects } = useApp();
  const [activeTab, setActiveTab] = useState("Indents");
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Modals
  const [isIndentModalOpen, setIsIndentModalOpen] = useState(false);
  const [isEditIndentOpen, setIsEditIndentOpen] = useState(false);
  const [editIndentData, setEditIndentData] = useState(null);
  const [isVendorComparisonOpen, setIsVendorComparisonOpen] = useState(false);
  const [isGRNModalOpen, setIsGRNModalOpen] = useState(false);
  const [isGRNPickerOpen, setIsGRNPickerOpen] = useState(false);

  // Data
  const [indents, setIndents] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [vendorsMap, setVendorsMap] = useState({});
  const [grns, setGrns] = useState([]);

  const [selectedPOForGRN, setSelectedPOForGRN] = useState(null);
  const [poForGRNItems, setPoForGRNItems] = useState([]);
  const [poForGRNBids, setPoForGRNBids] = useState([]);
  const [grnReceivedDate, setGrnReceivedDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [grnItemsState, setGrnItemsState] = useState([]);
  const [isGRNSaving, setIsGRNSaving] = useState(false);

  const grnEligiblePOs = purchaseOrders.filter(
    (po) =>
      po.deliveryStatus === "Arrived" &&
      !grns.some((grn) => String(grn.poId) === String(po.id)),
  );

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [iRes, pRes, vRes] = await Promise.all([
        materialIndentAPI.getAllMaterialIndents().catch(() => ({ data: [] })),
        purchaseOrderAPI.getAllPurchaseOrders().catch(() => ({ data: [] })),
        vendorAPI.getAllVendors().catch(() => ({ data: [] })),
      ]);
      const grnRes = await grnAPI.getAllGRNs().catch(() => ({ data: [] }));
      setIndents(Array.isArray(iRes) ? iRes : iRes?.data || []);
      setPurchaseOrders(Array.isArray(pRes) ? pRes : pRes?.data || []);
      setGrns(Array.isArray(grnRes) ? grnRes : grnRes?.data || []);

      const vArray = Array.isArray(vRes) ? vRes : vRes?.data || [];
      const vMap = {};
      vArray.forEach((v) => {
        const actualVendor = v.vendor || v;
        vMap[actualVendor.id || actualVendor._id] =
          actualVendor.companyName ||
          actualVendor.name ||
          actualVendor.vendorName ||
          `Vendor #${actualVendor.id || actualVendor._id}`;
      });
      setVendorsMap(vMap);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleIndentSaved = () => {
    fetchData();
    setIsEditIndentOpen(false);
    setEditIndentData(null);
  };

  const handleEditIndent = (indent) => {
    setEditIndentData(indent);
    setIsEditIndentOpen(true);
  };

  const handleDeleteIndent = async (indent) => {
    if (!window.confirm(`Delete indent ${indent.indentNo || `IND-${indent.id}`}?`)) return;
    try {
      await materialIndentAPI.deleteMaterialIndent(indent.id);
      toast.success('Indent deleted');
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to delete indent');
    }
  };

  const handlePOSaved = () => {
    fetchData();
  };

  const openGRNPicker = () => {
    if (grnEligiblePOs.length === 0) {
      toast.error("No GRN-eligible purchase orders are available");
      return;
    }

    setSelectedPOForGRN(grnEligiblePOs[0]);
    setIsGRNPickerOpen(true);
  };

  const handlePickPOForGRN = async () => {
    if (!selectedPOForGRN) return;
    setIsGRNPickerOpen(false);
    await openCreateGRN(selectedPOForGRN);
  };

  const handleApprovePO = async (id) => {
    try {
      await purchaseOrderAPI.approvePurchaseOrder(id);
      toast.success(`Purchase Order Approved successfully`);
      fetchData();
    } catch (error) {
      toast.error(`Failed to approve Purchase Order`);
      console.error(error);
    }
  };

  const handleRejectPO = async (id) => {
    try {
      await purchaseOrderAPI.rejectPurchaseOrder(id);
      toast.success(`Purchase Order Rejected successfully`);
      fetchData();
    } catch (error) {
      toast.error(`Failed to reject Purchase Order`);
      console.error(error);
    }
  };

  const openCreateGRN = async (po) => {
    setSelectedPOForGRN(po);
    setGrnReceivedDate(new Date().toISOString().slice(0, 10));
    setIsGRNModalOpen(true);

    try {
      const [poItemsRes, bidsRes] = await Promise.all([
        purchaseOrderAPI
          .getPoWithItems(po.id)
          .catch(() => ({ data: { items: [] } })),
        poBidAPI.getBidsByIndent(po.indentId).catch(() => []),
      ]);

      const items = poItemsRes?.data?.items || poItemsRes?.items || [];
      const bids = Array.isArray(bidsRes) ? bidsRes : bidsRes?.data || [];
      const sortedBids = [...bids].sort(
        (a, b) => Number(a.amount) - Number(b.amount),
      );
      const winningBidMaterialPrices = (
        sortedBids[0]?.materialAveragePrices || []
      ).reduce((map, priceItem) => {
        // match on itemId or poItemId just in case
        const key = priceItem?.itemId || priceItem?.poItemId;
        if (key !== undefined && key !== null) {
          map[String(key)] = Number(priceItem.averagePrice || 0);
        }
        return map;
      }, {});

      setPoForGRNItems(items);
      setPoForGRNBids(sortedBids);
      setGrnItemsState(
        items.map((item) => ({
          poItemId: item.id,
          itemId: item.itemId,
          receivedQty: Number(item.quantity || 0),
          acceptedQty: Number(item.quantity || 0),
          rejectedQty: 0,
          averagePrice: Number(winningBidMaterialPrices[String(item.itemId)] || winningBidMaterialPrices[String(item.id)] || 0),
          qualityStatus: "Pending Quality Check",
          employeeRating: 5,
        })),
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to load GRN details");
    }
  };

  const handleSaveGRN = async (e) => {
    e.preventDefault();
    if (!selectedPOForGRN) return;

    setIsGRNSaving(true);
    try {
      await grnAPI.createGRNFromPO({
        poId: selectedPOForGRN.id,
        receivedDate: grnReceivedDate,
        items: grnItemsState,
      });
      toast.success("GRN created successfully");
      setIsGRNModalOpen(false);
      setSelectedPOForGRN(null);
      setPoForGRNItems([]);
      setPoForGRNBids([]);
      setGrnItemsState([]);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to create GRN");
    } finally {
      setIsGRNSaving(false);
    }
  };

  const updateGrnItem = (index, field, value) => {
    setGrnItemsState((prev) =>
      prev.map((item, currentIndex) => {
        if (currentIndex !== index) return item;
        const nextItem = { ...item, [field]: value };
        if (field === "receivedQty") {
          const receivedQty = Number(value || 0);
          const acceptedQty = Number(nextItem.acceptedQty || 0);
          nextItem.rejectedQty = Math.max(receivedQty - acceptedQty, 0);
        }
        if (field === "acceptedQty") {
          const acceptedQty = Number(value || 0);
          const receivedQty = Number(nextItem.receivedQty || 0);
          nextItem.rejectedQty = Math.max(receivedQty - acceptedQty, 0);
        }
        return nextItem;
      }),
    );
  };

  const totalGRNValue = grnItemsState.reduce(
    (sum, row) =>
      sum + Number(row.acceptedQty || 0) * Number(row.averagePrice || 0),
    0,
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-[#2f6645]" /> Procurement
            Pipeline
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Manage indents, purchase orders, and GRNs
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={openGRNPicker}
            className="btn-primary flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Create GRN
          </button>
          
          <button
            onClick={() => setIsVendorComparisonOpen(true)}
            className="btn-secondary flex items-center gap-2 whitespace-nowrap"
          >
            <TrendingUp className="w-4 h-4" /> Vendor Compare
          </button>

          <button
            onClick={() => setIsIndentModalOpen(true)}
            className="btn-primary flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Raise Indent
          </button>
        </div>
      </div>

      {/* Stats Pipeline */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
              Pending Indents
            </p>
            <p className="text-xl font-black text-slate-800 mt-0.5">12</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
              Active POs
            </p>
            <p className="text-xl font-black text-slate-800 mt-0.5">8</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
              In Transit
            </p>
            <p className="text-xl font-black text-slate-800 mt-0.5">5</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <PackageOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
              Pending GRN
            </p>
            <p className="text-xl font-black text-slate-800 mt-0.5">3</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card overflow-hidden">
        <div className="border-b border-slate-200 px-4 flex gap-6">
          {["Indents", "Purchase Orders", "GRNs & Deliveries"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === tab ? "border-[#2f6645] text-[#2f6645]" : "border-transparent text-slate-500 hover:text-slate-700"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-4 flex items-center gap-4 border-b border-slate-100 bg-slate-50">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search ${activeTab.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2f6645]/20 focus:border-[#2f6645]"
            />
          </div>
        </div>

        <div className="p-0">
          {activeTab === "Indents" &&
            (indents.length === 0 ? (
              <div className="p-10 text-center text-slate-500 flex flex-col items-center justify-center">
                <FileText className="w-12 h-12 text-slate-200 mb-3" />
                <p className="font-bold text-slate-700">
                  No Material Indents Found
                </p>
                <p className="text-sm mt-1">
                  Create a new indent from a Work Order to get started.
                </p>
                <button
                  onClick={() => setIsIndentModalOpen(true)}
                  className="btn-primary mt-4"
                >
                  Raise Indent
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
                      <th className="p-4">Indent No</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Work Order ID</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {indents.map((indent) => (
                      <tr
                        key={indent.id || indent._id}
                        className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="p-4 font-bold text-slate-800">
                          {indent.indentNo || `IND-${indent.id}`}
                        </td>
                        <td className="p-4 text-sm text-slate-600">
                          {new Date(
                            indent.createdAt || indent.date,
                          ).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-sm text-slate-600">
                          {indent.workOrderId}
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-md">
                            {indent.status || "Pending"}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex justify-center items-center gap-2">
                            <button
                              onClick={() => handleEditIndent(indent)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteIndent(indent)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          {activeTab === "Purchase Orders" &&
            (purchaseOrders.length === 0 ? (
              <div className="p-10 text-center text-slate-500 flex flex-col items-center justify-center">
                <ShoppingCart className="w-12 h-12 text-slate-200 mb-3" />
                <p className="font-bold text-slate-700">
                  No Purchase Orders Found
                </p>
                <p className="text-sm mt-1">
                  Purchase Orders are generated automatically when vendor bids are approved.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
                      <th className="p-4">PO No</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Vendor ID</th>
                      <th className="p-4">Total Value</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseOrders.map((po) => (
                      <tr
                        key={po.id || po._id}
                        className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="p-4 font-bold text-slate-800">
                          {po.poNo || `PO-${po.id}`}
                        </td>
                        <td className="p-4 text-sm text-slate-600">
                          {new Date(
                            po.createdAt || po.date,
                          ).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-sm text-slate-600">
                          {vendorsMap[po.vendorId] || po.vendorId}
                        </td>
                        <td className="p-4 font-bold text-[#2f6645]">
                          ₹ {Number(po.totalValue || 0).toLocaleString()}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-1 text-xs font-bold rounded-md ${po.status === "Approved" ? "bg-emerald-100 text-emerald-700" : po.status === "Rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}
                          >
                            {po.status || "Draft"}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex justify-center items-center gap-2">
                            {(po.status === "Draft" ||
                              po.status === "Pending Approval") && (
                              <>
                                <button
                                  onClick={() =>
                                    handleApprovePO(po.id || po._id)
                                  }
                                  className="text-emerald-500 hover:text-emerald-600 transition-colors"
                                  title="Approve"
                                >
                                  <CheckCircle2 className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleRejectPO(po.id || po._id)
                                  }
                                  className="text-red-500 hover:text-red-600 transition-colors"
                                  title="Reject"
                                >
                                  <XCircle className="w-5 h-5" />
                                </button>
                              </>
                            )}
                            {po.status === "Accepted by Vendor" && (
                              <button
                                onClick={() => openCreateGRN(po)}
                                className="btn-primary py-2 px-4 text-[9px] uppercase tracking-widest"
                              >
                                Create GRN
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

          {activeTab === "GRNs & Deliveries" && (
            <div className="space-y-6 p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">
                    GRN Register
                  </h3>
                  <p className="text-sm text-slate-500">
                    Create GRNs from accepted POs and hand them to finance for
                    payment.
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto card">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
                      <th className="p-4">GRN No</th>
                      <th className="p-4">PO No</th>
                      <th className="p-4">Vendor</th>
                      <th className="p-4">Received Date</th>
                      <th className="p-4">Total Price</th>
                      <th className="p-4">Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grns.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="p-8 text-center text-slate-500"
                        >
                          No GRNs created yet.
                        </td>
                      </tr>
                    ) : (
                      grns.map((grn) => (
                        <tr
                          key={grn.id}
                          className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="p-4 font-bold text-slate-800">
                            {grn.grnNo}
                          </td>
                          <td className="p-4 text-sm text-slate-600">
                            {purchaseOrders.find((po) => po.id === grn.poId)
                              ?.poNo || `PO-${grn.poId}`}
                          </td>
                          <td className="p-4 text-sm text-slate-600">
                            {vendorsMap[grn.vendorId] || grn.vendorId || "N/A"}
                          </td>
                          <td className="p-4 text-sm text-slate-600">
                            {new Date(grn.receivedDate).toLocaleDateString()}
                          </td>
                          <td className="p-4 font-bold text-[#2f6645]">
                            ₹{Number(grn.totalPrice || 0).toLocaleString()}
                          </td>
                          <td className="p-4">
                            <span className="badge badge-blue">
                              {grn.paymentStatus}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <IndentModal
        isOpen={isIndentModalOpen}
        isEditing={false}
        indentData={null}
        onClose={() => setIsIndentModalOpen(false)}
        onSave={handleIndentSaved}
      />
      <IndentModal
        isOpen={isEditIndentOpen}
        isEditing={true}
        indentData={editIndentData}
        onClose={() => { setIsEditIndentOpen(false); setEditIndentData(null); }}
        onSave={handleIndentSaved}
      />
      <VendorComparisonModal
        isOpen={isVendorComparisonOpen}
        onClose={() => setIsVendorComparisonOpen(false)}
        onPOSaved={handlePOSaved}
      />

      {isGRNModalOpen && selectedPOForGRN && (
        <div className="fixed inset-0 z-[350] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">
                  Create GRN from PO
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedPOForGRN.poNo} • Winning bid and vendor details are
                  auto-derived from bids
                </p>
              </div>
              <button
                onClick={() => setIsGRNModalOpen(false)}
                className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-xl transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleSaveGRN}
              className="flex-1 overflow-y-auto p-6 space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Vendor
                  </p>
                  <p className="font-bold text-slate-800 mt-1">
                    {vendorsMap[selectedPOForGRN.vendorId] ||
                      selectedPOForGRN.vendorId ||
                      "Auto from winning bid"}
                  </p>
                </div>
                <div className="card p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Inspection Date
                  </p>
                  <input
                    type="date"
                    className="input mt-2"
                    value={grnReceivedDate}
                    onChange={(e) => setGrnReceivedDate(e.target.value)}
                  />
                </div>
                <div className="card p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Average Bid
                  </p>
                  <p className="font-bold text-slate-800 mt-1">
                    ₹
                    {poForGRNBids.length
                      ? (
                          poForGRNBids.reduce(
                            (sum, bid) => sum + Number(bid.amount || 0),
                            0,
                          ) / poForGRNBids.length
                        ).toLocaleString("en-IN", { minimumFractionDigits: 2 })
                      : "0.00"}
                  </p>
                </div>
                <div className="card p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Winning Bid
                  </p>
                  <p className="font-bold text-emerald-700 mt-1">
                    ₹
                    {poForGRNBids[0]?.amount
                      ? Number(poForGRNBids[0].amount).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })
                      : "0.00"}
                  </p>
                </div>
                <div className="card p-4 md:col-span-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    GRN Total Value
                  </p>
                  <p className="font-black text-slate-900 mt-1 text-2xl">
                    ₹
                    {totalGRNValue.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Calculated as accepted quantity x average material price.
                  </p>
                </div>
              </div>

              <div className="card overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                  <h4 className="font-bold text-slate-800">
                    Quality Inspection & Material Acceptance
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Record inspection outcomes, received quantities, and 1-5
                    vendor ratings for each item before GRN submission.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        {[
                          "Item",
                          "Ordered Qty",
                          "Received Qty",
                          "Accepted Qty",
                          "Rejected Qty",
                          "Avg Price",
                          "Line Total",
                          "Inspection",
                          "Rating",
                        ].map((header) => (
                          <th
                            key={header}
                            className="table-header whitespace-nowrap"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {grnItemsState.map((row, index) => {
                        const poItem = poForGRNItems[index];
                        return (
                          <tr key={row.poItemId} className="table-row">
                            <td className="table-cell">
                              <p className="font-semibold text-slate-800">
                                {poItem?.itemName || `Item #${row.itemId}`}
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                PO Item #{row.poItemId}
                              </p>
                            </td>
                            <td className="table-cell text-center font-medium">
                              {poItem?.quantity || 0}
                            </td>
                            <td className="table-cell">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="input w-28"
                                value={row.receivedQty}
                                onChange={(e) =>
                                  updateGrnItem(
                                    index,
                                    "receivedQty",
                                    e.target.value,
                                  )
                                }
                              />
                            </td>
                            <td className="table-cell">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="input w-28"
                                value={row.acceptedQty}
                                onChange={(e) =>
                                  updateGrnItem(
                                    index,
                                    "acceptedQty",
                                    e.target.value,
                                  )
                                }
                              />
                            </td>
                            <td className="table-cell font-semibold text-slate-700">
                              {row.rejectedQty}
                            </td>
                            <td className="table-cell">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="input w-32"
                                value={row.averagePrice}
                                onChange={(e) =>
                                  updateGrnItem(
                                    index,
                                    "averagePrice",
                                    e.target.value,
                                  )
                                }
                              />
                            </td>
                            <td className="table-cell font-bold text-slate-800">
                              ₹
                              {(
                                Number(row.acceptedQty || 0) *
                                Number(row.averagePrice || 0)
                              ).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                            <td className="table-cell">
                              <select
                                className="input w-40"
                                value={row.qualityStatus}
                                onChange={(e) =>
                                  updateGrnItem(
                                    index,
                                    "qualityStatus",
                                    e.target.value,
                                  )
                                }
                              >
                                <option>Pending Quality Check</option>
                                <option>Accepted</option>
                                <option>Partially Accepted</option>
                                <option>Rejected</option>
                              </select>
                            </td>
                            <td className="table-cell">
                              <select
                                className="input w-24"
                                value={row.employeeRating}
                                onChange={(e) =>
                                  updateGrnItem(
                                    index,
                                    "employeeRating",
                                    Number(e.target.value),
                                  )
                                }
                              >
                                {[1, 2, 3, 4, 5].map((rating) => (
                                  <option key={rating} value={rating}>
                                    {rating}
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setIsGRNModalOpen(false)}
                  className="btn-secondary px-6"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGRNSaving}
                  className="btn-primary flex items-center gap-2 px-6"
                >
                  {isGRNSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  {isGRNSaving ? "Creating..." : "Create GRN"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isGRNPickerOpen && (
        <div className="fixed inset-0 z-[340] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">
                  Select PO for GRN
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Choose an approved or arrived PO to start quality inspection
                  and GRN creation.
                </p>
              </div>
              <button
                onClick={() => setIsGRNPickerOpen(false)}
                className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-xl transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="card p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  GRN-eligible PO
                </p>
                <select
                  className="input"
                  value={selectedPOForGRN?.id || ""}
                  onChange={(e) => {
                    const selected = grnEligiblePOs.find(
                      (po) => String(po.id) === e.target.value,
                    );
                    setSelectedPOForGRN(selected || null);
                  }}
                >
                  <option value="">Select purchase order</option>
                  {grnEligiblePOs.map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.poNo || `PO-${po.id}`} •{" "}
                      {vendorsMap[po.vendorId] || po.vendorId || "Vendor"}
                    </option>
                  ))}
                </select>
              </div>

              {selectedPOForGRN ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="card p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      PO No
                    </p>
                    <p className="font-bold text-slate-800 mt-1">
                      {selectedPOForGRN.poNo || `PO-${selectedPOForGRN.id}`}
                    </p>
                  </div>
                  <div className="card p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Vendor
                    </p>
                    <p className="font-bold text-slate-800 mt-1">
                      {vendorsMap[selectedPOForGRN.vendorId] ||
                        selectedPOForGRN.vendorId ||
                        "Auto from winning bid"}
                    </p>
                  </div>
                  <div className="card p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Status
                    </p>
                    <p className="font-bold text-emerald-700 mt-1">
                      {selectedPOForGRN.status}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
                  No accepted purchase orders are available for GRN creation.
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsGRNPickerOpen(false)}
                  className="btn-secondary px-6"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePickPOForGRN}
                  disabled={!selectedPOForGRN}
                  className="btn-primary px-6 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Open GRN Form
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
