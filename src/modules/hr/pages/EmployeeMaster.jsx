import { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { setActiveModule } from '../../../store/slices/uiSlice';
import { Plus, Search, Download, Upload, CheckCircle, Clock, XCircle, X, Eye, ChevronDown, Trash2, Loader2, AlertOctagon } from 'lucide-react';
import { useApp } from '../../../hooks/useApp';
import { employeeAPI } from '../services';
import { authorityAPI } from '../../authority/services';
import toast from 'react-hot-toast';
import Skeleton from '../../../components/common/Skeleton';
export default function EmployeeMaster() {
    const dispatch = useDispatch();
    const { setSelectedEmployee, employees, setEmployees } = useApp();
    const [search, setSearch] = useState('');
    const [dept, setDept] = useState('All');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, name: '' });
    
    // Dynamic Dropdown Data
    const [dbRoles, setDbRoles] = useState([]);
    const [dbModules, setDbModules] = useState([]);

    const loadEmployees = useCallback(async () => {
        setIsFetching(true);
        try {
            // Fetch employees, roles, and modules concurrently to map IDs to names
            const [res, rolesRes, modulesRes] = await Promise.all([
                employeeAPI.getAllEmployees(),
                authorityAPI.getRoles().catch(() => []),
                authorityAPI.getModules().catch(() => [])
            ]);
            
            const rolesMap = (rolesRes || []).reduce((acc, r) => { acc[r.id || r._id] = r.name; return acc; }, {});
            const modulesMap = (modulesRes || []).reduce((acc, m) => { acc[m.id || m._id] = m.name; return acc; }, {});

            // Robust check for different potential response keys
            const backendEmployees = res?.employees || res?.users || res?.staff || res?.data?.employees || (Array.isArray(res) ? res : (res?.data || []));
            const mapped = (Array.isArray(backendEmployees) ? backendEmployees : [])
                .filter(emp => Number(emp.roleId) !== 0)
                .map(emp => {
                const rawId = emp.id?.toString() || '0';
                const paddedId = rawId.padStart(3, '0');
                
                // Map the designation and department
                const resolvedDesignation = emp.designation || rolesMap[emp.designationId] || (emp.designationId !== undefined && emp.designationId !== null ? `Role ID: ${emp.designationId}` : 'N/A');
                const resolvedDepartment = emp.department || modulesMap[emp.departmentId] || (emp.departmentId !== undefined && emp.departmentId !== null ? `Module ID: ${emp.departmentId}` : 'N/A');

                return {
                    id: emp.id, // KEEP REAL ID FOR API
                    displayId: `EMP-${paddedId}`, // FOR UI ONLY
                    name: emp.name || 'Unknown',
                    designation: resolvedDesignation,
                    department: resolvedDepartment,
                    doj: emp.dateOfJoining ? new Date(emp.dateOfJoining).toISOString().split('T')[0] : '2024-01-01',
                    basic: Number(emp.basicPay || emp.sallery || 0),
                    gross: Number(emp.basicPay || emp.sallery || 0) * 1.4, // assuming gross is basic + allowances
                    net: Number(emp.basicPay || emp.sallery || 0) * 1.4 * 0.9, // assuming 10% deductions on gross
                    pf: emp.pfApplicable || emp.pfDeduction ? 'Active' : 'Inactive',
                    esi: emp.esiApplicable || emp.esiDeduction || false,
                    pan: emp.pancardNo || '',
                    uan: emp.uanNumber || '',
                    type: emp.type === 'employee' ? 'Permanent' : 'Contract',
                    email: emp.email || '',
                    status: 'Active'
                };
            });
            setEmployees(mapped);
        } catch (error) {
            console.error("Failed to fetch employees:", error);
        } finally {
            setIsFetching(false);
        }
    }, [setEmployees]);

    useEffect(() => {
        loadEmployees();
    }, [loadEmployees]);

    useEffect(() => {
        if (isModalOpen) {
            const fetchDropdownData = async () => {
                try {
                    const [rolesRes, modulesRes] = await Promise.all([
                        authorityAPI.getRoles(),
                        authorityAPI.getModules()
                    ]);
                    setDbRoles(rolesRes || []);
                    // Filter out authority module as requested
                    setDbModules((modulesRes || []).filter(m => m.name?.toLowerCase() !== 'authority' && m.code?.toLowerCase() !== 'authority'));
                } catch (error) {
                    console.error("Failed to fetch dropdown data:", error);
                }
            };
            fetchDropdownData();
        }
    }, [isModalOpen]);

    const depts = ['All', ...new Set(employees.map(e => e.department))];
    const filtered = employees.filter(e => {
        const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) || 
                           (e.displayId || '').toLowerCase().includes(search.toLowerCase()) ||
                           e.id.toString().includes(search);
        const matchDept = dept === 'All' || e.department === dept;
        return matchSearch && matchDept;
    });

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleAddEmployee = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            // Validation
            const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
            const aadharRegex = /^\d{12}$/;
            const uanRegex = /^\d{12}$/;
            
            if (formData.pan && !panRegex.test(formData.pan.toUpperCase())) {
                toast.error("Invalid PAN format. Must be like ABCDE1234F.");
                setIsLoading(false);
                return;
            }
            if (formData.aadhar && !aadharRegex.test(formData.aadhar)) {
                toast.error("Invalid Aadhar format. Must be 12 digits.");
                setIsLoading(false);
                return;
            }
            if (formData.uan && !uanRegex.test(formData.uan)) {
                toast.error("Invalid UAN format. Must be 12 digits.");
                setIsLoading(false);
                return;
            }

            // Build payload exactly as requested
            const payload = {
                name: formData.name || '',
                email: formData.email || '',
                type: 'employee',
                dob: formData.dob || '',
                departmentId: parseInt(formData.departmentId || 0, 10),
                designationId: parseInt(formData.designationId || 0, 10),
                employeeCode: (formData.employeeCode || '').toUpperCase(),
                dateOfJoining: formData.doj || '',
                employmentType: (formData.type || 'permanent').toLowerCase(),
                pan: (formData.pan || '').toUpperCase(),
                addhar: formData.aadhar || '',
                uanNumber: formData.uan || '',
                basicPay: parseInt(formData.basic || 0, 10),
                pfApplicable: !!formData.pf,
                esiApplicable: !!formData.esi,
                tdsApplicable: parseInt(formData.tds || 0, 10)
            };

            await employeeAPI.createEmployee(payload);
            toast.success('Employee created successfully!');
            
            // Re-fetch all employees to get real IDs from the backend
            await loadEmployees();
            
            setIsModalOpen(false);
            setFormData({});
        } catch (error) {
            console.error('API Error:', error);
            toast.error(error.response?.data?.message || 'Failed to create employee via API.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportCSV = () => {
        if (!employees || employees.length === 0) {
            toast.error('No data to export');
            return;
        }

        const headers = ['Emp ID', 'Name', 'Email', 'Department', 'Designation', 'Type', 'DOJ', 'PAN', 'UAN', 'Basic', 'Gross', 'Net', 'PF', 'ESI', 'Status'];
        
        const csvContent = [
            headers.join(','),
            ...employees.map(emp => [
                emp.id,
                `"${emp.name || ''}"`,
                `"${emp.email || ''}"`,
                `"${emp.department || ''}"`,
                `"${emp.designation || ''}"`,
                `"${emp.type || ''}"`,
                emp.doj || '',
                `"${emp.pan || ''}"`,
                `"${emp.uan || ''}"`,
                emp.basic || 0,
                emp.gross || 0,
                emp.net || 0,
                emp.pf || '',
                emp.esi ? 'Yes' : 'No',
                emp.status || ''
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'Employee_Master_Data.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Employee data exported successfully!');
    };

    const handleDeleteEmployee = (e, employee) => {
        e.stopPropagation();
        setDeleteConfirm({ show: true, id: employee.id, name: employee.name });
    };

    const confirmDelete = async () => {
        const { id } = deleteConfirm;
        setIsLoading(true);
        try {
            await employeeAPI.deleteEmployee(id);
            setEmployees(prev => prev.filter(emp => emp.id !== id));
            toast.success("Employee deleted successfully");
        } catch(error) {
            console.error('Delete error', error);
            const status = error.response?.status;
            const message = error.response?.data?.message || error.message;

            if (status === 404) {
               setEmployees(prev => prev.filter(emp => emp.id !== id));
               toast.success("Employee removed from view.");
            } else if (status === 500) {
               toast.error(`Server Error (500): Could not delete. This employee has linked Leave Allocations that must be settled first.`);
            } else {
               toast.error("Deletion failed: " + message);
            }
        } finally {
            setIsLoading(false);
            setDeleteConfirm({ show: false, id: null, name: '' });
        }
    };

    return (
        <div className="space-y-5 animate-fade-in relative">
            {/* Header section with Title and Add Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Employee Master</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage employee records, roles, and profiles</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleExportCSV} className="btn-secondary whitespace-nowrap hidden sm:flex items-center gap-1.5">
                        <Download className="w-4 h-4" /> Export
                    </button>
                    <button onClick={() => setIsModalOpen(true)} className="btn-primary whitespace-nowrap flex items-center gap-1.5">
                        <Plus className="w-4 h-4" /> Add Employee
                    </button>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input className="input pl-9 w-full" placeholder="Search by name or employee ID..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="relative group/select">
                    <select className="select w-full sm:w-40 bg-white pr-8 appearance-none" value={dept} onChange={e => setDept(e.target.value)}>
                        {depts.map(d => <option key={d}>{d}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-focus-within/select:text-green-600 transition-colors" />
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                    { label: 'Total Employees', value: employees.length, color: 'text-blue-500' },
                    { label: 'Permanent', value: employees.filter(e => e.type === 'Permanent').length, color: 'text-green-500' },
                    { label: 'PF Active', value: employees.filter(e => e.pf === 'Active').length, color: 'text-purple-500' },
                    { label: 'ESI Covered', value: employees.filter(e => e.esi).length, color: 'text-amber-500' },
                    { label: 'Gross Payroll', value: `₹${(employees.reduce((a, e) => a + e.gross, 0) / 100000).toFixed(1)}L`, color: 'text-orange-500' },
                ].map((s, i) => (
                    <div key={i} className="card p-4">
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-slate-500 text-sm mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                {['Emp. ID', 'Name / PAN', 'Designation', 'Dept', 'DOJ', 'Salary (Gross/Net)', 'PF/ESI', 'Type', 'Actions'].map(h => (
                                    <th key={h} className="table-header whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                                {isFetching ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={`skeleton-${i}`} className="table-row">
                                            <td className="table-cell"><Skeleton variant="text" className="w-16" /></td>
                                            <td className="table-cell">
                                                <div className="flex items-center gap-3">
                                                    <Skeleton variant="circle" />
                                                    <div className="w-32"><Skeleton variant="text" count={2} /></div>
                                                </div>
                                            </td>
                                            <td className="table-cell"><Skeleton variant="text" /></td>
                                            <td className="table-cell"><Skeleton variant="badge" /></td>
                                            <td className="table-cell"><Skeleton variant="text" /></td>
                                            <td className="table-cell"><Skeleton variant="text" /></td>
                                            <td className="table-cell"><Skeleton variant="badge" /></td>
                                            <td className="table-cell"><Skeleton variant="badge" /></td>
                                            <td className="table-cell"><Skeleton variant="button" /></td>
                                        </tr>
                                    ))
                                ) : filtered.length === 0 ? (
                                    <tr><td colSpan="9" className="p-6 text-center text-slate-500">No employees found. Add a new one.</td></tr>
                                ) : (
                                    filtered.map((e, i) => (
                                        <tr key={i} className="table-row cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => {
                                            setSelectedEmployee(e);
                                            dispatch(setActiveModule('employee-details'));
                                        }}>
                                            <td className="table-cell font-mono text-blue-500 text-xs font-semibold">{e.displayId}</td>
                                            <td className="table-cell">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 text-xs font-bold flex-shrink-0">
                                                        {e.name.split(' ').map(n => n?.[0]).join('')}
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-900 font-medium whitespace-nowrap">{e.name}</p>
                                                        <p className="text-slate-500 text-xs font-mono">{e.pan}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="table-cell text-slate-700">{e.designation}</td>
                                            <td className="table-cell"><span className="badge badge-green">{e.department}</span></td>
                                            <td className="table-cell text-slate-500 text-xs whitespace-nowrap">{e.doj}</td>
                                            <td className="table-cell">
                                                <p className="text-slate-900 font-semibold">₹{e.gross.toLocaleString()}</p>
                                                <p className="text-slate-500 text-xs">Net: ₹{e.net.toLocaleString()}</p>
                                            </td>
                                            <td className="table-cell">
                                                <div className="flex gap-1">
                                                    {e.pf === 'Active' && <span className="badge badge-green">PF</span>}
                                                    {e.esi && <span className="badge badge-blue">ESI</span>}
                                                </div>
                                            </td>
                                            <td className="table-cell">
                                                <span className={`badge ${e.type === 'Permanent' ? 'badge-green' : 'badge-yellow'}`}>{e.type}</span>
                                            </td>
                                            <td className="table-cell" onClick={ev => ev.stopPropagation()}>
                                                <div className="flex items-center gap-2">
                                                    <button 
                                                        onClick={() => {
                                                            setSelectedEmployee(e);
                                                            dispatch(setActiveModule('employee-details'));
                                                        }}
                                                        className="btn-secondary text-xs py-1 px-3 border border-slate-200 bg-white hover:bg-slate-50 rounded flex items-center gap-1.5"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" /> View
                                                    </button>
                                                    <button 
                                                        onClick={(ev) => handleDeleteEmployee(ev, e)}
                                                        className="btn-secondary text-xs py-1 px-2 border border-slate-200 bg-white hover:bg-red-50 hover:text-red-600 rounded flex items-center justify-center transition-colors"
                                                        title="Delete Employee"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                        </tbody>
                    </table>
                </div>
            </div>


            {/* Add Employee Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
                            <h2 className="text-lg font-bold text-slate-800">Enroll New Employee</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleAddEmployee} className="flex-1 overflow-y-auto p-6 space-y-6">
                            
                            {/* Personal & Job Details */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Employment Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5 md:col-span-1">
                                        <label className="text-sm font-medium text-slate-700">Full Name <span className="text-red-500">*</span></label>
                                        <input required name="name" value={formData.name || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22c55e]/20 focus:border-[#22c55e] outline-none transition-all" placeholder="e.g. Rahul Sharma" />
                                    </div>
                                    <div className="space-y-1.5 md:col-span-1">
                                        <label className="text-sm font-medium text-slate-700">Email Address <span className="text-red-500">*</span></label>
                                        <input required type="email" name="email" value={formData.email || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22c55e]/20 focus:border-[#22c55e] outline-none transition-all" placeholder="e.g. rahul@crm.com" />
                                    </div>
                                    <div className="space-y-1.5 md:col-span-1">
                                        <label className="text-sm font-medium text-slate-700">Date of Birth <span className="text-red-500">*</span></label>
                                        <input required type="date" name="dob" value={formData.dob || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22c55e]/20 focus:border-[#22c55e] outline-none transition-all" />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Designation / Role <span className="text-red-500">*</span></label>
                                        <div className="relative group/select">
                                            <select required name="designationId" value={formData.designationId || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22c55e]/20 focus:border-[#22c55e] outline-none transition-all bg-white appearance-none pr-8">
                                                <option value="" disabled>Select Role</option>
                                                {dbRoles.map(r => (
                                                    <option key={r.id || r._id} value={r.id || r._id}>{r.name}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-focus-within/select:text-green-600 transition-colors" />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Department <span className="text-red-500">*</span></label>
                                        <div className="relative group/select">
                                            <select required name="departmentId" value={formData.departmentId || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22c55e]/20 focus:border-[#22c55e] outline-none transition-all bg-white appearance-none pr-8">
                                                <option value="" disabled>Select Module</option>
                                                {dbModules.map(m => (
                                                    <option key={m.id || m._id} value={m.id || m._id}>{m.name}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-focus-within/select:text-green-600 transition-colors" />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 md:col-span-1">
                                        <label className="text-sm font-medium text-slate-700">Employee Code</label>
                                        <input name="employeeCode" value={formData.employeeCode || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22c55e]/20 focus:border-[#22c55e] outline-none transition-all uppercase" placeholder="e.g. EMP123" />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Date of Joining (DOJ) <span className="text-red-500">*</span></label>
                                        <input required type="date" name="doj" value={formData.doj || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22c55e]/20 focus:border-[#22c55e] outline-none transition-all" />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Employment Type <span className="text-red-500">*</span></label>
                                        <div className="relative group/select">
                                            <select required name="type" value={formData.type || 'Permanent'} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22c55e]/20 focus:border-[#22c55e] outline-none transition-all bg-white appearance-none pr-8">
                                                <option value="Permanent">Permanent</option>
                                                <option value="Contract">Contract</option>
                                                <option value="Trainee">Trainee</option>
                                            </select>
                                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-focus-within/select:text-green-600 transition-colors" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Compliance & Salary */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Salary & Statutory Info</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Basic Salary (₹) <span className="text-red-500">*</span></label>
                                        <input required type="number" name="basic" value={formData.basic || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22c55e]/20 focus:border-[#22c55e] outline-none transition-all" placeholder="e.g. 20000" />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">TDS Applicable (₹)</label>
                                        <input type="number" name="tds" value={formData.tds || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22c55e]/20 focus:border-[#22c55e] outline-none transition-all" placeholder="e.g. 0" />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">PAN Number <span className="text-red-500">*</span></label>
                                        <input required name="pan" value={formData.pan || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22c55e]/20 focus:border-[#22c55e] outline-none transition-all font-mono uppercase" placeholder="e.g. ABCDE1234F" maxLength={10} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Aadhar Number <span className="text-red-500">*</span></label>
                                        <input required name="aadhar" value={formData.aadhar || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22c55e]/20 focus:border-[#22c55e] outline-none transition-all font-mono" placeholder="e.g. 867658495800" maxLength={12} />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">UAN Number</label>
                                        <input name="uan" value={formData.uan || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22c55e]/20 focus:border-[#22c55e] outline-none transition-all font-mono" placeholder="e.g. 1005671239" maxLength={12} />
                                    </div>

                                    <div className="col-span-1 md:col-span-2 flex items-center gap-6 mt-2">
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input type="checkbox" name="pf" checked={formData.pf || false} onChange={handleInputChange} className="w-4 h-4 text-[#22c55e] rounded border-slate-300 focus:ring-[#22c55e] transition-all" />
                                            <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">PF Applicable</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input type="checkbox" name="esi" checked={formData.esi || false} onChange={handleInputChange} className="w-4 h-4 text-[#22c55e] rounded border-slate-300 focus:ring-[#22c55e] transition-all" />
                                            <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">ESI Applicable</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-white">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={isLoading} className={`px-5 py-2.5 rounded-lg bg-[#22c55e] text-white font-medium hover:bg-[#16a34a] shadow-sm shadow-[#22c55e]/20 transition-all ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}>
                                    {isLoading ? 'Enrolling...' : 'Enroll Employee'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal - PROFESSIONAL CRM STYLE */}
            {deleteConfirm.show && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-fade-in" onClick={() => setDeleteConfirm({ show: false, id: null, name: '' })}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-slide-up relative" onClick={e => e.stopPropagation()}>
                        <div className="p-8">
                            <div className="flex items-start gap-5">
                                <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 flex-shrink-0 animate-pulse">
                                    <Trash2 className="w-7 h-7" />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-lg font-black text-slate-800 tracking-tight leading-none mb-2">Delete Employee?</h2>
                                    <p className="text-slate-500 text-xs font-medium leading-relaxed">
                                        Are you sure you want to remove <span className="text-slate-900 font-black underline decoration-red-200">{deleteConfirm.name}</span>? This record will be permanently purged from the database.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="mt-8 flex items-center gap-3">
                                <button 
                                    onClick={() => setDeleteConfirm({ show: false, id: null, name: '' })}
                                    className="flex-1 h-12 rounded-xl border border-slate-200 text-slate-500 font-black uppercase tracking-widest text-[9px] hover:bg-slate-50 transition-all active:scale-95"
                                >
                                    No, Keep it
                                </button>
                                <button 
                                    onClick={confirmDelete}
                                    disabled={isLoading}
                                    className={`flex-1 h-12 rounded-xl bg-red-600 text-white font-black uppercase tracking-widest text-[9px] shadow-lg shadow-red-900/20 hover:bg-red-700 transition-all active:scale-95 flex items-center justify-center gap-2 ${isLoading ? 'opacity-50' : ''}`}
                                >
                                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Confirm Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
