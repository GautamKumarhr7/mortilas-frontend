import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useApp } from '../../../hooks/useApp';
import { leaveAPI } from '../services';
import { employeeAPI } from '../services';
import { CheckCircle2, XCircle, Plus, Search, X, ChevronDown, Loader2, UserPlus, FileText } from 'lucide-react';
import Skeleton from '../../../components/common/Skeleton';

const initialRequests = [];

const statusBadge = {
  'Approved': 'bg-emerald-100 text-emerald-700',
  'approved': 'bg-emerald-100 text-emerald-700',
  'Pending': 'bg-amber-100 text-amber-700',
  'pending': 'bg-amber-100 text-amber-700',
  'Rejected': 'bg-red-100 text-red-700',
  'rejected': 'bg-red-100 text-red-700',
};

export default function LeaveManagement() {
  const { userRole, userProfile, employees: globalEmployees } = useApp();

  const [requests, setRequests] = useState(initialRequests);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({ name: '', type: 'CL', start: '', end: '', days: 1, reason: '', title: '', userId: '' });

  const [employees, setEmployees] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [rejectionModal, setRejectionModal] = useState({ show: false, id: null, reason: '' });
  const [nameCache, setNameCache] = useState({});

  const resolveMissingNames = useCallback(async (reqs) => {
    const ids = [...new Set(reqs.map(r => r.userId || r.user_id || r.employeeId))].filter(Boolean);
    const unknownIds = ids.filter(id => {
      const allPossible = [...employees, ...(globalEmployees || [])];
      return !allPossible.find(e => Number(e.id) === Number(id));
    });

    for (const id of unknownIds) {
      try {
        const empInfo = await employeeAPI.getEmployeeById(id);
        const name = empInfo?.name || empInfo?.employee?.name || `User ${id}`;
        setNameCache(prev => ({ ...prev, [id]: name }));
      } catch {
        // Missing names are non-blocking for the leave list.
      }
    }
  }, [employees, globalEmployees]);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      let res;
      if (userRole === 'employee') {
        res = await leaveAPI.getEmployeeLeave(userProfile?.id || userProfile?.userId || 1);
      } else {
        res = await leaveAPI.getAllLeaves();
      }

      const backendRequests = res?.leaves || res?.data?.leaves || (Array.isArray(res) ? res : (res?.data || []));
      setRequests(Array.isArray(backendRequests) ? backendRequests : []);
      if (backendRequests.length > 0) resolveMissingNames(backendRequests);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
      toast.error('Failed to sync leave records');
    } finally {
      setIsLoading(false);
    }
  }, [resolveMissingNames, userProfile?.id, userProfile?.userId, userRole]);

  const fetchAllocations = useCallback(async () => {
    try {
      const id = userProfile?.id || userProfile?.userId || userProfile?._id;
      if (!id) return;
      const res = await leaveAPI.getUserLeaveAllocations(id);
      setAllocations(res?.data || res || {});
    } catch (error) {
      console.error('Failed to fetch allocations:', error);
    }
  }, [userProfile?._id, userProfile?.id, userProfile?.userId, userRole]);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await employeeAPI.getAllEmployees();
      // Robust check matching all known API response shapes
      const backendEmployees =
        res?.employees ||
        res?.users ||
        res?.staff ||
        res?.data?.employees ||
        (Array.isArray(res) ? res : (res?.data || []));
      const mapped = (Array.isArray(backendEmployees) ? backendEmployees : []).map(emp => ({
        id: emp.id?.toString() || `EMP-${emp.empId || '00'}`,
        name: emp.name || emp.username || 'Unknown',
        username: emp.username || emp.name || 'Unknown',
      }));
      setEmployees(mapped);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
    fetchAllocations();
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApprove = async (id) => {
    try {
      await leaveAPI.approveLeave(id);
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'Approved' } : r));
      toast.success('Leave Approved!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve leave');
    }
  };

  const handleReject = (id) => {
    setRejectionModal({ show: true, id, reason: '' });
  };

  const confirmReject = async () => {
    if (!rejectionModal.id) return;
    setIsSaving(true);
    try {
      await leaveAPI.rejectLeave(rejectionModal.id, rejectionModal.reason);
      setRequests(prev => prev.map(r => r.id === rejectionModal.id ? { ...r, status: 'Rejected' } : r));
      toast.error('Leave Rejected');
      setRejectionModal({ show: false, id: null, reason: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject leave');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const currentUserId = formData.userId || userProfile?.id || userProfile?.userId;
      const payload = {
        employeeId: Number(currentUserId),
        type: formData.type,
        title: formData.title,
        description: formData.reason,
        fromDate: formData.start,
        toDate: formData.end
      };

      await leaveAPI.createLeave(payload);
      toast.success(`Leave request for "${payload.title}" submitted!`);
      fetchRequests();
      setShowApplyModal(false);
      setFormData({ name: '', type: 'CL', start: '', end: '', days: 1, reason: '', title: '', userId: '' });
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to submit leave request');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredRequests = requests.filter(r => {
    const allPossibleEmployees = [...employees, ...(globalEmployees || [])];
    const currentId = Number(r.userId || r.user_id || r.employeeId);
    const emp = allPossibleEmployees.find(e => Number(e.id) === currentId);
    const cachedName = nameCache[currentId];
    const isSelf = Number(userProfile?.id || userProfile?.userId) === currentId;
    const empName = emp?.name || emp?.username || cachedName || (isSelf ? (userProfile?.name || userProfile?.username) : null) || `Staff #${currentId}`;

    const matchSearch =
      empName.toLowerCase().includes(search.toLowerCase()) ||
      (r.type || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.title || '').toLowerCase().includes(search.toLowerCase());

    const displayStatus = r.status ? (r.status.charAt(0).toUpperCase() + r.status.slice(1)) : 'Pending';
    return (activeTab === 'All' || displayStatus === activeTab) && matchSearch;
  });

  const balance = allocations || {};

  const stats = [
    { label: 'Casual Leave', value: `${12 - (balance.remainCl ?? 12)}/12`, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Sick Leave', value: `${7 - (balance.remainSl ?? 7)}/7`, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Earned Leave', value: `${15 - (balance.remainEl ?? 15)}/15`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Leave Without Pay', value: `${Math.abs(balance.remainLwp ?? 0)}`, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Maternity', value: `${182 - (balance.remainMaternity ?? 182)}/182`, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Paternity', value: `${15 - (balance.remainPaternity ?? 15)}/15`, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'CompOff', value: `${Math.abs(balance.remainCompOff ?? 0)}`, color: 'text-slate-600', bg: 'bg-slate-50' },
  ];

  return (
    <div className="space-y-5 animate-fade-in relative pb-10">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-2">
        <span>HR Management</span>
        <ChevronDown className="w-3 h-3 -rotate-90" />
        <span className="text-[#2f6645] font-bold">Leave Management</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Leave Management</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium italic">
            {userRole === 'employee' ? 'View your leave status and submit new requests' : 'Review, approve and track employee time-off requests'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 p-1.5 w-fit">
            <button
              onClick={() => {
                setFormData(prev => ({ ...prev, userId: userProfile?.id || userProfile?.userId || '' }));
                setShowApplyModal(true);
              }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all bg-[#2f6645] text-white shadow-lg"
            >
              <UserPlus className="w-4 h-4" /> Apply for Leave
            </button>
          </div>
        </div>
      </div>


          <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar snap-x">
            {stats.map((s, i) => (
              <div key={i} className={`card min-w-[160px] flex-1 p-5 hover:shadow-xl transition-all border-none ${s.bg} rounded-3xl relative overflow-hidden group snap-start`}>
                <div className="absolute -right-2 -top-2 w-16 h-16 bg-white/20 rounded-full blur-2xl group-hover:blur-xl transition-all" />
                {isLoading ? (
                  <Skeleton variant="badge" className="h-8 w-16 mb-0" />
                ) : (
                  <div className="flex items-baseline gap-1 mt-1">
                  <p className={`text-2xl font-black ${s.color} tracking-tight`}>{s.value}</p>
                </div>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <p className={`text-[10px] font-black uppercase tracking-widest opacity-80 ${s.color}`}>{s.label}</p>
                  {Number(s.value) < 0 && <span className="text-[7px] bg-red-100 text-red-600 px-1 py-0.5 rounded-full font-black animate-pulse">OVERDRAWN</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Table Container */}
          <div className="card overflow-hidden border border-slate-100 shadow-xl shadow-slate-200/50 bg-white rounded-2xl">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                {['All', 'Pending', 'Approved', 'Rejected'].map(t => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`px-4 py-2 rounded-xl text-[10px] whitespace-nowrap font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-[#2f6645] text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input placeholder="Search records..." className="input pl-9 h-11 text-xs" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['Employee', 'Leave Type', 'Duration', 'Reason', 'Applied On', 'Status', 'Actions'].map(h => (
                      <th key={h} className="table-header text-[10px] font-black uppercase tracking-widest text-slate-400 px-6 py-4 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4"><div className="flex gap-2"><Skeleton variant="circle" /><Skeleton variant="text" className="w-24" /></div></td>
                        <td className="px-6 py-4"><Skeleton variant="badge" /></td>
                        <td className="px-6 py-4"><Skeleton variant="text" /></td>
                        <td className="px-6 py-4"><Skeleton variant="text" /></td>
                        <td className="px-6 py-4"><Skeleton variant="text" /></td>
                        <td className="px-6 py-4"><Skeleton variant="badge" /></td>
                        <td className="px-6 py-4"><Skeleton variant="button" className="w-12 h-8" /></td>
                      </tr>
                    ))
                  ) : filteredRequests.length === 0 ? (
                    <tr><td colSpan="7" className="p-12 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">No leave records found.</td></tr>
                  ) : filteredRequests.map(req => {
                    const currentId = Number(req.userId || req.user_id || req.employeeId);
                    const allPossibleEmployees = [...employees, ...(globalEmployees || [])];
                    const emp = allPossibleEmployees.find(e => Number(e.id) === currentId);
                    const isSelf = Number(userProfile?.id || userProfile?.userId) === currentId;
                    const cachedName = nameCache[currentId];
                    const empName = emp?.name || emp?.username || cachedName || (isSelf ? (userProfile?.name || userProfile?.username) : null) || `Staff #${currentId}`;
                    const appliedDate = req.createdAt
                      ? new Date(req.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                      : 'N/A';
                    const statusStr = req.status
                      ? req.status.charAt(0).toUpperCase() + req.status.slice(1).toLowerCase()
                      : 'Pending';

                    return (
                      <tr key={req.id || Math.random()} className="hover:bg-emerald-50/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 group-hover:bg-[#2f6645] group-hover:text-white flex items-center justify-center font-black text-xs transition-all shadow-sm">
                              {empName.split(' ').map(n => n?.[0]).join('')}
                            </div>
                            <div>
                              <p className="text-slate-900 font-black group-hover:text-[#2f6645] transition-colors">{empName}</p>
                              <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-0.5">ID: {req.userId || req.user_id || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-blue-100 text-blue-700">{req.type || 'Casual'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-slate-900 font-black truncate max-w-[150px]">{req.title || 'Leave Request'}</p>
                          <p className="text-slate-400 text-[10px] uppercase font-bold mt-0.5">
                            {req.fromDate && (
                              <span className="ml-1 opacity-70">
                                {new Date(req.fromDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} 
                                {req.toDate && ` - ${new Date(req.toDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`}
                              </span>
                            )}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs max-w-[180px] font-medium truncate italic" title={req.description}>"{req.description || 'No reason'}"</td>
                        <td className="px-6 py-4 text-slate-400 text-[10px] font-bold uppercase">{appliedDate}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${statusBadge[statusStr.toLowerCase()] || 'bg-amber-100 text-amber-700'}`}>
                            {statusStr}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {userRole !== 'employee' && statusStr === 'Pending' && (
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleApprove(req.id)} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-[#2f6645] hover:text-white shadow-sm transition-all">
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleReject(req.id)} className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-500 hover:text-white shadow-sm transition-all">
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

      {/* Apply Leave Modal (Employee role) */}
      {showApplyModal && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fade-in" onClick={() => setShowApplyModal(false)}>
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Submit Leave Request</h2>
              <button onClick={() => setShowApplyModal(false)}><X className="w-6 h-6 text-slate-400" /></button>
            </div>
            <form onSubmit={handleApplyLeave} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Staff Member</label>
                <input readOnly className="input h-14 bg-slate-100 font-bold" value={userProfile?.name || 'Self'} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Start Date</label>
                  <input required type="date" className="input h-14 bg-slate-50" value={formData.start} onChange={e => setFormData({ ...formData, start: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">End Date</label>
                  <input required type="date" className="input h-14 bg-slate-50" value={formData.end} onChange={e => setFormData({ ...formData, end: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Total Days</label>
                  <input required type="number" step="0.5" min="0.5" className="input h-14 bg-slate-50 font-bold" value={formData.days} onChange={e => setFormData({ ...formData, days: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Leave Type</label>
                  <select className="input h-14 bg-slate-50" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                    <option value="CL">Casual Leave (CL)</option>
                    <option value="SL">Sick Leave (SL)</option>
                    <option value="EL">Earned Leave (EL)</option>
                    <option value="LWP">Leave Without Pay (LWP)</option>
                    <option value="Maternity">Maternity Leave</option>
                    <option value="Paternity">Paternity Leave</option>
                    <option value="CompOff">Compensatory Off</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Title / Brief Reason</label>
                <input required className="input h-14 bg-slate-50" placeholder="e.g. Family Function, Medical..." value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Reason</label>
                <textarea required rows="3" className="input p-5 bg-slate-50 resize-none" value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} />
              </div>
              <button type="submit" disabled={isSaving} className="w-full py-4 bg-[#2f6645] text-white font-black rounded-2xl shadow-xl">
                {isSaving ? 'Submitting...' : 'Send Request'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectionModal.show && (
        <div className="fixed inset-0 z-[190] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setRejectionModal({ show: false, id: null, reason: '' })}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Reason for Rejection</h2>
              <button onClick={() => setRejectionModal({ show: false, id: null, reason: '' })} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <textarea
                required
                rows="2"
                autoFocus
                placeholder="Enter reason..."
                className="input p-4 bg-slate-50 border-slate-200 text-sm focus:ring-[#2f6645]/10 focus:border-[#2f6645]"
                value={rejectionModal.reason}
                onChange={e => setRejectionModal({ ...rejectionModal, reason: e.target.value })}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setRejectionModal({ show: false, id: null, reason: '' })}
                  className="flex-1 py-3 text-slate-500 font-bold rounded-xl text-xs hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReject}
                  disabled={isSaving || !rejectionModal.reason.trim()}
                  className="flex-[2] py-3 bg-red-500 text-white font-black rounded-xl text-xs shadow-lg shadow-red-500/20 hover:bg-red-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Reject Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
