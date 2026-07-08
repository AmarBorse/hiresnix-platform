/**
 * routes/instStudentRoutes.js
 * Institution Student Portal routes
 */
const express = require('express');
const r = express.Router();
const {
  login, getMe, getDashboard, getCertificates, changePassword, protectInstStudent,
} = require('../controllers/instStudentController');

r.post('/login',             login);
r.get('/me',                 protectInstStudent, getMe);
r.get('/dashboard',          protectInstStudent, getDashboard);
r.get('/certificates',       protectInstStudent, getCertificates);
r.put('/change-password',    protectInstStudent, changePassword);

module.exports = r;
