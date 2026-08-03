import {
    ClipboardList, DollarSign, ChevronDown, ChevronRight, Zap, Folder, Shield, Activity, BarChart3, Briefcase, Landmark, LayoutDashboard, Package, TrendingUp, Users, FileBarChart, Key
} from 'lucide-react';
import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setActiveModule } from '../store/slices/uiSlice';
import { logout } from '../store/slices/authSlice';

// Helper to assign icons based on module/submodule codes or names
const getIconForCode = (code) => {
    const iconMap = {
        'dashboard': LayoutDashboard,
        'projects': Folder,
        'finance': DollarSign,
        'operations': Package,
        'hr': Users,
        'business-dev': Briefcase,
        'compliance': Shield,
        'analytics': BarChart3,
        'authority': Key,
        // Fallback
    };
    const key = String(code || '').toLowerCase();
    return iconMap[key] || FileBarChart;
};

function NavItem({ item, depth = 0, role, hasMultipleSections = false }) {
    const dispatch = useDispatch();
    const { activeModule } = useSelector((state) => state.ui);
    
    // Check if this module contains the active submodule
    const hasActiveChild = item.submodules?.some(c => c.code?.toLowerCase() === activeModule?.toLowerCase());
    const isActive = activeModule?.toLowerCase() === item.code?.toLowerCase();
    
    const [expanded, setExpanded] = useState(hasActiveChild || isActive);
    
    const Icon = getIconForCode(item.code);
    const hasChildren = item.submodules?.length > 0;

    const isAlwaysExpanded = role !== 'admin' && depth === 0 && hasChildren && !hasMultipleSections;
    const effectivelyExpanded = isAlwaysExpanded || expanded;

    const handleClick = () => {
        if (hasChildren) {
            if (!isAlwaysExpanded) setExpanded(!effectivelyExpanded);
        } else {
            dispatch(setActiveModule(item.code?.toLowerCase()));
        }
    };

    return (
        <div>
            <div
                onClick={handleClick}
                className={isActive && !hasChildren ? 'sidebar-link-active' : 'sidebar-link group'}
            >
                <div className="flex items-center gap-3">
                    {Icon && (
                        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive && !hasChildren ? 'text-[#1e3a34]' : 'text-slate-400 group-hover:text-slate-800'}`} />
                    )}
                    <span className="font-semibold text-[13px]">{item.name}</span>
                </div>
                {hasChildren && !isAlwaysExpanded && (
                    <span className="text-slate-400 group-hover:text-slate-800 ml-auto">
                        {effectivelyExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </span>
                )}
            </div>

            {hasChildren && effectivelyExpanded && (
                <div className="ml-7 mt-1 mb-2 space-y-0.5 border-l-2 border-slate-100 pl-3">
                    {item.submodules.map(child => (
                        <NavItem key={child.id} item={child} depth={depth + 1} role={role} hasMultipleSections={hasMultipleSections} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function Sidebar({ role }) {
    const dispatch = useDispatch();
    const { sidebarOpen, activeModule } = useSelector((state) => state.ui);
    const { userProfile, roleId: rawRoleId } = useSelector((state) => state.auth);
    const { modules } = useSelector((state) => state.permissions);
    
    const roleId = rawRoleId || userProfile?.designationId;

    const displayName = userProfile?.name || (roleId === 'admin' ? 'Admin' : 'Employee');
    const displayEmail = userProfile?.email || 'portal@ecoconstruct.com';

    // The API returns modules in `modules` array.
    let filteredNavItems = modules ? JSON.parse(JSON.stringify(modules)) : [];
    
    // Ensure 'Authority' module only shows role and role_permission submodules as requested
    const authModuleIdx = filteredNavItems.findIndex(m => m.name?.toLowerCase() === 'authority' || m.code?.toLowerCase() === 'authority');
    if (authModuleIdx >= 0) {
        if (filteredNavItems[authModuleIdx].submodules) {
            filteredNavItems[authModuleIdx].submodules = filteredNavItems[authModuleIdx].submodules.filter(sub => {
                const subName = sub.name?.toLowerCase();
                const subCode = sub.code?.toLowerCase();
                // Keep only "Role" / "Role Management" and "Role Permission" / "Role Permissions"
                return subName?.includes('role') || subCode?.includes('role');
            });
        }
    } else if (roleId === 'admin' || String(roleId) === '0' || String(roleId) === '1') { 
        // Fallback injection if backend completely misses the module
        filteredNavItems.push({
            id: 'authority-static',
            name: 'Authority',
            code: 'authority',
            submodules: [
                { id: 'roles-static', name: 'Role Management', code: 'role' },
                { id: 'role-perms-static', name: 'Role Permissions', code: 'role_permission' }
            ]
        });
    }

    const hasMultipleSections = filteredNavItems.filter(item => item.submodules?.length > 0).length > 1;

    const handleLogout = () => {
        dispatch(logout());
    };

    return (
        <aside className={`fixed left-0 top-0 h-full z-30 flex flex-col bg-white border-r border-[#e9ecef] transition-all duration-300
      ${sidebarOpen ? 'w-64' : 'w-16'}`}>
            {/* Logo */}
            <div className={`flex items-center justify-center h-20 border-b border-[#e9ecef] flex-shrink-0 bg-white ${sidebarOpen ? 'px-6 py-2' : 'px-2 py-4'}`}>
                <div className="flex items-center justify-center w-full h-full overflow-hidden">
                    <img src="/logo.jpg" alt="Morlatis Logo" className="h-full w-full object-contain mix-blend-multiply" />
                </div>
            </div>

            {/* Nav */}
            {sidebarOpen && (
                <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-200">
                    {filteredNavItems.map(item => (
                        <NavItem key={item.id} item={item} role={roleId} hasMultipleSections={hasMultipleSections} />
                    ))}
                </nav>
            )}

            {/* Footer */}
            {sidebarOpen && (
                <div className="p-4 border-t border-[#e9ecef] flex-shrink-0 bg-white space-y-4">
                    <div className="flex items-center gap-3 bg-[#f8f9fa] p-2.5 rounded-xl border border-slate-100">
                        <img src={`https://ui-avatars.com/api/?name=${displayName}&background=${roleId === 'admin' ? '1e3a34' : '2f6645'}&color=fff`} alt="Profile" className="w-9 h-9 rounded-lg" />
                        <div className="flex-1 min-w-0">
                            <p className="text-slate-900 text-sm font-semibold truncate capitalize">{displayName}</p>
                            <p className="text-slate-500 text-xs truncate">{displayEmail}</p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors"
                    >
                        <Zap className="w-4 h-4 rotate-45" />
                        Log Out
                    </button>
                </div>
            )}
        </aside>
    );
}
