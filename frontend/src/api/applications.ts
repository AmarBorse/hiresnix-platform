// src/api/applications.ts
import client from './client';

export const applicationsApi = {
  apply: async (jobId: number, data: { coverLetter?: string }) => {
    const res = await client.post(`/applications/${jobId}`, data);
    return res.data;
  },

  getMyApplications: async () => {
    const res = await client.get('/applications/my');
    return res.data;
  },

  getJobApplicants: async (jobId: number, status?: string) => {
    const res = await client.get(`/applications/job/${jobId}`, { params: { status } });
    return res.data;
  },

  updateStatus: async (id: number, data: { status: string; note?: string; interviewDetails?: any }) => {
    const res = await client.put(`/applications/${id}/status`, data);
    return res.data;
  },

  withdraw: async (id: number) => {
    const res = await client.put(`/applications/${id}/withdraw`);
    return res.data;
  },
};
