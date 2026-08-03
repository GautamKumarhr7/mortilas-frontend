import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  activeModule: localStorage.getItem('activeModule') || 'dashboard',
  sidebarOpen: true,
  notifications: [
    { id: 1, type: 'warning', message: 'Material shortage on SWPL-BRGF project', time: '5m ago', read: false },
    { id: 2, type: 'info', message: 'RA-05 bill approved by Finance Manager', time: '1h ago', read: false },
    { id: 3, type: 'success', message: 'Payroll processed for February 2026', time: '2h ago', read: false },
    { id: 4, type: 'warning', message: 'GST return due in 3 days', time: '3h ago', read: true },
    { id: 5, type: 'error', message: 'TDS variance >5% on Bill Code 60', time: '1d ago', read: true },
  ],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveModule: (state, action) => {
      state.activeModule = action.payload;
      localStorage.setItem('activeModule', action.payload);
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    markAllNotificationsRead: (state) => {
      state.notifications.forEach(n => n.read = true);
    },
  },
});

export const { setActiveModule, toggleSidebar, setSidebarOpen, markAllNotificationsRead } = uiSlice.actions;
export default uiSlice.reducer;
