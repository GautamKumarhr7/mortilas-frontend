import React, { useRef, useState } from 'react';
import { 
    ArrowLeft, Printer, Download, Share2, 
    Building2, FileText, Landmark, Loader2
} from 'lucide-react';
import { useApp } from '../../../hooks/useApp';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';

export default function InvoiceDetail() {
    const { setActiveModule, selectedInvoice } = useApp();
    const invoiceRef = useRef();
    const [isExporting, setIsExporting] = useState(false);

    const handleDownloadPDF = async () => {
        if (!invoiceRef.current) return;
        
        setIsExporting(true);
        const toastId = toast.loading('Generating PDF document...');
        
        try {
            const canvas = await html2canvas(invoiceRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });
            
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });
            
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`Invoice_${invoice.id}_${new Date().getTime()}.pdf`);
            
            toast.success('Invoice downloaded successfully!', { id: toastId });
        } catch (error) {
            console.error('PDF Generation Error:', error);
            toast.error('Failed to generate PDF. Please try again.', { id: toastId });
        } finally {
            setIsExporting(false);
        }
    };

    // Default static data for fields not present in the simple invoice model
    const defaultData = {
        dueDate: selectedInvoice?.date ? new Date(new Date(selectedInvoice.date).getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : '2025-03-25',
        client: {
            name: selectedInvoice?.clientOrProject || 'Larsen & Toubro Ltd.',
            address: 'Construction Division, Mount Poonamallee Road, Manapakkam, Chennai - 600089',
            gstin: '33AAACL0123A1Z2',
            email: 'billing@lntecc.com'
        },
        company: {
            name: 'EcoConstruct Infrastructure',
            address: '12th Floor, Maurya Tower, Gandhi Maidan, Patna - 800001',
            gstin: '10AAAFE3321R1Z5',
            bank: 'SBI Main Branch, Patna',
            ifsc: 'SBIN0000001',
            account: '33445566778'
        },
        items: [
            { desc: selectedInvoice?.type || 'PSC Pole Erection - 9Mtr', qty: 1, rate: selectedInvoice?.amount || 3379500, total: selectedInvoice?.amount || 3379500 },
        ]
    };

    const invoice = selectedInvoice ? {
        id: selectedInvoice.invoiceId,
        date: selectedInvoice.date,
        status: selectedInvoice.status,
        ...defaultData,
        subTotal: selectedInvoice.amount,
        gstRate: selectedInvoice.gst || 18,
        gstAmount: (selectedInvoice.amount * (selectedInvoice.gst || 18)) / 100,
        retentionRate: selectedInvoice.retention || 5,
        retentionAmount: (selectedInvoice.amount * (selectedInvoice.retention || 5)) / 100,
        totalAmount: selectedInvoice.amount + ((selectedInvoice.amount * (selectedInvoice.gst || 18)) / 100) - ((selectedInvoice.amount * (selectedInvoice.retention || 5)) / 100)
    } : {
        id: 'INV-2025-001',
        date: '2025-03-10',
        dueDate: '2025-03-25',
        status: 'Pending',
        client: defaultData.client,
        company: defaultData.company,
        items: [
            { desc: 'PSC Pole Erection - 9Mtr', qty: 450, rate: 2450, total: 1102500 },
            { desc: 'ABC Cable Installation - 50Sqmm', qty: 12, rate: 85000, total: 1020000 },
            { desc: 'Earthing Set Supply', qty: 85, rate: 4200, total: 357000 },
            { desc: 'Transformer Foundation Work', qty: 2, rate: 450000, total: 900000 },
        ],
        subTotal: 3379500,
        gstRate: 18,
        gstAmount: 608310,
        retentionRate: 5,
        retentionAmount: 168975,
        totalAmount: 3818835
    };

    return (
        <div className="space-y-6 animate-fade-in relative pb-10">
            {/* Top Bar Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setActiveModule('invoicing')}
                        className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">{invoice.id || 'INV-000'}</h1>
                        <p className="text-sm text-slate-500 flex items-center gap-2">
                            Tax Invoice · <span className={`badge ${invoice.status === 'Paid' ? 'badge-green' : 'badge-yellow'}`}>{invoice.status}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="btn-secondary flex items-center gap-2">
                        <Share2 className="w-4 h-4" /> Share
                    </button>
                    <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2">
                        <Printer className="w-4 h-4" /> Print
                    </button>
                    <button 
                        onClick={handleDownloadPDF} 
                        disabled={isExporting}
                        className="btn-primary flex items-center gap-2"
                    >
                        {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        {isExporting ? 'Exporting...' : 'Download PDF'}
                    </button>
                </div>
            </div>

            {/* The Actual Invoice "Paper" */}
            <div ref={invoiceRef} className="max-w-4xl mx-auto card overflow-hidden relative bg-white">
                {/* Watermark/Accent */}
                <div className="absolute top-10 right-10 opacity-5 pointer-events-none">
                    <FileText className="w-64 h-64 text-slate-400" />
                </div>

                {/* Header Section */}
                <div className="p-8 md:p-12 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex flex-col md:flex-row justify-between gap-8">
                        <div className="space-y-4">
                            <div className="w-12 h-12 bg-[#2f6645] rounded-xl flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">{invoice.company.name}</h2>
                                <p className="text-sm text-slate-500 mt-1 max-w-xs">{invoice.company.address}</p>
                                <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-400">GSTIN</p>
                                        <p className="text-sm font-medium text-slate-700">{invoice.company.gstin}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-400">PAN</p>
                                        <p className="text-sm font-medium text-slate-700">AAAFE3321R</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="text-left md:text-right space-y-4">
                            <h1 className="text-3xl font-bold text-slate-300 uppercase tracking-wider">Tax Invoice</h1>
                            <div>
                                <p className="text-xs font-semibold text-slate-400">RA Bill Number</p>
                                <p className="text-lg font-semibold text-slate-800">{invoice.id}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-8 text-left md:text-right">
                                <div>
                                    <p className="text-xs font-semibold text-slate-400">Invoice Date</p>
                                    <p className="text-sm font-medium text-slate-800">{invoice.date}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-400">Due Date</p>
                                    <p className="text-sm font-medium text-slate-800">{invoice.dueDate}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bill To Section */}
                <div className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Billed To</p>
                        <h3 className="text-lg font-semibold text-slate-800">{invoice.client.name}</h3>
                        <p className="text-sm text-slate-600 max-w-xs">{invoice.client.address}</p>
                        <div className="flex items-center gap-8 pt-3">
                            <div>
                                <p className="text-xs font-semibold text-slate-400">GSTIN</p>
                                <p className="text-sm font-medium text-slate-700">{invoice.client.gstin}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-400">Email</p>
                                <p className="text-sm font-medium text-slate-700">{invoice.client.email}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Line Items Table */}
                <div className="px-8 md:px-12 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-t border-slate-200 bg-slate-50/50">
                            <tr>
                                <th className="py-3 px-4 font-semibold text-slate-600">Description of Service</th>
                                <th className="py-3 px-4 font-semibold text-slate-600 text-center w-24">Qty</th>
                                <th className="py-3 px-4 font-semibold text-slate-600 text-right w-32">Unit Rate</th>
                                <th className="py-3 px-4 font-semibold text-slate-600 text-right w-40">Total Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {invoice.items.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 px-4">
                                        <p className="font-medium text-slate-800">{item.desc}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">SAC Code: 99542</p>
                                    </td>
                                    <td className="py-4 px-4 text-center text-slate-600">{item.qty}</td>
                                    <td className="py-4 px-4 text-right text-slate-600">₹{item.rate.toLocaleString()}</td>
                                    <td className="py-4 px-4 text-right font-semibold text-slate-800">₹{item.total.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals Section */}
                <div className="p-8 md:p-12 mb-8 border-t border-slate-100">
                    <div className="flex flex-col md:flex-row justify-between gap-8">
                        <div className="flex-1 space-y-6">
                            <div className="p-5 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
                                <p className="text-xs font-semibold text-slate-600 flex items-center gap-2">
                                    <Landmark className="w-4 h-4 text-[#2f6645]" /> Bank Settlement Details
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-medium text-slate-500">Account Holder</p>
                                        <p className="text-sm font-semibold text-slate-800">{invoice.company.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-slate-500">Account Number</p>
                                        <p className="text-sm font-semibold text-slate-800 tracking-wide">{invoice.company.account}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-slate-500">IFSC Code</p>
                                        <p className="text-sm font-semibold text-slate-800">{invoice.company.ifsc}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-slate-500">Bank Name</p>
                                        <p className="text-sm font-semibold text-slate-800">{invoice.company.bank}</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500 mb-1">Amount in Words:</p>
                                <p className="text-sm font-semibold text-slate-700 capitalize">Thirty Eight Lakh Eighteen Thousand Eight Hundred and Thirty Five Rupees Only</p>
                            </div>
                        </div>

                        <div className="w-full md:w-80 space-y-3">
                            <div className="flex justify-between items-center text-sm text-slate-600 px-4">
                                <span>Subtotal</span>
                                <span className="font-semibold text-slate-800">₹{invoice.subTotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm text-slate-600 px-4">
                                <span>GST (18%)</span>
                                <span className="font-semibold text-slate-800">₹{invoice.gstAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm text-red-600 bg-red-50 p-2 px-4 rounded-lg">
                                <span>Retention (5%)</span>
                                <span className="font-semibold">-₹{invoice.retentionAmount.toLocaleString()}</span>
                            </div>
                            <div className="pt-4 mt-2 border-t border-slate-200">
                                <div className="flex justify-between items-center px-4">
                                    <span className="text-sm font-bold text-slate-800">Total Payable</span>
                                    <span className="text-2xl font-bold text-emerald-600">₹{invoice.totalAmount.toLocaleString()}</span>
                                </div>
                                <p className="text-right text-xs text-slate-400 mt-1 px-4">Taxes Included</p>
                            </div>
                            <div className="pt-8 px-4 mt-4">
                                <div className="border-b-2 border-slate-200 w-40 ml-auto" />
                                <p className="text-xs font-semibold text-slate-500 text-center ml-auto w-40 mt-2">Authorized Signatory</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Note */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs text-center text-slate-500 font-medium">
                    This is a system generated invoice. No physical signature is required.
                </div>
            </div>
        </div>
    );
}
