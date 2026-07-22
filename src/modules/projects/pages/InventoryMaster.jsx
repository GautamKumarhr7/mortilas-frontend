import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, Package, Save, X, Box, Tag, MapPin, AlertCircle } from 'lucide-react';
import { inventoryAPI } from '../services';
import Skeleton from '../../../components/common/Skeleton';

export default function InventoryMaster() {
    const [inventories, setInventories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchInventories();
    }, []);

    const fetchInventories = async () => {
        setIsLoading(true);
        try {
            const res = await inventoryAPI.getAllInventories();
            setInventories(res?.data || res || []);
        } catch (error) {
            console.error('Error fetching inventory', error);
            toast.error('Failed to load inventory');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (isEditing && formData.id) {
                await inventoryAPI.updateInventory(formData.id, formData);
                toast.success('Item updated successfully');
            } else {
                await inventoryAPI.createInventory(formData);
                toast.success('Item added successfully');
            }
            fetchInventories();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error saving item', error);
            toast.error(error.response?.data?.message || 'Failed to save item');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;
        try {
            await inventoryAPI.deleteInventory(id);
            toast.success('Item deleted successfully');
            fetchInventories();
        } catch (error) {
            toast.error('Failed to delete item');
        }
    };

    const openAddModal = () => {
        setFormData({ status: 'in stock', unit: 'NOS' });
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setFormData(item);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const filtered = inventories.filter(c => 
        c.itemName?.toLowerCase().includes(search.toLowerCase()) ||
        c.category?.toLowerCase().includes(search.toLowerCase()) ||
        c.warehouseLocation?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Inventory Master</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage project materials and equipment stock</p>
                </div>
                <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add Inventory Item
                </button>
            </div>

            <div className="card p-4">
                <div className="relative max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                        type="text"
                        placeholder="Search items by name, category or location..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input pl-9"
                    />
                </div>
            </div>

            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="p-4 font-semibold text-slate-600">Item Details</th>
                                <th className="p-4 font-semibold text-slate-600">Location</th>
                                <th className="p-4 font-semibold text-slate-600">Pricing & HSN</th>
                                <th className="p-4 font-semibold text-slate-600">Stock Status</th>
                                <th className="p-4 font-semibold text-slate-600 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600" /></td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-500">No inventory found matching your criteria.</td>
                                </tr>
                            ) : (
                                filtered.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
                                                    <Box className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900">{item.itemName}</p>
                                                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Tag className="w-3 h-3"/> {item.category}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1 text-slate-700">
                                                <MapPin className="w-4 h-4 text-slate-400" /> {item.warehouseLocation}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <p className="font-semibold text-slate-900">₹{Number(item.price).toLocaleString()}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">HSN: {item.hsn}</p>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1.5 items-start">
                                                <p className="font-semibold text-slate-900">{item.quantity} <span className="text-xs font-normal text-slate-500">{item.unit}</span></p>
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.status === 'in stock' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : item.status === 'out of stock' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                                                    {item.status.toUpperCase()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openEditModal(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
                        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-[#1e3a34] text-white">
                            <div>
                                <h2 className="text-base font-semibold">{isEditing ? 'Edit Item' : 'Add New Item'}</h2>
                                <p className="text-xs text-white/60 mt-0.5">Project Inventory Registry</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-xs font-semibold text-slate-600">Item Name <span className="text-red-500">*</span></label>
                                    <input required name="itemName" value={formData.itemName || ''} onChange={handleInputChange} className="input" placeholder="e.g. Portland Cement 50kg" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Category <span className="text-red-500">*</span></label>
                                    <input required name="category" value={formData.category || ''} onChange={handleInputChange} className="input" placeholder="e.g. Raw Material" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">HSN Code <span className="text-red-500">*</span></label>
                                    <input required name="hsn" value={formData.hsn || ''} onChange={handleInputChange} className="input" placeholder="HSN Code" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Unit of Measurement <span className="text-red-500">*</span></label>
                                    <input required name="unit" value={formData.unit || ''} onChange={handleInputChange} className="input" placeholder="e.g. NOS, KG, TON" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Price Per Unit (₹) <span className="text-red-500">*</span></label>
                                    <input required type="number" step="any" name="price" value={formData.price || ''} onChange={handleInputChange} className="input" placeholder="0.00" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Available Quantity <span className="text-red-500">*</span></label>
                                    <input required type="number" step="any" name="quantity" value={formData.quantity || ''} onChange={handleInputChange} className="input" placeholder="0.00" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Current Status <span className="text-red-500">*</span></label>
                                    <select required name="status" value={formData.status || 'in stock'} onChange={handleInputChange} className="input">
                                        <option value="in stock">In Stock</option>
                                        <option value="stortage">Shortage</option>
                                        <option value="out of stock">Out of Stock</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-xs font-semibold text-slate-600">Warehouse / Location <span className="text-red-500">*</span></label>
                                    <input required name="warehouseLocation" value={formData.warehouseLocation || ''} onChange={handleInputChange} className="input" placeholder="e.g. Site A - Main Godown" />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
                                <button type="submit" disabled={isSaving} className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center gap-2">
                                    <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Item'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// Ensure Loader2 is imported since we used it.
