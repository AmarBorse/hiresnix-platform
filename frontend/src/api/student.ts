// src/api/student.ts
import client from './client';

export const studentApi = {
  getProfile: async () => {
    const res = await client.get('/students/profile');
    return res.data;
  },
  updateProfile: async (data: any) => {
    const res = await client.put('/students/profile', data);
    return res.data;
  },
  uploadResume: async (file: File) => {
    const form = new FormData();
    form.append('resume', file);
    const res = await client.put('/students/resume', form);
    return res.data;
  },
  getRecommendations: async () => {
    const res = await client.get('/students/recommendations');
    return res.data;
  },
  getMyCertificates: async () => {
    const res = await client.get('/certificates/my');
    return res.data;
  },
  verifyCertificate: async (certId: string) => {
    const res = await client.get(`/certificates/verify/${certId}`);
    return res.data;
  },
};
