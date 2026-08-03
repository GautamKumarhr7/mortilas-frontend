import { useState } from 'react';
import { X, MapPin, Wrench, Fuel, Calendar, PlayCircle } from 'lucide-react';
import { equipmentAPI } from '../../services';
import toast from 'react-hot-toast';
import { useApp } from '../../../../hooks/useApp';

export default function EquipmentDetailSidebar({ isOpen, data, onClose, onRefresh }) {
    const { equipment, deployments = [], maintenance = [], logs = [] } = data;
    const { projects } = useApp();
    const [activeTab, setActiveTab] = useState('deployments');

    const [showDeployForm, setShowDeployForm] = useState(false);
    const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
    const [showLogForm, setShowLogForm] = useState(false);

    const handleDeploy = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        try {
            await equipmentAPI.deployEquipment(equipment.id, {
                projectId: Number(formData.get('projectId')),
                dispatchDate: formData.get('dispatchDate'),
                expectedReturnDate: formData.get('expectedReturnDate') || null,
                operatorName: formData.get('operatorName') || null,
                readingOut: formData.get('readingOut') ? Number(formData.get('readingOut')) : null,
            });
            toast.success('Equipment deployed successfully');
            setShowDeployForm(false);
            onRefresh();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Deployment failed');
        }
    };

    const handleReturn = async (deploymentId) => {
        try {
            await equipmentAPI.returnEquipment(equipment.id, deploymentId, {
                readingIn: prompt('Enter current odometer/hour reading (optional):') || null
            });
            toast.success('Equipment returned');
            onRefresh();
        } catch (err) {
            toast.error('Return failed');
        }
    };

    const handleMaintenance = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        try {
            await equipmentAPI.logMaintenance(equipment.id, {
                type: formData.get('type'),
                maintenanceDate: formData.get('maintenanceDate'),
                reportedIssue: formData.get('reportedIssue'),
                actionTaken: formData.get('actionTaken'),
                cost: formData.get('cost') ? Number(formData.get('cost')) : null,
                downtimeHours: formData.get('downtimeHours') ? Number(formData.get('downtimeHours')) : null,
                status: formData.get('status'),
                performedBy: formData.get('performedBy')
            });
            toast.success('Maintenance logged');
            setShowMaintenanceForm(false);
            onRefresh();
        } catch (err) {
            toast.error('Failed to log maintenance');
        }
    };

    const handleLog = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        try {
            await equipmentAPI.logFuelOrUtilization(equipment.id, {
                projectId: formData.get('projectId') ? Number(formData.get('projectId')) : null,
                logDate: formData.get('logDate'),
                logType: formData.get('logType'),
                fuelLitres: formData.get('fuelLitres') ? Number(formData.get('fuelLitres')) : null,
                fuelRate: formData.get('fuelRate') ? Number(formData.get('fuelRate')) : null,
                fuelCost: (Number(formData.get('fuelLitres') || 0) * Number(formData.get('fuelRate') || 0)) || null,
                hoursOperated: formData.get('hoursOperated') ? Number(formData.get('hoursOperated')) : null,
                kmOperated: formData.get('kmOperated') ? Number(formData.get('kmOperated')) : null,
                remarks: formData.get('remarks')
            });
            toast.success('Log saved');
            setShowLogForm(false);
            onRefresh();
        } catch (err) {
            toast.error('Failed to save log');
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[100] animate-fade-in" onClick={onClose} />
            <div className="fixed right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl z-[101] flex flex-col animate-slide-in-right">
                
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="px-2.5 py-1 bg-white border border-slate-200 text-slate-600 font-bold text-xs rounded-lg uppercase tracking-wider">{equipment.category}</span>
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                equipment.status === 'available' ? 'bg-blue-100 text-blue-700' :
                                equipment.status === 'deployed' ? 'bg-emerald-100 text-emerald-700' :
                                'bg-amber-100 text-amber-700'
                            }`}>
                                {equipment.status}
                            </span>
                        </div>
                        <h2 className="text-2xl font-black text-slate-900">{equipment.name}</h2>
                        <p className="text-sm font-medium text-slate-500">{equipment.make} {equipment.model} {equipment.serialNumber ? `• S/N: ${equipment.serialNumber}` : ''}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:bg-white hover:text-slate-600 rounded-xl transition-colors shadow-sm">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 px-6 pt-2 bg-slate-50">
                    <button onClick={() => setActiveTab('deployments')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'deployments' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                        <MapPin className="w-4 h-4" /> Deployments
                    </button>
                    <button onClick={() => setActiveTab('maintenance')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'maintenance' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                        <Wrench className="w-4 h-4" /> Maintenance
                    </button>
                    <button onClick={() => setActiveTab('logs')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'logs' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                        <Fuel className="w-4 h-4" /> Logs
                    </button>
                </div>

                {/* Content area */}
                <div className="flex-1 overflow-y-auto p-6">
                    
                    {/* DEPLOYMENTS TAB */}
                    {activeTab === 'deployments' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Deployment History</h3>
                                {equipment.status !== 'deployed' && (
                                    <button onClick={() => setShowDeployForm(!showDeployForm)} className="btn-primary text-xs py-1.5 px-3">
                                        + Deploy to Project
                                    </button>
                                )}
                            </div>

                            {showDeployForm && (
                                <form onSubmit={handleDeploy} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="text-xs font-semibold text-slate-600">Project</label>
                                            <select name="projectId" required className="input">
                                                <option value="">Select Project...</option>
                                                {projects.map(p => <option key={p.id} value={p.id}>[{p.projectCode}] {p.projectName}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-slate-600">Dispatch Date</label>
                                            <input type="date" name="dispatchDate" required className="input" defaultValue={new Date().toISOString().split('T')[0]} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-slate-600">Expected Return</label>
                                            <input type="date" name="expectedReturnDate" className="input" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-slate-600">Operator Name</label>
                                            <input type="text" name="operatorName" className="input" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-slate-600">Odometer/Hours Out</label>
                                            <input type="number" step="0.1" name="readingOut" className="input" />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button type="button" onClick={() => setShowDeployForm(false)} className="btn-secondary py-1.5 text-xs">Cancel</button>
                                        <button type="submit" className="btn-primary py-1.5 text-xs">Save Deployment</button>
                                    </div>
                                </form>
                            )}

                            <div className="space-y-3">
                                {deployments.length === 0 ? (
                                    <p className="text-sm text-slate-500 italic text-center py-4">No deployment history.</p>
                                ) : (
                                    deployments.map(d => (
                                        <div key={d.deployment.id} className="border border-slate-100 rounded-xl p-4 bg-white shadow-sm flex flex-col gap-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">{d.projectCode}</p>
                                                    <p className="text-xs text-slate-500 font-medium">{d.projectName}</p>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${d.deployment.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                    {d.deployment.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-6 text-xs text-slate-600">
                                                <div>
                                                    <span className="block text-[10px] text-slate-400 font-semibold uppercase">Out</span>
                                                    {new Date(d.deployment.dispatchDate).toLocaleDateString()}
                                                </div>
                                                <div>
                                                    <span className="block text-[10px] text-slate-400 font-semibold uppercase">In</span>
                                                    {d.deployment.actualReturnDate ? new Date(d.deployment.actualReturnDate).toLocaleDateString() : '—'}
                                                </div>
                                                {d.deployment.operatorName && (
                                                    <div>
                                                        <span className="block text-[10px] text-slate-400 font-semibold uppercase">Operator</span>
                                                        {d.deployment.operatorName}
                                                    </div>
                                                )}
                                            </div>
                                            {d.deployment.status === 'active' && (
                                                <div className="border-t border-slate-100 pt-3 mt-1 flex justify-end">
                                                    <button onClick={() => handleReturn(d.deployment.id)} className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors">
                                                        Mark as Returned
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* MAINTENANCE TAB */}
                    {activeTab === 'maintenance' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Maintenance Logs</h3>
                                <button onClick={() => setShowMaintenanceForm(!showMaintenanceForm)} className="btn-primary bg-amber-500 hover:bg-amber-600 text-white border-none text-xs py-1.5 px-3">
                                    + Log Maintenance
                                </button>
                            </div>

                            {showMaintenanceForm && (
                                <form onSubmit={handleMaintenance} className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-semibold text-slate-600">Type</label>
                                            <select name="type" required className="input bg-white">
                                                <option value="preventive">Preventive</option>
                                                <option value="breakdown">Breakdown</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-slate-600">Status</label>
                                            <select name="status" required className="input bg-white">
                                                <option value="completed">Completed</option>
                                                <option value="in_progress">In Progress</option>
                                                <option value="scheduled">Scheduled</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-slate-600">Date</label>
                                            <input type="date" name="maintenanceDate" required className="input bg-white" defaultValue={new Date().toISOString().split('T')[0]} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-slate-600">Performed By</label>
                                            <input type="text" name="performedBy" className="input bg-white" placeholder="Mechanic/Vendor Name" />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-xs font-semibold text-slate-600">Issue Reported</label>
                                            <input type="text" name="reportedIssue" className="input bg-white" />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-xs font-semibold text-slate-600">Action Taken</label>
                                            <input type="text" name="actionTaken" className="input bg-white" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-slate-600">Cost (₹)</label>
                                            <input type="number" step="0.01" name="cost" className="input bg-white" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-slate-600">Downtime (Hours)</label>
                                            <input type="number" step="0.5" name="downtimeHours" className="input bg-white" />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button type="button" onClick={() => setShowMaintenanceForm(false)} className="btn-secondary py-1.5 text-xs bg-white">Cancel</button>
                                        <button type="submit" className="btn-primary bg-amber-600 hover:bg-amber-700 py-1.5 text-xs">Save Maintenance</button>
                                    </div>
                                </form>
                            )}

                            <div className="space-y-3">
                                {maintenance.length === 0 ? (
                                    <p className="text-sm text-slate-500 italic text-center py-4">No maintenance history.</p>
                                ) : (
                                    maintenance.map(m => (
                                        <div key={m.id} className="border border-slate-100 rounded-xl p-4 bg-white shadow-sm space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mr-2 ${m.type === 'breakdown' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                                        {m.type}
                                                    </span>
                                                    <span className="text-xs font-semibold text-slate-500">{new Date(m.maintenanceDate).toLocaleDateString()}</span>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${m.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {m.status}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">{m.reportedIssue || 'Routine Checkup'}</p>
                                                {m.actionTaken && <p className="text-xs text-slate-600 mt-1">{m.actionTaken}</p>}
                                            </div>
                                            <div className="flex items-center gap-4 text-xs font-medium text-slate-500 bg-slate-50 p-2 rounded-lg">
                                                <span>Cost: <strong className="text-slate-900">₹{m.cost || 0}</strong></span>
                                                <span>Downtime: <strong className="text-slate-900">{m.downtimeHours || 0}h</strong></span>
                                                {m.performedBy && <span>By: <strong className="text-slate-900">{m.performedBy}</strong></span>}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* LOGS TAB */}
                    {activeTab === 'logs' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Usage & Fuel Logs</h3>
                                <button onClick={() => setShowLogForm(!showLogForm)} className="btn-primary bg-blue-600 hover:bg-blue-700 text-white border-none text-xs py-1.5 px-3">
                                    + Add Log
                                </button>
                            </div>

                            {showLogForm && (
                                <form onSubmit={handleLog} className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-semibold text-slate-600">Log Date</label>
                                            <input type="date" name="logDate" required className="input bg-white" defaultValue={new Date().toISOString().split('T')[0]} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-slate-600">Type</label>
                                            <select name="logType" required className="input bg-white">
                                                <option value="fuel">Fuel / Diesel</option>
                                                <option value="utilization">Utilization / Reading</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-slate-600">Project Allocation (Optional)</label>
                                            <select name="projectId" className="input bg-white">
                                                <option value="">None</option>
                                                {projects.map(p => <option key={p.id} value={p.id}>{p.projectCode}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-slate-600">Hours Operated</label>
                                            <input type="number" step="0.5" name="hoursOperated" className="input bg-white" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-slate-600">Fuel (Litres)</label>
                                            <input type="number" step="0.1" name="fuelLitres" className="input bg-white" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-slate-600">Fuel Rate (₹/L)</label>
                                            <input type="number" step="0.01" name="fuelRate" className="input bg-white" />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-xs font-semibold text-slate-600">Remarks</label>
                                            <input type="text" name="remarks" className="input bg-white" />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button type="button" onClick={() => setShowLogForm(false)} className="btn-secondary py-1.5 text-xs bg-white">Cancel</button>
                                        <button type="submit" className="btn-primary bg-blue-600 hover:bg-blue-700 py-1.5 text-xs">Save Log</button>
                                    </div>
                                </form>
                            )}

                            <div className="space-y-3">
                                {logs.length === 0 ? (
                                    <p className="text-sm text-slate-500 italic text-center py-4">No logs recorded.</p>
                                ) : (
                                    logs.map(l => (
                                        <div key={l.log.id} className="border border-slate-100 rounded-xl p-3 bg-white shadow-sm flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${l.log.logType === 'fuel' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                    {l.log.logType === 'fuel' ? <Fuel className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">{new Date(l.log.logDate).toLocaleDateString()} <span className="text-slate-400 font-normal ml-1">({l.projectCode || 'Unassigned'})</span></p>
                                                    <p className="text-xs text-slate-500 mt-0.5">{l.log.remarks || l.log.logType}</p>
                                                </div>
                                            </div>
                                            <div className="text-right text-sm">
                                                {l.log.logType === 'fuel' ? (
                                                    <>
                                                        <p className="font-bold text-blue-700">{l.log.fuelLitres}L <span className="text-xs font-medium text-slate-400 ml-1">@ ₹{l.log.fuelRate}</span></p>
                                                        <p className="text-xs font-bold text-slate-900 mt-0.5">₹{l.log.fuelCost}</p>
                                                    </>
                                                ) : (
                                                    <p className="font-bold text-emerald-700">{l.log.hoursOperated || l.log.kmOperated} <span className="text-xs font-medium text-slate-400">hrs/km</span></p>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
