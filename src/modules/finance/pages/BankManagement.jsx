import { useState, useEffect } from 'react';
import { 
    Building2, Landmark, Search, Plus, CreditCard, 
    MoreVertical, Edit3, Trash2, CheckCircle2, AlertCircle,
    X, Save, Loader2, Wallet, ArrowUpRight, 
    ArrowDownRight, Building, MapPin, Hash, Shield
} from 'lucide-react';
import toast from 'react-hot-toast';
import { bankAPI } from '../services';
import Skeleton from '../../../components/common/Skeleton';

export default function BankManagement() {
    const [banks, setBanks] = useState([]);
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, name: '' });

    const [formData, setFormData] = useState({
        bankName: '',
        accountNo: '',
        ifsc: '',
        branch: '',
        accountType: 'Current',
        accountHolder: '',
        status: 'Active',
        balance: 0
    });

    const fetchBanks = async () => {
        setIsLoading(true);
        try {
            const res = await bankAPI.getAllBanks();
            const data = res?.banks || res?.data || res || [];
            setBanks(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Fetch error:", error);
            toast.error("Failed to load bank registry.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBanks();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleOpenAdd = () => {
        setIsEditing(false);
        setFormData({
            bankName: '',
            accountNo: '',
            ifsc: '',
            branch: '',
            accountType: 'Current',
            accountHolder: '',
            status: 'Active',
            balance: 0
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (bank) => {
        setCurrentId(bank.id);
        setFormData({
            bankName: bank.bankName || '',
            accountNo: bank.accountNo || '',
            ifsc: bank.ifsc || '',
            branch: bank.branch || '',
            accountType: bank.accountType || 'Current',
            accountHolder: bank.accountHolder || '',
            status: bank.status || 'Active',
            balance: bank.balance || 0
        });
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (isEditing) {
                await bankAPI.updateBank(currentId, formData);
                toast.success('Bank account updated');
            } else {
                await bankAPI.createBank(formData);
                toast.success('New bank account added');
            }
            fetchBanks();
            setIsModalOpen(false);
        } catch (error) {
            console.error("Save error:", error);
            toast.error('Failed to save bank details');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (bank) => {
        setDeleteConfirm({ show: true, id: bank.id, name: bank.bankName });
    };

    const confirmDelete = async () => {
        setIsSaving(true);
        try {
            await bankAPI.deleteBank(deleteConfirm.id);
            toast.success('Bank account removed');
            fetchBanks();
            setDeleteConfirm({ show: false, id: null, name: '' });
        } catch (error) {
            console.error("Delete error:", error);
            toast.error('Failed to remove bank account');
        } finally {
            setIsSaving(false);
        }
    };

    const filteredBanks = banks.filter(bank => 
        bank.bankName.toLowerCase().includes(search.toLowerCase()) ||
        bank.accountNo.toLowerCase().includes(search.toLowerCase()) ||
        bank.branch.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in pb-12 relative">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Bank Management</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage corporate bank accounts & cash flow registry</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative hidden sm:block w-64">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search banks or accounts..."
                            className="input pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button onClick={handleOpenAdd} className="btn-primary flex items-center gap-1.5">
                        <Plus className="w-4 h-4" /> Add Bank Account
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card p-6 border-l-4 border-emerald-500 bg-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Liquidity</p>
                            <h3 className="text-2xl font-black text-slate-900 mt-1">₹{(banks.reduce((acc, curr) => acc + (Number(curr.balance) || 0), 0)).toLocaleString()}</h3>
                        </div>
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-emerald-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 w-fit px-2 py-0.5 rounded-full">
                        <ArrowUpRight className="w-3 h-3" /> +12.5% from last month
                    </div>
                </div>
                <div className="card p-6 border-l-4 border-blue-500 bg-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Accounts</p>
                            <h3 className="text-2xl font-black text-slate-900 mt-1">{banks.filter(b => b.status === 'Active').length} <span className="text-slate-400 text-lg font-medium">/ {banks.length}</span></h3>
                        </div>
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                            <Landmark className="w-5 h-5 text-blue-600" />
                        </div>
                    </div>
                </div>
                <div className="card p-6 border-l-4 border-amber-500 bg-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending Reconciliation</p>
                            <h3 className="text-2xl font-black text-slate-900 mt-1">04</h3>
                        </div>
                        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                            <Shield className="w-5 h-5 text-amber-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Banks List/Table */}
            <div className="card overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <h3 className="font-semibold text-slate-800 text-sm">Account Registry</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="table-header">Bank & Account</th>
                                <th className="table-header">IFSC & Branch</th>
                                <th className="table-header">Type</th>
                                <th className="table-header text-right">Balance</th>
                                <th className="table-header">Status</th>
                                <th className="table-header text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <tr key={i} className="table-row">
                                        <td className="table-cell"><div className="flex gap-2"><Skeleton variant="circle" className="w-9 h-9" /><Skeleton variant="text" className="w-32" /></div></td>
                                        <td className="table-cell"><Skeleton variant="text" className="w-40" /></td>
                                        <td className="table-cell"><Skeleton variant="badge" className="w-16" /></td>
                                        <td className="table-cell text-right"><Skeleton variant="text" className="ml-auto w-24" /></td>
                                        <td className="table-cell"><Skeleton variant="badge" className="w-16" /></td>
                                        <td className="table-cell"><Skeleton variant="text" className="mx-auto w-20" /></td>
                                    </tr>
                                ))
                            ) : filteredBanks.length === 0 ? (
                                <tr><td colSpan={6} className="p-12 text-center text-slate-400">No bank accounts found matching your search.</td></tr>
                            ) : filteredBanks.map(bank => (
                                <tr key={bank.id} className="table-row hover:bg-slate-50 transition-colors group">
                                    <td className="table-cell">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                                <Building2 className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">{bank.bankName}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{bank.accountNo}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="table-cell">
                                        <p className="text-slate-700 font-medium">{bank.branch}</p>
                                        <p className="text-[10px] font-black text-[#2f6645] uppercase mt-0.5">{bank.ifsc}</p>
                                    </td>
                                    <td className="table-cell">
                                        <span className={`badge ${bank.accountType === 'Current' ? 'badge-blue' : 'badge-purple'} text-[9px] px-2`}>{bank.accountType}</span>
                                    </td>
                                    <td className="table-cell text-right">
                                        <p className="font-black text-slate-900 tabular-nums">₹{(Number(bank.balance) || 0).toLocaleString()}</p>
                                    </td>
                                    <td className="table-cell">
                                        <span className={`badge ${bank.status === 'Active' ? 'badge-green' : 'badge-red'} text-[9px]`}>{bank.status}</span>
                                    </td>
                                    <td className="table-cell">
                                        <div className="flex items-center justify-center gap-1">
                                            <button onClick={() => handleOpenEdit(bank)} className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-xl transition-all" title="Edit Bank"><Edit3 className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(bank)} className="p-2 hover:bg-red-50 text-red-600 rounded-xl transition-all" title="Remove Bank"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bank Entry Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-[#1e3a34] text-white">
                            <div>
                                <h2 className="text-base font-semibold">{isEditing ? 'Modify Bank Profile' : 'New Bank Integration'}</h2>
                                <p className="text-xs text-white/60 mt-0.5">Secure Banking Terminal</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-8 space-y-8 max-h-[75vh] overflow-y-auto">
                            <div>
                                <h3 className="text-[10px] font-black tracking-[0.2em] text-[#1e3a34] mb-6 uppercase flex items-center gap-2"><Building className="w-3 h-3" /> 1. Identity & Location</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Bank Name <span className="text-red-500">*</span></label>
                                        <input required name="bankName" value={formData.bankName} onChange={handleInputChange} className="input h-12 font-bold" placeholder="e.g. HDFC Bank" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Branch Name <span className="text-red-500">*</span></label>
                                        <input required name="branch" value={formData.branch} onChange={handleInputChange} className="input h-12 font-bold" placeholder="e.g. Connaught Place" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-[10px] font-black tracking-[0.2em] text-[#1e3a34] mb-6 uppercase flex items-center gap-2"><CreditCard className="w-3 h-3" /> 2. Account Parameters</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Number <span className="text-red-500">*</span></label>
                                        <input required name="accountNo" value={formData.accountNo} onChange={handleInputChange} className="input h-12 font-black tracking-wider" placeholder="000000000000" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">IFSC Code <span className="text-red-500">*</span></label>
                                        <input required name="ifsc" value={formData.ifsc} onChange={handleInputChange} className="input h-12 font-black uppercase" placeholder="HDFC0000000" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Type</label>
                                        <select name="accountType" value={formData.accountType} onChange={handleInputChange} className="input h-12 font-bold">
                                            <option value="Current">Current Account</option>
                                            <option value="Savings">Savings Account</option>
                                            <option value="OD">Overdraft (OD)</option>
                                            <option value="Cash Credit">Cash Credit (CC)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Status</label>
                                        <select name="status" value={formData.status} onChange={handleInputChange} className="input h-12 font-bold">
                                            <option value="Active">Active / Operational</option>
                                            <option value="Inactive">Inactive / Dormant</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-[10px] font-black tracking-[0.2em] text-[#1e3a34] mb-6 uppercase flex items-center gap-2"><Wallet className="w-3 h-3" /> 3. Financial Exposure</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Opening Balance (₹)</label>
                                        <input type="number" name="balance" value={formData.balance} onChange={handleInputChange} className="input h-12 font-black text-[#2f6645]" placeholder="0.00" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Holder Name <span className="text-red-500">*</span></label>
                                        <input required name="accountHolder" value={formData.accountHolder} onChange={handleInputChange} className="input h-12 font-bold" placeholder="Company Name / Personal" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6 sticky bottom-0 bg-white">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-all">Discard</button>
                                <button type="submit" disabled={isSaving} className="btn-primary flex-1 h-14 text-[11px] font-black uppercase tracking-widest shadow-xl shadow-emerald-900/10 flex items-center justify-center gap-3 bg-[#1e3a34] hover:bg-[#152a26]">
                                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    {isEditing ? 'Update Profile' : 'Integrate Bank'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm.show && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-8 text-center">
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <Trash2 className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-black text-slate-800 tracking-tight">Remove Bank Account?</h3>
                        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                            Are you sure you want to remove <span className="font-black text-slate-900">{deleteConfirm.name}</span>? This action will disconnect the account from all automated reconciliations.
                        </p>
                        <div className="flex gap-3 mt-8">
                            <button onClick={() => setDeleteConfirm({ show: false, id: null, name: '' })} className="flex-1 py-4 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all">Cancel</button>
                            <button onClick={confirmDelete} disabled={isSaving} className="flex-1 py-4 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-red-900/20 hover:bg-red-700 transition-all">
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
