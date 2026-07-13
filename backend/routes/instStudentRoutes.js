/**
 * routes/instStudentRoutes.js
 * Institution Student Portal routes
 */
const express = require('express');
const r = express.Router();
const {
  login, getMe, getDashboard, getCertificates, changePassword, protectInstStudent,
  saveAcademyProgress, getAcademyProgress, downloadAcademyCertificate,
} = require('../controllers/instStudentController');

r.post('/login',             login);
r.get('/me',                 protectInstStudent, getMe);
r.get('/dashboard',          protectInstStudent, getDashboard);
r.get('/certificates',       protectInstStudent, getCertificates);
r.put('/change-password',    protectInstStudent, changePassword);
r.post('/academy/progress',  protectInstStudent, saveAcademyProgress);
r.get('/academy/progress',   protectInstStudent, getAcademyProgress);
r.get('/academy/certificate/:courseId', protectInstStudent, downloadAcademyCertificate);

module.exports = r;