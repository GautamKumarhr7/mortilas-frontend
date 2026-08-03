import { useState, useEffect } from 'react';
import { 
    Search, Plus, Download, CheckCircle2, AlertCircle, Clock, 
    FileText, Briefcase, X, Edit2, Trash2, Eye, Save, Loader2,
    Calendar, Building2, Wallet, CreditCard, ChevronDown, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import Skeleton from '../../../components/common/Skeleton';
import { tdsAPI } from '../services';
import { vendorAPI } from '../../business/services';

const statusBadge = {
    'Deposited': 'badge-green',
    'Cert. Issued': 'badge-blue',
    'Approved': 'badge-blue',
    'Pending': 'badge-yellow',
};

export default function TDSManagement() {
    const [search, setSearch] = useState('');
    const [tdsList, setTdsList] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, name: '' });

    const [formData, setFormData] = useState({
        tdsId: '',
        vendorId: '',
        section: '194C',
        date: new Date().toISOString().split('T')[0],
        period: 'Q4 2024-25',
        reference: '',
        amount: '',
        status: 'Pending'
    });

    const filtered = tdsList.filter(t => {
        const vendor = vendors.find(v => (v.id === t.vendorId) || (v._id === t.vendorId));
        const vendorName = vendor?.name || vendor?.vendorName || '';
        return vendorName.toLowerCase().includes(search.toLowerCase()) ||
               (t.section || '').toLowerCase().includes(search.toLowerCase()) ||
               (t.tdsId || '').toLowerCase().includes(search.toLowerCase());
    });

    const fetchTDS = async () => {
        setIsLoading(true);
        try {
            const res = await tdsAPI.getAllTDS();
            const data = res?.tds || res?.data || res || [];
            setTdsList(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Fetch TDS error:', error);
            toast.error('Failed to load tax registry');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchVendors = async () => {
        try {
            const res = await vendorAPI.getAllVendors();
            const data = res?.vendors || res?.data || res || [];
            setVendors(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Fetch Vendors error:', error);
        }
    };

    useEffect(() => {
        fetchTDS();
        fetchVendors();
    }, []);

    const handleDelete = (rec) => {
        setDeleteConfirm({ show: true, id: rec.id, name: rec.tdsId });
    };

    const confirmDelete = async () => {
        setIsSaving(true);
        try {
            await tdsAPI.deleteTDS(deleteConfirm.id);
            toast.success('TDS record removed');
            fetchTDS();
            setDeleteConfirm({ show: false, id: null, name: '' });
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to remove record');
        } finally {
            setIsSaving(false);
        }
    };

    const handleOpenAdd = () => {
        setEditingId(null);
        const timestamp = Date.now().toString().slice(-4);
        setFormData({
            tdsId: `TDS-2025-${timestamp}-${tdsList.length + 1}`,
            vendorId: '',
            section: '194C',
            date: new Date().toISOString().split('T')[0],
            period: 'Q4 2024-25',
            reference: '',
            amount: '',
            status: 'Pending'
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (rec) => {
        setEditingId(rec.id);
        setFormData({
            tdsId: rec.tdsId,
            vendorId: rec.vendorId,
            section: rec.section,
            amount: rec.amount,
            date: rec.date,
            reference: rec.reference || rec.ref,
            period: rec.period,
            status: rec.status
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
                vendorId: Number(formData.vendorId)
            };

            if (editingId) {
                await tdsAPI.updateTDS(editingId, payload);
                toast.success('TDS record revised');
            } else {
                await tdsAPI.createTDS(payload);
                toast.success('New TDS deposit recorded');
            }
            fetchTDS();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Save error:', error);
            const errMsg = error.response?.data?.message || 'Failed to process tax document';
            toast.error(errMsg);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-5 animate-fade-in relative">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">TDS Management</h1>
                    <p className="text-slate-500 text-sm mt-1">Direct tax deduction & statutory compliance</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="btn-secondary hidden sm:flex items-center gap-2">
                        <Download className="w-4 h-4" /> Form 26AS
                    </button>
                    <button onClick={handleOpenAdd} className="btn-primary whitespace-nowrap flex items-center gap-1.5">
                        <Plus className="w-5 h-5" /> Bulk Deposit Filing
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Pending Deposits', value: `₹${(tdsList.filter(t => t.status === 'Pending').reduce((acc, curr) => acc + Number(curr.amount), 0)).toLocaleString()}`, color: 'text-amber-500' },
                    { label: 'Deposited (Total)', value: `₹${(tdsList.filter(t => t.status === 'Deposited').reduce((acc, curr) => acc + Number(curr.amount), 0)).toLocaleString()}`, color: 'text-green-500' },
                    { label: 'Certificates Due', value: tdsList.filter(t => t.status !== 'Cert. Issued').length.toString(), color: 'text-rose-500' },
                    { label: 'Filing Compliance', value: '100%', color: 'text-blue-500' },
                ].map((s, i) => (
                    <div key={i} className="card p-4">
                         {isLoading ? <Skeleton variant="text" className="h-8 w-20" /> : <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>}
                        <p className="text-slate-500 text-xs mt-0.5 font-bold uppercase tracking-widest">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-slate-800">Tax Deduction Registry</h3>
                        <button className="btn-secondary text-xs py-1 px-3 border border-slate-200 rounded">Issue Certificates</button>
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Search by vendor or section..." className="input pl-9" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                {['TDS ID', 'Vendor', 'Section', 'Date', 'Period', 'Reference', 'Amount', 'Status', 'Actions'].map(h => (
                                    <th key={h} className="table-header whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="table-row">
                                        <td className="table-cell"><Skeleton variant="text" className="w-20" /></td>
                                        <td className="table-cell"><div className="flex gap-2"><Skeleton variant="circle" className="w-7 h-7" /><Skeleton variant="text" className="w-24" /></div></td>
                                        <td className="table-cell"><Skeleton variant="badge" /></td>
                                        <td className="table-cell"><Skeleton variant="text" /></td>
                                        <td className="table-cell"><Skeleton variant="text" /></td>
                                        <td className="table-cell"><Skeleton variant="text" /></td>
                                        <td className="table-cell"><Skeleton variant="text" /></td>
                                        <td className="table-cell"><Skeleton variant="badge" /></td>
                                        <td className="table-cell text-right"><Skeleton variant="button" className="w-20 h-8" /></td>
                                    </tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="9" className="p-6 text-center text-slate-500">No TDS records found.</td></tr>
                            ) : filtered.map((tds) => {
                                const vendor = vendors.find(v => (v.id === tds.vendorId) || (v._id === tds.vendorId));
                                return (
                                    <tr key={tds.id} className="table-row hover:bg-slate-50 transition-colors group">
                                        <td className="table-cell font-mono text-blue-500 text-xs font-semibold">{tds.tdsId}</td>
                                        <td className="table-cell">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                                                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-slate-900 font-bold truncate">{vendor?.name || vendor?.vendorName || 'General Entry'}</p>
                                                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-tighter mt-0.5">Code: {vendor?.id || 'NA'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="table-cell"><span className="badge badge-green text-[10px] font-bold">{tds.section}</span></td>
                                        <td className="table-cell text-slate-500 text-[10px] font-bold uppercase whitespace-nowrap"><Calendar className="w-3 h-3 inline mr-1" />{tds.date}</td>
                                        <td className="table-cell text-slate-600 font-medium">{tds.period}</td>
                                        <td className="table-cell font-mono text-[10px] font-bold text-slate-500">{tds.reference || tds.ref || '—'}</td>
                                        <td className="table-cell text-slate-900 font-black tracking-tight text-sm">₹{(Number(tds.amount) || 0).toLocaleString()}</td>
                                        <td className="table-cell">
                                            <span className={`badge ${statusBadge[tds.status] || 'badge-yellow'} text-[10px] px-3 font-bold`}>{tds.status}</span>
                                        </td>
                                        <td className="table-cell">
                                            <div className="flex items-center justify-center gap-1 opacity-100 transition-opacity">
                                                <button onClick={() => handleOpenEdit(tds)} className="p-1.5 hover:bg-amber-50 text-amber-500 rounded-lg transition-all hover:scale-110 active:scale-95" title="Edit Record"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(tds)} className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-all hover:scale-110 active:scale-95" title="Void Deposit"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Deposit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-[#1e3a34] text-white">
                            <div>
                                <h2 className="text-base font-semibold">{editingId ? 'Edit TDS Record' : 'Record TDS Deposit'}</h2>
                                <p className="text-xs text-white/60 mt-0.5">Bulk Filing Confirmation</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                                         <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">TDS Record ID <span className="text-red-500">*</span></label>
                                    <input required value={formData.tdsId} onChange={e => setFormData({...formData, tdsId: e.target.value})} className="input font-mono" placeholder="TDS-2025-001" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Section Code</label>
                                    <select value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})} className="input">
                                        <option value="194C">194C (Contractor)</option>
                                        <option value="194J">194J (Professional)</option>
                                        <option value="194I">194I (Rent)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600">Select Vendor / Deductee <span className="text-red-500">*</span></label>
                                <select 
                                    required 
                                    className="input"
                                    value={formData.vendorId}
                                    onChange={e => setFormData({...formData, vendorId: e.target.value})}
                                >
                                    <option value="">Choose a vendor...</option>
                                    {vendors.map(v => (
                                        <option key={v.id || v._id} value={v.id || v._id}>{v.name || v.vendorName} (Code: {v.id || v._id})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Financial Quarter</label>
                                    <select value={formData.period} onChange={e => setFormData({...formData, period: e.target.value})} className="input">
                                        <option value="Q4 2024-25">Q4 (Jan-Mar)</option>
                                        <option value="Q3 2024-25">Q3 (Oct-Dec)</option>
                                        <option value="Q2 2024-25">Q2 (Jul-Sep)</option>
                                        <option value="Q1 2024-25">Q1 (Apr-Jun)</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Deposit Date</label>
                                    <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="input" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Status</label>
                                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="input">
                                        <option value="Pending">Pending</option>
                                        <option value="Deposited">Deposited</option>
                                        <option value="Approved">Approved</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Total Deposit Amount (₹)</label>
                                    <input required type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="input" placeholder="0.00" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600">Challan No / Reference</label>
                                <input value={formData.reference} onChange={e => setFormData({...formData, reference: e.target.value})} className="input" placeholder="e.g. BSR-012392" />
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6 sticky bottom-0 bg-white pb-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-xs font-bold text-slate-400 hover:text-slate-600 tracking-widest uppercase">Discard</button>
                                <button type="submit" disabled={isSaving} className="btn-primary flex-1 h-12 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />)}
                                    {editingId ? 'Update Record' : 'Save Deposit'}
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
                                <h3 className="text-lg font-black text-slate-800 tracking-tight">Void TDS?</h3>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Permanent Statutory Decoupling</p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed mb-8">
                            Are you sure you want to void <span className="font-black text-slate-900 underline decoration-red-200">{deleteConfirm.name}</span>? This will remove the tax record from your compliance filings permanently.
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
