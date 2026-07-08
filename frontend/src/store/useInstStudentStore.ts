// src/store/useInstStudentStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface InstStudent {
  id: number;
  careerId: string;
  name: string;
  email: string;
  institutionId: number;
  institutionName: string;
}

interface InstStudentState {
  student: InstStudent | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (student: InstStudent, token: string) => void;
  logout: () => void;
}

export const useInstStudentStore = create<InstStudentState>()(
  persist(
    (set) => ({
      student: null,
      token: null,
      isAuthenticated: false,
      setAuth: (student, token) => {
        localStorage.setItem('hx_inst_student_token', token);
        localStorage.setItem('hx_inst_student', JSON.stringify(student));
        set({ student, token, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem('hx_inst_student_token');
        localStorage.removeItem('hx_inst_student');
        set({ student: null, token: null, isAuthenticated: false });
      },
    }),
    { name: 'hx-inst-student' }
  )
);
