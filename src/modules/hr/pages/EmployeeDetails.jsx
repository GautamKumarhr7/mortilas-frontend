import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setActiveModule } from '../../../store/slices/uiSlice';
import { useApp } from '../../../hooks/useApp';
import {
    ArrowLeft, Mail, Phone, MapPin, Briefcase, Calendar,
    CreditCard, ShieldCheck, FileText, Download, Edit2,
    BarChart3, Clock, CheckCircle2, AlertCircle, Save, X,
    ChevronDown, Upload, Cloud, Eye, Trash2
} from 'lucide-react';
import { employeeAPI } from '../services';
import toast from 'react-hot-toast';

export default function EmployeeDetails() {
    const dispatch = useDispatch();
    const { selectedEmployee, updateEmployee } = useApp();
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState(null);
    const [activeTab, setActiveTab] = useState('Overview');

    if (!selectedEmployee) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl shadow-sm border border-slate-200">
                <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
                <h2 className="text-xl font-bold text-slate-800">No Employee Selected</h2>
                <p className="text-slate-500 mt-2">Please go back to the Employee Master and select an employee.</p>
                <button
                    onClick={() => dispatch(setActiveModule('employee-master'))}
                    className="mt-6 btn-primary flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to List
                </button>
            </div>
        );
    }

    const startEditing = () => {
        setEditData({ ...selectedEmployee });
        setIsEditing(true);
    };

    const handleSave = async () => {
        try {
            // Map our local state to the expected API body
            const payload = {
                name: editData.name,
                department: editData.department,
                designation: editData.designation,
                dateOfJoining: editData.doj || editData.dateOfJoining,
                sallery: parseFloat(editData.gross || editData.sallery || 0),
                type: editData.type === 'Permanent' ? 'employee' : editData.type.toLowerCase(),
                pancardUrl: editData.pancardUrl || '',
                aadharUrl: editData.aadharUrl || '',
                pfDeduction: editData.pf === 'Active',
                esiDeduction: !!editData.esi,
                isAdmin: !!editData.isAdmin,
                age: parseInt(editData.age || 0)
            };

            // Ensure we use ONLY the numeric part of the ID for the API, removing lead zeros (e.g., 013 -> 13)
            const numericId = parseInt(selectedEmployee.id.toString().replace(/\D/g, ''), 10);

            await employeeAPI.updateEmployee(numericId, payload);
            
            // Sync local state
            updateEmployee({ ...selectedEmployee, ...editData });
            setIsEditing(false);
            toast.success('Employee updated successfully!');
        } catch (error) {
            console.error('Failed to update employee:', error);
            toast.error(error.response?.data?.message || 'Failed to update employee');
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this employee?')) {
            try {
                // Ensure we use ONLY the numeric part of the ID for the API, removing lead zeros (e.g., 013 -> 13)
                const numericId = parseInt(selectedEmployee.id.toString().replace(/\D/g, ''), 10);
                
                await employeeAPI.deleteEmployee(numericId);
                toast.success('Employee deleted successfully!');
                dispatch(setActiveModule('employee-master'));
            } catch (error) {
                console.error('Failed to delete employee:', error);
                toast.error(error.response?.data?.message || 'Failed to delete employee');
            }
        }
    };

    const employee = isEditing ? editData : selectedEmployee;

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => dispatch(setActiveModule('employee-master'))}
                        className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            {isEditing ? 'Edit Profile' : 'Employee Details'}
                        </h1>
                        <nav className="flex text-sm text-slate-500 mt-1">
                            <span>HR Management</span>
                            <span className="mx-2">/</span>
                            <span className="hover:text-[#2f6645] cursor-pointer" onClick={() => dispatch(setActiveModule('employee-master'))}>Employee Master</span>
                            <span className="mx-2">/</span>
                            <span className="text-slate-900 font-medium">{selectedEmployee.name}</span>
                        </nav>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {isEditing ? (
                        <>
                            <button onClick={() => setIsEditing(false)} className="btn-secondary flex items-center gap-2">
                                <X className="w-4 h-4" /> Cancel
                            </button>
                            <button onClick={handleSave} className="btn-primary flex items-center gap-2 bg-[#2f6645] hover:bg-[#204a30]">
                                <Save className="w-4 h-4" /> Save Changes
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={handleDelete} className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all">
                                <Trash2 className="w-5 h-5" />
                            </button>
                            <button onClick={startEditing} className="btn-primary flex items-center gap-2 bg-[#2f6645] hover:bg-[#204a30]">
                                <Edit2 className="w-4 h-4" /> Edit Profile
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Profile Overview Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Profile Bio */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="card overflow-hidden">
                        <div className="h-24 bg-gradient-to-r from-[#2f6645] to-[#1e3a34]"></div>
                        <div className="px-6 pb-6 -mt-12 text-center">
                            <div className="inline-block relative">
                                <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-lg">
                                    <div className="w-full h-full rounded-xl bg-[#eef2f0] flex items-center justify-center text-[#1e3a34] text-3xl font-bold border border-[#9ae66e]/30">
                                        {selectedEmployee.name.split(' ').map(n => n?.[0]).join('')}
                                    </div>
                                </div>
                                <div className="absolute bottom-1 right-1 w-5 h-5 bg-[#9ae66e] border-2 border-white rounded-full"></div>
                            </div>

                            {isEditing ? (
                                <div className="mt-4 space-y-3">
                                    <input
                                        className="input text-center font-bold text-lg"
                                        value={editData.name}
                                        onChange={e => setEditData({ ...editData, name: e.target.value })}
                                        placeholder="Full Name"
                                    />
                                    <input
                                        className="input text-center text-sm"
                                        value={editData.designation}
                                        onChange={e => setEditData({ ...editData, designation: e.target.value })}
                                        placeholder="Designation"
                                    />
                                </div>
                            ) : (
                                <>
                                    <h2 className="text-xl font-bold text-slate-900 mt-4">{employee.name}</h2>
                                    <p className="text-slate-500 font-medium">{employee.designation}</p>
                                </>
                            )}

                            <div className="mt-3 flex flex-wrap justify-center gap-2">
                                <span className="badge badge-green font-semibold">{employee.department}</span>
                                <span className={`badge ${employee.type === 'Permanent' ? 'badge-green' : 'badge-yellow'}`}>{employee.type}</span>
                            </div>

                            <div className="mt-6 pt-6 border-t border-slate-100 text-left space-y-4">
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-[#2f6645]">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <span>{employee.email || (selectedEmployee.name.toLowerCase().replace(' ', '.') + '@construction.com')}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                                        <Phone className="w-4 h-4" />
                                    </div>
                                    <span>+91 98765 43210</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                                        <MapPin className="w-4 h-4" />
                                    </div>
                                    <span>Muzaffarpur, Bihar, India</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card p-6">
                        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-[#2f6645]" /> Compliance Status
                        </h3>
                        <div className="space-y-3">
                            {[
                                { label: 'PF Registration', status: employee.pf === 'Active' ? 'Verified' : 'Pending', color: employee.pf === 'Active' ? 'text-green-600 bg-green-50' : 'text-amber-600 bg-amber-50' },
                                { label: 'ESI Coverage', status: employee.esi ? 'Verified' : 'Not Applicable', color: employee.esi ? 'text-green-600 bg-green-50' : 'text-slate-400 bg-slate-50' },
                                { label: 'KYC Documents', status: 'Completed', color: 'text-green-600 bg-green-50' },
                                { label: 'Background Check', status: 'Verified', color: 'text-green-600 bg-green-50' },
                            ].map((item, i) => (
                                <div key={i} className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">{item.label}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.color}`}>
                                        {item.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Detailed Info Tabs */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                            { label: 'Joining Date', value: employee.doj, icon: Calendar, color: 'text-green-600', bg: 'bg-green-50' },
                            { label: 'Work Experience', value: '3.5 Years', icon: Briefcase, color: 'text-[#2f6645]', bg: 'bg-green-100/50' },
                            { label: 'Net Pay', value: `₹${employee.net.toLocaleString()}`, icon: CreditCard, color: 'text-[#2f6645]', bg: 'bg-emerald-50' },
                            { label: 'Attendance', value: '98%', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
                        ].map((stat, i) => (
                            <div key={i} className="card p-4 flex flex-col items-center text-center hover:border-[#9ae66e] transition-colors">
                                <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-3 shadow-sm`}>
                                    <stat.icon className="w-5 h-5" />
                                </div>
                                <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">{stat.label}</p>
                                <p className="text-slate-900 font-bold mt-1">{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="card min-h-[500px]">
                        <div className="border-b border-slate-100 bg-[#f8f9fa]">
                            <div className="flex px-6 overflow-x-auto">
                                {['Overview', 'Salary Breakup', 'Documents', 'Activity Log'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-4 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab ? 'border-[#2f6645] text-[#2f6645]' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-6">
                            {activeTab === 'Overview' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    {/* Personal Details Section */}
                                    <section>
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-l-4 border-[#2f6645] pl-3">Employment Details</h3>
                                            {isEditing && <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-1 rounded font-bold uppercase">Editing Mode</span>}
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-12">
                                            {[
                                                { label: 'Employee ID', value: employee.displayId || employee.id, mono: true, readonly: true },
                                                { label: 'Work Location', value: 'Main Office - Patna', field: 'location' },
                                                { label: 'Department', value: employee.department, field: 'department', isSelect: true, options: ['Admin', 'General & Administration', 'HR', 'Accounts', 'Marketing'] },
                                                { label: 'Reporting Manager', value: 'Rajesh Kumar', field: 'manager' },
                                                { label: 'Employee Email', value: employee.email, field: 'email' },
                                                { label: 'Employee Type', value: employee.type, field: 'type', isSelect: true, options: ['Permanent', 'Contract', 'Trainee'] },
                                                { label: 'Date of Joining', value: employee.doj, field: 'doj', isDate: true },
                                            ].map((f, i) => (
                                                <div key={i} className="flex flex-col gap-1.5">
                                                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">{f.label}</span>
                                                    {isEditing && !f.readonly ? (
                                                        f.isSelect ? (
                                                            <div className="relative group/select">
                                                                <select
                                                                    className="select py-1 h-9 pr-8 appearance-none"
                                                                    value={employee[f.field]}
                                                                    onChange={e => setEditData({ ...editData, [f.field]: e.target.value })}
                                                                >
                                                                    {f.options.map(opt => <option key={opt}>{opt}</option>)}
                                                                </select>
                                                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-focus-within/select:text-[#2f6645] transition-colors" />
                                                            </div>
                                                        ) : (
                                                            <input
                                                                type={f.isDate ? 'date' : 'text'}
                                                                className="input py-1 h-9"
                                                                value={employee[f.field] || f.value}
                                                                onChange={e => setEditData({ ...editData, [f.field]: e.target.value })}
                                                            />
                                                        )
                                                    ) : (
                                                        <span className={`text-slate-900 font-medium ${f.mono ? 'font-mono text-sm' : ''}`}>{f.value}</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    <section>
                                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-l-4 border-[#9ae66e] pl-3">Compliance & Financials</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-12">
                                            {[
                                                { label: 'PAN Number', value: employee.pan, mono: true, field: 'pan' },
                                                { label: 'UAN Number', value: employee.uan, mono: true, field: 'uan' },
                                                { label: 'Basic Salary (₹)', value: employee.basic, field: 'basic', isNumber: true },
                                                { label: 'Gross Salary (₹)', value: employee.gross, field: 'gross', isNumber: true },
                                                { label: 'PF Status', value: employee.pf, field: 'pf', isSelect: true, options: ['Active', 'Inactive'] },
                                                { label: 'ESI Coverage', value: employee.esi ? 'Active' : 'Inactive', field: 'esi', isSelect: true, options: ['Active', 'Inactive'] },
                                            ].map((f, i) => (
                                                <div key={i} className="flex flex-col gap-1.5">
                                                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">{f.label}</span>
                                                    {isEditing ? (
                                                        f.isSelect ? (
                                                            <div className="relative group/select">
                                                                <select
                                                                    className="select py-1 h-9 pr-8 appearance-none"
                                                                    value={f.field === 'esi' ? (editData.esi ? 'Active' : 'Inactive') : editData[f.field]}
                                                                    onChange={e => setEditData({ ...editData, [f.field]: f.field === 'esi' ? e.target.value === 'Active' : e.target.value })}
                                                                >
                                                                    {f.options.map(opt => <option key={opt}>{opt}</option>)}
                                                                </select>
                                                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-focus-within/select:text-[#2f6645] transition-colors" />
                                                            </div>
                                                        ) : (
                                                            <input
                                                                type={f.isNumber ? 'number' : 'text'}
                                                                className="input py-1 h-9"
                                                                value={editData[f.field]}
                                                                onChange={e => setEditData({ ...editData, [f.field]: f.isNumber ? parseFloat(e.target.value) : e.target.value })}
                                                            />
                                                        )
                                                    ) : (
                                                        <span className={`text-slate-900 font-medium ${f.mono ? 'font-mono text-sm' : ''}`}>
                                                            {f.isNumber ? `₹${f.value.toLocaleString()}` : f.value}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                </div>
                            )}

                            {activeTab === 'Salary Breakup' && (
                                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-l-4 border-amber-600 pl-3">Salary Breakup (Monthly)</h3>
                                    <div className="bg-[#f8f9fa] rounded-xl p-6 border border-slate-100 overflow-hidden relative">
                                        <BarChart3 className="absolute right-4 top-4 w-24 h-24 text-slate-200/50 -rotate-12" />
                                        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                                                    <span className="text-slate-600 text-xs font-bold uppercase tracking-tight">Earnings Component</span>
                                                    <span className="text-slate-600 text-xs font-bold uppercase tracking-tight">Amount</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500">Basic Salary</span>
                                                    <span className="text-slate-900 font-bold">₹{employee.basic.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500">HRA (40% of Basic)</span>
                                                    <span className="text-slate-900 font-bold">₹{Math.round(employee.basic * 0.4).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500">Special Allowance</span>
                                                    <span className="text-slate-900 font-bold">₹{Math.round((employee.gross - (employee.basic * 1.4)) * 0.7).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500">Conveyance Allowance</span>
                                                    <span className="text-slate-900 font-bold">₹{Math.round((employee.gross - (employee.basic * 1.4)) * 0.3).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between text-sm pt-4 border-t border-slate-200 font-bold">
                                                    <span className="text-slate-900">Monthly Gross</span>
                                                    <span className="text-[#2f6645] text-lg">₹{employee.gross.toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                                                    <span className="text-slate-600 text-xs font-bold uppercase tracking-tight">Deductions</span>
                                                    <span className="text-slate-600 text-xs font-bold uppercase tracking-tight">Amount</span>
                                                </div>
                                                <div className="flex justify-between text-sm text-red-600">
                                                    <span>Employee PF Contribution (12%)</span>
                                                    <span className="font-bold">₹{Math.round(employee.basic * 0.12).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between text-sm text-red-600">
                                                    <span>Professional Tax (PT)</span>
                                                    <span className="font-bold">₹200</span>
                                                </div>
                                                <div className="flex justify-between text-sm text-red-600">
                                                    <span>TDS / Income Tax</span>
                                                    <span className="font-bold">₹{Math.round(employee.gross * 0.05).toLocaleString()}</span>
                                                </div>
                                                {employee.esi && (
                                                    <div className="flex justify-between text-sm text-red-600">
                                                        <span>ESI Contribution (0.75%)</span>
                                                        <span className="font-bold">₹{Math.round(employee.gross * 0.0075).toLocaleString()}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between text-sm pt-4 border-t border-slate-200 font-bold text-slate-900">
                                                    <span>Total Deductions</span>
                                                    <span className="text-red-500">₹{(Math.round(employee.basic * 0.12) + 200 + Math.round(employee.gross * 0.05) + (employee.esi ? Math.round(employee.gross * 0.0075) : 0)).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-8 bg-white p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm border border-[#9ae66e]/20">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-[#2f6645]">
                                                    <CreditCard className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-none mb-1">Estimated Net Take-Home</p>
                                                    <p className="text-3xl font-black text-[#1e3a34]">₹{employee.net.toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 w-full sm:w-auto">
                                                <button className="flex-1 px-5 py-3 bg-[#1e3a34] text-[#9ae66e] rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#204a30] transition-colors shadow-lg shadow-green-900/10">
                                                    <Download className="w-4 h-4" /> Download Structure
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'Documents' && (
                                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="flex flex-col lg:flex-row gap-6">
                                        {/* Left Side: Upload Section */}
                                        <div className="lg:w-1/3 space-y-4">
                                            <div className="card p-6 border-dashed border-2 border-[#9ae66e]/30 bg-green-50/10">
                                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Upload Document</h3>
                                                <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-slate-200 rounded-xl bg-white hover:border-[#2f6645] transition-colors cursor-pointer group">
                                                    <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-[#2f6645] mb-3 group-hover:scale-110 transition-transform">
                                                        <Upload className="w-6 h-6" />
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-900">Click to upload</p>
                                                    <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold">PDF, JPG, PNG (Max 5MB)</p>
                                                </div>

                                                <div className="mt-6 space-y-3">
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Document Type</span>
                                                        <div className="relative group/select">
                                                            <select className="select py-2 h-10 pr-8 appearance-none bg-white">
                                                                <option>Select Type...</option>
                                                                <option>Identity Proof</option>
                                                                <option>Address Proof</option>
                                                                <option>Education Certificate</option>
                                                                <option>Experience Letter</option>
                                                                <option>Medical Fitness</option>
                                                            </select>
                                                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-focus-within/select:text-[#2f6645]" />
                                                        </div>
                                                    </div>
                                                    <button className="btn-primary w-full bg-[#1e3a34] flex items-center justify-center gap-2">
                                                        <Cloud className="w-4 h-4" /> Save Document
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="card p-4 bg-[#1e3a34] text-white">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-[#9ae66e]/20 flex items-center justify-center text-[#9ae66e]">
                                                        <ShieldCheck className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold">Secure Storage</p>
                                                        <p className="text-[10px] text-slate-300">All documents are encrypted</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Side: Document List */}
                                        <div className="lg:w-2/3 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-l-4 border-[#2f6645] pl-3">Uploaded Documents</h3>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">5 Files Total</span>
                                            </div>

                                            <div className="grid grid-cols-1 gap-3">
                                                {[
                                                    { name: 'Aadhar Card', type: 'PDF', size: '1.2 MB', date: 'Mar 10, 2024', status: 'Verified', color: 'blue' },
                                                    { name: 'PAN Card', type: 'JPG', size: '800 KB', date: 'Mar 10, 2024', status: 'Verified', color: 'blue' },
                                                    { name: 'Joining Letter', type: 'PDF', size: '2.5 MB', date: 'Apr 01, 2022', status: 'Original', color: 'green' },
                                                    { name: 'Previous Experience', type: 'PDF', size: '4.1 MB', date: 'Mar 15, 2022', status: 'Verified', color: 'blue' },
                                                    { name: 'Education Certificates', type: 'ZIP', size: '12 MB', date: 'Mar 12, 2022', status: 'Verified', color: 'blue' },
                                                ].map((doc, i) => (
                                                    <div key={i} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-[#9ae66e] hover:shadow-md transition-all group">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-green-50 group-hover:text-[#2f6645] transition-colors">
                                                                <FileText className="w-6 h-6" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-900">{doc.name}</p>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">{doc.type} • {doc.size}</span>
                                                                    <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                                                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">{doc.date}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${doc.status === 'Verified' ? 'text-green-600 bg-green-50' : 'text-[#2f6645] bg-green-100'}`}>
                                                                {doc.status}
                                                            </span>
                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button className="p-2 text-slate-400 hover:text-[#2f6645] hover:bg-green-50 rounded-lg transition-all">
                                                                    <Eye className="w-4 h-4" />
                                                                </button>
                                                                <button className="p-2 text-slate-400 hover:text-[#2f6645] hover:bg-green-50 rounded-lg transition-all">
                                                                    <Download className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'Activity Log' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-l-4 border-slate-400 pl-3">System Activity Log</h3>
                                    <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                                        {[
                                            { title: 'Profile Updated', detail: 'Changed designation from Site Engineer to Senior Engineer', user: 'Admin', time: '2 hours ago', icon: Edit2, color: 'bg-blue-50 text-blue-600' },
                                            { title: 'Salary Credited', detail: 'Monthly salary for February 2024 processed', user: 'System', time: '10 days ago', icon: CreditCard, color: 'bg-green-50 text-green-600' },
                                            { title: 'Leave Approved', detail: 'Annual leave (2 days) approved by Manager', user: 'Rajesh Kumar', time: '15 days ago', icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600' },
                                            { title: 'Document Verified', detail: 'Aadhar Card verification completed successfully', user: 'HR Team', time: '1 month ago', icon: ShieldCheck, color: 'bg-purple-50 text-purple-600' },
                                        ].map((log, i) => (
                                            <div key={i} className="relative">
                                                <div className={`absolute -left-[29px] top-0 w-5 h-5 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${log.color}`}>
                                                    <log.icon className="w-2.5 h-2.5" />
                                                </div>
                                                <div className="bg-[#f8f9fa] p-4 rounded-xl border border-slate-100">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <p className="text-sm font-bold text-slate-900">{log.title}</p>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{log.time}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-600 mb-2">{log.detail}</p>
                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                        Action By: {log.user}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
