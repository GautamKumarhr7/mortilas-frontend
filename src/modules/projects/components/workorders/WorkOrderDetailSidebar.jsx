import { X, Building, User, FileText, Calendar, DollarSign, ArrowUpRight } from 'lucide-react';

export default function WorkOrderDetailSidebar({ isOpen, workOrder, onClose, onEdit }) {
    if (!isOpen || !workOrder) return null;

    const estimatedCost = Number(workOrder.estimatedCost) || 0;
    const progress = Number(workOrder.progress) || 0;
    const unbilled = estimatedCost - (estimatedCost * (progress / 100));
    const retention = 5; // Default retention if not provided


    return (
        <>
            <div className="fixed inset-0 z-[110] bg-slate-900/10 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />
            <div className="fixed right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl z-[120] animate-slide-in-right flex flex-col border-l border-slate-100">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                    <div>
                        <span className="text-[10px] font-black text-green-700 bg-green-50 px-2 py-1 rounded-lg uppercase tracking-widest">{workOrder.workOrderNo || `WO-${workOrder.id}`}</span>
                        <h2 className="text-xl font-black text-slate-900 mt-2 tracking-tight leading-tight">{workOrder.title}</h2>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 space-y-10 no-scrollbar">
                    {/* Execution Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="card p-5 bg-[#1e3a34] text-white border-0">
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Job Completion</p>
                            <h3 className="text-3xl font-black mt-1 tracking-tighter">{progress}%</h3>
                            <div className="mt-4 h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                                <div className="h-full bg-green-400 rounded-full" style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                        <div className="card p-5 border-slate-100 bg-slate-50">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
                            <h3 className="text-xl font-black text-slate-900 mt-1 capitalize">{workOrder.status || 'Active'}</h3>
                            <p className="text-[10px] text-green-600 font-bold mt-2 uppercase tracking-tight">Active Contract</p>
                        </div>
                    </div>

                    {/* Context Details */}
                    <div className="space-y-6">
                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Contextual Information</h4>
                        <div className="grid grid-cols-1 gap-6">
                            <div className="flex items-start gap-4">
                                <div className="p-2.5 rounded-xl bg-slate-50 text-slate-500"><Building className="w-5 h-5" /></div>
                                <div>
                                    <p className="text-slate-900 font-bold text-sm">Parent Project</p>
                                    <p className="text-slate-500 text-xs font-medium">{workOrder.projectCode || `Proj #${workOrder.projectId}`}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-2.5 rounded-xl bg-slate-50 text-slate-500"><User className="w-5 h-5" /></div>
                                <div>
                                    <p className="text-slate-900 font-bold text-sm">Subcontractor</p>
                                    <p className="text-slate-500 text-xs font-medium">{workOrder.subcontractorName || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-2.5 rounded-xl bg-slate-50 text-slate-500"><Calendar className="w-5 h-5" /></div>
                                <div>
                                    <p className="text-slate-900 font-bold text-sm">Timeline</p>
                                    <p className="text-slate-500 text-xs font-medium">{workOrder.startDate ? new Date(workOrder.startDate).toLocaleDateString() : 'N/A'} to {workOrder.endDate ? new Date(workOrder.endDate).toLocaleDateString() : 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="space-y-6">
                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Commercials</h4>
                        <div className="card p-6 border-slate-100 bg-green-50/30">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 font-bold text-xs uppercase">Contract Value</span>
                                    <span className="text-slate-900 font-black">₹{estimatedCost.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 font-bold text-xs uppercase">Retention ({retention}%)</span>
                                    <span className="text-amber-700 font-black">₹{(estimatedCost * (retention / 100)).toLocaleString()}</span>
                                </div>
                                <div className="pt-4 border-t border-dashed border-green-200 flex justify-between items-center">
                                    <span className="text-green-800 font-black uppercase text-xs">Estimated Outstanding</span>
                                    <span className="text-[#1e3a34] font-black">₹{unbilled.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t border-slate-50 grid grid-cols-2 gap-4">
                    <button 
                        onClick={(e) => onEdit(e, workOrder)}
                        className="px-6 py-4 bg-white border border-slate-100 text-slate-900 font-black rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
                    >
                        Modify Order
                    </button>
                    <button className="px-6 py-4 bg-[#1e3a34] text-white font-black rounded-2xl shadow-lg shadow-green-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                        <FileText className="w-5 h-5" /> Print WO
                    </button>
                </div>
            </div>
        </>
    );
}
