import React from 'react';
import { Edit2, Trash2, TrendingUp, TrendingDown } from 'lucide-react';

const statusBadge = {
    'Reconciled': 'badge-green',
    'Minor Variance': 'badge-yellow',
    'Under Utilized': 'badge-blue',
    'Over Issued': 'badge-red',
    'Pending': 'badge-yellow',
};

export default function BOQTable({ items, onEdit, onDelete }) {
    return (
        <div className="card overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="table-header">Bill Code</th>
                            <th className="table-header">Description</th>
                            <th className="table-header">Unit</th>
                            <th className="table-header">Contract Amt</th>
                            <th className="table-header">Sub Rate</th>
                            <th className="table-header">PO Qty</th>
                            <th className="table-header">Billed Qty</th>
                            <th className="table-header">Contracts</th>
                            <th className="table-header">Diff Value</th>
                            <th className="table-header">Status</th>
                            <th className="table-header text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan="11" className="p-8 text-center text-slate-500">No records found.</td>
                            </tr>
                        ) : items.map((item) => (
                            <tr key={item.id} className="table-row hover:bg-slate-50 transition-colors">
                                <td className="table-cell">
                                    <span className="font-mono text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                                        {item.code}
                                    </span>
                                </td>
                                <td className="table-cell text-slate-700 font-medium max-w-[200px] truncate" title={item.description}>
                                    {item.description}
                                </td>
                                <td className="table-cell">
                                    <span className="text-slate-500 text-xs font-medium px-2 py-1 bg-slate-100 rounded-lg">{item.unit}</span>
                                </td>
                                <td className="table-cell text-emerald-600 font-semibold tabular-nums">
                                    ₹{Number(item.contractAmount || 0).toLocaleString()}
                                </td>
                                <td className="table-cell text-slate-500 tabular-nums">
                                    ₹{Number(item.subrate || 0).toLocaleString()}
                                </td>
                                <td className="table-cell text-slate-700 font-semibold tabular-nums">{item.poQuantity}</td>
                                <td className="table-cell text-slate-500 tabular-nums">{item.billedQuantity}</td>
                                <td className="table-cell text-slate-500 tabular-nums text-center">{item.noOfContract}</td>
                                <td className="table-cell text-rose-600 font-medium tabular-nums">
                                    {item.diffValue}
                                </td>
                                <td className="table-cell">
                                    <span className={`badge ${statusBadge[item.status] || 'badge-gray'} whitespace-nowrap`}>
                                        {item.status}
                                    </span>
                                </td>
                                <td className="table-cell text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                        <button onClick={() => onEdit(item)} className="p-1.5 text-slate-400 hover:text-[#2f6645] hover:bg-emerald-50 rounded-lg transition-all">
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => onDelete(item.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
