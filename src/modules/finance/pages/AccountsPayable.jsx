import React, { useEffect, useMemo, useState } from "react";
import {
  CreditCard,
  Search,
  Download,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Banknote,
  ClipboardList,
  Truck,
} from "lucide-react";
import toast from "react-hot-toast";
import Skeleton from "../../../components/common/Skeleton";
import { grnAPI } from "../../operations/services";
import { purchaseOrderAPI } from "../../operations/services";
import { vendorAPI } from "../../business/services";

const paymentStatusBadge = {
  "Pending Finance": "badge-yellow",
  "Payment Initiated": "badge-blue",
  Paid: "badge-green",
};

export default function AccountsPayable() {
  const [search, setSearch] = useState("");
  const [grns, setGrns] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [grnRes, poRes, vendorRes] = await Promise.all([
        grnAPI.getAllGRNs().catch(() => ({ data: [] })),
        purchaseOrderAPI.getAllPurchaseOrders().catch(() => ({ data: [] })),
        vendorAPI.getAllVendors().catch(() => ({ data: [] })),
      ]);

      const grnArray = Array.isArray(grnRes) ? grnRes : grnRes?.data || [];
      const poArray = Array.isArray(poRes) ? poRes : poRes?.data || [];
      const vendorArray = Array.isArray(vendorRes)
        ? vendorRes
        : vendorRes?.data || [];

      setGrns(Array.isArray(grnArray) ? grnArray : []);
      setPurchaseOrders(Array.isArray(poArray) ? poArray : []);
      setVendors(
        Array.isArray(vendorArray)
          ? vendorArray.map((entry) => entry.vendor || entry)
          : [],
      );
    } catch (error) {
      console.error("Failed to load GRNs", error);
      toast.error("Failed to load finance queue");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const poMap = useMemo(() => {
    const map = {};
    purchaseOrders.forEach((po) => {
      map[String(po.id)] = po;
    });
    return map;
  }, [purchaseOrders]);

  const vendorMap = useMemo(() => {
    const map = {};
    vendors.forEach((vendor) => {
      map[String(vendor.id)] =
        vendor.companyName ||
        vendor.name ||
        vendor.vendorName ||
        `Vendor #${vendor.id}`;
    });
    return map;
  }, [vendors]);

  const filtered = grns.filter((grn) => {
    const term = search.toLowerCase();
    const po = poMap[String(grn.poId)];
    const vendorName = vendorMap[String(grn.vendorId)] || "";
    return (
      (grn.grnNo || "").toLowerCase().includes(term) ||
      String(grn.poId || "").includes(term) ||
      (po?.poNo || "").toLowerCase().includes(term) ||
      vendorName.toLowerCase().includes(term) ||
      (grn.paymentStatus || "").toLowerCase().includes(term)
    );
  });

  const stats = [
    {
      label: "Pending Finance",
      value: grns.filter((grn) => grn.paymentStatus === "Pending Finance")
        .length,
      color: "text-amber-500",
      icon: AlertCircle,
    },
    {
      label: "Payment Initiated",
      value: grns.filter((grn) => grn.paymentStatus === "Payment Initiated")
        .length,
      color: "text-blue-500",
      icon: Clock,
    },
    {
      label: "Paid",
      value: grns.filter((grn) => grn.paymentStatus === "Paid").length,
      color: "text-green-500",
      icon: CheckCircle2,
    },
    {
      label: "Total GRNs",
      value: grns.length,
      color: "text-slate-700",
      icon: ClipboardList,
    },
  ];

  const handleInitiatePayment = async (grn) => {
    const financeUserId = localStorage.getItem("userId") || undefined;
    setIsSubmitting(true);
    try {
      await grnAPI.initiatePayment(grn.id, { financeUserId });
      toast.success("Payment initiated successfully");
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.message || "Failed to initiate payment",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-[#2f6645]" /> Accounts Payable
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Finance queue for GRN settlement and payment initiation
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary hidden sm:flex items-center gap-2">
            <Download className="w-4 h-4" /> Payment Register
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-4">
            {isLoading ? (
              <Skeleton variant="badge" className="h-8 w-20 mb-1" />
            ) : (
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            )}
            <p className="text-slate-500 text-sm mt-0.5 flex items-center gap-1">
              <stat.icon className="w-4 h-4" /> {stat.label}
            </p>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <h3 className="font-semibold text-slate-800">GRN Payment Queue</h3>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search GRN, PO or vendor..."
              className="input pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {[
                  "GRN No",
                  "PO No",
                  "Vendor",
                  "Received Date",
                  "Value",
                  "Avg Bid",
                  "Payment Status",
                  "Actions",
                ].map((header) => (
                  <th key={header} className="table-header whitespace-nowrap">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="table-row">
                    {Array.from({ length: 8 }).map((__, cellIndex) => (
                      <td key={cellIndex} className="table-cell">
                        <Skeleton variant="text" className="w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-6 text-center text-slate-500">
                    No GRNs found.
                  </td>
                </tr>
              ) : (
                filtered.map((grn) => {
                  const po = poMap[String(grn.poId)];
                  const vendorName =
                    vendorMap[String(grn.vendorId)] ||
                    `Vendor #${grn.vendorId || "N/A"}`;
                  return (
                    <tr
                      key={grn.id}
                      className="table-row hover:bg-slate-50 transition-colors"
                    >
                      <td className="table-cell font-mono text-blue-500 text-xs font-semibold">
                        {grn.grnNo}
                      </td>
                      <td className="table-cell font-semibold text-slate-800">
                        {po?.poNo || `PO-${grn.poId}`}
                      </td>
                      <td className="table-cell text-slate-600">
                        {vendorName}
                      </td>
                      <td className="table-cell text-slate-500 text-xs whitespace-nowrap">
                        {new Date(grn.receivedDate).toLocaleDateString()}
                      </td>
                      <td className="table-cell text-emerald-600 font-semibold">
                        ₹
                        {Number(grn.totalPrice || 0).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="table-cell text-slate-700 font-medium">
                        ₹
                        {Number(grn.averageBidPrice || 0).toLocaleString(
                          "en-IN",
                          { minimumFractionDigits: 2 },
                        )}
                      </td>
                      <td className="table-cell">
                        <span
                          className={`badge ${paymentStatusBadge[grn.paymentStatus] || "badge-yellow"}`}
                        >
                          {grn.paymentStatus}
                        </span>
                      </td>
                      <td className="table-cell">
                        <button
                          onClick={() => handleInitiatePayment(grn)}
                          disabled={
                            isSubmitting ||
                            grn.paymentStatus !== "Pending Finance"
                          }
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                        >
                          {isSubmitting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Banknote className="w-3.5 h-3.5" />
                          )}
                          Initiate Payment
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Truck className="w-5 h-5 text-[#2f6645]" />
          <h3 className="font-bold text-slate-800">Finance Notes</h3>
        </div>
        <p className="text-sm text-slate-500 leading-relaxed">
          GRNs enter this queue after goods are received and quality checked.
          Payment should only be initiated after the GRN shows Accepted or
          Partially Accepted, with vendor details and bid totals auto-filled
          from the selected PO.
        </p>
      </div>
    </div>
  );
}
