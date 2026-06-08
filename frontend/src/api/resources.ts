// src/api/resources.ts
import client from './client';

export const resourcesApi = {
  getResources: async (params?: { domain?: string; type?: string; search?: string; page?: number; limit?: number }) => {
    const res = await client.get('/resources', { params });
    return res.data;
  },
  getResource: async (id: number) => { const res = await client.get(`/resources/${id}`); return res.data; },
  createResource: async (data: any) => { const res = await client.post('/resources', data); return res.data; },
  updateResource: async (id: number, data: any) => { const res = await client.put(`/resources/${id}`, data); return res.data; },
  deleteResource: async (id: number) => { const res = await client.delete(`/resources/${id}`); return res.data; },
};
