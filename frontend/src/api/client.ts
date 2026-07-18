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
  // Pick correct token based on current user's role
  const user = (() => { try { return JSON.parse(localStorage.getItem('hirenix_user') || '{}'); } catch { return {}; } })();
  const role = user?.role;
  const key = role === 'institution' ? 'hx_institution_token' : role === 'admin' ? 'hx_admin_token' : 'hx_student_token';
  // Fallback to old key for existing logged-in users
  const token = localStorage.getItem(key) || localStorage.getItem('hirenix_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401 — clear auth and redirect to login
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      ['hx_student_token','hx_institution_token','hx_admin_token','hirenix_token','hirenix_user']
        .forEach(k => localStorage.removeItem(k));
      window.location.href = '/auth';
    }
    return Promise.reject(err);
  }
);

export default apiClient;