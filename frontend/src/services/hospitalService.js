import api from './api';

const hospitalService = {
  /**
   * Add a new doctor from hospital dashboard
   */
  addDoctor: async (doctorData) => {
    const response = await api.post('/hospital/doctors', doctorData);
    return response.data;
  },

  /**
   * Get all doctors for the hospital
   */
  getDoctors: async () => {
    const response = await api.get('/hospital/doctors');
    return response.data;
  },

  /**
   * Toggle doctor status (Block/Unblock)
   */
  toggleDoctorStatus: async (doctorId) => {
    const response = await api.patch(`/hospital/doctors/${doctorId}/status`);
    return response.data;
  },

  /**
   * Delete doctor completely
   */
  deleteDoctor: async (doctorId) => {
    const response = await api.delete(`/hospital/doctors/${doctorId}`);
    return response.data;
  },
};

export default hospitalService;
