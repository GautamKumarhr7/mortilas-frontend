import React, { useState, useEffect } from 'react';
import { 
  Target, Users, Briefcase, TrendingUp, 
  Plus, Search, Download, Filter, 
  ChevronRight, X, Loader2, Save,
  Phone, Mail, MapPin, Calendar, 
  Clock, CheckCircle2, AlertCircle, History, Globe
} from 'lucide-react';
import toast from 'react-hot-toast';
import Skeleton from '../../../components/common/Skeleton';

const statusBadge = {
  'Lead': 'bg-blue-50 text-blue-600 border-blue-100',
  'Negotiation': 'bg-amber-50 text-amber-600 border-amber-100',
  'Won': 'bg-emerald-50 text-emerald-600 border-emerald-100',
  'Lost': 'bg-red-50 text-red-600 border-red-100',
  'On Hold': 'bg-slate-50 text-slate-500 border-slate-200',
};

export default function CRM() {
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [formData, setFormData] = useState({
    name: '', company: '', value: '', status: 'Lead',
    source: 'Direct', contact: '', email: '', location: ''
  });

  useEffect(() => {
    // Simulated fetch
    setTimeout(() => {
      setLeads([
        { id: 1, name: 'Vikram Mehta', company: 'Global Infra Corp', value: 4500000, status: 'Negotiation', source: 'Referral', contact: '9876543210', email: 'v.mehta@global.com', location: 'Mumbai' },
        { id: 2, name: 'Anjali Sharma', company: 'Build-Rite Pvt Ltd', value: 12500000, status: 'Won', source: 'Tender', contact: '8877665544', email: 'anjali@buildrite.in', location: 'Delhi' },
        { id: 3, name: 'Sanjay Reddy', company: 'Reddy Builders', value: 850000, status: 'Lead', source: 'Website', contact: '7766554433', email: 'sanjay@reddy.com', location: 'Hyderabad' },
        { id: 4, name: 'Rajesh Gupta', company: 'Gupta & Sons', value: 3200000, status: 'On Hold', source: 'Direct', contact: '9988776655', email: 'rajesh@gupta.com', location: 'Kolkata' },
        { id: 5, name: 'Priya Verma', company: 'Urban Spaces', value: 6700000, status: 'Negotiation', source: 'LinkedIn', contact: '6655443322', email: 'p.verma@urban.co', location: 'Bangalore' },
      ]);
      setIsLoading(false);
    }, 800);
  }, []);

  const filtered = leads.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.company.toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { label: 'Active Leads', value: leads.length, icon: Target, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Pipeline Value', value: `₹${(leads.reduce((a, b) => a + b.value, 0) / 10000000).toFixed(1)}Cr`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Won Deals', value: leads.filter(l => l.status === 'Won').length, icon: CheckCircle2, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Market Reach', value: '12 States', icon: Globe, color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      const newLead = { ...formData, id: Date.now(), value: Number(formData.value) };
      setLeads([newLead, ...leads]);
      setIsSaving(false);
      setIsModalOpen(false);
      toast.success('Lead added successfully');
      setFormData({ name: '', company: '', value: '', status: 'Lead', source: 'Direct', contact: '', email: '', location: '' });
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-fade-in dashboard-container">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">CRM & Pipeline</h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2 px-0.5 border-l-2 border-blue-500 ml-0.5">Leads, Opportunities & Relationships</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary flex items-center gap-2"><Download className="w-4 h-4" /> Reports</button>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" /> Add Opportunity
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="card p-5 group hover:border-blue-200 transition-all cursor-default">
            <div className="flex justify-between items-start">
              <div className={`${s.bg} p-2.5 rounded-2xl`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-black text-slate-800 tracking-tight">{s.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 bg-slate-50/50">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              className="input pl-10 h-10 text-xs font-medium" 
              placeholder="Search leads, companies or locations..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs box-border">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="table-header">Contact Information</th>
                <th className="table-header">Company / Type</th>
                <th className="table-header text-right">Potential Value</th>
                <th className="table-header">Source</th>
                <th className="table-header text-center">Status</th>
                <th className="table-header text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-6 py-4"><Skeleton className="w-full h-4" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.map((lead) => (
                <tr key={lead.id} className="table-row hover:bg-slate-50 transition-colors">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold uppercase text-[10px]">
                        {lead.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-slate-900 font-bold">{lead.name}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{lead.contact}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <p className="font-bold text-slate-700">{lead.company}</p>
                    <div className="flex items-center gap-1 opacity-60">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span className="text-[9px] font-bold uppercase text-slate-400">{lead.location}</span>
                    </div>
                  </td>
                  <td className="table-cell text-right">
                    <p className="font-bold text-blue-600">₹{(lead.value / 100000).toFixed(1)}L</p>
                  </td>
                  <td className="table-cell">
                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md border border-slate-200">{lead.source}</span>
                  </td>
                  <td className="table-cell text-center">
                    <span className={`badge ${statusBadge[lead.status]}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="table-cell text-center">
                    <div className="flex items-center justify-center gap-2">
                        <button 
                            onClick={() => setSelectedLead(lead)}
                            className="px-2.5 py-1 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-bold hover:bg-slate-100 transition-colors uppercase border border-slate-100"
                        >
                        History
                        </button>
                        <button 
                            onClick={() => setSelectedLead(lead)}
                            className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold hover:bg-blue-100 transition-colors uppercase border border-blue-100"
                        >
                        Follow-up
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Lead Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" /> New Business Opportunity
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Client Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Contact Name <span className="text-red-500">*</span></label>
                    <input required className="input w-full" placeholder="Person Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Company Name <span className="text-red-500">*</span></label>
                    <input required className="input w-full" placeholder="Organization" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Opportunity Info</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Estimated Value (₹) <span className="text-red-500">*</span></label>
                    <input required type="number" className="input w-full font-bold text-blue-600" placeholder="0.00" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Pipeline Stage <span className="text-red-500">*</span></label>
                    <select className="input w-full" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option>Lead</option>
                      <option>Negotiation</option>
                      <option>Won</option>
                      <option>Lost</option>
                      <option>On Hold</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-white">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary px-6">Cancel</button>
                <button type="submit" disabled={isSaving} className="btn-primary flex items-center gap-2 px-6">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? 'Saving...' : 'Create Opportunity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action Detail Slide-over */}
      {selectedLead && (
        <div className="fixed inset-0 z-[250] flex justify-end bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedLead(null)}>
          <div className="bg-white w-full max-w-lg h-full shadow-2xl animate-slide-left flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#2f6645] text-white flex items-center justify-center font-black shadow-lg shadow-emerald-200">
                        {selectedLead.name[0]}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 tracking-tight">{selectedLead.name}</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedLead.company} • {selectedLead.location}</p>
                    </div>
                </div>
                <button onClick={() => setSelectedLead(null)} className="p-2 hover:bg-white rounded-xl text-slate-400"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Potential</p>
                        <p className="text-xl font-black text-emerald-800">₹{(selectedLead.value / 100000).toFixed(1)}L</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Stage</p>
                        <p className="text-xl font-black text-slate-800">{selectedLead.status}</p>
                    </div>
                </div>

                <div>
                   <h3 className="section-title mb-4 flex items-center gap-2"><History className="w-4 h-4" /> Interaction Timeline</h3>
                   <div className="space-y-4">
                        {[
                            { date: '2026-03-27 10:15', type: 'Callback', note: 'Asked for technical brochure of structural work.' },
                            { date: '2026-03-24 14:30', type: 'Site Visit', note: 'Initial project feasibility survey at Borivali site.' },
                            { date: '2026-03-20 09:00', type: 'Lead Gen', note: 'Received inquiry via website contact form.' },
                        ].map((log, i) => (
                            <div key={i} className="flex gap-4 p-4 hover:bg-slate-50 rounded-xl transition-all group">
                                <div className="flex flex-col items-center">
                                    <div className="w-2.5 h-2.5 rounded-full mt-1.5 bg-emerald-500 ring-4 ring-emerald-50 shadow-sm"></div>
                                    <div className="w-[1px] flex-1 bg-slate-100 my-1 group-last:hidden"></div>
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-slate-700">{log.type}</p>
                                    <p className="text-[10px] text-slate-500 mt-0.5">{log.note}</p>
                                    <p className="text-[9px] text-slate-300 font-bold uppercase mt-2">{log.date}</p>
                                </div>
                            </div>
                        ))}
                   </div>
                </div>

                <div className="p-6 bg-[#2f6645]/5 rounded-[2rem] border border-[#2f6645]/10">
                    <h3 className="text-sm font-bold text-[#2f6645] mb-4 flex items-center gap-2"><Plus className="w-4 h-4" /> Log Interaction</h3>
                    <textarea className="input w-full h-24 text-xs p-3" placeholder="Enter notes from call/meeting..." />
                    <button className="w-full mt-3 py-4 bg-[#2f6645] text-white text-[10px] font-black uppercase rounded-2xl shadow-xl shadow-emerald-990/10 active:scale-95">Update Activity</button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
