import React, { useState, useEffect, useCallback } from 'react';
import { 
    BookOpen, Search, Plus, ChevronRight, ChevronDown, 
    Landmark, Wallet, ArrowRightLeft, Download, Edit2, Trash2, ShieldCheck, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { confirmToast } from '../../../utils/toastUtils';
import { accountAPI } from '../services';

// Helper to reconstruct tree from flat list with "parents" references
const buildTree = (flatList) => {
    const map = {};
    const roots = [];
    
    // First pass: map everything by ID
    flatList.forEach(item => {
        map[item.id] = { ...item, subAccounts: [] };
    });
    
    // Second pass: assign to parents
    flatList.forEach(item => {
        const node = map[item.id];
        if (item.parentId && map[item.parentId]) {
            map[item.parentId].subAccounts.push(node);
        } else {
            roots.push(node);
        }
    });
    
    return roots;
};

const typeBadge = {
    'ASSET': 'badge-blue',
    'LIABILITY': 'badge-red',
    'REVENUE': 'badge-green',
    'EXPENSE': 'badge-yellow',
    'EQUITY': 'badge-purple',
};

const AccountRow = ({ account, depth = 0, onEdit }) => {
    const [isExpanded, setIsExpanded] = useState(depth === 0);
    const hasSubs = account.subAccounts && account.subAccounts.length > 0;

    return (
        <>
            <tr className={`table-row hover:bg-slate-50 transition-colors ${depth === 0 ? 'bg-slate-50/50' : ''}`}>
                <td className="table-cell w-12 text-center font-medium text-slate-500">{account.accountCode}</td>
                <td className="table-cell">
                    <div style={{ paddingLeft: `${depth * 20}px` }} className="flex items-center gap-2">
                        {hasSubs ? (
                            <button onClick={() => setIsExpanded(!isExpanded)} className="p-0.5 hover:bg-slate-200 rounded text-slate-400 flex-shrink-0">
                                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            </button>
                        ) : (
                            <div className="w-5" />
                        )}
                        <span className={`text-slate-800 ${depth === 0 ? 'font-semibold' : 'font-medium'} text-sm`}>{account.accountName}</span>
                        {account.isGroup && <span className="badge badge-blue ml-2 text-[10px] py-0.5 px-1.5">Group</span>}
                    </div>
                </td>
                <td className="table-cell">
                    <span className={`badge ${typeBadge[account.accountType] || 'badge-blue'}`}>{account.accountType}</span>
                </td>
                <td className="table-cell">
                    <span className="text-slate-500 text-xs font-medium bg-slate-100 px-2 py-1 rounded">{account.accountNature || 'N/A'}</span>
                </td>
                <td className="table-cell" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1 opacity-100 transition-all">
                        <button onClick={() => onEdit(account)} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-500 hover:text-emerald-600 transition-all cursor-pointer">
                            <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => {
                            confirmToast(`Deactivate account ${account.accountName}?`, async () => {
                                try {
                                    await accountAPI.deactivateAccount(account.id);
                                    toast.success('Account deactivated');
                                } catch (e) {
                                    toast.error('Failed to deactivate');
                                }
                            });
                        }} className="p-1.5 bg-slate-100 hover:bg-red-50 rounded text-slate-500 hover:text-red-600 transition-all cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </td>
            </tr>
            {isExpanded && hasSubs && account.subAccounts.map(sub => (
                <AccountRow key={sub.accountCode} account={sub} depth={depth + 1} onEdit={onEdit} />
            ))}
        </>
    );
};

export default function ChartOfAccounts() {
    const [search, setSearch] = useState('');
    const [accounts, setAccounts] = useState([]);
    const [flatData, setFlatData] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const fetchAccounts = useCallback(async () => {
        try {
            const res = await accountAPI.getAllAccounts();
            const data = Array.isArray(res) ? res : (res?.data || res?.accounts || []);
            setFlatData(data);
            setAccounts(buildTree(data));
        } catch (error) {
            console.error('Failed to fetch accounts:', error);
            toast.error('Failed to load chart of accounts');
        }
    }, []);

    useEffect(() => {
        queueMicrotask(fetchAccounts);
    }, [fetchAccounts]);

    const [formData, setFormData] = useState({
        accountName: '',
        accountType: 'EXPENSE',
        parentId: '',
        isGroup: false
    });

    const handleOpenAdd = () => {
        setEditingId(null);
        setFormData({ accountName: '', accountType: 'ASSET', parentId: '', isGroup: false });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (acc) => {
        setEditingId(acc.id);
        setFormData({
            accountName: acc.accountName,
            accountType: acc.accountType,
            parentId: acc.parentId || '',
            isGroup: acc.isGroup || false
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                parentId: formData.parentId ? Number(formData.parentId) : null
            };

            if (editingId) {
                await accountAPI.updateAccount(editingId, payload);
                toast.success('Account updated successfully');
            } else {
                await accountAPI.createAccount(payload);
                toast.success('New ledger account created');
            }
            fetchAccounts();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Failed to save account:', error);
            toast.error('Failed to save account changes');
        }
    };

    return (
        <div className="space-y-5 animate-fade-in relative">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Chart of Accounts</h1>
                    <p className="text-slate-500 text-sm mt-1">Financial ledger hierarchy & account structure</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="btn-secondary hidden sm:flex items-center gap-2">
                        <Download className="w-4 h-4" /> Export Ledger
                    </button>
                    <button onClick={handleOpenAdd} className="btn-primary whitespace-nowrap flex items-center gap-1.5">
                        <Plus className="w-5 h-5" /> New Account
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Total Assets', value: '4.50 Cr', color: 'text-blue-500', icon: Landmark },
                    { label: 'Total Liabilities', value: '1.80 Cr', color: 'text-red-500', icon: Wallet },
                    { label: 'Net Equity', value: '2.70 Cr', color: 'text-green-500', icon: ShieldCheck },
                    { label: 'Fiscal Revenue', value: '3.20 Cr', color: 'text-purple-500', icon: ArrowRightLeft },
                ].map((s, i) => (
                    <div key={i} className="card p-4">
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-slate-500 text-sm mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Account Tree */}
            <div className="card overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <h3 className="font-semibold text-slate-800">Account Structure</h3>
                    <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Search accounts..." className="input pl-9" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                {['Code', 'Account Name', 'Type', 'Nature', 'Actions'].map(h => (
                                    <th key={h} className="table-header">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {accounts.map(acc => (
                                <AccountRow key={acc.accountCode} account={acc} onEdit={handleOpenEdit} />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Account Generation Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-[#1e3a34] text-white">
                            <div>
                                <h2 className="text-base font-semibold">{editingId ? 'Edit Account' : 'New Chart of Account'}</h2>
                                <p className="text-xs text-white/60 mt-0.5">Ledger Creation</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Account Name</label>
                                    <input required value={formData.accountName} onChange={e => setFormData({...formData, accountName: e.target.value})} className="input" placeholder="e.g. Current Assets" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Account Type</label>
                                    <select value={formData.accountType} onChange={e => setFormData({...formData, accountType: e.target.value})} className="input">
                                        <option value="ASSET">Asset</option>
                                        <option value="LIABILITY">Liability</option>
                                        <option value="EQUITY">Equity</option>
                                        <option value="REVENUE">Revenue</option>
                                        <option value="EXPENSE">Expense</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Parent Account</label>
                                    <select value={formData.parentId} onChange={e => setFormData({...formData, parentId: e.target.value})} className="input">
                                        <option value="">None (Root Level)</option>
                                        {flatData.filter(a => a.isGroup).map(a => (
                                            <option key={a.id} value={a.id}>{a.accountCode} - {a.accountName}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5 pt-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={formData.isGroup} onChange={e => setFormData({...formData, isGroup: e.target.checked})} className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4" />
                                        <span className="text-sm font-medium text-slate-700">Is Group Account</span>
                                    </label>
                                    <p className="text-xs text-slate-400 mt-1">Group accounts contain sub-accounts and cannot be used in transactions directly.</p>
                                </div>
                            </div>



                            <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
                                <button type="submit" className="btn-primary flex-1">{editingId ? 'Save Changes' : 'Create Account'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
