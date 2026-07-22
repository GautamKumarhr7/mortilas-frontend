import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Star, FileText, 
  CreditCard, Briefcase, MapPin, Search,
  Plus, Download, CheckCircle2, AlertTriangle, 
  X, Loader2, Save, MoreVertical, ExternalLink, ShieldCheck, Edit3, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import Skeleton from '../../../components/common/Skeleton';
import { subcontractorAPI } from '../services';
import { State, City } from 'country-state-city';

export default function Subcontractors() {
  const [subs, setSubs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState(null);
  const [currentId, setCurrentId] = useState(null);
  
  // States & Cities
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    // Only India (IN) for now
    setStates(State.getStatesOfCountry('IN'));
  }, []);

  const initialForm = {
    companyName: '', contactPerson: '', phone: '', email: '', 
    status: 'Active', address: '', city: '', state: '', country: 'India', pincode: '',
    trade: 'Electrical', gstNo: '', panNo: '',
    tdsType: 'Company', tdsRate: '1', defaultRetentionPercent: '5',
    bankName: '', accountHolder: '', accountNumber: '', ifscCode: ''
  };
  const [formData, setFormData] = useState(initialForm);

  // Update cities when state changes
  useEffect(() => {
    if (formData.state) {
      // find state code
      const stateObj = states.find(s => s.name === formData.state);
      if (stateObj) {
        setCities(City.getCitiesOfState('IN', stateObj.isoCode));
      } else {
        setCities([]);
      }
    } else {
      setCities([]);
    }
  }, [formData.state, states]);

  const fetchSubs = async () => {
    setIsLoading(true);
    try {
      const res = await subcontractorAPI.getAllSubcontractors();
      const data = res?.data?.data || res?.data || res || [];
      setSubs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load subcontractors');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubs();
  }, []);

  const handleOpenAdd = () => {
    setCurrentId(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (e, item) => {
    e.stopPropagation();
    setCurrentId(item.id);
    setFormData({
        companyName: item.companyName || '',
        contactPerson: item.contactPerson || '',
        phone: item.phone || '',
        email: item.email || '',
        status: item.status || 'Active',
        address: item.address || '',
        city: item.city || '',
        state: item.state || '',
        country: item.country || 'India',
        pincode: item.pincode || '',
        trade: item.trade || 'Electrical',
        gstNo: item.gstNo || '',
        panNo: item.panNo || '',
        tdsType: item.tdsType || 'Company',
        tdsRate: item.tdsRate || '1',
        defaultRetentionPercent: item.defaultRetentionPercent || '5',
        bankName: item.bankName || '',
        accountHolder: item.accountHolder || '',
        accountNumber: item.accountNumber || '',
        ifscCode: item.ifscCode || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (e, id) => {
      e.stopPropagation();
      if(!window.confirm("Are you sure you want to delete this subcontractor?")) return;
      try {
          await subcontractorAPI.deleteSubcontractor(id);
          toast.success("Deleted successfully");
          fetchSubs();
      } catch (err) {
          toast.error("Failed to delete");
      }
  };

  const validateForm = () => {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      
      if (!panRegex.test(formData.panNo)) {
          toast.error("Invalid PAN Format (e.g. ABCDE1234F)");
          return false;
      }
      if (!gstRegex.test(formData.gstNo)) {
          toast.error("Invalid GSTIN Format (e.g. 22AAAAA0000A1Z5)");
          return false;
      }
      return true;
  };

  const handleSave = async (e) => {
      e.preventDefault();
      if (!validateForm()) return;

      setIsSaving(true);
      const payload = { ...formData };
      try {
          if (currentId) {
              await subcontractorAPI.updateSubcontractor(currentId, payload);
              toast.success("Updated successfully");
          } else {
              await subcontractorAPI.createSubcontractor(payload);
              toast.success("Created successfully");
          }
          setIsModalOpen(false);
          fetchSubs();
      } catch(err) {
          toast.error("Failed to save");
      } finally {
          setIsSaving(false);
      }
  };

  const filtered = subs.filter(s => 
    (s.companyName || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.address || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#2f6645]" /> Subcontractor Directory
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Manage vendor compliance, ratings, and work orders</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search vendors..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2f6645]/20 focus:border-[#2f6645] transition-all"
            />
          </div>
          <button onClick={handleOpenAdd} className="btn-primary flex items-center gap-2 whitespace-nowrap">
            <UserPlus className="w-4 h-4" /> Add Vendor
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="table-header">Vendor Identity</th>
                <th className="table-header">Contact & Location</th>
                <th className="table-header">Compliance</th>
                <th className="table-header">Status</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({length: 3}).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="p-4" colSpan="5"><Skeleton className="w-full h-12" /></td>
                  </tr>
                ))
              ) : filtered.length > 0 ? filtered.map((sub) => (
                <tr key={sub.id} onClick={() => setSelectedSub(sub)} className="table-row hover:bg-slate-50 transition-colors cursor-pointer">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-[#2f6645] font-black uppercase shadow-sm">
                        {(sub.companyName || 'U')[0]}
                      </div>
                      <div>
                        <p className="text-slate-900 font-bold">{sub.companyName}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Code: {sub.subcontractorCode || 'N/A'} • {sub.trade}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <p className="text-slate-800 font-medium">{sub.contactPerson || 'N/A'}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 font-mono">
                      <span>{sub.phone || '-'}</span>
                      <span className="text-slate-300">•</span>
                      <span className="truncate max-w-[120px]" title={sub.city}>{sub.city || '-'}, {sub.state || '-'}</span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex flex-col gap-1 text-[10px] font-mono">
                      <span className="text-slate-500">GST: <span className="font-bold text-slate-700">{sub.gstNo || 'N/A'}</span></span>
                      <span className="text-slate-500">PAN: <span className="font-bold text-slate-700">{sub.panNo || 'N/A'}</span></span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className={`badge ${sub.status === 'Active' ? 'badge-green' : sub.status === 'Inactive' ? 'badge-gray' : 'badge-red'}`}>{sub.status}</span>
                  </td>
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end gap-2">
                        <button onClick={(e) => handleOpenEdit(e, sub)} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={(e) => handleDelete(e, sub.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                        <button className="p-1.5 text-slate-400 hover:text-[#2f6645] hover:bg-emerald-50 rounded-lg transition-colors"><MoreVertical className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                    <td colSpan="5" className="p-10 text-center text-slate-400 font-medium">No Subcontractors Found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#2f6645]" /> {currentId ? 'Update Subcontractor' : 'Register Subcontractor'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Business Identity</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Company Name <span className="text-red-500">*</span></label>
                    <input required className="input w-full" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} placeholder="e.g. GSAR POWER TECH" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Trade <span className="text-red-500">*</span></label>
                    <select className="input w-full" value={formData.trade} onChange={e => setFormData({...formData, trade: e.target.value})}>
                      <option>Civil</option>
                      <option>Electrical</option>
                      <option>Plumbing</option>
                      <option>HVAC</option>
                      <option>Painting</option>
                      <option>Fabrication</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Contact Person <span className="text-red-500">*</span></label>
                    <input required className="input w-full" value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} placeholder="e.g. John Doe" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Email <span className="text-red-500">*</span></label>
                    <input required type="email" className="input w-full" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="contact@company.com" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Phone <span className="text-red-500">*</span></label>
                    <input required className="input w-full" value={formData.phone} onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length <= 10) setFormData({...formData, phone: val});
                    }} placeholder="10-digit number" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Location</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-slate-700">Address <span className="text-red-500">*</span></label>
                    <input required className="input w-full" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Street address" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">State <span className="text-red-500">*</span></label>
                    <select required className="input w-full" value={formData.state} onChange={e => {
                        setFormData({...formData, state: e.target.value, city: ''})
                    }}>
                        <option value="">Select State</option>
                        {states.map(s => <option key={s.isoCode} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">City <span className="text-red-500">*</span></label>
                    <select required className="input w-full" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} disabled={!formData.state}>
                        <option value="">Select City</option>
                        {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Pincode <span className="text-red-500">*</span></label>
                    <input required className="input w-full" value={formData.pincode} onChange={e => setFormData({...formData, pincode: e.target.value})} placeholder="Pincode" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Country <span className="text-red-500">*</span></label>
                    <input required className="input w-full disabled:opacity-50" value={formData.country} disabled placeholder="Country" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Bank Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Bank Name</label>
                    <input className="input w-full" value={formData.bankName} onChange={e => setFormData({...formData, bankName: e.target.value})} placeholder="e.g. HDFC Bank" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Account Holder</label>
                    <input className="input w-full" value={formData.accountHolder} onChange={e => setFormData({...formData, accountHolder: e.target.value})} placeholder="Account Holder Name" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Account Number</label>
                    <input className="input w-full" value={formData.accountNumber} onChange={e => setFormData({...formData, accountNumber: e.target.value.replace(/\D/g, '')})} placeholder="Bank Account Number" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">IFSC Code</label>
                    <input className="input w-full font-mono uppercase" value={formData.ifscCode} onChange={e => setFormData({...formData, ifscCode: e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()})} placeholder="e.g. HDFC0001234" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Compliance & Tax Setup</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">GST Number <span className="text-red-500">*</span></label>
                    <input required className="input w-full font-mono uppercase" pattern="^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$" title="e.g. 22AAAAA0000A1Z5" value={formData.gstNo} onChange={e => {
                        const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                        if (val.length <= 15) setFormData({...formData, gstNo: val});
                    }} placeholder="15-digit GSTIN" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">PAN Number <span className="text-red-500">*</span></label>
                    <input required className="input w-full font-mono uppercase" pattern="^[A-Z]{5}[0-9]{4}[A-Z]{1}$" title="e.g. ABCDE1234F" value={formData.panNo} onChange={e => {
                        const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                        if (val.length <= 10) setFormData({...formData, panNo: val});
                    }} placeholder="10-digit PAN" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">TDS Type <span className="text-red-500">*</span></label>
                    <select required className="input w-full text-xs" value={formData.tdsType} onChange={e => setFormData({...formData, tdsType: e.target.value})}>
                      <option>Individual</option>
                      <option>Company</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Status</label>
                    <select className="input w-full" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option>Active</option>
                      <option>Inactive</option>
                      <option>Blacklisted</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-white">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary px-6">Cancel</button>
                <button type="submit" disabled={isSaving} className="btn-primary flex items-center gap-2 px-6">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? 'Processing...' : 'Save Subcontractor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Detail slideover */}
      {selectedSub && (
        <div className="fixed inset-0 z-[250] flex justify-end bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedSub(null)}>
          <div className="bg-white w-full max-w-sm h-full shadow-2xl p-6 overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">{selectedSub.companyName}</h2>
                <button onClick={() => setSelectedSub(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5"/></button>
            </div>
            
            <p className="text-sm text-slate-500 mb-4">{selectedSub.subcontractorCode}</p>
            <p className="mt-4"><strong>Contact:</strong> {selectedSub.phone || 'N/A'}</p>
            <p className="mt-2"><strong>Address:</strong> {selectedSub.address}, {selectedSub.city}</p>
            <p className="mt-2"><strong>GST:</strong> {selectedSub.gstNo || 'N/A'}</p>
            <p className="mt-2"><strong>PAN:</strong> {selectedSub.panNo || 'N/A'}</p>
            <p className="mt-2"><strong>Trade:</strong> {selectedSub.trade}</p>
            <p className="mt-2"><strong>TDS:</strong> {selectedSub.tdsType} ({selectedSub.tdsRate}%)</p>
            
            <h3 className="font-bold text-slate-800 mt-6 mb-2 border-b pb-1">Bank Details</h3>
            <p className="mt-2"><strong>Bank:</strong> {selectedSub.bankName || 'N/A'}</p>
            <p className="mt-2"><strong>A/C Name:</strong> {selectedSub.accountHolder || 'N/A'}</p>
            <p className="mt-2"><strong>A/C No:</strong> {selectedSub.accountNumber || 'N/A'}</p>
            <p className="mt-2"><strong>IFSC:</strong> {selectedSub.ifscCode || 'N/A'}</p>
          </div>
        </div>
      )}
    </div>
  );
}
