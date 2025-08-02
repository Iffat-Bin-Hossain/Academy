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

export default instance;
