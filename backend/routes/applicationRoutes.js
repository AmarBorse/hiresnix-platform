// ─── routes/applicationRoutes.js ─────────────────────────────────
const express = require('express');
const r1 = express.Router();
const { applyToJob, getMyApplications, getAllApplications, getJobApplicants, updateApplicationStatus, withdrawApplication } = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/auth');
r1.get('/',              protect, authorize('admin'),           getAllApplications);
r1.post('/:jobId',       protect, authorize('student'),         applyToJob);
r1.get('/my',            protect, authorize('student'),         getMyApplications);
r1.get('/job/:jobId',    protect, authorize('company','admin'), getJobApplicants);
r1.put('/:id/status',   protect, authorize('company','admin'), updateApplicationStatus);
r1.put('/:id/withdraw', protect, authorize('student'),         withdrawApplication);
module.exports = r1;
