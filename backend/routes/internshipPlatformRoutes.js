/**
 * routes/internshipPlatformRoutes.js
 * Add to existing server.js:
 *   app.use('/api/iplatform', require('./routes/internshipPlatformRoutes'));
 */
const express = require('express');
const r = express.Router();
const ctrl = require('../controllers/internshipPlatformController');
const { protect, authorize } = require('../middleware/auth');

// ── DOMAINS ──────────────────────────────────────────────────────
r.get('/domains',                    protect, ctrl.getDomains);
r.post('/domains',                   protect, authorize('admin'), ctrl.createDomain);
r.delete('/domains/:id',             protect, authorize('admin'), ctrl.deleteDomain);

// ── APPLICATIONS ─────────────────────────────────────────────────
r.post('/apply',                     protect, authorize('student'), ctrl.applyInternship);
r.get('/applications',               protect, authorize('admin'),   ctrl.getAllApplications);
r.get('/my-application',             protect, authorize('student'), ctrl.getMyApplication);
r.put('/applications/:id',           protect, authorize('admin'),   ctrl.updateApplicationStatus);

// ── RESOURCES (domain-wise) ───────────────────────────────────────
r.get('/resources',                  protect, ctrl.getResources);
r.post('/resources',                 protect, authorize('admin'), ctrl.addResource);
r.delete('/resources/:id',           protect, authorize('admin'), ctrl.deleteResource);

// ── TRAINING PROGRESS ─────────────────────────────────────────────
r.get('/my-progress',                protect, authorize('student'), ctrl.getMyProgress);
r.post('/task-submit',               protect, authorize('student'), ctrl.submitTask);
r.put('/enrollments/:id/complete',   protect, authorize('admin'),   ctrl.markComplete);

// ── CERTIFICATES / LETTERS (PDF) ──────────────────────────────────
r.get('/verify/:certId',             ctrl.verifyCertificate);
r.get('/my-certificates',            protect, authorize('student'), ctrl.getMyCertificates);
r.get('/certificate/:enrollId/pdf',  protect, ctrl.downloadCertificate);
r.get('/completion/:enrollId/pdf',   protect, ctrl.downloadCompletionLetter);
r.get('/lor/:enrollId/pdf',          protect, ctrl.downloadLOR);
r.post('/generate-offer',            protect, authorize('admin'), ctrl.generateOfferLetter);

// ── ADMIN ─────────────────────────────────────────────────────────
r.get('/stats',                      protect, authorize('admin'), ctrl.getStats);
r.get('/enrolled-students',          protect, authorize('admin'), ctrl.getEnrolledStudents);
r.get('/all-enrollments',            protect, authorize('admin'), ctrl.getAllEnrollments);

// ── PASSWORD RESET ────────────────────────────────────────────────
r.post('/forgot-password',           ctrl.forgotPassword);
r.post('/reset-password',            ctrl.resetPassword);

module.exports = r;
