import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { vendorAPI } from '../../../business/services';

export default function EquipmentFormModal({ isOpen, isEditing, initialData, onClose, onSave, isSaving }) {
    const [formData, setFormData] = useState({
        category: 'Heavy Machinery',
        name: '',
        make: '',
        model: '',
        capacity: '',
        serialNumber: '',
        type: 'owned',
        purchaseDate: '',
        cost: '',
        depreciationRate: '',
        status: 'available',
        vendorId: '',
        rentalRate: ''
    });

    const [vendors, setVendors] = useState([]);

    useEffect(() => {
        if (isOpen) {
            setFormData(initialData || {
                category: 'Heavy Machinery',
                name: '',
                make: '',
                model: '',
                capacity: '',
                serialNumber: '',
                type: 'owned',
                purchaseDate: '',
                cost: '',
                depreciationRate: '',
                status: 'available',
                vendorId: '',
                rentalRate: ''
            });
            fetchVendors();
        }
    }, [isOpen, initialData]);

    const fetchVendors = async () => {
        try {
            const res = await vendorAPI.getAllVendors();
            setVendors(res?.data || res || []);
        } catch (err) {
            console.error('Failed to fetch vendors', err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/20 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl flex flex-col max-h-full overflow-hidden animate-slide-up">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div>
                        <h2 className="text-xl font-black text-slate-900">{isEditing ? 'Edit Equipment' : 'Add New Equipment'}</h2>
                        <p className="text-sm text-slate-500 font-medium">Enter details for machinery, vehicles, or tools.</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={(e) => onSave(e, formData)} className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600">Category *</label>
                            <select name="category" value={formData.category} onChange={handleChange} required className="input">
                                <option value="Heavy Machinery">Heavy Machinery</option>
                                <option value="Vehicles">Vehicles</option>
                                <option value="Power Tools">Power Tools</option>
                                <option value="Testing Equipment">Testing Equipment</option>
                                <option value="Safety Equipment">Safety Equipment</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600">Equipment Name *</label>
                            <input name="name" value={formData.name || ''} onChange={handleChange} required className="input" placeholder="e.g. Excavator 20T" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600">Ownership Type *</label>
                            <select name="type" value={formData.type} onChange={handleChange} required className="input">
                                <option value="owned">Company Owned</option>
                                <option value="hired">Hired / Rented</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600">Status</label>
                            <select name="status" value={formData.status} onChange={handleChange} className="input">
                                <option value="available">Available</option>
                                <option value="deployed">Deployed</option>
                                <option value="maintenance">Under Maintenance</option>
                                <option value="breakdown">Breakdown</option>
                                <option value="retired">Retired / Scrapped</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <h3 className="text-sm font-semibold text-[#1e3a34] mb-4">Specifications</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600">Make / Manufacturer</label>
                                <input name="make" value={formData.make || ''} onChange={handleChange} className="input" placeholder="e.g. JCB, Caterpillar" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600">Model</label>
                                <input name="model" value={formData.model || ''} onChange={handleChange} className="input" placeholder="e.g. 3DX" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600">Capacity / Specification</label>
                                <input name="capacity" value={formData.capacity || ''} onChange={handleChange} className="input" placeholder="e.g. 20 Tons, 500 KVA" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600">Serial / Reg Number</label>
                                <input name="serialNumber" value={formData.serialNumber || ''} onChange={handleChange} className="input" placeholder="VIN or Reg No" />
                            </div>
                        </div>
                    </div>

                    {formData.type === 'owned' ? (
                        <div className="pt-4 border-t border-slate-100">
                            <h3 className="text-sm font-semibold text-[#1e3a34] mb-4">Financials (Owned)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Purchase Date</label>
                                    <input type="date" name="purchaseDate" value={formData.purchaseDate ? formData.purchaseDate.split('T')[0] : ''} onChange={handleChange} className="input" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Purchase Cost (₹)</label>
                                    <input type="number" name="cost" value={formData.cost || ''} onChange={handleChange} className="input" placeholder="0.00" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Depreciation Rate (%)</label>
                                    <input type="number" step="0.1" name="depreciationRate" value={formData.depreciationRate || ''} onChange={handleChange} className="input" placeholder="15.0" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="pt-4 border-t border-slate-100 bg-amber-50/50 -mx-6 px-6 pb-6">
                            <h3 className="text-sm font-semibold text-[#1e3a34] mb-4 pt-4">Rental Details (Hired)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Vendor / Supplier</label>
                                    <select name="vendorId" value={formData.vendorId || ''} onChange={handleChange} className="input bg-white">
                                        <option value="">Select Vendor...</option>
                                        {vendors.map(v => (
                                            <option key={v.id} value={v.id}>{v.companyName}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Rental Rate (₹ / Day)</label>
                                    <input type="number" name="rentalRate" value={formData.rentalRate || ''} onChange={handleChange} className="input bg-white" placeholder="0.00" />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
                        <button type="button" onClick={onClose} disabled={isSaving} className="btn-secondary flex-1">Cancel</button>
                        <button type="submit" disabled={isSaving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                            {isSaving
                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                                : (isEditing ? 'Update Equipment' : 'Add Equipment')
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
