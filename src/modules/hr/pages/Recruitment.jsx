import React, { useState, useEffect } from 'react';
import { useApp } from '../../../hooks/useApp';
import { jobPostAPI, applicantAPI } from '../services';
import toast from 'react-hot-toast';
import axiosInstance from '../../../utils/axios';
import { 
    Briefcase, Users, Calendar, 
    Search, X, Plus, Edit2, Trash2, Eye
} from 'lucide-react';
import Skeleton from '../../../components/common/Skeleton';

export default function Recruitment() {
    const { userProfile } = useApp();
    const [activeTab, setActiveTab] = useState('Jobs');
    
    // Jobs State
    const [jobs, setJobs] = useState([]);
    const [isJobsLoading, setIsJobsLoading] = useState(true);
    const [showJobModal, setShowJobModal] = useState(false);
    const [viewJob, setViewJob] = useState(null);
    const [editJob, setEditJob] = useState(null);
    const [jobForm, setJobForm] = useState({ title: '', description: '', employmentType: 'permanent', vacancies: 1, lastDate: '', departmentId: '', designationId: '', basicPay: '' });

    // Applicants State
    const [applicants, setApplicants] = useState([]);
    const [isAppLoading, setIsAppLoading] = useState(true);
    const [search, setSearch] = useState('');

    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);

    useEffect(() => {
        const fetchDepsAndDesigs = async () => {
            try {
                const [deptRes, desigRes] = await Promise.all([
                    axiosInstance.get('/modules'),
                    axiosInstance.get('/roles')
                ]);
                setDepartments(deptRes.data?.data || []);
                setDesignations(desigRes.data?.data || []);
            } catch (err) {
                console.error("Failed to fetch deps/desigs", err);
            }
        };
        fetchDepsAndDesigs();
    }, []);

    useEffect(() => {
        if (activeTab === 'Jobs') {
            fetchJobs();
        } else {
            fetchApplicants();
        }
    }, [activeTab]);

    const fetchJobs = async () => {
        setIsJobsLoading(true);
        try {
            const res = await jobPostAPI.getAll();
            setJobs(res?.data || res || []);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load job posts');
        } finally {
            setIsJobsLoading(false);
        }
    };

    const fetchApplicants = async () => {
        setIsAppLoading(true);
        try {
            const res = await applicantAPI.getAll();
            setApplicants(res?.data || res || []);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load applicants');
        } finally {
            setIsAppLoading(false);
        }
    };

    const handleCreateJob = async (e) => {
        e.preventDefault();
        try {
            await jobPostAPI.create({
                ...jobForm,
                postedBy: userProfile?.id || userProfile?.userId || 1
            });
            toast.success('Job post created!');
            setShowJobModal(false);
            fetchJobs();
        } catch (error) {
            console.error(error);
            toast.error('Failed to create job post');
        }
    };

    const handleUpdateJob = async (e) => {
        e.preventDefault();
        try {
            await jobPostAPI.update(editJob.id, editJob);
            toast.success('Job post updated!');
            setEditJob(null);
            fetchJobs();
        } catch (error) {
            console.error(error);
            toast.error('Failed to update job post');
        }
    };

    const handleDeleteJob = async (id) => {
        if (!window.confirm('Are you sure you want to delete this job post?')) return;
        try {
            await jobPostAPI.delete(id);
            toast.success('Job post deleted!');
            fetchJobs();
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete job post');
        }
    };

    const handleAction = async (applicantId, actionStr) => {
        try {
            switch(actionStr) {
                case 'shortlist':
                    await applicantAPI.shortlist(applicantId);
                    break;
                case 'select':
                    await applicantAPI.select(applicantId);
                    break;
                case 'reject':
                    await applicantAPI.reject(applicantId);
                    break;
                case 'onboard':
                    await applicantAPI.onboard(applicantId, { joiningDate: new Date().toISOString(), basicPay: 50000 });
                    break;
                default:
                    break;
            }
            toast.success(`Applicant ${actionStr}ed successfully!`);
            fetchApplicants();
        } catch (error) {
            console.error(error);
            toast.error(`Failed to ${actionStr} applicant`);
        }
    };

    const filteredApps = applicants.filter(a => 
        a.name?.toLowerCase().includes(search.toLowerCase()) || 
        a.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col bg-slate-50 relative overflow-hidden">
            <div className="flex-none pt-12 pb-6 px-12 z-10 flex justify-between items-end">
                <div className="max-w-xl">
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-2">Recruitment</h1>
                    <p className="text-slate-500 font-medium">Manage job postings and applicant pipelines.</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-100 flex">
                        {['Jobs', 'Applicants'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                    activeTab === tab 
                                    ? 'bg-slate-800 text-white shadow-md' 
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-12 pb-24 z-10">
                {activeTab === 'Jobs' ? (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-indigo-500" /> Open Positions
                            </h2>
                            <button 
                                onClick={() => setShowJobModal(true)}
                                className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white px-5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-indigo-200"
                            >
                                <Plus className="w-4 h-4" /> Post Job
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {isJobsLoading ? (
                                Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-3xl" />)
                            ) : jobs.length === 0 ? (
                                <div className="col-span-full py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No active job posts.</div>
                            ) : jobs.map(job => (
                                <div key={job.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20 hover:shadow-2xl transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="font-black text-slate-800 text-lg line-clamp-1">{job.title}</h3>
                                        <div className="flex gap-2">
                                            <button onClick={() => setViewJob(job)} className="p-1.5 text-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"><Eye className="w-4 h-4" /></button>
                                            <button onClick={() => setEditJob(job)} className="p-1.5 text-amber-400 hover:bg-amber-50 hover:text-amber-600 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                                            <button onClick={() => handleDeleteJob(job.id)} className="p-1.5 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center mb-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${job.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                            {job.status}
                                        </span>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                                            <Users className="w-4 h-4 text-indigo-400" />
                                            {job.vacancies} Vacancies
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                                            <Calendar className="w-4 h-4 text-amber-400" />
                                            Deadline: {new Date(job.lastDate).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
                            <div className="relative w-96">
                                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Search applicants..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full h-11 bg-slate-50 border border-slate-100 rounded-2xl pl-10 pr-4 font-medium text-slate-700 outline-none focus:border-indigo-500 transition-all text-sm"
                                />
                            </div>
                        </div>

                        <div className="bg-white border border-slate-100 rounded-3xl shadow-xl shadow-slate-200/20 overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Applicant</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Job Role</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {isAppLoading ? (
                                        Array(3).fill(0).map((_, i) => (
                                            <tr key={i}><td colSpan="4" className="p-4"><Skeleton className="h-12 w-full" /></td></tr>
                                        ))
                                    ) : filteredApps.length === 0 ? (
                                        <tr><td colSpan="4" className="p-12 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">No applicants found.</td></tr>
                                    ) : filteredApps.map(app => (
                                        <tr key={app.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-slate-800">{app.name}</p>
                                                <p className="text-xs text-slate-500 font-medium">{app.email}</p>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-600">
                                                {app.jobPostId} {/* Ideally fetch job title, but showing ID for brevity */}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                                                    {app.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                {app.status === 'applied' && (
                                                    <button onClick={() => handleAction(app.id, 'shortlist')} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-bold transition-all">Shortlist</button>
                                                )}
                                                {app.status === 'shortlisted' && (
                                                    <button onClick={() => handleAction(app.id, 'select')} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg text-xs font-bold transition-all">Select</button>
                                                )}
                                                {app.status === 'selected' && (
                                                    <button onClick={() => handleAction(app.id, 'onboard')} className="px-3 py-1.5 bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white rounded-lg text-xs font-bold transition-all">Onboard</button>
                                                )}
                                                {['applied', 'shortlisted', 'interview_scheduled'].includes(app.status) && (
                                                    <button onClick={() => handleAction(app.id, 'reject')} className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg text-xs font-bold transition-all">Reject</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Job Modal */}
            {showJobModal && (
                <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-black text-slate-800">Post New Job</h2>
                            <button onClick={() => setShowJobModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleCreateJob} className="p-6 space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Job Title</label>
                                <input required type="text" value={jobForm.title} onChange={e => setJobForm({...jobForm, title: e.target.value})} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all mt-1" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Description</label>
                                <textarea required rows={3} value={jobForm.description} onChange={e => setJobForm({...jobForm, description: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-medium text-sm text-slate-700 outline-none focus:border-indigo-500 transition-all mt-1 resize-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Vacancies</label>
                                    <input required type="number" min="1" value={jobForm.vacancies} onChange={e => setJobForm({...jobForm, vacancies: parseInt(e.target.value)})} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all mt-1" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Last Date</label>
                                    <input required type="date" value={jobForm.lastDate} onChange={e => setJobForm({...jobForm, lastDate: e.target.value})} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all mt-1" />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Dept. (Module)</label>
                                    <select value={jobForm.departmentId} onChange={e => setJobForm({...jobForm, departmentId: parseInt(e.target.value) || ''})} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all mt-1">
                                        <option value="" disabled>Select Department</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name || d.moduleName || `Dept #${d.id}`}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Designation (Role)</label>
                                    <select value={jobForm.designationId} onChange={e => setJobForm({...jobForm, designationId: parseInt(e.target.value) || ''})} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all mt-1">
                                        <option value="" disabled>Select Designation</option>
                                        {designations.map(d => <option key={d.id} value={d.id}>{d.name || d.roleName || `Role #${d.id}`}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Basic Pay</label>
                                    <input type="number" value={jobForm.basicPay} onChange={e => setJobForm({...jobForm, basicPay: parseFloat(e.target.value) || ''})} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all mt-1" />
                                </div>
                            </div>
                            <button type="submit" className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-200 mt-4">
                                Create Post
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* View Job Modal */}
            {viewJob && (
                <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h2 className="text-xl font-black text-slate-800">{viewJob.title}</h2>
                                <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${viewJob.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'} mt-2 inline-block`}>{viewJob.status}</span>
                            </div>
                            <button onClick={() => setViewJob(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Vacancies</p>
                                    <p className="font-bold text-slate-700 text-sm mt-1">{viewJob.vacancies}</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Basic Pay</p>
                                    <p className="font-bold text-slate-700 text-sm mt-1">₹ {viewJob.basicPay || 'N/A'}</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Last Date</p>
                                    <p className="font-bold text-slate-700 text-sm mt-1">{new Date(viewJob.lastDate).toLocaleDateString()}</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Employment Type</p>
                                    <p className="font-bold text-slate-700 text-sm mt-1 capitalize">{viewJob.employmentType}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Description</p>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-600 whitespace-pre-wrap">
                                    {viewJob.description}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Job Modal */}
            {editJob && (
                <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-black text-slate-800">Edit Job Post</h2>
                            <button onClick={() => setEditJob(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleUpdateJob} className="p-6 space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Job Title</label>
                                <input required type="text" value={editJob.title} onChange={e => setEditJob({...editJob, title: e.target.value})} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all mt-1" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Description</label>
                                <textarea required rows={3} value={editJob.description} onChange={e => setEditJob({...editJob, description: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-medium text-sm text-slate-700 outline-none focus:border-indigo-500 transition-all mt-1 resize-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Vacancies</label>
                                    <input required type="number" min="1" value={editJob.vacancies} onChange={e => setEditJob({...editJob, vacancies: parseInt(e.target.value)})} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all mt-1" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Last Date</label>
                                    <input required type="date" value={editJob.lastDate ? new Date(editJob.lastDate).toISOString().split('T')[0] : ''} onChange={e => setEditJob({...editJob, lastDate: e.target.value})} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all mt-1" />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Dept. (Module)</label>
                                    <select value={editJob.departmentId || ''} onChange={e => setEditJob({...editJob, departmentId: parseInt(e.target.value) || ''})} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all mt-1">
                                        <option value="" disabled>Select Department</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name || d.moduleName || `Dept #${d.id}`}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Designation (Role)</label>
                                    <select value={editJob.designationId || ''} onChange={e => setEditJob({...editJob, designationId: parseInt(e.target.value) || ''})} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all mt-1">
                                        <option value="" disabled>Select Designation</option>
                                        {designations.map(d => <option key={d.id} value={d.id}>{d.name || d.roleName || `Role #${d.id}`}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Basic Pay</label>
                                    <input type="number" value={editJob.basicPay || ''} onChange={e => setEditJob({...editJob, basicPay: parseFloat(e.target.value) || ''})} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all mt-1" />
                                </div>
                            </div>
                            <button type="submit" className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-amber-200 mt-4">
                                Save Changes
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
