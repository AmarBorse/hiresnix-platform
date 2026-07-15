// routes/adminRoutes.js
const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  verifyCompany, getAdminAnalytics,
  getInstitutions, getInstitution, approveInstitution, rejectInstitution, deleteInstitution,
  resetInstitutionPassword, resetInstStudentPassword, resetAllStudentPasswords,
} = require('../controllers/adminController');
const { getEnquiries, markEnquiryRead, deleteEnquiry } = require('../controllers/enquiryController');
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

// Enquiries
r.get('/enquiries',              ...admin, getEnquiries);
r.put('/enquiries/:id/read',     ...admin, markEnquiryRead);
r.delete('/enquiries/:id',       ...admin, deleteEnquiry);

module.exports = r;