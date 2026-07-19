// ─── routes/authRoutes.js ─────────────────────────────────────────
const express = require('express');
const r = express.Router();
const {
  register,
  login,
  getMe,
  updatePassword,
  verifyEmail,
  resendVerification,
  clearLockout,
  clearAllLockouts,
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');
r.post('/register', register);
r.post('/login', login);
r.get('/me', protect, getMe);
r.put('/updatepassword', protect, updatePassword);
// Public: list approved institutions for registration
r.get('/institutions', async (req, res) => {
  try {
    const { User } = require('../models');
    const { sequelize } = require('../config/db');
    const institutions = await sequelize.query(
      'SELECT id, "institutionName" FROM institutions WHERE "isVerified" = true ORDER BY "institutionName" ASC',
      { type: sequelize.QueryTypes.SELECT }
    );
    res.json({ success: true, data: institutions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

r.get('/verify-email', verifyEmail);
r.post('/resend-verification', resendVerification);
r.post('/clear-lockout', protect, authorize('admin'), clearLockout);
r.post('/clear-all-lockouts', protect, authorize('admin'), clearAllLockouts);
module.exports = r;