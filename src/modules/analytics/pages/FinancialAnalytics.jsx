import { useState } from 'react';
import { TrendingUp, Users, DollarSign, BarChart3, AlertTriangle } from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts';

const revenueByMonth = [
    { month: 'Apr', revenue: 38, target: 40, profit: 9.2 },
    { month: 'May', revenue: 42, target: 40, profit: 10.5 },
    { month: 'Jun', revenue: 35, target: 42, profit: 7.8 },
    { month: 'Jul', revenue: 48, target: 44, profit: 12.1 },
    { month: 'Aug', revenue: 52, target: 46, profit: 13.5 },
    { month: 'Sep', revenue: 45, target: 48, profit: 11.2 },
    { month: 'Oct', revenue: 58, target: 50, profit: 15.0 },
    { month: 'Nov', revenue: 62, target: 52, profit: 16.4 },
    { month: 'Dec', revenue: 71, target: 55, profit: 19.2 },
    { month: 'Jan', revenue: 64, target: 58, profit: 17.1 },
    { month: 'Feb', revenue: 78, target: 60, profit: 21.2 },
    { month: 'Mar', revenue: 82, target: 62, profit: 22.8 },
];

const expenseBreakdown = [
    { name: 'Material', value: 38 },
    { name: 'Labour', value: 22 },
    { name: 'Sub-Cont.', value: 18 },
    { name: 'Equipment', value: 8 },
    { name: 'Admin', value: 9 },
    { name: 'Others', value: 5 },
];

const COLORS = ['#3b82f6', '#a855f7', '#f97316', '#06b6d4', '#eab308', '#22c55e'];

const kpiData = [
    { subject: 'Revenue', A: 82, fullMark: 100 },
    { subject: 'Margin', A: 72, fullMark: 100 },
    { subject: 'Collection', A: 68, fullMark: 100 },
    { subject: 'Compliance', A: 95, fullMark: 100 },
    { subject: 'Delivery', A: 78, fullMark: 100 },
    { subject: 'Quality', A: 88, fullMark: 100 },
];

const topProjects = [
    { name: 'Patna Metro B', revenue: 120, margin: 28, client: 'PMRCL' },
    { name: 'SWPL-BRGF', revenue: 42.5, margin: 24, client: 'BRDA' },
    { name: 'Solar Muzaffarpur', revenue: 85, margin: 31, client: 'BSD' },
    { name: 'HVAC Gaya', revenue: 28, margin: 19, client: 'GMC' },
    { name: 'Interior TechCorp', revenue: 15.5, margin: 22, client: 'TCI' },
];

export default function FinancialAnalytics() {
    const [period, setPeriod] = useState('FY 2025-26');

    return (
        <div className="space-y-5 animate-fade-in">
            {/* Period selector */}
            <div className="flex items-center gap-3">
                {['FY 2025-26', 'Q4 2025-26', 'Q3 2025-26'].map(p => (
                    <button key={p}
                        onClick={() => setPeriod(p)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${period === p ? 'bg-brand border-brand/50 text-slate-900' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-900'}`}>
                        {p}
                    </button>
                ))}
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Revenue', value: '₹4.82 Cr', change: '+18.4%', positive: true, color: 'text-green-400' },
                    { label: 'Net Profit', value: '₹1.12 Cr', change: '+22.1%', positive: true, color: 'text-emerald-400' },
                    { label: 'Days Sales Outstanding', value: '42 days', change: '-3 days', positive: true, color: 'text-blue-400' },
                    { label: 'Working Capital', value: '₹1.86 Cr', change: '+12.5%', positive: true, color: 'text-purple-400' },
                ].map((kpi, i) => (
                    <div key={i} className="card p-4">
                        <p className="text-slate-400 text-sm mb-2">{kpi.label}</p>
                        <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
                        <p className={`text-xs mt-1 font-medium ${kpi.positive ? 'text-green-400' : 'text-red-400'}`}>{kpi.change} vs prev period</p>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                {/* Revenue vs Target */}
                <div className="xl:col-span-2 card p-5">
                    <h3 className="section-title mb-1">Revenue vs Target (₹L)</h3>
                    <p className="text-slate-400 text-sm mb-4">Monthly performance vs targets</p>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={revenueByMonth} margin={{ left: -20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }} />
                            <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                            <Bar dataKey="target" name="Target" fill="#334155" radius={[3, 3, 0, 0]} />
                            <Line dataKey="profit" name="Profit" stroke="#22c55e" dot={false} strokeWidth={2} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Expense Breakdown */}
                <div className="card p-5">
                    <h3 className="section-title mb-1">Cost Breakdown</h3>
                    <p className="text-slate-400 text-sm mb-4">By category (%)</p>
                    <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                            <Pie data={expenseBreakdown} cx="50%" cy="50%" outerRadius={65} dataKey="value" labelLine={false}
                                label={({ value }) => `${value}%`}>
                                {expenseBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1.5 mt-2">
                        {expenseBreakdown.map((e, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i] }} />
                                <span className="text-slate-400 text-xs flex-1">{e.name}</span>
                                <span className="text-slate-800 text-xs font-medium">{e.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {/* Top Projects by Revenue */}
                <div className="card">
                    <div className="px-5 py-4 border-b border-slate-200">
                        <h3 className="section-title">Top Projects by Revenue</h3>
                    </div>
                    <div className="p-5 space-y-3">
                        {topProjects.map((p, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <span className="text-slate-400 text-sm font-mono w-4">{i + 1}</span>
                                <div className="flex-1">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-slate-900 text-sm font-medium">{p.name}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-slate-400 text-xs">{p.client}</span>
                                            <span className="text-slate-900 text-sm font-bold">₹{p.revenue}L</span>
                                            <span className="badge badge-green">{p.margin}%</span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 rounded-full h-1.5">
                                        <div className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                                            style={{ width: `${(p.revenue / 120) * 100}%` }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* KPI Radar */}
                <div className="card p-5">
                    <h3 className="section-title mb-1">Business KPI Radar</h3>
                    <p className="text-slate-400 text-sm mb-3">Overall business health score</p>
                    <ResponsiveContainer width="100%" height={220}>
                        <RadarChart data={kpiData} margin={{ top: 5, right: 30, bottom: 5, left: 30 }}>
                            <PolarGrid stroke="#334155" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                            <Radar name="Performance" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
                            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
