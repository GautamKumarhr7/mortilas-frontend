import { Search, Menu, X, ChevronDown, Zap, LogOut, User, Settings, Mail as MailIcon, LogIn } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { useState, useEffect, useRef } from 'react';
import axiosInstance from '../utils/axios';
import toast from 'react-hot-toast';
import { MODULE_TITLES } from '../constants/navigation';

export default function Header() {
    const { activeModule, sidebarOpen, setSidebarOpen, userRole, userProfile, logout } = useApp();
    const [showSearch, setShowSearch] = useState(false);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);


    const profileRef = useRef(null);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setShowProfileDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const profileName = userProfile?.name || (userRole === 'admin' ? 'Admin' : 'Employee');
    const profileEmail = userProfile?.email || '';

    const handleClockIn = async () => {
        try {
            const res = await axiosInstance.post('/attendance-logs/clock-in', {
                userId: userProfile?.id || userProfile?.userId
            });
            toast.success(res.data?.message || "Clocked In successfully!");
            setShowProfileDropdown(false);
        } catch (error) {
            let msg = "Failed to Clock In";
            if (error.response?.data) {
                msg = typeof error.response.data === 'string' 
                      ? (error.response.data.includes('"message"') ? JSON.parse(error.response.data).message : error.response.data) 
                      : (error.response.data.message || msg);
            }
            toast.error(msg);
            setShowProfileDropdown(false);
        }
    };

    const handleClockOut = async () => {
        try {
            const res = await axiosInstance.post('/attendance-logs/clock-out', {
                userId: userProfile?.id || userProfile?.userId
            });
            toast.success(res.data?.message || "Clocked Out successfully!");
            setShowProfileDropdown(false);
        } catch (error) {
            let msg = "Failed to Clock Out";
            if (error.response?.data) {
                msg = typeof error.response.data === 'string' 
                      ? (error.response.data.includes('"message"') ? JSON.parse(error.response.data).message : error.response.data) 
                      : (error.response.data.message || msg);
            }
            toast.error(msg);
            setShowProfileDropdown(false);
        }
    };

    return (
        <header className={`fixed top-0 right-0 h-20 z-20 flex items-center justify-between px-4 md:px-8 bg-[#f4f7f6]/80 backdrop-blur-lg border-b border-[#e9ecef] transition-all duration-300 ${sidebarOpen ? 'left-0 md:left-64' : 'left-0 md:left-16'}`}>
            {/* Left */}
            <div className="flex items-center gap-3 md:gap-5">
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="text-slate-500 hover:text-slate-900 transition-colors p-2 rounded-xl hover:bg-slate-100"
                >
                    <Menu className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-slate-900 font-bold text-base md:text-lg truncate max-w-[150px] md:max-w-none">{MODULE_TITLES[activeModule] || 'Dashboard'}</h1>
                    <div className="hidden md:flex items-center gap-2 text-slate-500 text-xs mt-0.5">
                        <span className="font-medium">EcoConstruct CRM</span>
                        <span>•</span>
                        <span className="text-[#2f6645] flex items-center gap-1 font-semibold"><Zap className="w-3 h-3 fill-current" /> Live System</span>
                    </div>
                </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2 md:gap-4">
                {/* Search */}
                <div className="relative hidden sm:block">
                    {showSearch ? (
                        <div className="flex items-center gap-2 animate-fade-in bg-slate-50 rounded-full px-4 py-1.5 border border-slate-200">
                            <Search className="w-4 h-4 text-slate-400" />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Search modules..."
                                className="bg-transparent text-sm w-32 md:w-48 focus:outline-none text-slate-800 placeholder-slate-400"
                            />
                            <button onClick={() => setShowSearch(false)} className="text-slate-400 hover:text-slate-700 ml-1">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowSearch(true)}
                            className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full bg-slate-50 border border-slate-100 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all shadow-sm"
                        >
                            <Search className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <div className="relative" ref={profileRef}>
                    <button 
                        onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                        className="flex items-center gap-3 pl-1 pr-2 py-1 bg-slate-50 border border-slate-100 rounded-full hover:bg-slate-100 transition-all shadow-sm md:ml-2"
                    >
                        <img 
                            src={`https://ui-avatars.com/api/?name=${profileName}&background=${userRole === 'admin' ? '1e3a34' : '2f6645'}&color=fff`} 
                            alt="Avatar" 
                            className="w-7 h-7 md:w-8 md:h-8 rounded-full shadow-sm" 
                        />
                        <div className="hidden sm:flex flex-col items-start mr-1">
                            <span className="text-[11px] font-bold text-slate-700 leading-tight">{profileName}</span>
                            <span className="text-[9px] text-slate-500 font-medium uppercase tracking-wider">{userRole}</span>
                        </div>
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${showProfileDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showProfileDropdown && (
                        <div className="absolute right-0 top-12 w-64 bg-white rounded-2xl border border-slate-200 shadow-2xl shadow-slate-200/50 animate-fade-in z-50 overflow-hidden">
                                {/* Header */}
                                <div className="px-5 py-4 border-b border-slate-50 bg-slate-50/50">
                                    <p className="text-sm font-bold text-slate-900">{profileName}</p>
                                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 font-medium">
                                        <MailIcon className="w-3 h-3" /> {profileEmail}
                                    </p>
                                    <div className="mt-2 px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-md inline-block uppercase tracking-wider">
                                        {userRole} Account
                                    </div>
                                </div>

                                {/* Menu Items */}
                                <div className="p-2 space-y-1">
                                    {/* Attendance / Clock (Hidden for Admin) */}
                                    {userRole !== 'admin' && (
                                        <>
                                            <div className="flex items-center gap-2 p-1">
                                                <button 
                                                    onClick={handleClockIn}
                                                    className="flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all text-xs font-bold ring-1 ring-emerald-100"
                                                >
                                                    <LogIn className="w-4 h-4" />
                                                    Clock In
                                                </button>
                                                <button 
                                                    onClick={handleClockOut}
                                                    className="flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 text-slate-500 hover:bg-amber-50 hover:text-amber-600 rounded-xl transition-all text-xs font-bold ring-1 ring-slate-100"
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    Clock Out
                                                </button>
                                            </div>
                                            <div className="h-px w-full bg-slate-50 my-2"></div>
                                        </>
                                    )}
                                    <button className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all text-sm font-medium group">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all text-slate-500">
                                            <User className="w-4 h-4" />
                                        </div>
                                        My Profile
                                    </button>
                                    <button className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all text-sm font-medium group">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all text-slate-500">
                                            <Settings className="w-4 h-4" />
                                        </div>
                                        Settings
                                    </button>
                                </div>

                                {/* Footer */}
                                <div className="p-2 border-t border-slate-50">
                                    <button 
                                        onClick={() => { setShowProfileDropdown(false); logout(); }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-all text-sm font-bold group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-red-100/50 flex items-center justify-center group-hover:bg-red-100 transition-all">
                                            <LogOut className="w-4 h-4" />
                                        </div>
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                    )}
                </div>
            </div>
        </header>
    );
}
