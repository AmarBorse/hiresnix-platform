// src/api/auth.ts
import client from './client';
import { AuthUser } from '../types';

interface LoginPayload { email: string; password: string; }
interface RegisterPayload { name: string; email: string; password: string; role: 'student' | 'company'; companyName?: string; industry?: string; }
interface AuthResponse { success: boolean; token?: string; user?: AuthUser; requiresVerification?: boolean; message?: string; }

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

  forgotPassword: async (email: string) => {
    const res = await client.post('/iplatform/forgot-password', { email });
    return res.data;
  },

  resetPassword: async (data: { token: string; newPassword: string }) => {
    const res = await client.post('/iplatform/reset-password', data);
    return res.data;
  },

  verifyStudentEmail: async (token: string) => {
    const res = await client.post('/auth/verify-student-email', { token });
    return res.data;
  },

  resendStudentVerification: async (email: string) => {
    const res = await client.post('/auth/resend-student-verification', { email });
    return res.data;
  },
};
