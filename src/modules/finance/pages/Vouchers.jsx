import { useState, useMemo, useEffect } from 'react';
import { STATE_OPTIONS, getCitiesForState } from '../../../utils/cityStateData';
import {
    FileText, Search, Plus, Filter, Download, MoreVertical,
    ArrowRightLeft, CheckCircle2, AlertCircle, Clock,
    Calendar, Building2, Wallet, CreditCard, ChevronRight,
    TrendingUp, ArrowUpRight, X, LayoutGrid, List,
    Trash2, Edit3, Eye, ChevronDown, Save, Loader2, UserPlus, Package, Printer, ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useApp } from '../../../hooks/useApp';
import Skeleton from '../../../components/common/Skeleton';
import SearchableSelect from '../../../components/common/SearchableSelect';
import { voucherAPI } from '../services';
import { inventoryAPI } from '../../operations/services';
import { bankAPI } from '../services';
import { partyAPI } from '../services';

const EMPTY_REF_DATA = { materials: [], equipments: [], vendors: [], tenders: [], banks: [], parties: [] };
const EMPTY_REF_LOADING = { materials: false, equipments: false, vendors: false, tenders: false, banks: false, parties: false };

const INITIAL_FORM = {
    type: 'Journal Voucher',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    tdsDeductions: 0,
    secondaryPartyAccount: '',
    narrationRemarks: '',
    materialId: '',
    materialName: '',
    equipmentId: '',
    equipmentName: '',
    vendorId: '',
    vendorName: '',
    tenderId: '',
    tenderName: '',
    accountId: '',
    // Sales Voucher specific
    partyId: '',
    partyName: '',
    quantity: '',
    rate: '',
    hsn: '',
    sgst: 5,
    cgst: 5,
    invoiceNo: '',
    buyerOrder: '',
    destination: '',
};

const INITIAL_PARTY_FORM = {
    partyName: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstin: '',
};

const INITIAL_MATERIAL_FORM = {
    materialName: '',
    category: 'Building',
    quantity: 100,
    quantityType: 'bags',
    avgPurchaseRate: 0,
    hsnNumber: '',
    sgstRate: 9,
    cgstRate: 9,
};

const parseList = (res, key) => {
    const raw = res?.data ?? res;
    const nested = raw?.[key];
    if (Array.isArray(nested)) return nested;
    if (Array.isArray(raw)) return raw;
    return [];
};

const VOUCHER_TYPES = [
    { key: 'Payment Voucher', label: 'Payment', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
    { key: 'Receipt Voucher', label: 'Receipt', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { key: 'Journal Voucher', label: 'Journal', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
    { key: 'Sales Voucher', label: 'Sales', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { key: 'Purchase Voucher', label: 'Purchase', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    { key: 'Contra Voucher', label: 'Contra', color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-100' },
];

import { generateInvoiceHTML, downloadInvoice } from '../../../utils/invoice';



// ------------------------------------------------------------
// Sub-modal: Create Party
// ------------------------------------------------------------
function AddPartyModal({ onClose, onCreated }) {
    const [form, setForm] = useState(INITIAL_PARTY_FORM);
    const [saving, setSaving] = useState(false);

    const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    /** Handle state selection — reset city since it may no longer be valid */
    const handleStateChange = ({ id: stateName }) => {
        setForm(prev => ({ ...prev, state: stateName, city: '' }));
    };

    /** Handle city selection — city is already filtered to the selected state */
    const handleCityChange = ({ id: cityName }) => {
        setForm(prev => ({ ...prev, city: cityName }));
    };

    /** Cities available for the current state */
    const cityOptions = getCitiesForState(form.state);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await partyAPI.createParty(form);
            const created = res?.data?.party || res?.data || res;
            toast.success(`Party "${form.partyName}" created!`);
            onCreated(created);
        } catch (err) {
            console.error(err);
            toast.error('Failed to create party');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-[#1e3a34] text-white">
                    <div className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5" />
                        <h2 className="text-base font-semibold">Add New Party</h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Row 1 — Party Name */}
                    <div className="space-y-1">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                            Party Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            required
                            name="partyName"
                            className="input h-11 w-full"
                            placeholder="xxxx..."
                            value={form.partyName}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Row 2 — State | City */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* State — searchable dropdown (select first) */}
                        <div>
                            <SearchableSelect
                                label="State"
                                placeholder="Search state…"
                                options={STATE_OPTIONS}
                                value={form.state}
                                displayLabel={form.state}
                                onChange={handleStateChange}
                                getOptionLabel={(o) => o.label}
                                getOptionValue={(o) => o.id}
                            />
                        </div>
                        {/* City — filtered by selected state */}
                        <div>
                            <SearchableSelect
                                label="City"
                                placeholder={form.state ? 'Search city…' : 'Select state first'}
                                options={cityOptions}
                                value={form.city}
                                displayLabel={form.city}
                                onChange={handleCityChange}
                                disabled={!form.state}
                                getOptionLabel={(o) => o.label}
                                getOptionValue={(o) => o.id}
                            />
                        </div>
                    </div>

                    {/* Row 3 — Address (full width) */}
                    <div className="space-y-1">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                            Address <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            required
                            name="address"
                            rows={3}
                            className="input w-full resize-none py-3 leading-relaxed"
                            placeholder="Street address, locality, landmark…"
                            value={form.address}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Row 4 — Pincode | GSTIN */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Pincode</label>
                            <input
                                name="pincode"
                                className="input h-11 w-full"
                                placeholder="xxxxxx"
                                maxLength={6}
                                pattern="[0-9]{6}"
                                value={form.pincode}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">GSTIN</label>
                            <input
                                name="gstin"
                                className="input h-11 w-full"
                                placeholder="xxxxxxxxxxxx"
                                maxLength={15}
                                value={form.gstin}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 h-12 bg-[#2f6645] hover:bg-[#1e3a34] text-white text-[11px] font-black uppercase tracking-widest rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                            Create Party
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ------------------------------------------------------------
// Sub-modal: Create Material
// ------------------------------------------------------------
function AddMaterialModal({ onClose, onCreated }) {
    const [form, setForm] = useState(INITIAL_MATERIAL_FORM);
    const [saving, setSaving] = useState(false);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setForm(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await inventoryAPI.createMaterial(form);
            const created = res?.data?.material || res?.data || res;
            toast.success(`Material "${form.materialName}" created!`);
            onCreated(created);
        } catch (err) {
            console.error(err);
            toast.error('Failed to create material');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-[#1e3a34] text-white">
                    <div className="flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        <h2 className="text-base font-semibold">Add New Material</h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Material Name <span className="text-red-500">*</span></label>
                            <input required name="materialName" className="input h-11 w-full" placeholder="e.g. Cement" value={form.materialName} onChange={handleChange} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Category</label>
                            <div className="relative">
                                <select name="category" className="input h-11 w-full appearance-none" value={form.category} onChange={handleChange}>
                                    <option value="Building">Building</option>
                                    <option value="good">Good</option>
                                    <option value="services">Services</option>
                                    <option value="capital good">Capital Good</option>
                                </select>
                                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Quantity</label>
                            <input type="number" name="quantity" className="input h-11 w-full" placeholder="100" value={form.quantity} onChange={handleChange} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Unit</label>
                            <input name="quantityType" className="input h-11 w-full" placeholder="bags" value={form.quantityType} onChange={handleChange} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Rate</label>
                            <input type="number" name="avgPurchaseRate" className="input h-11 w-full" placeholder="350" value={form.avgPurchaseRate} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">HSN Number</label>
                        <input name="hsnNumber" className="input h-11 w-full" placeholder="e.g. 123456" value={form.hsnNumber} onChange={handleChange} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">SGST Rate (%)</label>
                            <input type="number" name="sgstRate" className="input h-11 w-full" placeholder="5" value={form.sgstRate} onChange={handleChange} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">CGST Rate (%)</label>
                            <input type="number" name="cgstRate" className="input h-11 w-full" placeholder="5" value={form.cgstRate} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-6 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-all">Cancel</button>
                        <button type="submit" disabled={saving} className="flex-1 h-12 bg-[#2f6645] hover:bg-[#1e3a34] text-white text-[11px] font-black uppercase tracking-widest rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
                            Create Material
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ------------------------------------------------------------
// Main Component
// ------------------------------------------------------------
// ------------------------------------------------------------
// Live Invoice Preview (inline, real-time, no extra state)
// ------------------------------------------------------------
function LiveInvoicePreview({ formData, partyObj, materialObj }) {
    const getRate = (v1, v2, def) => {
        if (v1 !== undefined && v1 !== null && v1 !== '') return Number(v1);
        if (v2 !== undefined && v2 !== null && v2 !== '') return Number(v2);
        return def || 9;
    };
    const cgstRate = getRate(formData.cgst, formData.cgstRate, materialObj?.cgstRate);
    const sgstRate = getRate(formData.sgst, formData.sgstRate, materialObj?.sgstRate);
    const year = new Date(formData.date || new Date()).getFullYear();
    const nextShortYear = String(year + 1).slice(2);
    const invoiceNo = formData.invoiceNo || `RK/${year}-${nextShortYear}/—`;
    const dateStr = new Date(formData.date || new Date()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
    const qty = Number(formData.quantity) || 0;
    const rate = Number(formData.amount) || 0;
    const baseAmount = rate * qty;
    const cgstAmt = parseFloat(((baseAmount * cgstRate) / 100).toFixed(2));
    const sgstAmt = parseFloat(((baseAmount * sgstRate) / 100).toFixed(2));
    const grandTotal = parseFloat((baseAmount + cgstAmt + sgstAmt).toFixed(2));
    const hsn = formData.hsn || materialObj?.hsnNumber || materialObj?.hsn || '—';
    const materialDesc = formData.materialName || materialObj?.materialName || '—';
    const partyName = partyObj?.partyName || partyObj?.name || formData.partyName || '—';
    const partyAddr = [partyObj?.address, partyObj?.city, partyObj?.state, partyObj?.pincode].filter(Boolean).join(', ') || '—';
    const partyGSTIN = partyObj?.gstin || '—';
    const sgstLabel = (partyGSTIN !== '—' && !partyGSTIN.startsWith('10')) ? 'IGST' : 'SGST';
    const fmt = (n) => Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
    const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
    function numToWords(n) {
        n = Math.round(n);
        if (n === 0) return 'Zero';
        if (n < 20) return ones[n];
        if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? ' '+ones[n%10] : '');
        if (n < 1000) return ones[Math.floor(n/100)] + ' Hundred' + (n%100 ? ' '+numToWords(n%100) : '');
        if (n < 100000) return numToWords(Math.floor(n/1000)) + ' Thousand' + (n%1000 ? ' '+numToWords(n%1000) : '');
        if (n < 10000000) return numToWords(Math.floor(n/100000)) + ' Lakh' + (n%100000 ? ' '+numToWords(n%100000) : '');
        return numToWords(Math.floor(n/10000000)) + ' Crore' + (n%10000000 ? ' '+numToWords(n%10000000) : '');
    }
    const paise = Math.round((grandTotal % 1) * 100);
    const grandWords = grandTotal > 0
        ? 'INR ' + numToWords(Math.floor(grandTotal)) + ' and ' + (paise ? numToWords(paise) + ' paise' : 'Zero paise') + ' Only'
        : '—';

    const cell = (extra = '') => ({ border: '1px solid #888', padding: '4px 6px', verticalAlign: 'top', ...parseStyleStr(extra) });
    function parseStyleStr(s) {
        if (!s) return {};
        return s.split(';').reduce((acc, p) => {
            const [k, v] = p.split(':');
            if (k && v) acc[k.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = v.trim();
            return acc;
        }, {});
    }

    return (
        <div style={{ fontFamily: 'Arial, sans-serif', fontSize: 10, color: '#111', background: '#fff', borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            {/* Title */}
            <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 'bold', padding: '8px 12px', border: '2px solid #222', margin: '10px 10px 0', letterSpacing: 1 }}>
                Tax Invoice
            </div>

            <div style={{ padding: '0 10px 10px' }}>
                {/* Header info table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 6 }}>
                    <tbody>
                        <tr>
                            <td rowSpan={5} style={{ ...cell(), width: '50%', fontSize: 9.5 }}>
                                <div style={{ fontWeight: 'bold', fontSize: 11, marginBottom: 2 }}>Morlatis Engineering And Construction Pvt Ltd</div>
                                <div>01, Ramanad Nagar, Keshonaryanpur</div>
                                <div>Dakhli, Samastipur, Bihar – 848504</div>
                                <div><b>GSTIN:</b> 10AAMCM1665L2ZC</div>
                                <div style={{ marginTop: 6, fontWeight: 'bold' }}>Buyer (Bill to)</div>
                                <div style={{ fontWeight: 'bold', color: '#1e3a34' }}>{partyName}</div>
                                <div style={{ color: '#555' }}>{partyAddr}</div>
                                <div>GSTIN: {partyGSTIN}</div>
                            </td>
                            <td style={cell('width:25%')}><div style={{ color: '#888', fontSize: 9 }}>Invoice No.</div><div style={{ fontWeight: 'bold' }}>{invoiceNo}</div></td>
                            <td style={cell('width:25%')}><div style={{ color: '#888', fontSize: 9 }}>Dated</div><div style={{ fontWeight: 'bold' }}>{dateStr}</div></td>
                        </tr>
                        <tr>
                            <td style={cell()}><div style={{ color: '#888', fontSize: 9 }}>Buyer's Order No.</div><div style={{ fontWeight: 'bold' }}>{formData.buyerOrder || '—'}</div></td>
                            <td style={cell()}><div style={{ color: '#888', fontSize: 9 }}>Dated</div><div style={{ fontWeight: 'bold' }}>{dateStr}</div></td>
                        </tr>
                        <tr>
                            <td style={cell()}>Dispatch Doc No.</td>
                            <td style={cell()}>Delivery Note Date</td>
                        </tr>
                        <tr>
                            <td style={cell()}>Dispatched through</td>
                            <td style={cell()}>Destination: {formData.destination || '—'}</td>
                        </tr>
                        <tr>
                            <td colSpan={2} style={cell()}>Terms of Delivery</td>
                        </tr>
                    </tbody>
                </table>

                {/* Items table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 4 }}>
                    <thead>
                        <tr style={{ background: '#f0f0f0' }}>
                            {['#', 'Description', 'HSN', 'Qty', 'Rate (₹)', 'per', 'Amount (₹)'].map(h => (
                                <th key={h} style={{ border: '1px solid #888', padding: '4px 5px', textAlign: 'center', fontSize: 9, fontWeight: 'bold' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ ...cell(), textAlign: 'center' }}>1</td>
                            <td style={{ ...cell(), fontWeight: 'bold', color: '#1e3a34' }}>{materialDesc}</td>
                            <td style={{ ...cell(), textAlign: 'center' }}>{hsn}</td>
                            <td style={{ ...cell(), textAlign: 'center', fontWeight: 'bold' }}>{qty || '—'}</td>
                            <td style={{ ...cell(), textAlign: 'right', fontWeight: 'bold' }}>{rate ? fmt(rate) : '—'}</td>
                            <td style={{ ...cell(), textAlign: 'center' }}>Nos</td>
                            <td style={{ ...cell(), textAlign: 'right', fontWeight: 'bold' }}>{baseAmount ? fmt(baseAmount) : '—'}</td>
                        </tr>
                        {[...Array(2)].map((_, i) => (
                            <tr key={i}>{[...Array(7)].map((_, j) => <td key={j} style={{ border: '1px solid #bbb', height: 16 }} />)}</tr>
                        ))}
                        <tr>
                            <td colSpan={5} style={{ ...cell(), textAlign: 'right', fontStyle: 'italic', fontWeight: 'bold' }}>CGST @ {cgstRate}%</td>
                            <td style={cell()} />
                            <td style={{ ...cell(), textAlign: 'right' }}>{cgstAmt ? fmt(cgstAmt) : '—'}</td>
                        </tr>
                        <tr>
                            <td colSpan={5} style={{ ...cell(), textAlign: 'right', fontStyle: 'italic', fontWeight: 'bold' }}>{sgstLabel} @ {sgstRate}%</td>
                            <td style={cell()} />
                            <td style={{ ...cell(), textAlign: 'right' }}>{sgstAmt ? fmt(sgstAmt) : '—'}</td>
                        </tr>
                        <tr style={{ background: '#f8fdf9' }}>
                            <td colSpan={5} style={{ ...cell(), textAlign: 'right', fontWeight: 'bold', fontSize: 11 }}>Grand Total</td>
                            <td style={cell()} />
                            <td style={{ ...cell(), textAlign: 'right', fontWeight: 'bold', fontSize: 12, color: '#1e3a34' }}>₹ {grandTotal ? fmt(grandTotal) : '—'}</td>
                        </tr>
                    </tbody>
                </table>

                {/* Amount in words */}
                <div style={{ border: '1px solid #888', borderTop: 'none', padding: '5px 7px', fontSize: 9.5 }}>
                    <span style={{ color: '#555' }}>Amount Chargeable (in words): </span>
                    <span style={{ fontWeight: 'bold', fontStyle: 'italic' }}>{grandWords}</span>
                </div>

                {/* Tax summary */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 4 }}>
                    <thead>
                        <tr style={{ background: '#f0f0f0' }}>
                            <th style={{ border: '1px solid #888', padding: '3px 5px', textAlign: 'right', fontSize: 9 }}>HSN/SAC</th>
                            <th style={{ border: '1px solid #888', padding: '3px 5px', textAlign: 'right', fontSize: 9 }}>Taxable Value</th>
                            <th style={{ border: '1px solid #888', padding: '3px 5px', textAlign: 'center', fontSize: 9 }}>CGST Amt</th>
                            <th style={{ border: '1px solid #888', padding: '3px 5px', textAlign: 'center', fontSize: 9 }}>{sgstLabel} Amt</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ border: '1px solid #888', padding: '3px 5px', textAlign: 'right' }}>{hsn}</td>
                            <td style={{ border: '1px solid #888', padding: '3px 5px', textAlign: 'right' }}>{baseAmount ? fmt(baseAmount) : '—'}</td>
                            <td style={{ border: '1px solid #888', padding: '3px 5px', textAlign: 'center' }}>{cgstAmt ? fmt(cgstAmt) : '—'}</td>
                            <td style={{ border: '1px solid #888', padding: '3px 5px', textAlign: 'center' }}>{sgstAmt ? fmt(sgstAmt) : '—'}</td>
                        </tr>
                        <tr style={{ fontWeight: 'bold', background: '#f8fdf9' }}>
                            <td style={{ border: '1px solid #888', padding: '3px 5px', textAlign: 'right' }}>Total</td>
                            <td style={{ border: '1px solid #888', padding: '3px 5px', textAlign: 'right' }}>{baseAmount ? fmt(baseAmount) : '—'}</td>
                            <td style={{ border: '1px solid #888', padding: '3px 5px', textAlign: 'center' }}>{cgstAmt ? fmt(cgstAmt) : '—'}</td>
                            <td style={{ border: '1px solid #888', padding: '3px 5px', textAlign: 'center' }}>{sgstAmt ? fmt(sgstAmt) : '—'}</td>
                        </tr>
                    </tbody>
                </table>

                {/* Declaration + Signatory */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 4 }}>
                    <tbody>
                        <tr>
                            <td style={{ border: '1px solid #888', padding: '5px 7px', width: '50%', fontSize: 9, color: '#444', borderRight: 'none' }}>
                                <u style={{ fontWeight: 'bold' }}>Declaration</u><br />
                                We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
                            </td>
                            <td style={{ border: '1px solid #888', padding: '5px 7px', textAlign: 'right', fontSize: 9, color: '#444', borderLeft: 'none' }}>
                                <div style={{ fontWeight: 'bold' }}>for Morlatis Engineering And Construction Pvt Ltd</div>
                                <div style={{ marginTop: 20 }}>Authorised Signatory</div>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div style={{ textAlign: 'center', fontSize: 9, color: '#888', marginTop: 5 }}>This is a Computer Generated Invoice</div>
            </div>
        </div>
    );
}

// ------------------------------------------------------------
// Invoice Preview Modal
// ------------------------------------------------------------
function InvoicePreviewModal({ formData, partyObj, materialObj, onClose, onDownload, onPrint, isSaving }) {
    // compute invoice data inline (mirrors calculateInvoiceData from utils/invoice)
    const getRate = (val1, val2, def) => {
        if (val1 !== undefined && val1 !== null && val1 !== '') return Number(val1);
        if (val2 !== undefined && val2 !== null && val2 !== '') return Number(val2);
        return def || 9;
    };
    const cgstRate = getRate(formData.cgst, formData.cgstRate, materialObj?.cgstRate);
    const sgstRate = getRate(formData.sgst, formData.sgstRate, materialObj?.sgstRate);
    const year = new Date(formData.date).getFullYear();
    const nextShortYear = String(year + 1).slice(2);
    const invoiceNo = formData.invoiceNo || `RK/${year}-${nextShortYear}/0001`;
    const dateStr = new Date(formData.date || new Date()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
    const qty = Number(formData.quantity) || 1;
    const rate = Number(formData.amount) || Number(formData.rate) || 0;
    const baseAmount = rate * qty;
    const cgstAmt = parseFloat(((baseAmount * cgstRate) / 100).toFixed(2));
    const sgstAmt = parseFloat(((baseAmount * sgstRate) / 100).toFixed(2));
    const totalTax = parseFloat((cgstAmt + sgstAmt).toFixed(2));
    const grandTotal = parseFloat((baseAmount + totalTax).toFixed(2));
    const taxableValue = baseAmount;
    const hsn = formData.hsn || materialObj?.hsnNumber || materialObj?.hsn || '998519';
    const materialDesc = formData.materialName || materialObj?.materialName || materialObj?.name || 'Service';
    const partyName = partyObj?.partyName || partyObj?.name || partyObj?.vendorName || formData.partyName || '—';
    const partyAddr = [partyObj?.address, partyObj?.city, partyObj?.state, partyObj?.pincode].filter(Boolean).join(', ');
    const partyGSTIN = partyObj?.gstin || '';
    const sgstLabel = (partyGSTIN && !partyGSTIN.startsWith('10')) ? 'IGST' : 'SGST';

    const fmt = (n) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
    const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
    function numToWords(n) {
        n = Math.round(n);
        if (n === 0) return 'Zero';
        if (n < 20) return ones[n];
        if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? ' '+ones[n%10] : '');
        if (n < 1000) return ones[Math.floor(n/100)] + ' Hundred' + (n%100 ? ' '+numToWords(n%100) : '');
        if (n < 100000) return numToWords(Math.floor(n/1000)) + ' Thousand' + (n%1000 ? ' '+numToWords(n%1000) : '');
        if (n < 10000000) return numToWords(Math.floor(n/100000)) + ' Lakh' + (n%100000 ? ' '+numToWords(n%100000) : '');
        return numToWords(Math.floor(n/10000000)) + ' Crore' + (n%10000000 ? ' '+numToWords(n%10000000) : '');
    }
    const paise = Math.round((grandTotal % 1) * 100);
    const grandWords = 'INR ' + numToWords(Math.floor(grandTotal)) + ' and ' + (paise ? numToWords(paise) + ' paise' : 'Zero paise') + ' Only';
    const taxPaise = Math.round((totalTax % 1) * 100);
    const taxWords = 'INR ' + numToWords(Math.floor(totalTax)) + ' and ' + (taxPaise ? numToWords(taxPaise) + ' paise' : 'Zero paise') + ' Only';

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden" style={{maxHeight:'95vh'}}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-[#1e3a34] text-white flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-300" />
                        <div>
                            <h2 className="text-base font-bold">Invoice Preview</h2>
                            <p className="text-[11px] text-white/60 uppercase tracking-widest">Review before downloading</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
                </div>

                {/* Invoice preview body */}
                <div className="overflow-y-auto flex-1 bg-slate-100 p-6">
                    <div className="bg-white shadow-lg rounded-xl mx-auto" style={{maxWidth:760, fontFamily:'Arial,sans-serif', fontSize:11, color:'#000'}}>
                        <div style={{padding:'20px 24px'}}>
                            {/* Title */}
                            <h1 style={{textAlign:'center',fontSize:16,fontWeight:'bold',marginBottom:8,border:'2px solid #000',padding:'6px',letterSpacing:1}}>Tax Invoice</h1>

                            {/* Top header table */}
                            <table style={{width:'100%',borderCollapse:'collapse',marginBottom:0}}>
                                <tbody>
                                    <tr>
                                        <td rowSpan={8} style={{width:'48%',border:'1px solid #555',padding:'6px 8px',verticalAlign:'top'}}>
                                            <div style={{fontWeight:'bold',fontSize:12}}>Morlatis Engineering And Construction Pvt Ltd</div>
                                            <div>01, Ramanad Nagar, Keshonaryanpur, Gram</div>
                                            <div>Panchayat Office, Keshonaryanpur, Bond Dih</div>
                                            <div>Dakhli, Samastipur, Bihar, 848504</div>
                                            <div><span style={{fontWeight:'bold'}}>GSTIN/UIN:</span> 10AAMCM1665L2ZC</div>
                                            <div><span style={{fontWeight:'bold'}}>State Name:</span> Bihar, Code: 10</div>
                                            <br/>
                                            <div style={{fontWeight:'bold'}}>Consignee (Ship to)</div>
                                            <div style={{fontWeight:'bold',fontSize:11}}>{partyName}</div>
                                            {partyAddr && <div>{partyAddr}</div>}
                                            {partyGSTIN && <div><span style={{fontWeight:'bold'}}>GSTIN/UIN</span> : {partyGSTIN}</div>}
                                            <br/>
                                            <div style={{fontWeight:'bold'}}>Buyer (Bill to)</div>
                                            <div style={{fontWeight:'bold',fontSize:11}}>{partyName}</div>
                                            {partyAddr && <div>{partyAddr}</div>}
                                            {partyGSTIN && <div><span style={{fontWeight:'bold'}}>GSTIN/UIN</span> : {partyGSTIN}</div>}
                                        </td>
                                        <td style={{width:'26%',border:'1px solid #555',padding:'5px 7px'}}><div>Invoice No.</div><div style={{fontWeight:'bold'}}>{invoiceNo}</div></td>
                                        <td style={{width:'26%',border:'1px solid #555',padding:'5px 7px'}}><div>Dated</div><div style={{fontWeight:'bold'}}>{dateStr}</div></td>
                                    </tr>
                                    <tr>
                                        <td style={{border:'1px solid #555',padding:'5px 7px'}}>Delivery Note</td>
                                        <td style={{border:'1px solid #555',padding:'5px 7px'}}>Mode/Terms of Payment</td>
                                    </tr>
                                    <tr>
                                        <td style={{border:'1px solid #555',padding:'5px 7px'}}>Reference No. &amp; Date.</td>
                                        <td style={{border:'1px solid #555',padding:'5px 7px'}}>Other References</td>
                                    </tr>
                                    <tr>
                                        <td style={{border:'1px solid #555',padding:'5px 7px'}}><div>Buyer's Order No.</div><div style={{fontWeight:'bold'}}>{formData.buyerOrder || 'PI/2026-27/07'}</div></td>
                                        <td style={{border:'1px solid #555',padding:'5px 7px'}}><div>Dated</div><div style={{fontWeight:'bold'}}>{dateStr}</div></td>
                                    </tr>
                                    <tr>
                                        <td style={{border:'1px solid #555',padding:'5px 7px'}}><div>Dispatch Doc No.</div><div style={{fontWeight:'bold'}}>{invoiceNo}</div></td>
                                        <td style={{border:'1px solid #555',padding:'5px 7px'}}>Delivery Note Date</td>
                                    </tr>
                                    <tr>
                                        <td style={{border:'1px solid #555',padding:'5px 7px'}}>Dispatched through</td>
                                        <td style={{border:'1px solid #555',padding:'5px 7px'}}>Destination: {formData.destination || ''}</td>
                                    </tr>
                                    <tr>
                                        <td style={{border:'1px solid #555',padding:'5px 7px'}}><div>Bill of Lading/LR-RR No.</div><div style={{fontWeight:'bold'}}>dt. {dateStr}</div></td>
                                        <td style={{border:'1px solid #555',padding:'5px 7px'}}>Motor Vehicle No.</td>
                                    </tr>
                                    <tr>
                                        <td colSpan={2} style={{border:'1px solid #555',padding:'5px 7px'}}>Terms of Delivery</td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Items table */}
                            <table style={{width:'100%',borderCollapse:'collapse',marginTop:8}}>
                                <thead>
                                    <tr>
                                        {['Sl No.','Description of Services','HSN/SAC','Qty','Rate','per','Amount'].map(h => (
                                            <th key={h} style={{border:'1px solid #555',padding:'5px 7px',background:'#f0f0f0',fontWeight:'bold',textAlign:'center',fontSize:11}}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style={{border:'1px solid #555',padding:'5px 7px',textAlign:'center'}}>1</td>
                                        <td style={{border:'1px solid #555',padding:'5px 7px',fontWeight:'bold'}}>{materialDesc}</td>
                                        <td style={{border:'1px solid #555',padding:'5px 7px',textAlign:'center'}}>{hsn}</td>
                                        <td style={{border:'1px solid #555',padding:'5px 7px',textAlign:'center',fontWeight:'bold'}}>{qty}</td>
                                        <td style={{border:'1px solid #555',padding:'5px 7px',textAlign:'right',fontWeight:'bold'}}>{rate.toFixed(2)}</td>
                                        <td style={{border:'1px solid #555',padding:'5px 7px',textAlign:'center'}}>Nos</td>
                                        <td style={{border:'1px solid #555',padding:'5px 7px',textAlign:'right',fontWeight:'bold'}}>{fmt(baseAmount)}</td>
                                    </tr>
                                    {[...Array(4)].map((_,i) => (
                                        <tr key={i}>{[...Array(7)].map((_,j) => <td key={j} style={{border:'1px solid #555',height:22}}></td>)}</tr>
                                    ))}
                                    <tr>
                                        <td style={{border:'1px solid #555',padding:'5px 7px'}}></td>
                                        <td style={{border:'1px solid #555',padding:'5px 7px',textAlign:'right',fontStyle:'italic',fontWeight:'bold'}}>CGST</td>
                                        <td style={{border:'1px solid #555',padding:'5px 7px'}}></td>
                                        <td style={{border:'1px solid #555',padding:'5px 7px'}}></td>
                                        <td style={{border:'1px solid #555',padding:'5px 7px',textAlign:'right',fontStyle:'italic',fontWeight:'bold'}}>{cgstRate}%</td>
                                        <td style={{border:'1px solid #555',padding:'5px 7px'}}></td>
                                        <td style={{border:'1px solid #555',padding:'5px 7px',textAlign:'right',fontWeight:'bold'}}>{fmt(cgstAmt)}</td>
                                    </tr>
                                    <tr>
                                        <td style={{border:'1px solid #555',padding:'5px 7px'}}></td>
                                        <td style={{border:'1px solid #555',padding:'5px 7px',textAlign:'right',fontStyle:'italic',fontWeight:'bold'}}>{sgstLabel}</td>
                                        <td style={{border:'1px solid #555',padding:'5px 7px'}}></td>
                                        <td style={{border:'1px solid #555',padding:'5px 7px'}}></td>
                                        <td style={{border:'1px solid #555',padding:'5px 7px',textAlign:'right',fontStyle:'italic',fontWeight:'bold'}}>{sgstRate}%</td>
                                        <td style={{border:'1px solid #555',padding:'5px 7px'}}></td>
                                        <td style={{border:'1px solid #555',padding:'5px 7px',textAlign:'right',fontWeight:'bold'}}>{fmt(sgstAmt)}</td>
                                    </tr>
                                    <tr>
                                        <td style={{border:'1px solid #555',padding:'5px 7px'}}></td>
                                        <td style={{border:'1px solid #555',padding:'5px 7px',textAlign:'right',fontWeight:'bold'}}>Total</td>
                                        <td style={{border:'1px solid #555',padding:'5px 7px'}}></td>
                                        <td style={{border:'1px solid #555',padding:'5px 7px'}}></td>
                                        <td style={{border:'1px solid #555',padding:'5px 7px'}}></td>
                                        <td style={{border:'1px solid #555',padding:'5px 7px'}}></td>
                                        <td style={{border:'1px solid #555',padding:'5px 7px',textAlign:'right',fontWeight:'bold',fontSize:13}}>₹ {fmt(grandTotal)}</td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Amount in words + tax summary */}
                            <table style={{width:'100%',borderCollapse:'collapse',borderTop:'none'}}>
                                <tbody>
                                    <tr>
                                        <td colSpan={4} style={{border:'1px solid #555',padding:'5px 7px',borderTop:'none'}}>
                                            <div>Amount Chargeable (in words)</div>
                                            <div style={{fontWeight:'bold',fontStyle:'italic',fontSize:10}}>{grandWords}</div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style={{border:'1px solid #555',padding:'5px 7px',textAlign:'right',fontWeight:'bold',width:'50%'}}>HSN/SAC</td>
                                        <td style={{border:'1px solid #555',padding:'5px 7px',textAlign:'right',fontWeight:'bold',width:'15%'}}>Taxable Value</td>
                                        <td style={{border:'1px solid #555',padding:'5px 7px',textAlign:'center',fontWeight:'bold',width:'17.5%'}}>CGST Amount</td>
                                        <td style={{border:'1px solid #555',padding:'5px 7px',textAlign:'center',fontWeight:'bold',width:'17.5%'}}>{sgstLabel} Amount</td>
                                    </tr>
                                    <tr>
                                        <td style={{border:'1px solid #555',padding:'5px 7px',textAlign:'right'}}>{hsn}</td>
                                        <td style={{border:'1px solid #555',padding:'5px 7px',textAlign:'right'}}>{fmt(taxableValue)}</td>
                                        <td style={{border:'1px solid #555',padding:'5px 7px',textAlign:'center'}}>{fmt(cgstAmt)}</td>
                                        <td style={{border:'1px solid #555',padding:'5px 7px',textAlign:'center'}}>{fmt(sgstAmt)}</td>
                                    </tr>
                                    <tr>
                                        <td style={{border:'1px solid #555',padding:'5px 7px',textAlign:'right',fontWeight:'bold'}}>Total</td>
                                        <td style={{border:'1px solid #555',padding:'5px 7px',textAlign:'right',fontWeight:'bold'}}>{fmt(taxableValue)}</td>
                                        <td style={{border:'1px solid #555',padding:'5px 7px',textAlign:'center',fontWeight:'bold'}}>{fmt(cgstAmt)}</td>
                                        <td style={{border:'1px solid #555',padding:'5px 7px',textAlign:'center',fontWeight:'bold'}}>{fmt(sgstAmt)}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan={4} style={{border:'1px solid #555',padding:'5px 7px'}}>
                                            <div>Tax Amount (in words) : <span style={{fontWeight:'bold',fontStyle:'italic',fontSize:10}}>{taxWords}</span></div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Declaration & Signature */}
                            <table style={{width:'100%',borderCollapse:'collapse',marginTop:8}}>
                                <tbody>
                                    <tr>
                                        <td style={{width:'50%',border:'1px solid #555',padding:'5px 7px',borderRight:'none',fontSize:'9.5px',color:'#333'}}>
                                            <span style={{fontWeight:'bold',textDecoration:'underline'}}>Declaration</span><br/>
                                            We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
                                        </td>
                                        <td style={{width:'50%',border:'1px solid #555',padding:'5px 7px',borderLeft:'none',textAlign:'right',fontSize:'9.5px',color:'#333'}}>
                                            <div style={{fontWeight:'bold'}}>for Morlatis Engineering And Construction Pvt Ltd</div>
                                            <br/><br/><br/>
                                            <div>Authorised Signatory</div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <div style={{textAlign:'center',fontSize:'9.5px',color:'#333',marginTop:5}}>This is a Computer Generated Invoice</div>
                        </div>
                    </div>
                </div>

                {/* Action bar */}
                <div className="flex-shrink-0 px-6 py-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row gap-3 items-center">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex items-center gap-2 px-5 py-3 text-[11px] font-black text-slate-600 uppercase tracking-widest bg-slate-100 hover:bg-slate-200 rounded-xl transition-all active:scale-95"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back / Edit
                    </button>
                    <div className="flex gap-3 sm:ml-auto">
                        <button
                            type="button"
                            onClick={onPrint}
                            className="flex items-center gap-2 px-5 py-3 text-[11px] font-black text-[#2f6645] uppercase tracking-widest border-2 border-[#2f6645] hover:bg-[#2f6645]/10 rounded-xl transition-all active:scale-95"
                        >
                            <Printer className="w-4 h-4" />
                            Print
                        </button>
                        <button
                            type="button"
                            onClick={onDownload}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-6 py-3 text-[11px] font-black text-white uppercase tracking-widest bg-[#2f6645] hover:bg-[#1e3a34] rounded-xl shadow-lg shadow-[#2f6645]/20 transition-all active:scale-95 disabled:opacity-60"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            Download PDF
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Vouchers() {
    const { setActiveModule, setSelectedVoucher } = useApp();
    const [vouchers, setVouchers] = useState([]);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, name: '' });
    const [viewMode, setViewMode] = useState('table');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isTypeLocked, setIsTypeLocked] = useState(false);
    const [showInvoicePreview, setShowInvoicePreview] = useState(false);

    const [formData, setFormData] = useState(INITIAL_FORM);
    const [refData, setRefData] = useState(EMPTY_REF_DATA);
    const [refLoading, setRefLoading] = useState(EMPTY_REF_LOADING);

    const [secondaryPartyKind, setSecondaryPartyKind] = useState('');

    const [showAddParty, setShowAddParty] = useState(false);
    const [showAddMaterial, setShowAddMaterial] = useState(false);

    const [selectedPartyObj, setSelectedPartyObj] = useState(null);
    const [selectedMaterialObj, setSelectedMaterialObj] = useState(null);

    const isSalesVoucher = formData.type === 'Sales Voucher';

    const currentVoucherType = useMemo(
        () => VOUCHER_TYPES.find(vt => vt.key === formData.type),
        [formData.type]
    );

    const secondaryPartyMeta = useMemo(() => ({
        material: {
            label: 'Material', dataKey: 'materials', idField: 'materialId', nameField: 'materialName',
            getOptionLabel: (o) => o.materialName || o.name || `Material #${o.id}`,
        },
        equipment: {
            label: 'Equipment', dataKey: 'equipments', idField: 'equipmentId', nameField: 'equipmentName',
            getOptionLabel: (o) => o.equipmentName || o.name || `Equipment #${o.id}`,
        },
        vendor: {
            label: 'Vendor', dataKey: 'vendors', idField: 'vendorId', nameField: 'vendorName',
            getOptionLabel: (o) => o.name || o.vendorName || `Vendor #${o.id}`,
        },
        tender: {
            label: 'Tender', dataKey: 'tenders', idField: 'tenderId', nameField: 'tenderName',
            getOptionLabel: (o) => o.name || o.nameOfWork || o.Name || `Tender #${o.id}`,
        },
    }), []);

    const deriveSecondaryPartyKind = (voucherLike) => {
        if (voucherLike?.materialId != null && String(voucherLike.materialId) !== '') return 'material';
        if (voucherLike?.equipmentId != null && String(voucherLike.equipmentId) !== '') return 'equipment';
        if (voucherLike?.vendorId != null && String(voucherLike.vendorId) !== '') return 'vendor';
        if (voucherLike?.tenderId != null && String(voucherLike.tenderId) !== '') return 'tender';
        return '';
    };

    const fetchVouchers = async () => {
        setIsLoading(true);
        try {
            const res = await voucherAPI.getAllVouchers();
            const data = res?.vouchers || res?.data?.vouchers || res?.data || res || [];
            setVouchers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Fetch error:", error);
            toast.error("Failed to load voucher registry.");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchRefData = async () => {
        setRefLoading({ materials: true, equipments: true, vendors: true, tenders: true, banks: true, parties: true });
        const setKey = (key, items) => setRefData((prev) => ({ ...prev, [key]: items }));
        const setLoaded = (key) => setRefLoading((prev) => ({ ...prev, [key]: false }));

        const fetchers = [
            { fn: () => inventoryAPI.getAllMaterials(), key: 'materials', listKey: 'materials' },
            { fn: () => bankAPI.getAllBanks(), key: 'banks', listKey: 'banks' },
            { fn: () => partyAPI.getAllParties(), key: 'parties', listKey: 'parties' },
        ];

        for (const { fn, key, listKey } of fetchers) {
            try {
                const res = await fn();
                setKey(key, parseList(res, listKey));
            } catch { setKey(key, []); } finally { setLoaded(key); }
        }
    };

    useEffect(() => { 
        fetchVouchers(); 
        fetchRefData();
    }, []);

    const getPartyName = (id) => refData.parties.find(p => String(p.id) === String(id) || String(p._id) === String(id))?.partyName;
    const getMaterialName = (id) => refData.materials.find(m => String(m.id) === String(id) || String(m._id) === String(id))?.materialName;

    const handleInputChange = (e) => {
        let { name, value } = e.target;
        if (name === 'invoiceNo') {
            value = value.toUpperCase();
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleOpenEdit = (voucher) => {
        setCurrentId(voucher.id);
        setSecondaryPartyKind(deriveSecondaryPartyKind(voucher));
        setFormData({
            ...INITIAL_FORM,
            type: voucher.type || 'Journal Voucher',
            date: voucher.date || new Date().toISOString().split('T')[0],
            amount: voucher.amount || '',
            tdsDeductions: voucher.tdsDeductions || 0,
            secondaryPartyAccount: voucher.secondaryPartyAccount || '',
            narrationRemarks: voucher.narrationRemarks || '',
            materialId: voucher.materialId ?? '',
            materialName: voucher.materialName || '',
            equipmentId: voucher.equipmentId ?? '',
            equipmentName: voucher.equipmentName || '',
            vendorId: voucher.vendorId ?? '',
            vendorName: voucher.vendorName || '',
            tenderId: voucher.tenderId ?? '',
            tenderName: voucher.tenderName || '',
            accountId: voucher.accountId ?? '',
            partyId: voucher.partyId ?? '',
            partyName: voucher.partyName || '',
            quantity: voucher.quantity || '',
            rate: voucher.rate || '',
            hsn: voucher.hsn || '',
            sgst: voucher.sgst ?? voucher.sgstRate ?? 9,
            cgst: voucher.cgst ?? voucher.cgstRate ?? 9,
            invoiceNo: voucher.invoiceNo || '',
        });
        setIsEditing(true);
        setIsTypeLocked(true);
        setIsModalOpen(true);
    };

    const handleDelete = (voucher) => {
        setDeleteConfirm({ show: true, id: voucher.id, name: `Voucher #${voucher.id}` });
    };

    const confirmDelete = async () => {
        setIsSaving(true);
        try {
            await voucherAPI.deleteVoucher(deleteConfirm.id);
            toast.success('Voucher record deleted');
            fetchVouchers();
            setDeleteConfirm({ show: false, id: null, name: '' });
        } catch (error) {
            console.error("Delete error:", error);
            toast.error('Failed to remove voucher');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault ? e.preventDefault() : null;
        setIsSaving(true);
        const payload = {
            ...formData,
            amount: Number(formData.amount),
            tdsDeductions: Number(formData.tdsDeductions),
            materialId: formData.materialId !== '' ? formData.materialId : null,
            equipmentId: formData.equipmentId !== '' ? formData.equipmentId : null,
            vendorId: formData.vendorId !== '' ? formData.vendorId : null,
            tenderId: formData.tenderId !== '' ? formData.tenderId : null,
            accountId: formData.accountId !== '' ? Number(formData.accountId) : null,
            bankAccountId: formData.accountId !== '' ? Number(formData.accountId) : null,
            partyId: formData.partyId !== '' ? formData.partyId : null,
            quantity: formData.quantity !== '' ? Number(formData.quantity) : null,
            rate: formData.rate !== '' ? Number(formData.rate) : null,
            sgst: formData.sgst !== '' ? Number(formData.sgst) : 0,
            cgst: formData.cgst !== '' ? Number(formData.cgst) : 0,
            invoiceNo: formData.invoiceNo || '',
        };

        // Remove unnecessary properties with null or empty values
        Object.keys(payload).forEach(key => {
            if (payload[key] === null || payload[key] === "") {
                delete payload[key];
            }
        });

        try {
            if (isEditing) {
                await voucherAPI.updateVoucher(currentId, payload);
                toast.success('Voucher updated successfully');
            } else {
                await voucherAPI.createVoucher(payload);
                toast.success('Voucher posted to ledger');
                if (isSalesVoucher) {
                    downloadInvoice(formData, selectedPartyObj, selectedMaterialObj);
                    toast.success('Invoice downloaded!', { icon: '📄' });
                }
            }
            fetchVouchers();
            setShowInvoicePreview(false);
            setIsModalOpen(false);
            setIsEditing(false);
            setFormData(freshForm());
            setSelectedPartyObj(null);
            setSelectedMaterialObj(null);
        } catch (error) {
            console.error("Save error:", error);
            toast.error('Failed to post voucher');
        } finally {
            setIsSaving(false);
        }
    };

    const handlePrintInvoice = () => {
        const year = new Date(formData.date).getFullYear();
        const nextShortYear = String(year + 1).slice(2);
        const invoiceNo = formData.invoiceNo || `RK/${year}-${nextShortYear}/0001`;
        const html = generateInvoiceHTML(formData, selectedPartyObj, selectedMaterialObj, invoiceNo);
        const win = window.open('', '_blank');
        if (win) {
            win.document.write(html);
            win.document.close();
            win.focus();
            setTimeout(() => { win.print(); }, 400);
        }
    };

    // Preview modal "Download PDF" — only downloads, does NOT re-save
    const handleDownloadFromPreview = () => {
        downloadInvoice(formData, selectedPartyObj, selectedMaterialObj);
        toast.success('Invoice downloaded!', { icon: '📄' });
    };

    const freshForm = (overrides = {}) => ({
        ...INITIAL_FORM,
        date: new Date().toISOString().split('T')[0],
        ...overrides,
    });

    const handleQuickEntry = (type = 'Journal Voucher', lock = false) => {
        setIsEditing(false);
        setIsTypeLocked(lock);
        setSecondaryPartyKind('');
        setFormData(freshForm({ type }));
        setSelectedPartyObj(null);
        setSelectedMaterialObj(null);
        setIsModalOpen(true);
    };

    const clearSecondaryPartyRefs = (next = {}) => ({
        ...next,
        materialId: '', materialName: '',
        equipmentId: '', equipmentName: '',
        vendorId: '', vendorName: '',
        tenderId: '', tenderName: '',
    });

    const handleSecondaryPartyKindChange = (e) => {
        const nextKind = e.target.value;
        setSecondaryPartyKind(nextKind);
        setFormData((prev) => clearSecondaryPartyRefs({ ...prev, secondaryPartyAccount: '' }));
    };

    const handleSecondaryPartySelect = ({ id, label }) => {
        if (!secondaryPartyKind) return;
        const meta = secondaryPartyMeta[secondaryPartyKind];
        if (!meta) return;
        setFormData((prev) => {
            const cleared = clearSecondaryPartyRefs(prev);
            if (id === '' || id == null) return { ...cleared, secondaryPartyAccount: '' };
            return { ...cleared, secondaryPartyAccount: label || '', [meta.idField]: id, [meta.nameField]: label || '' };
        });
        if (secondaryPartyKind === 'material') {
            const mat = refData.materials.find(m => String(m.id) === String(id));
            setSelectedMaterialObj(mat || null);
        }
    };

    const handlePartySelect = ({ id, label }) => {
        setFormData(prev => ({ ...prev, partyId: id || '', partyName: label || '' }));
        const party = refData.parties.find(p => String(p.id) === String(id) || String(p._id) === String(id));
        setSelectedPartyObj(party || null);
    };

    const handleSalesMaterialSelect = ({ id, label }) => {
        const mat = refData.materials.find(m => String(m.id) === String(id) || String(m._id) === String(id));
        setSelectedMaterialObj(mat || null);
        setFormData(prev => {
            const rate = mat?.avgPurchaseRate ? Number(mat.avgPurchaseRate) : (Number(prev.rate) || 0);
            return {
                ...prev,
                materialId: id || '',
                materialName: label || '',
                hsn: mat?.hsnNumber || mat?.hsn || prev.hsn,
                sgst: mat?.sgstRate ?? prev.sgst,
                cgst: mat?.cgstRate ?? prev.cgst,
                rate: rate ? String(rate) : prev.rate,
                amount: rate ? String(rate) : prev.amount,
            };
        });
    };

    const handlePartyCreated = (newParty) => {
        setRefData(prev => ({ ...prev, parties: [...prev.parties, newParty] }));
        setFormData(prev => ({
            ...prev,
            partyId: newParty.id || newParty._id || '',
            partyName: newParty.partyName || '',
        }));
        setSelectedPartyObj(newParty);
        setShowAddParty(false);
    };

    const handleMaterialCreated = (newMaterial) => {
        setRefData(prev => ({ ...prev, materials: [...prev.materials, newMaterial] }));
        setFormData(prev => {
            const rate = newMaterial.avgPurchaseRate ? Number(newMaterial.avgPurchaseRate) : (Number(prev.rate) || 0);
            return {
                ...prev,
                materialId: newMaterial.id || newMaterial._id || '',
                materialName: newMaterial.materialName || '',
                hsn: newMaterial.hsnNumber || newMaterial.hsn || prev.hsn,
                sgst: newMaterial.sgstRate ?? prev.sgst,
                cgst: newMaterial.cgstRate ?? prev.cgst,
                rate: rate ? String(rate) : prev.rate,
                amount: rate ? String(rate) : prev.amount,
            };
        });
        setSelectedMaterialObj(newMaterial);
        setShowAddMaterial(false);
    };

    const filteredVouchers = vouchers.filter(v =>
        ((v.secondaryPartyAccount || '').toLowerCase().includes(search.toLowerCase()) ||
            (v.id || '').toString().includes(search.toLowerCase()) ||
            (v.narrationRemarks || '').toLowerCase().includes(search.toLowerCase())) &&
        (filter === 'All' || (v.type || '').includes(filter))
    );

    return (
        <div className="space-y-5 animate-fade-in pb-12 relative">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Voucher Management</h1>
                    <p className="text-slate-500 text-sm mt-1">Financial journal registry & transaction posting</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative hidden sm:block w-56">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Search vouchers..." className="input pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <button onClick={() => handleQuickEntry('Journal Voucher', false)} className="btn-primary flex items-center gap-1.5">
                        <Plus className="w-4 h-4" /> Quick Voucher
                    </button>
                </div>
            </div>

            {/* Quick Entry Console */}
            <div className="card overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <h3 className="font-semibold text-slate-800 text-sm">Quick Entry Console</h3>
                    <div className="flex p-0.5 bg-slate-100 rounded-lg border border-slate-200">
                        <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-white text-[#2f6645] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><List className="w-4 h-4" /></button>
                        <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-[#2f6645] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid className="w-4 h-4" /></button>
                    </div>
                </div>
                <div className="p-4 grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {VOUCHER_TYPES.map(vt => (
                        <button key={vt.key} onClick={() => handleQuickEntry(vt.key, true)}
                            className={`flex flex-col items-center justify-center gap-2 p-3 min-h-[80px] rounded-xl border transition-all hover:-translate-y-0.5 hover:shadow-md ${vt.bg} ${vt.border}`}>
                            <span className="text-xs font-bold text-slate-700">{vt.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Registry Table */}
            <div className="card overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-slate-800 text-sm">Voucher Registry</h3>
                        <div className="flex gap-1">
                            {['All', 'Payment', 'Receipt', 'Journal'].map(t => (
                                <button key={t} onClick={() => setFilter(t)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${filter === t ? 'bg-[#2f6645] text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="table-header">Type & Date</th>
                                <th className="table-header">Party Name</th>
                                <th className="table-header">Material Name</th>
                                <th className="table-header text-right">Quantity</th>
                                <th className="table-header text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="table-row">
                                        <td className="table-cell"><div className="flex gap-2"><Skeleton variant="circle" className="w-9 h-9" /><Skeleton variant="text" className="w-24" /></div></td>
                                        <td className="table-cell"><Skeleton variant="text" className="w-40" /></td>
                                        <td className="table-cell"><Skeleton variant="text" className="w-32 mt-1" /></td>
                                        <td className="table-cell text-right"><Skeleton variant="text" className="ml-auto w-20" /></td>
                                        <td className="table-cell text-center"><Skeleton variant="badge" className="mx-auto mt-1 w-24" /></td>
                                    </tr>
                                ))
                            ) : filteredVouchers.map(v => (
                                <tr key={v.id} className="table-row hover:bg-slate-50 transition-colors group">
                                    <td className="table-cell">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${v.type?.includes('Payment') ? 'bg-rose-50 text-rose-500' : v.type?.includes('Receipt') ? 'bg-emerald-50 text-emerald-500' : 'bg-blue-50 text-blue-500'}`}>
                                                <ArrowRightLeft className={`w-4 h-4 ${v.type?.includes('Receipt') ? 'rotate-90' : (v.type?.includes('Payment') ? '-rotate-90' : '')}`} />
                                            </div>
                                            <div>
                                                <p className="text-slate-800 font-semibold text-sm">{v.type || 'Voucher'}</p>
                                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5"><Calendar className="w-3 h-3" />{v.date}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="table-cell">
                                        <p className="text-slate-800 font-bold">{v.partyName || v.secondaryPartyAccount || getPartyName(v.partyId) || 'N/A'}</p>
                                    </td>
                                    <td className="table-cell">
                                        <p className="text-slate-700 font-bold">{v.materialName || getMaterialName(v.materialId) || 'N/A'}</p>
                                    </td>
                                    <td className="table-cell text-right">
                                        <p className="font-black text-sm tabular-nums text-slate-800">
                                            {v.quantity || 0}
                                        </p>
                                    </td>
                                    <td className="table-cell">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => { setSelectedVoucher(v); setActiveModule('voucher-detail'); }} className="p-2 hover:bg-blue-50 text-blue-500 rounded-xl transition-all hover:scale-110 active:scale-90" title="View Details"><Eye className="w-4 h-4" /></button>
                                            <button onClick={(e) => { e.stopPropagation(); handleOpenEdit(v); }} className="p-2 hover:bg-amber-50 text-amber-500 rounded-xl transition-all hover:scale-110 active:scale-90" title="Edit Voucher"><Edit3 className="w-4 h-4" /></button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(v); }} className="p-2 hover:bg-red-50 text-red-600 rounded-xl transition-all hover:scale-110 active:scale-90" title="Void Voucher"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Voucher Entry Modal ── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-2 sm:p-4 animate-fade-in" onClick={() => setIsModalOpen(false)}>
                    <div
                        className={`bg-white rounded-2xl shadow-2xl w-full overflow-hidden flex flex-col ${isSalesVoucher ? 'max-w-6xl' : 'max-w-2xl'}`}
                        style={{ maxHeight: '96vh' }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-[#1e3a34] text-white flex-shrink-0">
                            <div className="flex items-center gap-3">
                                {isSalesVoucher && <FileText className="w-5 h-5 text-blue-300" />}
                                <h2 className="text-base font-semibold">
                                    {currentVoucherType ? `${currentVoucherType.label} Entry` : 'Journal Entry'}
                                </h2>
                                {isSalesVoucher && (
                                    <span className="text-[10px] bg-blue-500/20 text-blue-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Live Preview</span>
                                )}
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body: split for Sales, single-col for others */}
                        <div className={`flex-1 overflow-hidden ${isSalesVoucher ? 'flex flex-col lg:flex-row' : ''}`}>

                            {/* ── LEFT: Form ── */}
                            <form
                                onSubmit={handleSave}
                                className={`flex flex-col overflow-y-auto ${isSalesVoucher ? 'lg:w-1/2 lg:border-r border-slate-100' : 'w-full'}`}
                            >
                                <div className="p-6 space-y-7 flex-1">
                                    {/* Section 1: Basic Parameters */}
                                    <div>
                                        <h3 className="text-[10px] font-black tracking-[0.2em] text-[#1e3a34] mb-5 uppercase">1. Basic Parameters</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="space-y-2 leading-none">
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Voucher Type <span className="text-red-500">*</span></label>
                                                <div className="relative">
                                                    <select name="type"
                                                        className={`input w-full h-11 appearance-none bg-white pr-10 font-bold ${isTypeLocked ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
                                                        value={formData.type} onChange={handleInputChange} disabled={isTypeLocked}>
                                                        {VOUCHER_TYPES.map(vt => <option key={vt.key} value={vt.key}>{vt.label}</option>)}
                                                    </select>
                                                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Entry Date <span className="text-red-500">*</span></label>
                                                <input name="date" type="date" className="input h-11 font-bold w-full" value={formData.date} onChange={handleInputChange} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Invoice No</label>
                                                <input name="invoiceNo" type="text" className="input h-11 w-full font-bold" placeholder="INV-001" value={formData.invoiceNo} onChange={handleInputChange} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Financial Matrix (non-Sales) */}
                                    {!isSalesVoucher && (
                                        <div>
                                            <h3 className="text-[10px] font-black tracking-[0.2em] text-[#1e3a34] mb-5 uppercase">2. Financial Matrix</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <div className="space-y-2">
                                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Amount (&#8377;) <span className="text-red-500">*</span></label>
                                                    <input name="amount" type="number" className="input h-11 font-black text-slate-800" placeholder="0.00" value={formData.amount} onChange={handleInputChange} />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">TDS / Deductions (&#8377;)</label>
                                                    <input name="tdsDeductions" type="number" className="input h-11 font-black text-rose-500 bg-rose-50/30 border-rose-100" placeholder="0.00" value={formData.tdsDeductions} onChange={handleInputChange} />
                                                </div>
                                            </div>
                                            {(formData.type === 'Purchase Voucher') && (
                                                <div className="space-y-2 mt-5">
                                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Bank Account <span className="text-red-500">*</span></label>
                                                    <div className="relative">
                                                        <select required name="accountId" className="input w-full h-11 appearance-none bg-white pr-10 font-bold" value={formData.accountId} onChange={handleInputChange}>
                                                            <option value="">Select Bank Account...</option>
                                                            {(refData.banks || []).map(bank => (
                                                                <option key={bank.id} value={bank.id}>
                                                                    {bank.bankName} - {bank.accountNo} (Balance: &#8377;{Number(bank.balance).toLocaleString()})
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Sales Voucher Details */}
                                    {isSalesVoucher && (
                                        <div>
                                            <h3 className="text-[10px] font-black tracking-[0.2em] text-[#1e3a34] mb-5 uppercase">2. Voucher Details</h3>
                                            <div className="space-y-4">
                                                <SearchableSelect
                                                    label="Party Name"
                                                    required
                                                    placeholder="Search parties..."
                                                    options={refData.parties || []}
                                                    value={formData.partyId}
                                                    displayLabel={formData.partyName}
                                                    isLoading={refLoading.parties}
                                                    getOptionValue={(o) => o.id || o._id}
                                                    getOptionLabel={(o) => o.partyName || o.name || `Party #${o.id}`}
                                                    onChange={handlePartySelect}
                                                    actionElement={
                                                        <button type="button" onClick={() => setShowAddParty(true)}
                                                            className="w-full flex items-center justify-center gap-1.5 text-[11px] font-black text-[#2f6645] hover:text-[#1e3a34] bg-[#2f6645]/10 hover:bg-[#2f6645]/20 py-2.5 rounded-lg transition-all active:scale-95 shadow-sm">
                                                            <Plus className="w-3.5 h-3.5" /> Add New Party
                                                        </button>
                                                    }
                                                />
                                                <SearchableSelect
                                                    label="Material / Service"
                                                    required
                                                    placeholder="Search materials..."
                                                    options={refData.materials || []}
                                                    value={formData.materialId}
                                                    displayLabel={formData.materialName}
                                                    isLoading={refLoading.materials}
                                                    getOptionValue={(o) => o.id || o._id}
                                                    getOptionLabel={(o) => o.materialName || o.name || `Material #${o.id}`}
                                                    onChange={handleSalesMaterialSelect}
                                                    actionElement={
                                                        <button type="button" onClick={() => setShowAddMaterial(true)}
                                                            className="w-full flex items-center justify-center gap-1.5 text-[11px] font-black text-[#2f6645] hover:text-[#1e3a34] bg-[#2f6645]/10 hover:bg-[#2f6645]/20 py-2.5 rounded-lg transition-all active:scale-95 shadow-sm">
                                                            <Plus className="w-3.5 h-3.5" /> Add New Material
                                                        </button>
                                                    }
                                                />
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div className="space-y-2">
                                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantity <span className="text-red-500">*</span></label>
                                                        <input name="quantity" type="number" className="input h-11 w-full font-bold" placeholder="1" value={formData.quantity} onChange={handleInputChange} />
                                                    </div>
                                                    <div className="space-y-2 col-span-2">
                                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Amount / Rate (&#8377;) <span className="text-red-500">*</span></label>
                                                        <input name="amount" type="number" className="input h-11 w-full font-bold" placeholder="0.00" value={formData.amount} onChange={handleInputChange} />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-2">
                                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                                            {(() => {
                                                                const p = refData?.parties?.find(x => (x.id || x._id) === formData.partyId);
                                                                const g = p?.gstin || '';
                                                                return (g && !g.startsWith('10')) ? 'IGST (%)' : 'SGST (%)';
                                                            })()}
                                                        </label>
                                                        <input name="sgst" type="number" className="input h-11 w-full font-bold" placeholder="5" value={formData.sgst} onChange={handleInputChange} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">CGST (%)</label>
                                                        <input name="cgst" type="number" className="input h-11 w-full font-bold" placeholder="5" value={formData.cgst} onChange={handleInputChange} />
                                                    </div>
                                                </div>
                                                {/* Optional: Buyer Order & Destination */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-2">
                                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Buyer Order No. <span className="text-slate-300 font-normal normal-case">optional</span></label>
                                                        <input name="buyerOrder" type="text" className="input h-11 w-full font-bold" placeholder="e.g. PO-2026-07" value={formData.buyerOrder} onChange={handleInputChange} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Destination <span className="text-slate-300 font-normal normal-case">optional</span></label>
                                                        <input name="destination" type="text" className="input h-11 w-full font-bold" placeholder="e.g. Patna" value={formData.destination} onChange={handleInputChange} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Party & Intent (non-Sales) */}
                                    {!isSalesVoucher && (
                                        <div>
                                            <h3 className="text-[10px] font-black tracking-[0.2em] text-[#1e3a34] mb-5 uppercase">3. Party &amp; Intent</h3>
                                            <div className="grid grid-cols-1 gap-5">
                                                <div className="space-y-2">
                                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Secondary Party / Ledger Account <span className="text-red-500">*</span></label>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Type <span className="text-red-500">*</span></label>
                                                            <div className="relative">
                                                                <select className="input w-full h-11 appearance-none bg-white pr-10 font-bold" value={secondaryPartyKind} onChange={handleSecondaryPartyKindChange}>
                                                                    <option value="">Select type...</option>
                                                                    <option value="material">Material</option>
                                                                    <option value="equipment">Equipment</option>
                                                                    <option value="vendor">Vendor</option>
                                                                    <option value="tender">Tender</option>
                                                                </select>
                                                                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                            </div>
                                                        </div>
                                                        <SearchableSelect
                                                            label={secondaryPartyKind ? secondaryPartyMeta[secondaryPartyKind]?.label : 'Select'}
                                                            required
                                                            placeholder={secondaryPartyKind ? `Search ${secondaryPartyMeta[secondaryPartyKind]?.label?.toLowerCase()}...` : 'Select type first...'}
                                                            options={secondaryPartyKind ? (refData[secondaryPartyMeta[secondaryPartyKind]?.dataKey] || []) : []}
                                                            value={secondaryPartyKind ? formData[secondaryPartyMeta[secondaryPartyKind]?.idField] : ''}
                                                            displayLabel={secondaryPartyKind ? formData[secondaryPartyMeta[secondaryPartyKind]?.nameField] : ''}
                                                            isLoading={secondaryPartyKind ? refLoading[secondaryPartyMeta[secondaryPartyKind]?.dataKey] : false}
                                                            disabled={!secondaryPartyKind}
                                                            getOptionValue={(o) => o.id}
                                                            getOptionLabel={(o) => secondaryPartyKind ? secondaryPartyMeta[secondaryPartyKind]?.getOptionLabel(o) : ''}
                                                            onChange={handleSecondaryPartySelect}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Narration / Detailed Remarks</label>
                                                    <textarea name="narrationRemarks" rows="3" className="input py-3 font-medium h-auto" placeholder="Enter transaction narrative..." value={formData.narrationRemarks} onChange={handleInputChange}></textarea>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Form footer / action buttons */}
                                <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-white flex-shrink-0 flex-wrap">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-3 text-[11px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex-shrink-0">Discard</button>
                                    {isSalesVoucher && !isEditing ? (
                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className="flex-1 min-w-[160px] h-11 text-[11px] font-black uppercase tracking-widest rounded-xl text-white bg-[#2f6645] hover:bg-[#1e3a34] shadow-lg shadow-[#2f6645]/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
                                        >
                                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                            Download Invoice
                                        </button>
                                    ) : (
                                        <button type="submit" disabled={isSaving}
                                            className="flex-1 h-11 text-[11px] font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all rounded-xl text-white bg-[#2f6645] hover:bg-[#1e3a34] shadow-[#2f6645]/20 disabled:opacity-60">
                                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : isSalesVoucher ? <Download className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                            {isEditing
                                                ? `Update ${currentVoucherType ? currentVoucherType.label : 'Journal'}`
                                                : 'Post to Ledger'
                                            }
                                        </button>
                                    )}
                                </div>
                            </form>

                            {/* ── RIGHT: Live Invoice Preview (Sales only) ── */}
                            {isSalesVoucher && (
                                <div className="lg:w-1/2 bg-slate-50 overflow-y-auto flex flex-col border-t lg:border-t-0 border-slate-100">
                                    {/* Preview header */}
                                    <div className="px-5 py-3 border-b border-slate-200 bg-white flex items-center gap-2 flex-shrink-0">
                                        <Eye className="w-4 h-4 text-[#2f6645]" />
                                        <span className="text-[11px] font-black text-[#1e3a34] uppercase tracking-widest">Live Invoice Preview</span>
                                        <span className="ml-auto text-[10px] text-slate-400 font-semibold italic">Updates as you type</span>
                                    </div>

                                    {/* Preview content */}
                                    <div className="p-4 flex-1">
                                        <LiveInvoicePreview
                                            formData={formData}
                                            partyObj={selectedPartyObj}
                                            materialObj={selectedMaterialObj}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
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
                                <h3 className="text-lg font-black text-slate-800 tracking-tight">Void Voucher?</h3>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Permanent Audit Trail Change</p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed mb-8">
                            Are you sure you want to void <span className="font-black text-slate-900 underline decoration-red-200">{deleteConfirm.name}</span>? This action cannot be undone once reconciled.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm({ show: false, id: null, name: '' })}
                                className="flex-1 py-4 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all">
                                Cancel
                            </button>
                            <button onClick={confirmDelete} disabled={isSaving}
                                className="flex-1 py-4 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-red-900/20 hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center">
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Void Voucher"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Party Sub-modal */}
            {showAddParty && (
                <AddPartyModal onClose={() => setShowAddParty(false)} onCreated={handlePartyCreated} />
            )}

            {/* Add Material Sub-modal */}
            {showAddMaterial && (
                <AddMaterialModal onClose={() => setShowAddMaterial(false)} onCreated={handleMaterialCreated} />
            )}

            {/* Invoice Preview Modal */}
            {showInvoicePreview && (
                <InvoicePreviewModal
                    formData={formData}
                    partyObj={selectedPartyObj}
                    materialObj={selectedMaterialObj}
                    onClose={() => setShowInvoicePreview(false)}
                    onDownload={handleDownloadFromPreview}
                    onPrint={handlePrintInvoice}
                    isSaving={false}
                />
            )}
        </div>
    );
}

function BookOpenIcon({ className }) {
    return <FileText className={className} />;
}
