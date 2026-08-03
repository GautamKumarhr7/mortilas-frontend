import { useState, useEffect } from 'react';
import { 
  FileText, ClipboardList, PenTool, TrendingUp, 
  Plus, Search, Download, Filter, 
  ChevronRight, X, Loader2, Save,
  CheckCircle2, AlertCircle, Clock,
  DollarSign, FileCheck, FileEdit, History,
  Trash2, Edit3, ChevronDown, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import Skeleton from '../../../components/common/Skeleton';
import { quotationAPI } from '../services';
import { useApp } from '../../../hooks/useApp';

const statusBadge = {
  'Draft': 'bg-slate-50 text-slate-500 border-slate-200',
  'Pending Approval': 'bg-amber-50 text-amber-600 border-amber-100',
  'Approved': 'bg-emerald-50 text-emerald-600 border-emerald-100',
  'Rejected': 'bg-red-50 text-red-600 border-red-100',
  'Revised': 'bg-blue-50 text-blue-600 border-blue-100',
};

export default function Quotations() {
  const { projects } = useApp();
  const [quotes, setQuotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, name: '' });
  const [selectedQuote, setSelectedQuote] = useState(null);
  
  const [formData, setFormData] = useState({
    quotationDetails: '', 
    projectId: '', 
    quoteValue: '', 
    status: 'Draft', 
    version: 'V1'
  });

  const fetchQuotations = async () => {
    setIsLoading(true);
    try {
        const res = await quotationAPI.getAllQuotations();
        // Defensive check for various potential response keys
        const data = res?.quotations || res?.data?.quotations || res?.contracts || res?.data?.contracts || res?.data || res || [];
        setQuotes(Array.isArray(data) ? data : []);
    } catch (error) {
        console.error("Failed to fetch quotations:", error);
        toast.error("Failed to load records.");
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name === 'quotationDetails' || name === 'version') {
        finalValue = value.toUpperCase();
    }
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleOpenEdit = (quote) => {
    setCurrentId(quote.id);
    setFormData({
        quotationDetails: quote.quotationDetails || quote.referenceId || '',
        projectId: quote.projectId || '',
        quoteValue: quote.quoteValue || quote.contractValue || '',
        status: quote.status || 'Draft',
        version: quote.version || 'V1'
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = (quote) => {
    setDeleteConfirm({ show: true, id: quote.id, name: quote.quotationDetails || quote.referenceId });
  };

  const confirmDelete = async () => {
    setIsSaving(true);
    try {
        await quotationAPI.deleteQuotation(deleteConfirm.id);
        toast.success('Quotation deleted successfully');
        fetchQuotations();
        setDeleteConfirm({ show: false, id: null, name: '' });
    } catch (error) {
        console.error("Delete error:", error);
        toast.error('Failed to delete quotation');
    } finally {
        setIsSaving(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
        const payload = {
            quotationDetails: formData.quotationDetails.toUpperCase(),
            quoteValue: Number(formData.quoteValue),
            projectId: Number(formData.projectId),
            status: formData.status,
            version: formData.version
        };
        if (isEditing) {
            await quotationAPI.updateQuotation(currentId, payload);
            toast.success('Quotation updated successfully');
        } else {
            await quotationAPI.createQuotation(payload);
            toast.success('Quotation generated successfully');
        }
        fetchQuotations();
        setIsModalOpen(false);
        setIsEditing(false);
        setFormData({ quotationDetails: '', projectId: '', quoteValue: '', status: 'Draft', version: 'V1' });
    } catch (error) {
        console.error("Save error:", error);
        toast.error('Failed to save quotation');
    } finally {
        setIsSaving(false);
    }
  };

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
    return `₹${num.toLocaleString()}`;
  };

  const getProjectName = (id) => {
    const p = projects.find(proj => String(proj.id) === String(id));
    return p ? p.name : 'Unknown Project';
  };

  const stats = [
    { label: 'Active Quotes', value: quotes.length, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Quote Value', value: formatCurrency(quotes.reduce((a, b) => a + (Number(b.quoteValue || b.contractValue) || 0), 0)), icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Approval Rate', value: '75%', icon: FileCheck, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Avg cycle', value: '4 days', icon: Clock, color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  const filtered = quotes.filter(q => 
    q.quotationDetails?.toLowerCase().includes(search.toLowerCase()) ||
    getProjectName(q.projectId)?.toLowerCase().includes(search.toLowerCase()) ||
    q.version?.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="space-y-6 animate-fade-in dashboard-container">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Quotation Management</h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2 px-0.5 border-l-2 border-amber-500 ml-0.5">Commercial Proposals & Costing Sheets</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" /> New Quotation
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="card p-5">
            <div className={`${s.bg} w-10 h-10 rounded-2xl flex items-center justify-center mb-4`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className="text-2xl font-black text-slate-800 tracking-tight">{s.value}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              className="input pl-10 h-10 text-xs font-medium" 
              placeholder="Search by QTN ID, Client or Project..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="table-header">Quotation Details</th>
                <th className="table-header">Client & Project</th>
                <th className="table-header text-right">Quote Value</th>
                <th className="table-header text-center">Version</th>
                <th className="table-header text-center whitespace-nowrap">Status</th>
                <th className="table-header text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-6 py-4"><Skeleton className="w-full h-4" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.map((quote) => (
                <tr key={quote.id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-blue-600 font-bold border border-slate-100">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{quote.quotationDetails || quote.referenceId || 'N/A'}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ID: {quote.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <p className="font-bold text-slate-700">{getProjectName(quote.projectId)}</p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">Project Link</p>
                  </td>
                  <td className="table-cell text-right font-black text-slate-800">{formatCurrency(quote.quoteValue || quote.contractValue)}</td>
                  <td className="table-cell text-center font-bold text-slate-500 uppercase tracking-widest">{quote.version || 'V1'}</td>
                  <td className="table-cell text-center">
                    <span className={`badge ${statusBadge[quote.status]} px-3 py-1 font-black text-[9px] uppercase`}>
                      {quote.status}
                    </span>
                  </td>
                  <td className="table-cell text-center">
                    <div className="flex items-center justify-center gap-2">
                        <button 
                            onClick={() => setSelectedQuote(quote)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                        <Eye className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => handleOpenEdit(quote)}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                        <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => handleDelete(quote)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                        <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Placeholder */}
      {selectedQuote && (
        <div className="fixed inset-0 z-[250] flex justify-end bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedQuote(null)}>
          <div className="bg-white w-full max-w-lg h-full shadow-2xl animate-slide-left flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                    <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase shadow-sm tracking-widest">{selectedQuote.quotationDetails}</div>
                    <button onClick={() => setSelectedQuote(null)} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-all"><X className="w-5 h-5" /></button>
                </div>
                <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">{getProjectName(selectedQuote.projectId)}</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Commercial Proposal Registry</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Proposal Value</p>
                        <p className="text-xl font-black text-emerald-800 tracking-tight">{formatCurrency(selectedQuote.quoteValue)}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Version</p>
                        <p className="text-xl font-black text-slate-800 uppercase tracking-tighter text-[16px]">{selectedQuote.version || 'V1'}</p>
                    </div>
                </div>

                <div>
                   <h3 className="section-title mb-4 flex items-center gap-2"><History className="w-4 h-4" /> Revision History</h3>
                   <div className="space-y-4">
                        {[
                            { ver: 'V2', date: '2024-03-20', change: 'Updated material rates for Copper cabling.' },
                            { ver: 'V1', date: '2024-03-15', change: 'Initial proposal' },
                        ].map((rev, i) => (
                            <div key={i} className="p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-black text-[#2f6645] uppercase">{rev.ver}</span>
                                    <span className="text-[9px] font-bold text-slate-300">{rev.date}</span>
                                </div>
                                <p className="text-xs font-medium text-slate-600 leading-relaxed">{rev.change}</p>
                            </div>
                        ))}
                   </div>
                </div>

                <div className="p-6 bg-slate-900 text-white rounded-[2rem] shadow-2xl">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Quick Actions</p>
                    <div className="grid grid-cols-2 gap-3">
                        <button className="flex flex-col items-center gap-2 p-4 bg-slate-800 rounded-2xl hover:bg-slate-700 transition-all border border-slate-700 shadow-inner">
                            <Download className="w-5 h-5 text-emerald-400" />
                            <span className="text-[10px] font-black uppercase">Download PDF</span>
                        </button>
                        <button className="flex flex-col items-center gap-2 p-4 bg-slate-800 rounded-2xl hover:bg-slate-700 transition-all border border-slate-700 shadow-inner">
                            <FileCheck className="w-5 h-5 text-emerald-400" />
                            <span className="text-[10px] font-black uppercase">Approve</span>
                        </button>
                    </div>
                    <button className="w-full mt-6 py-4 bg-[#2f6645] text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-900/40 hover:bg-[#244f35] transition-all">Revise Quotation</button>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal Placeholder */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl animate-scale-up">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-xl">
              <h2 className="text-lg font-black text-slate-800">Generate New Quotation</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quotation Details / ID <span className="text-red-500">*</span></label>
                        <input name="quotationDetails" required className="input w-full h-12 uppercase font-black" placeholder="e.g. QTN-2024-001" value={formData.quotationDetails} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Project <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <select name="projectId" required className="input w-full h-12 rounded-xl text-sm font-bold appearance-none bg-white pr-10" value={formData.projectId} onChange={handleInputChange}>
                                <option value="">-- Choose Project --</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} (ID: {p.id})</option>
                                ))}
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quote Value (₹) <span className="text-red-500">*</span></label>
                        <input name="quoteValue" type="number" required className="input w-full h-12 font-black text-emerald-600" placeholder="0.00" value={formData.quoteValue} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Version</label>
                        <input name="version" className="input w-full h-12 uppercase font-black" placeholder="V1" value={formData.version} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                        <div className="relative">
                            <select name="status" className="input w-full h-12 rounded-xl text-sm font-bold appearance-none bg-white pr-10" value={formData.status} onChange={handleInputChange}>
                                <option>Draft</option>
                                <option>Pending Approval</option>
                                <option>Approved</option>
                                <option>Revised</option>
                                <option>Rejected</option>
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>
                </div>
                <div className="flex justify-end pt-4 gap-4 sticky bottom-0 bg-white">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-all">Discard</button>
                    <button type="submit" disabled={isSaving} className="btn-primary min-w-[160px] py-4 text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-900/10 flex items-center justify-center gap-2">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isEditing ? 'Update Quotation' : 'Create Quotation'}
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-8">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center">
                    <Trash2 className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight">Remove Quotation?</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Permanent Action</p>
                </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-8">
                Are you sure you want to remove <span className="font-black text-slate-900 underline decoration-red-200">{deleteConfirm.name}</span>? This cannot be undone.
            </p>
            <div className="flex gap-3">
                <button 
                    onClick={() => setDeleteConfirm({ show: false, id: null, name: '' })}
                    className="flex-1 py-4 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all"
                >
                    Cancel
                </button>
                <button 
                    onClick={confirmDelete}
                    disabled={isSaving}
                    className="flex-1 py-4 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-red-900/20 hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Delete"}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
