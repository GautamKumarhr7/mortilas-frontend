import { useState, useEffect } from 'react';
import { 
    Search, Plus, Download, CheckCircle2, Clock, FileText, 
    TrendingUp, X, Edit2, Trash2, Eye, Save, Loader2,
    Calendar, Building2, Minus
} from 'lucide-react';
import { useApp } from '../../../hooks/useApp';
import toast from 'react-hot-toast';
import Skeleton from '../../../components/common/Skeleton';
import { invoiceAPI } from '../services';
import { projectAPI, clientAPI, inventoryAPI } from '../../projects/services';
import { vendorAPI } from '../../business/services';

const statusBadge = {
    'Paid': 'badge-green',
    'Pending': 'badge-yellow',
    'Overdue': 'badge-red',
    'Approved': 'badge-blue',
};

const MORTLIES_DETAILS = {
    name: 'Morlatis Pvt. Ltd.',
    address: 'Patna, Bihar',
    gstin: 'XXXXX' // Placeholder
};

export default function Invoicing() {
    const { setActiveModule, setSelectedInvoice } = useApp();
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('All');
    const [invoices, setInvoices] = useState([]);
    
    // Dropdown Data
    const [projects, setProjects] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [clients, setClients] = useState([]);
    const [inventories, setInventories] = useState([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, name: '' });

    const [formData, setFormData] = useState({
        invoiceType: 'Buyer Invoice',
        buyerName: '',
        sellerName: '',
        projectId: '',
        vendorId: '', // For Buyer Invoice
        clientId: '', // For Seller Invoice
        issueDate: new Date().toISOString().split('T')[0],
        gst: 18,
        retention: 5,
        totalAmount: '',
        status: 'Pending',
        items: []
    });

    const fetchData = async () => {
        try {
            const [pRes, vRes, cRes, iRes] = await Promise.all([
                projectAPI.getAllProjects(),
                vendorAPI.getAllVendors(),
                clientAPI.getAllClients(),
                inventoryAPI.getAllInventories()
            ]);

            // Debug: log raw responses to console
            console.log('[Invoice] projectAPI raw response:', pRes);
            console.log('[Invoice] vendorAPI raw response:', vRes);

            // Projects: projectAPI returns full axios response { data: { success, data: [...] } }
            // Exhaustively extract the array regardless of nesting depth
            const pPayload = pRes?.data;   // { success, data: [...] }
            let pRaw;
            if (Array.isArray(pPayload)) {
                pRaw = pPayload;
            } else if (Array.isArray(pPayload?.data)) {
                pRaw = pPayload.data;
            } else if (Array.isArray(pPayload?.projects)) {
                pRaw = pPayload.projects;
            } else {
                pRaw = [];
            }
            setProjects(pRaw);
            console.log('[Invoice] projects:', pRaw.length, pRaw[0]);

            // Vendors: vendorAPI returns response.data already = { success, data: [...] }
            const vRaw = vRes?.data?.data || vRes?.data || vRes;
            setVendors(Array.isArray(vRaw) ? vRaw : []);

            // Clients: clientAPI returns response.data = { success, data: [...] }
            const cRaw = cRes?.data?.data || cRes?.data || cRes;
            setClients(Array.isArray(cRaw) ? cRaw : []);

            // Inventories
            const iRaw = iRes?.data?.data || iRes?.data || iRes;
            setInventories(Array.isArray(iRaw) ? iRaw : []);
        } catch (error) {
            console.error('Fetch metadata error:', error);
        }
    };

    const fetchInvoices = async () => {
        setIsLoading(true);
        try {
            const res = await invoiceAPI.getAllInvoices();
            const data = res?.invoices || res?.data || res || [];
            setInvoices(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('Failed to load invoices');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
        fetchData();
    }, []);

    const calculateTotal = (items, gstVal, retentionVal) => {
        const subTotal = items.reduce((acc, item) => acc + (Number(item.quantity || 0) * Number(item.rate || 0)), 0);
        const gstAmount = subTotal * (Number(gstVal) / 100);
        const retentionAmount = subTotal * (Number(retentionVal) / 100);
        return subTotal + gstAmount - retentionAmount;
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        const newTotal = calculateTotal(newItems, formData.gst, formData.retention);
        setFormData({ ...formData, items: newItems, totalAmount: newTotal });
    };

    const handleGstRetentionChange = (field, value) => {
        const newTotal = calculateTotal(formData.items, field === 'gst' ? value : formData.gst, field === 'retention' ? value : formData.retention);
        setFormData({ ...formData, [field]: value, totalAmount: newTotal });
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { description: '', quantity: 1, rate: 0 }]
        });
    };

    const removeItem = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        const newTotal = calculateTotal(newItems, formData.gst, formData.retention);
        setFormData({ ...formData, items: newItems, totalAmount: newTotal });
    };

    const handleDelete = (inv) => {
        setDeleteConfirm({ show: true, id: inv._id || inv.id, name: inv.invoiceId });
    };

    const confirmDelete = async () => {
        setIsSaving(true);
        try {
            await invoiceAPI.deleteInvoice(deleteConfirm.id);
            toast.success('Invoice deleted');
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
        ((inv.buyerName || '').toLowerCase().includes(search.toLowerCase()) || 
         (inv.invoiceId || '').toLowerCase().includes(search.toLowerCase())) &&
        (filter === 'All' || (inv.status || 'Pending') === filter)
    );

    const handleOpenAdd = () => {
        setEditingId(null);
        setFormData({
            invoiceType: 'Buyer Invoice',
            buyerName: MORTLIES_DETAILS.name, // Auto-filled for Buyer Invoice
            sellerName: '',
            projectId: '',
            vendorId: '',
            clientId: '',
            issueDate: new Date().toISOString().split('T')[0],
            gst: 18,
            retention: 5,
            totalAmount: '',
            status: 'Pending',
            items: []
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (e, inv) => {
        e.stopPropagation();
        setEditingId(inv._id || inv.id);
        const issueDate = inv.issueDate ? new Date(inv.issueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        setFormData({
            invoiceType: inv.buyerName === MORTLIES_DETAILS.name ? 'Buyer Invoice' : 'Seller Invoice',
            buyerName: inv.buyerName || '',
            sellerName: inv.sellerName || '',
            projectId: inv.projectId || '',
            vendorId: inv.vendorId || '',
            clientId: '', // Add mapping if you store client id
            totalAmount: inv.totalAmount || '',
            issueDate: issueDate,
            gst: inv.gst || 18,
            retention: inv.retention || 5,
            status: inv.status || 'Pending',
            items: Array.isArray(inv.items) ? inv.items : []
        });
        setIsModalOpen(true);
    };

    const handleInvoiceTypeChange = (type) => {
        if (type === 'Buyer Invoice') {
            setFormData({
                ...formData,
                invoiceType: type,
                buyerName: MORTLIES_DETAILS.name,
                sellerName: '',
                clientId: ''
            });
        } else {
            setFormData({
                ...formData,
                invoiceType: type,
                sellerName: MORTLIES_DETAILS.name,
                buyerName: '',
                vendorId: ''
            });
        }
    };

    const handleVendorSelect = (vendorId) => {
        // Each vendor item is { vendor: {...}, category: {...} }
        const item = vendors.find(v => (v.vendor?.id ?? v.id) === vendorId);
        const vendor = item?.vendor ?? item;
        setFormData({
            ...formData,
            vendorId,
            sellerName: vendor ? (vendor.companyName || vendor.vendorName || vendor.name || '') : ''
        });
    };

    const handleClientSelect = (clientId) => {
        const client = clients.find(c => String(c.id) === String(clientId));
        setFormData({
            ...formData,
            clientId,
            buyerName: client ? (client.clientName || client.name || '') : ''
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload = {
                ...formData,
                totalAmount: Number(formData.totalAmount),
                projectId: formData.projectId ? Number(formData.projectId) : null,
                vendorId: formData.vendorId ? Number(formData.vendorId) : null,
                gst: Number(formData.gst),
                retention: Number(formData.retention)
            };

            // Remove purely frontend UI state from payload if necessary
            delete payload.invoiceType;
            delete payload.clientId;

            if (editingId) {
                await invoiceAPI.updateInvoice(editingId, payload);
                toast.success('Invoice updated successfully');
            } else {
                await invoiceAPI.createInvoice(payload);
                toast.success('Invoice created');
            }
            fetchInvoices();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Failed to save invoice');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-5 animate-fade-in relative">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Invoices</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage invoices and items</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="btn-secondary hidden sm:flex items-center gap-2">
                        <Download className="w-4 h-4" /> Export
                    </button>
                    <button onClick={handleOpenAdd} className="btn-primary whitespace-nowrap flex items-center gap-1.5">
                        <Plus className="w-5 h-5" /> New Invoice
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Total Invoices', value: invoices.length, color: 'text-amber-500', icon: Clock },
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
                    <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Search buyer or ID..." className="input pl-9" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                {['Invoice ID', 'Buyer / Seller', 'Date', 'GST / Ret', 'Amount', 'Actions'].map(h => (
                                    <th key={h} className="table-header whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="table-row">
                                        <td className="table-cell"><Skeleton variant="text" className="w-20" /></td>
                                        <td className="table-cell"><Skeleton variant="text" className="w-32" /></td>
                                        <td className="table-cell"><Skeleton variant="text" /></td>
                                        <td className="table-cell"><Skeleton variant="text" /></td>
                                        <td className="table-cell"><Skeleton variant="text" /></td>
                                        <td className="table-cell text-right"><Skeleton variant="button" className="w-20 h-8" /></td>
                                    </tr>
                                ))
                            ) : filteredInvoices.map((inv) => (
                                <tr key={inv._id || inv.id} className="table-row hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => { setSelectedInvoice(inv); setActiveModule('invoice-detail'); }}>
                                    <td className="table-cell font-mono text-blue-500 text-xs font-semibold">{inv.invoiceId}</td>
                                    <td className="table-cell">
                                        <p className="text-slate-900 font-bold">{inv.buyerName}</p>
                                        <p className="text-slate-500 text-xs mt-0.5">Seller: {inv.sellerName}</p>
                                    </td>
                                    <td className="table-cell text-slate-500 text-[10px] font-bold uppercase whitespace-nowrap"><Calendar className="w-3 h-3 inline mr-1" />{inv.issueDate ? new Date(inv.issueDate).toLocaleDateString() : 'N/A'}</td>
                                    <td className="table-cell text-slate-600 font-medium">GST: {inv.gst}%<br/>Ret: {inv.retention}%</td>
                                    <td className="table-cell">
                                        <p className="text-emerald-600 font-bold tracking-tight text-sm">₹{Number(inv.totalAmount).toLocaleString()}</p>
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
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-[#1e3a34] text-white">
                            <div>
                                <h2 className="text-base font-semibold">{editingId ? 'Edit Invoice' : 'Create Invoice'}</h2>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                            {!editingId && (
                                <div className="space-y-3">
                                    <label className="text-xs font-semibold text-slate-600">Invoice Type</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="radio" 
                                                name="invoiceType" 
                                                checked={formData.invoiceType === 'Buyer Invoice'}
                                                onChange={() => handleInvoiceTypeChange('Buyer Invoice')}
                                                className="w-4 h-4 text-[#1e3a34] focus:ring-[#1e3a34]" 
                                            />
                                            <span className="text-sm font-medium text-slate-700">Buyer Invoice</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="radio" 
                                                name="invoiceType" 
                                                checked={formData.invoiceType === 'Seller Invoice'}
                                                onChange={() => handleInvoiceTypeChange('Seller Invoice')}
                                                className="w-4 h-4 text-[#1e3a34] focus:ring-[#1e3a34]" 
                                            />
                                            <span className="text-sm font-medium text-slate-700">Seller Invoice</span>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {editingId && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Invoice ID</label>
                                    <input readOnly value={formData.invoiceId} className="input bg-slate-50 cursor-not-allowed" />
                                </div>
                            )}

                            {/* Buyer and Seller Layout */}
                            <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                {/* Buyer Section */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">Buyer</h3>
                                    
                                    {formData.invoiceType === 'Buyer Invoice' ? (
                                        <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                                            <p className="font-bold text-slate-800">{MORTLIES_DETAILS.name}</p>
                                            <p className="text-xs text-slate-500">{MORTLIES_DETAILS.address}</p>
                                            <p className="text-xs text-slate-500">GSTIN: {MORTLIES_DETAILS.gstin}</p>
                                            <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-slate-400 uppercase">
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> 🔒 Auto-filled
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-slate-600">Select Customer / Client</label>
                                                <select 
                                                    required 
                                                    className="input bg-white"
                                                    value={formData.clientId}
                                                    onChange={(e) => handleClientSelect(e.target.value)}
                                                >
                                                    <option value="">Choose a customer...</option>
                                                    {clients.map(c => (
                                                        <option key={c.id} value={c.id}>{c.clientName || c.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            {/* We can potentially show customer details here if selected */}
                                            {formData.buyerName && (
                                                <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1 text-slate-500">
                                                    <p className="font-bold text-slate-800">{formData.buyerName}</p>
                                                    <p>Selected Customer Details</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Seller Section */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">Seller</h3>
                                    
                                    {formData.invoiceType === 'Seller Invoice' ? (
                                        <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                                            <p className="font-bold text-slate-800">{MORTLIES_DETAILS.name}</p>
                                            <p className="text-xs text-slate-500">{MORTLIES_DETAILS.address}</p>
                                            <p className="text-xs text-slate-500">GSTIN: {MORTLIES_DETAILS.gstin}</p>
                                            <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-slate-400 uppercase">
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> 🔒 Auto-filled
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-slate-600">Select Vendor</label>
                                                <select 
                                                    required 
                                                    className="input bg-white"
                                                    value={formData.vendorId}
                                                    onChange={(e) => handleVendorSelect(e.target.value)}
                                                >
                                                    <option value="">Choose a vendor...</option>
                                                    {vendors.map((v, idx) => {
                                                        const vd = v.vendor ?? v;
                                                        return (
                                                            <option key={vd.id ?? idx} value={vd.id}>
                                                                {vd.companyName || vd.vendorName || vd.name || `Vendor ${idx + 1}`}
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                            </div>
                                            {formData.sellerName && (
                                                <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1 text-slate-500">
                                                    <p className="font-bold text-slate-800">{formData.sellerName}</p>
                                                    <p>Selected Vendor Details</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Issue Date *</label>
                                    <input required type="date" value={formData.issueDate} onChange={e => setFormData({...formData, issueDate: e.target.value})} className="input" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Project (Optional)</label>
                                    <select 
                                        className="input"
                                        value={formData.projectId}
                                        onChange={(e) => setFormData({...formData, projectId: e.target.value})}
                                    >
                                        <option value="">Select Project</option>
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>{p.name || p.projectName} (PJ-{p.id})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-semibold text-slate-600">Items / Materials</label>
                                    <button type="button" onClick={addItem} className="text-xs font-bold flex items-center gap-1 text-blue-600 hover:text-blue-800 px-3 py-1.5 bg-blue-50 rounded-lg">
                                        <Plus className="w-3 h-3" /> Add Item
                                    </button>
                                </div>
                                
                                {formData.items.length === 0 && (
                                    <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs">
                                        No items added yet. Click 'Add Item' to insert rows.
                                    </div>
                                )}

                                {formData.items.map((item, index) => (
                                    <div key={index} className="flex gap-3 mb-3 items-start bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <div className="flex-1 space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Material / Description</label>
                                            <select 
                                                className="input bg-white text-sm"
                                                value={item.description}
                                                onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                            >
                                                <option value="">Select Material...</option>
                                                {inventories.map(inv => (
                                                    <option key={inv.id} value={inv.itemName || inv.name}>{inv.itemName || inv.name}</option>
                                                ))}
                                                <option value="Other">Other (Custom)</option>
                                            </select>
                                            {item.description === 'Other' && (
                                                <input 
                                                    className="input bg-white text-sm mt-1" 
                                                    placeholder="Specify custom description..." 
                                                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                                />
                                            )}
                                        </div>
                                        <div className="w-24 space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Qty</label>
                                            <input type="number" className="input bg-white text-sm" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} />
                                        </div>
                                        <div className="w-32 space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Rate (₹)</label>
                                            <input type="number" className="input bg-white text-sm" value={item.rate} onChange={(e) => handleItemChange(index, 'rate', e.target.value)} />
                                        </div>
                                        <div className="w-32 space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Total</label>
                                            <div className="h-10 flex items-center px-3 bg-slate-200/50 rounded-lg text-sm font-semibold text-slate-700">
                                                ₹ {Number(item.quantity || 0) * Number(item.rate || 0)}
                                            </div>
                                        </div>
                                        <div className="pt-5">
                                            <button type="button" onClick={() => removeItem(index)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"><Minus className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* GST & Retention inputs */}
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">GST (%)</label>
                                    <input required type="number" min="0" max="100" value={formData.gst} onChange={e => handleGstRetentionChange('gst', e.target.value)} className="input" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Retention (%)</label>
                                    <input required type="number" min="0" max="100" value={formData.retention} onChange={e => handleGstRetentionChange('retention', e.target.value)} className="input" />
                                </div>
                            </div>

                            {/* Live Calculation Breakdown */}
                            {(() => {
                                const subTotal = formData.items.reduce((acc, item) => acc + (Number(item.quantity || 0) * Number(item.rate || 0)), 0);
                                const gstAmt = subTotal * (Number(formData.gst) / 100);
                                const retAmt = subTotal * (Number(formData.retention) / 100);
                                const grandTotal = subTotal + gstAmt - retAmt;
                                return (
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
                                        <div className="px-4 py-2 bg-[#1e3a34]/5 border-b border-slate-200">
                                            <p className="text-[10px] font-black text-[#1e3a34] uppercase tracking-widest">Live Calculation</p>
                                        </div>
                                        <div className="p-4 space-y-2 text-sm">
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-500">Sub Total</span>
                                                <span className="font-semibold text-slate-800">₹ {subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-green-600">
                                                <span>+ GST ({formData.gst}%)</span>
                                                <span className="font-semibold">+ ₹ {gstAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-amber-600">
                                                <span>- Retention ({formData.retention}%)</span>
                                                <span className="font-semibold">- ₹ {retAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                                                <span className="font-black text-slate-800 text-base">Grand Total</span>
                                                <span className="font-black text-emerald-600 text-lg">₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600">Total Amount (₹) <span className="text-slate-400 font-normal">(auto-calculated, editable)</span></label>
                                <input required type="number" value={typeof formData.totalAmount === 'number' ? Number(formData.totalAmount.toFixed(2)) : formData.totalAmount} onChange={e => setFormData({...formData, totalAmount: e.target.value})} className="input" placeholder="0.00" />
                            </div>
                            
                            <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6 sticky bottom-0 bg-white pb-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-xs font-bold text-slate-400 hover:text-slate-600 tracking-widest uppercase">Discard</button>
                                <button type="submit" disabled={isSaving} className="btn-primary flex-1 h-12 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />)}
                                    {editingId ? 'Update Invoice' : 'Generate Invoice'}
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
                                <h3 className="text-lg font-black text-slate-800 tracking-tight">Delete Invoice?</h3>
                            </div>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed mb-8">
                            Are you sure you want to delete <span className="font-black text-slate-900 underline decoration-red-200">{deleteConfirm.name}</span>?
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
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete Record"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
