// routes/adminRoutes.js
const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  verifyCompany, getAdminAnalytics,
  getInstitutions, getInstitution, approveInstitution, rejectInstitution, deleteInstitution,
  resetInstitutionPassword, resetInstStudentPassword, resetAllStudentPasswords,
} = require('../controllers/adminController');
const { getAllEnquiries, markAsRead, deleteEnquiry } = require('../controllers/enquiryController');
const { getAllAcademyProgress } = require('../controllers/instStudentController');
const r = express.Router();

const admin = [protect, authorize('admin')];

r.get('/analytics',                              ...admin, getAdminAnalytics);
r.put('/companies/:id/verify',                   ...admin, verifyCompany);

// Institution management
r.get('/institutions',                           ...admin, getInstitutions);
r.get('/institutions/:id',                       ...admin, getInstitution);
r.put('/institutions/:id/approve',               ...admin, approveInstitution);
r.put('/institutions/:id/reject',                ...admin, rejectInstitution);
r.delete('/institutions/:id',                    ...admin, deleteInstitution);

// Password resets
r.put('/institutions/:id/reset-password',        ...admin, resetInstitutionPassword);
r.put('/institutions/:id/reset-student-password',...admin, resetInstStudentPassword);
r.put('/institutions/:id/reset-all-passwords',   ...admin, resetAllStudentPasswords);

// Institution student management (admin)
r.get('/institutions/:id/students', ...admin, async (req, res) => {
  const { sequelize } = require('../config/db');
  const { InstitutionStudent } = require('../models');
  const students = await InstitutionStudent.findAll({
    where: { institutionId: req.params.id },
    attributes: ['id', 'name', 'careerId', 'email', 'department'],
    order: [['name', 'ASC']],
  });
  res.json({ success: true, data: students });
});

// Enquiries
r.get('/enquiries',              ...admin, getAllEnquiries);
r.put('/enquiries/:id/read',     ...admin, markAsRead);
r.delete('/enquiries/:id',       ...admin, deleteEnquiry);

// AI Academy Progress
r.get('/academy-progress',       ...admin, getAllAcademyProgress);

module.exports = r;