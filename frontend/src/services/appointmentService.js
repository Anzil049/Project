import api from './api';

const appointmentService = {
  getMyAppointments: async () => {
    const response = await api.get('/appointments/my');
    return response.data;
  },

  getDoctorAppointments: async () => {
    const response = await api.get('/appointments/doctor');
    return response.data;
  },

  getHospitalAppointments: async () => {
    const response = await api.get('/appointments/hospital');
    return response.data;
  },

  getAppointmentById: async (id) => {
    const response = await api.get(`/appointments/${id}`);
    return response.data;
  },

  bookAppointment: async (bookingData) => {
    const response = await api.post('/appointments', bookingData);
    return response.data;
  },

  createOfflineAppointment: async (bookingData) => {
    const response = await api.post('/appointments/offline', bookingData);
    return response.data;
  },

  cancelAppointment: async (id, reason = 'cancelled_by_user') => {
    const response = await api.patch(`/appointments/${id}/cancel`, { reason });
    return response.data;
  },

  getQueuePreview: async (id) => {
    const response = await api.get(`/appointments/${id}/queue`);
    return response.data;
  },

  notifyParticipant: async (id, target) => {
    const response = await api.patch(`/appointments/${id}/notify`, { target });
    return response.data;
  },

  markParticipantJoined: async (id, participant) => {
    const response = await api.patch(`/appointments/${id}/join`, { participant });
    return response.data;
  },

  submitFeedback: async (id, feedback) => {
    const response = await api.post(`/appointments/${id}/feedback`, feedback);
    return response.data;
  },

  blockDoctorDate: async (payload) => {
    const response = await api.post('/appointments/block-date', payload);
    return response.data;
  },
};

export default appointmentService;
