import api from './api';
import appointmentService from './appointmentService';

const doctorService = {
  /**
   * Get nearby doctors
   * @param {number} longitude 
   * @param {number} latitude 
   * @param {number} radius (in km)
   * @param {string} specialization 
   */
  getNearbyDoctors: async (longitude, latitude, radius = 10, specialization = 'All', search = '') => {
    const response = await api.get('/doctors/nearby', {
      params: { longitude, latitude, radius, specialization, search }
    });
    return response.data;
  },
  
  getDoctors: async (params = {}) => {
    const response = await api.get('/doctors', { params });
    return response.data;
  },

  getSpecializations: async () => {
    const response = await api.get('/doctors/specializations');
    return response.data;
  },

  getDoctorById: async (id) => {
    const response = await api.get(`/doctors/${id}`);
    return response.data;
  },

  getDoctorSlots: async (id, consultationType, includeReserved = false, isOfflineBooking = false) => {
    const response = await api.get(`/doctors/${id}/slots`, {
      params: { consultationType, includeReserved, isOfflineBooking }
    });
    return response.data;
  },

  getSchedules: async () => {
    const response = await api.get('/doctors/me/schedules');
    return response.data;
  },

  updateSchedules: async (scheduleData) => {
    const response = await api.put('/doctors/me/schedules', scheduleData);
    return response.data;
  },

  bookAppointment: appointmentService.bookAppointment,

  getAppointments: appointmentService.getDoctorAppointments,

  getAppointmentById: appointmentService.getAppointmentById,

  startAppointment: async (id) => {
    const response = await api.patch(`/appointments/${id}/start`);
    return response.data;
  },

  completeAppointment: async (id, data) => {
    const response = await api.patch(`/appointments/${id}/complete`, data);
    return response.data;
  },

  createOfflineAppointment: appointmentService.createOfflineAppointment,

  cancelAppointment: appointmentService.cancelAppointment,

  getQueuePreview: appointmentService.getQueuePreview,

  notifyParticipant: appointmentService.notifyParticipant,

  blockDoctorDate: appointmentService.blockDoctorDate,

  toggleCloseBooking: appointmentService.toggleCloseBooking,

  noShowAppointment: appointmentService.noShowAppointment,

  searchPatientByEmail: async (email) => {
    const response = await api.get('/appointments/patient-search', {
      params: { email }
    });
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
