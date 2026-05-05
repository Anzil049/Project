import api from './api';

const adminService = {
  /**
   * Get all pending doctor and hospital registrations
   */
  getPendingRegistrations: async () => {
    const response = await api.get('/admin/registrations');
    return response.data;
  },

  /**
   * Approve a registration
   */
  approveRegistration: async (id) => {
    const response = await api.post(`/admin/approve/${id}`);
    return response.data;
  },

  /**
   * Reject a registration with a reason
   */
  rejectRegistration: async (id, reason) => {
    const response = await api.post(`/admin/reject/${id}`, { reason });
    return response.data;
  },

  getApprovedDoctors: async () => {
    const response = await api.get('/admin/doctors');
    return response.data;
  },

  getApprovedHospitals: async () => {
    const response = await api.get('/admin/hospitals');
    return response.data;
  },

  getPatients: async () => {
    const response = await api.get('/admin/patients');
    return response.data;
  },
  
  toggleUserStatus: async (id) => {
    const response = await api.patch(`/admin/users/${id}/status`);
    return response.data;
  }
};

export default adminService;
