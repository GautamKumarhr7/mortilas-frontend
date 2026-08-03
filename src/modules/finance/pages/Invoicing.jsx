import { useState, useEffect } from 'react';
import { 
    Search, Plus, Download, CheckCircle2, Clock, FileText, 
    TrendingUp, X, Edit2, Trash2, Eye, Save, Loader2,
    Calendar, Building2, Wallet, CreditCard, ChevronDown, ChevronRight
} from 'lucide-react';
import { useApp } from '../../../hooks/useApp';
import toast from 'react-hot-toast';
import Skeleton from '../../../components/common/Skeleton';
import { invoiceAPI } from '../services';
import { projectAPI } from '../../projects/services';

const statusBadge = {
    'Paid': 'badge-green',
    'Pending': 'badge-yellow',
    'Overdue': 'badge-red',
    'Approved': 'badge-blue',
};

export default function Invoicing() {
    const { setActiveModule, setSelectedInvoice } = useApp();
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('All');
    const [invoices, setInvoices] = useState([]);
    const [projects, setProjects] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, name: '' });

    const [formData, setFormData] = useState({
        invoiceId: '',
        projectId: '',
        clientOrProject: '',
        type: 'Running Bill',
        date: new Date().toISOString().split('T')[0],
        gst: 18,
        retention: 5,
        amount: '',
        status: 'Pending'
    });

    const fetchProjects = async () => {
        try {
            const res = await projectAPI.getAllProjects();
            // Handle both { projects: [...] } and direct [...] responses
            // res could be the full axios response or just the data depending on interceptors
            const rawData = res?.data || res;
            const projectArray = rawData?.projects || (Array.isArray(rawData) ? rawData : []);
            setProjects(projectArray);
        } catch (error) {
            console.error('Project fetch error:', error);
        }
    };

    const fetchInvoices = async () => {
        setIsLoading(true);
        try {
            const res = await invoiceAPI.getAllInvoices();
            const data = res?.invoices || res?.data?.invoices || res?.data || res || [];
            setInvoices(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('Failed to load invoice registry');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
        fetchProjects();
    }, []);

    const handleProjectChange = (projectId) => {
        const project = projects.find(p => p.id === Number(projectId));
        if (project) {
            setFormData(prev => ({
                ...prev,
                projectId: project.id,
                clientOrProject: project.projectName || project.name || ''
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                projectId: projectId,
                clientOrProject: ''
            }));
        }
    };

    const handleDelete = (inv) => {
        setDeleteConfirm({ show: true, id: inv._id || inv.id, name: inv.invoiceId });
    };

    const confirmDelete = async () => {
        setIsSaving(true);
        try {
            await invoiceAPI.deleteInvoice(deleteConfirm.id);
            toast.success('Invoice record removed');
            fetchInvoices();
            setDeleteConfirm({ show: false, id: null, name: '' });
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to remove invoice');
        } finally {
            setIsSaving(false);
        }
    };

    const filteredInvoices = invoices.filter(inv =>
        ((inv.clientOrProject || '').toLowerCase().includes(search.toLowerCase()) || 
         (inv.invoiceId || '').toLowerCase().includes(search.toLowerCase())) &&
        (filter === 'All' || inv.status === filter)
    );

    const handleOpenAdd = () => {
        setEditingId(null);
        setFormData({
            invoiceId: `INV-2026-00${invoices.length + 1}`,
            projectId: '',
            clientOrProject: '',
            type: 'Running Bill',
            date: new Date().toISOString().split('T')[0],
            gst: 18,
            retention: 5,
            amount: '',
            status: 'Pending'
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (e, inv) => {
        e.stopPropagation();
        setEditingId(inv._id || inv.id);
        setFormData({
            invoiceId: inv.invoiceId || '',
            projectId: inv.projectId || '',
            clientOrProject: inv.clientOrProject || '',
            type: inv.type || 'Running Bill',
            amount: inv.amount || '',
            date: inv.date || new Date().toISOString().split('T')[0],
            gst: inv.gst || 18,
            retention: inv.retention || 5,
            status: inv.status || 'Pending'
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload = {
                ...formData,
                amount: Number(formData.amount),
                projectId: Number(formData.projectId) || 1,
                gst: Number(formData.gst),
                retention: Number(formData.retention)
            };

            if (editingId) {
                await invoiceAPI.updateInvoice(editingId, payload);
                toast.success('Invoice revised successfully');
            } else {
                await invoiceAPI.createInvoice(payload);
                toast.success('New invoice / RA Bill generated');
            }
            fetchInvoices();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Failed to process financial document');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-5 animate-fade-in relative">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Invoicing & Billing</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage RA bills, tax invoices and receivables</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="btn-secondary hidden sm:flex items-center gap-2">
                        <Download className="w-4 h-4" /> Export
                    </button>
                    <button onClick={handleOpenAdd} className="btn-primary whitespace-nowrap flex items-center gap-1.5">
                        <Plus className="w-5 h-5" /> Generate RA Bill
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Unpaid Receivables', value: '₹1.42 Cr', color: 'text-amber-500', icon: Clock },
                    { label: 'Paid This Month', value: '₹40.5 L', color: 'text-green-500', icon: CheckCircle2 },
                    { label: 'Retention Amount', value: '₹18.2 L', color: 'text-blue-500', icon: FileText },
                    { label: 'GST Liability', value: '₹7.8 L', color: 'text-purple-500', icon: TrendingUp },
                ].map((s, i) => (
                    <div key={i} className="card p-4">
                        {isLoading ? <Skeleton variant="badge" className="h-8 w-20 mb-1" /> : <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>}
                        <p className="text-slate-500 text-sm mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex gap-1 overflow-x-auto no-scrollbar">
                        {['All', 'Paid', 'Pending', 'Overdue', 'Approved'].map(t => (
                            <button
                                key={t}
                                onClick={() => setFilter(t)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                                    filter === t ? 'bg-[#2f6645] text-white' : 'text-slate-500 hover:bg-slate-100'
                                }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Find invoices..." className="input pl-9" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                {['Invoice ID', 'Client / Project', 'Type', 'Date', 'GST (18%)', 'Retention', 'Amount', 'Status', 'Actions'].map(h => (
                                    <th key={h} className="table-header whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="table-row">
                                        <td className="table-cell"><Skeleton variant="text" className="w-20" /></td>
                                        <td className="table-cell"><Skeleton variant="text" className="w-32" /><Skeleton variant="text" className="w-24 mt-1" /></td>
                                        <td className="table-cell"><Skeleton variant="badge" /></td>
                                        <td className="table-cell"><Skeleton variant="text" /></td>
                                        <td className="table-cell"><Skeleton variant="text" /></td>
                                        <td className="table-cell"><Skeleton variant="text" /></td>
                                        <td className="table-cell"><Skeleton variant="text" /></td>
                                        <td className="table-cell"><Skeleton variant="badge" /></td>
                                        <td className="table-cell text-right"><Skeleton variant="button" className="w-20 h-8" /></td>
                                    </tr>
                                ))
                            ) : filteredInvoices.map((inv) => (
                                <tr key={inv._id || inv.id} className="table-row hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => { setSelectedInvoice(inv); setActiveModule('invoice-detail'); }}>
                                    <td className="table-cell font-mono text-blue-500 text-xs font-semibold">{inv.invoiceId}</td>
                                    <td className="table-cell">
                                        <p className="text-slate-900 font-bold">{inv.clientOrProject}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Building2 className="w-3 h-3 text-slate-400" />
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PJ-{inv.projectId}</span>
                                        </div>
                                    </td>
                                    <td className="table-cell"><span className="badge badge-blue text-[10px] font-bold">{inv.type}</span></td>
                                    <td className="table-cell text-slate-500 text-[10px] font-bold uppercase whitespace-nowrap"><Calendar className="w-3 h-3 inline mr-1" />{inv.date}</td>
                                    <td className="table-cell text-slate-600 font-medium">{inv.gst}%</td>
                                    <td className="table-cell text-slate-600 font-medium">{inv.retention}%</td>
                                    <td className="table-cell">
                                        <p className="text-emerald-600 font-bold tracking-tight text-sm">₹{(inv.amount / 100000).toFixed(2)}L</p>
                                        <p className="text-[9px] font-bold text-slate-300 uppercase">Valuation</p>
                                    </td>
                                    <td className="table-cell">
                                        <span className={`badge ${statusBadge[inv.status] || 'badge-yellow'} text-[10px] px-3 font-bold`}>{inv.status}</span>
                                    </td>
                                    <td className="table-cell" onClick={e => e.stopPropagation()}>
                                        <div className="flex items-center justify-center gap-1">
                                            <button onClick={() => { setSelectedInvoice(inv); setActiveModule('invoice-detail'); }} className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-lg transition-all hover:scale-110 active:scale-90" title="View Details"><Eye className="w-4 h-4" /></button>
                                            <button onClick={(e) => handleOpenEdit(e, inv)} className="p-1.5 hover:bg-amber-50 text-amber-500 rounded-lg transition-all hover:scale-110 active:scale-90" title="Edit Invoice"><Edit2 className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(inv)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-all hover:scale-110 active:scale-90" title="Delete Record"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Invoice Generation Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-[#1e3a34] text-white">
                            <div>
                                <h2 className="text-base font-semibold">{editingId ? 'Edit Bill / Invoice' : 'Generate RA Bill / Invoice'}</h2>
                                <p className="text-xs text-white/60 mt-0.5">Bill recording</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600">Invoice ID</label>
                                <input required value={formData.invoiceId} onChange={e => setFormData({...formData, invoiceId: e.target.value})} className="input" placeholder="INV-2026-001" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600">Select Project <span className="text-red-500">*</span></label>
                                <select 
                                    required 
                                    className="input"
                                    value={formData.projectId}
                                    onChange={(e) => handleProjectChange(e.target.value)}
                                >
                                    <option value="">Choose a project...</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.projectName || p.name} (PJ-{p.id})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600">Referenced Client/Project Name</label>
                                <input readOnly value={formData.clientOrProject} className="input bg-slate-50 cursor-not-allowed" placeholder="Auto-filled from selection" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Bill Type</label>
                                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="input">
                                        <option value="Running Bill">Running Bill</option>
                                        <option value="Tax Invoice">Tax Invoice</option>
                                        <option value="Proforma">Proforma</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Date</label>
                                    <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="input" />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">GST (%)</label>
                                    <input required type="number" value={formData.gst} onChange={e => setFormData({...formData, gst: e.target.value})} className="input" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Retention (%)</label>
                                    <input required type="number" value={formData.retention} onChange={e => setFormData({...formData, retention: e.target.value})} className="input" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Amount (₹)</label>
                                    <input required type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="input" placeholder="0.00" />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6 sticky bottom-0 bg-white pb-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-xs font-bold text-slate-400 hover:text-slate-600 tracking-widest uppercase">Discard</button>
                                <button type="submit" disabled={isSaving} className="btn-primary flex-1 h-12 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />)}
                                    {editingId ? 'Update Document' : 'Generate Document'}
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
                                <h3 className="text-lg font-black text-slate-800 tracking-tight">Void Invoice?</h3>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Permanent Financial Deletion</p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed mb-8">
                            Are you sure you want to void <span className="font-black text-slate-900 underline decoration-red-200">{deleteConfirm.name}</span>? This will remove the RA bill from the ledger permanently.
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
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Void Record"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
