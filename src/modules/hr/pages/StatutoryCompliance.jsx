import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ShieldCheck, FileText, Landmark, AlertCircle, Download, Calendar } from 'lucide-react';
import Skeleton from '../../../components/common/Skeleton';
import { complianceAPI } from '../services';

export default function StatutoryCompliance() {
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchSummary();
  }, [month, year]);

  const fetchSummary = async () => {
    setIsLoading(true);
    try {
      const res = await complianceAPI.getSummary(month, year);
      setSummary(res?.data || null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load compliance summary');
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadEcr = () => {
    window.open(`${import.meta.env.VITE_API_URL}/compliance/epf-ecr?month=${month}&year=${year}`, '_blank');
  };

  const handleDownloadEsi = () => {
    window.open(`${import.meta.env.VITE_API_URL}/compliance/esi-report?month=${month}&year=${year}`, '_blank');
  };

  return (
    <div className="space-y-5 animate-fade-in relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Statutory Compliance</h1>
          <p className="text-slate-500 text-sm mt-1">EPF, ESIC, PT, TDS filing & compliance tracker</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          <Calendar className="w-4 h-4 text-slate-400 ml-2" />
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="bg-transparent text-sm font-semibold text-slate-700 outline-none">
            {Array.from({length: 12}, (_, i) => (
              <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="bg-transparent text-sm font-semibold text-slate-700 outline-none pr-2">
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total PF Liability', value: summary?.totalPf || 0, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total ESI Liability', value: summary?.totalEsi || 0, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Prof. Tax Deducted', value: summary?.totalPt || 0, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'TDS Deducted', value: summary?.totalTds || 0, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((s, i) => (
          <div key={i} className={`card p-5 border border-slate-100 ${s.bg}`}>
            {isLoading ? <Skeleton variant="badge" className="h-8 w-16 mb-1" /> : <p className={`text-2xl font-black ${s.color}`}>₹{s.value.toLocaleString()}</p>}
            <p className="text-slate-600 font-medium text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="card p-6 border border-slate-200 hover:shadow-xl transition-shadow bg-white rounded-2xl">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">EPF ECR Generation</h3>
                <p className="text-sm text-slate-500">Electronic Challan cum Return</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-6">
            Generate the official text file format required for uploading to the EPFO Unified Portal. This automatically includes Employer and Employee shares based on the finalized payroll for {new Date(0, month-1).toLocaleString('default', { month: 'long' })} {year}.
          </p>
          <button onClick={handleDownloadEcr} className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
            <Download className="w-4 h-4" /> Download ECR Text File
          </button>
        </div>

        <div className="card p-6 border border-slate-200 hover:shadow-xl transition-shadow bg-white rounded-2xl">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                <Landmark className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">ESI Return Report</h3>
                <p className="text-sm text-slate-500">Employee State Insurance CSV</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-6">
            Generate a CSV report of ESI contributions mapped to employee ESI Numbers. Upload this to the ESIC portal to automatically populate monthly contributions for {new Date(0, month-1).toLocaleString('default', { month: 'long' })} {year}.
          </p>
          <button onClick={handleDownloadEsi} className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
            <Download className="w-4 h-4" /> Download ESI CSV File
          </button>
        </div>
      </div>
    </div>
  );
}
