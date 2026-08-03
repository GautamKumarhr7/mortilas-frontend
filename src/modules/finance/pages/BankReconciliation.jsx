import React, { useState } from 'react';
import { 
    Building, Search, Plus, Download, 
    ArrowRightLeft, CheckCircle2, AlertCircle, Clock, X, Upload, Edit2
} from 'lucide-react';
import toast from 'react-hot-toast';

const INITIAL_TRANSACTIONS = [
    { id: 'TXN-001', bank: 'HDFC Bank - 8821', amount: 450000, date: '2025-03-12', status: 'Matched', type: 'Credit', ref: 'RTGS-P772', bookEntry: 'L&T RA Bill #04' },
    { id: 'TXN-002', bank: 'HDFC Bank - 8821', amount: 156000, date: '2025-03-11', status: 'Unmatched', type: 'Debit', ref: 'CHQ-00122', bookEntry: '-' },
    { id: 'TXN-003', bank: 'SBI - 1102', amount: 45000, date: '2025-03-08', status: 'Matched', type: 'Debit', ref: 'UPI-9921', bookEntry: 'Petty Cash Replenish' },
    { id: 'TXN-004', bank: 'SBI - 1102', amount: 280000, date: '2025-03-05', status: 'Auto-Matched', type: 'Credit', ref: 'NEFT-Reliance', bookEntry: 'Reliance Solar Adv.' },
    { id: 'TXN-005', bank: 'HDFC Bank - 8821', amount: 22500, date: '2025-03-01', status: 'Pending', type: 'Debit', ref: 'POS-001', bookEntry: '-' },
];

const statusBadge = {
    'Matched': 'badge-green',
    'Auto-Matched': 'badge-blue',
    'Unmatched': 'badge-red',
    'Pending': 'badge-yellow',
};

export default function BankReconciliation() {
    const [search, setSearch] = useState('');
    const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        bank: 'HDFC Bank - 8821',
        amount: '',
        date: '',
        status: 'Unmatched',
        type: 'Debit',
        ref: '',
        bookEntry: '-'
    });

    const filtered = transactions.filter(t =>
        t.bank.toLowerCase().includes(search.toLowerCase()) ||
        t.ref.toLowerCase().includes(search.toLowerCase())
    );

    const handleOpenAdd = () => {
        setEditingId(null);
        setFormData({
            bank: 'HDFC Bank - 8821', amount: '', date: '', status: 'Unmatched', type: 'Debit', ref: '', bookEntry: '-'
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (txn) => {
        setEditingId(txn.id);
        setFormData({
            bank: txn.bank,
            amount: txn.amount,
            date: txn.date,
            status: txn.status,
            type: txn.type,
            ref: txn.ref,
            bookEntry: txn.bookEntry
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const baseAmount = Number(formData.amount);
        
        if (editingId) {
            setTransactions(transactions.map(t => t.id === editingId ? { ...t, ...formData, amount: baseAmount } : t));
            toast.success('Transaction record updated');
        } else {
            const newTxn = {
                id: `TXN-00${transactions.length + 1}`,
                ...formData,
                amount: baseAmount
            };
            setTransactions([newTxn, ...transactions]);
            toast.success('New transaction recorded');
        }
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-5 animate-fade-in relative">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Bank Reconciliation</h1>
                    <p className="text-slate-500 text-sm mt-1">Match bank statements with book entries</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="btn-secondary hidden sm:flex items-center gap-2">
                        <Download className="w-4 h-4" /> Export
                    </button>
                    <button onClick={handleOpenAdd} className="btn-primary whitespace-nowrap flex items-center gap-1.5">
                        <Plus className="w-5 h-5" /> Import Statement
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Uncleared Items', value: '12', color: 'text-amber-500' },
                    { label: 'Bank Balance', value: '₹1.20 Cr', color: 'text-green-500' },
                    { label: 'Book Balance', value: '₹1.18 Cr', color: 'text-blue-500' },
                    { label: 'Discrepancy', value: '₹2.1 L', color: 'text-red-500' },
                ].map((s, i) => (
                    <div key={i} className="card p-4">
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-slate-500 text-sm mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-slate-800">Statement vs Ledger</h3>
                        <button className="btn-secondary text-xs py-1 px-3 border border-slate-200 bg-white rounded hover:bg-slate-50">Auto Match</button>
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Search transactions or refs..." className="input pl-9" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                {['Txn ID', 'Bank Account', 'Type', 'Reference', 'Date', 'Book Entry', 'Amount', 'Status', 'Actions'].map(h => (
                                    <th key={h} className="table-header whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan="9" className="p-6 text-center text-slate-500">No transactions found.</td></tr>
                            ) : filtered.map((txn, i) => (
                                <tr key={i} className="table-row hover:bg-slate-50 transition-colors">
                                    <td className="table-cell font-mono text-blue-500 text-xs font-semibold">{txn.id}</td>
                                    <td className="table-cell text-slate-900 font-medium">{txn.bank}</td>
                                    <td className="table-cell">
                                        <span className={`badge ${txn.type === 'Credit' ? 'badge-green' : 'badge-red'}`}>{txn.type}</span>
                                    </td>
                                    <td className="table-cell font-mono text-xs text-slate-500">{txn.ref}</td>
                                    <td className="table-cell text-slate-500 text-xs">{txn.date}</td>
                                    <td className="table-cell text-slate-600">
                                        {txn.bookEntry !== '-' ? (
                                            <span className="text-emerald-600 font-medium">{txn.bookEntry}</span>
                                        ) : (
                                            <button className="text-xs text-slate-400 hover:text-[#2f6645] flex items-center gap-1 transition-colors">
                                                <Search className="w-3 h-3" /> Match Manual
                                            </button>
                                        )}
                                    </td>
                                    <td className="table-cell text-slate-900 font-semibold">₹{txn.amount.toLocaleString()}</td>
                                    <td className="table-cell">
                                        <span className={`badge ${statusBadge[txn.status] || 'badge-yellow'}`}>{txn.status}</span>
                                    </td>
                                    <td className="table-cell">
                                        <button onClick={() => handleOpenEdit(txn)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-emerald-600 transition-colors">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Import Statement Modal (or Edit Modal) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-[#1e3a34] text-white">
                            <div>
                                <h2 className="text-base font-semibold">{editingId ? 'Edit Transaction Details' : 'Manual Entry / Import Bank Statement'}</h2>
                                <p className="text-xs text-white/60 mt-0.5">{editingId ? 'Modify recorded data' : 'Upload CSV or manual entry'}</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                            {!editingId && (
                                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-[#2f6645] hover:bg-emerald-50/30 transition-colors mb-4">
                                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                                    <p className="text-sm font-semibold text-slate-700">Drag & Drop statement file</p>
                                    <p className="text-xs text-slate-500 mt-1">or click to browse local files (CSV/XLSX)</p>
                                </div>
                            )}
                            
                            <div className="flex items-center gap-3">
                                <hr className="flex-1 border-slate-200" />
                                <span className="text-xs text-slate-400 font-semibold">{editingId ? 'EDIT DATA' : 'OR MANUAL ENTRY'}</span>
                                <hr className="flex-1 border-slate-200" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Bank Account</label>
                                    <select required value={formData.bank} onChange={e => setFormData({...formData, bank: e.target.value})} className="input">
                                        <option value="HDFC Bank - 8821">HDFC Bank - 8821</option>
                                        <option value="SBI - 1102">SBI - 1102</option>
                                        <option value="ICICI - Operations">ICICI - Operations</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Txn Type</label>
                                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="input">
                                        <option value="Credit">Credit (Deposit)</option>
                                        <option value="Debit">Debit (Withdrawal)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Amount (₹)</label>
                                    <input required type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="input" placeholder="0.00" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Date</label>
                                    <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="input" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Reference / Narration</label>
                                    <input value={formData.ref} onChange={e => setFormData({...formData, ref: e.target.value})} className="input" placeholder="e.g. NEFT/UPI" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Status</label>
                                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="input">
                                        <option value="Matched">Matched</option>
                                        <option value="Unmatched">Unmatched</option>
                                        <option value="Pending">Pending</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
                                <button type="submit" className="btn-primary flex-1">{editingId ? 'Update Entry' : 'Add Entry'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
