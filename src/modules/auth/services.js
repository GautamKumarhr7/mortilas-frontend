import axiosInstance from '../../utils/axios';


export const authAPI = {
  getRolePermissions: async (roleId) => {
    const response = await axiosInstance.get(`/role-permissions/role/${roleId}`);
    return response.data;
  },
  /**
   * Login user to backend
   * @param {string} email 
   * @param {string} password 
   * @returns expected response data object containing tokens
   */
  login: async (email, password) => {
    const response = await axiosInstance.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  /**
   * Manually call refresh token api if needed,
   * Note: The axios interceptor handles this automatically for expired requests!
   * @param {string} token - The refresh token
   */
  refreshToken: async (token) => {
    const response = await axiosInstance.post('/auth/refresh', {
      refreshToken: token,
    });
    return response.data;
  },

  /**
   * Get the currently logged-in user's profile
   * GET /users/me
   */
  getProfile: async () => {
    const response = await axiosInstance.get('/users/me');
    return response.data;
  },
};
