import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../../../hooks/useApp';
import { purchaseOrderAPI, inventoryAPI, materialIndentAPI } from '../../services';
import { vendorAPI } from '../../../business/services';
import toast from 'react-hot-toast';

export default function POModal({ isOpen, onClose, onSave }) {
  const { projects } = useApp();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ vendorId: '', indentId: '', projectId: '' });
  const [items, setItems] = useState([]);
  
  const [vendors, setVendors] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [indents, setIndents] = useState([]);

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        vendorAPI.getAllVendors().catch(() => []),
        inventoryAPI.getAllMaterials().catch(() => []),
        materialIndentAPI.getAllMaterialIndents().catch(() => [])
      ]).then(([vRes, mRes, iRes]) => {
        setVendors(Array.isArray(vRes) ? vRes : (vRes?.data || []));
        setMaterials(Array.isArray(mRes) ? mRes : (mRes?.data || []));
        setIndents(Array.isArray(iRes) ? iRes : (iRes?.data || []));
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vendorId) {
      toast.error('Please enter Vendor ID');
      return;
    }
    if (items.length === 0) {
      toast.error('Please add at least one PO item');
      return;
    }

    for (let item of items) {
      if (!item.itemId || !item.quantity || !item.rate) {
        toast.error('Please fill Material ID, Qty, and Rate for all items');
        return;
      }
    }

    setIsSaving(true);
    try {
      const payload = {
        vendorId: formData.vendorId,
        indentId: formData.indentId,
        projectId: formData.projectId,
        items: items.map(item => ({
          itemId: parseInt(item.itemId, 10),
          approvedMake: item.approvedMake,
          quantity: item.quantity,
          rate: item.rate,
        }))
      };
      
      await purchaseOrderAPI.createPurchaseOrder(payload);
      toast.success('Purchase Order created successfully!');
      onSave && onSave();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || 'Failed to create PO');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-800 tracking-tight">Create Purchase Order</h2>
          <button onClick={onClose} className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Vendor</label>
              <select required className="input w-full" value={formData.vendorId} onChange={e => setFormData({...formData, vendorId: e.target.value})}>
                <option value="">Select Vendor...</option>
                {vendors.map(v => {
                    const actualVendor = v.vendor || v;
                    return (
                      <option key={actualVendor.id || actualVendor._id} value={actualVendor.id || actualVendor._id}>
                          {actualVendor.companyName || actualVendor.name || actualVendor.vendorName || `Vendor #${actualVendor.id || actualVendor._id}`}
                      </option>
                    )
                })}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Against Indent (Optional)</label>
              <select className="input w-full" value={formData.indentId} onChange={e => setFormData({...formData, indentId: e.target.value})}>
                <option value="">Select Indent...</option>
                {indents.map(ind => (
                    <option key={ind.id || ind._id} value={ind.id || ind._id}>
                        {ind.indentNo || `Indent #${ind.id || ind._id}`}
                    </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3 border-b pb-2">
                <h3 className="text-sm font-bold text-slate-800">PO Items</h3>
                <button type="button" onClick={() => setItems([...items, { itemId: '', quantity: '', rate: '', approvedMake: '' }])} className="text-xs font-bold text-[#2f6645] flex items-center gap-1 hover:bg-emerald-50 px-2 py-1 rounded">
                    <Plus className="w-3 h-3" /> Add Item
                </button>
            </div>
            
            <div className="space-y-2">
                {items.length === 0 ? <p className="text-xs text-slate-400 italic">No PO items added yet.</p> : items.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <select className="input text-xs flex-[2]" value={item.itemId} onChange={e => {
                            const newItems = [...items]; newItems[idx].itemId = e.target.value; setItems(newItems);
                        }}>
                            <option value="">Select Material...</option>
                            {materials.map(m => (
                                <option key={m.id || m._id} value={m.id || m._id}>
                                    {m.itemName || m.name || m.description || `Item #${m.id || m._id}`}
                                </option>
                            ))}
                        </select>
                        <select className="input text-xs flex-[1]" value={item.unit || ''} onChange={e => {
                            const newItems = [...items]; newItems[idx].unit = e.target.value; setItems(newItems);
                        }}>
                            <option value="">Unit</option>
                            <option value="Nos">Nos</option>
                            <option value="Kgs">Kgs</option>
                            <option value="Mtrs">Mtrs</option>
                            <option value="Ltrs">Ltrs</option>
                            <option value="Tons">Tons</option>
                        </select>
                        <input className="input text-xs flex-[2]" placeholder="Make (e.g. L&T)" value={item.approvedMake} onChange={e => {
                            const newItems = [...items]; newItems[idx].approvedMake = e.target.value; setItems(newItems);
                        }} />
                        <input type="number" className="input text-xs flex-[1]" placeholder="Qty" value={item.quantity} onChange={e => {
                            const newItems = [...items]; newItems[idx].quantity = e.target.value; setItems(newItems);
                        }} />
                        <input type="number" className="input text-xs flex-[1]" placeholder="Rate" value={item.rate} onChange={e => {
                            const newItems = [...items]; newItems[idx].rate = e.target.value; setItems(newItems);
                        }} />
                        <button type="button" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="p-1.5 text-slate-400 hover:text-red-500 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                ))}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-white">
            <button type="button" onClick={onClose} className="btn-secondary px-6">Cancel</button>
            <button type="submit" disabled={isSaving} className="btn-primary flex items-center gap-2 px-6">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? 'Generating PO...' : 'Generate PO'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
