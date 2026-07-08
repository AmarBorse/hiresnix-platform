// routes/adminRoutes.js
const express = require('express');
const asyncHandler = require('express-async-handler');
const { protect, authorize } = require('../middleware/auth');
const {
  verifyCompany, getAdminAnalytics,
  getInstitutions, getInstitution, approveInstitution, rejectInstitution, deleteInstitution,
} = require('../controllers/adminController');
const r = express.Router();

const admin = [protect, authorize('admin')];

r.get('/analytics',                      ...admin, getAdminAnalytics);
r.put('/companies/:id/verify',           ...admin, verifyCompany);

// Institution management
r.get('/institutions',                   ...admin, getInstitutions);
r.get('/institutions/:id',               ...admin, getInstitution);
r.put('/institutions/:id/approve',       ...admin, approveInstitution);
r.put('/institutions/:id/reject',        ...admin, rejectInstitution);
r.delete('/institutions/:id',            ...admin, deleteInstitution);

module.exports = r;
