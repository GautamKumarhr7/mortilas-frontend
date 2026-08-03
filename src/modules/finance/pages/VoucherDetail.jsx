import { useState, useEffect } from 'react';
import { ArrowLeft, Download, Loader2, Building2 } from 'lucide-react';
import { useApp } from '../../../hooks/useApp';
import { calculateInvoiceData, downloadInvoice } from '../../../utils/invoice';
import { partyAPI } from '../services';
import { inventoryAPI } from '../../operations/services';

export default function VoucherDetail() {
    const { setActiveModule, selectedVoucher } = useApp();
    const [party, setParty] = useState(null);
    const [material, setMaterial] = useState(null);
    const [invoiceData, setInvoiceData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!selectedVoucher) {
            setActiveModule('vouchers');
            return;
        }

        const loadDetails = async () => {
            setIsLoading(true);
            try {
                let p = null, m = null;
                if (selectedVoucher.partyId) {
                    const pRes = await partyAPI.getAllParties();
                    let pList = Array.isArray(pRes) ? pRes : pRes?.data?.parties || pRes?.parties || pRes?.data?.vendors || pRes?.vendors || pRes?.data || [];
                    if (!Array.isArray(pList)) pList = [];
                    p = pList.find(x => String(x.id) === String(selectedVoucher.partyId) || String(x._id) === String(selectedVoucher.partyId)) || null;
                }
                if (selectedVoucher.materialId) {
                    const mRes = await inventoryAPI.getAllMaterials();
                    let mList = Array.isArray(mRes) ? mRes : mRes?.data?.materials || mRes?.materials || mRes?.data || [];
                    if (!Array.isArray(mList)) mList = [];
                    m = mList.find(x => String(x.id) === String(selectedVoucher.materialId) || String(x._id) === String(selectedVoucher.materialId)) || null;
                }
                setParty(p);
                setMaterial(m);

                const year = new Date(selectedVoucher.date).getFullYear();
                const nextShortYear = String(year + 1).slice(2);
                const invoiceNo = selectedVoucher.invoiceNo || `RK/${year}-${nextShortYear}/${String(selectedVoucher.id).padStart(4, '0')}`;
                
                const data = calculateInvoiceData(selectedVoucher, p, m, invoiceNo);
                setInvoiceData(data);
            } catch (error) {
                console.error("Failed to load details", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadDetails();
    }, [selectedVoucher, setActiveModule]);

    const handleDownload = () => {
        if (!selectedVoucher) return;
        downloadInvoice(selectedVoucher, party, material);
    };

    if (!selectedVoucher) return null;

    return (
        <div className="space-y-6 animate-fade-in pb-20 relative min-h-screen flex flex-col">
            {/* Top Bar Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 shrink-0">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setActiveModule('vouchers')}
                        className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-800 transition-all shadow-sm group hover:border-blue-400"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-xl font-bold text-slate-900 leading-none">Voucher #{selectedVoucher.id}</h1>
                            <span className="badge badge-blue text-[9px] px-2 py-0.5">{selectedVoucher.type}</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                             Invoice Detail View
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={handleDownload} disabled={isLoading} className="btn-primary bg-blue-600 hover:bg-blue-700 h-11 px-6 text-xs flex items-center gap-2">
                        <Download className="w-4 h-4" /> Download HTML Invoice
                    </button>
                </div>
            </div>

            {/* Native Invoice UI */}
            <div className="flex-1 rounded-2xl border border-slate-200 shadow-xl bg-white p-8 md:p-12 max-w-4xl mx-auto w-full relative">
                {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10 rounded-2xl">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                ) : invoiceData && (
                    <div className="space-y-8 text-sm text-slate-800">
                        {/* Header */}
                        <div className="flex items-start justify-between border-b border-slate-200 pb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
                                    <Building2 className="w-8 h-8 text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Morlatis Engineering And Construction Pvt Ltd</h2>
                                    <p className="text-slate-500 text-xs mt-1">01, Ramanad Nagar, Keshonaryanpur, Gram<br />Panchayat Office, Keshonaryanpur, Bond Dih<br />Dakhli, Samastipur, Bihar, 848504</p>
                                    <p className="text-slate-500 text-xs mt-1"><span className="font-semibold text-slate-700">GSTIN/UIN:</span> 10AAMCM1665L2ZC</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <h1 className="text-3xl font-black text-slate-200 uppercase tracking-widest">TAX INVOICE</h1>
                                <div className="mt-4 space-y-1 text-sm">
                                    <p><span className="text-slate-400 font-medium">Invoice No:</span> <span className="font-bold">{invoiceData.invoiceNo}</span></p>
                                    <p><span className="text-slate-400 font-medium">Date:</span> <span className="font-bold">{invoiceData.dateStr}</span></p>
                                </div>
                            </div>
                        </div>

                        {/* Parties */}
                        <div className="grid grid-cols-2 gap-8 py-4 border-b border-slate-200">
                            <div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Consignee (Ship To)</h3>
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="font-bold text-slate-900 text-base">{invoiceData.partyName}</p>
                                    <p className="text-slate-500 mt-1 whitespace-pre-wrap">{invoiceData.partyAddr}</p>
                                    {invoiceData.partyGSTIN && <p className="text-slate-500 mt-2 text-xs"><span className="font-semibold">GSTIN:</span> {invoiceData.partyGSTIN}</p>}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Buyer (Bill To)</h3>
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="font-bold text-slate-900 text-base">{invoiceData.partyName}</p>
                                    <p className="text-slate-500 mt-1 whitespace-pre-wrap">{invoiceData.partyAddr}</p>
                                    {invoiceData.partyGSTIN && <p className="text-slate-500 mt-2 text-xs"><span className="font-semibold">GSTIN:</span> {invoiceData.partyGSTIN}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div>
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b-2 border-slate-200">
                                        <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                                        <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">HSN/SAC</th>
                                        <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Qty</th>
                                        <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Rate</th>
                                        <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-slate-100 group hover:bg-slate-50">
                                        <td className="py-4 px-4 font-bold text-slate-900">{invoiceData.materialDesc}</td>
                                        <td className="py-4 px-4 text-center text-slate-500">{invoiceData.hsn}</td>
                                        <td className="py-4 px-4 text-right font-medium">{invoiceData.qty} Nos</td>
                                        <td className="py-4 px-4 text-right font-medium text-slate-600">₹{invoiceData.rate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td className="py-4 px-4 text-right font-bold text-slate-900">₹{invoiceData.baseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    </tr>
                                    {/* Taxes */}
                                    <tr className="border-b border-slate-50">
                                        <td className="py-3 px-4 text-right text-slate-500 italic" colSpan={4}>CGST @ {invoiceData.cgstRate}%</td>
                                        <td className="py-3 px-4 text-right font-medium text-slate-700">₹{invoiceData.cgstAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    </tr>
                                    <tr className="border-b border-slate-100">
                                        <td className="py-3 px-4 text-right text-slate-500 italic" colSpan={4}>SGST @ {invoiceData.sgstRate}%</td>
                                        <td className="py-3 px-4 text-right font-medium text-slate-700">₹{invoiceData.sgstAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    </tr>
                                    {/* Total */}
                                    <tr className="bg-slate-50">
                                        <td className="py-4 px-4 text-right font-black text-slate-900 uppercase tracking-widest" colSpan={4}>Grand Total</td>
                                        <td className="py-4 px-4 text-right font-black text-xl text-blue-600">₹{invoiceData.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Words */}
                        <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Amount Chargeable (in words)</p>
                            <p className="font-bold text-blue-900 italic">{invoiceData.grandWords}</p>
                        </div>

                        {/* Signatures */}
                        <div className="flex justify-between items-end pt-12 pb-4">
                            <div className="text-center w-64">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-200 pt-2">Customer Signature</p>
                            </div>
                            <div className="text-center w-64">
                                <p className="font-bold text-slate-800 text-xs mb-8">for Morlatis Engineering And Construction Pvt Ltd</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-200 pt-2">Authorised Signatory</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
