// src/api/institutions.ts
import client from './client';

export interface InstitutionRegistrationInput {
  adminName: string;
  email: string;
  instituteName: string;
  city: string;
  phone?: string;
  website?: string;
}

export const institutionsApi = {
  // Admin — list every registration request
  getRequests: async () => {
    const res = await client.get('/institutions');
    return res.data;
  },
  // Public — submit a new registration request
  register: async (data: InstitutionRegistrationInput) => {
    const res = await client.post('/institutions/register', data);
    return res.data;
  },
  // Admin — approve or reject a request
  updateStatus: async (id: string | number, status: 'approved' | 'rejected', reviewNote?: string) => {
    const res = await client.put(`/institutions/${id}/status`, { status, reviewNote });
    return res.data;
  },
};
