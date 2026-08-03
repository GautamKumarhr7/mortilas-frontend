import React, { useState, useMemo } from 'react';
import { 
    Activity, ArrowUpRight, ArrowDownRight, TrendingUp, DollarSign, 
    AlertTriangle, PieChart as PieChartIcon, BarChart3, Briefcase,
    Calendar, Download, Filter, Target, Search, ChevronRight
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, Cell, AreaChart, Area 
} from 'recharts';

const PROJECTS = [
    { id: 'PRJ-001', name: 'Patna Metro Section B', category: 'Civil', revenue: 12000000, material: 3200000, labour: 1800000, equipment: 680000, subcont: 2100000, overhead: 850000, progress: 45, status: 'Active' },
    { id: 'PRJ-002', name: 'Solar Farm Muzaffarpur', category: 'Solar', revenue: 8500000, material: 2100000, labour: 980000, equipment: 340000, subcont: 1200000, overhead: 520000, progress: 100, status: 'Completed' },
    { id: 'PRJ-003', name: 'SWPL-BRGF Phase 1', category: 'Electrical', revenue: 4250000, material: 1200000, labour: 650000, equipment: 220000, subcont: 450000, overhead: 310000, progress: 78, status: 'Active' },
];

export default function JobCosting() {
    const [selectedId, setSelectedId] = useState(PROJECTS[0].id);
    const selected = PROJECTS.find(p => p.id === selectedId);

    const metrics = useMemo(() => {
        const directCost = selected.material + selected.labour + selected.equipment + selected.subcont;
        const totalCost = directCost + selected.overhead;
        const grossProfit = selected.revenue - directCost;
        const netProfit = selected.revenue - totalCost;
        return {
            directCost, totalCost, grossProfit, netProfit,
            grossMargin: ((grossProfit / selected.revenue) * 100).toFixed(1),
            netMargin: ((netProfit / selected.revenue) * 100).toFixed(1)
        };
    }, [selected]);

    const chartData = [
        { name: 'Material', value: selected.material },
        { name: 'Labour', value: selected.labour },
        { name: 'Equipment', value: selected.equipment },
        { name: 'Sub-Cont.', value: selected.subcont },
        { name: 'Overhead', value: selected.overhead },
    ];

    return (
        <div className="space-y-5 animate-fade-in pb-12 relative">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{selected.name}</h1>
                    <p className="text-slate-500 text-sm mt-1">Job costing & project P&L analysis</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                        {PROJECTS.map(p => (
                            <button
                                key={p.id}
                                onClick={() => setSelectedId(p.id)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                    selectedId === p.id ? 'bg-[#2f6645] text-white' : 'text-slate-500 hover:bg-slate-100 border border-slate-200'
                                }`}
                            >
                                {p.id}
                            </button>
                        ))}
                    </div>
                    <button className="btn-primary flex items-center gap-1.5">
                        <Download className="w-4 h-4" /> Export P&L
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Revenue Earned', value: `₹${(selected.revenue/100000).toFixed(1)}L`, color: 'text-blue-500' },
                    { label: 'Net Profit', value: `₹${(metrics.netProfit/100000).toFixed(2)}L`, color: 'text-green-500' },
                    { label: 'Gross Margin', value: `${metrics.grossMargin}%`, color: 'text-purple-500' },
                    { label: 'Budget Progress', value: `${selected.progress}%`, color: 'text-amber-500' },
                ].map((s, i) => (
                    <div key={i} className="card p-4">
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-slate-500 text-sm mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Detailed Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cost Distribution Chart */}
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/20 border border-slate-50 relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                                <BarChart3 className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight">Financial Anatomy</h3>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Categorized Cost Loading</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="h-[300px] w-full min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} tickFormatter={(v) => `₹${v/100000}L`} />
                                <Tooltip 
                                    cursor={{fill: '#f8fafc', radius: 8}}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', background: '#0f172a', padding: '12px' }}
                                    itemStyle={{ color: '#10b981', fontSize: '11px', fontWeight: '900' }}
                                    formatter={(v) => [`₹${v.toLocaleString()}`, 'Cost']}
                                />
                                <Bar dataKey="value" radius={[12, 12, 12, 12]} barSize={40}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={index} fill={index % 2 === 0 ? '#1e3a34' : '#10b981'} className="hover:opacity-80 transition-opacity cursor-pointer" />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* KPI Breakdown */}
                <div className="space-y-6">
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-xl shadow-slate-900/20 text-white group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl" />
                        <h3 className="text-sm font-black mb-8 uppercase tracking-[0.2em] border-l-2 border-emerald-500 pl-4">Operating Margins</h3>
                        <div className="space-y-8">
                            {[
                                { label: 'Gross Profit', value: metrics.grossMargin + '%', sub: `₹${(metrics.grossProfit/100000).toFixed(1)}L`, color: 'text-emerald-400' },
                                { label: 'Direct Cost Index', value: ((metrics.directCost/selected.revenue)*100).toFixed(1) + '%', sub: 'Target < 75%', color: 'text-blue-400' },
                                { label: 'Indirect Overhead', value: ((selected.overhead/selected.revenue)*100).toFixed(1) + '%', sub: 'Calculated Monthly', color: 'text-amber-400' },
                            ].map((kpi, i) => (
                                <div key={i} className="flex items-center justify-between group/kpi">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">{kpi.label}</p>
                                        <p className="text-xs font-black text-slate-300 group-hover/kpi:text-white transition-colors">{kpi.sub}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-2xl font-black tracking-tighter ${kpi.color}`}>{kpi.value}</p>
                                        <ArrowUpRight className="w-4 h-4 ml-auto text-slate-700" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-8 shadow-lg shadow-slate-200/20 border border-slate-100">
                        <h3 className="text-sm font-black text-slate-800 tracking-[0.1em] mb-6 uppercase">Risk Assessment</h3>
                        <div className="flex items-center gap-4 p-4 bg-rose-50 rounded-2xl border border-rose-100">
                            <AlertTriangle className="w-6 h-6 text-rose-500" />
                            <div>
                                <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Variation Orders</p>
                                <p className="text-xs font-bold text-rose-900">Unapproved work costing ₹2.4L detected.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
