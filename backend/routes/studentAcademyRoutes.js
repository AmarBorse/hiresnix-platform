/**
 * routes/studentAcademyRoutes.js — AI Academy for main-portal students
 * Mounted at /api/student-academy
 */
const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/studentAcademyController');

const r = express.Router();
r.use(protect, authorize('student'));

r.get('/progress',              ctrl.getProgress);
r.post('/progress',             ctrl.saveProgress);
r.get('/certificate/:courseId', ctrl.downloadCertificate);

module.exports = r;
