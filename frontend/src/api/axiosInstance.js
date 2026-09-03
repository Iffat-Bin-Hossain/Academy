// ✅ FILE: src/api/axiosInstance.js
// Reusable axios instance with automatic JWT Authorization header attachment
import axios from 'axios';

const instance = axios.create({
  baseURL: '/api', // Use relative path, proxied in dev and nginx in prod
});

// Add Authorization header with token if it exists in localStorage
instance.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Add cache-busting for GET requests to maintain data freshness
  if (config.method === 'get') {
    config.headers['Cache-Control'] = 'no-cache';
  }
  return config;
});

// Response interceptor to handle authentication errors globally
instance.interceptors.response.use(
  (response) => {
    // Trigger storage event for cross-tab communication on data modification
    if (response.config.method !== 'get') {
      window.dispatchEvent(new CustomEvent('dataUpdated', { 
        detail: { 
          method: response.config.method, 
          url: response.config.url 
        } 
      }));
    }
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized globally
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'token',
        oldValue: 'expired-token',
        newValue: null,
        url: window.location.href
      }));
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
