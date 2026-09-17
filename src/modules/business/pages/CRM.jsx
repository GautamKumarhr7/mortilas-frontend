import React, { useState, useEffect } from 'react';
import { 
  Target, Users, TrendingUp, 
  Plus, Search, 
  X, Loader2, Save,
  Phone, MapPin,
  CheckCircle2, Globe, Trash2, Edit3, Eye, History,
  ChevronDown, Building2, User
} from 'lucide-react';
import toast from 'react-hot-toast';
import Skeleton from '../../../components/common/Skeleton';
import { leadAPI } from '../services';
import { State, City } from 'country-state-city';

const SOURCE_TYPES = ['referral', 'direct', 'website', 'tender'];
const STATUSES = ['lead', 'win', 'lost'];

const IN_STATES = State.getStatesOfCountry('IN').sort((a, b) => a.name.localeCompare(b.name));

const statusBadge = {
  'lead':  'bg-blue-50 text-blue-600 border-blue-100',
  'win':   'bg-emerald-50 text-emerald-600 border-emerald-100',
  'lost':  'bg-red-50 text-red-600 border-red-100',
};

const sourceBadge = {
  'referral': 'bg-purple-50 text-purple-600',
  'direct':   'bg-slate-100 text-slate-600',
  'website':  'bg-cyan-50 text-cyan-600',
  'tender':   'bg-amber-50 text-amber-600',
};

const emptyForm = {
  companyName: '',
  state: '',
  city: '',
  address: '',
  personName: '',
  personMobile: '',
  sourceType: 'direct',
  status: 'lead',
  potentialValue: '',
};

export default function CRM() {
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, name: '' });
  const [formData, setFormData] = useState({ ...emptyForm });

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const res = await leadAPI.getAllLeads();
      const data = res?.data?.data || res?.data || res || [];
      setLeads(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load leads');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchLeads(); }, []);

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
    return `₹${num.toLocaleString()}`;
  };

  const stats = [
    { label: 'Total Leads', value: leads.length, icon: Target, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Pipeline Value', value: formatCurrency(leads.reduce((a, b) => a + (Number(b.potentialValue) || 0), 0)), icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Won Deals', value: leads.filter(l => l.status === 'win').length, icon: CheckCircle2, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Market Coverage', value: `${new Set(leads.map(l => l.state).filter(Boolean)).size} States`, icon: Globe, color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  const filtered = leads.filter(l =>
    (l.companyName || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.personName || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.city || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenEdit = (lead) => {
    setIsEditing(true);
    setCurrentId(lead.id);
    setFormData({
      companyName: lead.companyName || '',
      state: lead.state || '',
      city: lead.city || '',
      address: lead.address || '',
      personName: lead.personName || '',
      personMobile: lead.personMobile || '',
      sourceType: lead.sourceType || 'direct',
      status: lead.status || 'lead',
      potentialValue: lead.potentialValue || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        potentialValue: formData.potentialValue ? Number(formData.potentialValue) : null,
      };
      if (isEditing) {
        await leadAPI.updateLead(currentId, payload);
        toast.success('Lead updated successfully');
      } else {
        await leadAPI.createLead(payload);
        toast.success('Lead added successfully');
      }
      fetchLeads();
      setIsModalOpen(false);
      setIsEditing(false);
      setFormData({ ...emptyForm });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save lead');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    setIsSaving(true);
    try {
      await leadAPI.deleteLead(deleteConfirm.id);
      toast.success('Lead deleted');
      fetchLeads();
      setDeleteConfirm({ show: false, id: null, name: '' });
    } catch {
      toast.error('Failed to delete lead');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in dashboard-container pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none uppercase tracking-tighter">CRM & Pipeline</h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2 px-0.5 border-l-2 border-blue-500 ml-0.5">Leads, Opportunities & Relationships</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary flex items-center gap-2" onClick={fetchLeads}>
            <History className="w-4 h-4" /> Refresh
          </button>
          <button onClick={() => { setIsEditing(false); setFormData({ ...emptyForm }); setIsModalOpen(true); }} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" /> Add Lead
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="card p-5 group transition-all hover:bg-slate-50">
            <div className="flex justify-between items-center">
              <div className={`${s.bg} w-10 h-10 rounded-xl flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <TrendingUp className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="mt-4">
              <p className="text-2xl font-black text-slate-800 tracking-tight">{s.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="input pl-10 h-10 text-xs font-semibold w-full"
              placeholder="Search by company, contact or city..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#fcfdfe] border-b border-slate-200">
              <tr>
                <th className="table-header">Company</th>
                <th className="table-header">Contact Person</th>
                <th className="table-header">Location</th>
                <th className="table-header">Source</th>
                <th className="table-header text-right">Potential Value</th>
                <th className="table-header text-center">Status</th>
                <th className="table-header text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-6 py-4"><Skeleton className="w-full h-4" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-20 text-slate-400 uppercase font-black tracking-widest text-[10px]">No leads found</td></tr>
              ) : filtered.map((lead) => (
                <tr key={lead.id} className="table-row group">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-black text-slate-800 uppercase tracking-tight leading-none mb-1">{lead.companyName}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ID: {lead.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <p className="font-bold text-slate-700">{lead.personName}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span className="text-[9px] font-bold text-slate-400">{lead.personMobile}</span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span className="font-bold text-slate-600">{[lead.city, lead.state].filter(Boolean).join(', ') || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md capitalize ${sourceBadge[lead.sourceType] || 'bg-slate-100 text-slate-500'}`}>
                      {lead.sourceType}
                    </span>
                  </td>
                  <td className="table-cell text-right font-black text-slate-900 tracking-tight">
                    {formatCurrency(lead.potentialValue)}
                  </td>
                  <td className="table-cell text-center">
                    <span className={`badge capitalize ${statusBadge[lead.status] || 'bg-slate-50 text-slate-500'}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="table-cell text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => setSelectedLead(lead)} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all" title="View"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => handleOpenEdit(lead)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all" title="Edit"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteConfirm({ show: true, id: lead.id, name: lead.companyName })} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-up">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-800 leading-none">{isEditing ? 'Update Lead' : 'Add New Lead'}</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">CRM & Pipeline Management</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-slate-600 transition-all"><X className="w-6 h-6" /></button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-6">
              {/* Company Section */}
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Building2 className="w-3.5 h-3.5" /> Company Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company Name <span className="text-red-500">*</span></label>
                    <input name="companyName" required className="input w-full h-12" placeholder="e.g. Acme Infra Pvt. Ltd." value={formData.companyName} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">State</label>
                    <div className="relative">
                      <select name="state" className="input w-full h-12 appearance-none bg-white pr-10 font-bold" value={formData.state} onChange={e => {
                        setFormData(prev => ({ ...prev, state: e.target.value, city: '' }));
                      }}>
                        <option value="">-- Select State --</option>
                        {IN_STATES.map(s => <option key={s.isoCode} value={s.name}>{s.name}</option>)}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">City</label>
                    <div className="relative">
                      {(() => {
                        const stateObj = IN_STATES.find(s => s.name === formData.state);
                        const cities = stateObj ? City.getCitiesOfState('IN', stateObj.isoCode) : [];
                        return (
                          <select name="city" className="input w-full h-12 appearance-none bg-white pr-10 font-bold" value={formData.city} onChange={handleInputChange} disabled={!formData.state}>
                            <option value="">{formData.state ? `-- Select City (${cities.length}) --` : '-- Select State First --'}</option>
                            {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                          </select>
                        );
                      })()}
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Address</label>
                    <input name="address" className="input w-full h-12" placeholder="Full address..." value={formData.address} onChange={handleInputChange} />
                  </div>
                </div>
              </div>

              {/* Contact Section */}
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><User className="w-3.5 h-3.5" /> Contact Person</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Person Name <span className="text-red-500">*</span></label>
                    <input name="personName" required className="input w-full h-12" placeholder="e.g. Rahul Sharma" value={formData.personName} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile No. <span className="text-red-500">*</span></label>
                    <input name="personMobile" required className="input w-full h-12" placeholder="10-digit mobile" value={formData.personMobile} onChange={handleInputChange} />
                  </div>
                </div>
              </div>

              {/* Opportunity Section */}
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5" /> Opportunity Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Source Type <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <select name="sourceType" className="input w-full h-12 appearance-none bg-white pr-10 capitalize font-bold" value={formData.sourceType} onChange={handleInputChange}>
                        {SOURCE_TYPES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <select name="status" className="input w-full h-12 appearance-none bg-white pr-10 capitalize font-bold" value={formData.status} onChange={handleInputChange}>
                        {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Potential Value (₹)</label>
                    <input name="potentialValue" type="number" className="input w-full h-12 font-black" placeholder="e.g. 5000000" value={formData.potentialValue} onChange={handleInputChange} />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 gap-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-all">Cancel</button>
                <button type="submit" disabled={isSaving} className="bg-blue-600 text-white px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isEditing ? 'Update Lead' : 'Save Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Slide-over */}
      {selectedLead && (
        <div className="fixed inset-0 z-[250] flex justify-end bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedLead(null)}>
          <div className="bg-white w-full max-w-md h-full shadow-2xl animate-slide-left flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-lg shadow-blue-200">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-800 tracking-tight leading-none">{selectedLead.companyName}</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Lead Detail View</p>
                </div>
              </div>
              <button onClick={() => setSelectedLead(null)} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-all"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50/70 border-l-4 border-blue-500 rounded-2xl">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Potential Value</p>
                  <p className="text-xl font-black text-blue-800">{formatCurrency(selectedLead.potentialValue)}</p>
                </div>
                <div className="p-4 bg-slate-50 border-l-4 border-slate-300 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Status</p>
                  <p className={`text-base font-black capitalize ${selectedLead.status === 'win' ? 'text-emerald-600' : selectedLead.status === 'lost' ? 'text-red-600' : 'text-blue-600'}`}>{selectedLead.status}</p>
                </div>
              </div>

              <div className="space-y-3 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Contact Details</h3>
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-xs font-black text-slate-800">{selectedLead.personName}</p>
                    <p className="text-[10px] text-slate-400">{selectedLead.personMobile}</p>
                  </div>
                </div>
                {(selectedLead.city || selectedLead.state) && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <p className="text-xs font-bold text-slate-700">{[selectedLead.city, selectedLead.state].filter(Boolean).join(', ')}</p>
                  </div>
                )}
                {selectedLead.address && (
                  <p className="text-[10px] text-slate-500 border-t border-slate-100 pt-3 mt-2">{selectedLead.address}</p>
                )}
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Source</p>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg capitalize ${sourceBadge[selectedLead.sourceType] || 'bg-slate-100 text-slate-500'}`}>
                    {selectedLead.sourceType}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Created</p>
                  <p className="text-xs font-bold text-slate-600">{selectedLead.createdAt ? new Date(selectedLead.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</p>
                </div>
              </div>

              <button
                onClick={() => { setSelectedLead(null); handleOpenEdit(selectedLead); }}
                className="w-full py-4 bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
              >
                Edit This Lead
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Delete Lead?</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Permanent Action</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-8">
              Are you sure you want to delete <span className="font-black text-slate-900 underline decoration-red-200">{deleteConfirm.name}</span>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm({ show: false, id: null, name: '' })} className="flex-1 py-4 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all">Cancel</button>
              <button onClick={confirmDelete} disabled={isSaving} className="flex-1 py-4 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-red-900/20 hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
