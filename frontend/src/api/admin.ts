// src/api/admin.ts
import client from './client';

export const adminApi = {
  getAnalytics: async () => {
    const res = await client.get('/admin/analytics');
    return res.data;
  },
  getAllStudents: async (params?: any) => {
    const res = await client.get('/students', { params });
    return res.data;
  },
  getAllCompanies: async (params?: any) => {
    const res = await client.get('/companies', { params });
    return res.data;
  },
  verifyCompany: async (id: number) => {
    const res = await client.put(`/admin/companies/${id}/verify`);
    return res.data;
  },
  approveJob: async (id: number) => {
    const res = await client.put(`/jobs/${id}`, { status: 'Approved' });
    return res.data;
  },
  rejectJob: async (id: number) => {
    const res = await client.put(`/jobs/${id}`, { status: 'Rejected' });
    return res.data;
  },
  deleteJob: async (id: number) => {
    const res = await client.delete(`/jobs/${id}`);
    return res.data;
  },
  getAllApplications: async (params?: any) => {
    const res = await client.get('/applications', { params });
    return res.data;
  },
  updateApplicationStatus: async (id: number, data: any) => {
    const res = await client.put(`/applications/${id}/status`, data);
    return res.data;
  },
  getAllCertificates: async () => {
    const res = await client.get('/certificates');
    return res.data;
  },
  // iplatform
  getIPlatformStats: async () => {
    const res = await client.get('/iplatform/stats');
    return res.data;
  },
  getIPlatformApplications: async (params?: any) => {
    const res = await client.get('/iplatform/applications', { params });
    return res.data;
  },
  approveIPlatformApplication: async (id: number, data: any) => {
    const res = await client.put(`/iplatform/applications/${id}`, data);
    return res.data;
  },
  getIPlatformEnrollments: async (params?: any) => {
    const res = await client.get('/iplatform/all-enrollments', { params });
    return res.data;
  },
  markEnrollmentComplete: async (id: number, data: any) => {
    const res = await client.put(`/iplatform/enrollments/${id}/complete`, data);
    return res.data;
  },
  deleteIPlatformEnrollment: async (id: number) => {
    const res = await client.delete(`/iplatform/enrollments/${id}`);
    return res.data;
  },
  getIPlatformDomains: async () => {
    const res = await client.get('/iplatform/domains');
    return res.data;
  },
  createIPlatformDomain: async (data: any) => {
    const res = await client.post('/iplatform/domains', data);
    return res.data;
  },
  deleteIPlatformDomain: async (id: number) => {
    const res = await client.delete(`/iplatform/domains/${id}`);
    return res.data;
  },
  getIPlatformResources: async (domainId?: number) => {
    const res = await client.get('/iplatform/resources', { params: domainId ? { domainId } : {} });
    return res.data;
  },
  addIPlatformResource: async (data: any) => {
    const res = await client.post('/iplatform/resources', data);
    return res.data;
  },
  deleteIPlatformResource: async (id: number) => {
    const res = await client.delete(`/iplatform/resources/${id}`);
    return res.data;
  },
  downloadJobApplications: async (jobId?: number) => {
    const url = jobId ? `/applications/job/${jobId}` : '/applications';
    const res = await client.get(url, { params: { limit: 999 } });
    return res.data;
  },
  downloadIPlatformStudents: async () => {
    const res = await client.get('/iplatform/all-enrollments');
    return res.data;
  },
};
