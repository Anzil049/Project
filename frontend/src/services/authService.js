import api from './api';

const authService = {
  /**
   * Login a user. Role is automatically detected by the backend.
   */
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  /**
   * Register a user based on their role.
   */
  signup: async (role, userData) => {
    const response = await api.post(`/auth/${role}/register`, userData);
    return response.data;
  },

  /**
   * Logout a user.
   */
  logout: async (role) => {
    const response = await api.post(`/auth/${role}/logout`);
    return response.data;
  },

  /**
   * Verify OTP for email verification.
   */
  verifyOtp: async (email, otp, type = 'registration') => {
    const response = await api.post('/auth/verify-otp', { email, otp, type });
    return response.data;
  },

  /**
   * Resend OTP.
   */
  resendOtp: async (email, type = 'registration') => {
    const response = await api.post('/auth/resend-otp', { email, type });
    return response.data;
  },

  /**
   * Request password reset OTP.
   */
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Reset password with OTP.
   */
  resetPassword: async (email, otp, password) => {
    const response = await api.post('/auth/reset-password', { email, otp, password });
    return response.data;
  },

  /**
   * Change password on first login
   */
  changeFirstPassword: async (email, currentPassword, newPassword) => {
    const response = await api.post('/auth/change-password', { email, currentPassword, newPassword });
    return response.data;
  },

  /**
   * Get user profile. If role is 'me', it calls the global session check.
   */
  getCurrentUser: async (role) => {
    const endpoint = role === 'me' ? '/auth/me' : `/auth/${role}/profile`;
    const response = await api.get(endpoint);
    return response.data;
  },

  /**
   * Refresh access token.
   */
  refresh: async (role) => {
    const response = await api.post(`/auth/${role}/refresh`);
    return response.data;
  },

  /**
   * Get featured doctors and hospitals for landing page
   */
  getFeaturedData: async () => {
    const response = await api.get('/auth/featured');
    return response.data;
  },

  /**
   * Update current user profile
   */
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },

  /**
   * Upload image to cloud storage
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

  /**
   * Resolve a Google Maps location link to extract coordinates
   */
  resolveMapLink: async (url) => {
    const response = await api.post('/auth/resolve-map-link', { url });
    return response.data;
  }
};

export default authService;
