import { X } from 'lucide-react';

export default function BOQItemModal({ isOpen, isEditing, formData, onClose, onSave, onInputChange, isLoading }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-[#1e3a34] text-white">
                    <div>
                        <h2 className="text-base font-semibold">{isEditing ? 'Modify BOQ Item' : 'New BOQ Entry'}</h2>
                        <p className="text-xs text-white/60 mt-0.5">Line Item Specification</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <form onSubmit={onSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600">Bill Code</label>
                            <input required name="code" disabled={isEditing} value={formData.code || ''} onChange={onInputChange} className="input disabled:opacity-50 border-slate-200" placeholder="e.g. BILL-01" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600">Unit</label>
                            <input required type="number" name="unit" value={formData.unit || ''} onChange={onInputChange} className="input border-slate-200" placeholder="e.g. 2" />
                        </div>
                        <div className="md:col-span-2 space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600">Description of Works</label>
                            <textarea required name="description" value={formData.description || ''} onChange={onInputChange} className="input border-slate-200" rows="3" placeholder="Item description..." />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600">Contract Amount (₹)</label>
                            <input required type="number" step="any" name="contractAmount" value={formData.contractAmount || ''} onChange={onInputChange} className="input border-slate-200" placeholder="0.00" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600">Sub Rate (₹)</label>
                            <input required type="number" step="any" name="subrate" value={formData.subrate || ''} onChange={onInputChange} className="input border-slate-200" placeholder="0.00" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600">PO Quantity</label>
                            <input required type="number" step="any" name="poQuantity" value={formData.poQuantity || ''} onChange={onInputChange} className="input border-slate-200" placeholder="0.00" />
                        </div>
                        
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600">Billed Quantity</label>
                            <input required type="number" step="any" name="billedQuantity" value={formData.billedQuantity || ''} onChange={onInputChange} className="input border-slate-200" placeholder="0.00" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600">No of Contract</label>
                            <input required type="number" step="any" name="noOfContract" value={formData.noOfContract || ''} onChange={onInputChange} className="input border-slate-200" placeholder="0.00" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600">Diff Value</label>
                            <input required type="number" step="any" name="diffValue" value={formData.diffValue || ''} onChange={onInputChange} className="input border-slate-200" placeholder="0.00" />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600">Status</label>
                        <select name="status" value={formData.status || 'pending'} onChange={onInputChange} className="input border-slate-200">
                            <option value="pending">Pending</option>
                            <option value="Reconciled">Reconciled</option>
                            <option value="Over Issued">Over Issued</option>
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-100 mt-2">
                        <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                        <button type="submit" disabled={isLoading} className="btn-primary flex-1 disabled:opacity-50">
                            {isLoading ? 'Saving...' : (isEditing ? 'Update Item' : 'Add Item')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
