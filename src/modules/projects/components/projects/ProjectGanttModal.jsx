import React from 'react';
import { X, Calendar, Clock, BarChart3, ChevronRight, Activity, CheckCircle2 } from 'lucide-react';

export default function ProjectGanttModal({ project, onClose }) {
    if (!project) return null;

    // Defined phases with specific dates for better visibility
    const phases = [
        { name: 'Initial Site Survey', days: '15 Days', progress: 100, color: 'bg-emerald-500', start: '0%', width: '15%' },
        { name: 'Resource Mobilization', days: '20 Days', progress: project.advancement > 35 ? 100 : Math.max(0, (project.advancement - 15) / 20 * 100), color: 'bg-emerald-500', start: '15%', width: '20%' },
        { name: 'Core Infrastructure Build', days: '45 Days', progress: project.advancement > 80 ? 100 : Math.max(0, (project.advancement - 35) / 45 * 100), color: 'bg-blue-500', start: '35%', width: '45%' },
        { name: 'Quality & Testing', days: '15 Days', progress: project.advancement > 95 ? 100 : Math.max(0, (project.advancement - 80) / 15 * 100), color: 'bg-slate-300', start: '80%', width: '15%' },
        { name: 'Final Handover', days: '5 Days', progress: project.advancement >= 100 ? 100 : 0, color: 'bg-slate-200', start: '95%', width: '5%' }
    ];

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] w-full max-w-5xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Modern Professional Header */}
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100 shadow-sm">
                            <BarChart3 className="w-8 h-8 text-emerald-600" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-bold text-slate-800">{project.name}</h2>
                                <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full uppercase tracking-widest">{project.code || 'PRJ-MASTER'}</span>
                            </div>
                            <p className="text-slate-400 font-medium flex items-center gap-2 mt-1">
                                <Activity className="w-4 h-4 text-emerald-500" /> Strategic Timeline & Phase Analysis
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-12 h-12 hover:bg-slate-50 rounded-full flex items-center justify-center text-slate-300 hover:text-slate-600 transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-10 space-y-12 overflow-y-auto max-h-[75vh]">
                    {/* Key Metrics Strip */}
                    <div className="flex items-center justify-between p-8 bg-slate-50/50 rounded-3xl border border-slate-100 shadow-inner">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Advancement</p>
                            <p className="text-4xl font-black text-slate-800 tracking-tighter">{project.advancement || 0}% <span className="text-sm font-medium text-emerald-500">Ahead of schedule</span></p>
                        </div>
                        <div className="h-12 w-px bg-slate-200" />
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Start Window</p>
                            <p className="text-lg font-bold text-slate-700 flex items-center gap-2"><Calendar className="w-4 h-4 text-emerald-500" /> {project.startDate || 'Mar 25, 2025'}</p>
                        </div>
                        <div className="h-12 w-px bg-slate-200" />
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completion Milestone</p>
                            <p className="text-lg font-bold text-slate-700 flex items-center gap-2"><Clock className="w-4 h-4 text-emerald-500" /> {project.endDate || 'Dec 18, 2025'}</p>
                        </div>
                    </div>

                    {/* Simple Gantt Visualization */}
                    <div className="space-y-10 relative">
                        {/* Timeline Labels */}
                        <div className="flex justify-between border-b border-slate-100 pb-4">
                            {['Q1 Start', 'Q2 Review', 'Mid-Term', 'Q4 Delivery', 'Completion'].map(label => (
                                <span key={label} className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">{label}</span>
                            ))}
                        </div>

                        {/* Phase Rows */}
                        <div className="space-y-12">
                            {phases.map((phase, idx) => (
                                <div key={idx} className="relative">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center gap-2">
                                            <ChevronRight className="w-4 h-4 text-emerald-500" />
                                            <span className="text-sm font-bold text-slate-700">{phase.name}</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{phase.days}</span>
                                    </div>
                                    <div className="h-4 w-full bg-slate-50 rounded-full overflow-hidden relative border border-slate-100 border-dashed">
                                        <div 
                                            className={`absolute h-full transition-all duration-1000 flex items-center justify-end pr-2 ${phase.color}`}
                                            style={{ 
                                                left: phase.start,
                                                width: phase.width,
                                                opacity: phase.progress > 0 ? 1 : 0.3
                                            }}
                                        >
                                            {phase.progress === 100 && <CheckCircle2 className="w-3 h-3 text-white/50" />}
                                            <div 
                                                className="absolute inset-0 bg-white/20 transition-all duration-1000"
                                                style={{ width: `${100 - phase.progress}%`, left: `${phase.progress}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Vertical Progress Line (Simplified & Accurate) */}
                        <div 
                            className="absolute top-0 bottom-0 w-[2px] bg-sky-500/40 z-20 pointer-events-none transition-all duration-700"
                            style={{ left: `${project.advancement}%` }}
                        >
                            <div className="absolute top-[-20px] left-1/2 -translate-x-1/2 px-3 py-1 bg-sky-600 text-white text-[9px] font-black rounded-full shadow-lg whitespace-nowrap">
                                CURRENT FOCUS: {project.advancement}%
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-slate-50 border-t border-slate-100 text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">Project Master DB - Professional Timeline Engine</p>
                </div>
            </div>
        </div>
    );
}
