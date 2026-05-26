// src/api/jobs.ts
import client from './client';
import { Job } from '../types';

export const jobsApi = {
  getJobs: async (params?: { type?: string; search?: string; page?: number; limit?: number }) => {
    const res = await client.get('/jobs', { params });
    return res.data;
  },

  getJob: async (id: number) => {
    const res = await client.get(`/jobs/${id}`);
    return res.data;
  },

  getMyPostings: async () => {
    const res = await client.get('/jobs/my-postings');
    return res.data;
  },

  createJob: async (data: Partial<Job>) => {
    const res = await client.post('/jobs', data);
    return res.data;
  },

  updateJob: async (id: number, data: Partial<Job>) => {
    const res = await client.put(`/jobs/${id}`, data);
    return res.data;
  },

  deleteJob: async (id: number) => {
    const res = await client.delete(`/jobs/${id}`);
    return res.data;
  },
};
