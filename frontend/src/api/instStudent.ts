// src/api/instStudent.ts
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

// Separate axios instance for internship APIs — uses hiresnixToken + inst headers
export const instInternshipClient = axios.create({ baseURL: apiBaseUrl, withCredentials: true });

instInternshipClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('hirenix_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // Send inst student context so backend can tag applications
  const instStudentId = localStorage.getItem('hx_inst_student_id');
  const institutionId = localStorage.getItem('hx_institution_id');
  const institutionName = localStorage.getItem('hx_institution_name');
  if (instStudentId) {
    config.headers['x-inst-student-id'] = instStudentId;
    config.headers['x-institution-id'] = institutionId || '';
    config.headers['x-institution-name'] = institutionName || '';
  }
  return config;
});

// Internship API methods for inst students
export const instStudentInternshipApi = {
  getDomains:        () => instInternshipClient.get('/iplatform/domains').then(r => r.data),
  getMyApplication:  () => instInternshipClient.get('/iplatform/my-application').then(r => r.data),
  apply:             (data: any) => instInternshipClient.post('/iplatform/apply', data).then(r => r.data),
  getProgress:       () => instInternshipClient.get('/iplatform/my-progress').then(r => r.data),
  getMyCertificates: () => instInternshipClient.get('/iplatform/my-certificates').then(r => r.data),
  getResources:      () => instInternshipClient.get('/iplatform/resources').then(r => r.data),
  submitTask:        (data: any) => instInternshipClient.post('/iplatform/submit-task', data).then(r => r.data),
  downloadCertificate: (enrollId: string) => `${apiBaseUrl}/iplatform/certificate/${enrollId}`,
};

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
  login: async (careerId: string, password: string) => {
    const data = await instClient.post('/inst-student/login', { careerId, password }).then(r => r.data);
    // Save hiresnixToken for internship platform access
    if (data.hiresnixToken) {
      localStorage.setItem('hirenix_token', data.hiresnixToken);
      localStorage.setItem('hx_hiresnix_user_id', data.hiresnixUserId || '');
      localStorage.setItem('hx_is_inst_student', 'true');
      localStorage.setItem('hx_inst_student_id', data.student?.id || '');
      localStorage.setItem('hx_institution_id', data.student?.institutionId || '');
      localStorage.setItem('hx_institution_name', data.student?.institutionName || '');
    }
    return data;
  },
  getMe:           () => instClient.get('/inst-student/me').then(r => r.data),
  getDashboard:    () => instClient.get('/inst-student/dashboard').then(r => r.data),
  getCertificates: () => instClient.get('/inst-student/certificates').then(r => r.data),
  changePassword:  (currentPassword: string, newPassword: string) =>
                     instClient.put('/inst-student/change-password', { currentPassword, newPassword }).then(r => r.data),
  downloadCertPdf: (certId: string) => `${apiBaseUrl}/institution/certificates/${certId}/download-pdf`,
};

export default instClient;