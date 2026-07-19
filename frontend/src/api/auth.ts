// src/api/auth.ts
import client from './client';
import { AuthUser } from '../types';

interface LoginPayload { email: string; password: string; }
interface RegisterPayload {
  name: string; email: string; password: string;
  role: 'student' | 'company' | 'institution';
  companyName?: string; industry?: string;
  institutionName?: string; type?: string;
}
interface AuthResponse { success: boolean; token: string; instStudentToken?: string; user: AuthUser & { careerId?: string }; }
interface RegisterResponse extends Partial<AuthResponse> { pendingApproval?: boolean; message?: string; emailVerificationSent?: boolean; }

export const authApi = {
  login: async (data: LoginPayload): Promise<AuthResponse> => {
    const res = await client.post('/auth/login', data);
    return res.data;
  },

  register: async (data: RegisterPayload): Promise<RegisterResponse> => {
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

  verifyStudentEmail: async (token: string): Promise<{ success: boolean; message: string; user?: AuthUser }> => {
    const res = await client.post('/auth/verify-student-email', { token });
    return res.data;
  },

  resendStudentVerification: async (email: string): Promise<{ success: boolean; message: string }> => {
    const res = await client.post('/auth/resend-student-verification', { email });
    return res.data;
  },
};