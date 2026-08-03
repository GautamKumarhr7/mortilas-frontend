import { useState, useEffect } from 'react';
import { 
  Package, Search, Plus, Filter, Download, 
  ArrowUpRight, ArrowDownLeft, AlertCircle, 
  Layers, Warehouse, History, MoreVertical,
  ChevronRight, X, Loader2, Save,
  Trash2, Edit3, Eye, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import Skeleton from '../../../components/common/Skeleton';
import { inventoryAPI } from '../services';

export default function InventoryStore() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, name: '' });
  const [selectedItem, setSelectedItem] = useState(null);
  
  const [formData, setFormData] = useState({
    materialName: '', 
    hsn: '',
    category: 'Construction', 
    warehouseLocation: 'Main Store', 
    quantity: '', 
    quantityType: 'Nos', 
    avgPurchaseRate: ''
  });

  const fetchMaterials = async () => {
    setIsLoading(true);
    try {
        const res = await inventoryAPI.getAllMaterials();
        const data = res?.materials || res?.data?.materials || res?.data || res || [];
        setItems(Array.isArray(data) ? data : []);
    } catch (error) {
        console.error("Fetch error:", error);
        toast.error("Failed to load inventory.");
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenEdit = (item) => {
    setCurrentId(item.id);
    setFormData({
        materialName: item.materialName || item.itemName || item.name || '',
        hsn: item.hsn || '',
        category: item.category || 'Construction',
        warehouseLocation: item.warehouseLocation || item.warehouse || 'Main Store',
        quantity: item.quantity || '',
        quantityType: item.quantityType || item.unit || 'Nos',
        avgPurchaseRate: item.avgPurchaseRate || item.price || item.rate || ''
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = (item) => {
    setDeleteConfirm({ show: true, id: item.id, name: item.materialName || item.name });
  };

  const confirmDelete = async () => {
    setIsSaving(true);
    try {
        await inventoryAPI.deleteMaterial(deleteConfirm.id);
        toast.success('Record removed from store');
        fetchMaterials();
        setDeleteConfirm({ show: false, id: null, name: '' });
    } catch (error) {
        console.error("Delete error:", error);
        toast.error('Failed to remove record');
    } finally {
        setIsSaving(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const payload = {
        itemName: formData.materialName,
        category: formData.category || 'Construction',
        warehouseLocation: formData.warehouseLocation || 'Main Store',
        hsn: formData.hsn || '0000',
        quantity: Number(formData.quantity) || 0,
        unit: formData.quantityType || 'Nos',
        price: Number(formData.avgPurchaseRate) || 0,
    };
    try {
        if (isEditing) {
            await inventoryAPI.updateMaterial(currentId, payload);
            toast.success('Inventory updated');
        } else {
            await inventoryAPI.createMaterial(payload);
            toast.success('Material registered in store');
        }
        fetchMaterials();
        setIsModalOpen(false);
        setIsEditing(false);
        setFormData({ materialName: '', hsn: '', category: 'Construction', warehouseLocation: 'Main Store', quantity: '', quantityType: 'Nos', avgPurchaseRate: '' });
    } catch (error) {
        console.error("Save error:", error);
        toast.error('Failed to save material details');
    } finally {
        setIsSaving(false);
    }
  };

  const filtered = items.filter(item => {
    const matchesSearch = (item.materialName || item.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.category || '').toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === 'all' || (item.category || '').toLowerCase() === activeTab.toLowerCase();
    return matchesSearch && matchesTab;
  });

  const stats = [
    { label: 'Total Items', value: items.length, icon: Layers, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Stock Value', value: `₹${(items.reduce((a, b) => a + (Number(b.quantity || 0) * Number(b.avgPurchaseRate || b.rate || 0)), 0) / 100000).toFixed(1)}L`, icon: Warehouse, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'In Stock', value: items.filter(i => (Number(i.quantity) > 0)).length, icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Registry', value: 'Live', icon: History, color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-6 animate-fade-in dashboard-container">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Inventory & Store</h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2 px-0.5 border-l-2 border-emerald-500 ml-0.5">Stock Management & Logistics</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary flex items-center gap-2"><Download className="w-4 h-4" /> Export</button>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" /> Add Material
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="card p-5 group hover:border-emerald-200 transition-all cursor-default">
            <div className="flex justify-between items-start">
              <div className={`${s.bg} p-2.5 rounded-2xl`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">MTD</span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-black text-slate-800 tracking-tight">{s.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 bg-slate-50/50">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              className="input pl-10 h-10 text-xs font-medium" 
              placeholder="Search items, categories or codes..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1 p-1 bg-slate-200/50 rounded-xl w-fit">
            {['all', 'structures', 'cables', 'hardware'].map(t => (
              <button 
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="table-header">Item Details</th>
                <th className="table-header">Category</th>
                <th className="table-header">Stock Qty</th>
                <th className="table-header text-right">Avg Rate</th>
                <th className="table-header">Warehouse</th>
                <th className="table-header text-center whitespace-nowrap">Status</th>
                <th className="table-header text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                   <tr key={i} className="border-b border-slate-100">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-6 py-4"><Skeleton className="w-full h-4" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.map((item) => (
                <tr key={item.id} className="table-row hover:bg-slate-50 transition-colors">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-500 transition-colors uppercase text-[10px] font-black">{(item.materialName || item.itemName || item.name || '?')[0]}</div>
                      <div>
                        <p className="text-slate-900 font-bold">{item.materialName || item.itemName || item.name}</p>
                        <p className="text-[9px] font-mono text-blue-500 uppercase mt-0.5 tracking-wider">SKU-{ (item.materialName || item.itemName || item.name || '').replace(/\s+/g, '').slice(0, 6).toUpperCase()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md">{item.category}</span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-bold text-slate-700">{item.quantity}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">{item.quantityType || item.unit}</span>
                    </div>
                  </td>
                  <td className="table-cell text-right">
                    <p className="font-bold text-emerald-600 tracking-tighter">₹{(item.avgPurchaseRate || item.price || item.rate || 0).toLocaleString()}</p>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Warehouse className="w-3.5 h-3.5" />
                      <span className="font-medium">{item.warehouseLocation || item.warehouse}</span>
                    </div>
                  </td>
                  <td className="table-cell text-center">
                    <span className={`badge ${Number(item.quantity) > 10 ? 'badge-green' : Number(item.quantity) > 0 ? 'badge-yellow' : 'badge-red'} px-3 font-bold`}>
                      {Number(item.quantity) > 10 ? 'In Stock' : Number(item.quantity) > 0 ? 'Low Stock' : 'Out of Stock'}
                    </span>
                  </td>
                  <td className="table-cell text-center">
                    <div className="flex items-center justify-center gap-2">
                        <button 
                            onClick={() => setSelectedItem(item)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                        <Eye className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                        <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => handleDelete(item)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                        <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#2f6645]" /> New Material Entry
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-8">
              <div>
                <h3 className="text-[10px] font-black tracking-[0.2em] text-emerald-600 mb-6 uppercase">Inventory Identification</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-1">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Material Name <span className="text-red-500">*</span></label>
                    <input name="materialName" required className="input w-full h-12 font-bold" placeholder="e.g. Copper Wire 1.5mm" value={formData.materialName} onChange={handleInputChange} />
                  </div>
                  
                  <div className="space-y-2 md:col-span-1">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">HSN Code <span className="text-red-500">*</span></label>
                    <input name="hsn" required className="input w-full h-12 font-bold" placeholder="e.g. 7408" value={formData.hsn} onChange={handleInputChange} />
                  </div>
                  
                  <div className="space-y-2 leading-none">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Category <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <select name="category" className="input w-full h-12 appearance-none bg-white pr-10 font-bold" value={formData.category} onChange={handleInputChange}>
                            <option>Construction</option>
                            <option>Electrical</option>
                            <option>Structures</option>
                            <option>Cables</option>
                            <option>Hardware</option>
                            <option>Civil</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2 leading-none">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Warehouse Location <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <select name="warehouseLocation" className="input w-full h-12 appearance-none bg-white pr-10 font-bold" value={formData.warehouseLocation} onChange={handleInputChange}>
                            <option>Main Store</option>
                            <option>Patna Yard</option>
                            <option>Gaya Branch</option>
                            <option>Site Store - Alpha</option>
                            <option>Warehouse A - Sector 12</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-black tracking-[0.2em] text-emerald-600 mb-6 uppercase">Stock & Valuation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Quantity <span className="text-red-500">*</span></label>
                    <div className="flex gap-2">
                      <input name="quantity" required type="number" className="input flex-1 h-12 font-bold" placeholder="Qty" value={formData.quantity} onChange={handleInputChange} />
                      <div className="relative w-28">
                        <select name="quantityType" className="input w-full h-12 appearance-none bg-white pr-8 font-black text-[10px]" value={formData.quantityType} onChange={handleInputChange}>
                            <option>Nos</option>
                            <option>Sets</option>
                            <option>CKM</option>
                            <option>Mtrs</option>
                            <option>Kg</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Avg Purchase Rate (₹) <span className="text-red-500">*</span></label>
                    <input name="avgPurchaseRate" required type="number" className="input w-full h-12 font-black text-emerald-600" placeholder="0.00" value={formData.avgPurchaseRate} onChange={handleInputChange} />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end gap-4 sticky bottom-0 bg-white">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-all">Discard</button>
                <button type="submit" disabled={isSaving} className="btn-primary min-w-[180px] h-14 text-[11px] font-black uppercase tracking-widest shadow-xl shadow-emerald-900/10 flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-700">
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {isEditing ? 'Update Material' : 'Register Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Action Detail Modal (Slide-over) */}
      {selectedItem && (
        <div className="fixed inset-0 z-[250] flex justify-end bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedItem(null)}>
          <div className="bg-white w-full max-w-lg h-full shadow-2xl animate-slide-left flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-lg shadow-emerald-200">
                        <Package className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 tracking-tight">{selectedItem.materialName || selectedItem.name}</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedItem.category} • {selectedItem.warehouseLocation || selectedItem.warehouse}</p>
                    </div>
                </div>
                <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-all"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Visual Summary */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Stock</p>
                        <p className="text-2xl font-black text-slate-800">{selectedItem.quantity} <span className="text-xs font-bold text-slate-400 uppercase">{selectedItem.quantityType || selectedItem.unit}</span></p>
                    </div>
                    <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total Value</p>
                        <p className="text-2xl font-black text-emerald-600">₹{(Number(selectedItem.quantity) * Number(selectedItem.avgPurchaseRate || selectedItem.rate || 0)).toLocaleString()}</p>
                    </div>
                </div>

                {/* Audit Trail */}
                <div>
                    <h3 className="section-title mb-4 flex items-center gap-2"><History className="w-4 h-4" /> Comprehensive Audit Log</h3>
                    <div className="space-y-4">
                        {[
                            { date: '2026-03-27 14:22', type: 'Stock In', qty: '+50', user: 'Admin User', ref: 'PO-9912' },
                            { date: '2026-03-25 09:15', type: 'Issuance', qty: '-12', user: 'Store Keeper', ref: 'ISS-4401' },
                            { date: '2026-03-20 16:45', type: 'Internal Trf', qty: '-5', user: 'Admin User', ref: 'TRF-001' },
                        ].map((log, i) => (
                            <div key={i} className="flex gap-4 p-4 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-100 group">
                                <div className="flex flex-col items-center">
                                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${log.type === 'Stock In' ? 'bg-emerald-500 ring-4 ring-emerald-50' : 'bg-red-400 ring-4 ring-red-50' } shadow-sm`}></div>
                                    <div className="w-[1px] flex-1 bg-slate-100 my-1 group-last:hidden"></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <p className="text-xs font-bold text-slate-700">{log.type}</p>
                                        <span className={`text-xs font-black ${log.qty.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>{log.qty}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">By {log.user} • Ref: {log.ref}</p>
                                    <p className="text-[9px] text-slate-300 font-medium mt-1 uppercase tracking-widest">{log.date}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Stock Adjustment Form */}
                <div className="p-6 bg-[#2f6645]/5 rounded-[2rem] border border-[#2f6645]/10">
                    <h3 className="text-sm font-bold text-[#2f6645] mb-4 flex items-center gap-2">Quick Adjustment</h3>
                    <div className="space-y-4">
                        <div className="flex gap-2">
                             <button className="flex-1 py-3 bg-white border border-emerald-100 text-[#2f6645] text-[10px] font-black uppercase tracking-widest rounded-xl shadow-sm shadow-emerald-900/5 hover:bg-emerald-50 transition-all flex items-center justify-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Stock In</button>
                             <button className="flex-1 py-3 bg-white border border-red-50 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-sm shadow-red-900/5 hover:bg-red-50 transition-all flex items-center justify-center gap-1.5"><X className="w-3.5 h-3.5" /> Issuance</button>
                        </div>
                        <input className="input h-12 w-full text-xs font-bold" placeholder="Enter adjustment qty..." />
                        <button className="w-full py-4 bg-[#2f6645] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-900/10 hover:bg-[#244f35] transition-all active:scale-95">Save Transaction</button>
                    </div>
                </div>
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
                    <h3 className="text-lg font-black text-slate-800 tracking-tight">Remove Material?</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Permanent Action</p>
                </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-8">
                Are you sure you want to remove <span className="font-black text-slate-900 underline decoration-red-200">{deleteConfirm.name}</span> from the inventory store registry?
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
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Delete"}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
