import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useApp } from '../../../hooks/useApp';
import { Target, Search, Plus, CheckCircle2, Edit2, Trash2, Clock, RefreshCw, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { confirmToast } from '../../../utils/toastUtils';
import { milestoneAPI } from '../services';

import ProgressStats from '../components/progress/ProgressStats';
import ProgressUpdateModal from '../components/progress/ProgressUpdateModal';
import ProgressCharts from '../components/progress/ProgressCharts';

export default function ProgressTracking() {
    const { sites, projects } = useApp();

    // Local state — data from API
    const [milestones, setMilestones] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});

    const categories = ['All', 'Civil', 'Electrical', 'Solar', 'HVAC', 'Interior'];

    // ─── Fetch milestones from API ────────────────────────────────────────────
    const fetchMilestones = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await milestoneAPI.getAllMilestones();
            const list = Array.isArray(data)
                ? data
                : Array.isArray(data?.data)
                ? data.data
                : Array.isArray(data?.milestones)
                ? data.milestones
                : [];
            // Newest first
            setMilestones([...list].reverse());
        } catch (error) {
            console.error('Failed to fetch milestones:', error);
            toast.error(error.response?.data?.message || 'Failed to load milestones.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMilestones();
    }, [fetchMilestones]);

    // ─── Derived stats ────────────────────────────────────────────────────────
    // API uses `completion` field; also support legacy `progress`
    const getCompletion = (m) => Number(m.completion ?? m.progress ?? 0);
    const getStatus = (m) => (m.status || '').toLowerCase();

    const filteredMilestones = useMemo(() =>
        milestones.filter(m => {
            const title = (m.title || '').toLowerCase();
            const id = String(m.id || m._id || '').toLowerCase();
            const matchesSearch = title.includes(search.toLowerCase()) || id.includes(search.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || (m.category || '') === selectedCategory;
            return matchesSearch && matchesCategory;
        }), [milestones, search, selectedCategory]);

    const stats = useMemo(() => {
        if (!milestones.length) return { avg: 0, achieved: 0, delays: 0, upcoming: 0 };
        const avgCompletion = Math.round(milestones.reduce((sum, m) => sum + getCompletion(m), 0) / milestones.length);
        const achieved = milestones.filter(m => getStatus(m) === 'completed').length;
        const delays = milestones.filter(m => getStatus(m) === 'delayed').length;
        const today = new Date();
        const in15Days = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000);
        const upcoming = milestones.filter(m => {
            const end = new Date(m.endDate);
            return end > today && end <= in15Days && getStatus(m) !== 'completed';
        }).length;
        return { avg: avgCompletion, achieved, delays, upcoming };
    }, [milestones]);

    // ─── Handlers ─────────────────────────────────────────────────────────────
    const handleAddTask = () => {
        setIsEditing(false);
        setFormData({
            status: 'status',
            priority: 'priority',
            completion: 0,
            startDate: new Date().toISOString().split('T')[0],
        });
        setIsModalOpen(true);
    };

    const handleEditTask = (milestone) => {
        setIsEditing(true);
        setFormData({ ...milestone });
        setIsModalOpen(true);
    };

    const handleDeleteTask = (milestone) => {
        const id = milestone.id || milestone._id;
        confirmToast('Remove this milestone?', async () => {
            try {
                await milestoneAPI.deleteMilestone(id);
                setMilestones(prev => prev.filter(m => (m.id || m._id) !== id));
                toast.success('Milestone removed');
            } catch (error) {
                console.error('Delete milestone error:', error);
                toast.error(error.response?.data?.message || 'Failed to delete milestone.');
            }
        });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // Build exact API payload
            const payload = {
                siteId: Number(formData.siteId),
                title: formData.title,
                startDate: formData.startDate,
                endDate: formData.endDate,
                priority: formData.priority,
                status: formData.status,
                completion: Number(formData.completion ?? formData.progress ?? 0),
            };

            if (isEditing) {
                const id = formData.id || formData._id;
                await milestoneAPI.updateMilestone(id, payload);
                toast.success('Milestone updated');
            } else {
                await milestoneAPI.createMilestone(payload);
                toast.success('Milestone added');
            }

            setIsModalOpen(false);
            // Re-fetch for clean data
            await fetchMilestones();
        } catch (error) {
            console.error('Save milestone error:', error);
            toast.error(error.response?.data?.message || 'Failed to save milestone.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleInputChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    // ─── Badge maps ───────────────────────────────────────────────────────────
    const priorityBadge = {
        critical: 'badge-red', Critical: 'badge-red',
        high: 'badge-yellow', High: 'badge-yellow',
        medium: 'badge-blue', Medium: 'badge-blue',
        low: 'badge-gray', Low: 'badge-gray',
    };
    const statusBadge = {
        completed: 'badge-green', Completed: 'badge-green',
        active: 'badge-blue', Active: 'badge-blue',
        'in progress': 'badge-blue', 'In Progress': 'badge-blue',
        delayed: 'badge-red', Delayed: 'badge-red',
        'on hold': 'badge-yellow', 'On Hold': 'badge-yellow',
    };

    return (
        <div className="space-y-5 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Progress Tracking</h1>
                    <p className="text-slate-500 text-sm mt-1">Track milestones, activity completion and site progress</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchMilestones}
                        title="Refresh"
                        className="p-2 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-all"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button onClick={handleAddTask} className="btn-primary flex items-center gap-1.5">
                        <Plus className="w-4 h-4" /> Add Milestone
                    </button>
                </div>
            </div>

            <ProgressStats
                overallCompletion={stats.avg}
                milstonesCount={stats.achieved}
                delayTasks={stats.delays}
                upcomingDue={stats.upcoming}
            />

            <ProgressCharts tasks={milestones} />

            {/* Main Table + Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
                {/* Table */}
                <div className="lg:col-span-3 card overflow-hidden">
                    <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-800 text-sm">Milestone Registry</h3>
                            <div className="flex gap-1">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${selectedCategory === cat ? 'bg-[#2f6645] text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="relative w-full sm:w-56">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input type="text" placeholder="Search milestones..." className="input pl-9" value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        {isLoading ? (
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        {['Site', 'Activity', 'Completion', 'Priority', 'Status', 'Actions'].map(h => (
                                            <th key={h} className="table-header whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {[1, 2, 3, 4].map(i => (
                                        <tr key={i} className="border-b border-slate-100">
                                            {[1, 2, 3, 4, 5, 6].map(j => (
                                                <td key={j} className="table-cell">
                                                    <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        {['Site', 'Activity', 'Completion', 'Priority', 'Status', 'Actions'].map(h => (
                                            <th key={h} className="table-header whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMilestones.map((milestone, idx) => {
                                        const mId = milestone.id || milestone._id || idx;
                                        const completion = getCompletion(milestone);
                                        const status = milestone.status || '';
                                        const priority = milestone.priority || '';
                                        const isCompleted = status.toLowerCase() === 'completed';
                                        return (
                                            <tr key={mId} className="table-row hover:bg-slate-50 transition-colors">
                                                <td className="table-cell">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-semibold text-slate-500 text-xs flex-shrink-0">
                                                            #{milestone.siteId || '—'}
                                                        </div>
                                                        <div>
                                                            <p className="text-slate-800 font-medium text-sm">Site {milestone.siteId || '—'}</p>
                                                            <p className="text-slate-400 text-xs">{milestone.startDate} → {milestone.endDate}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="table-cell">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`p-1.5 rounded-lg flex-shrink-0 ${isCompleted ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                                            {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                                                        </div>
                                                        <div>
                                                            <p className="text-slate-800 font-medium text-sm">{milestone.title}</p>
                                                            {milestone.category && <p className="text-slate-400 text-xs">{milestone.category}</p>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="table-cell w-36">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-slate-500">Completion</span>
                                                            <span className="text-xs font-semibold text-slate-700">{completion}%</span>
                                                        </div>
                                                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${completion === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                                                style={{ width: `${Math.min(completion, 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="table-cell">
                                                    <span className={`badge ${priorityBadge[priority] || 'badge-gray'}`}>{priority || 'Normal'}</span>
                                                </td>
                                                <td className="table-cell">
                                                    <span className={`badge ${statusBadge[status] || 'badge-gray'}`}>{status}</span>
                                                </td>
                                                <td className="table-cell">
                                                    <div className="flex items-center gap-1.5">
                                                        <button onClick={() => handleEditTask(milestone)} className="p-1.5 bg-slate-100 text-slate-500 hover:bg-[#2f6645] hover:text-white rounded-lg transition-all">
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button onClick={() => handleDeleteTask(milestone)} className="p-1.5 bg-slate-100 text-slate-500 hover:bg-red-500 hover:text-white rounded-lg transition-all">
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {!isLoading && filteredMilestones.length === 0 && (
                                        <tr><td colSpan="6" className="p-8 text-center text-slate-400">No milestones found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    <div className="card p-5 bg-[#1e3a34] text-white">
                        <h3 className="font-semibold text-sm mb-4 border-l-2 border-emerald-400 pl-3">Critical Sites</h3>
                        <div className="space-y-4">
                            {sites.slice(0, 3).map((site, i) => (
                                <div key={site.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-emerald-400 font-semibold text-sm">
                                            {(site.name || '?')[0]}
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-white truncate max-w-[80px]">{site.name}</p>
                                            <p className="text-[10px] text-white/50">{site.location}</p>
                                        </div>
                                    </div>
                                    <span className={`text-xs font-semibold ${i === 1 ? 'text-red-400' : 'text-emerald-400'}`}>{i === 1 ? '82%' : '100%'}</span>
                                </div>
                            ))}
                            {sites.length === 0 && (
                                <p className="text-xs text-white/40 text-center py-2">No sites loaded</p>
                            )}
                        </div>
                    </div>

                    <div className="card p-5">
                        <h3 className="font-semibold text-sm text-slate-800 mb-4">Timeline Alerts</h3>
                        <div className="space-y-3">
                            {[
                                { title: 'Ducting Done', status: 'Due Soon', color: 'bg-amber-400' },
                                { title: 'Concrete P11', status: 'Delayed', color: 'bg-red-400' },
                                { title: 'Solar Grid', status: 'Planned', color: 'bg-blue-400' }
                            ].map((alert, i) => (
                                <div key={i} className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-xl transition-all cursor-pointer">
                                    <div className={`w-1 h-8 rounded-full flex-shrink-0 ${alert.color}`} />
                                    <div>
                                        <p className="text-sm font-medium text-slate-800">{alert.title}</p>
                                        <p className="text-xs text-slate-400">{alert.status}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <ProgressUpdateModal
                isOpen={isModalOpen}
                isEditing={isEditing}
                formData={formData}
                sites={sites}
                projects={projects}
                isSaving={isSaving}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                onInputChange={handleInputChange}
            />
        </div>
    );
}
