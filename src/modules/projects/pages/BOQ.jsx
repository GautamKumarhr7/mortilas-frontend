import React, { useState, useMemo, useEffect } from 'react';
import { Download, Filter } from 'lucide-react';
import Skeleton from '../../../components/common/Skeleton';
import { useApp } from '../../../hooks/useApp';
import { boqAPI } from '../services';
import toast from 'react-hot-toast';
import { confirmToast } from '../../../utils/toastUtils';

// Components
import BOQStats from '../components/boq/BOQStats';
import BOQFilters from '../components/boq/BOQFilters';
import BOQTable from '../components/boq/BOQTable';
import BOQItemModal from '../components/boq/BOQItemModal';

export default function BOQ() {
    const { projects } = useApp();

    // UI/State Managers
    const [search, setSearch] = useState('');
    const [selectedProject, setSelectedProject] = useState('SWPL-BRGF');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    
    // API Data Tracking
    const [bills, setBills] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Initial Fetch when component mounts
    useEffect(() => {
        fetchBills();
    }, []);

    const fetchBills = async () => {
        setIsLoadingData(true);
        try {
            const res = await boqAPI.getAllBills();
            // The backend returns an object with a "bills" key
            setBills(Array.isArray(res.data) ? res.data : (res.data?.bills || res.data?.data || []));
        } catch (error) {
            console.error("Failed to fetch BOQ", error);
            toast.error("Could not fetch Bills from backend");
        } finally {
            setIsLoadingData(false);
        }
    };

    // 1. Filtered Data Computation
    const filteredItems = useMemo(() => {
        return (bills || []).filter(item => {
            if (!item) return false;
            const matchCode = item.code ? String(item.code).toLowerCase() : '';
            const matchDesc = item.description ? String(item.description).toLowerCase() : '';
            const query = search ? String(search).toLowerCase() : '';
            return matchCode.includes(query) || matchDesc.includes(query);
        });
    }, [bills, search]);

    // 2. Dynamic Dashboard Stats
    const stats = useMemo(() => {
        const totalItems = bills.length;
        const reconciled = bills.filter(i => i.status === 'Reconciled').length;
        const overIssued = bills.filter(i => i.status === 'Over Issued').length;
        
        // Summing up (ContractAmount) values assuming they represent the gross impact
        const totalValue = bills.reduce((sum, i) => sum + (Number(i.contractAmount) || 0), 0);
        return { 
            totalItems, 
            reconciled, 
            overIssued, 
            totalValue: (totalValue / 100000).toFixed(1) // In Lakhs
        };
    }, [bills]);

    // 3. Form Input Tracker
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // 4. Modal Triggers
    const handleAddItem = () => {
        setIsEditing(false);
        setFormData({ status: 'pending', unit: 0, contractAmount: 0, subrate: 0, poQuantity: 0, billedQuantity: 0, noOfContract: 0, diffValue: 0 });
        setIsModalOpen(true);
    };

    const handleEditItem = (item) => {
        setIsEditing(true);
        setFormData({ ...item });
        setIsModalOpen(true);
    };

    // 5. Delete Logic (API)
    const handleDeleteItem = async (id) => {
        confirmToast('Remove this line item from BOQ?', async () => {
            try {
                await boqAPI.deleteBill(id);
                setBills(prev => prev.filter(i => i.id !== id));
                toast.success("BOQ item removed");
            } catch {
                toast.error("Failed to delete bill");
            }
        });
    };

    // 6. Primary Save API Form Handler
    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        
        try {
            // Reformat payload accurately string/number casts matching the backend expectations you provided
            const payload = {
                code: formData.code,
                description: formData.description,
                unit: Number(formData.unit),
                contractAmount: Number(formData.contractAmount),
                subrate: Number(formData.subrate),
                poQuantity: Number(formData.poQuantity),
                billedQuantity: Number(formData.billedQuantity),
                noOfContract: Number(formData.noOfContract),
                diffValue: Number(formData.diffValue),
                status: formData.status || 'pending'
            };

            if (isEditing && formData.id) {
                // Update specific resource
                const res = await boqAPI.updateBill(formData.id, payload);
                const updated = res.data?.data || res.data;
                // Merge state natively 
                setBills(bills.map(i => i.id === formData.id ? { ...i, ...updated } : i));
                toast.success('BOQ item updated mapped!');
            } else {
                // Post to /bills payload
                const res = await boqAPI.createBill(payload);
                const added = res.data?.data || res.data || payload; 
                setBills([added, ...bills]); // Append at array start natively
                toast.success('Item Enrolled in BOQ Backend API!');
            }
            
            // Clean up UI context globally
            setIsModalOpen(false);
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Action failed!');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-5 animate-fade-in pb-12">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Bill of Quantities / BOQ</h1>
                    <p className="text-sm text-slate-500 mt-1">Material reconciliation & contract rate live tracker linked to API</p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="btn-secondary flex items-center gap-1.5">
                        <Download className="w-4 h-4" /> Export Excel
                    </button>
                    <button className="btn-secondary flex items-center gap-1.5">
                        <Filter className="w-4 h-4" /> Filter
                    </button>
                </div>
            </div>

            {/* Filter Controls Row */}
            <BOQFilters 
                projects={projects}
                selectedProject={selectedProject}
                onProjectChange={setSelectedProject}
                search={search}
                onSearchChange={setSearch}
                onAddItem={handleAddItem}
            />

            {/* Overview Highlights Base Component */}
            <BOQStats 
                totalItems={stats.totalItems}
                reconciled={stats.reconciled}
                overIssued={stats.overIssued}
                totalValue={stats.totalValue}
            />

            <div className="flex items-center gap-5 px-1">
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-yellow-400" />
                    <span className="text-xs font-semibold text-slate-500">Pending</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs font-semibold text-slate-500">Reconciled (≤2% variance)</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-xs font-semibold text-slate-500">Over Issued</span>
                </div>
            </div>

            {/* Table Dynamic Loader Mapping */}
            {isLoadingData ? (
                <div className="card overflow-hidden">
                    <div className="p-6 space-y-4">
                        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                           <Skeleton variant="text" className="w-1/3" />
                           <Skeleton variant="badge" />
                        </div>
                        <div className="space-y-3 px-2">
                           {Array.from({ length: 4 }).map((_, i) => (
                               <div key={i} className="flex gap-6 py-2 border-b border-slate-50 last:border-0 items-center">
                                   <Skeleton variant="text" className="w-12" />
                                   <div className="flex-1 space-y-1">
                                       <Skeleton variant="text" className="w-3/4" />
                                       <Skeleton variant="text" className="w-1/2" />
                                   </div>
                                   <Skeleton variant="text" className="w-20" />
                                   <Skeleton variant="button" className="w-24" />
                               </div>
                           ))}
                        </div>
                    </div>
                </div>
            ) : (
                <BOQTable 
                    items={filteredItems}
                    onEdit={handleEditItem}
                    onDelete={handleDeleteItem}
                />
            )}

            {/* Editing / Push UI Rendered Layer Modal Box */}
            <BOQItemModal 
                isOpen={isModalOpen}
                isEditing={isEditing}
                formData={formData}
                isLoading={isSaving}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                onInputChange={handleInputChange}
            />
        </div>
    );
}
