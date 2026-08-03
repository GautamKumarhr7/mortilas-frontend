import { useState, useEffect } from 'react';
import { Briefcase, Settings, FileText, Plus, Search, Filter, Download, MoreVertical, Eye, X, Loader2, Edit3, Trash2, ChevronDown } from 'lucide-react';
import { tenderAPI } from '../services';
import { useApp } from '../../../hooks/useApp';
import toast from 'react-hot-toast';

export default function Tenders() {
  const { projects } = useApp();
  const [activeTab, setActiveTab] = useState('work-awarded');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [works, setWorks] = useState([]);
  const [machineries, setMachineries] = useState([
    { id: 1, desc: 'Post Hole Digger', available: 'Owned', purchaseDate: '2023-12-29', driving: 'Electric', condition: 'Running', inspected: 'Yes', qty: '01 Nos' },
    { id: 2, desc: 'Concrete Mixture Machine', available: 'Owned', purchaseDate: '2023-01-02', driving: 'Diesel', condition: 'Running', inspected: 'Yes', qty: '01 Nos' },
    { id: 3, desc: 'Water Tank 5000Ltr', available: 'Owned', purchaseDate: '2023-01-02', driving: '-', condition: 'Running', inspected: 'Yes', qty: '01 Nos' },
    { id: 4, desc: 'Shuttering Plate', available: 'Owned', purchaseDate: '2023-01-02', driving: '-', condition: 'Running', inspected: 'Yes', qty: '450 Sqmm' },
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    nameOfWork: '',
    natureOfWork: '',
    clientNameAddress: '',
    contractNo: '',
    contractValue: '',
    awardDate: '',
    projectId: ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, name: '', isWork: true });

  const fetchTenders = async () => {
    setIsLoading(true);
    try {
        const res = await tenderAPI.getAllTenders();
        const data = res?.tenders || res?.data?.tenders || res?.data || res || [];
        setWorks(Array.isArray(data) ? data : []);
    } catch (error) {
        console.error("Failed to fetch tenders:", error);
        toast.error("Failed to load records.");
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenders();
  }, []);

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
    return `₹${num.toLocaleString()}`;
  };

  const handleDelete = (item, isWork = true) => {
    setDeleteConfirm({ 
      show: true, 
      id: item.id, 
      name: isWork ? (item.Name || item.nameOfWork) : item.desc, 
      isWork 
    });
  };

  const confirmDelete = async () => {
    setIsSaving(true);
    try {
        if (deleteConfirm.isWork) {
            await tenderAPI.deleteTender(deleteConfirm.id);
            toast.success('Tender record deleted successfully');
            fetchTenders();
        } else {
            setMachineries(prev => prev.filter(m => m.id !== deleteConfirm.id));
            toast.success('Machinery record removed');
        }
        setDeleteConfirm({ show: false, id: null, name: '', isWork: true });
    } catch (error) {
        console.error("Delete error:", error);
        toast.error('Failed to delete record');
    } finally {
        setIsSaving(false);
    }
  };

  const handleOpenEdit = (item, isWork = true) => {
    setIsEditing(true);
    if (isWork) {
        setCurrentId(item.id);
        setFormData({
            nameOfWork: item.name || item.Name || item.nameOfWork || '',
            natureOfWork: item.description || item.Description || item.natureOfWork || '',
            clientNameAddress: Array.isArray(item.nameAddress) ? item.nameAddress[0]?.name : (Array.isArray(item.NameAddress) ? item.NameAddress[0]?.name : (item.clientNameAddress || '')),
            contractNo: item.contractId || item.ContractId || item.contractNo || '',
            contractValue: item.value || item.Value || item.contractValue || '',
            awardDate: (item.date || item.Date) ? (item.date || item.Date).split('T')[0] : (item.awardDate || ''),
            projectId: item.projectId || ''
        });
    } else {
        // Machineries edit not fully implemented but setting state
        setFormData({ ...item });
        setCurrentId(item.id);
    }
    setIsModalOpen(true);
  };

  const tabs = [
    { id: 'work-awarded', label: 'Work Awarded (Last 7 Years)', icon: Briefcase },
    { id: 'machineries', label: 'Machineries, Tools & Plants', icon: Settings },
    { id: 'conditions', label: 'Special Conditions of Contract', icon: FileText }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const finalValue = (name === 'contractNo' || name === 'referenceId') ? value.toUpperCase() : value;
    
    if (name === 'projectId' && value) {
        const selected = projects.find(p => String(p.id) === String(value));
        if (selected) {
            setFormData(prev => ({
                ...prev,
                projectId: value,
                nameOfWork: selected.name || prev.nameOfWork,
                clientNameAddress: `${selected.client || ''} ${selected.location || ''}`.trim() || prev.clientNameAddress,
                contractValue: selected.value || prev.contractValue,
                natureOfWork: selected.category || prev.natureOfWork
            }));
            return;
        }
    }

    setFormData((prev) => ({ ...prev, [name]: finalValue }));
  };

  const handleOpenModal = () => {
    setIsEditing(false);
    setFormData({
        nameOfWork: '',
        natureOfWork: '',
        clientNameAddress: '',
        contractNo: '',
        contractValue: '',
        awardDate: '',
        projectId: ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
        if (activeTab === 'work-awarded') {
            const payload = {
                Name: formData.nameOfWork,
                Description: formData.natureOfWork,
                ContractId: formData.contractNo,
                Value: Number(formData.contractValue),
                Date: formData.awardDate,
                projectId: formData.projectId ? Number(formData.projectId) : null,
                NameAddress: [{ name: formData.clientNameAddress, address: 'N/A' }]
            };
            
            if (isEditing) {
                await tenderAPI.updateTender(currentId, payload);
                toast.success('Tender record updated');
            } else {
                await tenderAPI.createTender(payload);
                toast.success('Tender record saved');
            }
            fetchTenders();
        }
        setIsModalOpen(false);
    } catch (error) {
        console.error("Save Error:", error);
        toast.error("Failed to save record");
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Header Profile / Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tender Submissions & Annexures</h1>
          <p className="text-sm text-slate-500 mt-1">Manage standard technical and financial appendices required for e-tendering</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn px-4 py-2 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm font-medium rounded-lg flex items-center gap-2">
            <Download className="w-4 h-4" /> Export PDF
          </button>
          {activeTab !== 'conditions' && (
            <button onClick={handleOpenModal} className="btn px-4 py-2 bg-[#22c55e] text-white hover:bg-[#16a34a] shadow-sm font-medium rounded-lg flex items-center gap-2 transition-colors">
              <Plus className="w-4 h-4" /> Add Record
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto scrollbar-hide border-b border-slate-200">
        <div className="flex gap-6 min-w-max px-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-all duration-200 ${isActive
                    ? 'border-[#22c55e] text-[#15803d]'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#22c55e]' : ''}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Contents */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

        {/* WORK AWARDED TAB */}
        {activeTab === 'work-awarded' && (
          <div className="flex flex-col h-full animate-fade-in">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 w-full">
              <h3 className="font-semibold text-slate-800">Details of Work Awarded to Tenderer</h3>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search works..." className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#22c55e]" />
              </div>
            </div>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 border-r border-slate-200 text-center w-12">S.No</th>
                    <th className="px-4 py-3 border-r border-slate-200 w-48">Name Of Work</th>
                    <th className="px-4 py-3 border-r border-slate-200 min-w-[300px]">Nature of Work</th>
                    <th className="px-4 py-3 border-r border-slate-200 w-64">Client Address</th>
                    <th className="px-4 py-3 border-r border-slate-200 w-32">Contract No</th>
                    <th className="px-4 py-3 border-r border-slate-200 w-32 text-right">Value (₹)</th>
                    <th className="px-4 py-3 border-r border-slate-200">Date</th>
                    <th className="px-4 py-3 text-center w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr><td colSpan="7" className="text-center py-6"><Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-400" /></td></tr>
                  ) : works.length === 0 ? (
                    <tr><td colSpan="7" className="text-center py-6 text-slate-500">No records found. Add a new record.</td></tr>
                  ) : works.map((row, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-500 text-center border-r border-slate-100">{index + 1}</td>
                      <td className="px-4 py-3 text-slate-800 font-medium whitespace-pre-wrap border-r border-slate-100 max-w-xs uppercase tracking-tight">{row.name || row.Name || row.nameOfWork}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-pre-wrap text-[11px] leading-relaxed border-r border-slate-100 max-w-md italic">{row.description || row.Description || row.natureOfWork}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-pre-wrap text-[11px] border-r border-slate-100 max-w-sm font-bold">
                        {Array.isArray(row.nameAddress) ? row.nameAddress[0]?.name : (Array.isArray(row.NameAddress) ? row.NameAddress[0]?.name : (row.clientNameAddress || 'N/A'))}
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-mono text-[11px] border-r border-slate-100 uppercase tracking-widest font-bold">{(row.contractId || row.ContractId || row.contractNo || '').toUpperCase()}</td>
                      <td className="px-4 py-3 text-emerald-600 font-bold border-r border-slate-100 text-right">{formatCurrency(row.value || row.Value || row.contractValue)}</td>
                      <td className="px-4 py-3 text-slate-600 text-[11px] border-r border-slate-100 font-bold">{(row.date || row.Date) ? (row.date || row.Date).split('T')[0] : (row.awardDate || 'N/A')}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                           <button type="button" onClick={() => handleOpenEdit(row)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit3 className="w-4 h-4" /></button>
                           <button type="button" onClick={() => handleDelete(row)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MACHINERIES TAB */}
        {activeTab === 'machineries' && (
          <div className="flex flex-col h-full animate-fade-in w-full">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 w-full">
              <h3 className="font-semibold text-slate-800">Annexure D - Machineries & Tools</h3>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search equipment..." className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#22c55e]" />
              </div>
            </div>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 border-r border-slate-200 text-center w-12">S.No.</th>
                    <th className="px-4 py-3 border-r border-slate-200 min-w-[200px]">Description</th>
                    <th className="px-4 py-3 border-r border-slate-200 text-center w-28">Availability</th>
                    <th className="px-4 py-3 border-r border-slate-200 text-center w-28">Purchase Date</th>
                    <th className="px-4 py-3 border-r border-slate-200 text-center w-28">Drive Type</th>
                    <th className="px-4 py-3 border-r border-slate-200 text-center w-28">Condition</th>
                    <th className="px-4 py-3 border-r border-slate-200 text-center w-24">Inspected</th>
                    <th className="px-4 py-3 text-center w-24 border-r border-slate-100">Qty</th>
                    <th className="px-4 py-3 text-center w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {machineries.length === 0 ? (
                    <tr><td colSpan="8" className="text-center py-6 text-slate-500">No records found. Add a new record.</td></tr>
                  ) : machineries.map((row, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-2 font-medium text-slate-500 text-center border-r border-slate-100">{index + 1}</td>
                      <td className="px-4 py-2 text-slate-800 font-medium whitespace-pre-wrap border-r border-slate-100">{row.desc}</td>
                      <td className="px-4 py-2 text-center border-r border-slate-100">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${row.available === 'Owned' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{row.available}</span>
                      </td>
                      <td className="px-4 py-2 text-slate-600 text-center border-r border-slate-100">{row.purchaseDate}</td>
                      <td className="px-4 py-2 text-slate-600 text-center border-r border-slate-100">{row.driving}</td>
                      <td className="px-4 py-2 border-r border-slate-100 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${row.condition === 'Running' ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
                          <span className="text-slate-600 text-xs font-medium">{row.condition}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-slate-600 text-center border-r border-slate-100">{row.inspected}</td>
                      <td className="px-4 py-2 text-slate-800 font-semibold text-center border-r border-slate-100">{row.qty}</td>
                      <td className="px-4 py-2 text-center">
                        <div className="flex items-center justify-center gap-2">
                           <button type="button" onClick={() => handleOpenEdit(row, false)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                           <button type="button" onClick={() => handleDelete(row, false)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination Mock */}
            <div className="p-3 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500 w-full">
              <span>Showing 1 to {machineries.length} of {machineries.length} entries</span>
              <div className="flex space-x-1">
                <button className="px-3 py-1 bg-slate-100 rounded text-slate-400 cursor-not-allowed">Previous</button>
                <button className="px-3 py-1 bg-[#22c55e] text-white font-medium rounded">1</button>
                <button className="px-3 py-1 bg-slate-100 rounded text-slate-400 cursor-not-allowed">Next</button>
              </div>
            </div>
          </div>
        )}

        {/* CONDITIONS TAB */}
        {activeTab === 'conditions' && (
          <div className="flex flex-col h-full animate-fade-in w-full bg-white">
            {/* Unchanged Condition content */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between sticky top-0">
              <div>
                <h3 className="font-semibold text-slate-800 flex items-center gap-2"><FileText className="w-5 h-5 text-emerald-600" /> Special Condition of Contract</h3>
                <p className="text-xs text-slate-500 mt-0.5">East Central Railway / General Clauses / Annexures</p>
              </div>
            </div>
            <div className="p-6 md:px-12 md:py-8 max-w-5xl mx-auto space-y-6 text-slate-700 text-sm leading-relaxed overflow-y-auto w-full">
              <p>Conditions content placeholder (Pre-filled via static config usually)...</p>
            </div>
          </div>
        )}

      </div>

      {/* Add New Record Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
              <h2 className="text-lg font-bold text-slate-800">
                {activeTab === 'work-awarded' ? 'Add Work Awarded Record' : 'Add Machinery/Equipment'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {activeTab === 'work-awarded' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="col-span-1 md:col-span-2 space-y-1.5 leading-none mt-1">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Link to Project Master</label>
                    <div className="relative">
                        <select name="projectId" value={formData.projectId || ''} onChange={handleInputChange} className="w-full h-11 px-3 py-2 border border-slate-300 rounded-lg outline-none bg-white appearance-none pr-10 font-bold text-slate-700">
                            <option value="">-- Optional: Link to Existing Project --</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name} (ID: {p.id})</option>
                            ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div className="col-span-1 md:col-span-2 space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Name Of Work <span className="text-red-500">*</span></label>
                    <input required name="nameOfWork" value={formData.nameOfWork || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22c55e]/20 focus:border-[#22c55e] outline-none transition-all" placeholder="e.g. Electrical work in connection..." />
                  </div>

                  <div className="col-span-1 md:col-span-2 space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Nature of Work & Brief Description</label>
                    <textarea name="natureOfWork" value={formData.natureOfWork || ''} onChange={handleInputChange} rows="3" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22c55e]/20 focus:border-[#22c55e] outline-none transition-all resize-none" placeholder="Description..."></textarea>
                  </div>

                  <div className="col-span-1 md:col-span-2 space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Client Name & Address <span className="text-red-500">*</span></label>
                    <input required name="clientNameAddress" value={formData.clientNameAddress || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22c55e]/20 focus:border-[#22c55e] outline-none transition-all" placeholder="Client Dept, Address..." />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Contract No. / LOA</label>
                    <input name="contractNo" value={formData.contractNo || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22c55e]/20 focus:border-[#22c55e] outline-none transition-all font-mono text-sm" placeholder="e.g. 1084957-010" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Contract Value (₹ Lakhs) <span className="text-red-500">*</span></label>
                    <input required type="number" step="0.01" name="contractValue" value={formData.contractValue || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22c55e]/20 focus:border-[#22c55e] outline-none transition-all" placeholder="100.00" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Date of Award <span className="text-red-500">*</span></label>
                    <input required type="date" name="awardDate" value={formData.awardDate || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22c55e]/20 focus:border-[#22c55e] outline-none transition-all" />
                  </div>
                </div>
              )}

              {activeTab === 'machineries' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="col-span-1 md:col-span-2 space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Equipment Description <span className="text-red-500">*</span></label>
                    <input required name="desc" value={formData.desc || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22c55e]/20 focus:border-[#22c55e] outline-none transition-all" placeholder="e.g. Concrete Mixture" />
                  </div>

                  <div className="space-y-1.5 leading-none">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Availability <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <select required name="available" value={formData.available || 'Owned'} onChange={handleInputChange} className="w-full h-11 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22c55e]/20 focus:border-[#22c55e] outline-none transition-all bg-white appearance-none pr-10 font-bold">
                        <option value="Owned">Owned</option>
                        <option value="Hired">Hired</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Purchase Date</label>
                    <input type="date" name="purchaseDate" value={formData.purchaseDate || ''} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22c55e]/20 focus:border-[#22c55e] outline-none transition-all" />
                  </div>

                  <div className="space-y-1.5 leading-none">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Drive Type</label>
                    <div className="relative">
                        <select name="driving" value={formData.driving || '-'} onChange={handleInputChange} className="w-full h-11 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22c55e]/20 focus:border-[#22c55e] outline-none transition-all bg-white appearance-none pr-10 font-bold">
                            <option value="-">N/A</option>
                            <option value="Electrical">Electrical</option>
                            <option value="Diesel">Diesel</option>
                            <option value="Petrol">Petrol</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-1.5 leading-none">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Condition</label>
                    <div className="relative">
                        <select name="condition" value={formData.condition || 'Running'} onChange={handleInputChange} className="w-full h-11 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22c55e]/20 focus:border-[#22c55e] outline-none transition-all bg-white appearance-none pr-10 font-bold">
                            <option value="Running">Running</option>
                            <option value="Idle">Idle / Under Repair</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-1.5 leading-none">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantity <span className="text-red-500">*</span></label>
                    <input required name="qty" value={formData.qty || ''} onChange={handleInputChange} className="w-full h-11 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22c55e]/20 focus:border-[#22c55e] outline-none transition-all font-bold" placeholder="e.g. 02 Nos" />
                  </div>

                  <div className="space-y-1.5 leading-none">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Inspected by Client?</label>
                    <div className="relative">
                        <select name="inspected" value={formData.inspected || 'Yes'} onChange={handleInputChange} className="w-full h-11 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22c55e]/20 focus:border-[#22c55e] outline-none transition-all bg-white appearance-none pr-10 font-bold">
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-white">
                <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSaving} className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className="px-5 py-2.5 rounded-lg bg-[#22c55e] text-white font-medium hover:bg-[#16a34a] shadow-sm shadow-[#22c55e]/20 transition-all flex items-center gap-2">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Save Record
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
                    <h3 className="text-lg font-black text-slate-800 tracking-tight">Remove Record?</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Permanent Action</p>
                </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-8">
                Are you sure you want to remove <span className="font-black text-slate-900 underline decoration-red-200">{deleteConfirm.name}</span>? This cannot be undone.
            </p>
            <div className="flex gap-3">
                <button 
                    onClick={() => setDeleteConfirm({ show: false, id: null, name: '', isWork: true })}
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
