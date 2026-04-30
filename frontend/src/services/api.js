import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // Crucial for sending/receiving HttpOnly cookies
});

// Note: We are NO LONGER using localStorage for tokens as per security best practices.
// Cookies are handled automatically by the browser and the backend.

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle global errors here (e.g., redirect to login on 401)
    if (error.response?.status === 401) {
      // Potentially trigger a refresh token flow or logout
    }
    return Promise.reject(error);
  }
);

export default api;
