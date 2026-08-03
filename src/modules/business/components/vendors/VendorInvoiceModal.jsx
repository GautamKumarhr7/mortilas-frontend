import React, { useState, useEffect } from "react";
import {
  X,
  FileText,
  CheckCircle2,
  Loader2,
  Package,
  IndianRupee,
  Hash,
  StickyNote,
} from "lucide-react";
import toast from "react-hot-toast";
import { purchaseOrderAPI } from "../../../operations/services";

export default function VendorInvoiceModal({
  isOpen,
  onClose,
  selectedPO,
  vendor,
}) {
  const [poItems, setPoItems] = useState([]);
  const [avgPrices, setAvgPrices] = useState({});
  const [notes, setNotes] = useState("");
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success state
  const [invoiceResult, setInvoiceResult] = useState(null);

  // Fetch PO items when modal opens
  useEffect(() => {
    if (isOpen && selectedPO?.id) {
      fetchPoItems(selectedPO.id);
    }
    // Reset on close
    if (!isOpen) {
      setPoItems([]);
      setAvgPrices({});
      setNotes("");
      setInvoiceResult(null);
    }
  }, [isOpen, selectedPO?.id]);

  const fetchPoItems = async (poId) => {
    setIsLoadingItems(true);
    try {
      const res = await purchaseOrderAPI.getPoWithItems(poId);
      const items = res?.data?.items || res?.items || [];
      setPoItems(items);
      // Initialise average prices with the PO rate as a hint
      const initial = {};
      items.forEach((item) => {
        initial[item.id] = "";
      });
      setAvgPrices(initial);
    } catch (err) {
      console.error("Failed to fetch PO items", err);
      toast.error("Could not load PO items");
    } finally {
      setIsLoadingItems(false);
    }
  };

  const handleAvgPriceChange = (itemId, value) => {
    setAvgPrices((prev) => ({ ...prev, [itemId]: value }));
  };

  // Compute line totals and grand total
  const rows = poItems.map((item) => {
    const qty = parseFloat(item.quantity) || 0;
    const averagePrice = parseFloat(avgPrices[item.id]) || 0;
    return { ...item, qty, averagePrice, lineTotal: qty * averagePrice };
  });

  const grandTotal = rows.reduce((sum, r) => sum + r.lineTotal, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all unit prices filled
    const missing = poItems.filter(
      (item) => !avgPrices[item.id] || isNaN(parseFloat(avgPrices[item.id])),
    );
    if (missing.length > 0) {
      toast.error("Please enter average price for all materials");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        lineItems: poItems.map((item) => ({
          itemId: item.itemId,
          averagePrice: parseFloat(avgPrices[item.id]),
          materialName: item.itemName,
        })),
        notes,
      };

      const res = await purchaseOrderAPI.generateInvoice(
        selectedPO.id,
        payload,
      );
      const result = res?.data || res;
      setInvoiceResult(result);
      toast.success("Invoice generated successfully!");
    } catch (err) {
      console.error("Invoice generation failed", err);
      toast.error(err?.response?.data?.message || "Failed to generate invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // ── Success screen ───────────────────────────────────────────────────────────
  if (invoiceResult) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center animate-fade-in">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-1">
            Invoice Generated!
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            Your invoice has been submitted for approval.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3 text-left mb-6">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Invoice ID
              </span>
              <span className="font-mono text-base font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                {invoiceResult.invoiceId}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                PO Reference
              </span>
              <span className="text-sm font-medium text-slate-700">
                {selectedPO?.poNo}
              </span>
            </div>
            <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Total Amount
              </span>
              <span className="text-lg font-bold text-emerald-600">
                ₹{" "}
                {Number(invoiceResult.totalAmount || 0).toLocaleString(
                  "en-IN",
                  { minimumFractionDigits: 2 },
                )}
              </span>
            </div>
          </div>

          {Array.isArray(invoiceResult.items) &&
            invoiceResult.items.length > 0 && (
              <div className="mb-6 overflow-hidden rounded-xl border border-slate-200 text-left">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-widest font-bold">
                    <tr>
                      <th className="px-3 py-2 text-left">Material</th>
                      <th className="px-3 py-2 text-center">Qty</th>
                      <th className="px-3 py-2 text-right">Avg Price</th>
                      <th className="px-3 py-2 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoiceResult.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 text-slate-800 font-medium">
                          {item.materialName || item.itemName}
                        </td>
                        <td className="px-3 py-2 text-center text-slate-600">
                          {Number(item.quantity || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-600">
                          ₹{" "}
                          {Number(item.averagePrice || 0).toLocaleString(
                            "en-IN",
                            { minimumFractionDigits: 2 },
                          )}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-slate-800">
                          ₹{" "}
                          {Number(item.lineTotal || 0).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // ── Main Modal ───────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Generate Invoice
              </h2>
              <p className="text-xs text-slate-500">
                PO:{" "}
                <span className="font-semibold text-slate-700">
                  {selectedPO?.poNo}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          <form id="invoice-form" onSubmit={handleSubmit}>
            {/* Vendor + PO info strip */}
            <div className="px-6 pt-5 pb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  {
                    label: "Vendor Code",
                    value: vendor?.vendorCode || vendor?.id || "N/A",
                  },
                  {
                    label: "Company",
                    value: vendor?.companyName || vendor?.name || "N/A",
                  },
                  {
                    label: "Invoice ID",
                    value: (
                      <span className="text-blue-500 italic text-xs">
                        Auto-generated
                      </span>
                    ),
                  },
                  {
                    label: "Date",
                    value: new Date().toLocaleDateString("en-IN"),
                  },
                ].map((f, i) => (
                  <div
                    key={i}
                    className="bg-slate-50 border border-slate-100 rounded-xl p-3"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                      {f.label}
                    </p>
                    <p className="text-sm font-semibold text-slate-800">
                      {f.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Materials table */}
            <div className="px-6 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-bold text-slate-700">
                  Materials &amp; Quantities
                </h3>
                <span className="text-xs text-slate-400 ml-1">
                  — Enter your average price for each item
                </span>
              </div>

              {isLoadingItems ? (
                <div className="flex items-center justify-center gap-2 py-10 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Loading materials...</span>
                </div>
              ) : poItems.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <Package className="w-10 h-10 mx-auto mb-2 text-slate-200" />
                  <p className="text-sm">No items found for this PO</p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                        <th className="text-left px-4 py-3">#</th>
                        <th className="text-left px-4 py-3">Material</th>
                        <th className="text-center px-4 py-3">Qty</th>
                        <th className="text-center px-4 py-3">Unit</th>
                        <th className="text-center px-4 py-3">
                          Avg Price (₹) *
                        </th>
                        <th className="text-right px-4 py-3">Line Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.map((item, idx) => (
                        <tr
                          key={item.id}
                          className="hover:bg-blue-50/30 transition-colors"
                        >
                          <td className="px-4 py-3 text-slate-400 font-medium">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-800">
                              {item.itemName || `Item #${item.itemId}`}
                            </p>
                            {item.approvedMake && (
                              <p className="text-xs text-slate-400">
                                {item.approvedMake}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center font-medium text-slate-700">
                            {parseFloat(item.quantity).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-center text-slate-500">
                            {item.unit || "—"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                                ₹
                              </span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                value={avgPrices[item.id] ?? ""}
                                onChange={(e) =>
                                  handleAvgPriceChange(item.id, e.target.value)
                                }
                                className="w-full pl-6 pr-2 py-1.5 border border-slate-200 rounded-lg text-sm text-right focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                                required
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-700">
                            {item.lineTotal > 0 ? (
                              `₹ ${item.lineTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-emerald-50 border-t-2 border-emerald-200">
                        <td
                          colSpan={5}
                          className="px-4 py-3 text-right text-sm font-bold text-slate-700"
                        >
                          Grand Total
                        </td>
                        <td className="px-4 py-3 text-right text-base font-black text-emerald-600">
                          ₹{" "}
                          {grandTotal.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="px-6 pb-5">
              <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1.5">
                <StickyNote className="w-4 h-4 text-slate-400" />
                Notes / Remarks{" "}
                <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Any additional notes for this invoice..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <Hash className="w-3.5 h-3.5" />
            Invoice ID will be auto-generated as{" "}
            <span className="font-mono font-semibold text-slate-500 ml-1">
              MEMO-XXXXX
            </span>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="invoice-form"
              disabled={isSubmitting || isLoadingItems || poItems.length === 0}
              className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center gap-2 shadow-sm shadow-blue-200"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <IndianRupee className="w-4 h-4" />
              )}
              {isSubmitting ? "Generating..." : "Generate Invoice"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
