// src/api/studentAcademy.ts
// AI Academy API for main-portal students (uses the normal student token via apiClient)
import apiClient from './client';

export const studentAcademyApi = {
  getProgress: () =>
    apiClient.get('/student-academy/progress').then(r => r.data),

  saveProgress: (data: { courseId: string; completed: string[]; xp: number; claimedCert?: boolean }) =>
    apiClient.post('/student-academy/progress', data).then(r => r.data),

  downloadCertificate: (courseId: string): Promise<Blob> =>
    apiClient.get(`/student-academy/certificate/${courseId}`, { responseType: 'blob' }).then(r => r.data as Blob),
};
