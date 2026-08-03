import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  modules: [], // Will store the array of module objects returned from API
  loading: false,
  error: null,
};

const permissionSlice = createSlice({
  name: 'permissions',
  initialState,
  reducers: {
    setPermissionsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    setPermissionsSuccess: (state, action) => {
      state.loading = false;
      state.modules = action.payload; // Array of modules, each containing submodules
    },
    setPermissionsFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    clearPermissions: (state) => {
      state.modules = [];
      state.error = null;
    },
  },
});

export const { 
  setPermissionsStart, 
  setPermissionsSuccess, 
  setPermissionsFailure, 
  clearPermissions 
} = permissionSlice.actions;

export default permissionSlice.reducer;
