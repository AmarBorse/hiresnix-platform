const express = require('express');
const r = express.Router();
const {
  getDashboardStats, getAllUsers, approveCompany,
  approveJob, toggleUserStatus, getPendingJobs,
  getAllCompanies, getAllStudents,
  getAllApplications
} = require('../controllers/adminController');
const { verifyCertificate, generateOfferLetter } = require('../controllers/internshipPlatformController');
const { protect, authorize } = require('../middleware/auth');
const { Resource } = require('../models');
const asyncHandler = require('express-async-handler');

// ── Public Resource Hub Route (Must be before admin middleware) ──
r.get('/hub-resources', asyncHandler(async (req, res) => {
  const resources = await Resource.findAll({ order: [['createdAt', 'DESC']] });
  res.json({ success: true, data: resources });
}));

// ── Public Certificate Verification Route ──
r.get('/verify-certificate/:certId', verifyCertificate);

r.use(protect, authorize('admin'));

r.get('/dashboard',             getDashboardStats);
r.get('/users',                 getAllUsers);
r.get('/companies',             getAllCompanies);   // ← NEW
r.get('/students',              getAllStudents);    // ← NEW
r.get('/applications',          getAllApplications);
r.put('/users/:id/toggle',      toggleUserStatus);
r.put('/companies/:id/approve', approveCompany);
r.put('/companies/:id/verify',  approveCompany);
r.get('/jobs/pending',          getPendingJobs);
r.put('/jobs/:id/approve',      approveJob);
r.post('/generate-offer',       generateOfferLetter);

const {
  cgpaVsPlacement, skillDemandAnalysis, salaryDistribution,
  departmentStats, placementTrends, companyStats
} = require('../controllers/analyticsController');

r.get('/analytics',                     getDashboardStats);
r.get('/analytics/cgpa-placement',      cgpaVsPlacement);
r.get('/analytics/skill-demand',        skillDemandAnalysis);
r.get('/analytics/salary-distribution', salaryDistribution);
r.get('/analytics/department-stats',    departmentStats);
r.get('/analytics/placement-trends',    placementTrends);
r.get('/analytics/company-stats',       companyStats);

module.exports = r;