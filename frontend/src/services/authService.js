import api from './api';

const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password }, { withCredentials: true });
    return response.data;
  },

  logout: async () => {
    const response = await api.get('/auth/logout');
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  signup: async (userData) => {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  },

  verifyOtp: async (email, otp, type = '2fa') => {
    const response = await api.post('/auth/verify-otp', { email, otp, type });
    return response.data;
  },

  resendOtp: async (email, type = '2fa') => {
    const response = await api.post('/auth/resend-otp', { email, type });
    return response.data;
  }
};

export default authService;
