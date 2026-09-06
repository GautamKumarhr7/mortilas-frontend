import React, { useState, useContext, useEffect, useCallback } from 'react';
import { AppContext } from '../../../context/AppContextValue';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveModule } from '../../../store/slices/uiSlice';
import { 
    FileText, ArrowRightLeft, ArrowDownRight, ArrowUpRight, 
    ShoppingCart, Briefcase, Plus, Search, Filter, Calendar,
    ChevronLeft, ChevronRight, RefreshCw, AlertCircle
} from 'lucide-react';
import { voucherAPI } from '../voucherService';

const VOUCHER_TYPES = [
    { id: 'receipt',  name: 'Receipt Voucher',  description: 'Record money received from customers or other sources.', icon: ArrowDownRight, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200 hover:border-emerald-400' },
    { id: 'payment',  name: 'Payment Voucher',   description: 'Record money paid to vendors or for expenses.',          icon: ArrowUpRight,   color: 'text-rose-600',    bg: 'bg-rose-50 border-rose-200 hover:border-rose-400' },
    { id: 'journal',  name: 'Journal Voucher',   description: 'Record non-cash transactions and adjustments.',          icon: FileText,       color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-200 hover:border-blue-400' },
    { id: 'contra',   name: 'Contra Voucher',    description: 'Record transfers between bank and cash accounts.',       icon: ArrowRightLeft, color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200 hover:border-amber-400' },
    { id: 'sales',    name: 'Sales Voucher',     description: 'Record sales of goods or services.',                     icon: ShoppingCart,   color: 'text-indigo-600',  bg: 'bg-indigo-50 border-indigo-200 hover:border-indigo-400' },
    { id: 'purchase', name: 'Purchase Voucher',  description: 'Record purchases of goods or services.',                 icon: Briefcase,      color: 'text-cyan-600',    bg: 'bg-cyan-50 border-cyan-200 hover:border-cyan-400' },
];

const TYPE_BADGE_COLORS = {
    receipt:  'bg-emerald-100 text-emerald-700',
    payment:  'bg-rose-100 text-rose-700',
    journal:  'bg-blue-100 text-blue-700',
    contra:   'bg-amber-100 text-amber-700',
    sales:    'bg-indigo-100 text-indigo-700',
    purchase: 'bg-cyan-100 text-cyan-700',
};

const PAGE_SIZE = 10;

export default function Vouchers() {
    const { setSelectedVoucherType } = useContext(AppContext);
    const dispatch    = useDispatch();
    const activeModule = useSelector(state => state.ui.activeModule);

    const [vouchers, setVouchers]       = useState([]);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState(null);
    const [filterType, setFilterType]   = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const fetchVouchers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await voucherAPI.getAllVouchers();
            // API returns { success, data } or just an array
            const data = res?.data ?? res ?? [];
            // Sort newest first by id
            setVouchers([...data].sort((a, b) => b.id - a.id));
        } catch (err) {
            console.error('Failed to fetch vouchers:', err);
            setError('Failed to load vouchers. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch on initial mount and every time this page becomes active
    useEffect(() => {
        if (activeModule === 'vouchers') {
            fetchVouchers();
        }
    }, [activeModule, fetchVouchers]);

    const handleCreateVoucher = (typeId) => {
        setSelectedVoucherType(typeId);
        dispatch(setActiveModule('voucher-entry'));
    };

    // --- Filtering ---
    const filtered = vouchers.filter(v => {
        const matchesType   = filterType === 'all' || v.type === filterType;
        const search        = searchQuery.toLowerCase();
        const matchesSearch = !search ||
            String(v.id).includes(search) ||
            (v.narration  && v.narration.toLowerCase().includes(search)) ||
            (v.invoiceId  && v.invoiceId.toLowerCase().includes(search)) ||
            (v.buyer      && v.buyer.toLowerCase().includes(search)) ||
            (v.seller     && v.seller.toLowerCase().includes(search));
        return matchesType && matchesSearch;
    });

    // Reset to page 1 on filter change
    useEffect(() => { setCurrentPage(1); }, [filterType, searchQuery]);

    // --- Pagination ---
    const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated   = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const formatDate = (iso) => {
        if (!iso) return '-';
        return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const calcNetAmount = (v) => {
        const items   = Array.isArray(v.itemsdetails) ? v.itemsdetails : [];
        const subtotal = items.reduce((s, i) => s + (Number(i.quantity) * Number(i.rate)), 0);
        const gst     = (subtotal * Number(v.gstrate || 0)) / 100;
        const tds     = (subtotal * Number(v.tdsrate || 0)) / 100;
        return subtotal + gst - tds;
    };

    return (
        <div className="space-y-6 animate-fade-in relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Voucher Management</h1>
                    <p className="text-slate-500 text-sm mt-1">Create and manage accounting vouchers</p>
                </div>
            </div>

            {/* Voucher Types Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {VOUCHER_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                        <div 
                            key={type.id}
                            onClick={() => handleCreateVoucher(type.id)}
                            className={`p-5 rounded-xl border-2 transition-all cursor-pointer group ${type.bg} flex flex-col items-start gap-3`}
                        >
                            <div className={`p-3 rounded-lg bg-white shadow-sm group-hover:scale-110 transition-transform ${type.color}`}>
                                <Icon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-800 text-lg">{type.name}</h3>
                                <p className="text-sm text-slate-600 mt-1">{type.description}</p>
                            </div>
                            <div className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-700 group-hover:text-emerald-700 transition-colors">
                                <span>Create Entry</span>
                                <Plus className="w-4 h-4" />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Vouchers List */}
            <div className="card overflow-hidden mt-8">
                <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <h3 className="font-semibold text-slate-800 text-lg">
                        All Vouchers
                        {!loading && <span className="ml-2 text-sm font-normal text-slate-500">({filtered.length})</span>}
                    </h3>
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                        {/* Search */}
                        <div className="relative w-full sm:w-64">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search vouchers..." 
                                className="input pl-9 w-full bg-white"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        {/* Filter */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Filter className="w-4 h-4 text-slate-400" />
                            <select 
                                className="input bg-white"
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                            >
                                <option value="all">All Types</option>
                                {VOUCHER_TYPES.map(t => (
                                    <option key={t.id} value={t.id}>{t.name.replace(' Voucher', '')}</option>
                                ))}
                            </select>
                        </div>
                        {/* Refresh */}
                        <button
                            onClick={fetchVouchers}
                            disabled={loading}
                            className="p-2 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors disabled:opacity-50"
                            title="Refresh"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                            <tr>
                                <th className="py-3 px-4 text-left font-semibold">ID</th>
                                <th className="py-3 px-4 text-left font-semibold">Date</th>
                                <th className="py-3 px-4 text-left font-semibold">Type</th>
                                <th className="py-3 px-4 text-left font-semibold">Invoice Ref</th>
                                <th className="py-3 px-4 text-left font-semibold">Buyer / Seller</th>
                                <th className="py-3 px-4 text-left font-semibold">Narration</th>
                                <th className="py-3 px-4 text-right font-semibold">Net Amt (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <RefreshCw className="w-6 h-6 animate-spin" />
                                            <span>Loading vouchers...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan="7" className="py-12 text-center text-red-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <AlertCircle className="w-6 h-6" />
                                            <span>{error}</span>
                                            <button onClick={fetchVouchers} className="text-sm text-slate-600 underline mt-1">Retry</button>
                                        </div>
                                    </td>
                                </tr>
                            ) : paginated.length > 0 ? (
                                paginated.map((voucher) => {
                                    const net = calcNetAmount(voucher);
                                    return (
                                        <tr key={voucher.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                            <td className="py-3 px-4 font-medium text-slate-800">
                                                #{String(voucher.id).padStart(4, '0')}
                                            </td>
                                            <td className="py-3 px-4 text-slate-600">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                    {formatDate(voucher.entrydate)}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${TYPE_BADGE_COLORS[voucher.type] || 'bg-slate-100 text-slate-700'}`}>
                                                    {voucher.type}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-slate-600 font-mono text-xs">
                                                {voucher.invoiceId || <span className="text-slate-400">-</span>}
                                            </td>
                                            <td className="py-3 px-4">
                                                {voucher.buyer && (
                                                    <div className="text-xs text-slate-500">
                                                        <span className="font-medium text-slate-700">B: </span>{voucher.buyer}
                                                    </div>
                                                )}
                                                {voucher.seller && (
                                                    <div className="text-xs text-slate-500">
                                                        <span className="font-medium text-slate-700">S: </span>{voucher.seller}
                                                    </div>
                                                )}
                                                {!voucher.buyer && !voucher.seller && <span className="text-slate-400 text-xs">-</span>}
                                            </td>
                                            <td className="py-3 px-4 text-slate-500 max-w-[200px]">
                                                <p className="truncate">{voucher.narration || <span className="text-slate-300">—</span>}</p>
                                            </td>
                                            <td className="py-3 px-4 text-right font-semibold text-slate-800">
                                                {net > 0
                                                    ? net.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                                    : <span className="text-slate-400 font-normal">-</span>
                                                }
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="7" className="py-10 text-center text-slate-500">
                                        No vouchers found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && !error && filtered.length > PAGE_SIZE && (
                    <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
                        <span className="text-sm text-slate-500">
                            Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg hover:bg-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                .reduce((acc, p, idx, arr) => {
                                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                                    acc.push(p);
                                    return acc;
                                }, [])
                                .map((p, idx) =>
                                    p === '...' ? (
                                        <span key={`ellipsis-${idx}`} className="px-2 text-slate-400 text-sm">…</span>
                                    ) : (
                                        <button
                                            key={p}
                                            onClick={() => setCurrentPage(p)}
                                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                                                currentPage === p
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'hover:bg-slate-200 text-slate-600'
                                            }`}
                                        >
                                            {p}
                                        </button>
                                    )
                                )
                            }
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg hover:bg-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
