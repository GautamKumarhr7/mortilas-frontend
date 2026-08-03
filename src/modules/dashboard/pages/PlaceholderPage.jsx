import { Construction, Wrench } from 'lucide-react';

// eslint-disable-next-line no-unused-vars
export default function PlaceholderPage({ title, description, icon: Icon = Construction }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-fade-in">
            <div className="w-20 h-20 rounded-2xl bg-[#9ae66e]/20 border border-[#9ae66e]/40 flex items-center justify-center">
                <Icon className="w-10 h-10 text-[#2f6645]" />
            </div>
            <div className="text-center max-w-md">
                <h2 className="text-slate-900 text-2xl font-bold mb-2">{title}</h2>
                <p className="text-slate-400">{description || `This module is under active development. It will include all features outlined in the Morlatis ERP documentation.`}</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 border border-slate-200 text-slate-400 text-sm">
                <Wrench className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
                Coming Soon
            </div>
        </div>
    );
}
