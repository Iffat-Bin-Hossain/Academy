// ✅ FILE: src/api/axiosInstance.js
// This sets up a reusable axios instance with JWT token automatically attached to headers
import axios from 'axios';

const instance = axios.create({
  baseURL: '/api', // All requests will go through /api base path (e.g., /admin/pending)
});

// Add Authorization header with token if it exists in localStorage
instance.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle authentication errors globally
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    // If we get a 401 (unauthorized) error, the token is likely expired or invalid
    if (error.response && error.response.status === 401) {
      console.error('Authentication failed - token may be expired');
      // Clear the invalid token
      localStorage.removeItem('token');
      // Only redirect if we're not already on the login page
      if (window.location.pathname !== '/login') {
        console.log('Redirecting to login due to authentication failure');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
