import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, UserCheck, UserX, AlertCircle, Search, ChevronDown, X, CheckCircle2 } from 'lucide-react';
import Skeleton from '../../../components/common/Skeleton';
import { attendanceAPI } from '../services';
import { useApp } from '../../../hooks/useApp';
import { employeeAPI } from '../services';
import { formatUTCtoLocal, calculateDurationMinutes } from '../../../utils/timeUtils';

export default function Attendance() {
  const { userRole, userProfile } = useApp();
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('date') || '';
  });
  const [filter, setFilter] = useState('All');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPunching, setIsPunching] = useState(false);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await employeeAPI.getAllEmployees();
      const backendEmployees = res?.employees || res?.users || res?.staff || res?.data?.employees || (Array.isArray(res) ? res : (res?.data || []));
      const mapped = (Array.isArray(backendEmployees) ? backendEmployees : []).map(emp => ({
        id: emp.id?.toString(),
        name: emp.name || emp.username || 'Unknown',
      }));
      setEmployees(mapped);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  }, []);

  const fetchAttendance = useCallback(async () => {
    setIsLoading(true);
    try {
      let res;
      if (userRole === 'employee') {
          res = await attendanceAPI.getUserLogs(userProfile?.id || userProfile?.userId || 1);
      } else {
          res = await attendanceAPI.getAllLogs();
      }
      const rawResponse = res?.data || res;
      const logs = Array.isArray(rawResponse) 
        ? rawResponse 
        : (rawResponse?.attendanceLogs || rawResponse?.logs || rawResponse?.data || []);
      
      setAttendance(logs);
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
      showToast('Failed to load attendance logs', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [userProfile?.id, userProfile?.userId, userRole]);

  useEffect(() => {
    fetchEmployees();
    fetchAttendance();
  }, [fetchAttendance, fetchEmployees]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleDateChange = (e) => {
      const newDate = e.target.value;
      setSelectedDate(newDate);
      const url = new URL(window.location);
      if (newDate) {
          url.searchParams.set('date', newDate);
      } else {
          url.searchParams.delete('date');
      }
      window.history.pushState({}, '', url);
  };

  const handlePunch = async (type) => {
      setIsPunching(true);
      try {
          // ALWAYS send UTC time to backend to prevent timezone issues!
          const now = new Date();
          const timeString = now.toISOString().split('T')[1].substring(0, 8); // UTC HH:mm:ss
          const dateString = now.toISOString().split('T')[0]; // UTC YYYY-MM-DD
          
          const payload = {
              employeeId: userProfile?.id || userProfile?.userId || 1,
              date: dateString,
              punchTime: timeString,
              punchType: type,
              attendanceType: "mannual",
              status: "ontime"
          };
          
          await attendanceAPI.createAttendance(payload);
          showToast(`Successfully clocked ${type}`, 'success');
          await fetchAttendance();
      } catch (error) {
          console.error("Punch error:", error);
          showToast(`Failed to clock ${type}`, 'error');
      } finally {
          setIsPunching(false);
      }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const formattedAttendance = [];
  const grouped = {};

  (attendance || []).forEach(log => {
      const empId = log.employeeId || log.userId;
      const date = log.date || log.attendanceDate;
      if (!empId || !date) return;
      
      const key = `${empId}_${date}`;
      if (!grouped[key]) {
          grouped[key] = {
              userId: empId,
              date: date,
              checkIn: null,
              checkOut: null,
              backendStatus: log.status, // use the true backend status
              logs: log.logs || [], // store logs for duration calc
              logIds: []
          };
      }
      
      grouped[key].logIds.push(log.id);
      
      if (log.punchType === 'in' || log.clockIn) {
          grouped[key].checkIn = log.punchTime || log.clockIn;
      } else if (log.punchType === 'out' || log.clockOut) {
          grouped[key].checkOut = log.punchTime || log.clockOut;
      }
      
      // If we have an explicit clockOut but no checkOut yet, assign it
      if (log.clockOut && !grouped[key].checkOut) {
          grouped[key].checkOut = log.clockOut;
      }
  });

  Object.values(grouped).forEach(group => {
      const emp = employees.find(e => e.id === group.userId?.toString());
      const name = emp?.name || emp?.username || `User #${group.userId}`;
      
      // Calculate work hours using logs
      let workHours = '00:00';
      if (group.logs && group.logs.length > 0) {
          let totalMins = 0;
          let currentIn = null;
          
          for (let i = 0; i < group.logs.length; i++) {
              const log = group.logs[i];
              // Use explicit punchType if available, otherwise assume alternating IN/OUT
              const type = log.punchType ? log.punchType : (i % 2 === 0 ? 'in' : 'out');
              
              if (type === 'in') {
                  currentIn = log.punchTime;
              } else if (type === 'out' && currentIn) {
                  totalMins += calculateDurationMinutes(currentIn, log.punchTime);
                  currentIn = null; // Reset for next pair
              }
          }
          if (totalMins > 0) {
              const h = Math.floor(totalMins / 60);
              const m = totalMins % 60;
              workHours = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
          }
      } else if (group.checkIn && group.checkOut) {
          const diffMins = calculateDurationMinutes(group.checkIn, group.checkOut);
          if (diffMins > 0) {
              const h = Math.floor(diffMins / 60);
              const m = diffMins % 60;
              workHours = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
          }
      }
      
      formattedAttendance.push({
          id: group.logIds.join('_'),
          userId: group.userId,
          name: name || 'Unknown',
          empId: `EMP-${group.userId}`,
          date: group.date ? new Date(group.date).toLocaleDateString('en-GB') : 'Unknown',
          rawDate: group.date,
          checkIn: formatUTCtoLocal(group.date, group.checkIn),
          checkOut: formatUTCtoLocal(group.date, group.checkOut),
          workHours: workHours,
          logs: (group.logs || []).map((l, i) => ({
              type: l.punchType ? l.punchType : (i % 2 === 0 ? 'in' : 'out'),
              time: formatUTCtoLocal(group.date, l.punchTime)
          })),
          status: group.backendStatus === 'in' ? 'Active' : 'Present'
      });
  });

  // Sort by date descending
  formattedAttendance.sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));

  const filteredAttendance = formattedAttendance.filter(item => {
    const itemName = item?.name || '';
    const itemEmpId = item?.empId || '';
    const matchesSearch = itemName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          itemEmpId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'All' || item.status === filter;
    const matchesDate = !selectedDate || (item.rawDate && item.rawDate.startsWith(selectedDate));
    return matchesSearch && matchesFilter && matchesDate;
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const myTodayLogs = formattedAttendance.filter(a => a.userId === (userProfile?.id || userProfile?.userId || 1) && a.rawDate && a.rawDate.startsWith(todayStr));
  const hasActivePunch = myTodayLogs.some(a => a.status === 'Active');

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 pb-10">
      {/* Top Section: Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 leading-none mb-1">Attendance Management</h1>
          <p className="text-sm text-slate-500 font-medium">Insights and manual logging for your entire workforce.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Current Server Time</p>
            <p className="text-lg font-black text-[#2f6645]">{currentTime}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Main Stats with Donut */}
        <div className="md:col-span-8 card p-6 md:p-8 bg-white border-none shadow-xl shadow-slate-200/50 flex flex-col sm:flex-row items-center gap-12 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-16 -mt-16 opacity-50" />
          <div className="relative w-40 h-40 flex items-center justify-center flex-shrink-0">
            <svg className="w-full h-full -rotate-90">
              <circle cx="80" cy="80" r="70" fill="transparent" stroke="#f1f5f9" strokeWidth="16" />
              <circle cx="80" cy="80" r="70" fill="transparent" stroke="#10b981" strokeWidth="16" strokeDasharray="440" strokeDashoffset="110" />
              <circle cx="80" cy="80" r="70" fill="transparent" stroke="#f59e0b" strokeWidth="16" strokeDasharray="440" strokeDashoffset="380" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-3xl font-black text-slate-900 leading-none">85%</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Present</p>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Daily Status Mix</h3>
              <span className="text-[10px] font-black text-[#2f6645] uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-lg">Today</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Present Today', val: formattedAttendance.filter(a => a.status === 'Present').length, color: 'bg-emerald-500', sub: '+2 from avg' },
                { label: 'Late Arrivals', val: formattedAttendance.filter(a => a.status === 'Late').length, color: 'bg-amber-500', sub: 'Action required' },
                { label: 'On Leave', val: '00', color: 'bg-blue-500', sub: 'Planned' },
                { label: 'Average Hours', val: '8.5', color: 'bg-purple-500', sub: 'Standard shift' },
              ].map((s, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${s.color}`} />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{s.label}</span>
                  </div>
                  <p className="text-xl font-black text-slate-800 leading-none">{s.val}</p>
                  <p className="text-[8px] font-bold text-slate-400 italic">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Summary Sidebar */}
        <div className="md:col-span-4 space-y-4 flex flex-col">
          <div className="card p-6 bg-[#1e3a34] text-white border-none shadow-xl shadow-green-900/10 flex-1 flex flex-col justify-between">
            <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-[#9ae66e]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none">Active Shift</p>
                    <p className="text-xs font-bold">General (09:00 - 18:00)</p>
                  </div>
                </div>
                <p className="text-[10px] leading-relaxed opacity-60 italic mb-6">"Ensure all manual logs are verified before EOD for accurate payroll processing."</p>
            </div>
            
            <div className="mt-auto">
                {!hasActivePunch ? (
                    <button 
                        onClick={() => handlePunch('in')} 
                        disabled={isPunching}
                        className="w-full bg-[#9ae66e] text-[#1e3a34] font-black py-3 rounded-xl hover:bg-emerald-400 transition-colors shadow-lg active:scale-[0.98]"
                    >
                        {isPunching ? 'Punching...' : 'Clock In'}
                    </button>
                ) : (
                    <button 
                        onClick={() => handlePunch('out')} 
                        disabled={isPunching}
                        className="w-full bg-red-500 text-white font-black py-3 rounded-xl hover:bg-red-600 transition-colors shadow-lg active:scale-[0.98]"
                    >
                        {isPunching ? 'Punching...' : 'Clock Out'}
                    </button>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-surface-border bg-slate-50/50 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative flex gap-2">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="date" 
                className="input pl-10 bg-white w-40"
                value={selectedDate}
                onChange={handleDateChange}
              />
            </div>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by Employee..." 
                className="input pl-10 bg-white w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="relative group/select">
              <select className="select w-40 bg-white pr-8 appearance-none" value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="All">All Status</option>
                <option value="Present">Completed</option>
                <option value="Active">Active (Checked In)</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-focus-within/select:text-[#2f6645] transition-colors" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="table-header">Employee</th>
                <th className="table-header">Date</th>
                <th className="table-header">Punches (IN/OUT)</th>
                <th className="table-header">Duration</th>
                <th className="table-header">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4"><div className="flex items-center gap-3"><Skeleton variant="circle" className="w-8 h-8" /><Skeleton variant="text" className="w-24" /></div></td>
                    <td className="px-6 py-4"><Skeleton variant="text" className="w-16" /></td>
                    <td className="px-6 py-4"><Skeleton variant="text" className="w-24" /></td>
                    <td className="px-6 py-4"><Skeleton variant="text" className="w-12" /></td>
                    <td className="px-6 py-4"><Skeleton variant="badge" /></td>
                  </tr>
                ))
              ) : filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3 opacity-30">
                      <UserX className="w-12 h-12 text-slate-400" />
                      <p className="text-xs font-black uppercase tracking-widest text-slate-500">No records found for this period</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((row) => (
                  <tr key={row.id} className="table-row group">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-700 flex items-center justify-center font-bold text-[10px] transition-colors border border-transparent group-hover:border-emerald-100 shadow-sm">
                          {(row.name || 'U').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{row.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5">{row.empId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell font-bold text-slate-500 text-xs uppercase tracking-tighter">{row.date}</td>
                    <td className="table-cell">
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {row.logs && row.logs.length > 0 ? row.logs.map((logObj, idx) => (
                          <span key={idx} className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${logObj.type === 'in' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {logObj.type.toUpperCase()}: {logObj.time}
                          </span>
                        )) : (
                          <>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-100 text-emerald-700">IN: {row.checkIn}</span>
                            {row.checkOut && row.checkOut !== '-' && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-rose-100 text-rose-700">OUT: {row.checkOut}</span>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-slate-400">Total</span>
                        <span className="badge bg-slate-100 text-slate-700 w-fit">{row.workHours}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        row.status === 'Active' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border ${
            toast.type === 'error' ? 'bg-red-900 text-red-100 border-red-700' : 'bg-[#1e3a34] text-white border-[#2f6645]'
          }`}>
            {toast.type === 'error' ? <AlertCircle className="w-5 h-5 text-red-400" /> : <CheckCircle2 className="w-5 h-5 text-[#9ae66e]" />}
            <p className="text-sm font-bold uppercase tracking-widest">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
