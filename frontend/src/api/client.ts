// src/api/client.ts
import axios from 'axios';

const env = (import.meta as any).env;
const renderApiUrl = 'https://hirenix-backend.onrender.com/api';
const envApiUrl = env.VITE_API_URL;
const apiBaseUrl =
  env.PROD && envApiUrl?.includes('localhost')
    ? renderApiUrl
    : envApiUrl || (env.PROD ? renderApiUrl : 'http://localhost:5000/api');

const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

// Attach JWT token from localStorage on every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('hirenix_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401 — clear auth and redirect to login
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('hirenix_token');
      localStorage.removeItem('hirenix_user');
      window.location.href = '/auth';
    }
    return Promise.reject(err);
  }
);

export default apiClient;