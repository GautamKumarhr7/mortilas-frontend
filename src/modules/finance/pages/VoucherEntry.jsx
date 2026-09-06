import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../../../context/AppContextValue';
import { useDispatch } from 'react-redux';
import { setActiveModule } from '../../../store/slices/uiSlice';
import { ArrowLeft, Save, Plus, Trash2, Calendar, FileText, User, Hash } from 'lucide-react';
import toast from 'react-hot-toast';
import { voucherAPI } from '../voucherService';
import { bankAPI } from '../services';
import { inventoryAPI } from '../../operations/services';

export default function VoucherEntry() {
    const { selectedVoucherType, setSelectedVoucherType } = useContext(AppContext);
    const dispatch = useDispatch();
    
    // Default to Journal if directly accessed without selecting a type
    const voucherType = selectedVoucherType || 'journal';
    
    const voucherTypeNames = {
        'receipt': 'Receipt Voucher',
        'payment': 'Payment Voucher',
        'journal': 'Journal Voucher',
        'contra': 'Contra Voucher',
        'sales': 'Sales Voucher',
        'purchase': 'Purchase Voucher'
    };

    const [banks, setBanks] = useState([]);
    const [loadingBanks, setLoadingBanks] = useState(false);
    
    const [materials, setMaterials] = useState([]);
    const [loadingMaterials, setLoadingMaterials] = useState(false);

    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        entrydate: new Date().toISOString().split('T')[0],
        narration: '',
        invoiceId: '',
        buyer: voucherType === 'purchase' ? 'mortlies pvt limited' : '',
        seller: voucherType === 'sales' ? 'mortlies pvt limited' : '',
        gstrate: '0',
        tdsrate: '0',
    });

    const [items, setItems] = useState([
        { id: 1, description: '', quantity: 1, rate: 0 }
    ]);

    const [accounts, setAccounts] = useState([
        { id: 1, bankId: '', amount: 0 }
    ]);

    useEffect(() => {
        if (voucherType === 'sales') {
            setFormData(prev => ({ ...prev, seller: 'mortlies pvt limited' }));
        } else if (voucherType === 'purchase') {
            setFormData(prev => ({ ...prev, buyer: 'mortlies pvt limited' }));
        }
    }, [voucherType]);

    useEffect(() => {
        const fetchData = async () => {
            setLoadingBanks(true);
            setLoadingMaterials(true);
            try {
                const [bankRes, matRes] = await Promise.all([
                    bankAPI.getAllBanks(),
                    inventoryAPI.getAllMaterials()
                ]);
                
                if (bankRes?.data) setBanks(bankRes.data);
                if (matRes?.data) setMaterials(matRes.data);
            } catch (err) {
                console.error("Error fetching data:", err);
                toast.error("Failed to load initial data.");
            } finally {
                setLoadingBanks(false);
                setLoadingMaterials(false);
            }
        };
        fetchData();
    }, []);

    const handleBack = () => {
        setSelectedVoucherType(null);
        dispatch(setActiveModule('vouchers'));
    };

    // Item handlers
    const handleAddItem = () => {
        setItems([...items, { id: Date.now(), description: '', quantity: 1, rate: 0 }]);
    };

    const handleRemoveItem = (id) => {
        if (items.length > 1) {
            setItems(items.filter(i => i.id !== id));
        }
    };

    const handleItemChange = (id, field, value) => {
        setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
    };

    // Account handlers
    const handleAddAccount = () => {
        setAccounts([...accounts, { id: Date.now(), bankId: '', amount: 0 }]);
    };

    const handleRemoveAccount = (id) => {
        if (accounts.length > 1) {
            setAccounts(accounts.filter(a => a.id !== id));
        }
    };

    const handleAccountChange = (id, field, value) => {
        setAccounts(accounts.map(a => a.id === id ? { ...a, [field]: value } : a));
    };

    const totalItemsAmount = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.rate)), 0);
    const totalAccountsAmount = accounts.reduce((sum, acc) => sum + (Number(acc.amount) || 0), 0);

    const handleSave = async (e) => {
        e.preventDefault();
        
        // Validation
        const validAccounts = accounts.filter(a => a.bankId && a.amount > 0);
        const validItems = items.filter(i => i.description && i.quantity > 0 && i.rate > 0);

        if (validAccounts.length === 0 && voucherType !== 'journal') {
            toast.error("Please add at least one valid bank account entry with an amount.");
            return;
        }

        const payload = {
            type: voucherType,
            buyer: formData.buyer,
            seller: formData.seller,
            gstrate: formData.gstrate,
            tdsrate: formData.tdsrate,
            invoiceId: formData.invoiceId,
            entrydate: new Date(formData.entrydate).toISOString(),
            narration: formData.narration,
            itemsdetails: validItems,
            accountIds: validAccounts.map(a => ({ id: a.bankId, amount: Number(a.amount) }))
        };

        setIsSaving(true);
        try {
            await voucherAPI.createVoucher(payload);
            toast.success(`${voucherTypeNames[voucherType]} saved successfully!`);
            handleBack();
        } catch (err) {
            console.error("Error saving voucher:", err);
            toast.error("Failed to save voucher. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in relative max-w-5xl mx-auto pb-12">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleBack}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                        disabled={isSaving}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">
                            New {voucherTypeNames[voucherType]}
                        </h1>
                        <p className="text-slate-500 text-sm mt-0.5">Enter transaction details below</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleBack} className="btn-secondary" disabled={isSaving}>Cancel</button>
                    <button onClick={handleSave} disabled={isSaving} className="btn-primary flex items-center gap-2">
                        <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Voucher'}
                    </button>
                </div>
            </div>

            {/* Main Form */}
            <form onSubmit={handleSave} className="space-y-6">
                
                {/* Header Information */}
                <div className="card p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Voucher Date</label>
                        <div className="relative">
                            <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="date" 
                                required
                                value={formData.entrydate}
                                onChange={(e) => setFormData({...formData, entrydate: e.target.value})}
                                className="input pl-10 w-full"
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Invoice ID / Reference</label>
                        <div className="relative">
                            <Hash className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="e.g. INV-2026-01"
                                value={formData.invoiceId}
                                onChange={(e) => setFormData({...formData, invoiceId: e.target.value})}
                                className="input pl-10 w-full"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Buyer Name</label>
                        <div className="relative">
                            <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Enter Buyer Name"
                                value={formData.buyer}
                                onChange={(e) => setFormData({...formData, buyer: e.target.value})}
                                className="input pl-10 w-full"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Seller Name</label>
                        <div className="relative">
                            <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Enter Seller Name"
                                value={formData.seller}
                                onChange={(e) => setFormData({...formData, seller: e.target.value})}
                                className="input pl-10 w-full"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">GST Rate (%)</label>
                        <input 
                            type="number" 
                            min="0" max="100" step="0.1"
                            value={formData.gstrate}
                            onChange={(e) => setFormData({...formData, gstrate: e.target.value})}
                            className="input w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">TDS Rate (%)</label>
                        <input 
                            type="number" 
                            min="0" max="100" step="0.1"
                            value={formData.tdsrate}
                            onChange={(e) => setFormData({...formData, tdsrate: e.target.value})}
                            className="input w-full"
                        />
                    </div>
                    
                    <div className="space-y-2 md:col-span-3">
                        <label className="text-sm font-semibold text-slate-700">Narration (Optional)</label>
                        <textarea 
                            placeholder="Enter transaction narration..."
                            value={formData.narration}
                            onChange={(e) => setFormData({...formData, narration: e.target.value})}
                            className="input min-h-[80px] w-full py-2"
                        ></textarea>
                    </div>
                </div>

                {/* Items Details */}
                <div className="card overflow-hidden">
                    <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                        <h3 className="font-semibold text-slate-800">Item Details</h3>
                        <button 
                            type="button" 
                            onClick={handleAddItem}
                            className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-md transition-colors"
                        >
                            <Plus className="w-4 h-4" /> Add Item
                        </button>
                    </div>
                    
                    <div className="p-0 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-100/50 border-b border-slate-200 text-slate-600">
                                <tr>
                                    <th className="py-3 px-4 text-left font-semibold w-12">#</th>
                                    <th className="py-3 px-4 text-left font-semibold">Material</th>
                                    <th className="py-3 px-4 text-right font-semibold w-32">Quantity</th>
                                    <th className="py-3 px-4 text-right font-semibold w-40">Rate (₹)</th>
                                    <th className="py-3 px-4 text-right font-semibold w-40">Amount (₹)</th>
                                    <th className="py-3 px-4 text-center font-semibold w-16"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => (
                                    <tr key={item.id} className="border-b border-slate-100 group">
                                        <td className="py-3 px-4 text-slate-400 font-medium">{index + 1}</td>
                                        <td className="py-3 px-4">
                                            <select 
                                                value={item.description}
                                                onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                                className="input w-full border-transparent hover:border-slate-300 focus:border-emerald-500 bg-transparent hover:bg-white"
                                            >
                                                <option value="">Select Material...</option>
                                                {materials.map(m => (
                                                    <option key={m.id} value={m.itemName}>
                                                        {m.itemName}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="py-3 px-4">
                                            <input 
                                                type="number" 
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                                                className="input w-full text-right font-medium border-transparent hover:border-slate-300 focus:border-emerald-500 bg-transparent hover:bg-white"
                                            />
                                        </td>
                                        <td className="py-3 px-4">
                                            <input 
                                                type="number" 
                                                min="0" step="0.01"
                                                value={item.rate}
                                                onChange={(e) => handleItemChange(item.id, 'rate', e.target.value)}
                                                className="input w-full text-right font-medium border-transparent hover:border-slate-300 focus:border-emerald-500 bg-transparent hover:bg-white"
                                            />
                                        </td>
                                        <td className="py-3 px-4 text-right font-semibold text-slate-700">
                                            {(Number(item.quantity) * Number(item.rate)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <button 
                                                type="button"
                                                onClick={() => handleRemoveItem(item.id)}
                                                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-50/80 border-t-2 border-slate-200">
                                <tr>
                                    <td colSpan="4" className="py-4 px-4 text-right font-semibold text-slate-700">Total Items Value:</td>
                                    <td className="py-4 px-4 text-right font-bold text-slate-800 text-base">
                                        {totalItemsAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Bank Accounts */}
                <div className="card overflow-hidden">
                    <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                        <h3 className="font-semibold text-slate-800">Bank Accounts Allocation</h3>
                        <button 
                            type="button" 
                            onClick={handleAddAccount}
                            className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors"
                        >
                            <Plus className="w-4 h-4" /> Add Account
                        </button>
                    </div>
                    
                    <div className="p-0 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-100/50 border-b border-slate-200 text-slate-600">
                                <tr>
                                    <th className="py-3 px-4 text-left font-semibold w-12">#</th>
                                    <th className="py-3 px-4 text-left font-semibold">Bank Account</th>
                                    <th className="py-3 px-4 text-right font-semibold w-48">Amount (₹)</th>
                                    <th className="py-3 px-4 text-center font-semibold w-16"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {accounts.map((account, index) => (
                                    <tr key={account.id} className="border-b border-slate-100 group">
                                        <td className="py-3 px-4 text-slate-400 font-medium">{index + 1}</td>
                                        <td className="py-3 px-4">
                                            <select 
                                                value={account.bankId}
                                                onChange={(e) => handleAccountChange(account.id, 'bankId', e.target.value)}
                                                className="input w-full border-transparent hover:border-slate-300 focus:border-blue-500 bg-transparent hover:bg-white"
                                            >
                                                <option value="">Select Bank Account...</option>
                                                {banks.map(b => (
                                                    <option key={b.id} value={b.id}>
                                                        {b.bankName} - {b.accountNo} ({b.accountHolder})
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="py-3 px-4">
                                            <input 
                                                type="number" 
                                                min="0" step="0.01"
                                                placeholder="0.00"
                                                value={account.amount}
                                                onChange={(e) => handleAccountChange(account.id, 'amount', e.target.value)}
                                                className="input w-full text-right font-medium border-transparent hover:border-slate-300 focus:border-blue-500 bg-transparent hover:bg-white text-blue-700"
                                            />
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <button 
                                                type="button"
                                                onClick={() => handleRemoveAccount(account.id)}
                                                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-50/80 border-t-2 border-slate-200">
                                <tr>
                                    <td colSpan="2" className="py-4 px-4 text-right font-semibold text-slate-700">Total Accounts Amount:</td>
                                    <td className="py-4 px-4 text-right font-bold text-blue-700 text-base">
                                        {totalAccountsAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Summary Box */}
                <div className="card p-6 bg-slate-50 border-slate-200">
                    <h3 className="font-semibold text-slate-800 mb-4">Voucher Summary</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Items Total:</span>
                            <span className="font-medium text-slate-800">₹ {totalItemsAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600">GST ({formData.gstrate}%):</span>
                            <span className="font-medium text-slate-800">₹ {((totalItemsAmount * Number(formData.gstrate)) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-600">TDS ({formData.tdsrate}%):</span>
                            <span className="font-medium text-slate-800">- ₹ {((totalItemsAmount * Number(formData.tdsrate)) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="pt-3 mt-3 border-t border-slate-200 flex justify-between">
                            <span className="font-semibold text-slate-800">Net Amount:</span>
                            <span className="font-bold text-emerald-700 text-lg">
                                ₹ {(totalItemsAmount + ((totalItemsAmount * Number(formData.gstrate)) / 100) - ((totalItemsAmount * Number(formData.tdsrate)) / 100)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                </div>

            </form>
        </div>
    );
}
