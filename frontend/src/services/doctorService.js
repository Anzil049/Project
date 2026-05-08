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
};

export default doctorService;
