import React from 'react';
import { X, Loader2 } from 'lucide-react';

const statuses = ['status', 'active', 'in progress', 'completed', 'on hold', 'delayed'];
const priorities = ['priority', 'low', 'medium', 'high', 'critical'];

export default function ProgressUpdateModal({ isOpen, isEditing, formData, isSaving, onClose, onSave, onInputChange }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-[#1e3a34] text-white">
                    <div>
                        <h2 className="text-base font-semibold">{isEditing ? 'Edit Milestone' : 'Add New Milestone'}</h2>
                        <p className="text-xs text-white/60 mt-0.5">Project Planner</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={onSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        {/* title */}
                        <div className="col-span-2 sm:col-span-1 space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600">Milestone Title</label>
                            <input
                                name="title"
                                value={formData.title || ''}
                                onChange={onInputChange}
                                required
                                className="input"
                                placeholder="e.g. Phase 2 Wiring"
                            />
                        </div>
                        {/* siteId — numeric, matching API spec */}
                        <div className="col-span-2 sm:col-span-1 space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600">Site ID</label>
                            <input
                                type="number"
                                name="siteId"
                                value={formData.siteId || ''}
                                onChange={onInputChange}
                                required
                                className="input"
                                placeholder="e.g. 1"
                                min="1"
                            />
                            <p className="text-xs text-slate-400">Numeric ID of the associated site</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600">Start Date</label>
                            <input type="date" name="startDate" value={formData.startDate || ''} onChange={onInputChange} required className="input" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600">End Date</label>
                            <input type="date" name="endDate" value={formData.endDate || ''} onChange={onInputChange} required className="input" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600">Priority Level</label>
                            <select name="priority" value={formData.priority || 'priority'} onChange={onInputChange} className="input">
                                {priorities.map(p => (
                                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600">Lifecycle Status</label>
                            <select name="status" value={formData.status || 'status'} onChange={onInputChange} className="input">
                                {statuses.map(s => (
                                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* completion — API field (integer 0–100) */}
                    <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between px-1">
                            <label className="text-xs font-semibold text-slate-600">Completion %</label>
                            <span className="text-sm font-semibold text-emerald-600">
                                {formData.completion ?? formData.progress ?? 0}%
                            </span>
                        </div>
                        <div className="space-y-1.5">
                            <input
                                type="range" min="0" max="100"
                                name="completion"
                                value={formData.completion ?? formData.progress ?? 0}
                                onChange={onInputChange}
                                className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-emerald-600"
                            />
                            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                                <span>0%</span><span>50%</span><span>100%</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                        <button type="button" onClick={onClose} disabled={isSaving} className="btn-secondary flex-1">Cancel</button>
                        <button type="submit" disabled={isSaving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                            {isSaving
                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                                : (isEditing ? 'Update Milestone' : 'Save Milestone')
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
