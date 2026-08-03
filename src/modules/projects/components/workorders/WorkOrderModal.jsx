import { useState, useEffect } from 'react';
import { X, Loader2, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { subcontractorAPI, inventoryAPI } from '../../../operations/services';

const statusOptions = ['pending', 'approved', 'rejected'];

export default function WorkOrderModal({ isOpen, isEditing, formData, isSaving, onClose, onSave, onInputChange, projects = [], sites = [] }) {
    const [boqItems, setBoqItems] = useState([]);
    const [billingMilestones, setBillingMilestones] = useState([]);
    const [approvals, setApprovals] = useState({ siteEngineer: false, projectManager: false, departmentHead: false });

    const [subcontractors, setSubcontractors] = useState([]);
    const [materials, setMaterials] = useState([]);
    
    // Quick Add Material State
    const [showQuickMaterial, setShowQuickMaterial] = useState(null); // track index of boqItem
    const [newMaterialName, setNewMaterialName] = useState('');
    const [isSavingMaterial, setIsSavingMaterial] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setBoqItems(formData?.boqItems || []);
            setBillingMilestones(formData?.billingMilestones || []);
            setApprovals(formData?.approvals || { siteEngineer: false, projectManager: false, departmentHead: false });
            fetchDropdownData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, formData?.id]);

    const fetchDropdownData = async () => {
        try {
            const [subRes, matRes] = await Promise.all([
                subcontractorAPI.getAllSubcontractors().catch(() => []),
                inventoryAPI.getAllMaterials().catch(() => [])
            ]);
            // If data format has .data
            setSubcontractors(subRes?.data || subRes || []);
            setMaterials(matRes?.data || matRes || []);
        } catch (error) {
            console.error('Failed to fetch dropdown data', error);
        }
    };

    const handleQuickCreateMaterial = async (idx) => {
        if (!newMaterialName.trim()) return;
        setIsSavingMaterial(true);
        try {
            const res = await inventoryAPI.createMaterial({ 
                itemName: newMaterialName,
                category: 'General',
                warehouseLocation: 'Main',
                hsn: '0000',
                quantity: 0,
                unit: 'Nos',
                price: 0
            });
            const created = res?.data || res;
            setMaterials([...materials, created]);
            
            // Auto select it for the BOQ line item
            const newItems = [...boqItems]; 
            newItems[idx].description = created.itemName;
            setBoqItems(newItems);
            
            setShowQuickMaterial(null);
            setNewMaterialName('');
        } catch (err) {
            console.error(err);
        } finally {
            setIsSavingMaterial(false);
        }
    };

    const calculateTotal = () => {
        return boqItems.reduce((acc, item) => acc + (parseFloat(item.quantity || 0) * parseFloat(item.rate || 0)), 0);
    };

    if (!isOpen) return null;

    const totalCalculated = calculateTotal();

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-[#1e3a34] text-white shrink-0">
                    <div>
                        <h2 className="text-base font-semibold">{isEditing ? 'Update Work Order' : 'Create Work Order'}</h2>
                        <p className="text-xs text-white/60 mt-0.5">Advanced Work Order & BOQ Manager</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={(e) => {
                    e.preventDefault();
                    onSave(e, {
                        boqItems,
                        billingMilestones,
                        approvals,
                        estimatedCost: totalCalculated
                    });
                }} className="flex-1 overflow-y-auto p-6 space-y-8 max-h-[75vh]">
                    
                    {/* SECTION 1: IDENTITY */}
                    <div>
                        <h3 className="text-sm font-semibold text-[#1e3a34] border-b pb-2">1. Work Order Identity</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="space-y-1.5 md:col-span-1">
                                <label className="text-xs font-semibold text-slate-600">Parent Project <span className="text-red-500">*</span></label>
                                <select required name="projectId" value={formData.projectId || ''} onChange={onInputChange} className="input">
                                    <option value="" disabled>Select Project</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.projectCode || `Project #${p.id}`} - {p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5 md:col-span-1">
                                <label className="text-xs font-semibold text-slate-600">Site</label>
                                <select name="siteId" value={formData.siteId || ''} onChange={onInputChange} className="input">
                                    <option value="">Select Site (Optional)</option>
                                    {sites.filter(s => !formData.projectId || String(s.projectId) === String(formData.projectId)).map(s => (
                                        <option key={s.id} value={s.id}>{s.name || s.siteCode}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5 md:col-span-1">
                                <label className="text-xs font-semibold text-slate-600">Title <span className="text-red-500">*</span></label>
                                <input required name="title" value={formData.title || ''} onChange={onInputChange} className="input" placeholder="e.g. Electrical Wiring Phase 1" />
                            </div>
                            <div className="space-y-1.5 md:col-span-1">
                                <label className="text-xs font-semibold text-slate-600">Subcontractor <span className="text-red-500">*</span></label>
                                <select required name="subcontractorId" value={formData.subcontractorId || ''} onChange={onInputChange} className="input">
                                    <option value="" disabled>Select Subcontractor</option>
                                    {subcontractors.map(sub => (
                                        <option key={sub.id} value={sub.id}>{sub.companyName || sub.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="md:col-span-2 space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600">Work Description</label>
                                <textarea name="description" value={formData.description || ''} onChange={onInputChange} className="input" rows="2" placeholder="Describe the scope of work..." />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: BOQ & SCOPE */}
                    <div>
                        <div className="flex justify-between items-end border-b pb-2">
                            <h3 className="text-sm font-semibold text-[#1e3a34]">2. Scope & Bill of Quantities (BOQ)</h3>
                            <button type="button" onClick={() => setBoqItems([...boqItems, { id: Date.now(), description: '', unit: '', quantity: 0, rate: 0, completionPercentage: 0 }])} className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded hover:bg-emerald-100 flex items-center gap-1">
                                <Plus className="w-3 h-3" /> Add Item
                            </button>
                        </div>
                        <div className="mt-4 space-y-3">
                            {boqItems.map((item, idx) => (
                                <div key={item.id} className="flex flex-col gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200 relative">
                                    <div className="flex gap-2 items-center">
                                        <div className="flex-[2] relative">
                                            {showQuickMaterial === idx ? (
                                                <div className="flex gap-1">
                                                    <input autoFocus className="input py-1.5 px-2 text-xs flex-1" placeholder="New Material Name *" value={newMaterialName} onChange={(e) => setNewMaterialName(e.target.value)} />
                                                    <button type="button" onClick={() => handleQuickCreateMaterial(idx)} disabled={isSavingMaterial} className="bg-emerald-600 text-white px-2 py-1 text-xs rounded hover:bg-emerald-700 whitespace-nowrap">Save</button>
                                                    <button type="button" onClick={() => setShowQuickMaterial(null)} className="bg-slate-200 text-slate-700 px-2 py-1 text-xs rounded hover:bg-slate-300">Cancel</button>
                                                </div>
                                            ) : (
                                                <select className="input py-1.5 px-2 text-xs w-full" value={item.description} onChange={(e) => {
                                                    if (e.target.value === 'create_new') {
                                                        setShowQuickMaterial(idx);
                                                    } else {
                                                        const newItems = [...boqItems]; newItems[idx].description = e.target.value; setBoqItems(newItems);
                                                    }
                                                }}>
                                                    <option value="" disabled>Select Material</option>
                                                    {materials.map(mat => (
                                                        <option key={mat.id} value={mat.itemName}>{mat.itemName}</option>
                                                    ))}
                                                    <option value="create_new" className="font-semibold text-emerald-600">+ Add New Material</option>
                                                </select>
                                            )}
                                        </div>
                                        <select className="input py-1.5 px-2 text-xs flex-[1]" value={item.unit || ''} onChange={(e) => {
                                            const newItems = [...boqItems]; newItems[idx].unit = e.target.value; setBoqItems(newItems);
                                        }}>
                                            <option value="" disabled>Unit</option>
                                            <option value="Nos">Nos</option>
                                            <option value="SqFt">SqFt</option>
                                            <option value="SqM">SqM</option>
                                            <option value="CuM">CuM</option>
                                            <option value="RMT">RMT</option>
                                            <option value="Kg">Kg</option>
                                            <option value="Ton">Ton</option>
                                            <option value="Ltr">Ltr</option>
                                            <option value="Lumpsum">Lumpsum</option>
                                        </select>
                                        <input type="number" step="any" className="input py-1.5 px-2 text-xs flex-[1]" placeholder="Qty" value={item.quantity} onChange={(e) => {
                                            const newItems = [...boqItems]; newItems[idx].quantity = e.target.value; setBoqItems(newItems);
                                        }} />
                                        <input type="number" step="any" className="input py-1.5 px-2 text-xs flex-[1]" placeholder="Rate" value={item.rate} onChange={(e) => {
                                            const newItems = [...boqItems]; newItems[idx].rate = e.target.value; setBoqItems(newItems);
                                        }} />
                                        <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold flex-[1] text-right text-slate-700">
                                            ₹{(item.quantity * item.rate).toLocaleString()}
                                        </div>
                                        <button type="button" onClick={() => setBoqItems(boqItems.filter((_, i) => i !== idx))} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {boqItems.length === 0 && <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">No BOQ items added. Add items to calculate total estimated cost.</p>}
                            <div className="flex justify-end pt-2">
                                <div className="text-sm font-bold text-slate-800 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                                    Total Estimated Cost: ₹{totalCalculated.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: BILLING MILESTONES */}
                    <div>
                        <div className="flex justify-between items-end border-b pb-2">
                            <h3 className="text-sm font-semibold text-[#1e3a34]">3. Billing Milestones</h3>
                            <button type="button" onClick={() => setBillingMilestones([...billingMilestones, { id: Date.now(), milestoneName: '', percentage: 0, status: 'Pending' }])} className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded hover:bg-emerald-100 flex items-center gap-1">
                                <Plus className="w-3 h-3" /> Add Milestone
                            </button>
                        </div>
                        <div className="mt-4 space-y-3">
                            {billingMilestones.map((milestone, idx) => (
                                <div key={milestone.id} className="flex gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
                                    <input className="input py-1.5 px-2 text-xs flex-[2]" placeholder="Milestone Trigger (e.g. 50% Completion)" value={milestone.milestoneName} onChange={(e) => {
                                        const newMs = [...billingMilestones]; newMs[idx].milestoneName = e.target.value; setBillingMilestones(newMs);
                                    }} />
                                    <div className="flex items-center gap-1 flex-[1]">
                                        <input type="number" step="any" className="input py-1.5 px-2 text-xs w-full" placeholder="%" value={milestone.percentage} onChange={(e) => {
                                            const newMs = [...billingMilestones]; newMs[idx].percentage = e.target.value; setBillingMilestones(newMs);
                                        }} />
                                        <span className="text-xs text-slate-400 font-bold">%</span>
                                    </div>
                                    <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold flex-[1.5] text-slate-700 flex justify-between items-center">
                                        <span className="text-[10px] text-slate-400 uppercase">Amount</span>
                                        <span>₹{((totalCalculated * milestone.percentage) / 100).toLocaleString()}</span>
                                    </div>
                                    <select className="input py-1.5 px-2 text-xs flex-[1]" value={milestone.status} onChange={(e) => {
                                        const newMs = [...billingMilestones]; newMs[idx].status = e.target.value; setBillingMilestones(newMs);
                                    }}>
                                        <option value="Pending">Pending</option>
                                        <option value="Triggered">Triggered</option>
                                        <option value="Invoiced">Invoiced</option>
                                        <option value="Paid">Paid</option>
                                    </select>
                                    <button type="button" onClick={() => setBillingMilestones(billingMilestones.filter((_, i) => i !== idx))} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {billingMilestones.length === 0 && <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">No billing milestones specified.</p>}
                        </div>
                    </div>

                    {/* SECTION 4: PROGRESS & APPROVALS */}
                    <div>
                        <h3 className="text-sm font-semibold text-[#1e3a34] border-b pb-2">4. Execution & Approvals</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Start Date</label>
                                    <input type="date" name="startDate" value={formData.startDate || ''} onChange={onInputChange} className="input" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">End Date</label>
                                    <input type="date" name="endDate" value={formData.endDate || ''} onChange={onInputChange} className="input" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Order Status</label>
                                    <select name="status" value={formData.status || 'pending'} onChange={onInputChange} className="input">
                                        {statusOptions.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                                    </select>
                                </div>
                                {isEditing && (
                                    <div className="space-y-2 pt-2">
                                        <div className="flex justify-between text-xs font-bold text-slate-600">
                                            <label>Overall Completion</label>
                                            <span className="text-emerald-600">{formData.progress || 0}%</span>
                                        </div>
                                        <input type="range" min="0" max="100" name="progress" value={formData.progress || 0} onChange={onInputChange} className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-emerald-600" />
                                    </div>
                                )}
                            </div>
                            
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <h4 className="text-xs font-black uppercase text-slate-500 mb-4 tracking-wider">Multi-Tier Approval Workflow</h4>
                                <div className="space-y-4">
                                    <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-emerald-500 transition-colors">
                                        <input type="checkbox" checked={approvals.siteEngineer} onChange={(e) => setApprovals({...approvals, siteEngineer: e.target.checked})} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" />
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-slate-800">Site Engineer</p>
                                            <p className="text-[10px] text-slate-500 uppercase">Field Verification</p>
                                        </div>
                                        {approvals.siteEngineer && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                                    </label>
                                    <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-emerald-500 transition-colors">
                                        <input type="checkbox" checked={approvals.projectManager} onChange={(e) => setApprovals({...approvals, projectManager: e.target.checked})} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" />
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-slate-800">Project Manager</p>
                                            <p className="text-[10px] text-slate-500 uppercase">Scope & Cost Approval</p>
                                        </div>
                                        {approvals.projectManager && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                                    </label>
                                    <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-emerald-500 transition-colors">
                                        <input type="checkbox" checked={approvals.departmentHead} onChange={(e) => setApprovals({...approvals, departmentHead: e.target.checked})} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" />
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-slate-800">Department Head</p>
                                            <p className="text-[10px] text-slate-500 uppercase">Final Authorization</p>
                                        </div>
                                        {approvals.departmentHead && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
                        <button type="button" onClick={onClose} disabled={isSaving} className="btn-secondary flex-1">Cancel</button>
                        <button type="submit" disabled={isSaving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                            {isSaving
                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                                : (isEditing ? 'Update Work Order' : 'Create Work Order')
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
