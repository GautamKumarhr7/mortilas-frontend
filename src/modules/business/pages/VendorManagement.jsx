import React, { useState, useEffect } from 'react';
import { 
  Users, Star, 
  Search, Plus, Download, ShieldCheck, 
  TrendingUp, Filter, Trash2, Edit3, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import Skeleton from '../../../components/common/Skeleton';
import { vendorAPI } from '../services';

import VendorFormModal from '../components/vendors/VendorFormModal';
import VendorDetailSidebar from '../components/vendors/VendorDetailSidebar';

const statusBadge = {
  'Active': 'bg-emerald-50 text-emerald-600 border-emerald-100',
  'Inactive': 'bg-amber-50 text-amber-600 border-amber-100',
  'Blacklisted': 'bg-red-50 text-red-600 border-red-100',
};

export default function VendorManagement() {
  const [vendors, setVendors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, name: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [currentVendor, setCurrentVendor] = useState(null);

  const fetchVendors = async () => {
    setIsLoading(true);
    try {
        const res = await vendorAPI.getAllVendors();
        setVendors(res?.data || []);
    } catch (error) {
        console.error("Failed to fetch vendors:", error);
        toast.error("Failed to load vendors.");
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  // Notice: The backend now returns { vendor: {}, category: {} } due to the left join
  const filtered = vendors.filter(v => {
    const data = v.vendor || v; // Handle both flat and joined responses
    return data.companyName?.toLowerCase().includes(search.toLowerCase()) ||
           data.vendorType?.toLowerCase().includes(search.toLowerCase()) ||
           data.panNo?.toLowerCase().includes(search.toLowerCase());
  });

  const flatVendors = vendors.map(v => v.vendor || v);

  const stats = [
    { label: 'Registered Vendors', value: flatVendors.length, icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Active Partners', value: flatVendors.filter(v => v.status === 'Active').length, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'PVL (Preferred)', value: flatVendors.filter(v => v.isPreferred).length, icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Tax Verified', value: flatVendors.filter(v => v.panNo && v.gstNo).length, icon: ShieldCheck, color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  const handleSave = async (formData) => {
    try {
        if (isEditing && currentVendor) {
            await vendorAPI.updateVendor(currentVendor.id, formData);
            toast.success('Vendor updated successfully');
        } else {
            await vendorAPI.createVendor(formData);
            toast.success('Vendor onboarded successfully');
        }
        
        await fetchVendors();
        setIsModalOpen(false);
        setIsEditing(false);
        setCurrentVendor(null);
    } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to save vendor');
    }
  };

  const openEditModal = (vendor) => {
    setCurrentVendor(vendor);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
        await vendorAPI.deleteVendor(id);
        toast.success('Vendor removed from system');
        await fetchVendors();
        setDeleteConfirm({ show: false, id: null, name: '' });
    } catch (error) {
        toast.error('Failed to delete vendor');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in dashboard-container">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none uppercase tracking-tighter">Vendor Management</h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2 px-0.5 border-l-2 border-emerald-600 ml-0.5 whitespace-nowrap overflow-hidden text-ellipsis">Supplier Registry, Rating & Rate Contracts</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary flex items-center gap-2 font-black uppercase text-[10px] py-4 px-6 tracking-widest"><Download className="w-4 h-4" /> Export</button>
          <button onClick={() => { setIsEditing(false); setCurrentVendor(null); setIsModalOpen(true); }} className="btn-primary flex items-center gap-2 font-black uppercase text-[10px] py-4 px-8 tracking-widest shadow-xl shadow-blue-900/10 active:scale-95">
            <Plus className="w-5 h-5" /> Onboard Vendor
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="card p-5 border-b-4 border-b-transparent hover:border-b-emerald-600 transition-all cursor-default">
            <div className="flex justify-between items-start">
              <div className={`${s.bg} p-2.5 rounded-2xl`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-black text-slate-800 tracking-tight">{s.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 leading-none">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Vendor List */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              className="input pl-10 h-11 text-xs font-semibold rounded-xl" 
              placeholder="Search by vendor name, category or PAN..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:bg-slate-50">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-[10px] font-black uppercase text-slate-500">Filters</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs box-border">
            <thead className="bg-[#fcfdfe] border-b border-slate-200">
              <tr>
                <th className="table-header py-5">Vendor Entity</th>
                <th className="table-header">Category / Type</th>
                <th className="table-header">Due Diligence (PAN)</th>
                <th className="table-header text-right">Credit Limit</th>
                <th className="table-header text-center whitespace-nowrap">Status</th>
                <th className="table-header text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-6 py-4"><Skeleton className="w-full h-4" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.map((row) => {
                const vendor = row.vendor || row;
                const categoryName = row.category?.name || vendor.vendorType;
                return (
                <tr key={vendor.id} className="table-row hover:bg-slate-50 transition-all group">
                  <td className="table-cell">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-[1rem] bg-slate-100/80 flex items-center justify-center font-black text-slate-400 text-xs shadow-inner">
                        {vendor.companyName[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                            <p className="text-slate-900 font-black text-[13px] tracking-tight mb-1">{vendor.companyName}</p>
                            {vendor.isPreferred && <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />}
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{vendor.city}, {vendor.state}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className="text-[9px] font-black uppercase px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg border border-slate-200 tracking-tighter">{categoryName}</span>
                  </td>
                  <td className="table-cell font-mono font-bold text-slate-600">
                    {vendor.panNo} {vendor.gstNo && <span className="text-emerald-500">✓</span>}
                  </td>
                  <td className="table-cell text-right font-black text-slate-900 tracking-tight">
                    ₹{Number(vendor.creditLimit || 0).toLocaleString()}
                  </td>
                  <td className="table-cell text-center">
                    <span className={`badge ${statusBadge[vendor.status]} px-3 font-black text-[9px] uppercase`}>
                      {vendor.status}
                    </span>
                  </td>
                  <td className="table-cell text-center">
                    <div className="flex items-center justify-center gap-2">
                        <button 
                            onClick={() => setSelectedVendor(vendor)}
                            className="p-2 bg-white text-slate-300 rounded-xl hover:text-emerald-600 transition-all border border-slate-100 group-hover:border-emerald-100 group-hover:bg-emerald-50/50"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => openEditModal(vendor)}
                            className="p-2 bg-white text-slate-300 rounded-xl hover:text-blue-600 transition-all border border-slate-100 group-hover:border-blue-100 group-hover:bg-blue-50/50"
                        >
                            <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => setDeleteConfirm({ show: true, id: vendor.id, name: vendor.companyName })}
                            className="p-2 bg-white text-slate-300 rounded-xl hover:text-red-600 transition-all border border-slate-100 group-hover:border-red-100 group-hover:bg-red-50/50"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>

      <VendorFormModal 
        isOpen={isModalOpen}
        isEditing={isEditing}
        initialData={currentVendor}
        onClose={() => { setIsModalOpen(false); setIsEditing(false); setCurrentVendor(null); }}
        onSave={handleSave}
        isSaving={false}
      />

      <VendorDetailSidebar 
        isOpen={!!selectedVendor}
        vendor={selectedVendor}
        onClose={() => setSelectedVendor(null)}
        onRefresh={fetchVendors}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-8">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center">
                    <Trash2 className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight">Remove Vendor?</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Permanent Action</p>
                </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-8">
                Are you sure you want to remove <span className="font-black text-slate-900 underline decoration-red-200">{deleteConfirm.name}</span> from your registry? This cannot be undone.
            </p>
            <div className="flex gap-3">
                <button 
                    onClick={() => setDeleteConfirm({ show: false, id: null, name: '' })}
                    className="flex-1 py-4 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all"
                >
                    Cancel
                </button>
                <button 
                    onClick={() => handleDelete(deleteConfirm.id)}
                    className="flex-1 py-4 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-red-900/20 hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center"
                >
                    Confirm Delete
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
