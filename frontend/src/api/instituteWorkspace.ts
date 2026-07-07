// src/api/instituteWorkspace.ts
import client from './client';

function crud(resource: string) {
  return {
    list: async () => (await client.get(`/institute/${resource}`)).data,
    create: async (data: any) => (await client.post(`/institute/${resource}`, data)).data,
    update: async (id: number, data: any) => (await client.put(`/institute/${resource}/${id}`, data)).data,
    remove: async (id: number) => (await client.delete(`/institute/${resource}/${id}`)).data,
  };
}

export const instituteApi = {
  getDashboard: async () => (await client.get('/institute/dashboard')).data,
  courses: crud('courses'),
  batches: crud('batches'),
  students: crud('students'),
  assessments: crud('assessments'),
  assignments: crud('assignments'),
  certificates: crud('certificates'),
};
