import { MapPin, Edit2, Trash2, ArrowUpRight, Search } from 'lucide-react';

const categoryColors = {
    'Civil': 'badge-blue',
    'Electrical': 'badge-yellow',
    'HVAC': 'badge-purple',
    'Solar': 'badge-orange',
    'Interior': 'badge-green',
    'Security': 'badge-red',
    'CAT-01': 'badge-blue',
};

const statusBadge = {
    'pending': 'badge-yellow',
    'approved': 'badge-green',
    'closed': 'badge-blue',
    // Fallback old states:
    'Active': 'badge-green',
    'Completed': 'badge-blue',
    'On Hold': 'badge-yellow',
    'Delayed': 'badge-red',
};

export default function ProjectTable({ projects, onEdit, onDelete, onViewDetails, onClearFilters }) {
    return (
        <div className="card overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="table-header">Code</th>
                            <th className="table-header">Project Details</th>
                            <th className="table-header">Client</th>
                            <th className="table-header">Contract Value</th>
                            <th className="table-header">Advancement</th>
                            <th className="table-header">Status & Process</th>
                            <th className="table-header text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.length > 0 ? projects.map((p) => (
                            <tr key={p.id || p._id || p.projectCode} onClick={() => onViewDetails(p)} className="table-row hover:bg-slate-50 transition-colors cursor-pointer">
                                <td className="table-cell">
                                    <span className="font-mono text-xs font-semibold text-blue-600 px-2 py-1 bg-blue-50 rounded-lg whitespace-nowrap">
                                        {p.projectCode}
                                    </span>
                                </td>
                                <td className="table-cell max-w-[260px]">
                                    <p className="text-slate-900 font-semibold text-sm line-clamp-1">{p.name || 'Unnamed Project'}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`badge ${categoryColors[p.category] || 'badge-gray'}`}>{p.category}</span>
                                        <span className="text-slate-400 text-xs flex items-center gap-1 line-clamp-1">
                                            <MapPin className="w-3 h-3" /> {p.siteAddress || 'Unknown Location'}
                                        </span>
                                    </div>
                                </td>
                                <td className="table-cell">
                                    <p className="text-slate-800 font-medium text-sm">Client ID: {p.clientId}</p>
                                    <p className="text-slate-400 text-xs">Public / Private</p>
                                </td>
                                <td className="table-cell">
                                    <p className="text-emerald-600 font-semibold">₹{Number(p.contractValue || 0).toLocaleString()}</p>
                                    <p className="text-slate-400 text-xs">Contract Value</p>
                                </td>
                                <td className="table-cell w-44">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between text-xs text-slate-500">
                                            <span>Progress</span>
                                            <span className="font-semibold text-slate-700">{p.advancement || 0}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-700 ${p.advancement >= 100 ? 'bg-blue-500' : 'bg-green-500'}`}
                                                style={{ width: `${Math.min(p.advancement || 0, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </td>
                                <td className="table-cell">
                                    <div className="flex flex-col gap-1.5 items-start">
                                        <span className={`badge ${statusBadge[p.status] || 'badge-gray'}`}>{p.status || 'Pending'}</span>
                                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 rounded">{p.process}</span>
                                    </div>
                                </td>
                                <td className="table-cell text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                        <button onClick={(e) => onEdit(e, p)} className="p-1.5 text-slate-400 hover:text-[#2f6645] hover:bg-emerald-50 rounded-lg transition-all">
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={(e) => onDelete(e, p.id || p.projectCode)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all">
                                            <ArrowUpRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="7" className="p-10 text-center text-slate-400">
                                    <p className="font-medium">No projects found</p>
                                    <button onClick={onClearFilters} className="text-[#2f6645] font-semibold text-xs mt-1 hover:underline">Clear all filters</button>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
