import { useState, useEffect, useMemo } from 'react';
import { Truck, Wrench, Search, Plus, Filter, AlertTriangle, PlayCircle } from 'lucide-react';
import { useApp } from '../../../hooks/useApp';
import toast from 'react-hot-toast';
import { confirmToast } from '../../../utils/toastUtils';
import { equipmentAPI } from '../services';

// Sub-components
import EquipmentFormModal from '../components/equipments/EquipmentFormModal';
import EquipmentDetailSidebar from '../components/equipments/EquipmentDetailSidebar';

export default function Equipments() {
    const { projects } = useApp();
    
    const [equipments, setEquipments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    
    // UI State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedEquipment, setSelectedEquipment] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    
    useEffect(() => {
        fetchEquipments();
    }, []);
    
    const fetchEquipments = async () => {
        setIsLoading(true);
        try {
            const data = await equipmentAPI.getAllEquipments();
            setEquipments(data?.data || data || []);
        } catch (error) {
            console.error('Failed to fetch equipments:', error);
            toast.error('Failed to load equipments');
        } finally {
            setIsLoading(false);
        }
    };
    
    const filteredEquipments = useMemo(() => {
        return equipments.filter(e => {
            const eq = e.equipment;
            const matchesSearch = 
                (eq.name || '').toLowerCase().includes(search.toLowerCase()) ||
                (eq.serialNumber || '').toLowerCase().includes(search.toLowerCase()) ||
                (eq.make || '').toLowerCase().includes(search.toLowerCase());
            const matchesCategory = filterCategory === 'All' || eq.category === filterCategory;
            return matchesSearch && matchesCategory;
        });
    }, [equipments, search, filterCategory]);
    
    const stats = useMemo(() => {
        const total = equipments.length;
        const deployed = equipments.filter(e => e.equipment.status === 'deployed').length;
        const maintenance = equipments.filter(e => e.equipment.status === 'maintenance' || e.equipment.status === 'breakdown').length;
        return { total, deployed, maintenance };
    }, [equipments]);
    
    const handleSave = async (e, formData) => {
        e?.preventDefault();
        setIsSaving(true);
        try {
            const payload = {
                category: formData.category,
                name: formData.name,
                make: formData.make || null,
                model: formData.model || null,
                capacity: formData.capacity || null,
                serialNumber: formData.serialNumber || null,
                type: formData.type || 'owned',
                purchaseDate: formData.purchaseDate || null,
                cost: formData.cost ? Number(formData.cost) : null,
                depreciationRate: formData.depreciationRate ? Number(formData.depreciationRate) : null,
                status: formData.status || 'available',
                vendorId: formData.vendorId || null,
                rentalRate: formData.rentalRate ? Number(formData.rentalRate) : null,
            };
            
            if (formData.id) {
                await equipmentAPI.updateEquipment(formData.id, payload);
                toast.success('Equipment updated!');
            } else {
                await equipmentAPI.createEquipment(payload);
                toast.success('Equipment added!');
            }
            
            setIsModalOpen(false);
            fetchEquipments();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to save equipment');
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleViewDetails = async (equipmentWrapper) => {
        try {
            toast.loading('Loading details...', { id: 'eqDetails' });
            const res = await equipmentAPI.getEquipmentById(equipmentWrapper.equipment.id);
            setSelectedEquipment(res.data);
            setIsDetailOpen(true);
            toast.dismiss('eqDetails');
        } catch (err) {
            toast.error('Failed to load equipment details');
            toast.dismiss('eqDetails');
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        confirmToast(
            'Delete Equipment',
            'Are you sure you want to remove this equipment?',
            async () => {
                try {
                    await equipmentAPI.deleteEquipment(id);
                    toast.success('Equipment deleted');
                    fetchEquipments();
                } catch (err) {
                    toast.error('Failed to delete equipment');
                }
            }
        );
    };
    
    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto mb-20 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Truck className="w-7 h-7 text-emerald-600" />
                        Assets & Equipments
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Manage machinery, vehicles, and tools deployment.</p>
                </div>
                
                <button onClick={() => { setSelectedEquipment(null); setIsModalOpen(true); }} className="btn-primary flex items-center gap-2">
                    <Plus className="w-5 h-5" /> Add Equipment
                </button>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card p-5 bg-white border-slate-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Wrench className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Assets</p>
                        <p className="text-2xl font-black text-slate-900">{stats.total}</p>
                    </div>
                </div>
                <div className="card p-5 bg-emerald-50 border-emerald-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <PlayCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Active Deployed</p>
                        <p className="text-2xl font-black text-emerald-900">{stats.deployed}</p>
                    </div>
                </div>
                <div className="card p-5 bg-amber-50 border-amber-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Under Maintenance</p>
                        <p className="text-2xl font-black text-amber-900">{stats.maintenance}</p>
                    </div>
                </div>
            </div>
            
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search make, model, serial..."
                        className="input pl-10 w-full bg-white shadow-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                    {['All', 'Heavy Machinery', 'Vehicles', 'Power Tools', 'Testing Equipment', 'Safety Equipment'].map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilterCategory(cat)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                                filterCategory === cat 
                                ? 'bg-slate-900 text-white shadow-md' 
                                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>
            
            {/* Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="table-header">Asset Identity</th>
                                <th className="table-header">Category / Type</th>
                                <th className="table-header">Current Status</th>
                                <th className="table-header">Deployment</th>
                                <th className="table-header text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-500 font-medium animate-pulse">Loading equipments...</td>
                                </tr>
                            ) : filteredEquipments.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-500 font-medium">No equipment found.</td>
                                </tr>
                            ) : (
                                filteredEquipments.map((wrap) => {
                                    const eq = wrap.equipment;
                                    return (
                                        <tr key={eq.id} onClick={() => handleViewDetails(wrap)} className="table-row hover:bg-slate-50 transition-colors cursor-pointer">
                                            <td className="table-cell">
                                                <p className="font-bold text-slate-900">{eq.name}</p>
                                                <p className="text-xs text-slate-500">{eq.make} {eq.model} • S/N: {eq.serialNumber || 'N/A'}</p>
                                            </td>
                                            <td className="table-cell">
                                                <span className="px-2.5 py-1 bg-slate-100 text-slate-600 font-semibold text-xs rounded-md">{eq.category}</span>
                                                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">{eq.type}</p>
                                            </td>
                                            <td className="table-cell">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                    eq.status === 'available' ? 'bg-blue-50 text-blue-600' :
                                                    eq.status === 'deployed' ? 'bg-emerald-50 text-emerald-600' :
                                                    'bg-amber-50 text-amber-600'
                                                }`}>
                                                    {eq.status}
                                                </span>
                                            </td>
                                            <td className="table-cell">
                                                {eq.status === 'deployed' && wrap.projectCode ? (
                                                    <p className="text-sm font-bold text-slate-800">{wrap.projectCode}</p>
                                                ) : (
                                                    <p className="text-sm text-slate-400">—</p>
                                                )}
                                            </td>
                                            <td className="table-cell text-right space-x-2">
                                                <button onClick={(e) => { e.stopPropagation(); setSelectedEquipment({ equipment: eq }); setIsModalOpen(true); }} className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">Edit</button>
                                                <button onClick={(e) => handleDelete(e, eq.id)} className="text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 px-3 py-1.5 rounded-lg transition-colors">Delete</button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <EquipmentFormModal 
                    isOpen={isModalOpen}
                    isEditing={!!selectedEquipment}
                    initialData={selectedEquipment?.equipment}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    isSaving={isSaving}
                />
            )}

            {isDetailOpen && selectedEquipment && (
                <EquipmentDetailSidebar
                    isOpen={isDetailOpen}
                    data={selectedEquipment}
                    onClose={() => { setIsDetailOpen(false); setSelectedEquipment(null); }}
                    onRefresh={() => handleViewDetails({ equipment: selectedEquipment.equipment })}
                />
            )}
        </div>
    );
}
