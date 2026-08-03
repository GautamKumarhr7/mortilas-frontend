import React, { useState, useEffect } from 'react';
import { Search, Plus, Download, Building2, Calendar, CheckCircle2, Clock, AlertCircle, X, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Skeleton from '../../../components/common/Skeleton';

const INITIAL_RECEIVABLES = [];

const statusBadge = {
    'Received': 'badge-green',
    'Pending': 'badge-yellow',
    'Overdue': 'badge-red',
};

export default function AccountsReceivable() {
    const [search, setSearch] = useState('');
    const [receivables, setReceivables] = useState(INITIAL_RECEIVABLES);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 1200);
        return () => clearTimeout(timer);
    }, []);

    const [formData, setFormData] = useState({
        client: '',
        project: '',
        type: 'RA Bill',
        invoiceDate: '',
        dueDate: '',
        amount: '',
        status: 'Pending'
    });

    const filtered = receivables.filter(r =>
        r.client.toLowerCase().includes(search.toLowerCase()) ||
        r.id.toLowerCase().includes(search.toLowerCase())
    );

    const totalReceivable = receivables.filter(r => r.status !== 'Received').reduce((a, r) => a + Number(r.amount), 0);
    const overdue = receivables.filter(r => r.status === 'Overdue').reduce((a, r) => a + Number(r.amount), 0);

    const handleOpenAdd = () => {
        setEditingId(null);
        setFormData({
            client: '', project: '', type: 'RA Bill', invoiceDate: '', dueDate: '', amount: '', status: 'Pending'
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (rec) => {
        setEditingId(rec.id);
        setFormData({
            client: rec.client,
            project: rec.project,
            type: rec.type,
            invoiceDate: rec.invoiceDate,
            dueDate: rec.dueDate,
            amount: rec.amount,
            status: rec.status
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const numAmount = Number(formData.amount);
        
        if (editingId) {
            setReceivables(receivables.map(r => r.id === editingId ? { ...r, ...formData, amount: numAmount } : r));
            toast.success('Receivable record updated');
        } else {
            const newRec = {
                id: `AR-00${receivables.length + 1}`,
                ...formData,
                amount: numAmount
            };
            setReceivables([newRec, ...receivables]);
            toast.success('New invoice record created');
        }
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-5 animate-fade-in relative">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Accounts Receivable</h1>
                    <p className="text-slate-500 text-sm mt-1">Track outstanding invoices & client payments</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="btn-secondary hidden sm:flex items-center gap-2">
                        <Download className="w-4 h-4" /> Export
                    </button>
                    <button onClick={handleOpenAdd} className="btn-primary whitespace-nowrap flex items-center gap-1.5">
                        <Plus className="w-5 h-5" /> Raise Invoice
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Total Outstanding', value: `₹${(totalReceivable / 100000).toFixed(1)}L`, color: 'text-blue-500' },
                    { label: 'Overdue Amount', value: `₹${(overdue / 100000).toFixed(1)}L`, color: 'text-red-500' },
                    { label: 'Received this Month', value: '₹40.5 L', color: 'text-green-500' },
                    { label: 'Total Invoices', value: receivables.length, color: 'text-purple-500' },
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
                    <h3 className="font-semibold text-slate-800">Invoice Registry</h3>
                    <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Search client or invoice..." className="input pl-9" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                {['Invoice ID', 'Client', 'Project', 'Type', 'Invoice Date', 'Due Date', 'Amount', 'Status', 'Actions'].map(h => (
                                    <th key={h} className="table-header whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="table-row">
                                        <td className="table-cell"><Skeleton variant="text" className="w-16" /></td>
                                        <td className="table-cell"><div className="flex gap-2"><Skeleton variant="circle" className="w-7 h-7" /><Skeleton variant="text" className="w-32" /></div></td>
                                        <td className="table-cell"><Skeleton variant="text" /></td>
                                        <td className="table-cell"><Skeleton variant="badge" /></td>
                                        <td className="table-cell"><Skeleton variant="text" /></td>
                                        <td className="table-cell"><Skeleton variant="text" /></td>
                                        <td className="table-cell"><Skeleton variant="text" /></td>
                                        <td className="table-cell"><Skeleton variant="badge" /></td>
                                        <td className="table-cell"><Skeleton variant="button" className="w-10 h-8" /></td>
                                    </tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="9" className="p-6 text-center text-slate-500">No receivables found.</td></tr>
                            ) : filtered.map((r, i) => (
                                <tr key={i} className="table-row hover:bg-slate-50 transition-colors">
                                    <td className="table-cell font-mono text-blue-500 text-xs font-semibold">{r.id}</td>
                                    <td className="table-cell">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 text-xs font-bold flex-shrink-0">
                                                {r.client.split(' ').map(n => n?.[0]).join('').slice(0, 2)}
                                            </div>
                                            <span className="text-slate-900 font-medium whitespace-nowrap">{r.client}</span>
                                        </div>
                                    </td>
                                    <td className="table-cell text-slate-500 text-xs">{r.project}</td>
                                    <td className="table-cell"><span className="badge badge-blue">{r.type}</span></td>
                                    <td className="table-cell text-slate-500 text-xs">{r.invoiceDate}</td>
                                    <td className="table-cell text-slate-500 text-xs">{r.dueDate}</td>
                                    <td className="table-cell text-emerald-600 font-semibold">₹{(r.amount / 100000).toFixed(2)}L</td>
                                    <td className="table-cell">
                                        <span className={`badge ${statusBadge[r.status] || 'badge-yellow'}`}>{r.status}</span>
                                    </td>
                                    <td className="table-cell">
                                        <button onClick={() => handleOpenEdit(r)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-emerald-600 transition-colors">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Raise Invoice Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-[#1e3a34] text-white">
                            <div>
                                <h2 className="text-base font-semibold">{editingId ? 'Edit Invoice' : 'Raise Invoice'}</h2>
                                <p className="text-xs text-white/60 mt-0.5">Bill recording for Receivables</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600">Client</label>
                                <input required value={formData.client} onChange={e => setFormData({...formData, client: e.target.value})} className="input" placeholder="e.g. Larsen & Toubro" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Associated Project</label>
                                    <input required value={formData.project} onChange={e => setFormData({...formData, project: e.target.value})} className="input" placeholder="e.g. Metro Phase 2" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Action Type</label>
                                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="input">
                                        <option value="RA Bill #04">RA Bill</option>
                                        <option value="Tax Invoice">Tax Invoice</option>
                                        <option value="Final Bill">Final Bill</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Creation Date</label>
                                    <input required type="date" value={formData.invoiceDate} onChange={e => setFormData({...formData, invoiceDate: e.target.value})} className="input" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Due Date</label>
                                    <input required type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="input" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Base Amount (₹)</label>
                                    <input required type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="input" placeholder="0.00" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Status</label>
                                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="input">
                                        <option value="Pending">Pending</option>
                                        <option value="Received">Received</option>
                                        <option value="Overdue">Overdue</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
                                <button type="submit" className="btn-primary flex-1">{editingId ? 'Update Invoice' : 'Raise Invoice'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
