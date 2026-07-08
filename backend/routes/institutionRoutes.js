/**
 * routes/institutionRoutes.js
 */
const express      = require('express');
const asyncHandler = require('express-async-handler');
const { protect, authorize } = require('../middleware/auth');
const { Institution } = require('../models');
const ctrl = require('../controllers/institutionController');

const r = express.Router();

const attachInstitution = asyncHandler(async (req, res, next) => {
  const inst = await Institution.findOne({ where: { userId: req.user.id } });
  if (!inst) { res.status(404); throw new Error('Institution profile not found'); }
  if (!req.user.isApproved) { res.status(403); throw new Error('Institution account pending admin approval'); }
  req.institutionId = inst.id;
  next();
});

const withAuth = [protect, authorize('institution'), attachInstitution];

r.get('/dashboard', ...withAuth, ctrl.getDashboardStats);

r.get('/profile',  protect, authorize('institution'), ctrl.getProfile);
r.put('/profile',  protect, authorize('institution'), ctrl.updateProfile);

r.get('/students',                    ...withAuth, ctrl.getStudents);
r.post('/students',                   ...withAuth, ctrl.createStudent);
r.post('/students/bulk-import',       ...withAuth, ctrl.bulkImportStudents);
r.get('/students/credentials',        ...withAuth, ctrl.getStudentCredentials);  // NEW
r.get('/students/:id',                ...withAuth, ctrl.getStudent);
r.put('/students/:id',                ...withAuth, ctrl.updateStudent);
r.delete('/students/:id',             ...withAuth, ctrl.deleteStudent);

r.get('/batches',                              ...withAuth, ctrl.getBatches);
r.post('/batches',                             ...withAuth, ctrl.createBatch);
r.put('/batches/:id',                          ...withAuth, ctrl.updateBatch);
r.delete('/batches/:id',                       ...withAuth, ctrl.deleteBatch);
r.get('/batches/:id/students',                 ...withAuth, ctrl.getBatchStudents);
r.post('/batches/:id/assign-students',         ...withAuth, ctrl.assignStudentsToBatch);
r.delete('/batches/:id/students/:studentId',   ...withAuth, ctrl.removeStudentFromBatch);

r.get('/courses',                      ...withAuth, ctrl.getCourses);
r.post('/courses',                     ...withAuth, ctrl.createCourse);
r.put('/courses/:id',                  ...withAuth, ctrl.updateCourse);
r.delete('/courses/:id',               ...withAuth, ctrl.deleteCourse);
r.post('/courses/:id/assign-students', ...withAuth, ctrl.assignStudentsToCourse);

r.get('/certificates',                      ...withAuth, ctrl.getCertificates);
r.post('/certificates',                     ...withAuth, ctrl.issueCertificate);
r.get('/certificates/verify/:certId',       ctrl.verifyCertificate);
r.get('/certificates/:certId/download-pdf', ctrl.downloadCertificatePDF);

module.exports = r;
