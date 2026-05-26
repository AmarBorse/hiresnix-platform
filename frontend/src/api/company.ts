// src/api/company.ts
import client from './client';

export const companyApi = {
  getProfile: async () => {
    const res = await client.get('/companies/profile');
    return res.data;
  },
  updateProfile: async (data: any) => {
    const res = await client.put('/companies/profile', data);
    return res.data;
  },
  getAllCompanies: async (params?: { verified?: boolean; page?: number }) => {
    const res = await client.get('/companies', { params });
    return res.data;
  },
};
