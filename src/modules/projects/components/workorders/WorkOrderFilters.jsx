import { Search } from 'lucide-react';

export default function WorkOrderFilters({ search, setSearch, filter, setFilter }) {
    return (
        <div className="card p-4 flex flex-col lg:flex-row gap-4 border-slate-50">
            <div className="flex-1 relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-green-600 transition-colors" />
                <input 
                    type="text" 
                    placeholder="Search Work Orders by ID, Project or Vendor..." 
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-green-500/10 focus:border-green-500 rounded-2xl outline-none transition-all font-medium text-sm"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 lg:pb-0">
                {['All', 'Active', 'Draft', 'Pending Approval', 'Completed'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all
                        ${filter === f 
                            ? 'bg-green-600 text-white shadow-md shadow-green-600/20' 
                            : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50 hover:text-slate-900'}`}
                    >
                        {f}
                    </button>
                ))}
            </div>
        </div>
    );
}
