import api from './api';

const doctorService = {
  /**
   * Get nearby doctors
   * @param {number} longitude 
   * @param {number} latitude 
   * @param {number} radius (in km)
   * @param {string} specialization 
   */
  getNearbyDoctors: async (longitude, latitude, radius = 10, specialization = 'All') => {
    const response = await api.get('/doctors/nearby', {
      params: { longitude, latitude, radius, specialization }
    });
    return response.data;
  },
  
  getDoctors: async (params = {}) => {
    const response = await api.get('/doctors', { params });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  }
};

export default doctorService;
