import React, { useEffect } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { getPageComponent } from '../constants/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { setPermissionsStart, setPermissionsSuccess, setPermissionsFailure } from '../store/slices/permissionSlice';
import { authAPI } from '../modules/auth/services';

export default function AppLayout() {
    const dispatch = useDispatch();
    const { activeModule, sidebarOpen } = useSelector((state) => state.ui);
    const { roleId, userProfile, isLoggedIn, userType } = useSelector((state) => state.auth);
    const { modules } = useSelector((state) => state.permissions);
    const userRole = roleId || userProfile?.designationId;

    useEffect(() => {
        const fetchPermissions = async () => {
            if (isLoggedIn && (!modules || modules.length === 0)) {
                if (userType === 'vendor') {
                    dispatch(setPermissionsSuccess([
                        { id: 'vendor-dashboard', name: 'Vendor Dashboard', code: 'vendor-dashboard' }
                    ]));
                    return;
                }

                if (userRole) {
                    dispatch(setPermissionsStart());
                    try {
                        const permResponse = await authAPI.getRolePermissions(userRole);
                        const dataArray = Array.isArray(permResponse) ? permResponse : (permResponse.data || permResponse);
                        dispatch(setPermissionsSuccess(Array.isArray(dataArray) ? dataArray : []));
                    } catch (error) {
                        console.error("Failed to fetch permissions on reload", error);
                        // Provide fallback modules so the sidebar isn't empty if backend fails
                        const fallbackModules = [
                            { id: 'dash-fallback', name: 'Dashboard', code: 'dashboard' },
                            { id: 'hr-fallback', name: 'HR', code: 'hr' }
                        ];
                        dispatch(setPermissionsSuccess(fallbackModules));
                    }
                }
            }
        };

        fetchPermissions();
    }, [isLoggedIn, userRole, userType, dispatch, modules?.length]);

    return (
        <div className="min-h-screen bg-[#eef2f0] text-slate-800 print:bg-white print:p-0">
            <div className="print:hidden">
                <Sidebar role={userRole} />
            </div>
            <div className={`transition-all duration-300 print:ml-0 print:pt-0 ${sidebarOpen ? 'md:ml-64 ml-0' : 'ml-0 md:ml-16'}`}>
                <div className="print:hidden">
                    <Header />
                </div>
                <main className="pt-24 pb-12 px-4 md:px-8 min-h-screen w-full box-border print:pt-0 print:pb-0 print:px-0">
                    <div key={activeModule} className="animate-fade-in max-w-7xl mx-auto print:max-w-none">
                        {getPageComponent(activeModule)}
                    </div>
                </main>
            </div>
        </div>
    );
}
