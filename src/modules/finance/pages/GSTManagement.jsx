import React, { useState, useEffect } from 'react';
import { Search, Download, RefreshCw, ArrowRight, CheckCircle2, Clock, FileText, AlertCircle, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Skeleton from '../../../components/common/Skeleton';

const MOCK_GST_RETURNS = [];

export default function GSTManagement() {
    const [tab, setTab] = useState('returns');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 900);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="space-y-5 animate-fade-in relative">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">GST Management</h1>
                    <p className="text-slate-500 text-sm mt-1">Indirect tax & GST return compliance</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="btn-secondary hidden sm:flex items-center gap-2">
                        <Download className="w-4 h-4" /> Export Returns
                    </button>
                    <button onClick={() => setIsModalOpen(true)} className="btn-primary whitespace-nowrap flex items-center gap-1.5">
                        <RefreshCw className="w-4 h-4" /> Sync GSTN Portal
                    </button>
                </div>
            </div>

            {/* Alert Banner */}
            <div className="card p-4 border-l-4 border-amber-400 bg-amber-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 animate-pulse" />
                    <div>
                        <p className="text-sm font-semibold text-slate-800">GSTR-3B Pending Filing</p>
                        <p className="text-xs text-slate-500">The return for <span className="font-semibold">February 2025</span> is due in 4 days. Net Tax: ₹86,100</p>
                    </div>
                </div>
                <button className="btn-primary whitespace-nowrap flex items-center gap-1.5 text-xs">
                    Proceed to Filing <ArrowRight className="w-4 h-4" />
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Outward Liability', value: '₹2.84 L', color: 'text-amber-500' },
                    { label: 'ITC Available', value: '₹1.98 L', color: 'text-green-500' },
                    { label: 'Net GST Due', value: '₹86.1 K', color: 'text-red-500' },
                    { label: 'Portal Credit', value: '₹12.5 K', color: 'text-blue-500' },
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
                    <div className="flex gap-1">
                        {['returns', 'invoices', 'itcreco'].map(t => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                                    tab === t ? 'bg-[#2f6645] text-white' : 'text-slate-500 hover:bg-slate-100'
                                }`}
                            >
                                {t === 'itcreco' ? 'ITC Reco' : t.charAt(0).toUpperCase() + t.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    {tab === 'returns' ? (
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    {['Tax Period', 'Due Date', 'GSTR-1', 'GSTR-3B', 'Liability', 'ITC', 'Net GST', 'Actions'].map(h => (
                                        <th key={h} className="table-header whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                             <tbody>
                                {isLoading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <tr key={i} className="table-row">
                                            <td className="table-cell"><Skeleton variant="text" className="w-20" /></td>
                                            <td className="table-cell"><Skeleton variant="text" /></td>
                                            <td className="table-cell"><Skeleton variant="badge" /></td>
                                            <td className="table-cell"><Skeleton variant="badge" /></td>
                                            <td className="table-cell"><Skeleton variant="text" /></td>
                                            <td className="table-cell"><Skeleton variant="text" /></td>
                                            <td className="table-cell"><Skeleton variant="text" /></td>
                                            <td className="table-cell"><Skeleton variant="button" className="w-16 h-8" /></td>
                                        </tr>
                                    ))
                                ) : MOCK_GST_RETURNS.length === 0 ? (
                                    <tr><td colSpan="8" className="p-8 text-center text-slate-400">No GST returns found.</td></tr>
                                ) : MOCK_GST_RETURNS.map((row, i) => (
                                    <tr key={i} className="table-row hover:bg-slate-50 transition-colors">
                                        <td className="table-cell font-semibold text-slate-900">{row.period}</td>
                                        <td className="table-cell text-slate-500 text-xs">{row.dueDate}</td>
                                        <td className="table-cell">
                                            <span className={`badge ${row.gstr1 === 'Filed' ? 'badge-green' : 'badge-yellow'}`}>{row.gstr1}</span>
                                        </td>
                                        <td className="table-cell">
                                            <span className={`badge ${row.gstr3b === 'Filed' ? 'badge-green' : 'badge-yellow'}`}>{row.gstr3b}</span>
                                        </td>
                                        <td className="table-cell text-red-600 font-medium">₹{(row.liability / 1000).toFixed(1)}K</td>
                                        <td className="table-cell text-emerald-600 font-medium">₹{(row.itc / 1000).toFixed(1)}K</td>
                                        <td className="table-cell text-slate-900 font-semibold">₹{(row.net / 1000).toFixed(1)}K</td>
                                        <td className="table-cell">
                                            <button className="text-blue-600 hover:text-blue-800 font-medium text-xs">Download</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-8 text-center text-slate-500">Select another tab to view details.</div>
                    )}
                </div>
            </div>

            {/* Sync Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-[#1e3a34] text-white">
                            <div>
                                <h2 className="text-base font-semibold">Sync GSTN Portal</h2>
                                <p className="text-xs text-white/60 mt-0.5">Automated synchronization</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <form className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                            <div className="space-y-1.5 flex flex-col items-center">
                                <RefreshCw className="w-12 h-12 text-slate-300 animate-spin mb-2" />
                                <p className="text-sm text-slate-600 text-center font-medium">Establishing secure connection to GSTN servers...</p>
                                <p className="text-xs text-slate-400 text-center">This may take a few moments to fetch all B2B and B2C invoices.</p>
                            </div>
                            
                            <div className="pt-4 flex flex-col gap-2 mt-4">
                                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <span className="text-xs text-slate-500">API Status</span>
                                    <span className="badge badge-green">Connected</span>
                                </div>
                                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <span className="text-xs text-slate-500">Last Synced</span>
                                    <span className="text-xs font-semibold text-slate-700">Today, 10:24 AM</span>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
                                <button type="button" onClick={() => {
                                    setIsModalOpen(false);
                                    toast.success('GSTN Portal synchronized successfully');
                                }} className="btn-primary flex-1">Force Manual Sync</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
