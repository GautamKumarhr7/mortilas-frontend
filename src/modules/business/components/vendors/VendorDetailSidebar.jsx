import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Briefcase, History, FileText, CheckCircle2, TrendingUp, AlertTriangle, Plus, Trash2, Calendar, FileBadge } from 'lucide-react';
import { vendorAPI } from '../../services';
import toast from 'react-hot-toast';

export default function VendorDetailSidebar({ isOpen, vendor, onClose, onRefresh }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [rateContracts, setRateContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddContract, setShowAddContract] = useState(false);

  useEffect(() => {
    if (isOpen && vendor) {
        setActiveTab('overview');
        fetchRateContracts();
    }
  }, [isOpen, vendor]);

  const fetchRateContracts = async () => {
      setLoading(true);
      try {
          const res = await vendorAPI.getVendorRateContracts(vendor.id);
          setRateContracts(res?.data || []);
      } catch (err) {
          console.error(err);
      } finally {
          setLoading(false);
      }
  };

  const handleAddContract = async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      try {
          await vendorAPI.createVendorRateContract(vendor.id, {
              itemId: Number(formData.get('itemId')),
              agreedRate: Number(formData.get('agreedRate')),
              validFrom: formData.get('validFrom'),
              validTo: formData.get('validTo'),
              gst: Number(formData.get('gst')) || 0,
              status: 'active'
          });
          toast.success('Rate contract created');
          setShowAddContract(false);
          fetchRateContracts();
      } catch (err) {
          toast.error('Failed to create contract');
      }
  };

  if (!isOpen || !vendor) return null;

  const isDueDiligenceComplete = vendor.panNo && vendor.gstNo;

  return (
    <div className="fixed inset-0 z-[250] flex justify-end bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white w-full max-w-xl h-full shadow-2xl animate-slide-left flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-8 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#2f6645] text-white flex items-center justify-center font-black text-lg shadow-xl shadow-emerald-990/20">
                    {vendor.companyName[0]}
                </div>
                <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-1">{vendor.companyName}</h2>
                    {vendor.isPreferred ? (
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5"><ShieldCheck className="w-3 h-3" /> Preferred Vendor List (PVL)</span>
                    ) : (
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">{vendor.vendorType} Partner</span>
                    )}
                </div>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl text-slate-300 hover:text-slate-600 transition-all"><X className="w-6 h-6" /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-6 bg-slate-50">
            <button onClick={() => setActiveTab('overview')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'overview' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500'}`}>
                Overview
            </button>
            <button onClick={() => setActiveTab('contracts')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'contracts' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500'}`}>
                Rate Contracts
            </button>
            <button onClick={() => setActiveTab('performance')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'performance' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500'}`}>
                Scorecard
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
            
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
                <div className="space-y-8 animate-fade-in">
                    <div className="grid grid-cols-2 gap-5">
                        <div className="p-5 bg-emerald-50 rounded-3xl border border-emerald-100">
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1 leading-none">Rating / Score</p>
                            <p className="text-xl font-black text-emerald-800 tracking-tighter leading-none">{Number(vendor.rating).toFixed(1)} <span className="text-xs text-emerald-600 font-bold">/ 5.0</span></p>
                        </div>
                        <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Credit Limit</p>
                            <p className="text-xl font-black text-slate-800 tracking-tighter leading-none uppercase text-[15px]">₹{Number(vendor.creditLimit || 0).toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-slate-400" /> Identity & Due Diligence
                        </h3>
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-600">KYC Status</span>
                                {isDueDiligenceComplete ? (
                                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase rounded flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Verified</span>
                                ) : (
                                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase rounded flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Incomplete</span>
                                )}
                            </div>
                            <div className="p-4 grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">GSTIN</p>
                                    <p className="text-sm font-bold font-mono text-slate-900">{vendor.gstNo || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">PAN</p>
                                    <p className="text-sm font-bold font-mono text-slate-900">{vendor.panNo || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">MSME</p>
                                    <p className="text-sm font-bold font-mono text-slate-900">{vendor.msmeNo || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ISO</p>
                                    <p className="text-sm font-bold font-mono text-slate-900">{vendor.isoNo || '-'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                            <History className="w-4 h-4 text-slate-400" /> Contact Info
                        </h3>
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Contact Person</p>
                                <p className="text-sm font-bold text-slate-900">{vendor.contactPerson}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email</p>
                                <p className="text-sm font-bold text-slate-900">{vendor.email}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Phone</p>
                                <p className="text-sm font-bold text-slate-900">{vendor.phone}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Location</p>
                                <p className="text-sm font-bold text-slate-900">{vendor.city}, {vendor.state} - {vendor.country}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CONTRACTS TAB */}
            {activeTab === 'contracts' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Active Rate Contracts</h3>
                        <button onClick={() => setShowAddContract(!showAddContract)} className="btn-primary py-1.5 px-3 text-xs bg-emerald-600 hover:bg-emerald-700">
                            + Add Contract
                        </button>
                    </div>

                    {showAddContract && (
                        <form onSubmit={handleAddContract} className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="text-xs font-bold text-slate-700">Item ID (Inventory)</label>
                                    <input type="number" name="itemId" required className="input bg-white" placeholder="e.g. 1" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700">Agreed Rate (₹)</label>
                                    <input type="number" step="0.01" name="agreedRate" required className="input bg-white" placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700">GST %</label>
                                    <input type="number" step="0.01" name="gst" className="input bg-white" placeholder="18.00" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700">Valid From</label>
                                    <input type="date" name="validFrom" required className="input bg-white" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-700">Valid To</label>
                                    <input type="date" name="validTo" required className="input bg-white" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowAddContract(false)} className="btn-secondary py-1.5 px-3 text-xs">Cancel</button>
                                <button type="submit" className="btn-primary bg-emerald-600 py-1.5 px-3 text-xs">Save Contract</button>
                            </div>
                        </form>
                    )}

                    {loading ? (
                        <div className="flex justify-center p-8"><div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" /></div>
                    ) : rateContracts.length === 0 ? (
                        <p className="text-sm text-slate-500 italic text-center p-8 border border-dashed border-slate-200 rounded-xl">No active rate contracts.</p>
                    ) : (
                        <div className="space-y-3">
                            {rateContracts.map(contract => {
                                const isExpired = new Date(contract.validTo) < new Date();
                                return (
                                    <div key={contract.id} className="p-4 bg-white border border-slate-200 shadow-sm rounded-xl flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-black text-slate-800">Item #{contract.itemId}</span>
                                                <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded ${isExpired ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                    {isExpired ? 'Expired' : 'Active'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(contract.validFrom).toLocaleDateString()} to {new Date(contract.validTo).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-emerald-700">₹{Number(contract.agreedRate).toLocaleString()}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">+ {contract.gst}% GST</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* PERFORMANCE / SCORECARD TAB */}
            {activeTab === 'performance' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="p-8 bg-slate-50 border border-slate-200 rounded-[2rem] text-center relative overflow-hidden">
                        <FileBadge className="w-24 h-24 text-slate-200 absolute -right-4 -bottom-4 opacity-50" />
                        <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Quarterly Scorecard</h3>
                        <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-sm mx-auto relative z-10">
                            The automated scorecard calculates performance based on GRN delivery delays, quality rejections, and compliance audits.
                        </p>
                        
                        <div className="mt-8 grid grid-cols-3 gap-4 relative z-10">
                            <div>
                                <p className="text-xs font-black text-slate-800">98%</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Delivery Timeliness</p>
                            </div>
                            <div className="border-l border-r border-slate-200">
                                <p className="text-xs font-black text-slate-800">99.5%</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Quality Pass Rate</p>
                            </div>
                            <div>
                                <p className="text-xs font-black text-emerald-600">Excellent</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Compliance</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
}
