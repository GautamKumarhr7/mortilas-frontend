import { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, ClipboardList, AlertCircle, TrendingUp, CheckCircle2, RefreshCw } from 'lucide-react';
import { useApp } from '../../../hooks/useApp';
import toast from 'react-hot-toast';
import { confirmToast } from '../../../utils/toastUtils';
import { workOrderAPI, projectAPI, siteAPI } from '../services';
import { subcontractorAPI } from '../../operations/services';

// Sub-components
import WorkOrderStats from '../components/workorders/WorkOrderStats';
import WorkOrderFilters from '../components/workorders/WorkOrderFilters';
import WorkOrderTable from '../components/workorders/WorkOrderTable';
import WorkOrderModal from '../components/workorders/WorkOrderModal';
import WorkOrderDetailSidebar from '../components/workorders/WorkOrderDetailSidebar';

export default function WorkOrders() {
    const { projects: contextProjects } = useApp();

    // Local state — data comes from API, not AppContext
    const [workOrders, setWorkOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // UI States
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('All');
    const [subcontractors, setSubcontractors] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedWO, setSelectedWO] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [projectList, setProjectList] = useState([]);
    const [siteList, setSiteList] = useState([]);

    // ─── Fetch all work orders ────────────────────────────────────────────────
    const fetchWorkOrders = useCallback(async () => {
        setIsLoading(true);
        try {
            const [data, subRes] = await Promise.all([
                workOrderAPI.getAllWorkOrders(),
                subcontractorAPI.getAllSubcontractors().catch(() => [])
            ]);
            
            const list = Array.isArray(data)
                ? data
                : Array.isArray(data?.data)
                ? data.data
                : Array.isArray(data?.works)
                ? data.works
                : [];
            
            setSubcontractors(subRes?.data || subRes || []);
            // Newest first
            setWorkOrders([...list].reverse());
        } catch (error) {
            console.error('Failed to fetch work orders:', error);
            toast.error(error.response?.data?.message || 'Failed to load work orders.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await projectAPI.getAllProjects();
            const list = res?.data?.data || res?.data || [];
            setProjectList(Array.isArray(list) ? list : []);
        } catch (error) {
            console.error('Fetch projects error:', error);
        }
    };

    const fetchSites = async () => {
        try {
            const res = await siteAPI.getAllSites();
            const list = res?.data?.data || res?.data || res || [];
            setSiteList(Array.isArray(list) ? list : []);
        } catch (error) {
            console.error('Fetch sites error:', error);
        }
    };

    useEffect(() => {
        fetchWorkOrders();
        fetchProjects();
        fetchSites();
    }, [fetchWorkOrders]);

    // ─── Derived / memoised ───────────────────────────────────────────────────
    const filteredWOs = useMemo(() => {
        return workOrders.filter(wo => {
            const matchesSearch = 
                (wo.workOrderNo || '').toLowerCase().includes(search.toLowerCase()) ||
                (wo.title || '').toLowerCase().includes(search.toLowerCase());
            const matchesFilter = filter === 'All' || (wo.status || '').toLowerCase() === filter.toLowerCase();
            return matchesSearch && matchesFilter;
        });
    }, [workOrders, search, filter]);

    const stats = useMemo(() => {
        const totalVal = workOrders.reduce((sum, wo) => sum + Number(wo.estimatedCost || 0), 0);
        const activeCount = workOrders.filter(wo => (wo.status || '').toLowerCase() === 'approved').length;
        const pendingCount = workOrders.filter(wo => (wo.status || '').toLowerCase() === 'pending').length;
        const avgProgress = workOrders.length
            ? Math.round(workOrders.reduce((s, wo) => s + Number(wo.progress || 0), 0) / workOrders.length)
            : 0;
        return [
            { label: 'Total Value', value: `₹${(totalVal / 100000).toFixed(1)}L`, icon: ClipboardList, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Active Orders', value: activeCount, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Pending Approval', value: pendingCount, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Execution Rate', value: `${avgProgress}%`, icon: CheckCircle2, color: 'text-purple-600', bg: 'bg-purple-50' },
        ];
    }, [workOrders]);

    // ─── Handlers ─────────────────────────────────────────────────────────────
    const handleOpenAdd = () => {
        setIsEditing(false);
        setFormData({ status: 'pending', type: 'Rate Contract', retention: 5 });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (e, wo) => {
        e.stopPropagation();
        setIsEditing(true);
        setFormData({ ...wo });
        setIsModalOpen(true);
    };

    const handleViewDetails = (wo) => {
        setSelectedWO(wo);
        setIsDetailOpen(true);
    };

    const handleDelete = (e, wo) => {
        e.stopPropagation();
        const id = wo.id || wo._id;
        confirmToast('Delete this work order permanently?', async () => {
            try {
                await workOrderAPI.deleteWorkOrder(id);
                setWorkOrders(prev => prev.filter(w => (w.id || w._id) !== id));
                toast.success('Work Order deleted');
            } catch (error) {
                console.error('Delete work order error:', error);
                toast.error(error.response?.data?.message || 'Failed to delete work order.');
            }
        });
    };

    const handleSave = async (e, childData = null) => {
        e?.preventDefault();
        setIsSaving(true);
        try {
            const dataToSave = { ...formData, ...(childData || {}) };
            
            // Build the exact payload the API expects
            const payload = {
                projectId: Number(dataToSave.projectId),
                siteId: dataToSave.siteId ? Number(dataToSave.siteId) : null,
                title: dataToSave.title || '',
                subcontractorId: dataToSave.subcontractorId || null,
                description: dataToSave.description || '',
                estimatedCost: Number(dataToSave.estimatedCost || 0),
                startDate: dataToSave.startDate || null,
                endDate: dataToSave.endDate || null,
                progress: Number(dataToSave.progress || 0),
                status: (dataToSave.status || 'pending').toLowerCase(),
                boqItems: dataToSave.boqItems || [],
                billingMilestones: dataToSave.billingMilestones || [],
                approvals: dataToSave.approvals || { siteEngineer: false, projectManager: false, departmentHead: false },
            };

            if (isEditing) {
                const id = formData.id || formData._id;
                await workOrderAPI.updateWorkOrder(id, payload);
                toast.success('Work Order updated!');
            } else {
                await workOrderAPI.createWorkOrder(payload);
                toast.success('Work Order created!');
            }

            setIsModalOpen(false);
            // Re-fetch to get authoritative data from backend
            await fetchWorkOrders();
        } catch (error) {
            console.error('Save work order error:', error);
            toast.error(error.response?.data?.message || 'Failed to save work order.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                        <ClipboardList className="w-6 h-6 text-slate-700" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Work Order Management</h1>
                        <p className="text-sm text-slate-500 mt-1">Allocation of scope & subcontracting control</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchWorkOrders}
                        title="Refresh"
                        className="p-2 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-all"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button onClick={handleOpenAdd} className="btn-primary whitespace-nowrap flex items-center gap-1.5">
                        <Plus className="w-5 h-5" /> Issue New Order
                    </button>
                </div>
            </div>

            <WorkOrderStats stats={stats} />

            <WorkOrderFilters
                search={search}
                setSearch={setSearch}
                filter={filter}
                setFilter={setFilter}
            />

            {/* Loading skeleton */}
            {isLoading ? (
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    {['WO ID', 'Description', 'Contractor', 'Value', 'Progress', 'Status', 'Actions'].map(h => (
                                        <th key={h} className="table-header">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {[1, 2, 3, 4].map(i => (
                                    <tr key={i} className="border-b border-slate-100">
                                        {[1, 2, 3, 4, 5, 6, 7].map(j => (
                                            <td key={j} className="table-cell">
                                                <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4" />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <WorkOrderTable
                    workOrders={filteredWOs}
                    subcontractors={subcontractors}
                    onEdit={handleOpenEdit}
                    onDelete={handleDelete}
                    onViewDetails={handleViewDetails}
                />
            )}

            <WorkOrderModal
                isOpen={isModalOpen}
                isEditing={isEditing}
                formData={formData}
                projects={projectList}
                sites={siteList}
                isSaving={isSaving}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                onInputChange={handleInputChange}
            />

            <WorkOrderDetailSidebar
                isOpen={isDetailOpen}
                workOrder={selectedWO}
                onClose={() => setIsDetailOpen(false)}
                onEdit={(e, wo) => { handleOpenEdit(e, wo); setIsDetailOpen(false); }}
            />
        </div>
    );
}
