import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Receipt, Wallet, CheckCircle2, XCircle, Clock, Plus, Search, X, ChevronDown } from 'lucide-react';
import Skeleton from '../../../components/common/Skeleton';
import { reimbursementAPI } from '../services';
import { employeeAPI } from '../services';
import { useApp } from '../../../hooks/useApp';

const initialClaims = [];

const statusBadge = {
  'approved': 'badge-green',
  'pending': 'badge-yellow',
  'rejected': 'badge-red',
};

export default function Reimbursements() {
  const { userProfile, userRole } = useApp();
  const isAdmin = userRole === 'admin' || userRole === 'hr';

  const [employees, setEmployees] = useState([]);
  const [claims, setClaims] = useState(initialClaims);
  const [activeTab, setActiveTab] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({ 
    userId: userProfile?.id || '', 
    category: 'travel', 
    expenseDate: new Date().toISOString().split('T')[0], 
    amount: '', 
    description: '', 
    status: 'pending' 
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchClaims();
    if (isAdmin) {
        fetchEmployees();
    }
  }, [isAdmin]);

  // Update formData when userProfile loads
  useEffect(() => {
    if (userProfile?.id && !isAdmin) {
        setFormData(prev => ({ ...prev, userId: userProfile.id }));
    }
  }, [userProfile, isAdmin]);

  const fetchClaims = async () => {
    setIsLoading(true);
    try {
        const res = await reimbursementAPI.getAllReimbursements();
        setClaims(Array.isArray(res) ? res : (res?.reimbursements || []));
    } catch (error) {
        console.error('Failed to fetch claims:', error);
    } finally {
        setIsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
        const res = await employeeAPI.getAllEmployees();
        setEmployees(Array.isArray(res) ? res : (res?.employees || []));
    } catch (error) {
        console.error('Failed to fetch employees:', error);
    }
  };

  const handleAddClaim = async (e) => {
    e.preventDefault();
    if (!formData.userId) return toast.error('Please select an employee');
    
    try {
      const payload = {
        ...formData,
        userId: Number(formData.userId),
        amount: parseFloat(formData.amount) || 0
      };
      await reimbursementAPI.createReimbursement(payload);
      toast.success('Claim submitted successfully!');
      setShowAddModal(false);
      setFormData({ userId: '', category: 'travel', expenseDate: new Date().toISOString().split('T')[0], amount: '', description: '', status: 'pending' });
      fetchClaims();
    } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to submit claim');
    }
  };

  const handleApprove = async (id) => {
    try {
        await reimbursementAPI.approveReimbursement(id);
        toast.success(`Claim #${id} approved!`);
        fetchClaims();
    } catch {
        toast.error('Failed to approve claim');
    }
  };

  const handleReject = async (id) => {
    try {
        await reimbursementAPI.rejectReimbursement(id);
        toast.error(`Claim #${id} rejected`);
        fetchClaims();
    } catch {
        toast.error('Failed to reject claim');
    }
  };

  const filtered = claims.filter(c => {
    // Role-based visibility: Non-admins only see their own claims
    if (!isAdmin && Number(c.userId) !== Number(userProfile?.id)) return false;

    const employee = employees.find(emp => Number(emp.id) === Number(c.userId));
    const empName = employee?.name || c.userName || `User #${c.userId}`;
    const matchesTab = activeTab === 'All' || c.status.toLowerCase() === activeTab.toLowerCase();
    const matchesSearch = empName.toLowerCase().includes(search.toLowerCase()) || c.id.toString().includes(search);
    return matchesTab && matchesSearch;
  });

  const displayClaims = isAdmin ? claims : claims.filter(c => Number(c.userId) === Number(userProfile?.id));
  const totalClaimed = displayClaims.reduce((a, c) => a + Number(c.amount || 0), 0);
  const totalApproved = displayClaims.filter(c => c.status.toLowerCase() === 'approved').reduce((a, c) => a + Number(c.amount || 0), 0);
  const totalPending = displayClaims.filter(c => c.status.toLowerCase() === 'pending').reduce((a, c) => a + Number(c.amount || 0), 0);

  return (
    <div className="space-y-5 animate-fade-in relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reimbursements</h1>
          <p className="text-slate-500 text-sm mt-1">Manage and track employee business expense claims</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> New Claim Request
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Claimed', value: `₹${totalClaimed.toLocaleString()}`, color: 'text-blue-500' },
          { label: 'Approved Claims', value: `₹${totalApproved.toLocaleString()}`, color: 'text-green-500' },
          { label: 'Pending Payout', value: `₹${totalPending.toLocaleString()}`, color: 'text-amber-500' },
          { label: 'Total Claims', value: displayClaims.length, color: 'text-purple-500' },
        ].map((s, i) => (
          <div key={i} className="card p-4">
            {isLoading ? <Skeleton variant="badge" className="h-8 w-16 mb-1" /> : <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>}
            <p className="text-slate-500 text-sm mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {['All', 'Pending', 'Approved', 'Rejected'].map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === t ? 'bg-[#2f6645] text-white' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input placeholder="Search claims..." className="input pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Claim ID', 'Employee', 'Category', 'Date', 'Description', 'Amount', 'Status', 'Actions'].map(h => (
                  <th key={h} className="table-header whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="table-row">
                    <td className="table-cell"><Skeleton variant="text" className="w-12" /></td>
                    <td className="table-cell"><div className="flex gap-2"><Skeleton variant="circle" className="w-7 h-7" /><Skeleton variant="text" className="w-24" /></div></td>
                    <td className="table-cell"><Skeleton variant="badge" /></td>
                    <td className="table-cell"><Skeleton variant="text" /></td>
                    <td className="table-cell"><Skeleton variant="text" /></td>
                    <td className="table-cell"><Skeleton variant="text" /></td>
                    <td className="table-cell"><Skeleton variant="badge" /></td>
                    <td className="table-cell"><Skeleton variant="button" className="w-16 h-8" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan="8" className="p-8 text-center text-slate-400">No claims found.</td></tr>
              ) : filtered.map((claim, i) => (
                <tr key={i} className="table-row hover:bg-slate-50 transition-colors">
                  <td className="table-cell font-mono text-blue-500 text-xs font-semibold">CLM-{claim.id.toString().padStart(3, '0')}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {(employees.find(emp => Number(emp.id) === Number(claim.userId))?.name || 'U').split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-slate-900 font-medium">{employees.find(emp => Number(emp.id) === Number(claim.userId))?.name || claim.userName || `User #${claim.userId}`}</p>
                        <p className="text-slate-400 text-xs">{employees.find(emp => Number(emp.id) === Number(claim.userId))?.department || claim.department || 'N/A'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell"><span className="badge badge-blue uppercase text-[10px]">{claim.category}</span></td>
                  <td className="table-cell text-slate-500 text-xs">{new Date(claim.expenseDate || claim.date).toLocaleDateString()}</td>
                  <td className="table-cell text-slate-500 text-xs max-w-[180px] truncate">{claim.description}</td>
                  <td className="table-cell text-emerald-600 font-semibold">₹{(Number(claim.amount) || 0).toLocaleString()}</td>
                  <td className="table-cell">
                    <span className={`badge ${statusBadge[claim.status.toLowerCase()] || 'badge-yellow'}`}>{claim.status}</span>
                  </td>
                  <td className="table-cell">
                    {isAdmin && claim.status.toLowerCase() === 'pending' && (
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => handleApprove(claim.id)} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-[#2f6645] hover:text-white transition-all" title="Approve">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleReject(claim.id)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-500 hover:text-white transition-all" title="Reject">
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-[#1e3a34] text-white">
              <div>
                <h2 className="text-base font-semibold">New Claim Request</h2>
                <p className="text-xs text-white/60 mt-0.5">Submit an expense reimbursement</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddClaim} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Employee Name</label>
                  {isAdmin ? (
                    <select required className="input" value={formData.userId} onChange={e => setFormData({...formData, userId: e.target.value})}>
                      <option value="">Choose employee...</option>
                      {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                    </select>
                  ) : (
                    <input disabled className="input bg-slate-50" value={userProfile?.name || 'Loading...'} />
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Category</label>
                  <select className="input" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option value="travel">Travel & Lodging</option>
                    <option value="food">Food & Meals</option>
                    <option value="supplies">Supplies & Stationary</option>
                    <option value="entertainment">Client Entertainment</option>
                    <option value="communication">Communication</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Expense Date</label>
                  <input required type="date" className="input" value={formData.expenseDate} onChange={e => setFormData({...formData, expenseDate: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Amount (₹)</label>
                  <input required type="number" placeholder="0.00" className="input" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Description</label>
                <textarea rows="3" required placeholder="Brief description of the expense..." className="input resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Submit Claim</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
