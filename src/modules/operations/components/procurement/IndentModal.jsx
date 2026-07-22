import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../../../hooks/useApp';
import { inventoryAPI, materialIndentAPI } from '../../services';
import { workOrderAPI } from '../../../projects/services';
import toast from 'react-hot-toast';

export default function IndentModal({ isOpen, onClose, onSave }) {
  const { userProfile } = useApp();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ workOrderId: '', requestedBy: userProfile?.id || userProfile?._id || '' });
  const [items, setItems] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [apiWorkOrders, setApiWorkOrders] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({ ...prev, requestedBy: userProfile?.id || userProfile?._id || '' }));
      Promise.all([
        inventoryAPI.getAllMaterials().catch(() => []),
        workOrderAPI.getAllWorkOrders().catch(() => [])
      ]).then(([resMat, resWo]) => {
        setMaterials(Array.isArray(resMat) ? resMat : (resMat?.data || []));
        setApiWorkOrders(Array.isArray(resWo) ? resWo : (resWo?.data || []));
      }).catch(console.error);
    }
  }, [isOpen, userProfile]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.workOrderId) {
      toast.error('Please select a Work Order');
      return;
    }
    if (items.length === 0) {
      toast.error('Please add at least one material');
      return;
    }
    
    // Validate items
    for (let item of items) {
      if (!item.itemId || !item.requiredQty) {
        toast.error('Please fill all material details');
        return;
      }
    }

    setIsSaving(true);
    try {
      const payload = {
        workOrderId: formData.workOrderId,
        requestedBy: formData.requestedBy,
        items: items.map(item => ({
          itemId: parseInt(item.itemId, 10),
          requiredQty: parseInt(item.requiredQty, 10),
        }))
      };
      
      await materialIndentAPI.createMaterialIndent(payload);
      toast.success('Material Indent raised successfully!');
      onSave && onSave();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || 'Failed to raise indent');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-800 tracking-tight">Raise Material Indent</h2>
          <button onClick={onClose} className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Project / Work Order</label>
              <select className="input w-full" value={formData.workOrderId} onChange={e => setFormData({...formData, workOrderId: e.target.value})}>
                <option value="">Select Work Order...</option>
                {apiWorkOrders?.map(wo => (
                  <option key={wo.id || wo._id} value={wo.id || wo._id}>
                    {wo.workOrderNo || wo.title || wo.description || `Work Order #${wo.id || wo._id}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Requested By (User ID)</label>
              <input type="text" className="input w-full bg-slate-50 cursor-not-allowed" value={formData.requestedBy} readOnly disabled />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3 border-b pb-2">
                <h3 className="text-sm font-bold text-slate-800">Materials Required</h3>
                <button type="button" onClick={() => setItems([...items, { itemId: '', requiredQty: '' }])} className="text-xs font-bold text-[#2f6645] flex items-center gap-1 hover:bg-emerald-50 px-2 py-1 rounded">
                    <Plus className="w-3 h-3" /> Add Item
                </button>
            </div>
            
            <div className="space-y-2">
                {items.length === 0 ? <p className="text-xs text-slate-400 italic">No materials added yet.</p> : items.map((item, idx) => (
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
                        <input type="number" className="input text-xs flex-[1]" placeholder="Qty Required" value={item.requiredQty} onChange={e => {
                            const newItems = [...items]; newItems[idx].requiredQty = e.target.value; setItems(newItems);
                        }} />
                        <button type="button" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="p-1.5 text-slate-400 hover:text-red-500 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                ))}
            </div>
            <p className="text-[10px] text-amber-600 mt-2 font-medium">Note: System will automatically allot available quantities from Inventory before creating procurement requests.</p>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-white">
            <button type="button" onClick={onClose} className="btn-secondary px-6">Cancel</button>
            <button type="submit" disabled={isSaving} className="btn-primary flex items-center gap-2 px-6">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? 'Processing...' : 'Submit Indent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
