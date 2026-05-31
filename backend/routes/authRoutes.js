// ─── routes/authRoutes.js ─────────────────────────────────────────
const express = require('express');
const r = express.Router();
const {
  register,
  login,
  getMe,
  updatePassword,
  verifyStudentEmail,
  resendStudentVerification,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
r.post('/register', register);
r.post('/login', login);
r.post('/verify-student-email', verifyStudentEmail);
r.post('/resend-student-verification', resendStudentVerification);
r.get('/me', protect, getMe);
r.put('/updatepassword', protect, updatePassword);
module.exports = r;
