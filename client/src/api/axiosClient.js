import axios from 'axios';
import { handleMockRequest } from './mockService';

const apiBase = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api`
  : '/api';

const isStaticHost = typeof window !== 'undefined' && (
  window.location.hostname.includes('github.io') ||
  window.location.hostname.includes('surge.sh') ||
  window.location.protocol === 'file:'
);

const defaultAdapter = axios.getAdapter(axios.defaults.adapter);

const api = axios.create({
  baseURL: apiBase,
  headers: {
    'Content-Type': 'application/json'
  },
  adapter: async (config) => {
    // When running on GitHub Pages (static host) without a custom backend URL, bypass network entirely
    if (isStaticHost && !import.meta.env.VITE_API_URL) {
      try {
        const mockRes = await handleMockRequest(config);
        return {
          data: mockRes.data,
          status: mockRes.status || 200,
          statusText: 'OK',
          headers: {},
          config
        };
      } catch (err) {
        console.error('Local mock adapter error:', err);
      }
    }
    return defaultAdapter(config);
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
    // If backend is offline or returned 404, 405, or 500
    const status = error.response?.status;
    const isRecoverable = !error.response || status === 404 || status === 405 || status >= 500 || error.code === 'ERR_NETWORK';
    if (isRecoverable && error.config && !error.config._retryMock) {
      try {
        error.config._retryMock = true;
        const mockRes = await handleMockRequest(error.config);
        return {
          data: mockRes.data,
          status: mockRes.status || 200,
          statusText: 'OK',
          headers: {},
          config: error.config
        };
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
