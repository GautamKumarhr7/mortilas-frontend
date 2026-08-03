import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Info, AlertCircle, RefreshCw, Download, Plus, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { materialReconciliationAPI } from '../services';
import Skeleton from '../../../components/common/Skeleton';

const subcontractors = ['JANKI ENTERPRISES', 'GSAR', 'JGD', 'JYESTHI CONS.', 'DARPAN POWER', 'DILIP KUMAR'];

function getStatus(diff, poQty) {
    if (diff < 0) return { label: 'Over Issued', color: 'text-red-400 bg-red-500/10 border-red-500/20', dot: 'bg-red-500', badge: 'badge-red' };
    if (diff === 0) return { label: 'Reconciled', color: 'text-green-400 bg-green-500/10 border-green-500/20', dot: 'bg-green-500', badge: 'badge-green' };
    const pct = poQty > 0 ? (diff / poQty) * 100 : 0;
    if (pct <= 2) return { label: 'Reconciled', color: 'text-green-400 bg-green-500/10 border-green-500/20', dot: 'bg-green-500', badge: 'badge-green' };
    if (pct <= 5) return { label: 'Minor Variance', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', dot: 'bg-yellow-500', badge: 'badge-yellow' };
    return { label: 'Under Utilized', color: 'text-blue-400 bg-blue-500/10 border-green-100', dot: 'bg-blue-500', badge: 'badge-blue' };
}

export default function MaterialReconciliation() {
    const [reconciliationData, setReconciliationData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [tab, setTab] = useState('summary');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        billCode: '', description: '', unit: '', contRate: '', subRate: '', poQty: '', billedQty: '', status: 'pending'
    });

    useEffect(() => {
        fetchReconciliations();
    }, []);

    const fetchReconciliations = async () => {
        setIsLoading(true);
        try {
            const res = await materialReconciliationAPI.getAllMaterialReconciliations();
            // User provided: { "materialReconciliations": [...] }
            const data = res?.materialReconciliations || res?.reconciliations || (Array.isArray(res) ? res : (res?.data || []));
            setReconciliationData(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to sync reconciliations');
        } finally {
            setIsLoading(false);
        }
    };

    const criticalItems = reconciliationData.filter(r => r.diff < 0 || (r.poQty > 0 && Math.abs(r.diff / r.poQty) * 100 > 5));

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubcontractorChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            subVals: { ...(prev.subVals || {}), [name]: parseFloat(value || 0) }
        }));
    };

    const handleRecordIssuance = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const poQty = parseFloat(formData.poQty || 0);
            const subVals = formData.subVals || {};
            const billedQty = Object.values(subVals).reduce((a, b) => a + b, 0);
            const contRate = parseFloat(formData.contRate || 0);
            const subRate = parseFloat(formData.subRate || 0);
            
            const payload = {
                billCode: formData.billCode || `BC-${Date.now().toString().slice(-4)}`,
                description: formData.description,
                unit: formData.unit,
                contRate: contRate,
                subRate: subRate,
                poQty: poQty,
                billedQty: billedQty,
                contTotal: billedQty, // Based on the code logic (contractor total is billed qty)
                diffQty: poQty - billedQty,
                diffValue: (poQty - billedQty) * contRate,
                status: "pending",
                // subVals can be stored if the backend supports extra fields, 
                // but let's stick to the requested body first
            };
            
            await materialReconciliationAPI.createMaterialReconciliation(payload);
            toast.success('Material issuance recorded and reconciled');
            setIsModalOpen(false);
            setFormData({ billCode: '', description: '', unit: '', contRate: '', subRate: '', poQty: '', billedQty: '', status: 'pending' });
            fetchReconciliations();
        } catch (error) {
            console.error(error);
            toast.error('Failed to record issuance');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-5 animate-fade-in relative">
            {/* Critical Alerts Banner */}
            {criticalItems.length > 0 && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-red-600 font-semibold text-sm">{criticalItems.length} Critical Material Variance{criticalItems.length > 1 ? 's' : ''} Detected</p>
                        <p className="text-red-500/80 text-xs mt-1">
                            {criticalItems.map(r => `Bill Code ${r.code}`).join(', ')} — immediate reconciliation required
                        </p>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
                {[
                    { id: 'summary', label: 'Sterling vs Contractor' },
                    { id: 'subcontractor', label: 'Subcontractor-Wise' },
                    { id: 'balance', label: 'Material Balance' },
                ].map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end flex-wrap">
                <button className="btn-secondary whitespace-nowrap"><RefreshCw className="w-4 h-4 mr-1" /> Sync RA Bills</button>
                <button className="btn-secondary whitespace-nowrap"><Download className="w-4 h-4 mr-1" /> Export Excel</button>
                <button onClick={() => setIsModalOpen(true)} className="btn-primary whitespace-nowrap flex items-center gap-1.5"><Plus className="w-4 h-4" /> Record Issuance</button>
            </div>

            {/* SUMMARY TAB */}
            {tab === 'summary' && (
                <div className="card overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                        <h3 className="section-title">Sterling vs Contractor Summary – SWPL-BRGF</h3>
                        <span className="text-slate-500 text-xs font-medium">RA Bill No: RA-05 (Latest)</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    {['Bill Code', 'Description', 'Unit', 'Cont. Rate', 'Sub Rate', 'PO Qty', 'Billed Qty', 'Cont. Total', 'Diff Qty', 'Diff Value', 'Status'].map(h => (
                                        <th key={h} className="table-header whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <tr key={i} className="border-b border-slate-100">
                                            {Array.from({ length: 11 }).map((__, j) => (
                                                <td key={j} className="px-4 py-4"><Skeleton className="w-16" /></td>
                                            ))}
                                        </tr>
                                    ))
                                ) : reconciliationData.length === 0 ? (
                                    <tr><td colSpan="11" className="p-12 text-center text-slate-500 font-medium italic">No reconciliation data found. Syncing RA bills suggested.</td></tr>
                                ) : reconciliationData.map((row, i) => {
                                    const diffQty = row.diffQty ?? (row.poQty - row.billedQty);
                                    const status = getStatus(diffQty, row.poQty);
                                    const contRate = row.contRate || row.contractorRate || 0;

                                    return (
                                        <tr key={row.id || i} className={`table-row hover:bg-slate-50 transition-colors ${diffQty < 0 ? 'bg-red-500/5 hover:bg-red-500/10' : ''}`}>
                                            <td className="table-cell font-mono font-bold text-blue-500">{row.billCode || row.code}</td>
                                            <td className="table-cell max-w-[200px]">
                                                <p className="text-slate-900 leading-snug truncate" title={row.description}>{row.description}</p>
                                            </td>
                                            <td className="table-cell text-slate-500">{row.unit}</td>
                                            <td className="table-cell text-emerald-600 font-semibold">₹{contRate.toLocaleString()}</td>
                                            <td className="table-cell text-slate-500">₹{(row.subRate || 0).toLocaleString()}</td>
                                            <td className="table-cell text-slate-900 font-bold">{row.poQty}</td>
                                            <td className="table-cell text-slate-700">{row.billedQty}</td>
                                            <td className="table-cell text-slate-700">{row.contTotal || row.contractorTotal}</td>
                                            <td className={`table-cell font-bold text-sm ${diffQty < 0 ? 'text-red-500' : diffQty === 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                {diffQty > 0 ? '+' : ''}{diffQty.toFixed(2)}
                                            </td>
                                            <td className={`table-cell font-semibold ${diffQty < 0 ? 'text-red-500' : 'text-slate-500'}`}>
                                                {diffQty !== 0 ? `₹${Math.abs(Math.round(diffQty * contRate)).toLocaleString()}` : '₹0'}
                                            </td>
                                            <td className="table-cell">
                                                <span className={`badge ${status.badge}`}>{status.label}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* SUBCONTRACTOR TAB */}
            {tab === 'subcontractor' && (
                <div className="card overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
                        <h3 className="section-title">Subcontractor-Wise Material Distribution</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="table-header">Bill Code</th>
                                    <th className="table-header">Description</th>
                                    <th className="table-header">Unit</th>
                                    {subcontractors.map(s => (
                                        <th key={s} className="table-header text-center whitespace-nowrap">{s.split(' ')[0]}</th>
                                    ))}
                                    <th className="table-header">Total</th>
                                    <th className="table-header">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reconciliationData.map((row, i) => {
                                    const status = getStatus(row.diff, row.poQty);
                                    return (
                                        <tr key={i} className="table-row hover:bg-slate-50 transition-colors">
                                            <td className="table-cell font-mono font-bold text-blue-500">{row.code}</td>
                                            <td className="table-cell text-slate-900 max-w-[200px] truncate">{row.description}</td>
                                            <td className="table-cell text-slate-500">{row.unit}</td>
                                            {subcontractors.map(s => (
                                                <td key={s} className={`table-cell text-center font-semibold ${(row.subcontractors?.[s] || 0) > 0 ? 'text-slate-900' : 'text-slate-400'}`}>
                                                    {row.subcontractors?.[s] || '0'}
                                                </td>
                                            ))}
                                            <td className="table-cell text-slate-900 font-bold">{row.contractorTotal}</td>
                                            <td className="table-cell">
                                                <span className={`badge ${status.badge}`}>{status.label}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* BALANCE TAB */}
            {tab === 'balance' && (
                <div className="card overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
                        <h3 className="section-title">Material Balance Statement</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    {['Item', 'Unit', 'PO Qty', 'Issued to Site', 'Consumed (RA)', 'Balance – Store', 'Balance – Site', 'Variance', 'Status'].map(h => (
                                        <th key={h} className="table-header whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {reconciliationData.map((row, i) => {
                                    const issued = Number(row.poQty || 0);
                                    const consumed = Number(row.billedQty || row.contractorTotal || 0);
                                    const balance = issued - consumed;
                                    const storeBalance = Math.max(0, balance * 0.4);
                                    const siteBalance = Math.max(0, balance * 0.6);
                                    const diffQty = Number(row.diffQty ?? row.diff ?? balance);
                                    const status = getStatus(diffQty, row.poQty);
                                    
                                    return (
                                        <tr key={row.id || i} className="table-row hover:bg-slate-50 transition-colors">
                                            <td className="table-cell text-slate-900 max-w-[200px] truncate" title={row.description}>{row.description}</td>
                                            <td className="table-cell text-slate-500 font-bold uppercase text-[10px]">{row.unit}</td>
                                            <td className="table-cell text-slate-900 font-bold">{issued}</td>
                                            <td className="table-cell text-blue-500 font-medium">{issued}</td>
                                            <td className="table-cell text-orange-500 font-medium">{consumed}</td>
                                            <td className="table-cell text-emerald-500 font-medium">{storeBalance.toFixed(2)}</td>
                                            <td className="table-cell text-cyan-500 font-medium">{siteBalance.toFixed(2)}</td>
                                            <td className={`table-cell font-bold ${diffQty < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                {diffQty > 0 ? '+' : ''}{diffQty.toFixed(2)}
                                            </td>
                                            <td className="table-cell">
                                                <span className={`badge ${status.badge}`}>{status.label}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Record Issuance Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Plus className="w-5 h-5 text-brand" /> Record Material Issuance
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleRecordIssuance} className="flex-1 overflow-y-auto p-6 space-y-6">
                            
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Material Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="text-sm font-medium text-slate-700">Item Description <span className="text-red-500">*</span></label>
                                        <input required name="description" value={formData.description || ''} onChange={handleInputChange} className="input w-full" placeholder="e.g. PSC Pole 8 Mtr 200 Kg" />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Bill Code <span className="text-red-500">*</span></label>
                                        <input required name="billCode" value={formData.billCode || ''} onChange={handleInputChange} className="input w-full font-mono" placeholder="e.g. Bill-1020" />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Unit <span className="text-red-500">*</span></label>
                                        <input required name="unit" value={formData.unit || ''} onChange={handleInputChange} className="input w-full" placeholder="e.g. No, Set, CKM" />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Contractor Rate (₹) <span className="text-red-500">*</span></label>
                                        <input required type="number" step="0.01" name="contRate" value={formData.contRate || ''} onChange={handleInputChange} className="input w-full" placeholder="e.g. 6200" />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Sub Rate (₹)</label>
                                        <input type="number" step="0.01" name="subRate" value={formData.subRate || ''} onChange={handleInputChange} className="input w-full" placeholder="e.g. 5800" />
                                    </div>

                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="text-sm font-medium text-slate-700">Total Issued / PO Qty <span className="text-red-500">*</span></label>
                                        <input required type="number" step="0.01" name="poQty" value={formData.poQty || ''} onChange={handleInputChange} className="input w-full border-brand focus:ring-brand/20 bg-brand/5" placeholder="e.g. 10.5" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Subcontractor Allocation (Consumed Qty)</h3>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                    {subcontractors.map(sub => (
                                        <div key={sub} className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-600 truncate block" title={sub}>{sub}</label>
                                            <input 
                                                type="number" 
                                                step="0.01"
                                                className="input w-full text-sm" 
                                                placeholder="0.00"
                                                value={formData.subVals?.[sub] || ''}
                                                onChange={(e) => handleSubcontractorChange(sub, e.target.value)} 
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-white">
                                <button type="button" disabled={isSaving} onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={isSaving} className="btn-primary flex items-center gap-2">
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                    {isSaving ? 'Saving...' : 'Calculate & Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
