import React, { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  PackageOpen,
  Search,
  TrendingUp,
  FileText,
  Loader2,
  X,
  CheckCircle2,
  TimerReset,
  ClipboardList,
  Trophy,
  Truck,
  Calendar,
} from "lucide-react";
import toast from "react-hot-toast";
import Skeleton from "../../../components/common/Skeleton";
import { poBidAPI, materialIndentAPI, materialIndentItemAPI, inventoryAPI, purchaseOrderAPI } from "../../operations/services";
import { workOrderAPI } from "../../projects/services";
import { useSelector } from "react-redux";

export default function VendorDashboard() {
  const { userProfile } = useSelector((state) => state.auth);
  const [indents, setIndents] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [materialsMap, setMaterialsMap] = useState({});
  const [myBids, setMyBids] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Bid submission modal
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [selectedIndent, setSelectedIndent] = useState(null);
  const [indentItems, setIndentItems] = useState([]);
  const [itemPrices, setItemPrices] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delivery update modal
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [deliveryIndent, setDeliveryIndent] = useState(null);
  const [deliveryPO, setDeliveryPO] = useState(null);
  const [deliveryStatus, setDeliveryStatus] = useState("Not Started");
  const [arrivalDate, setArrivalDate] = useState("");
  const [isUpdatingDelivery, setIsUpdatingDelivery] = useState(false);

  const vendorId =
    userProfile?.id ||
    userProfile?._id ||
    userProfile?.vendorId ||
    userProfile?.vendor?.id;

  useEffect(() => {
    if (vendorId) fetchData();
  }, [vendorId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [iRes, woRes, matRes, bidRes, poRes] = await Promise.all([
        materialIndentAPI.getAllMaterialIndents(),
        workOrderAPI.getAllWorkOrders().catch(() => []),
        inventoryAPI.getAllMaterials().catch(() => []),
        poBidAPI.getBidsByVendor(vendorId).catch(() => []),
        purchaseOrderAPI.getAllPurchaseOrders().catch(() => []),
      ]);
      const list = Array.isArray(iRes) ? iRes : (iRes?.data?.materialIndents || iRes?.data || []);
      const woList = Array.isArray(woRes) ? woRes : (woRes?.data || []);
      const matList = Array.isArray(matRes) ? matRes : (matRes?.data || []);
      const bidList = Array.isArray(bidRes) ? bidRes : (bidRes?.data || []);
      const poList = Array.isArray(poRes)
        ? poRes
        : Array.isArray(poRes?.data)
        ? poRes.data
        : (poRes?.data?.purchaseOrders || []);
      const mMap = {};
      matList.forEach((m) => { mMap[String(m.id)] = m; });
      setIndents(list);
      setWorkOrders(woList);
      setMaterialsMap(mMap);
      setMyBids(bidList);
      setPurchaseOrders(poList);
    } catch (error) {
      console.error("Failed to fetch data", error);
      toast.error("Failed to load dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  // Build a map: indentId -> my bid for quick lookup
  const myBidsByIndent = useMemo(() => {
    const map = {};
    myBids.forEach((b) => { map[String(b.indentId)] = b; });
    return map;
  }, [myBids]);

  const visibleIndents = useMemo(
    () => indents.filter((i) => {
      const s = (i.status || "").toLowerCase();
      return s === "approved" || s === "po created";
    }),
    [indents]
  );

  const filtered = visibleIndents.filter((i) => {
    const term = search.toLowerCase();
    return (
      (i.indentNo || "").toLowerCase().includes(term) ||
      String(i.workOrderId || "").includes(term)
    );
  });

  const handleOpenBidModal = async (indent) => {
    setSelectedIndent(indent);
    setIndentItems([]);
    setItemPrices({});
    setIsBidModalOpen(true);
    try {
      const allItemsRes = await materialIndentItemAPI.getAllMaterialIndentItems();
      const allItems = Array.isArray(allItemsRes)
        ? allItemsRes
        : allItemsRes?.data?.materialIndentItems || allItemsRes?.data || [];
      const thisItems = allItems.filter(
        (it) => String(it.indentId) === String(indent.id || indent._id)
      );
      setIndentItems(thisItems);
      const initial = {};
      thisItems.forEach((it) => { initial[it.id] = ""; });
      setItemPrices(initial);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load indent materials");
    }
  };

  const handleOpenDeliveryModal = (indent) => {
    // Try matching by indentId OR indent_id to be safe with various API response shapes
    const po = purchaseOrders.find(
      p => String(p.indentId ?? p.indent_id ?? '') === String(indent.id)
    );
    setDeliveryIndent(indent);
    setDeliveryPO(po || null);
    // Pre-populate with existing values from the PO
    setDeliveryStatus(po?.deliveryStatus ?? po?.delivery_status ?? "Not Started");
    setArrivalDate(
      po?.arrivalTime
        ? new Date(po.arrivalTime).toISOString().slice(0, 16)
        : po?.arrival_time
        ? new Date(po.arrival_time).toISOString().slice(0, 16)
        : ""
    );
    setIsDeliveryModalOpen(true);
  };

  const handleUpdateDelivery = async (e) => {
    e.preventDefault();
    if (!deliveryPO) {
      toast.error("Could not find associated Purchase Order for this indent");
      return;
    }
    setIsUpdatingDelivery(true);
    try {
      await purchaseOrderAPI.updateDeliveryStatus(deliveryPO.id, {
        deliveryStatus,
        arrivalTime: arrivalDate || undefined,
      });
      toast.success("Delivery status updated!");
      setIsDeliveryModalOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update delivery status");
    } finally {
      setIsUpdatingDelivery(false);
    }
  };

  const totalBidAmount = indentItems.reduce(
    (sum, item) => sum + Number(itemPrices[item.id] || 0) * Number(item.requiredQty || 1),
    0
  );

  const handleSubmitBid = async (event) => {
    event.preventDefault();
    const computedBidAmount = indentItems.length > 0 ? totalBidAmount : 0;
    if (!selectedIndent || !vendorId || !computedBidAmount) {
      toast.error("Vendor and bid amount are required");
      return;
    }
    setIsSubmitting(true);
    try {
      await poBidAPI.createBid({
        indentId: selectedIndent.id,
        vendorId,
        amount: computedBidAmount,
        materialAveragePrices: indentItems.map((item) => ({
          indentItemId: item.id,
          itemId: item.itemId,
          averagePrice: Number(itemPrices[item.id] || 0),
        })),
      });
      toast.success("Bid submitted successfully!");
      setIsBidModalOpen(false);
      setSelectedIndent(null);
      setIndentItems([]);
      setItemPrices({});
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to submit bid");
    } finally {
      setIsSubmitting(false);
    }
  };

  const wonBids = myBids.filter(b => b.status === 'Won');

  const stats = [
    {
      label: "Open Indents",
      value: visibleIndents.filter(i => i.status === 'Approved').length,
      icon: ClipboardList,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Bids Submitted",
      value: myBids.length,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Bids Won",
      value: wonBids.length,
      icon: Trophy,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  const deliveryStatusOptions = ["Not Started", "Packaging", "Dispatched", "Arrived"];

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-emerald-600" />
            Vendor Dashboard
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            View approved material indents and submit competitive bids
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4 transition-shadow hover:shadow-md"
          >
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-lg flex items-center justify-center`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Indent List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-700">Material Indents</h2>
            <p className="text-xs text-slate-400 mt-0.5">Submit bids for open indents · Update delivery for won bids</p>
          </div>
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Indent No..."
              className="input w-full pl-9 bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Indent No</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Work Order</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Bid Status</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="py-4 px-4"><Skeleton className="h-4 w-24" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length > 0 ? (
                filtered.map((indent) => {
                  const wo = workOrders.find((w) => String(w.id) === String(indent.workOrderId));
                  const myBid = myBidsByIndent[String(indent.id)];
                  const isWon = myBid?.status === 'Won';
                  const hasSubmitted = !!myBid;
                  const isClosed = indent.status === 'PO Created';
                  const linkedPO = purchaseOrders.find(
                    p => String(p.indentId ?? p.indent_id ?? '') === String(indent.id)
                  );

                  return (
                    <tr key={indent.id} className={`hover:bg-slate-50/80 transition-colors ${isWon ? 'bg-emerald-50/30' : ''}`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {isWon && <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                          <span className="font-bold text-slate-800">{indent.indentNo || `IND-${indent.id}`}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {wo ? `${wo.workOrderNo} — ${wo.title}` : `WO #${indent.workOrderId}`}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {new Date(indent.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center">
                          {isWon ? (
                            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                              <Trophy className="w-3 h-3" /> Bid Won
                            </span>
                          ) : isClosed ? (
                            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-500 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Bidding Closed
                            </span>
                          ) : hasSubmitted ? (
                            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Bid Submitted
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Open
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isWon ? (
                          <div className="flex flex-col items-center gap-1.5">
                            {linkedPO && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                linkedPO.deliveryStatus === 'Arrived' ? 'bg-emerald-100 text-emerald-700' :
                                linkedPO.deliveryStatus === 'Dispatched' ? 'bg-blue-100 text-blue-600' :
                                linkedPO.deliveryStatus === 'Packaging' ? 'bg-amber-100 text-amber-600' :
                                'bg-slate-100 text-slate-500'
                              }`}>
                                {linkedPO.deliveryStatus || 'Not Started'}
                              </span>
                            )}
                            <button
                              onClick={() => handleOpenDeliveryModal(indent)}
                              className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1.5 mx-auto border border-emerald-200"
                            >
                              <Truck className="w-3.5 h-3.5" /> Update Delivery
                            </button>
                          </div>
                        ) : isClosed ? (
                          <button
                            disabled
                            className="px-3 py-1.5 text-xs font-medium text-slate-400 bg-slate-50 rounded-lg flex items-center gap-1.5 mx-auto cursor-not-allowed opacity-70"
                          >
                            <FileText className="w-3.5 h-3.5" /> Bidding Closed
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenBidModal(indent)}
                            className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-colors flex items-center gap-1.5 mx-auto"
                          >
                            <FileText className="w-3.5 h-3.5" /> {hasSubmitted ? 'Re-bid' : 'Submit Bid'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="py-12 text-center">
                    <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-3">
                      <PackageOpen className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-800 mb-1">No Indents Available</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Approved material indents will appear here for bid submission.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bid Submission Modal */}
      {isBidModalOpen && selectedIndent && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-800">Submit Bid</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Indent: {selectedIndent.indentNo || `IND-${selectedIndent.id}`}
                </p>
              </div>
              <button onClick={() => setIsBidModalOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitBid} className="p-6 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-600">Material-wise Unit Price</label>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Per unit avg price</span>
                </div>
                <div className="max-h-64 overflow-y-auto rounded-2xl border border-slate-200 divide-y divide-slate-100">
                  {indentItems.length === 0 ? (
                    <div className="p-4 text-sm text-slate-500 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading materials...
                    </div>
                  ) : (
                    indentItems.map((item) => (
                      <div key={item.id} className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                        <div className="md:col-span-2">
                          <p className="font-semibold text-slate-800">
                            {materialsMap[String(item.itemId)]?.itemName || materialsMap[String(item.itemId)]?.name || `Item #${item.itemId}`}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">Required Qty: {item.requiredQty} {materialsMap[String(item.itemId)]?.unit || ""}</p>
                        </div>
                        <div>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="input"
                            placeholder="Unit price (₹)"
                            value={itemPrices[item.id] ?? ""}
                            onChange={(e) =>
                              setItemPrices((prev) => ({ ...prev, [item.id]: e.target.value }))
                            }
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Total Bid Amount</p>
                  <p className="text-lg font-black text-emerald-700 mt-1">
                    ₹{totalBidAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-2">
                  <TimerReset className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Indent ID</p>
                    <p className="text-sm font-semibold text-slate-700">#{selectedIndent.id}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBidModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || indentItems.length === 0}
                  className="flex-1 py-3 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-900/20 hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                  {isSubmitting ? "Submitting..." : "Submit Bid"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delivery Update Modal */}
      {isDeliveryModalOpen && deliveryIndent && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-emerald-50">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-600" /> Update Delivery Status
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Indent: {deliveryIndent.indentNo || `IND-${deliveryIndent.id}`}
                </p>
              </div>
              <button onClick={() => setIsDeliveryModalOpen(false)} className="p-1.5 hover:bg-emerald-100 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateDelivery} className="p-6 space-y-5">
              {/* Current status strip */}
              {deliveryPO ? (
                <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Delivery Status</p>
                    <p className="text-sm font-bold text-slate-700 mt-0.5">{deliveryPO.deliveryStatus ?? deliveryPO.delivery_status ?? "Not Started"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">PO No</p>
                    <p className="text-sm font-bold text-slate-700 mt-0.5">{deliveryPO.poNo}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700 font-medium">
                  ⚠️ No linked Purchase Order found for this indent. Contact procurement.
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
                  Update Delivery Status
                </label>
                <select
                  value={deliveryStatus}
                  onChange={(e) => setDeliveryStatus(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-white"
                >
                  {deliveryStatusOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Arrival Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={arrivalDate}
                  onChange={(e) => setArrivalDate(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-white"
                />
                <p className="text-[10px] text-slate-400 mt-1">Leave blank if not yet arrived</p>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsDeliveryModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingDelivery}
                  className="flex-1 py-3 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isUpdatingDelivery ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                  {isUpdatingDelivery ? "Updating..." : "Update Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
