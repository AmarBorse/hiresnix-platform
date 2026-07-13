// src/api/institution.ts
import client from './client';

export const institutionApi = {
  // Profile
  getProfile:    () => client.get('/institution/profile').then(r => r.data),
  updateProfile: (data: any) => client.put('/institution/profile', data).then(r => r.data),

  // Dashboard
  getDashboard: () => client.get('/institution/dashboard').then(r => r.data),

  // Students
  getStudents:     (params?: any) => client.get('/institution/students', { params }).then(r => r.data),
  getStudent:      (id: number) => client.get(`/institution/students/${id}`).then(r => r.data),
  createStudent:   (data: any) => client.post('/institution/students', data).then(r => r.data),
  updateStudent:   (id: number, data: any) => client.put(`/institution/students/${id}`, data).then(r => r.data),
  deleteStudent:   (id: number) => client.delete(`/institution/students/${id}`).then(r => r.data),
  bulkImport:      (students: any[]) => client.post('/institution/students/bulk-import', { students }).then(r => r.data),

  // Batches
  getBatches:           () => client.get('/institution/batches').then(r => r.data),
  createBatch:          (data: any) => client.post('/institution/batches', data).then(r => r.data),
  updateBatch:          (id: number, data: any) => client.put(`/institution/batches/${id}`, data).then(r => r.data),
  deleteBatch:          (id: number) => client.delete(`/institution/batches/${id}`).then(r => r.data),
  getBatchStudents:             (id: number) => client.get(`/institution/batches/${id}/students`).then(r => r.data),
  getAvailableStudentsForBatch: (id: number) => client.get(`/institution/batches/${id}/available-students`).then(r => r.data),
  assignStudentsToBatch:(id: number, studentIds: number[], courseId?: number) => client.post(`/institution/batches/${id}/assign-students`, { studentIds, courseId }).then(r => r.data),
  removeFromBatch:      (batchId: number, studentId: number) => client.delete(`/institution/batches/${batchId}/students/${studentId}`).then(r => r.data),

  // Courses
  getCourses:           () => client.get('/institution/courses').then(r => r.data),
  createCourse:         (data: any) => client.post('/institution/courses', data).then(r => r.data),
  updateCourse:         (id: number, data: any) => client.put(`/institution/courses/${id}`, data).then(r => r.data),
  deleteCourse:         (id: number) => client.delete(`/institution/courses/${id}`).then(r => r.data),
  getCourseStudents:     (id: number) => client.get(`/institution/courses/${id}/students`).then(r => r.data),
  assignStudentsToCourse:(id: number, studentIds: number[]) => client.post(`/institution/courses/${id}/assign-students`, { studentIds }).then(r => r.data),

  // Certificates
  getCertificates:      (params?: any) => client.get('/institution/certificates', { params }).then(r => r.data),
  issueCertificate:     (data: any) => client.post('/institution/certificates', data).then(r => r.data),
  downloadCertPdf:      (certId: string) => `${client.defaults.baseURL}/institution/certificates/${certId}/download-pdf`,
  verifyCertificate:    (certId: string) => client.get(`/institution/certificates/verify/${certId}`).then(r => r.data),
  getStudentCredentials: () => client.get('/institution/student-credentials').then(r => r.data),
  getAcademyProgress:    () => client.get('/institution/academy/progress').then(r => r.data),
  bulkImportToBatch: (batchId: number, students: any[]) => client.post(`/institution/batches/${batchId}/bulk-import`, { students }).then(r => r.data),
  bulkImportStudents:    (students: any[]) => client.post('/institution/students/bulk-import', { students }).then(r => r.data),
  issueCertificatesByBatch: (data: { batchId: number; type: string; courseId?: number }) =>
    client.post('/institution/certificates/bulk-batch', data).then(r => r.data),
};

export const adminInstitutionApi = {
  getAll:   (params?: any) => client.get('/admin/institutions', { params }).then(r => r.data),
  getOne:   (id: number) => client.get(`/admin/institutions/${id}`).then(r => r.data),
  approve:  (id: number) => client.put(`/admin/institutions/${id}/approve`).then(r => r.data),
  reject:   (id: number, reason: string) => client.put(`/admin/institutions/${id}/reject`, { reason }).then(r => r.data),
  delete:   (id: number) => client.delete(`/admin/institutions/${id}`).then(r => r.data),
};