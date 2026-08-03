import React, { useState, useEffect } from 'react';
import {
  X, TrendingDown, CheckCircle2, Loader2, ShoppingCart,
  Medal, Building2, Hash, ChevronDown, BarChart3, Trophy
} from 'lucide-react';
import { materialIndentAPI, poBidAPI } from '../../services';
import toast from 'react-hot-toast';

export default function VendorComparisonModal({ isOpen, onClose }) {
  const [indents, setIndents] = useState([]);
  const [selectedIndentId, setSelectedIndentId] = useState('');
  const [selectedIndent, setSelectedIndent] = useState(null);
  const [bids, setBids] = useState([]);
  const [isLoadingIndents, setIsLoadingIndents] = useState(false);
  const [isLoadingBids, setIsLoadingBids] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchIndents();
    } else {
      // Reset state on close
      setSelectedIndentId('');
      setSelectedIndent(null);
      setBids([]);
    }
  }, [isOpen]);

  const fetchIndents = async () => {
    setIsLoadingIndents(true);
    try {
      const res = await materialIndentAPI.getAllMaterialIndents();
      const allIndents = Array.isArray(res) ? res : (res?.data?.materialIndents || res?.data || []);
      setIndents(allIndents.filter(i => i.status === 'Approved' || i.status === 'Vendor Assigned'));
    } catch (error) {
      console.error(error);
      toast.error('Failed to load indents');
    } finally {
      setIsLoadingIndents(false);
    }
  };

  const fetchBids = async (indentId) => {
    setIsLoadingBids(true);
    setBids([]);
    try {
      const res = await poBidAPI.getBidsByIndent(indentId);
      const raw = Array.isArray(res) ? res : (res?.data || []);
      // Sort ascending by amount (lowest first)
      const sorted = [...raw].sort((a, b) => Number(a.amount) - Number(b.amount));
      setBids(sorted);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load bids');
    } finally {
      setIsLoadingBids(false);
    }
  };

  const handleIndentSelect = (e) => {
    const indentId = e.target.value;
    setSelectedIndentId(indentId);
    const indent = indents.find(p => String(p.id) === String(indentId));
    setSelectedIndent(indent || null);
    if (indentId) {
      fetchBids(indentId);
    } else {
      setBids([]);
    }
  };

  const handleWinBid = async (bidId) => {
    try {
      await poBidAPI.winBid(bidId);
      toast.success('PO Generated Successfully!');
      if (selectedIndentId) fetchBids(selectedIndentId);
      fetchIndents(); // Refresh indents as status may have changed
    } catch (error) {
      toast.error('Failed to approve bid');
    }
  };

  if (!isOpen) return null;

  const lowestAmount = bids.length > 0 ? Math.min(...bids.map(b => Number(b.amount))) : null;
  const highestAmount = bids.length > 0 ? Math.max(...bids.map(b => Number(b.amount))) : null;
  const wonBid = bids.find(b => b.status === 'Won');

  // Bar width relative to highest bid
  const getBarWidth = (amount) => {
    if (!highestAmount || highestAmount === 0) return 0;
    return Math.max(10, (Number(amount) / highestAmount) * 100);
  };

  const statusBadge = (status) => {
    if (status === 'Won') return { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Won' };
    if (status === 'Lost') return { bg: 'bg-slate-100', text: 'text-slate-400', label: 'Lost' };
    return { bg: 'bg-blue-50', text: 'text-blue-600', label: 'Pending' };
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[92vh] overflow-hidden">

        {/* Header */}
        <div className="px-7 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-100 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Vendor Comparison</h2>
              <p className="text-xs text-slate-500">Compare bids by material indent</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-7 space-y-6">

          {/* Indent Selector */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">
              Select Material Indent
            </label>
            <div className="relative">
              <ShoppingCart className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all appearance-none cursor-pointer"
                value={selectedIndentId}
                onChange={handleIndentSelect}
                disabled={isLoadingIndents}
              >
                <option value="">
                  {isLoadingIndents ? 'Loading Indents...' : '— Select a Material Indent —'}
                </option>
                {indents.map(indent => (
                  <option key={indent.id} value={indent.id}>
                    {indent.indentNo || `IND-${indent.id}`} — Date: {new Date(indent.createdAt).toLocaleDateString()} [{indent.status}]
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {/* Selected Indent info strip */}
            {selectedIndent && (
              <div className="mt-3 grid grid-cols-3 gap-3">
                {[
                  { label: 'Indent Number', value: selectedIndent.indentNo || `IND-${selectedIndent.id}` },
                  { label: 'Date', value: new Date(selectedIndent.createdAt).toLocaleDateString() },
                  { label: 'Status', value: selectedIndent.status },
                ].map((f, i) => (
                  <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{f.label}</p>
                    <p className="text-sm font-bold text-slate-700 mt-0.5">{f.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bids Section */}
          {selectedIndentId && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-indigo-500" />
                  Submitted Bids
                  {!isLoadingBids && bids.length > 0 && (
                    <span className="text-xs font-bold bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
                      {bids.length} bid{bids.length > 1 ? 's' : ''}
                    </span>
                  )}
                </h3>
                {wonBid && (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                    <Trophy className="w-3.5 h-3.5" /> PO Generated
                  </span>
                )}
              </div>

              {isLoadingBids ? (
                <div className="flex items-center justify-center gap-2 py-12 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Loading bids...</span>
                </div>
              ) : bids.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100">
                  <Hash className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-500">No bids received for this Indent</p>
                  <p className="text-xs text-slate-400 mt-1">Bids will appear here once vendors submit them</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bids.map((bid, index) => {
                    const isLowest = Number(bid.amount) === lowestAmount;
                    const badge = statusBadge(bid.status);
                    const barW = getBarWidth(bid.amount);

                    return (
                      <div
                        key={bid.id}
                        className={`rounded-2xl border p-5 transition-all ${
                          isLowest && bid.status !== 'Lost'
                            ? 'border-amber-200 bg-gradient-to-r from-amber-50/60 to-white shadow-sm shadow-amber-100'
                            : bid.status === 'Won'
                            ? 'border-emerald-200 bg-gradient-to-r from-emerald-50/50 to-white shadow-sm shadow-emerald-100'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          {/* Left: rank + vendor info */}
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            {/* Rank badge */}
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-sm ${
                              index === 0 ? 'bg-amber-100 text-amber-600' :
                              index === 1 ? 'bg-slate-200 text-slate-600' :
                              index === 2 ? 'bg-orange-100 text-orange-600' :
                              'bg-slate-100 text-slate-500'
                            }`}>
                              {index === 0 ? <Medal className="w-5 h-5" /> : `#${index + 1}`}
                            </div>

                            <div className="flex-1 min-w-0">
                              {/* Tags row */}
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                {isLowest && bid.status !== 'Lost' && (
                                  <span className="bg-amber-100 text-amber-700 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md tracking-wide">
                                    Lowest Bid
                                  </span>
                                )}
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${badge.bg} ${badge.text}`}>
                                  {badge.label}
                                </span>
                              </div>

                              {/* Vendor name */}
                              <div className="flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <p className="text-sm font-bold text-slate-800 truncate">
                                  {bid.companyName || 'Unknown Vendor'}
                                </p>
                              </div>
                              {bid.vendorCode && (
                                <p className="text-xs text-slate-400 font-medium mt-0.5 ml-5">
                                  {bid.vendorCode}
                                  {bid.contactPerson && ` · ${bid.contactPerson}`}
                                </p>
                              )}

                              {/* Progress bar */}
                              <div className="mt-3">
                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      isLowest ? 'bg-amber-400' :
                                      bid.status === 'Won' ? 'bg-emerald-400' : 'bg-slate-300'
                                    }`}
                                    style={{ width: `${barW}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Right: amount + action */}
                          <div className="flex flex-col items-end gap-3 shrink-0">
                            <p className={`text-2xl font-black ${
                              isLowest && bid.status !== 'Lost' ? 'text-amber-600' :
                              bid.status === 'Won' ? 'text-emerald-600' : 'text-slate-700'
                            }`}>
                              ₹{Number(bid.amount).toLocaleString('en-IN')}
                            </p>

                            {bid.status === 'Won' ? (
                              <span className="flex items-center gap-1.5 text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs">
                                <CheckCircle2 className="w-3.5 h-3.5" /> PO Generated
                              </span>
                            ) : bid.status === 'Lost' ? (
                              <span className="text-slate-400 font-bold bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
                                Lost
                              </span>
                            ) : (
                              <button
                                onClick={() => handleWinBid(bid.id)}
                                disabled={!!wonBid}
                                className="px-5 py-1.5 text-xs font-bold text-white bg-[#2f6645] hover:bg-[#1e3a34] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all active:scale-95 shadow-sm shadow-green-900/20"
                              >
                                Generate PO
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {!selectedIndentId && (
            <div className="text-center py-14 text-slate-300">
              <BarChart3 className="w-14 h-14 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-400">Select a Material Indent to compare vendor bids</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-7 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
