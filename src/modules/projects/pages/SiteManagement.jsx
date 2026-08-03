import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useApp } from '../../../hooks/useApp';
import { Building2, Search, Plus, MapPin, Settings2, Trash2, ShieldAlert, RefreshCw, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { confirmToast } from '../../../utils/toastUtils';
import { siteAPI } from '../services';
import { employeeAPI } from '../../hr/services';

import SiteStats from '../components/sites/SiteStats';
import SiteModal from '../components/sites/SiteModal';

export default function SiteManagement() {
    const { projects } = useApp();

    const [sites, setSites] = useState([]);
    const [isLoadingSites, setIsLoadingSites] = useState(true);
    const [employees, setEmployees] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});

    // ─── Fetch all sites from API ────────────────────────────────────────────
    const fetchSites = useCallback(async () => {
        setIsLoadingSites(true);
        try {
            const data = await siteAPI.getAllSites();
            // Handle multiple response shapes: array directly, or nested in .data / .sites
            const list = Array.isArray(data)
                ? data
                : Array.isArray(data?.data)
                ? data.data
                : Array.isArray(data?.sites)
                ? data.sites
                : [];
            // Reverse so newest site always appears at the top
            setSites([...list].reverse());
        } catch (error) {
            console.error('Failed to fetch sites:', error);
            toast.error(error.response?.data?.message || 'Failed to load sites.');
        } finally {
            setIsLoadingSites(false);
        }
    }, []);

    useEffect(() => {
        fetchSites();
    }, [fetchSites]);

    const fetchEmployees = useCallback(async () => {
        try {
            const data = await employeeAPI.getAllEmployees();
            setEmployees(data?.data || data || []);
        } catch (error) {
            console.error('Failed to fetch employees:', error);
        }
    }, []);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    // ─── Derived stats ───────────────────────────────────────────────────────
    const filteredSites = useMemo(() =>
        sites.filter(s =>
            (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (s.supervisor || '').toLowerCase().includes(search.toLowerCase()) ||
            (s.location || '').toLowerCase().includes(search.toLowerCase())
        ), [sites, search]);

    const stats = useMemo(() => {
        const active = sites.filter(s => (s.status || '').toLowerCase() === 'active').length;
        const totalManpower = sites.reduce((sum, s) => sum + (Number(s.count) || Number(s.manpower) || 0), 0);
        const safeSites = sites.filter(s => (s.health || '').toLowerCase() === 'safe').length;
        const healthIndex = sites.length ? Math.round((safeSites / sites.length) * 100) : 0;
        const totalAlerts = sites.reduce((sum, s) => sum + (s.alerts || 0), 0);
        return { active, totalManpower, healthIndex, totalAlerts };
    }, [sites]);

    // ─── Handlers ────────────────────────────────────────────────────────────
    const handleAddSite = () => {
        setIsEditing(false);
        setFormData({ status: 'planning', type: 'construction' });
        setIsModalOpen(true);
    };

    const handleEditSite = (site) => {
        setIsEditing(true);
        setFormData({ ...site });
        setIsModalOpen(true);
    };

    const handleDeleteSite = (id) => {
        confirmToast('Are you sure you want to remove this site?', async () => {
            try {
                await siteAPI.deleteSite(id);
                setSites(prev => prev.filter(s => s.id !== id && s._id !== id));
                toast.success('Site removed');
            } catch (error) {
                console.error('Delete site error:', error);
                toast.error(error.response?.data?.message || 'Failed to delete site.');
            }
        });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (isEditing) {
                const siteId = formData.id || formData._id;
                const payload = {
                    projectId: Number(formData.projectId),
                    name: formData.name,
                    type: formData.type || 'construction',
                    status: formData.status || 'planning',
                    siteManagerId: Number(formData.siteManagerId),
                    latitude: formData.latitude ? Number(formData.latitude) : null,
                    longitude: formData.longitude ? Number(formData.longitude) : null,
                    state: formData.state,
                    city: formData.city,
                };
                await siteAPI.updateSite(siteId, payload);
                toast.success('Site updated');
            } else {
                const payload = {
                    projectId: Number(formData.projectId),
                    name: formData.name,
                    type: formData.type || 'construction',
                    status: formData.status || 'planning',
                    siteManagerId: Number(formData.siteManagerId),
                    latitude: formData.latitude ? Number(formData.latitude) : null,
                    longitude: formData.longitude ? Number(formData.longitude) : null,
                    state: formData.state,
                    city: formData.city,
                };
                await siteAPI.createSite(payload);
                toast.success('Site added successfully');
            }
            setIsModalOpen(false);
            // Re-fetch the full list so cards always reflect live API data
            await fetchSites();
        } catch (error) {
            console.error('Save site error:', error);
            toast.error(error.response?.data?.message || 'Failed to save site. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleInputChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    // ─── Render ──────────────────────────────────────────────────────────────
    return (
        <div className="space-y-5 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Site Management</h1>
                    <p className="text-slate-500 text-sm mt-1">Monitor and manage active construction sites</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative hidden sm:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search sites..."
                            className="input pl-9 w-56"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={fetchSites}
                        title="Refresh"
                        className="p-2 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-all"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button onClick={handleAddSite} className="btn-primary flex items-center gap-1.5">
                        <Plus className="w-4 h-4" /> New Site
                    </button>
                </div>
            </div>

            <SiteStats
                activeSites={stats.active}
                manpower={stats.totalManpower}
                healthySites={stats.healthIndex}
                alerts={stats.totalAlerts}
            />

            {/* Loading skeleton */}
            {isLoadingSites ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="card p-5 space-y-3 animate-pulse">
                            <div className="flex justify-between">
                                <div className="w-10 h-10 bg-slate-200 rounded-xl" />
                                <div className="w-16 h-6 bg-slate-200 rounded-full" />
                            </div>
                            <div className="h-4 bg-slate-200 rounded w-3/4" />
                            <div className="h-3 bg-slate-200 rounded w-1/2" />
                            <div className="grid grid-cols-2 gap-3">
                                <div className="h-14 bg-slate-100 rounded-xl" />
                                <div className="h-14 bg-slate-100 rounded-xl" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* Sites Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredSites.map((site, idx) => {
                        const siteId = site.id || site._id || idx;
                        const isActive = (site.status || '').toLowerCase() === 'active';
                        const health = site.health || 'Safe';
                        return (
                            <div key={siteId} className="card p-5 flex flex-col gap-4 hover:shadow-md transition-all relative overflow-hidden group">
                                {/* Top color bar */}
                                <div className={`absolute top-0 left-0 w-full h-1 rounded-t-2xl transition-colors ${isActive ? 'bg-emerald-500' : 'bg-amber-400'}`} />

                                <div className="flex items-start justify-between">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <span className={`badge ${isActive ? 'badge-green' : 'badge-yellow'}`}>
                                        {site.status}
                                    </span>
                                </div>

                                <div>
                                    <h3 className="text-slate-900 font-semibold text-base">{site.name}</h3>
                                    <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1">
                                        <Building2 className="w-3 h-3" /> Project #{site.projectId}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-slate-50 rounded-xl">
                                        <p className="text-xs text-slate-400 mb-0.5">Manager ID</p>
                                        <p className="text-sm text-slate-700 font-medium truncate">User #{site.siteManagerId}</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl">
                                        <p className="text-xs text-slate-400 mb-0.5">Type</p>
                                        <p className="text-sm text-slate-700 font-medium">{site.type}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-slate-50 rounded-xl">
                                        <p className="text-xs text-slate-400 mb-0.5">Location</p>
                                        <p className="text-sm text-slate-700 font-medium">{site.city || 'N/A'}, {site.state || 'N/A'}</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl">
                                        <p className="text-xs text-slate-400 mb-0.5">Site Code</p>
                                        <p className="text-sm text-slate-700 font-medium">{site.siteCode}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2.5 h-2.5 rounded-full ${health === 'Safe' ? 'bg-emerald-500' : health === 'Caution' ? 'bg-amber-500' : 'bg-red-500'}`} />
                                        <span className="text-xs text-slate-500">Health: <span className="font-medium text-slate-700">{health}</span></span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => handleEditSite(site)} className="p-1.5 bg-slate-100 text-slate-500 hover:bg-[#2f6645] hover:text-white rounded-lg transition-all">
                                            <Settings2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => handleDeleteSite(siteId)} className="p-1.5 bg-slate-100 text-slate-500 hover:bg-red-500 hover:text-white rounded-lg transition-all">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                {(site.alerts || 0) > 0 && (
                                    <div className="absolute top-4 right-4 flex items-center gap-1 bg-red-50 text-red-600 px-2 py-1 rounded-lg border border-red-100">
                                        <ShieldAlert className="w-3 h-3" />
                                        <span className="text-xs font-semibold">{site.alerts} Alert{site.alerts > 1 ? 's' : ''}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {!isLoadingSites && filteredSites.length === 0 && (
                        <div className="col-span-3 card p-10 text-center text-slate-400">
                            <p className="font-medium">No sites found</p>
                        </div>
                    )}
                </div>
            )}

            <SiteModal
                isOpen={isModalOpen}
                isEditing={isEditing}
                formData={formData}
                projects={projects}
                employees={employees}
                isSaving={isSaving}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                onInputChange={handleInputChange}
            />
        </div>
    );
}
