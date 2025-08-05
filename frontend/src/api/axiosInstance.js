// ✅ FILE: src/api/axiosInstance.js
// This sets up a reusable axios instance with JWT token automatically attached to headers
import axios from 'axios';

const instance = axios.create({
  baseURL: '/api', // Use relative path, will be proxied in production
});

// Add Authorization header with token if it exists in localStorage
instance.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Add cache-busting for data freshness
  if (config.method === 'get') {
    config.headers['Cache-Control'] = 'no-cache';
  }
  return config;
});

// Add response interceptor to handle authentication errors globally
instance.interceptors.response.use(
  (response) => {
    // Trigger storage event for cross-tab communication
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
    // If we get a 401 (unauthorized) error, the token is likely expired or invalid
    if (error.response && error.response.status === 401) {
      console.error('Authentication failed - token may be expired');
      // Clear the invalid token
      localStorage.removeItem('token');
      // Trigger storage event for cross-tab logout
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'token',
        oldValue: 'some-token',
        newValue: null,
        url: window.location.href
      }));
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
