import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // Still send cookies when available
});

/**
 * Gets the Bearer token for the current tab's active role only.
 * Returns null if this tab has no active session.
 */
const getActiveToken = () => {
  const activeRole = sessionStorage.getItem('medcare_active_role');
  if (activeRole) {
    return localStorage.getItem(`medcare_token_${activeRole}`);
  }
  return null;
};

// Request interceptor: attach Bearer token from storage on every request
api.interceptors.request.use(
  (config) => {
    const token = getActiveToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear stale token for active role
      const activeRole = sessionStorage.getItem('medcare_active_role');
      if (activeRole) {
        localStorage.removeItem(`medcare_token_${activeRole}`);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
