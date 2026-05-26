// src/api/internships.ts
import client from './client';
import { Internship } from '../types';

export const internshipsApi = {
  getInternships: async (params?: { domain?: string; search?: string; page?: number; limit?: number }) => {
    const res = await client.get('/internships', { params });
    return res.data;
  },

  getInternship: async (id: number) => {
    const res = await client.get(`/internships/${id}`);
    return res.data;
  },

  getMyEnrollments: async () => {
    const res = await client.get('/internships/my');
    return res.data;
  },

  enroll: async (internshipId: number) => {
    const res = await client.post(`/internships/${internshipId}/enroll`);
    return res.data;
  },

  submitTaskLog: async (enrollmentId: number, data: { title: string; description: string; githubUrl: string; taskId?: string }) => {
    const res = await client.post(`/internships/${enrollmentId}/task-log`, data);
    return res.data;
  },

  createInternship: async (data: Partial<Internship>) => {
    const res = await client.post('/internships', data);
    return res.data;
  },

  updateInternship: async (id: number, data: Partial<Internship>) => {
    const res = await client.put(`/internships/${id}`, data);
    return res.data;
  },

  deleteInternship: async (id: number) => {
    const res = await client.delete(`/internships/${id}`);
    return res.data;
  },
};
