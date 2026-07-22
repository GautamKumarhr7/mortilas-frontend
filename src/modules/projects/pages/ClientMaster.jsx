import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, Building2, Save, X, Phone, Mail, FileText, Hash } from 'lucide-react';
import { clientAPI } from '../services';
import Skeleton from '../../../components/common/Skeleton';

export default function ClientMaster() {
    const [clients, setClients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        setIsLoading(true);
        try {
            const res = await clientAPI.getAllClients();
            setClients(res?.data || res || []);
        } catch (error) {
            console.error('Error fetching clients', error);
            toast.error('Failed to load clients');
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
                await clientAPI.updateClient(formData.id, formData);
                toast.success('Client updated successfully');
            } else {
                await clientAPI.createClient(formData);
                toast.success('Client created successfully');
            }
            fetchClients();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error saving client', error);
            toast.error(error.response?.data?.message || 'Failed to save client');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this client?')) return;
        try {
            await clientAPI.deleteClient(id);
            toast.success('Client deleted successfully');
            fetchClients();
        } catch (error) {
            toast.error('Failed to delete client');
        }
    };

    const openAddModal = () => {
        setFormData({});
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const openEditModal = (client) => {
        setFormData(client);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const filteredClients = clients.filter(c => 
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Client Master</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage project clients and authorities</p>
                </div>
                <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add New Client
                </button>
            </div>

            <div className="card p-4">
                <div className="relative max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                        type="text"
                        placeholder="Search clients by name, email or phone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input pl-9"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="card p-6 space-y-4">
                            <Skeleton variant="title" />
                            <Skeleton variant="text" />
                            <Skeleton variant="text" />
                        </div>
                    ))
                ) : filteredClients.length === 0 ? (
                    <div className="col-span-full card p-12 text-center text-slate-500">
                        No clients found matching your search.
                    </div>
                ) : (
                    filteredClients.map(client => (
                        <div key={client.id} className="card p-6 border border-slate-200 hover:shadow-lg transition-shadow bg-white rounded-2xl relative group">
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEditModal(client)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(client.id)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-[#1e3a34] text-white rounded-xl flex items-center justify-center font-bold text-lg">
                                    {client.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-lg">{client.name}</h3>
                                    <p className="text-xs text-slate-500 truncate max-w-[200px]">{client.address}</p>
                                </div>
                            </div>
                            
                            <div className="space-y-3 mt-4 pt-4 border-t border-slate-100">
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Phone className="w-4 h-4 text-slate-400" /> {client.phone}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Mail className="w-4 h-4 text-slate-400" /> {client.email}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <FileText className="w-4 h-4 text-slate-400" /> GST: {client.gstinno}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Hash className="w-4 h-4 text-slate-400" /> PAN: {client.panno}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
                        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-[#1e3a34] text-white">
                            <div>
                                <h2 className="text-base font-semibold">{isEditing ? 'Edit Client' : 'Add New Client'}</h2>
                                <p className="text-xs text-white/60 mt-0.5">Project Master Registry</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600">Client Name <span className="text-red-500">*</span></label>
                                <input required name="name" value={formData.name || ''} onChange={handleInputChange} className="input" placeholder="e.g. Acme Corp" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Email Address <span className="text-red-500">*</span></label>
                                    <input required type="email" name="email" value={formData.email || ''} onChange={handleInputChange} className="input" placeholder="contact@client.com" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Phone Number <span className="text-red-500">*</span></label>
                                    <input required name="phone" value={formData.phone || ''} onChange={handleInputChange} className="input" placeholder="+91 XXXXX XXXXX" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">GSTIN <span className="text-red-500">*</span></label>
                                    <input required name="gstinno" value={formData.gstinno || ''} onChange={handleInputChange} className="input" placeholder="GST Number" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">PAN Number <span className="text-red-500">*</span></label>
                                    <input required name="panno" value={formData.panno || ''} onChange={handleInputChange} className="input" placeholder="PAN Number" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600">Registered Address <span className="text-red-500">*</span></label>
                                <textarea required name="address" value={formData.address || ''} onChange={handleInputChange} className="input min-h-[80px]" placeholder="Full corporate address..." />
                            </div>
                            <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
                                <button type="submit" disabled={isSaving} className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center gap-2">
                                    <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Client'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
