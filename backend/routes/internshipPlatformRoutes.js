/**
 * routes/internshipPlatformRoutes.js
 * Add to existing server.js:
 *   app.use('/api/iplatform', require('./routes/internshipPlatformRoutes'));
 */
const express = require('express');
const asyncHandler = require('express-async-handler');
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
r.get('/verify-offer/:offerId',      ctrl.verifyOfferLetter);
r.get('/verify-recommendation/:recommendationId', ctrl.verifyRecommendationLetter);
r.get('/my-certificates',            protect, authorize('student'), ctrl.getMyCertificates);
r.get('/certificate/:enrollId/pdf',  protect, ctrl.downloadCertificate);
r.get('/completion/:enrollId/pdf',   protect, ctrl.downloadCompletionLetter);
r.get('/lor/:enrollId/pdf',          protect, ctrl.downloadLOR);
r.post('/generate-offer',            protect, authorize('admin'), ctrl.generateOfferLetter);

// ── ADMIN ─────────────────────────────────────────────────────────
r.get('/stats',                      protect, authorize('admin'), ctrl.getStats);
r.get('/enrolled-students',          protect, authorize('admin'), ctrl.getEnrolledStudents);
r.get('/all-enrollments',            protect, authorize('admin'), ctrl.getAllEnrollments);


// Institution Certificate verification — single route, type-aware
const verifyCert = (expectedType) => asyncHandler(async (req, res) => {
  const id = req.params.id || req.query.id;
  if (!id) { res.status(400); throw new Error('Certificate ID required'); }
  const { InstitutionCertificate, Institution } = require('../models');

  // Find by ID only first
  const cert = await InstitutionCertificate.findOne({
    where: { certificateId: id.toString().toUpperCase().trim() },
    include: [{ model: Institution, as: 'institution', attributes: ['institutionName','city','state'] }]
  });

  if (!cert) return res.json({ valid: false, message: 'Certificate not found' });

  // Check type matches
  if (expectedType && cert.type !== expectedType) {
    return res.json({
      valid: false,
      message: `This is a "${cert.type}" certificate, not a "${expectedType}" certificate. Please use the correct tab.`
    });
  }

  res.json({
    valid: true,
    studentName: cert.studentName,
    documentId: cert.certificateId,
    institutionName: cert.institutionName || cert.institution?.institutionName || 'Hiresnix',
    courseName: cert.courseName || cert.type || null,
    certType: cert.type,
    issueDate: cert.issuedAt,
    documentType: `Certificate of ${cert.type}`,
  });
});

r.get('/verify-skill-assessment/:id?',  verifyCert('Skill Assessment'));
r.get('/verify-course-completion/:id?', verifyCert('Course Completion'));

module.exports = r;