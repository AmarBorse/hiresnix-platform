// src/api/auth.ts
import client from './client';
import { AuthUser } from '../types';

interface LoginPayload { email: string; password: string; }
interface RegisterPayload { name: string; email: string; password: string; role: 'student' | 'company'; companyName?: string; industry?: string; }
interface AuthResponse { success: boolean; token: string; user: AuthUser; }

export const authApi = {
  login: async (data: LoginPayload): Promise<AuthResponse> => {
    const res = await client.post('/auth/login', data);
    return res.data;
  },

  register: async (data: RegisterPayload): Promise<AuthResponse> => {
    const res = await client.post('/auth/register', data);
    return res.data;
  },

  getMe: async (): Promise<{ success: boolean; data: { user: AuthUser; profile: any } }> => {
    const res = await client.get('/auth/me');
    return res.data;
  },

  updatePassword: async (data: { currentPassword: string; newPassword: string }) => {
    const res = await client.put('/auth/updatepassword', data);
    return res.data;
  },
};
