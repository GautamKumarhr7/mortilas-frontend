import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Briefcase, Building2, MapPin, UploadCloud, CheckCircle2, ChevronRight, GraduationCap, Clock, LogOut, Users, X } from 'lucide-react';
import axiosInstance from '../../../utils/axios';
import toast from 'react-hot-toast';
import { logout } from '../../../store/slices/authSlice';

export default function JobPortal() {
  const dispatch = useDispatch();
  const { userProfile } = useSelector(state => state.auth);
  
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  
  // Application Form State
  const [education, setEducation] = useState([]);
  const [experience, setExperience] = useState([]);
  const [resumeFile, setResumeFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await axiosInstance.get('/job-posts');
      const activeJobs = (res.data?.data || res.data || []).filter(j => j.status === 'active');
      setJobs(activeJobs);
    } catch (error) {
      toast.error('Failed to load job postings');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEducation = () => {
    setEducation([...education, { level: '10th', institute: '', passingYear: '', cgpa: '' }]);
  };

  const handleRemoveEducation = (index) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  const handleAddExperience = () => {
    setExperience([...experience, { name: '', jobRole: '', description: '', salary: '' }]);
  };

  const handleRemoveExperience = (index) => {
    setExperience(experience.filter((_, i) => i !== index));
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!resumeFile) return toast.error('Please upload your resume in PDF format');
    
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('jobPostId', selectedJob.id);
      formData.append('userId', userProfile.id);
      formData.append('name', userProfile.name);
      formData.append('email', userProfile.email);
      formData.append('phone', userProfile.phone || 'N/A');
      
      formData.append('education', JSON.stringify(education.filter(ed => ed.institute)));
      formData.append('experience', JSON.stringify(experience.filter(ex => ex.name)));
      formData.append('resume', resumeFile);

      await axiosInstance.post('/applicants', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success('Application submitted successfully!');
      setSelectedJob(null);
      setResumeFile(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-slate-800">Careers Portal</h1>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm font-medium text-slate-600">Welcome, {userProfile?.name}</p>
            <button onClick={() => dispatch(logout())} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Open Positions</h2>
          <p className="text-slate-500 mt-2">Join our team and help build the future.</p>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="h-48 bg-slate-200 rounded-2xl animate-pulse" />)}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
            <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-800">No open positions</h3>
            <p className="text-slate-500">Please check back later.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map(job => (
              <div key={job.id} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-100 transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Building2 className="w-6 h-6 text-indigo-600" />
                  </div>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                    {job.employmentType || 'Full-time'}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{job.title}</h3>
                <div className="flex items-center gap-4 text-sm text-slate-500 font-medium mb-6">
                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> On-site</span>
                  <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {job.vacancies} Openings</span>
                </div>
                <button onClick={() => setSelectedJob(job)} className="w-full h-12 bg-slate-50 hover:bg-indigo-600 text-slate-700 hover:text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
                  Apply Now <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md rounded-t-2xl z-10">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Apply for {selectedJob.title}</h2>
                <p className="text-slate-500 font-medium mt-1">Please fill in all details carefully</p>
              </div>
              <button onClick={() => setSelectedJob(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleApply} className="p-6 space-y-8">
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-indigo-600">
                    <GraduationCap className="w-5 h-5" />
                    <h3 className="text-sm font-black uppercase tracking-widest">Education History</h3>
                  </div>
                  <button type="button" onClick={handleAddEducation} className="text-sm font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg">
                    + Add Education
                  </button>
                </div>
                <div className="space-y-4">
                  {education.length === 0 && <p className="text-sm text-slate-400 italic">No education added</p>}
                  {education.map((edu, idx) => (
                    <div key={idx} className="grid grid-cols-4 gap-4 p-4 pt-8 md:pt-4 bg-slate-50 rounded-xl border border-slate-200 relative">
                      <button type="button" onClick={() => handleRemoveEducation(idx)} className="absolute top-2 right-4 text-rose-500 text-xs font-bold hover:underline">Remove</button>
                      <div className="col-span-4 md:col-span-1">
                        <select 
                          value={edu.level} 
                          onChange={e => {
                            const newEdu = [...education];
                            newEdu[idx].level = e.target.value;
                            setEducation(newEdu);
                          }} 
                          className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm font-medium focus:border-indigo-500 outline-none"
                        >
                          <option value="10th">10th</option>
                          <option value="12th">12th</option>
                          <option value="UG">UG (Undergraduate)</option>
                          <option value="PG">PG (Post Graduate)</option>
                        </select>
                      </div>
                      <div className="col-span-4 md:col-span-1">
                        <input placeholder="Institute / School" value={edu.institute} onChange={e => {
                          const newEdu = [...education];
                          newEdu[idx].institute = e.target.value;
                          setEducation(newEdu);
                        }} className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm font-medium focus:border-indigo-500 outline-none" />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <input type="number" placeholder="Passing Year" value={edu.passingYear} onChange={e => {
                          const newEdu = [...education];
                          newEdu[idx].passingYear = e.target.value;
                          setEducation(newEdu);
                        }} className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm font-medium focus:border-indigo-500 outline-none" />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <input placeholder="CGPA / %" value={edu.cgpa} onChange={e => {
                          const newEdu = [...education];
                          newEdu[idx].cgpa = e.target.value;
                          setEducation(newEdu);
                        }} className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm font-medium focus:border-indigo-500 outline-none" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <Clock className="w-5 h-5" />
                    <h3 className="text-sm font-black uppercase tracking-widest">Work Experience</h3>
                  </div>
                  <button type="button" onClick={handleAddExperience} className="text-sm font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg">
                    + Add Organization
                  </button>
                </div>
                <div className="space-y-4">
                  {experience.length === 0 && <p className="text-sm text-slate-400 italic">No experience added (Fresher)</p>}
                  {experience.map((exp, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 relative">
                      <button type="button" onClick={() => handleRemoveExperience(idx)} className="absolute top-4 right-4 text-rose-500 text-xs font-bold hover:underline">Remove</button>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Organization Name</label>
                          <input required value={exp.name} onChange={e => {
                            const newExp = [...experience]; newExp[idx].name = e.target.value; setExperience(newExp);
                          }} className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm font-medium focus:border-emerald-500 outline-none mt-1" />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Job Role</label>
                          <input required value={exp.jobRole} onChange={e => {
                            const newExp = [...experience]; newExp[idx].jobRole = e.target.value; setExperience(newExp);
                          }} className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm font-medium focus:border-emerald-500 outline-none mt-1" />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Salary (₹)</label>
                          <input type="number" required value={exp.salary} onChange={e => {
                            const newExp = [...experience]; newExp[idx].salary = e.target.value; setExperience(newExp);
                          }} className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm font-medium focus:border-emerald-500 outline-none mt-1" />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Description</label>
                          <input value={exp.description} onChange={e => {
                            const newExp = [...experience]; newExp[idx].description = e.target.value; setExperience(newExp);
                          }} className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm font-medium focus:border-emerald-500 outline-none mt-1" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-4 text-blue-600">
                  <UploadCloud className="w-5 h-5" />
                  <h3 className="text-sm font-black uppercase tracking-widest">Resume Upload (PDF, Max 5MB)</h3>
                </div>
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-blue-500 transition-colors bg-slate-50 cursor-pointer relative">
                  <input type="file" accept="application/pdf" onChange={e => setResumeFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required />
                  {resumeFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                      <p className="font-bold text-slate-700">{resumeFile.name}</p>
                      <p className="text-xs text-slate-500">{(resumeFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                        <UploadCloud className="w-8 h-8 text-blue-600" />
                      </div>
                      <p className="font-bold text-slate-700">Click or drag PDF to upload</p>
                      <p className="text-xs text-slate-500">Maximum file size: 5MB</p>
                    </div>
                  )}
                </div>
              </section>

              <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
                <button type="button" onClick={() => setSelectedJob(null)} className="px-6 py-3 bg-white text-slate-600 font-bold rounded-xl border border-slate-200 hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 disabled:opacity-50">
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
