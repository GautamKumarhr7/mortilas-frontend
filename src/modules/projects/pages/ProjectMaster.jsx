import { useState, useMemo, useEffect } from 'react';
import { Plus, MapPin, Building2, TrendingUp, BarChart3, DollarSign, Loader2 } from 'lucide-react';
import Skeleton from '../../../components/common/Skeleton';
import { projectAPI } from '../services';
import toast from 'react-hot-toast';
import { confirmToast } from '../../../utils/toastUtils';

// Sub-components
import ProjectStats from '../components/projects/ProjectStats';
import ProjectFilters from '../components/projects/ProjectFilters';
import ProjectTable from '../components/projects/ProjectTable';
import ProjectModal from '../components/projects/ProjectModal';
import ProjectDetailSidebar from '../components/projects/ProjectDetailSidebar';
import ProjectGanttModal from '../components/projects/ProjectGanttModal';

export default function ProjectMaster() {
    // API State Managers
    const [projectsList, setProjectsList] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Search & Filter State
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    
    // UI Modal/Sidebar State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedProj, setSelectedProj] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});

    // API Initialization hook
    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        setIsLoadingData(true);
        try {
            const res = await projectAPI.getAllProjects();
            // Map according to common backend frameworks responding array, or { data }, or { projects }
            const payloadArray = Array.isArray(res.data) ? res.data : (res.data?.projects || res.data?.data || []);
            setProjectsList(payloadArray);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load backend projects API");
        } finally {
            setIsLoadingData(false);
        }
    }

    // 1. Filtered Projects List
    const filteredProjects = useMemo(() => {
        return (projectsList || []).filter(p => {
            if (!p) return false;
            const matchName = p.name ? String(p.name).toLowerCase() : '';
            const matchCode = p.projectCode ? String(p.projectCode).toLowerCase() : '';
            const matchClient = p.clientId ? String(p.clientId).toLowerCase() : '';
            const query = search ? String(search).toLowerCase() : '';

            const passesSearch = matchName.includes(query) || matchCode.includes(query) || matchClient.includes(query);
            // Ignore status filter if 'All', otherwise match Draft/Active etc
            const passesStatus = statusFilter === 'All' || p.status === statusFilter;
            return passesSearch && passesStatus;
        });
    }, [projectsList, search, statusFilter]);

    const stats = useMemo(() => {
        const _values = projectsList.reduce((sum, p) => sum + (Number(p.contractValue) || 0), 0);
        // advancement doesn't exist natively, we might need a derived metric
        const _progressSum = 0; 
        const avgProg = 0;
        const totalValueFormatted = (`₹${(_values / 100000).toFixed(2)}L`);

        return [
            { label: 'Total Projects', value: projectsList.length, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Active Projects', value: projectsList.filter(p => p.status === 'Active').length, icon: MapPin, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Contract Value', value: totalValueFormatted, icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Avg. Advancement', value: `${avgProg}%`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
        ];
    }, [projectsList]);

    // 3. Handlers
    const handleOpenAdd = () => {
        setIsEditing(false);
        setFormData({ 
            process: 'RUNNING', 
            status: 'Draft', 
            category: 'Civil', 
            projectCodeYear: new Date().getFullYear().toString(),
            projectCodeSequence: '',
            contractValue: 0,
            estimatedCost: 0
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (e, project) => {
        e.stopPropagation();
        setIsEditing(true);
        setFormData({ ...project });
        setIsModalOpen(true);
    };

    const handleViewDetails = (project) => {
        setSelectedProj(project);
        setIsDetailOpen(true);
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        confirmToast('Delete this project entry permanently?', async () => {
            try {
                await projectAPI.deleteProject(id);
                setProjectsList(prev => prev.filter(p => p.id !== id));
                toast.success("Project deleted successfully");
            } catch {
                toast.error("Failed to delete project");
            }
        });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            let finalProjectCode = undefined;
            if (formData.projectCodeSequence && formData.projectCodeSequence.trim() !== '') {
                const catShort = {
                    'Civil': 'CIV',
                    'Electrical': 'ELEC',
                    'HVAC': 'HVAC',
                    'Solar': 'SOLR',
                    'Interior': 'INT',
                    'Security': 'SEC',
                    'Composite': 'COMP'
                }[formData.category || 'Civil'] || 'CIV';
                const year = formData.projectCodeYear || new Date().getFullYear();
                finalProjectCode = `MECPL-${catShort}-${year}-${formData.projectCodeSequence.padStart(3, '0')}`;
            }

            // Process payload exact keys required by project schema
            const processedData = {
                projectCode: finalProjectCode || formData.projectCode || undefined,
                name: formData.name,
                clientId: parseInt(formData.clientId, 10),
                category: formData.category,
                siteAddress: formData.siteAddress,
                latitude: formData.latitude ? Number(formData.latitude) : undefined,
                longitude: formData.longitude ? Number(formData.longitude) : undefined,
                contractValue: Number(formData.contractValue || 0),
                estimatedCost: Number(formData.estimatedCost || 0),
                advancePayment: formData.advancePayment ? Number(formData.advancePayment) : undefined,
                retentionPercentage: formData.retentionPercentage ? Number(formData.retentionPercentage) : undefined,
                paymentTerms: formData.paymentTerms || '',
                plannedStart: formData.plannedStart || null,
                plannedEnd: formData.plannedEnd || null,
                revisedEnd: formData.revisedEnd || null,
                process: formData.process || 'RUNNING',
                status: formData.status || 'Draft',
                notes: formData.notes || ''
            };

            if (isEditing && (formData.id || formData._id)) {
                const targetId = formData.id || formData._id;
                const res = await projectAPI.updateProject(targetId, processedData);
                const updated = res.data?.data || res.data?.project || res.data;
                setProjectsList(projectsList.map(p => (p.id === targetId || p._id === targetId) ? { ...p, ...updated } : p));
                toast.success('Project details updated successfully!');
            } else {
                const res = await projectAPI.createProject(processedData);
                const created = res.data?.data || res.data?.project || res.data || processedData;
                setProjectsList([created, ...projectsList]);
                toast.success('Project enrolled successfully!');
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Could not save Project');
        } finally {
            setIsSaving(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const [isGanttOpen, setIsGanttOpen] = useState(false);

    const handleDownloadReports = () => {
        if (!projectsList || projectsList.length === 0) {
            toast.error("No project data available to export");
            return;
        }

        const toastId = toast.loading("Preparing project reports...");
        
        try {
            // CSV construction
            const headers = ["Project Code", "Project Name", "Client ID", "Site Address", "Contract Value", "Estimated Cost", "Status", "Planned Start", "Planned End"];
            const rows = projectsList.map(p => [
                `"${p.projectCode || p.id || ''}"`,
                `"${p.name || ''}"`,
                `"${p.clientId || ''}"`,
                `"${p.siteAddress || ''}"`,
                p.contractValue || 0,
                p.estimatedCost || 0,
                `"${p.status || ''}"`,
                `"${p.plannedStart || ''}"`,
                `"${p.plannedEnd || ''}"`
            ]);

            const csvContent = "data:text/csv;charset=utf-8," 
                + headers.join(",") + "\n"
                + rows.map(r => r.join(",")).join("\n");

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `Project_Inventory_Report_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            toast.success("Comprehensive report downloaded", { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate report", { id: toastId });
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Project Master DB</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage infrastructure projects across all API endpoints</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleDownloadReports} className="btn-secondary hidden sm:flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" /> Reports
                    </button>
                    <button onClick={handleOpenAdd} className="btn-primary whitespace-nowrap flex items-center gap-1.5">
                        <Plus className="w-5 h-5" /> New Project
                    </button>
                </div>
            </div>

            {/* Optimized Components */}
            <ProjectStats stats={stats} />
            
            <ProjectFilters 
                search={search} 
                setSearch={setSearch} 
                statusFilter={statusFilter} 
                setStatusFilter={setStatusFilter} 
            />

            {isLoadingData ? (
                <div className="card overflow-hidden">
                    <div className="p-8 space-y-4">
                        <Skeleton variant="title" />
                        <div className="space-y-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="flex gap-4">
                                    <Skeleton variant="text" className="w-20" />
                                    <Skeleton variant="text" className="flex-1" />
                                    <Skeleton variant="badge" />
                                    <Skeleton variant="button" className="w-16" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <ProjectTable 
                    projects={filteredProjects}
                    onEdit={handleOpenEdit}
                    onDelete={handleDelete}
                    onViewDetails={handleViewDetails}
                    onClearFilters={() => { setSearch(''); setStatusFilter('All'); }}
                />
            )}

            <ProjectModal 
                isOpen={isModalOpen}
                isEditing={isEditing}
                formData={formData}
                isLoading={isSaving}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                onInputChange={handleInputChange}
            />

            <ProjectDetailSidebar 
                isOpen={isDetailOpen}
                project={selectedProj}
                onClose={() => setIsDetailOpen(false)}
                onEdit={(e, p) => { handleOpenEdit(e, p); setIsDetailOpen(false); }}
                onOpenGantt={() => { setIsGanttOpen(true); setIsDetailOpen(false); }}
            />

            {isGanttOpen && selectedProj && (
                <ProjectGanttModal 
                    project={selectedProj} 
                    onClose={() => setIsGanttOpen(false)} 
                />
            )}
        </div>
    );
}

// Inline Project Gantt Modal component for easier management or I could create a file.
// Let's create a file.
