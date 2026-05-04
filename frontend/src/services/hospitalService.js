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
};

export default hospitalService;
