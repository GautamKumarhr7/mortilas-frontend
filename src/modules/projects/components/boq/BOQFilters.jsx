import React from 'react';
import { Search, Plus, ChevronDown, Filter } from 'lucide-react';

export default function BOQFilters({ projects, selectedProject, onProjectChange, search, onSearchChange, onAddItem }) {
    return (
        <div className="flex flex-col lg:flex-row items-center gap-4 w-full">
            <div className="relative w-full lg:w-64 group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 z-10 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                    <Filter className="w-3.5 h-3.5" />
                </div>
                <select 
                    value={selectedProject} 
                    onChange={e => onProjectChange(e.target.value)}
                    className="w-full pl-12 pr-12 py-3.5 bg-white border-2 border-slate-100 rounded-2xl outline-none font-black text-slate-800 appearance-none shadow-sm focus:border-emerald-500 transition-all cursor-pointer group-hover:border-slate-200"
                >
                    {projects.map(p => <option key={p.id} value={p.id}>{p.id} — {p.name.split(' ')[0]}</option>)}
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-colors pointer-events-none" />
            </div>
            
            <div className="flex-1 relative group w-full">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                <input 
                    type="text" 
                    placeholder="Search BOQ item database..." 
                    className="w-full pl-14 pr-6 py-3.5 bg-white border-2 border-slate-100 focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 rounded-2xl outline-none transition-all font-bold text-sm shadow-sm"
                    value={search}
                    onChange={e => onSearchChange(e.target.value)}
                />
            </div>

            <button 
                onClick={onAddItem}
                className="btn-primary whitespace-nowrap flex items-center gap-1.5 w-full lg:w-auto px-6 py-3.5 sm:py-2.5 sm:px-5"
            >
                <Plus className="w-5 h-5" /> Add BOQ Item
            </button>
        </div>
    );
}
