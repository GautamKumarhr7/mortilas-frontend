import { useState, useEffect } from 'react';
import { projectAPI } from '../modules/projects/services';
import { AppContext } from './AppContextValue';

const initialProjects = [];

const initialWorkOrders = [
    {
        id: 'WO-2026-001',
        projectId: 'PRJ-2026-001',
        projectName: 'SWPL-BRGF Electrification Phase 1',
        vendorId: 'VEND-101',
        vendorName: 'Apex Electricals Pvt Ltd',
        workDescription: 'Internal Wiring & Fitting for Block A',
        value: 1250000,
        advance: 250000,
        retention: 5, // 5%
        startDate: '2025-11-01',
        endDate: '2026-03-31',
        status: 'Active',
        progress: 65,
        type: 'Rate Contract'
    },
    {
        id: 'WO-2026-002',
        projectId: 'PRJ-2026-002',
        projectName: 'Patna Metro Civil Works Section B',
        vendorId: 'VEND-205',
        vendorName: 'Bharat Construction Co.',
        workDescription: 'RCC Work for Pier P11 to P15',
        value: 4500000,
        advance: 900000,
        retention: 10,
        startDate: '2025-09-15',
        endDate: '2026-08-30',
        status: 'Active',
        progress: 40,
        type: 'Lumpsum'
    },
    {
        id: 'WO-2026-003',
        projectId: 'PRJ-2026-001',
        projectName: 'SWPL-BRGF Electrification Phase 1',
        vendorId: 'VEND-312',
        vendorName: 'Zenith Security Systems',
        workDescription: 'CCTV & Alarm Installation',
        value: 450000,
        advance: 0,
        retention: 5,
        startDate: '2026-02-15',
        endDate: '2026-04-30',
        status: 'Draft',
        progress: 0,
        type: 'Unit Rate'
    }
];

const initialBOQItems = [];

const initialSites = [
    { id: 'SITE-001', name: 'Muzaffarpur Block A', projectId: 'PRJ-2026-001', location: 'Muzaffarpur', supervisor: 'Amit Singh', manpower: 45, status: 'Active', health: 'Safe', alerts: 0, budget: 1500000, complexity: 'Medium' },
    { id: 'SITE-002', name: 'Patna Metro Pier P11', projectId: 'PRJ-2026-002', location: 'Patna', supervisor: 'Priya Devi', manpower: 120, status: 'Active', health: 'Caution', alerts: 2, budget: 5500000, complexity: 'High' },
    { id: 'SITE-003', name: 'Gaya Municipal Complex', projectId: 'PRJ-2026-004', location: 'Gaya', supervisor: 'Neha Rai', manpower: 25, status: 'On Hold', health: 'Safe', alerts: 0, budget: 850000, complexity: 'Low' },
    { id: 'SITE-004', name: 'TechCorp HQ Interior', projectId: 'PRJ-2026-005', location: 'Patna', supervisor: 'Sanya Mishra', manpower: 15, status: 'Active', health: 'Safe', alerts: 0, budget: 1200000, complexity: 'Medium' }
];

const initialProgressTasks = [
    { id: 'TASK-101', title: 'Foundation Leveling', projectId: 'PRJ-2026-001', category: 'Civil', progress: 100, startDate: '2025-10-01', endDate: '2025-10-15', status: 'Completed', priority: 'High', siteId: 'SITE-001' },
    { id: 'TASK-102', title: 'Internal Wiring', projectId: 'PRJ-2026-001', category: 'Electrical', progress: 65, startDate: '2025-11-01', endDate: '2026-03-31', status: 'In Progress', priority: 'Medium', siteId: 'SITE-001' },
    { id: 'TASK-201', title: 'Excavation & Piling', projectId: 'PRJ-2026-002', category: 'Civil', progress: 45, startDate: '2025-08-15', endDate: '2026-01-30', status: 'In Progress', priority: 'Critical', siteId: 'SITE-002' },
    { id: 'TASK-202', title: 'Casting of Peirs', projectId: 'PRJ-2026-002', category: 'Civil', progress: 15, startDate: '2026-02-01', endDate: '2026-10-31', status: 'Active', priority: 'High', siteId: 'SITE-002' },
    { id: 'TASK-501', title: 'Drywall Installation', projectId: 'PRJ-2026-005', category: 'Interior', progress: 85, startDate: '2026-02-01', endDate: '2026-03-15', status: 'In Progress', priority: 'Medium', siteId: 'SITE-004' },
    { id: 'TASK-502', title: 'HVAC Ducting', projectId: 'PRJ-2026-005', category: 'HVAC', progress: 30, startDate: '2026-03-01', endDate: '2026-04-10', status: 'Active', priority: 'High', siteId: 'SITE-004' }
];

const initialEmployees = [];

export function AppProvider({ children }) {
    // Restore active module from localStorage so page refresh stays on the same page
    const [activeModule, setActiveModuleState] = useState(
        () => localStorage.getItem('activeModule') || 'dashboard'
    );

    const setActiveModule = (module) => {
        localStorage.setItem('activeModule', module);
        setActiveModuleState(module);
    };
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [notifications, setNotifications] = useState([
        { id: 1, type: 'warning', message: 'Material shortage on SWPL-BRGF project', time: '5m ago', read: false },
        { id: 2, type: 'info', message: 'RA-05 bill approved by Finance Manager', time: '1h ago', read: false },
        { id: 3, type: 'success', message: 'Payroll processed for February 2026', time: '2h ago', read: false },
        { id: 4, type: 'warning', message: 'GST return due in 3 days', time: '3h ago', read: true },
        { id: 5, type: 'error', message: 'TDS variance >5% on Bill Code 60', time: '1d ago', read: true },
    ]);

    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('accessToken'));
    const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || null);
    const [userProfile, setUserProfile] = useState(() => {
        try {
            const saved = localStorage.getItem('userProfile');
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });

    const [selectedEmployee, setSelectedEmployeeState] = useState(() => {
        try {
            const saved = localStorage.getItem('selectedEmployee');
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });

    const setSelectedEmployee = (emp) => {
        if (emp) {
            localStorage.setItem('selectedEmployee', JSON.stringify(emp));
        } else {
            localStorage.removeItem('selectedEmployee');
        }
        setSelectedEmployeeState(emp);
    };

    const [employees, setEmployees] = useState(initialEmployees);
    const [projects, setProjects] = useState(() => initialProjects);
    const [selectedProject, setSelectedProject] = useState(null);
    const [workOrders, setWorkOrders] = useState(initialWorkOrders);
    const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
    const [boqItems, setBoqItems] = useState(initialBOQItems);
    const [sites, setSites] = useState(initialSites);
    const [progressTasks, setProgressTasks] = useState(initialProgressTasks);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [selectedVoucher, setSelectedVoucher] = useState(null);

    const fetchProfile = async () => {};

    const fetchGlobalProjects = async () => {
        try {
            const res = await projectAPI.getAllProjects();
            const data = Array.isArray(res.data) ? res.data : (res.data?.projects || res.data?.data || []);
            setProjects(data);
        } catch {
            // Keep existing local project state when the global project endpoint is unavailable.
        }
    };

    useEffect(() => {
        if (localStorage.getItem('accessToken')) {
            fetchProfile();
            queueMicrotask(fetchGlobalProjects);
        }
    }, [isLoggedIn]);

    const login = (role, profile = null) => {
        localStorage.setItem('userRole', role);
        localStorage.setItem('activeModule', 'dashboard');
        if (profile) {
            localStorage.setItem('userProfile', JSON.stringify(profile));
            setUserProfile(profile);
        }
        setIsLoggedIn(true);
        setUserRole(role);
        setActiveModuleState('dashboard');
        fetchProfile();
    };

    const logout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('activeModule');
        localStorage.removeItem('userProfile');
        setIsLoggedIn(false);
        setUserRole(null);
        setUserProfile(null);
    };

    const updateEmployee = (updatedEmp) => {
        setEmployees(prev => prev.map(emp => emp.id === updatedEmp.id ? updatedEmp : emp));
        if (selectedEmployee?.id === updatedEmp.id) {
            setSelectedEmployee(updatedEmp);
        }
    };

    const updateProject = (updatedProj) => {
        setProjects(prev => prev.map(p => p.id === updatedProj.id ? updatedProj : p));
        if (selectedProject?.id === updatedProj.id) {
            setSelectedProject(updatedProj);
        }
    };

    const updateWorkOrder = (updatedWO) => {
        setWorkOrders(prev => prev.map(wo => wo.id === updatedWO.id ? updatedWO : wo));
        if (selectedWorkOrder?.id === updatedWO.id) {
            setSelectedWorkOrder(updatedWO);
        }
    };

    const updateBOQItem = (updatedItem) => {
        setBoqItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    };

    const updateSite = (updatedSite) => {
        setSites(prev => prev.map(s => s.id === updatedSite.id ? updatedSite : s));
    };

    const updateProgressTask = (updatedTask) => {
        setProgressTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    };

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    return (
        <AppContext.Provider value={{
            activeModule, setActiveModule,
            sidebarOpen, setSidebarOpen,
            notifications, markAllRead,
            selectedEmployee, setSelectedEmployee,
            employees, setEmployees, updateEmployee,
            projects, setProjects, selectedProject, setSelectedProject, updateProject,
            workOrders, setWorkOrders, selectedWorkOrder, setSelectedWorkOrder, updateWorkOrder,
            boqItems, setBoqItems, updateBOQItem,
            sites, setSites, updateSite,
            progressTasks, setProgressTasks, updateProgressTask,
            selectedInvoice, setSelectedInvoice,
            selectedVoucher, setSelectedVoucher,
            isLoggedIn, userRole, userProfile, login, logout
        }}>
            {children}
        </AppContext.Provider>
    );
}
