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
  const { email, newPassword, resetCode } = req.body;

  // Secret code check
  const RESET_SECRET = process.env.RESET_SECRET || 'hiresnix2026';
  if (!resetCode || resetCode !== RESET_SECRET) {
    res.status(403); throw new Error('Invalid reset code. Contact Hiresnix support.');
  }

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

  // Block non-student roles
  if (user.role !== 'student') {
    res.status(403); throw new Error('This reset page is for students only. Contact admin for other accounts.');
  }

  // Extra safety — block known admin emails
  const blockedEmails = (process.env.ADMIN_EMAILS || 'amarpati9901@gmail.com,hr@hiresnix.co.in,admin@hiresnix.co.in').split(',').map(e => e.trim().toLowerCase());
  if (blockedEmails.includes(user.email.toLowerCase())) {
    res.status(403); throw new Error('This account cannot be reset from this page.');
  }

  await updateUserPassword(user, newPassword);

  res.json({ success: true, message: 'Password updated successfully! You can now login.' });
}));

module.exports = r;