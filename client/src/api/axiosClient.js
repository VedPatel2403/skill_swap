import axios from 'axios';
import { handleMockRequest } from './mockService';

const apiBase = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api`
  : '/api';

const api = axios.create({
  baseURL: apiBase,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('skillswap_token') || sessionStorage.getItem('skillswap_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor to handle token expiry or fallback to client mock when backend is offline
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If backend is offline or on static hosting without a remote API
    const isOfflineOrNotFound = !error.response || error.response.status === 404 || error.code === 'ERR_NETWORK';
    if (isOfflineOrNotFound && error.config && !error.config._retryMock) {
      try {
        error.config._retryMock = true;
        const mockRes = await handleMockRequest(error.config);
        return mockRes;
      } catch (mockErr) {
        console.error('Mock fallback error:', mockErr);
      }
    }

    if (error.response && error.response.status === 401) {
      // Clear token if expired/invalid
      if (!window.location.hash.includes('/login') && !window.location.hash.includes('/register')) {
        sessionStorage.removeItem('skillswap_token');
        sessionStorage.removeItem('skillswap_user');
        localStorage.removeItem('skillswap_token');
        localStorage.removeItem('skillswap_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
