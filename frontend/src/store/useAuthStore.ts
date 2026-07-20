// src/store/useAuthStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthUser, Role } from '../types';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;

  setAuth: (user: AuthUser, token: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        // Save token with role-specific key AND legacy key
        localStorage.setItem('hirenix_token', token);
        localStorage.setItem('hirenix_user', JSON.stringify(user));
        // Role specific keys for client.ts
        if (user.role === 'student')     localStorage.setItem('hx_student_token', token);
        if (user.role === 'admin')       localStorage.setItem('hx_admin_token', token);
        if (user.role === 'institution') localStorage.setItem('hx_institution_token', token);
        if (user.role === 'company')     localStorage.setItem('hx_company_token', token);
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('hirenix_token');
        localStorage.removeItem('hirenix_user');
        localStorage.removeItem('hx_student_token');
        localStorage.removeItem('hx_admin_token');
        localStorage.removeItem('hx_institution_token');
        localStorage.removeItem('hx_company_token');
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    { name: 'hirenix-auth' }
  )
);