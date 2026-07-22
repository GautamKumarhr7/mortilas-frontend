import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, FileText, CheckCircle2, TrendingUp, 
  Plus, Search, Filter, Loader2, PackageOpen, Truck,
  AlertCircle, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import Skeleton from '../../../components/common/Skeleton';
import { useApp } from '../../../hooks/useApp';
import IndentModal from '../components/procurement/IndentModal';
import POModal from '../components/procurement/POModal';
import { materialIndentAPI, purchaseOrderAPI } from '../services';
import { vendorAPI } from '../../business/services';

export default function Procurement() {
  const { projects } = useApp();
  const [activeTab, setActiveTab] = useState('Indents');
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Modals
  const [isIndentModalOpen, setIsIndentModalOpen] = useState(false);
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [isVendorComparisonOpen, setIsVendorComparisonOpen] = useState(false);

  // Data
  const [indents, setIndents] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [vendorsMap, setVendorsMap] = useState({});

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [iRes, pRes, vRes] = await Promise.all([
        materialIndentAPI.getAllMaterialIndents().catch(() => ({ data: [] })),
        purchaseOrderAPI.getAllPurchaseOrders().catch(() => ({ data: [] })),
        vendorAPI.getAllVendors().catch(() => ({ data: [] }))
      ]);
      setIndents(Array.isArray(iRes) ? iRes : (iRes?.data || []));
      setPurchaseOrders(Array.isArray(pRes) ? pRes : (pRes?.data || []));
      
      const vArray = Array.isArray(vRes) ? vRes : (vRes?.data || []);
      const vMap = {};
      vArray.forEach(v => {
          const actualVendor = v.vendor || v;
          vMap[actualVendor.id || actualVendor._id] = actualVendor.companyName || actualVendor.name || actualVendor.vendorName || `Vendor #${actualVendor.id || actualVendor._id}`;
      });
      setVendorsMap(vMap);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleIndentSaved = () => {
    fetchData();
  };

  const handlePOSaved = () => {
    fetchData();
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-[#2f6645]" /> Procurement Pipeline
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Manage indents, purchase orders, and GRNs</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button onClick={() => setIsVendorComparisonOpen(true)} className="btn-secondary flex items-center gap-2 whitespace-nowrap">
            <TrendingUp className="w-4 h-4" /> Vendor Compare
          </button>
          <button onClick={() => setIsPOModalOpen(true)} className="btn-secondary flex items-center gap-2 whitespace-nowrap">
            <FileText className="w-4 h-4" /> Create PO
          </button>
          <button onClick={() => setIsIndentModalOpen(true)} className="btn-primary flex items-center gap-2 whitespace-nowrap">
            <Plus className="w-4 h-4" /> Raise Indent
          </button>
        </div>
      </div>

      {/* Stats Pipeline */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Pending Indents</p>
            <p className="text-xl font-black text-slate-800 mt-0.5">12</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Active POs</p>
            <p className="text-xl font-black text-slate-800 mt-0.5">8</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">In Transit</p>
            <p className="text-xl font-black text-slate-800 mt-0.5">5</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <PackageOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Pending GRN</p>
            <p className="text-xl font-black text-slate-800 mt-0.5">3</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card overflow-hidden">
        <div className="border-b border-slate-200 px-4 flex gap-6">
          {['Indents', 'Purchase Orders', 'GRNs & Deliveries'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === tab ? 'border-[#2f6645] text-[#2f6645]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        
        <div className="p-4 flex items-center gap-4 border-b border-slate-100 bg-slate-50">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder={`Search ${activeTab.toLowerCase()}...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2f6645]/20 focus:border-[#2f6645]"
            />
          </div>
        </div>

        <div className="p-0">
          {activeTab === 'Indents' && (
             indents.length === 0 ? (
               <div className="p-10 text-center text-slate-500 flex flex-col items-center justify-center">
                  <FileText className="w-12 h-12 text-slate-200 mb-3" />
                  <p className="font-bold text-slate-700">No Material Indents Found</p>
                  <p className="text-sm mt-1">Create a new indent from a Work Order to get started.</p>
                  <button onClick={() => setIsIndentModalOpen(true)} className="btn-primary mt-4">Raise Indent</button>
               </div>
             ) : (
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
                       <th className="p-4">Indent No</th>
                       <th className="p-4">Date</th>
                       <th className="p-4">Work Order ID</th>
                       <th className="p-4">Status</th>
                     </tr>
                   </thead>
                   <tbody>
                     {indents.map((indent) => (
                       <tr key={indent.id || indent._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                         <td className="p-4 font-bold text-slate-800">{indent.indentNo || `IND-${indent.id}`}</td>
                         <td className="p-4 text-sm text-slate-600">{new Date(indent.createdAt || indent.date).toLocaleDateString()}</td>
                         <td className="p-4 text-sm text-slate-600">{indent.workOrderId}</td>
                         <td className="p-4">
                           <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-md">
                             {indent.status || 'Pending'}
                           </span>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             )
          )}
          {activeTab === 'Purchase Orders' && (
             purchaseOrders.length === 0 ? (
               <div className="p-10 text-center text-slate-500 flex flex-col items-center justify-center">
                  <ShoppingCart className="w-12 h-12 text-slate-200 mb-3" />
                  <p className="font-bold text-slate-700">No Purchase Orders Found</p>
                  <p className="text-sm mt-1">Convert approved indents into Purchase Orders.</p>
                  <button onClick={() => setIsPOModalOpen(true)} className="btn-primary mt-4">Create PO</button>
               </div>
             ) : (
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
                       <th className="p-4">PO No</th>
                       <th className="p-4">Date</th>
                       <th className="p-4">Vendor ID</th>
                       <th className="p-4">Total Value</th>
                       <th className="p-4">Status</th>
                     </tr>
                   </thead>
                   <tbody>
                     {purchaseOrders.map((po) => (
                       <tr key={po.id || po._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                         <td className="p-4 font-bold text-slate-800">{po.poNo || `PO-${po.id}`}</td>
                         <td className="p-4 text-sm text-slate-600">{new Date(po.createdAt || po.date).toLocaleDateString()}</td>
                         <td className="p-4 text-sm text-slate-600">{vendorsMap[po.vendorId] || po.vendorId}</td>
                         <td className="p-4 font-bold text-[#2f6645]">₹ {Number(po.totalValue || 0).toLocaleString()}</td>
                         <td className="p-4">
                           <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-md">
                             {po.status || 'Draft'}
                           </span>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             )
          )}
        </div>
      </div>

      <IndentModal isOpen={isIndentModalOpen} onClose={() => setIsIndentModalOpen(false)} onSave={handleIndentSaved} />
      <POModal isOpen={isPOModalOpen} onClose={() => setIsPOModalOpen(false)} onSave={handlePOSaved} />

    </div>
  );
}
