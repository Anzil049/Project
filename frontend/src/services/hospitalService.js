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

  updateDoctor: async (id, doctorData) => {
    const response = await api.put(`/hospital/doctors/${id}`, doctorData);
    return response.data;
  },

  /**
   * Get all public hospitals
   */
  getHospitals: async (params) => {
    const response = await api.get('/hospital/public', { params });
    return response.data;
  },

  /**
   * Get nearby hospitals
   */
  getNearbyHospitals: async (longitude, latitude, radius = 50, facility = 'All') => {
    const response = await api.get('/hospital/public/nearby', {
      params: { longitude, latitude, radius, facility }
    });
    return response.data;
  },

  /**
   * Upload image to Cloudinary via backend
   */
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post('/auth/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.url;
  },
};

export default hospitalService;
