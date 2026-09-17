import { useState, useEffect } from 'react';
import { Search, Download, X, Loader2, Edit3, Trash2, ChevronDown, UploadCloud, CheckCircle, FileText, Eye, Calendar, Hash, Package, IndianRupee, Clock } from 'lucide-react';
import { tenderAPI } from '../services';
import { useApp } from '../../../hooks/useApp';
import toast from 'react-hot-toast';

export default function Tenders() {
  const { projects } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [works, setWorks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [uploadFlow, setUploadFlow] = useState({
    isOpen: false,
    step: 1,
    extractedData: {
      title: '',
      description: '',
      closingDate: '',
      materialQty: '',
      value: '',
      tenderId: ''
    },
    optionalFiles: []
  });

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
  const [viewTender, setViewTender] = useState(null);

  const fetchTenders = async () => {
    setIsLoading(true);
    try {
        const res = await tenderAPI.getAllTenders();
        const data = res?.data?.data || res?.data || res || [];
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

  const handleMainFileUpload = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadFlow(prev => ({ ...prev, isOpen: true, step: 2 }));
      
      // Simulate AI extraction
      setTimeout(() => {
        setUploadFlow(prev => ({
          ...prev,
          step: 3,
          extractedData: {
            title: 'Provision of Station Amenities',
            description: 'Supply and installation of modular units as per technical specifications.',
            closingDate: new Date().toISOString().split('T')[0],
            materialQty: '120 Units',
            value: '850000',
            tenderId: 'TNDR-' + Math.floor(Math.random() * 10000)
          }
        }));
      }, 2500);
      e.target.value = ''; // Reset input
    }
  };

  const handleExtractedDataChange = (e) => {
    const { name, value } = e.target;
    setUploadFlow(prev => ({
      ...prev,
      extractedData: {
        ...prev.extractedData,
        [name]: value
      }
    }));
  };

  const handleOptionalFiles = (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setUploadFlow(prev => ({
        ...prev,
        optionalFiles: [...prev.optionalFiles, ...files]
      }));
    }
    e.target.value = '';
  };

  const removeOptionalFile = (index) => {
    setUploadFlow(prev => {
      const newFiles = [...prev.optionalFiles];
      newFiles.splice(index, 1);
      return { ...prev, optionalFiles: newFiles };
    });
  };

  const handleUploadSubmit = async () => {
    setIsSaving(true);
    try {
      const payload = {
        tenderId: uploadFlow.extractedData.tenderId,
        title: uploadFlow.extractedData.title,
        description: uploadFlow.extractedData.description,
        closingDate: uploadFlow.extractedData.closingDate,
        materialQty: uploadFlow.extractedData.materialQty,
        value: Number(uploadFlow.extractedData.value),
        status: 'Active',
        optionalFilesUrl: uploadFlow.optionalFiles.map(f => f.name).join(', ')
      };
      await tenderAPI.createTender(payload);
      toast.success('Tender and documents uploaded successfully');
      setUploadFlow({ isOpen: false, step: 1, extractedData: {}, optionalFiles: [] });
      fetchTenders();
    } catch (error) {
      console.error(error);
      toast.error('Failed to submit tender');
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
                tenderId: formData.contractNo,
                title: formData.nameOfWork,
                description: formData.natureOfWork,
                closingDate: formData.awardDate,
                materialQty: '',
                value: Number(formData.contractValue),
                status: 'Active',
                optionalFilesUrl: ''
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

        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-white p-8 rounded-xl border-2 border-dashed border-slate-300 shadow-sm flex flex-col items-center justify-center hover:bg-slate-50 transition-colors">
        <input type="file" id="tender-upload" className="hidden" accept=".pdf" onChange={handleMainFileUpload} />
        <label htmlFor="tender-upload" className="cursor-pointer flex flex-col items-center justify-center space-y-3">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full hover:scale-105 transition-transform duration-300">
            <UploadCloud className="w-8 h-8" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700">Click to upload tender document (PDF) to auto-extract data</p>
            <p className="text-xs text-slate-500 mt-1">PDF only (Max 10MB)</p>
          </div>
        </label>
      </div>

      {/* Tender Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 w-full">
          <h3 className="font-semibold text-slate-800">Tender Records</h3>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search tenders..." className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#22c55e]" />
          </div>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 border-r border-slate-200 text-center w-12">S.No</th>
                <th className="px-4 py-3 border-r border-slate-200 w-32">Tender ID</th>
                <th className="px-4 py-3 border-r border-slate-200 w-48">Title</th>
                <th className="px-4 py-3 border-r border-slate-200 min-w-[200px]">Description</th>
                <th className="px-4 py-3 border-r border-slate-200">Date</th>
                <th className="px-4 py-3 border-r border-slate-200 w-32 text-right">Value (₹)</th>
                <th className="px-4 py-3 border-r border-slate-200 text-center w-24">Status</th>
                <th className="px-4 py-3 text-center w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan="8" className="text-center py-6"><Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-400" /></td></tr>
              ) : works.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-6 text-slate-500">No records found.</td></tr>
              ) : works.map((row, index) => (
                <tr key={index} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-500 text-center border-r border-slate-100">{index + 1}</td>
                  <td className="px-4 py-3 text-slate-700 font-mono text-[11px] border-r border-slate-100 uppercase tracking-widest font-bold">{(row.tenderId || row.contractId || row.ContractId || row.contractNo || '').toUpperCase()}</td>
                  <td className="px-4 py-3 text-slate-800 font-medium whitespace-pre-wrap border-r border-slate-100 max-w-xs uppercase tracking-tight">{row.title || row.name || row.Name || row.nameOfWork}</td>
                  <td className="px-4 py-3 text-slate-600 whitespace-pre-wrap text-[11px] leading-relaxed border-r border-slate-100 max-w-md italic">{row.description || row.Description || row.natureOfWork}</td>
                  <td className="px-4 py-3 text-slate-600 text-[11px] border-r border-slate-100 font-bold">{(row.closingDate || row.date || row.Date) ? (row.closingDate || row.date || row.Date).split('T')[0] : (row.awardDate || 'N/A')}</td>
                  <td className="px-4 py-3 text-emerald-600 font-bold border-r border-slate-100 text-right">{formatCurrency(row.value || row.Value || row.contractValue)}</td>
                  <td className="px-4 py-3 border-r border-slate-100 text-center">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-wide">{row.status || 'Active'}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button type="button" onClick={() => setViewTender(row)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="View Details"><Eye className="w-4 h-4" /></button>
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

      {/* Tender Detail Modal */}
      {viewTender && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setViewTender(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-5 flex items-start justify-between">
              <div>
                <p className="text-emerald-100 text-[11px] font-semibold uppercase tracking-widest mb-1">Tender Details</p>
                <h2 className="text-white text-lg font-bold leading-snug">{viewTender.title || viewTender.nameOfWork || 'N/A'}</h2>
                <span className="mt-2 inline-block px-2.5 py-0.5 bg-white/20 text-white text-[11px] font-bold rounded-full uppercase tracking-wide">
                  {viewTender.status || 'Active'}
                </span>
              </div>
              <button onClick={() => setViewTender(null)} className="text-white/70 hover:text-white transition-colors mt-0.5">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Tender ID */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="p-2 bg-slate-200 rounded-lg">
                  <Hash className="w-4 h-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tender ID</p>
                  <p className="text-sm font-bold text-slate-800 font-mono tracking-widest uppercase">
                    {(viewTender.tenderId || viewTender.contractId || viewTender.contractNo || '—').toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Description */}
              {(viewTender.description || viewTender.natureOfWork) && (
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="p-2 bg-slate-200 rounded-lg mt-0.5">
                    <FileText className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</p>
                    <p className="text-sm text-slate-700 leading-relaxed mt-0.5">{viewTender.description || viewTender.natureOfWork}</p>
                  </div>
                </div>
              )}

              {/* Two-column grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Closing Date */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Closing Date</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {(viewTender.closingDate || viewTender.awardDate || viewTender.date)
                        ? (viewTender.closingDate || viewTender.awardDate || viewTender.date).split('T')[0]
                        : '—'}
                    </p>
                  </div>
                </div>

                {/* Value */}
                <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <IndianRupee className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Value</p>
                    <p className="text-sm font-bold text-emerald-700">
                      {formatCurrency(viewTender.value || viewTender.contractValue || 0)}
                    </p>
                  </div>
                </div>

                {/* Material Qty */}
                {viewTender.materialQty && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Package className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Material / Qty</p>
                      <p className="text-sm font-semibold text-slate-800">{viewTender.materialQty}</p>
                    </div>
                  </div>
                )}

                {/* Created At */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="p-2 bg-slate-200 rounded-lg">
                    <Clock className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Created</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {viewTender.createdAt ? new Date(viewTender.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Optional Files */}
              {viewTender.optionalFilesUrl && (
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Attached Files</p>
                  <p className="text-sm text-slate-600 break-all">{viewTender.optionalFilesUrl || '—'}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button onClick={() => { setViewTender(null); handleOpenEdit(viewTender); }} className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 bg-white hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
              <button onClick={() => setViewTender(null)} className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Upload Flow Modal */}
      {uploadFlow.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            
            {uploadFlow.step === 2 && (
              <div className="p-12 flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-slate-100 border-t-[#22c55e] rounded-full animate-spin"></div>
                  <FileText className="w-6 h-6 text-slate-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-bold text-slate-800">Extracting Tender Data...</h3>
                  <p className="text-sm text-slate-500">Our AI is analyzing the PDF to extract key information.</p>
                </div>
              </div>
            )}

            {uploadFlow.step === 3 && (
              <>
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-500" /> Extracted Data
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">Review and edit the extracted tender details</p>
                  </div>
                  <button onClick={() => setUploadFlow({ isOpen: false, step: 1, extractedData: {}, optionalFiles: [] })} className="text-slate-400 hover:text-slate-700 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Tender ID</label>
                      <input name="tenderId" value={uploadFlow.extractedData.tenderId} onChange={handleExtractedDataChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22c55e]/20 focus:border-[#22c55e] outline-none transition-all font-mono" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Closing Date</label>
                      <input type="date" name="closingDate" value={uploadFlow.extractedData.closingDate} onChange={handleExtractedDataChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22c55e]/20 focus:border-[#22c55e] outline-none transition-all" />
                    </div>
                    <div className="col-span-1 md:col-span-2 space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Tender Title</label>
                      <input name="title" value={uploadFlow.extractedData.title} onChange={handleExtractedDataChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22c55e]/20 focus:border-[#22c55e] outline-none transition-all font-semibold text-slate-800" />
                    </div>
                    <div className="col-span-1 md:col-span-2 space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Description</label>
                      <textarea name="description" value={uploadFlow.extractedData.description} onChange={handleExtractedDataChange} rows="3" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22c55e]/20 focus:border-[#22c55e] outline-none transition-all resize-none"></textarea>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Material / Items Qty</label>
                      <input name="materialQty" value={uploadFlow.extractedData.materialQty} onChange={handleExtractedDataChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22c55e]/20 focus:border-[#22c55e] outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Estimated Value (₹)</label>
                      <input type="number" name="value" value={uploadFlow.extractedData.value} onChange={handleExtractedDataChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22c55e]/20 focus:border-[#22c55e] outline-none transition-all" />
                    </div>
                  </div>
                </div>
                <div className="pt-4 pb-6 px-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                   <button type="button" onClick={() => setUploadFlow({ isOpen: false, step: 1, extractedData: {}, optionalFiles: [] })} className="px-5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-50 transition-colors">
                     Cancel
                   </button>
                   <button type="button" onClick={() => setUploadFlow(prev => ({ ...prev, step: 4 }))} className="px-5 py-2.5 rounded-lg bg-[#22c55e] text-white font-medium hover:bg-[#16a34a] shadow-sm transition-all">
                     Next Step
                   </button>
                </div>
              </>
            )}

            {uploadFlow.step === 4 && (
              <>
                 <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Upload Additional Documents</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Attach supporting PDFs (Optional)</p>
                  </div>
                  <button onClick={() => setUploadFlow({ isOpen: false, step: 1, extractedData: {}, optionalFiles: [] })} className="text-slate-400 hover:text-slate-700 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                   <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors relative">
                      <input type="file" multiple accept=".pdf" onChange={handleOptionalFiles} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      <UploadCloud className="w-8 h-8 text-slate-400 mb-3" />
                      <p className="text-sm font-semibold text-slate-700">Click or drag multiple PDFs here</p>
                   </div>
                   
                   {uploadFlow.optionalFiles.length > 0 && (
                     <div className="space-y-3 mt-6">
                        <h4 className="text-sm font-semibold text-slate-700">Selected Files ({uploadFlow.optionalFiles.length})</h4>
                        <div className="space-y-2">
                           {uploadFlow.optionalFiles.map((file, idx) => (
                             <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                                <div className="flex items-center gap-3 overflow-hidden">
                                   <FileText className="w-5 h-5 text-red-500 shrink-0" />
                                   <span className="text-sm text-slate-700 truncate">{file.name}</span>
                                </div>
                                <button type="button" onClick={() => removeOptionalFile(idx)} className="p-1 text-slate-400 hover:text-red-500 transition-colors rounded-md hover:bg-red-50">
                                   <X className="w-4 h-4" />
                                </button>
                             </div>
                           ))}
                        </div>
                     </div>
                   )}
                </div>
                <div className="pt-4 pb-6 px-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                   <button type="button" onClick={() => setUploadFlow(prev => ({ ...prev, step: 3 }))} className="px-5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-50 transition-colors">
                     Back
                   </button>
                   <button type="button" onClick={handleUploadSubmit} disabled={isSaving} className="px-5 py-2.5 rounded-lg bg-[#22c55e] text-white font-medium hover:bg-[#16a34a] shadow-sm transition-all flex items-center gap-2">
                     {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                     Submit Tender
                   </button>
                </div>
              </>
            )}

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
