import React from 'react';
import { Layers, ShieldCheck, AlertTriangle, IndianRupee } from 'lucide-react';

export default function BOQStats({ totalItems, reconciled, overIssued, totalValue }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4 flex flex-col justify-center">
                <div className="flex items-center justify-between">
                    <p className="text-slate-500 text-sm font-medium">Total Items</p>
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Layers className="w-4 h-4" />
                    </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mt-2">{totalItems}</h3>
                <p className="text-xs text-slate-400 mt-1">Total BOQ Entries</p>
            </div>

            <div className="card p-4 flex flex-col justify-center">
                <div className="flex items-center justify-between">
                    <p className="text-slate-500 text-sm font-medium">Reconciled</p>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <ShieldCheck className="w-4 h-4" />
                    </div>
                </div>
                <h3 className="text-2xl font-bold text-emerald-600 mt-2">{reconciled}</h3>
                <p className="text-xs text-slate-400 mt-1">Within Variance Limit</p>
            </div>

            <div className="card p-4 flex flex-col justify-center">
                <div className="flex items-center justify-between">
                    <p className="text-slate-500 text-sm font-medium">Over Issued</p>
                    <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4" />
                    </div>
                </div>
                <h3 className="text-2xl font-bold text-red-600 mt-2">{overIssued}</h3>
                <p className="text-xs text-slate-400 mt-1">High Variance Items</p>
            </div>

            <div className="card p-4 flex flex-col justify-center">
                <div className="flex items-center justify-between">
                    <p className="text-slate-500 text-sm font-medium">Certified Value</p>
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                        <IndianRupee className="w-4 h-4" />
                    </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mt-2">₹{totalValue}L</h3>
                <p className="text-xs text-slate-400 mt-1">Total PO Value</p>
            </div>
        </div>
    );
}
