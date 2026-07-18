import axiosInstance from '../../utils/axios';



export const attendanceAPI = {
    // Get all attendance logs
    getAllLogs: async () => {
        const response = await axiosInstance.get('/attendance');
        return response.data;
    },
    
    // Get attendance logs for a specific user
    getUserLogs: async (userId) => {
        const response = await axiosInstance.get(`/attendance`);
        return response.data;
    },

    // Create an attendance record
    createAttendance: async (data) => {
        const response = await axiosInstance.post('/attendance', data);
        return response.data;
    }
};

export const employeeAPI = {
  /**
   * Get all employees
   * @returns array of employee objects
   */
  getAllEmployees: async () => {
    try {
      const response = await axiosInstance.get('/users');
      return response.data;
    } catch (error) {
      console.error('Employee List Fetch Error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get user by id
  getEmployeeById: async (id) => {
      const response = await axiosInstance.get(`/users/${id}`);
      return response.data;
  },

  /**
   * Create a new employee
   */
  createEmployee: async (employeeData) => {
    const response = await axiosInstance.post('/users/', employeeData);
    return response.data;
  },

  /**
   * Update an employee
   */
  updateEmployee: async (id, employeeData) => {
    const response = await axiosInstance.put(`/users/${id}`, employeeData);
    return response.data;
  },

  /**
   * Delete an employee
   */
  deleteEmployee: async (id) => {
    const response = await axiosInstance.delete(`/users/${id}`);
    return response.data;
  },
};

export const leaveAPI = {
    // Get all leave records
    getAllLeaves: async () => {
        const response = await axiosInstance.get('/leave-requests');
        return response.data;
    },

    // Get all leave allocations
    getAllLeaveAllocations: async () => {
        const response = await axiosInstance.get('/leave-allocations');
        return response.data;
    },

    // Create a new leave allocation
    createLeaveAllocation: async (allocationData) => {
        const response = await axiosInstance.post('/leave-allocations', allocationData);
        return response.data;
    },

    // Get specific user's leave allocations
    // Get user's leave balances
    getUserLeaveAllocations: async (userId) => {
        const response = await axiosInstance.get(`/leaves/user/${userId}`);
        return response.data;
    },

    // Get employee leave requests
    getEmployeeLeave: async (userId) => {
        const response = await axiosInstance.get(`/leave-requests/user/${userId}`);
        return response.data;
    },

    // Approve leave request
    approveLeave: async (id) => {
        const response = await axiosInstance.patch(`/leave-requests/${id}/approve`, {});
        return response.data;
    },

    // Reject leave request
    rejectLeave: async (id, reason) => {
        const response = await axiosInstance.patch(`/leave-requests/${id}/reject`, { rejectionReason: reason || "No reason provided" });
        return response.data;
    },

    createLeave: async (leaveData) => {
        const response = await axiosInstance.post('/leave-requests', leaveData);
        return response.data;
    },

    // Delete a leave allocation
    deleteLeaveAllocation: async (id) => {
        const response = await axiosInstance.delete(`/leave-allocations/${id}`);
        return response.data;
    },

    // Delete a leave request
    deleteLeave: async (id) => {
        const response = await axiosInstance.delete(`/leaves/${id}`);
        return response.data;
    }
};

export const payrollAPI = {
    // Generate new payroll record
    generatePayroll: async (payrollData) => {
        const response = await axiosInstance.post('/payrolls/generate', payrollData);
        return response.data;
    },

    // Get all payroll records
    getAllPayrolls: async () => {
        const response = await axiosInstance.get('/payrolls');
        return response.data;
    },

    // Get payroll by employee ID
    getPayrollByEmployeeId: async (userId) => {
        const response = await axiosInstance.get(`/payrolls/employee/${userId}`);
        return response.data;
    }
};

export const reimbursementAPI = {
    // Create new reimbursement claim
    createReimbursement: async (data) => {
        const response = await axiosInstance.post('/reimbursements', data);
        return response.data;
    },

    // Get all claims
    getAllReimbursements: async () => {
        const response = await axiosInstance.get('/reimbursements');
        return response.data;
    },

    // Get claim by ID
    getReimbursementById: async (id) => {
        const response = await axiosInstance.get(`/reimbursements/${id}`);
        return response.data;
    },

    // Update claim
    updateReimbursement: async (id, data) => {
        const response = await axiosInstance.put(`/reimbursements/${id}`, data);
        return response.data;
    },

    // Approve claim
    approveReimbursement: async (id) => {
        const response = await axiosInstance.patch(`/reimbursements/${id}/approve`, {});
        return response.data;
    },

    // Reject claim
    rejectReimbursement: async (id) => {
        const response = await axiosInstance.patch(`/reimbursements/${id}/reject`, {});
        return response.data;
    }
};

export const jobPostAPI = {
    getAll: async () => {
        const response = await axiosInstance.get('/job-posts');
        return response.data;
    },
    getById: async (id) => {
        const response = await axiosInstance.get(`/job-posts/${id}`);
        return response.data;
    },
    create: async (data) => {
        const response = await axiosInstance.post('/job-posts', data);
        return response.data;
    },
    update: async (id, data) => {
        const response = await axiosInstance.put(`/job-posts/${id}`, data);
        return response.data;
    },
    close: async (id) => {
        const response = await axiosInstance.patch(`/job-posts/${id}/close`, {});
        return response.data;
    },
    delete: async (id) => {
        const response = await axiosInstance.delete(`/job-posts/${id}`);
        return response.data;
    }
};

export const applicantAPI = {
    getAll: async () => {
        const response = await axiosInstance.get('/applicants');
        return response.data;
    },
    getByJobPost: async (jobPostId) => {
        const response = await axiosInstance.get(`/applicants/job-post/${jobPostId}`);
        return response.data;
    },
    getById: async (id) => {
        const response = await axiosInstance.get(`/applicants/${id}`);
        return response.data;
    },
    apply: async (data) => {
        const response = await axiosInstance.post('/applicants', data);
        return response.data;
    },
    update: async (id, data) => {
        const response = await axiosInstance.put(`/applicants/${id}`, data);
        return response.data;
    },
    delete: async (id) => {
        const response = await axiosInstance.delete(`/applicants/${id}`);
        return response.data;
    },
    shortlist: async (id) => {
        const response = await axiosInstance.patch(`/applicants/${id}/shortlist`, {});
        return response.data;
    },
    scheduleInterview: async (id, data) => {
        const response = await axiosInstance.patch(`/applicants/${id}/schedule-interview`, data);
        return response.data;
    },
    select: async (id) => {
        const response = await axiosInstance.patch(`/applicants/${id}/select`, {});
        return response.data;
    },
    reject: async (id) => {
        const response = await axiosInstance.patch(`/applicants/${id}/reject`, {});
        return response.data;
    },
    onboard: async (id, data) => {
        const response = await axiosInstance.patch(`/applicants/${id}/onboard`, data);
        return response.data;
    }
};

export const complianceAPI = {
    getSummary: async (month, year) => {
        const response = await axiosInstance.get(`/compliance/summary?month=${month}&year=${year}`);
        return response.data;
    }
    // ECR and ESI downloads will be handled via direct window.open or blob downloads using axios in the component
};
