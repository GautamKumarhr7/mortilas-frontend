import React, { useState, useEffect } from 'react';
import { 
  FileBarChart, FileText, ClipboardList, TrendingUp, 
  Plus, Search, Download, Filter, 
  ChevronRight, X, Loader2, Save,
  Shield, Landmark, Calendar, Clock,
  CheckCircle2, AlertCircle, Briefcase, History, Trash2, Edit3, Eye,
  ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import Skeleton from '../../../components/common/Skeleton';
import { contractAPI } from '../services';
import { useApp } from '../../../hooks/useApp';

const statusBadge = {
  'active': 'bg-emerald-50 text-emerald-600 border-emerald-100',
  'pending': 'bg-amber-50 text-amber-600 border-amber-100',
  'expired': 'bg-red-50 text-red-600 border-red-100',
  'closed': 'bg-slate-50 text-slate-500 border-slate-200',
};

export default function Contracts() {
  const { projects } = useApp();
  const [contracts, setContracts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, name: '' });
  
  const [formData, setFormData] = useState({
    referenceId: '',
    projectId: '',
    contractValue: '',
    validity: '',
    status: 'active'
  });

  const fetchContracts = async () => {
    setIsLoading(true);
    try {
        const res = await contractAPI.getAllContracts();
        const data = res?.contracts || res?.data?.contracts || res?.data || res || [];
        setContracts(Array.isArray(data) ? data : []);
    } catch (error) {
        console.error("Failed to fetch contracts:", error);
        toast.error("Failed to load contracts.");
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
    return `₹${num.toLocaleString()}`;
  };

  const stats = [
    { label: 'Active Contracts', value: contracts.filter(c => (c.status || '').toLowerCase() === 'active').length, icon: Shield, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Total Value', value: formatCurrency(contracts.reduce((a, b) => a + (Number(b.contractValue) || 0), 0)), icon: Landmark, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Registered', value: contracts.length, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Compliance Rate', value: '98%', icon: FileText, color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  const filtered = contracts.filter(c => 
    ((c.referenceId || c.ReferenceId) || '').toLowerCase().includes(search.toLowerCase()) ||
    String(c.projectId || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (contract) => {
    setDeleteConfirm({ show: true, id: contract.id, name: contract.referenceId || contract.ReferenceId });
  };

  const confirmDelete = async () => {
    setIsSaving(true);
    try {
        await contractAPI.deleteContract(deleteConfirm.id);
        toast.success('Contract deleted successfully');
        setDeleteConfirm({ show: false, id: null, name: '' });
        fetchContracts();
    } catch {
        toast.error('Failed to delete contract');
    } finally {
        setIsSaving(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.projectId) {
        return toast.error("Please select a project");
    }
    setIsSaving(true);
    try {
        const payload = {
            ...formData,
            projectId: Number(formData.projectId),
            contractValue: Number(formData.contractValue)
        };

        if (isEditing) {
            await contractAPI.updateContract(currentId, payload);
            toast.success('Contract updated');
        } else {
            await contractAPI.createContract(payload);
            toast.success('Contract archived successfully');
        }
        
        setIsModalOpen(false);
        fetchContracts();
    } catch (error) {
        console.error("Save Error:", error);
        toast.error(error.response?.data?.message || 'Failed to save contract');
    } finally {
        setIsSaving(false);
    }
  };

  const handleOpenEdit = (contract) => {
    setIsEditing(true);
    setCurrentId(contract.id);
    setFormData({
        referenceId: contract.referenceId || contract.ReferenceId || '',
        projectId: contract.projectId || '',
        contractValue: contract.contractValue || '',
        validity: contract.validity ? contract.validity.split('T')[0] : '',
        status: contract.status || 'active'
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const finalValue = name === 'referenceId' ? value.toUpperCase() : value;
    
    if (name === 'projectId' && value) {
        const selected = projects.find(p => String(p.id) === String(value));
        if (selected) {
            setFormData(prev => ({
                ...prev,
                projectId: value,
                contractValue: selected.value || prev.contractValue,
                validity: selected.endDate ? selected.endDate.split('T')[0] : prev.validity
            }));
            return;
        }
    }

    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const getProjectName = (id) => {
    const p = projects.find(proj => String(proj.id) === String(id));
    return p ? p.name : `Project #${id}`;
  };

  return (
    <div className="space-y-6 animate-fade-in dashboard-container pb-12">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none uppercase tracking-tighter">Contract Management</h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2 px-0.5 border-l-2 border-emerald-500 ml-0.5 whitespace-nowrap overflow-hidden text-ellipsis">Legal Agreements, PBGs & Milestone Compliance</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary flex items-center gap-2" onClick={fetchContracts}>
            <History className="w-4 h-4" /> Refresh
          </button>
          <button onClick={() => { setIsEditing(false); setFormData({ referenceId: '', projectId: '', contractValue: '', validity: '', status: 'active' }); setIsModalOpen(true); }} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" /> Archive Contract
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="card p-5 group transition-all hover:bg-slate-50">
            <div className="flex justify-between items-center">
                <div className={`${s.bg} w-10 h-10 rounded-xl flex items-center justify-center`}>
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <TrendingUp className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="mt-4">
                <p className="text-2xl font-black text-slate-800 tracking-tight">{s.value}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              className="input pl-10 h-10 text-xs font-semibold" 
              placeholder="Search by Reference ID or Project ID..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100 text-[10px] font-black uppercase text-emerald-600">
            Total Active Liability: {formatCurrency(contracts.filter(c => (c.status || '').toLowerCase() === 'active').reduce((a, b) => a + (Number(b.contractValue) || 0), 0))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#fcfdfe] border-b border-slate-200">
              <tr>
                <th className="table-header">Reference Details</th>
                <th className="table-header">Linked Project</th>
                <th className="table-header text-right">Contract Value</th>
                <th className="table-header text-center">Validity Period</th>
                <th className="table-header text-center">Status</th>
                <th className="table-header text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-6 py-4"><Skeleton className="w-full h-4" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-20 text-slate-400 uppercase font-black tracking-widest text-[10px]">No contracts found in registry</td></tr>
              ) : filtered.map((contract) => (
                <tr key={contract.id} className="table-row group">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl border border-emerald-100 bg-emerald-50/50 flex items-center justify-center text-emerald-700">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-black text-slate-800 tracking-tight leading-none mb-1 uppercase">{(contract.referenceId || contract.ReferenceId || '').toUpperCase()}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ID: {contract.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell text-center">
                    <p className="font-bold text-slate-700 mb-1">{getProjectName(contract.projectId)}</p>
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-400">ID: {contract.projectId}</span>
                  </td>
                  <td className="table-cell text-right font-black text-slate-900 tracking-tight">{formatCurrency(contract.contractValue)}</td>
                  <td className="table-cell text-center whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5 text-slate-400 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-bold text-[10px] uppercase text-slate-600">{contract.validity ? new Date(contract.validity).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</span>
                    </div>
                  </td>
                  <td className="table-cell text-center">
                    <span className={`badge ${statusBadge[contract.status?.toLowerCase()] || 'bg-slate-50 text-slate-600'}`}>
                      {contract.status}
                    </span>
                  </td>
                  <td className="table-cell text-center">
                    <div className="flex items-center justify-center gap-2">
                        <button 
                            onClick={() => setSelectedContract(contract)}
                            className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                            title="View Details"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => handleOpenEdit(contract)}
                            className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                            title="Edit"
                        >
                            <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => handleDelete(contract)}
                            className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm"
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
      </div>

      {/* Action Slide-over */}
      {selectedContract && (
        <div className="fixed inset-0 z-[250] flex justify-end bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedContract(null)}>
          <div className="bg-white w-full max-w-lg h-full shadow-2xl animate-slide-left flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                    <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase shadow-sm">{selectedContract.referenceId || selectedContract.ReferenceId}</div>
                    <button onClick={() => setSelectedContract(null)} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-all"><X className="w-5 h-5" /></button>
                </div>
                <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-1">{getProjectName(selectedContract.projectId)}</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contract Registry Detail</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-emerald-50/70 border-l-4 border-emerald-500 rounded-2xl">
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Agreement Value</p>
                        <p className="text-xl font-black text-emerald-800 tracking-tight">{formatCurrency(selectedContract.contractValue)}</p>
                    </div>
                    <div className="p-4 bg-amber-50/70 border-l-4 border-amber-500 rounded-2xl">
                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Validity</p>
                        <p className="text-xl font-black text-amber-800 tracking-tight text-[12px] uppercase">{selectedContract.validity?.split('T')[0] || 'N/A'}</p>
                    </div>
                </div>

                <div className="p-8 bg-slate-50 border border-slate-200 rounded-[2rem]">
                    <h3 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tighter"><FileText className="w-4 h-4" /> Contract Documents</h3>
                    <div className="grid grid-cols-1 gap-2">
                        {['Master Agreement.pdf', 'Technical Annexure.pdf'].map(doc => (
                            <div key={doc} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 hover:border-emerald-200 transition-all cursor-pointer">
                                <span className="text-xs font-bold text-slate-600 truncate">{doc}</span>
                                <Download className="w-4 h-4 text-slate-300" />
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-8 py-4 bg-emerald-600 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-900/40 hover:bg-emerald-700 transition-all active:scale-95">Manage Milestones</button>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Archive Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-up">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-200">
                        <FileBarChart className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-slate-800 leading-none">{isEditing ? 'Update Contract' : 'Archive Legal Contract'}</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Input details for compliance tracking</p>
                    </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-slate-600 transition-all"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reference ID <span className="text-red-500">*</span></label>
                        <input name="referenceId" required className="input w-full h-12 rounded-xl text-sm" placeholder="e.g. CONTRACT-2025-001" value={formData.referenceId} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Project <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <select name="projectId" required className="input w-full h-12 rounded-xl text-sm font-bold appearance-none bg-white pr-10" value={formData.projectId} onChange={handleInputChange}>
                                <option value="">-- Choose Project --</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} (ID: {p.id})</option>
                                ))}
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Agreement Value (₹) <span className="text-red-500">*</span></label>
                        <input name="contractValue" required type="number" className="input w-full h-12 rounded-xl text-sm font-black" placeholder="500000" value={formData.contractValue} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Validity Date <span className="text-red-500">*</span></label>
                        <input name="validity" required type="date" className="input w-full h-12 rounded-xl text-sm" value={formData.validity} onChange={handleInputChange} />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lifecycle Status</label>
                    <div className="relative">
                        <select name="status" className="input w-full h-12 rounded-xl text-sm font-bold appearance-none bg-white pr-10" value={formData.status} onChange={handleInputChange}>
                            <option value="active">Active</option>
                            <option value="pending">Pending Signature</option>
                            <option value="expired">Expired</option>
                            <option value="closed">Closed</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                </div>

                <div className="flex justify-end pt-4 gap-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-all">Cancel</button>
                    <button type="submit" disabled={isSaving} className="bg-emerald-600 text-white px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 flex items-center gap-2">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isEditing ? 'Commit Changes' : 'Archive Contract'}
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-8">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center">
                    <Trash2 className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight">Remove Contract?</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Permanent Action</p>
                </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-8">
                Are you sure you want to remove <span className="font-black text-slate-900 underline decoration-red-200">{deleteConfirm.name}</span>? This cannot be undone.
            </p>
            <div className="flex gap-3">
                <button 
                    onClick={() => setDeleteConfirm({ show: false, id: null, name: '' })}
                    className="flex-1 py-4 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all"
                >
                    Cancel
                </button>
                <button 
                    onClick={confirmDelete}
                    disabled={isSaving}
                    className="flex-1 py-4 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-red-900/20 hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Delete"}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
