// src/api/instStudent.ts
import axios from 'axios';

const env = (import.meta as any).env;
const renderApiUrl = 'https://hirenix-backend.onrender.com/api';
const envApiUrl = env.VITE_API_URL;
const apiBaseUrl =
  env.PROD && envApiUrl?.includes('localhost') ? renderApiUrl
  : envApiUrl || (env.PROD ? renderApiUrl : 'http://localhost:5000/api');

const instClient = axios.create({ baseURL: apiBaseUrl, withCredentials: true });

instClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('hx_inst_student_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

instClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('hx_inst_student_token');
      localStorage.removeItem('hx_inst_student');
      window.location.href = '/inst-login';
    }
    return Promise.reject(err);
  }
);

export const instStudentApi = {
  login:          (careerId: string, password: string) =>
                    instClient.post('/inst-student/login', { careerId, password }).then(r => r.data),
  getMe:          () => instClient.get('/inst-student/me').then(r => r.data),
  getDashboard:   () => instClient.get('/inst-student/dashboard').then(r => r.data),
  getCertificates:() => instClient.get('/inst-student/certificates').then(r => r.data),
  changePassword: (currentPassword: string, newPassword: string) =>
                    instClient.post('/inst-student/change-password', { currentPassword, newPassword }).then(r => r.data),
  downloadCertPdf:(certId: string) => `${apiBaseUrl}/institution/certificates/${certId}/download-pdf`,
};

export default instClient;
