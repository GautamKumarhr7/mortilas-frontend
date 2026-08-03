import React from 'react';
import { MapPin, Users, Activity, AlertCircle } from 'lucide-react';

export default function SiteStats({ activeSites, manpower, healthySites, alerts }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4 flex flex-col justify-center">
                <div className="flex items-center justify-between">
                    <p className="text-slate-500 text-sm font-medium">Live Sites</p>
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                        <MapPin className="w-4 h-4" />
                    </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mt-2">{activeSites}</h3>
                <p className="text-xs text-slate-400 mt-1">Operational Projects</p>
            </div>

            <div className="card p-4 flex flex-col justify-center">
                <div className="flex items-center justify-between">
                    <p className="text-slate-500 text-sm font-medium">Site Manpower</p>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Users className="w-4 h-4" />
                    </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mt-2">{manpower}</h3>
                <p className="text-xs text-slate-400 mt-1">Total Active Workfroce</p>
            </div>

            <div className="card p-4 flex flex-col justify-center">
                <div className="flex items-center justify-between">
                    <p className="text-slate-500 text-sm font-medium">Health Index</p>
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Activity className="w-4 h-4" />
                    </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mt-2">{healthySites}%</h3>
                <p className="text-xs text-slate-400 mt-1">Safety Compliant Sites</p>
            </div>

            <div className="card p-4 flex flex-col justify-center">
                <div className="flex items-center justify-between">
                    <p className="text-slate-500 text-sm font-medium">Attention</p>
                    <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                        <AlertCircle className="w-4 h-4" />
                    </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mt-2">{alerts}</h3>
                <p className="text-xs text-slate-400 mt-1">Active Site Incidents</p>
            </div>
        </div>
    );
}
