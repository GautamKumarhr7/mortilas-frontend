import React from 'react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';

export default function ProgressCharts() {
    // Analytics Data
    const velocityData = [
        { name: 'Mon', value: 35 },
        { name: 'Tue', value: 58 },
        { name: 'Wed', value: 42 },
        { name: 'Thu', value: 65 },
        { name: 'Fri', value: 55 },
        { name: 'Sat', value: 80 },
        { name: 'Sun', value: 72 },
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Daily Execution Velocity */}
            <div className="lg:col-span-8 bg-white rounded-3xl p-8 shadow-lg shadow-slate-200/20 border border-slate-50 relative overflow-hidden group">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Execution Load</h3>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">7-Day Intensity</p>
                    </div>
                    <select className="bg-slate-50 border-0 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg outline-none cursor-pointer hover:bg-slate-100">
                        <option>Week</option>
                        <option>Month</option>
                    </select>
                </div>
                
                <div className="h-[260px] w-full min-w-0 min-h-[1px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={velocityData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                            <Tooltip 
                                cursor={{fill: '#f8fafc', radius: 8}}
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', background: '#0f172a', padding: '10px' }}
                                itemStyle={{ color: '#10b981', fontSize: '10px', fontWeight: '900' }}
                            />
                            <Bar dataKey="value" radius={[8, 8, 8, 8]} barSize={20}>
                                {velocityData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index === velocityData.length - 2 ? '#3b82f6' : '#f1f5f9'} className="hover:fill-blue-400 transition-colors cursor-pointer" />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Functional Health */}
            <div className="lg:col-span-4 bg-slate-900 rounded-3xl p-8 text-white relative flex flex-col items-center justify-center overflow-hidden shadow-xl shadow-slate-900/30">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-emerald-600/5" />
                <div className="w-full text-center mb-6 relative z-10">
                    <h3 className="text-lg font-black tracking-tight uppercase tracking-wider">Functional Density</h3>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Asset Allocation</p>
                </div>
                
                <div className="h-[220px] w-full mt-2 flex items-center justify-center relative z-10 min-w-0 min-h-[1px]">
                    <div className="absolute text-center">
                        <span className="text-2xl font-black tracking-tighter text-emerald-400">88%</span>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={[{ name: 'A', value: 65 }, { name: 'B', value: 20 }, { name: 'C', value: 15 }]}
                                cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={10} dataKey="value" stroke="none" cornerRadius={6}
                            >
                                <Cell fill="#10b981" /><Cell fill="#3b82f6" /><Cell fill="#f43f5e" />
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="mt-6 w-full grid grid-cols-3 gap-3 relative z-10">
                    {['CIVIL', 'ELEC', 'SOLAR'].map((tag, i) => (
                        <div key={i} className="text-center p-2 bg-white/5 rounded-xl border border-white/5">
                            <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">{tag}</p>
                            <p className="text-xs font-black text-emerald-400 mt-0.5">{92 - i*10}%</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
