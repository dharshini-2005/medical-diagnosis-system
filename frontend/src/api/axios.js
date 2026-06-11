import axios from 'axios';

const api = axios.create({
  // In production REACT_APP_API_URL = https://your-backend.onrender.com/api
  // In development it falls back to the proxy defined in package.json
  baseURL: process.env.REACT_APP_API_URL || '/api'
});

// Attach JWT from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global error handler — redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
