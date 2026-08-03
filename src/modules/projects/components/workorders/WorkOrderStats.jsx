import { ClipboardList, AlertCircle, TrendingUp, CheckCircle2 } from 'lucide-react';

export default function WorkOrderStats({ stats }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s, i) => (
                <div key={i} className="card p-4 flex flex-col justify-center">
                    <div className="flex items-center justify-between">
                        <p className="text-slate-500 text-sm font-medium">{s.label}</p>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.bg} ${s.color}`}>
                            <s.icon className="w-4 h-4" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mt-2">{s.value}</h3>
                </div>
            ))}
        </div>
    );
}
