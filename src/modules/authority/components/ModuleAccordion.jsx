import React from 'react';
import { Shield, ChevronDown, ChevronUp } from 'lucide-react';

export default function ModuleAccordion({ 
    module, 
    isExpanded, 
    onToggle, 
    children 
}) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full px-6 py-4 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                        <Shield className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-slate-800 text-left">{module.name}</span>
                </div>
                {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </button>

            {isExpanded && (
                <div className="px-6 pb-6 pt-2 border-t border-slate-100 bg-slate-50/50">
                    {children}
                </div>
            )}
        </div>
    );
}
