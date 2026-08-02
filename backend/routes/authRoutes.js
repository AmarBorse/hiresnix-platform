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
const asyncHandler = require('express-async-handler');
const { Op } = require('sequelize');
const { User } = require('../models');
const { updateUserPassword } = require('../utils/passwords');

r.post('/register', register);
r.post('/login', login);
r.get('/me', protect, getMe);
r.put('/updatepassword', protect, updatePassword);

// ── Direct password reset (no auth — student enters email + new password) ──
r.post('/reset-password-direct', asyncHandler(async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    res.status(400); throw new Error('Email and new password are required');
  }
  if (newPassword.length < 6) {
    res.status(400); throw new Error('Password must be at least 6 characters');
  }

  const user = await User.findOne({
    where: { email: { [Op.iLike]: email.trim().toLowerCase() } }
  });

  if (!user) {
    res.status(404); throw new Error('No account found with this email address');
  }

  if (user.role !== 'student') {
    res.status(403); throw new Error('This reset page is for students only');
  }

  await updateUserPassword(user, newPassword);

  res.json({ success: true, message: 'Password updated successfully! You can now login.' });
}));

module.exports = r;