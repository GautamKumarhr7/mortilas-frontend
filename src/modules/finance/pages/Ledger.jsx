import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { setActiveModule } from '../../../store/slices/uiSlice';
import {
    Landmark, ChevronLeft, ChevronRight, RefreshCw, AlertCircle,
    ArrowDownLeft, ArrowUpRight, Calendar, Hash, FileText, Search
} from 'lucide-react';
import { bankAPI } from '../services';
import { voucherAPI } from '../voucherService';

const PAGE_SIZE = 10;

const VOUCHER_TYPE_SIDE = {
    receipt:  'credit',   // money IN
    sales:    'credit',   // money IN
    payment:  'debit',    // money OUT
    purchase: 'debit',    // money OUT
    journal:  'neutral',
    contra:   'neutral',
};

function calcVoucherAmount(v, bankId) {
    // find the matching account entry to get the exact amount for this bank
    const accounts = Array.isArray(v.accountIds) ? v.accountIds : [];
    const match = accounts.find(a => String(a.id) === String(bankId));
    return Number(match?.amount ?? 0);
}

export default function Ledger() {
    const dispatch = useDispatch();

    const [banks, setBanks]               = useState([]);
    const [loadingBanks, setLoadingBanks] = useState(true);
    const [selectedBank, setSelectedBank] = useState('');
    const [selectedBankInfo, setSelectedBankInfo] = useState(null);

    const [entries, setEntries]         = useState([]);
    const [total, setTotal]             = useState(0);
    const [totalPages, setTotalPages]   = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading]         = useState(false);
    const [error, setError]             = useState(null);

    const [search, setSearch]           = useState('');

    // Load bank accounts
    useEffect(() => {
        const fetchBanks = async () => {
            setLoadingBanks(true);
            try {
                const res = await bankAPI.getAllBanks();
                const list = res?.data ?? [];
                setBanks(list);
            } catch {
                setBanks([]);
            } finally {
                setLoadingBanks(false);
            }
        };
        fetchBanks();
    }, []);

    // Sync selected bank info
    useEffect(() => {
        if (selectedBank) {
            const info = banks.find(b => String(b.id) === String(selectedBank));
            setSelectedBankInfo(info ?? null);
        } else {
            setSelectedBankInfo(null);
        }
    }, [selectedBank, banks]);

    const fetchLedger = useCallback(async (bankId, page) => {
        if (!bankId) return;
        setLoading(true);
        setError(null);
        try {
            const res = await voucherAPI.getLedger(bankId, page, PAGE_SIZE);
            setEntries(res?.data ?? []);
            setTotal(res?.total ?? 0);
            setTotalPages(res?.totalPages ?? 1);
        } catch (err) {
            console.error(err);
            setError('Failed to load ledger entries.');
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch whenever bank or page changes
    useEffect(() => {
        if (selectedBank) {
            fetchLedger(selectedBank, currentPage);
        } else {
            setEntries([]);
            setTotal(0);
            setTotalPages(1);
        }
    }, [selectedBank, currentPage, fetchLedger]);

    const handleBankChange = (e) => {
        setSelectedBank(e.target.value);
        setCurrentPage(1);
    };

    const formatDate = (iso) => {
        if (!iso) return '-';
        return new Date(iso).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    // Filter by narration / invoice id client-side on current page
    const filtered = entries.filter(v => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            (v.narration  && v.narration.toLowerCase().includes(q)) ||
            (v.invoiceId  && v.invoiceId.toLowerCase().includes(q)) ||
            (v.buyer      && v.buyer.toLowerCase().includes(q))     ||
            (v.seller     && v.seller.toLowerCase().includes(q))    ||
            (v.type       && v.type.toLowerCase().includes(q))
        );
    });

    // Running balance & totals
    let runningBalance = Number(selectedBankInfo?.openingBalance ?? 0);
    let totalCredit = 0;
    let totalDebit  = 0;

    const rows = filtered.map(v => {
        const amount = calcVoucherAmount(v, selectedBank);
        const side   = VOUCHER_TYPE_SIDE[v.type] ?? 'neutral';
        let credit = 0, debit = 0;
        if (side === 'credit') { credit = amount; runningBalance += amount; totalCredit += amount; }
        else if (side === 'debit') { debit = amount; runningBalance -= amount; totalDebit += amount; }
        return { ...v, credit, debit, balance: runningBalance };
    });

    const fmt = (n) => Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Bank Ledger</h1>
                    <p className="text-slate-500 text-sm mt-1">View credit & debit entries per bank account</p>
                </div>
                <button
                    onClick={() => dispatch(setActiveModule('vouchers'))}
                    className="btn-secondary flex items-center gap-2"
                >
                    <FileText className="w-4 h-4" /> Vouchers
                </button>
            </div>

            {/* Bank Selector Card */}
            <div className="card p-6 space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Select Bank Account
                    </label>
                    {loadingBanks ? (
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                            <RefreshCw className="w-4 h-4 animate-spin" /> Loading banks...
                        </div>
                    ) : (
                        <div className="relative">
                            <Landmark className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <select
                                value={selectedBank}
                                onChange={handleBankChange}
                                className="input pl-10 w-full"
                            >
                                <option value="">-- Choose a bank account --</option>
                                {banks.map(b => (
                                    <option key={b.id} value={b.id}>
                                        {b.bankName} — {b.accountNo} ({b.accountHolder})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Bank Info Pills + Credit/Debit totals */}
                {selectedBankInfo && (
                    <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
                        <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full font-medium">
                            IFSC: {selectedBankInfo.ifscCode}
                        </span>
                        <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                            selectedBankInfo.status === 'ACTIVE'
                                ? 'bg-green-50 text-green-700'
                                : 'bg-red-50 text-red-700'
                        }`}>
                            {selectedBankInfo.status}
                        </span>
                        {!loading && entries.length > 0 && (
                            <>
                                <span className="ml-auto flex items-center gap-1.5 text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                                    <ArrowDownLeft className="w-3.5 h-3.5" />
                                    Credit: ₹ {fmt(totalCredit)}
                                </span>
                                <span className="flex items-center gap-1.5 text-sm font-semibold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-full">
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                    Debit: ₹ {fmt(totalDebit)}
                                </span>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Ledger Table */}
            {selectedBank && (
                <div className="card overflow-hidden">
                    {/* Table Header / Search */}
                    <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <h3 className="font-semibold text-slate-800">
                            Ledger Entries
                            {!loading && <span className="ml-2 text-sm font-normal text-slate-500">({total} total)</span>}
                        </h3>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-56">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search entries..."
                                    className="input pl-9 w-full bg-white"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={() => fetchLedger(selectedBank, currentPage)}
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
                                    <th className="py-3 px-4 text-left font-semibold w-12">#</th>
                                    <th className="py-3 px-4 text-left font-semibold">Date</th>
                                    <th className="py-3 px-4 text-left font-semibold">Type</th>
                                    <th className="py-3 px-4 text-left font-semibold">Invoice / Ref</th>
                                    <th className="py-3 px-4 text-left font-semibold">Narration</th>
                                    <th className="py-3 px-4 text-right font-semibold text-emerald-700">Credit (₹)</th>
                                    <th className="py-3 px-4 text-right font-semibold text-rose-700">Debit (₹)</th>
                                    <th className="py-3 px-4 text-right font-semibold">Balance (₹)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="8" className="py-14 text-center text-slate-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <RefreshCw className="w-6 h-6 animate-spin" />
                                                <span>Loading ledger...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : error ? (
                                    <tr>
                                        <td colSpan="8" className="py-14 text-center text-red-500">
                                            <div className="flex flex-col items-center gap-2">
                                                <AlertCircle className="w-6 h-6" />
                                                <span>{error}</span>
                                                <button onClick={() => fetchLedger(selectedBank, currentPage)} className="text-sm underline text-slate-500 mt-1">Retry</button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : rows.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="py-14 text-center text-slate-400">
                                            No ledger entries found for this bank account.
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map((v, idx) => {
                                        const rowNum = (currentPage - 1) * PAGE_SIZE + idx + 1;
                                        return (
                                            <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                                                <td className="py-3 px-4 text-slate-400 font-medium text-xs">{rowNum}</td>
                                                <td className="py-3 px-4 text-slate-600">
                                                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                        {formatDate(v.entrydate)}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize
                                                        ${v.type === 'receipt' || v.type === 'sales'
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : v.type === 'payment' || v.type === 'purchase'
                                                            ? 'bg-rose-100 text-rose-700'
                                                            : 'bg-slate-100 text-slate-700'
                                                        }`}>
                                                        {v.credit > 0
                                                            ? <ArrowDownLeft className="w-3 h-3" />
                                                            : v.debit > 0
                                                            ? <ArrowUpRight className="w-3 h-3" />
                                                            : null
                                                        }
                                                        {v.type}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 font-mono text-xs text-slate-600">
                                                    {v.invoiceId ? (
                                                        <span className="flex items-center gap-1">
                                                            <Hash className="w-3 h-3 text-slate-400" />{v.invoiceId}
                                                        </span>
                                                    ) : <span className="text-slate-300">—</span>}
                                                </td>
                                                <td className="py-3 px-4 text-slate-500 max-w-[200px]">
                                                    <p className="truncate">{v.narration || <span className="text-slate-300">—</span>}</p>
                                                </td>
                                                <td className="py-3 px-4 text-right font-semibold">
                                                    {v.credit > 0
                                                        ? <span className="text-emerald-600">{fmt(v.credit)}</span>
                                                        : <span className="text-slate-300">—</span>
                                                    }
                                                </td>
                                                <td className="py-3 px-4 text-right font-semibold">
                                                    {v.debit > 0
                                                        ? <span className="text-rose-600">{fmt(v.debit)}</span>
                                                        : <span className="text-slate-300">—</span>
                                                    }
                                                </td>
                                                <td className="py-3 px-4 text-right font-bold text-slate-800">
                                                    {fmt(v.balance)}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                            {/* Footer totals */}
                            {!loading && rows.length > 0 && (
                                <tfoot className="bg-slate-50/80 border-t-2 border-slate-200">
                                    <tr>
                                        <td colSpan="5" className="py-4 px-4 text-right font-semibold text-slate-700">
                                            Page Totals:
                                        </td>
                                        <td className="py-4 px-4 text-right font-bold text-emerald-600">
                                            {fmt(totalCredit)}
                                        </td>
                                        <td className="py-4 px-4 text-right font-bold text-rose-600">
                                            {fmt(totalDebit)}
                                        </td>
                                        <td className="py-4 px-4 text-right font-bold text-slate-800">
                                            {fmt(totalCredit - totalDebit)}
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>

                    {/* Pagination */}
                    {!loading && !error && totalPages > 1 && (
                        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
                            <span className="text-sm text-slate-500">
                                Page {currentPage} of {totalPages} — {total} entries
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
                                            <span key={`e-${idx}`} className="px-2 text-slate-400 text-sm">…</span>
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
            )}

            {/* Empty prompt */}
            {!selectedBank && !loadingBanks && (
                <div className="card p-12 text-center">
                    <Landmark className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Select a bank account above to view its ledger</p>
                    <p className="text-sm text-slate-400 mt-1">All credit and debit vouchers will appear here</p>
                </div>
            )}
        </div>
    );
}
