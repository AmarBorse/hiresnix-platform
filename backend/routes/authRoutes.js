// ─── routes/authRoutes.js ─────────────────────────────────────────
const express = require('express');
const r = express.Router();
const {
  register,
  login,
  getMe,
  updatePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
r.post('/register', register);
r.post('/login', login);
r.get('/me', protect, getMe);
r.put('/updatepassword', protect, updatePassword);
module.exports = r;
