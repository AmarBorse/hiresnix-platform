/**
 * routes/institutionRoutes.js
 */
const express      = require('express');
const asyncHandler = require('express-async-handler');
const { protect, authorize } = require('../middleware/auth');
const { Institution } = require('../models');
const ctrl = require('../controllers/institutionController');

const r = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

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

r.get('/students',              ...withAuth, ctrl.getStudents);
r.post('/students',             ...withAuth, ctrl.createStudent);
r.post('/students/bulk-import', ...withAuth, ctrl.bulkImportStudents);
r.get('/students/:id',          ...withAuth, ctrl.getStudent);
r.put('/students/:id',          ...withAuth, ctrl.updateStudent);
r.delete('/students/:id',       ...withAuth, ctrl.deleteStudent);

r.get('/batches',                              ...withAuth, ctrl.getBatches);
r.post('/batches',                             ...withAuth, ctrl.createBatch);
r.put('/batches/:id',                          ...withAuth, ctrl.updateBatch);
r.delete('/batches/:id',                       ...withAuth, ctrl.deleteBatch);
r.get('/batches/:id/students',                 ...withAuth, ctrl.getBatchStudents);
r.post('/batches/:id/assign-students',         ...withAuth, ctrl.assignStudentsToBatch);
r.delete('/batches/:id/students/:studentId',   ...withAuth, ctrl.removeStudentFromBatch);
r.post('/batches/:id/bulk-import',             ...withAuth, ctrl.bulkImportToBatch);
r.get('/batches/:id/available-students',       ...withAuth, ctrl.getAvailableStudentsForBatch);

r.get('/courses',                      ...withAuth, ctrl.getCourses);
r.post('/courses',                     ...withAuth, ctrl.createCourse);
r.put('/courses/:id',                  ...withAuth, ctrl.updateCourse);
r.delete('/courses/:id',               ...withAuth, ctrl.deleteCourse);
r.get('/courses/:id/students', ...withAuth, ctrl.getCourseStudents);
r.post('/courses/:id/assign-students', ...withAuth, ctrl.assignStudentsToCourse);

r.get('/certificates',                      ...withAuth, ctrl.getCertificates);
r.post('/certificates',                     ...withAuth, ctrl.issueCertificate);
r.get('/certificates/verify/:certId',       ctrl.verifyCertificate);
r.get('/certificates/:certId/download-pdf', ctrl.downloadCertificatePDF);

// Credentials download — inline handler (no controller dependency)
r.get('/student-credentials', ...withAuth, asyncHandler(async (req, res) => {
  const { InstitutionStudent } = require('../models');
  const students = await InstitutionStudent.findAll({
    where: { institutionId: req.institutionId },
    attributes: ['careerId','name','email','mobile','department','rollNumber'],
    order: [['createdAt','ASC']],
  });
  const data = students.map(s => ({
    'Career ID':        s.careerId,
    'Name':             s.name,
    'Email':            s.email,
    'Mobile':           s.mobile || '',
    'Department':       s.department || '',
    'Roll Number':      s.rollNumber || '',
    'Default Password': `HX@${s.careerId ? s.careerId.split('-')[2] : '000000'}`,
    'Login URL':        `${process.env.CLIENT_URL || 'https://hiresnix.co.in'}/inst-login`,
  }));
  res.json({ success: true, data });
}));

module.exports = r;