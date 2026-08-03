import React from 'react';
import { Target, CheckCircle2, Clock, CalendarDays } from 'lucide-react';

export default function ProgressStats({ overallCompletion, milstonesCount, delayTasks, upcomingDue }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <p className="text-slate-500 text-sm font-medium">Overall Progress</p>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Target className="w-4 h-4" />
                    </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-800">{overallCompletion}%</h3>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                    <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                        style={{ width: `${overallCompletion}%` }}
                    />
                </div>
            </div>

            <div className="card p-4 flex flex-col justify-center">
                <div className="flex items-center justify-between">
                    <p className="text-slate-500 text-sm font-medium">Completed</p>
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                    </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mt-2">{milstonesCount}</h3>
                <p className="text-xs text-slate-400 mt-1">Verified Milestones</p>
            </div>

            <div className="card p-4 flex flex-col justify-center">
                <div className="flex items-center justify-between">
                    <p className="text-slate-500 text-sm font-medium">Delayed</p>
                    <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                        <Clock className="w-4 h-4" />
                    </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mt-2">{delayTasks}</h3>
                <p className="text-xs text-slate-400 mt-1">Tasks Behind Schedule</p>
            </div>

            <div className="card p-4 flex flex-col justify-center">
                <div className="flex items-center justify-between">
                    <p className="text-slate-500 text-sm font-medium">Upcoming</p>
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                        <CalendarDays className="w-4 h-4" />
                    </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mt-2">{upcomingDue}</h3>
                <p className="text-xs text-slate-400 mt-1">Due in Next 15 Days</p>
            </div>
        </div>
    );
}
